# Deploying to Vercel + Supabase

You'll need your own Vercel and Supabase accounts (you have both already) —
these are the exact steps to take in each dashboard, plus a couple of
one-time commands to run from a terminal.

## 1. Supabase: create the database

1. In Supabase, create a new project (any region close to your users).
2. Once it's provisioned, go to **Project Settings → Database**.
3. Under **Connection string**, copy two URIs — you need both:
   - **Transaction pooler** (port `6543`) → this becomes `DATABASE_URL`.
     Append `?pgbouncer=true` to the end if it isn't already there.
   - **Direct connection** (port `5432`) → this becomes `DIRECT_URL`.
4. Replace `[YOUR-PASSWORD]` in both with your database password (set when
   the project was created, or reset it on that same page).

Why two URLs: serverless functions open a lot of short-lived connections.
The pooler URL keeps that under control at runtime; migrations need the
direct (unpooled) connection instead. This is already wired up in
`prisma/schema.prisma` (`url` + `directUrl`).

## 2. Vercel: create the project

1. **Add New → Project**, import this GitHub repo.
2. Vercel will try to build from the repo root — this app lives in a
   subdirectory, so under **Root Directory** click **Edit** and set it to:
   ```
   ashtavinayak-auto
   ```
3. Framework preset should auto-detect as **Next.js**. Leave the build
   command as the default (`next build`) — `prisma generate` already runs
   automatically via the `postinstall` script in `package.json`.
4. Under **Environment Variables**, add (Production, and Preview if you
   want preview deploys to work too):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Supabase pooler URL (step 1) |
   | `DIRECT_URL` | Supabase direct URL (step 1) |
   | `AUTH_SECRET` | a **new** secret — generate with `openssl rand -base64 32`, don't reuse the dev one |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://your-project.vercel.app` (update once you know it, or add your custom domain here) |
   | `NEXT_PUBLIC_BUSINESS_NAME` | `Ashtavinayak Auto Consultant` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | `918983800718` |
   | `NEXT_PUBLIC_PHONE_NUMBER` | `919765688468` |
   | `NEXT_PUBLIC_EMAIL` | your real business email |
   | `ADMIN_EMAIL` | the email you'll use to log into `/admin` |
   | `ADMIN_PASSWORD` | a real password (this seeds the first SUPER_ADMIN) |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | **see the warning below — required before real use** |

5. Click **Deploy**.

### ⚠️ Image storage — configure Cloudinary before accepting real uploads

The local-filesystem storage driver (used automatically when Cloudinary
isn't configured) writes to disk on the server. That's fine for local dev,
but **Vercel's serverless functions have no persistent, shared disk** — an
uploaded photo could vanish or 404 on the next request. Sign up for
Cloudinary's free tier, put its three keys into Vercel's env vars above,
and redeploy — the app already has this driver built in
(`src/lib/storage/cloudinary.ts`), it just needs the credentials. Do this
before you rely on "Sell Your Vehicle" photo uploads or admin image
uploads in production.

## 3. Run the first migration

Once the Supabase database exists and you have its connection strings, run
this from your own machine (with the repo cloned) — it only needs to happen
once, before or right after the first Vercel deploy:

```bash
cd ashtavinayak-auto
DATABASE_URL="<supabase pooler url>" DIRECT_URL="<supabase direct url>" \
  npx prisma migrate deploy
```

Optionally seed the demo catalog (categories/features + demo vehicles —
skip this if you'd rather start with an empty catalog):

```bash
DATABASE_URL="<supabase pooler url>" DIRECT_URL="<supabase direct url>" \
  ADMIN_EMAIL="<your admin email>" ADMIN_PASSWORD="<your admin password>" \
  npx tsx prisma/seed.ts
```

(`prisma migrate deploy` applies existing migrations only — it never
generates new ones or prompts interactively, so it's safe to run against a
production database. If you skip seeding, at minimum re-run the seed
command once with just `ADMIN_EMAIL`/`ADMIN_PASSWORD` set so an admin
account exists to log in with.)

## 4. Verify

- Visit your Vercel URL — homepage should load.
- Log into `/admin` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set.
- Add a test vehicle and confirm the photo upload works (this is what
  confirms Cloudinary is wired correctly).
- Update `NEXT_PUBLIC_SITE_URL` in Vercel's env vars to match the real
  deployed URL if you hadn't set it yet, then redeploy — it's used to build
  absolute links (sitemap, WhatsApp status-share messages).

## Custom domain

Add it under the Vercel project's **Settings → Domains**, then update
`NEXT_PUBLIC_SITE_URL` to match and redeploy.
