# Shivsankalp Yuva Pratishthan Cricket Tournament

A production-ready, mobile-first web application for the **Shivsankalp Yuva
Pratishthan Open Double Wicket Cricket Tournament** in Chapaner (Tekadi),
Maharashtra. Built with Next.js (App Router), TypeScript, Tailwind CSS, and
Supabase (PostgreSQL + Auth + Realtime).

The app has two portals:

- **Public Viewer Portal** (`/`, `/live/[matchId]`, `/rules`, `/players`,
  `/teams`, `/leaderboard`) — no login required, updates in real time.
- **Secure Admin Portal** (`/admin/*`) — Supabase Auth + Postgres Row Level
  Security, for registrations, payments, match setup, and ball-by-ball live
  scoring.

---

## 1. Project Structure

```
cricket-tournament/
├── supabase/
│   └── migrations/              # SQL migrations (schema, functions, views, RLS, seed, realtime)
│       ├── 0001_schema.sql
│       ├── 0002_functions.sql   # scoring engine RPCs, knockout-eligibility trigger, etc.
│       ├── 0003_views.sql       # public-safe views (hide mobile numbers, payment refs, ...)
│       ├── 0004_rls.sql         # Row Level Security policies
│       ├── 0005_seed.sql        # default tournament row + rule list
│       └── 0006_realtime.sql    # adds tables to the supabase_realtime publication
├── scripts/
│   └── create-admin.ts          # bootstrap an admin login (see §7)
├── src/
│   ├── app/
│   │   ├── page.tsx                       # public homepage / hero poster
│   │   ├── rules/page.tsx                 # public Rules page
│   │   ├── players/page.tsx               # public player directory
│   │   ├── teams/page.tsx                 # public team/pair directory
│   │   ├── leaderboard/page.tsx           # public leaderboard
│   │   ├── live/[matchId]/page.tsx        # public live scoreboard (share_code in the URL)
│   │   ├── admin/
│   │   │   ├── (auth)/login/              # admin login (outside the protected layout)
│   │   │   └── (protected)/               # everything behind Supabase Auth + RLS
│   │   │       ├── page.tsx               # dashboard
│   │   │       ├── players/  teams/  registrations/  payments/
│   │   │       ├── matches/  live-scoring/  results/
│   │   │       ├── leaderboard/  statistics/
│   │   │       ├── settings/ (Tournament Settings)  rules/  reports/
│   │   └── api/admin/export/[type]/route.ts  # CSV export endpoints
│   ├── components/
│   │   ├── public/   (PublicHeader, PublicFooter, LiveScoreboard, ShareButtons)
│   │   ├── admin/    (AdminShell, AdminNav, ScoringConsole, forms, editors)
│   │   └── ui/       (StatusBadge)
│   ├── lib/
│   │   ├── supabase/{client,server,admin}.ts   # browser / server / service-role clients
│   │   ├── actions/                            # 'use server' Server Actions per domain
│   │   ├── queries.ts, admin-queries.ts, ...    # read helpers
│   │   ├── cricket.ts                           # overs/run-rate/label formatting
│   │   └── csv.ts
│   ├── types/database.ts        # hand-written types mirroring the SQL schema
│   └── proxy.ts                 # Next.js 16 "Proxy" (formerly middleware): guards /admin/*
├── .env.local.example
└── package.json
```

---

## 2. Database Schema

See `supabase/migrations/0001_schema.sql` for the full DDL. Summary of tables:

| Table | Purpose |
|---|---|
| `tournaments` | Single-row configurable settings (fee, overs, wicket penalty, dates, status, ...) |
| `tournament_rules` | Ordered, editable rule list shown on `/rules` |
| `players` | `name, mobile, village, age, photo_url, is_active` |
| `teams` | `team_name, registration_status, payment_status, seed, is_active` |
| `team_players` | Join table enforcing **exactly 2 players per team** (trigger-enforced) |
| `registrations` | One per team, auto-numbered `REG-0001`, ... |
| `payments` | `amount, status (PENDING/PAID/REFUNDED/CANCELLED), method, reference, verified_by` |
| `matches` | `stage, team_a/b, date/time/venue, overs, status, share_code` (used in `/live/[matchId]`) |
| `innings` | Per-match innings: `total_runs, wickets, balls_bowled, striker/non_striker/bowler, target` |
| `scoring_events` | **Authoritative, append-only ball-by-ball log** (see §4) |
| `match_players` | Roster of who actually played a match; drives knockout-eligibility counting |
| `match_results` | Winner, scores, summary per completed match |
| `player_statistics` / `team_statistics` | Materialized, kept in sync by triggers/RPCs |
| `audit_logs` | Undo / correction / match-completion audit trail |
| `admin_users` | Mirrors `auth.users` for staff who may write data |

