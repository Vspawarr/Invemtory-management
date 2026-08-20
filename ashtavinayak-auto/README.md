# Ashtavinayak Auto Consultant

A full-stack used-vehicle marketplace: customers buy and sell used cars, bikes,
scooters, buses and commercial vehicles; vehicle owners submit their vehicle
for review; an admin portal drives approval, pricing, inventory and lead
management. The platform is built around a **WhatsApp-first** customer
journey — WhatsApp Business is how sellers and buyers reach the business, the
website is the structured data-capture and marketplace layer, and the admin
portal is the operational control center.

> **Demo data notice** — the seed script creates ~26 demo vehicles and 5 demo
> submissions, all flagged `isDemo: true` and prefixed `[DEMO DATA]` in their
> descriptions. None of it represents real Ashtavinayak inventory.

## Features

**Public marketplace**
- Homepage with hero search, category browsing, featured vehicles, "why
  choose us", "how it works", and a dual Sell-Online / Chat-on-WhatsApp CTA
- `/vehicles` listing with URL-driven filters (type, brand, model, price,
  year, fuel, transmission, KM, city, condition), sorting and pagination
- `/vehicles/[slug]` detail page: image gallery, spec grid, features,
  verification badges (RC/insurance/PUC/service history/loan), enquiry and
  callback forms, WhatsApp deep links, mobile sticky CTA, JSON-LD
- `/sell-your-vehicle`: 6-step mobile-first form (no account required),
  camera/gallery photo upload, sessionStorage draft persistence, honeypot +
  rate limiting, generates a human-readable `AAC-YYYY-NNNNNN` reference
- **Secure seller status page** `/sell-your-vehicle/status/[reference]?token=…`
  — gated by a cryptographically random tracking token (SHA-256 hashed at
  rest), never by the reference number alone. Wrong/missing token → generic
  "Submission Not Found", never revealing which references exist.
- Buyer accounts (`/account`): profile, saved vehicles (favourites), my
  enquiries — never required to browse, enquire, or sell

**Admin portal** (`/admin`, role-gated: `SUPER_ADMIN` / `ADMIN` / `SALES`)
- Dashboard with real Prisma-aggregated stats and six Recharts views
  (inventory by category/source/status/brand, monthly enquiries, submission
  funnel) — an honest "Not enough data" state instead of fabricated numbers
- Inventory CRUD with image upload, feature/reserve/mark-sold/archive/
  duplicate row actions
- Vehicle Submissions: review, duplicate detection, admin valuation vs.
  public listing price vs. negotiated price, **Approve & List** / **Request
  More Information** / **Reject** workflow, WhatsApp-seller contact panel
- Enquiries and callback requests with a status pipeline, internal notes,
  and a WhatsApp-buyer contact panel
- Categories, features, customers, admin users (SUPER_ADMIN only), settings,
  notification center, and a SUPER_ADMIN-only audit log

**Cross-cutting**
- Every admin/account route and every mutating server action re-checks
  authentication and role server-side — `src/proxy.ts` only does cheap
  cookie-presence redirects and is never the security boundary
- Public queries always go through `PUBLIC_VEHICLE_SELECT`
  (`src/lib/public-vehicle.ts`), which structurally omits seller PII, owner
  expected price, admin valuation, negotiated price and registration number
- Upload validation: MIME + extension allowlist, magic-byte sniffing, size
  and count limits — SVGs and executables are rejected outright
- WhatsApp click-to-chat (`wa.me`) links throughout, built from
  `NEXT_PUBLIC_WHATSAPP_NUMBER` — never hard-coded

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
a vendored shadcn-style UI kit over Radix primitives · PostgreSQL + Prisma
(pinned to v6) · NextAuth v5 (Credentials + JWT) · bcryptjs · Zod ·
React Hook Form · Recharts · Lucide icons.

## Project structure