Indexes are added on all foreign keys used in hot paths (`match_id`,
`player_id`, `team_id`, `tournament_id`, `created_at`/timestamp columns).

### Public-safe views (`0003_views.sql`)

Because Postgres RLS is row-level (not column-level), sensitive columns
(`players.mobile`, payment transaction references, verifier identity) live in
tables that are **admin-only** under RLS. The public site instead reads from
views that project only safe columns and are granted directly to `anon`:

`v_players_public`, `v_teams_public`, `v_matches_public`,
`v_player_leaderboard`, `v_team_leaderboard`, `v_live_match_summary`.

### Row Level Security (`0004_rls.sql`)

- Every table has RLS enabled.
- `is_admin()` is a `SECURITY DEFINER` SQL function that checks whether
  `auth.uid()` has a row in `admin_users`.
- Public/anonymous users can only `SELECT` from tables that don't contain
  personal data (`tournaments`, `teams`, `matches`, `innings`,
  `scoring_events`, `match_results`, `player_statistics`,
  `team_statistics`, `tournament_rules`) plus the sanitized views above.
- `players`, `registrations`, `payments`, and `audit_logs` are **admin-only**,
  even for `SELECT`.
- All `INSERT`/`UPDATE`/`DELETE` policies require `is_admin()`.

---

## 3. Scoring Engine — how it works

**The tournament's headline rule:** every wicket, regardless of dismissal
type (bowled, caught, run out, LBW, stumped, hit wicket, other), deducts
exactly **2 runs** from the batting team's score. This is configurable
(`tournaments.wicket_penalty`, default `-2`) but never silently guessed.

### Why a Postgres function, not client-side math

The score is **never** computed by summing events in the browser. Instead:

1. The admin taps a button (0/1/2/3/4/6/WICKET/WIDE/NO BALL).
2. The client calls a Postgres RPC (`record_ball_run` or `record_ball_event`)
   with a **client-generated `client_event_id` (UUID)**.
3. The RPC, running with `SECURITY DEFINER` and its own `is_admin()` check:
   - Locks the innings row (`FOR UPDATE`) to serialize concurrent scoring.
   - Rejects the call if `client_event_id` already exists (**idempotent** —
     a retried request after a dropped connection cannot double-count a
     ball).
   - Inserts an immutable `scoring_events` row (over/ball number computed
     from `innings.balls_bowled`).
   - Updates `innings.total_runs`, `wickets`, `balls_bowled` in the same
     transaction.
   - For `RUN` events, adds the runs to the striker's `match_players.runs_scored`
     (**batting runs only** — a wicket's `-2` is a team-score adjustment and
     is never added to any batsman's tally, matching the requirement that the
     two must stay distinguishable).
4. The client re-fetches the innings row from the database (source of truth)
   to update the UI — it never trusts its own optimistic math.
5. Supabase Realtime (`postgres_changes` on `matches`, `innings`,
   `scoring_events`, `match_results`) pushes the same change to every
   `/live/[matchId]` viewer, who re-fetch the authoritative view row.

### Extras

`WIDE` and `NO_BALL` events add a configurable number of runs
(`tournaments.wide_run_value` / `no_ball_run_value`, default `1` each) without
advancing the ball count — matching common informal-tournament practice. This
is a **tournament setting**, not a hard-coded assumption; change it in
Admin → Tournament Settings if your local rules differ.

### Undo

`undo_last_ball(innings_id, admin_id)`:
- Finds the most recent non-undone, non-correction event for that innings.
- **Soft-deletes** it (`is_undone = true`) rather than hard-deleting — the
  full history is preserved for audit.
- Reverses its effect on `innings.total_runs / wickets / balls_bowled` and on
  the striker's batting runs.
- Writes an `audit_logs` row.

### Score correction

`apply_score_correction(original_event_id, new_runs, reason, admin_id)`:
- Requires a non-empty `reason` (enforced in the function).
- Leaves the original event untouched (audit trail) and inserts a
  `CORRECTION` event carrying the **delta**, which is applied to the
  innings total.
- Records old value, new value, reason, admin, and timestamp in `audit_logs`.
- Exposed in the admin Live Scoring console: tap any ball chip in "Last
  Balls" to open the correction dialog.

### Idempotency / duplicate-tap protection

- Every scoring tap generates a fresh `crypto.randomUUID()` as
  `client_event_id` **before** the request is sent.
- The RPC treats a repeated `client_event_id` as a no-op (returns the
  original row instead of inserting a duplicate) — safe against network
  retries.
- The UI also holds a synchronous ref-based lock and disables the whole
  button grid while a request is in flight, so a literal double-tap before
  the network round-trip completes cannot fire twice.
- If the browser is offline, scoring buttons are disabled with a visible
  "Offline — scoring paused" banner rather than silently failing.

### An explicitly flagged ambiguity: does a wicket remove the batsman?

The tournament brief describes the wicket penalty purely as *"a TEAM SCORE
adjustment"* and never states whether the dismissed batsman leaves the crease
(unlike standard cricket, a double-wicket team has only 2 players total, so
there's no reserve batsman to bring in). Rather than silently invent a rule
here, this app treats a wicket as **score-only**: the striker/non-striker
stay on strike until the admin explicitly changes them (via the "Swap" button
or the striker/partner selectors), and an innings ends by admin action ("End
Innings" once overs are complete) — never automatically on wicket count. If
your local convention differs, this is the one rule you may want to adapt in
`record_ball_event` / the Live Scoring UI.

---

## 4. Knockout Eligibility Logic

**Rule:** a player may play a maximum of `tournaments.max_knockout_matches_per_player`
(default **3**) knockout matches. League/pre-knockout matches never count.
Any combination of players/matches is allowed (no fixed pairing assumption).

### Where it's enforced

1. **Database trigger (authoritative):** `enforce_knockout_eligibility()`
   fires `BEFORE INSERT ON match_players`. It looks up the match's `stage`
   via `is_knockout_stage()` (`QUARTER_FINAL` / `SEMI_FINAL` / `FINAL` only —
   `LEAGUE` and `PRE_KNOCKOUT` are explicitly excluded per the brief). If the
   match is a knockout match and the player's
   `player_statistics.knockout_matches_played >= max_knockout_matches_per_player`,
   the insert is **rejected** with:

   > Player is not eligible for this knockout match. Maximum N knockout
   > matches already completed.

   This is a hard block at the data layer — it cannot be bypassed by the UI,
   a race condition, or a direct API call.

2. **Counter maintenance:** `player_statistics.knockout_matches_played` is
   recomputed by a trigger every time a `match_players` row is
   inserted/deleted, by counting `match_players` rows where `is_knockout =
   true` for that player. `is_knockout` is stamped onto each `match_players`
   row at insert time from the match's stage, so the count is historically
   accurate even if a match's stage is edited later.

3. **UI surfacing:** in Admin → Matches → a knockout match →
   "Add Both Teams' Players" calls `addMatchRoster()`, which tries to insert
   each of the 4 players individually, catches the trigger's exception
   per-player, and displays exactly which player(s) were blocked and why —
   without silently skipping them or attempting to force the insert.

4. **Public visibility:** the Leaderboard shows a "KO Left" /
   `knockout_matches_remaining` column so teams can see eligibility before
   showing up to a match.

### A flagged design tension (not silently resolved)

Because a double-wicket team is *always the same 2 fixed players* for the
whole tournament, a player who has already used all 3 knockout matches has no
"substitute" the rules describe — their team simply cannot field a complete
roster for a later knockout match. The brief's rule 11 ("organizers'
decision is final") suggests this is meant to be resolved by tournament
staff, not the software. The app enforces the hard 3-match cap exactly as
specified and reports the block clearly; it deliberately does **not** offer
an "override" button, since the brief says to *block* selection, not permit
it with confirmation.

---

## 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project's
values (Project Settings → API):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Server-side only. Never prefix with NEXT_PUBLIC_. Used only by
# scripts/create-admin.ts to bootstrap the first admin login.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Used to build shareable /live/[matchId] links (WhatsApp share, copy link)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For Vercel, set the same variables under Project Settings → Environment
Variables (use your production domain for `NEXT_PUBLIC_SITE_URL`).

---

## 6. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL Editor (or via the Supabase CLI, see below), run the
   migrations **in order**:
   ```
   0001_schema.sql
   0002_functions.sql
   0003_views.sql
   0004_rls.sql
   0005_seed.sql
   0006_realtime.sql
   ```
   Using the CLI instead:
   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```
3. Confirm Realtime is enabled for `matches`, `innings`, `scoring_events`,
   `match_results` (Database → Replication in the dashboard, or re-run
   `0006_realtime.sql` — it's idempotent-safe to re-check, not to re-run).
4. Copy the Project URL and `anon` / `service_role` keys into `.env.local`.

---

## 7. Admin Login Setup

Admins are Supabase Auth users that also have a row in `admin_users`. Use the
bootstrap script (uses the service-role key, so it works before any admin
session exists):

```bash
npm run create-admin -- --email admin@example.com --password "Str0ngPass!" --name "Tournament Admin"
```

This creates (or reuses) the Supabase Auth user and upserts the matching
`admin_users` row. Sign in at `/admin/login` with those credentials.

To add more admins later, either re-run the script or, once signed in, insert
directly into `admin_users` (RLS allows any existing admin to manage
`admin_users`).

### Test credentials (local development only)

No credentials are seeded automatically — you must run the bootstrap script
above locally against your own Supabase project. **Do not** commit real
credentials or reuse a "default" password in production; the script exists
specifically so no default admin account ships with the codebase.

---

## 8. Local Development

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm run create-admin -- --email you@example.com --password "..." --name "You"
npm run dev
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin/login` for the admin portal.

Other scripts:
```bash
npm run build   # production build (also type-checks)
npm run lint    # ESLint
npm run start   # run a production build locally
```

---

## 9. Deployment (Vercel + Supabase)

1. Push this repo to GitHub (or your Git provider of choice).
2. Import the project into [Vercel](https://vercel.com/new), with the
   project **root directory set to `cricket-tournament/`** if it lives
   inside a larger monorepo.
3. Add the environment variables from §5 in Vercel's project settings
   (`NEXT_PUBLIC_SITE_URL` should be your production URL, e.g.
   `https://your-tournament.vercel.app`).
4. Deploy. Vercel will run `next build` automatically.
5. Run the Supabase migrations against your **production** Supabase project
   (same as §6) and bootstrap an admin (`npm run create-admin`, run locally
   with production env vars, or via the Supabase SQL editor +
   `supabase.auth.admin.createUser` from a one-off script).
6. Once the tournament date is confirmed, set it in
   Admin → Tournament Settings — the public homepage updates immediately
   (it currently shows "DATE TO BE ANNOUNCED").

---

## 10. Manual Test Checklist

Maps to the 25 scenarios in the brief. Run through these against a real
Supabase project before declaring a deployment ready:

1. **Register team** — Admin → Teams → Add Team.
2. **Register two players** — Admin → Players → Add Player (×2), then assign
   both to the team via Admin → Teams → Manage.
3. **Record ₹200 payment** — Admin → Registrations → Register Team (creates
   a `PENDING` payment), then Admin → Payments → set status `PAID`.
4. **Create match** — Admin → Matches → Create Match.
5. **Start match** — Admin → Matches → [match] → Add Roster → Start Match
   (toss).
6. **Score 1 run** — Live Scoring → tap `1`; confirm score updates.
7. **Score 4** — tap `4`; confirm score updates.
8. **Record wicket** — tap `WICKET` → choose dismissal type → confirm score
   decreases by exactly 2.
9. **Verify score decreases by exactly 2** — check the sticky score header
   and the public `/live/[shareCode]` page match.
10. **Record another wicket** — repeat; verify cumulative -4 from wickets.
11. **Undo wicket** — tap "Undo Last Ball", confirm the dialog, verify score
    is restored to pre-wicket value.
12. **Verify score restoration** — cross-check the public live page updates
    too (via Realtime).
13. **Complete match** — Live Scoring → end innings(s) → Match page →
    Complete Match → select winner → confirm.
14. **Record winner** — same step; confirm `match_results` row appears in
    Admin → Results.
15. **Advance winner** — create the next-round match and select the winning
    team as Team A/B.
16. **Verify player knockout count** — Admin → Leaderboard / Statistics,
    check `knockout_matches_played` for players in a knockout match.
17. **Attempt 4th knockout match for same player** — try to add that
    player's team to a 4th knockout match roster.
18. **Confirm system blocks it** — "Add Both Teams' Players" should report
    the player as blocked with the exact eligibility message.
19. **Verify public viewer updates in realtime** — open `/live/[shareCode]`
    in a second browser/tab while scoring from admin; confirm it updates
    without a manual refresh.
20. **Verify unauthenticated user cannot access admin** — open `/admin` in a
    private/incognito window; confirm redirect to `/admin/login`.
21. **Verify CSV export** — Admin → Reports → download each report, confirm
    it opens correctly in a spreadsheet app.
22. **Test mobile layout** — use Chrome DevTools device emulation (or a real
    phone) at 360–414px width on the homepage, live page, and the Live
    Scoring console.
23. **Test two viewers watching same live match** — open `/live/[shareCode]`
    in two separate browsers; confirm both update in sync.
24. **Test accidental duplicate scoring request** — rapidly double-tap a run
    button; confirm only one ball is recorded (check the ball-by-ball
    "Last Balls" strip and the over/ball counter).

---

## 11. What's intentionally out of scope for V1

- **Payment gateway integration** — manual payment tracking only, per the
  brief ("Do not integrate a payment gateway initially").
- **Automatic knockout bracket advancement** — admin must manually create
  the next match and select the winning team; the brief explicitly says not
  to auto-advance.
- Any cricket rule not stated in the brief (bowler-over limits, no-ball free
  hits, etc.) — the scoring engine only implements what's specified, and
  flags ambiguous cases (see §3 and §4) rather than guessing.