```
prisma/               schema.prisma, migrations, seed.ts
scripts/               gen-demo-images.ts (offline SVG placeholder generator)
storage/uploads/       local filesystem storage driver output (gitignored)
src/
  app/
    (public)/          homepage, /vehicles, /sell-your-vehicle, /about, /contact
    (auth)/             /login, /register
    account/            buyer profile, favourites, enquiries
    admin/               dashboard, vehicles, submissions, enquiries, callbacks,
                         customers, categories, features, users, settings,
                         notifications, audit-logs
    api/                 NextAuth route, local file-serving route
  actions/              server actions per domain (vehicles, submissions,
                         enquiries, favourites, notifications, users, ...)
  components/            ui/ (kit), public/, admin/, forms/
  lib/                  prisma client, auth guards, storage abstraction,
                         settings, whatsapp helpers, rate limiting, audit,
                         mailer, dashboard/vehicle query builders
  schemas/               zod validation schemas
```

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL 16 database

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ashtavinayak
AUTH_SECRET=          # openssl rand -base64 32
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX   # international format, digits only
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

`CLOUDINARY_*` and `EMAIL_SERVER_*` are optional — see **Image storage** and
**Email** below for what happens when they're left blank.

### 4. Database setup

```bash
npx prisma migrate dev   # applies migrations, generates the Prisma client
npm run seed              # bootstraps the admin user + demo catalog/data
```

`npm run seed` is idempotent: the admin user is upserted on every run, and
the demo vehicle/submission sets are only created once (re-running after
you've added real data will not duplicate the demo rows).

### 5. Run

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign in to `/admin` with the `ADMIN_EMAIL` /
`ADMIN_PASSWORD` you configured.

### 6. Production build

```bash
npm run lint
npm run build
npm run start
```

## Image storage

`src/lib/storage/index.ts` picks a driver at request time:

- **Cloudinary**, if `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
  `CLOUDINARY_API_SECRET` are all set (a minimal signed-upload REST client,
  no SDK dependency)
- **Local filesystem** otherwise — files are written to `storage/uploads/`
  (gitignored, created at runtime) and served through
  `GET /api/files/[...key]`, which whitelists extensions, sets
  `Content-Type` from the validated extension, and blocks path traversal.

Both drivers implement the same `StorageDriver` interface, so swapping to
S3-compatible storage later is a matter of adding a third driver.

## Email

`src/lib/mailer.ts` sends real email over SMTP when `EMAIL_SERVER_HOST` (and
friends) are set. When they're not — the default for local development — it
logs what would have been sent to the console instead. The application never
depends on email being configured; in-app `Notification` rows are the
primary admin-facing channel.

## WhatsApp

All WhatsApp buttons are plain `https://wa.me/<number>?text=<encoded>`
click-to-chat links (`src/lib/whatsapp.ts`) — no WhatsApp Business API
integration in this version. The business number always comes from
`NEXT_PUBLIC_WHATSAPP_NUMBER`; it is never hard-coded in source.

## Security notes

- Passwords are hashed with bcryptjs; sessions are stateless JWTs via
  NextAuth v5.
- Authorization is enforced in `src/lib/auth-guard.ts` and called from every
  admin/account layout, page, and server action — not just in `proxy.ts`.
- The public seller status page requires **both** the reference number and a
  32-byte cryptographically random token; only the token's SHA-256 hash is
  stored. Any mismatch (wrong reference, missing token, wrong token) returns
  an identical generic "Submission Not Found" response, and lookups are
  rate-limited.
- Rate limiting (`src/lib/rate-limit.ts`) is an in-memory sliding window —
  fine for a single instance; swap the store for Redis to scale out.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the exact Vercel + Supabase setup
steps, including the connection-pooling configuration required for a
serverless deployment and the Cloudinary image-storage caveat.

## Troubleshooting

- **`prisma migrate dev` fails to connect** — confirm `DATABASE_URL` and that
  PostgreSQL is running and reachable.
- **Uploaded images 404** — confirm `storage/uploads/` is writable; it's
  created automatically on first upload.
- **WhatsApp links go to a blank number** — set `NEXT_PUBLIC_WHATSAPP_NUMBER`
  in `.env` and restart the dev server (it's a `NEXT_PUBLIC_*` var, baked in
  at build/start time).
- **Seed says "already present — skipping"** — the demo vehicle/submission
  sets only seed once. Use `npx prisma migrate reset` (development database
  only — this is destructive) if you want a truly clean slate.
