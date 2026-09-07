# The Ramp

The Ramp is a polished aviation social product for discovering and hosting fly-ins. The approved Phase 2 interface remains browser-demo-driven while the Phase 3.1 Supabase foundation is prepared underneath it.

## What’s included

- Discover page with persistent fly-ins and a toggleable illustrative map
- Persistent fly-in detail and attendance with an in-browser group chat demo
- Persistent fly-in creation and host editing
- Supabase-backed authenticated pilot profiles
- Server-side FAA airport search for profile and fly-in airport selection
- Responsive desktop/mobile navigation
- Clear demo-data disclosures and a MadeThis footer
- Supabase SSR client utilities, PostgreSQL migration foundation, RLS policies, and development airport seed data

## Supabase foundation (Phase 3.2)

The app now uses Supabase Auth and persistent records for pilot profiles, fly-ins, and attendance. Group chat intentionally remains a local browser demo until its later phase.

### Local configuration

Create a root `.env.local` file with these public values from your Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`.env.local` is ignored by Git and must never be committed. Never put a service-role key in a `NEXT_PUBLIC_` variable.

### Database workflow

The migration is located at `supabase/migrations/20260815150000_initial_the_ramp_schema.sql` and the development-only airport seed is `supabase/seed.sql`.

1. Create or link a local Supabase project using the Supabase CLI outside this application codebase.
2. Apply the migration through the CLI or paste it into the Supabase SQL Editor for the intended project.
3. Run `supabase/seed.sql` only in development to add the small North Texas airport sample.
4. Confirm RLS is enabled before connecting any product UI to the database.

The migration creates the profile bootstrap trigger on `auth.users`, core fly-in/attendance/chat tables, moderation foundation tables, indexes, timestamp triggers, and RLS policies. It does not create Storage buckets; that is intentionally deferred until image upload work begins.

For Phase 3.2+, normal Discover queries must read `public.discoverable_fly_ins`, which explicitly contains only scheduled public fly-ins. A direct detail route may query `public.fly_ins` by its UUID for a scheduled public or unlisted fly-in. In V1, unlisted means link-only—not private or access-token-protected.

### Nationwide FAA airport updates

The airport migration is `supabase/migrations/20260907170000_nationwide_faa_airports.sql`. Apply it before running an import. It extends the existing table in place, preserving the UUIDs referenced by profiles and fly-ins, and adds public active-facility search plus indexed FAA/ICAO/name/city/state lookup.

Airport data comes only from the FAA 28-Day NASR `APT_BASE.csv`. For each new 28-day cycle:

1. Download the official FAA `APT_CSV.zip` for that cycle from the [FAA NASR subscription page](https://www.faa.gov/air_traffic/flight_info/aeronav/Aero_Data/NASR_Subscription/) and extract `APT_BASE.csv`.
2. Create an untracked `.env.faa-import.local` file containing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep this server-only key out of `.env.local`, source control, command history, and all `NEXT_PUBLIC_` variables.
3. Validate the file without database writes:

```powershell
npm run airports:import -- --file "C:\path\to\APT_BASE.csv" --effective-date 2026-09-03 --dry-run
```

4. Run the idempotent import:

```powershell
npm run airports:import -- --file "C:\path\to\APT_BASE.csv" --effective-date 2026-09-03
```

The importer selects U.S.-coded FAA facilities, updates existing rows without changing their UUIDs, inserts new facilities, retains closed facilities, and marks FAA rows absent from the latest cycle inactive. It refuses to import a cycle older than data already in the database. Update `--effective-date` to the date printed in the new FAA file every cycle.

### Auth dashboard configuration

In **Supabase Dashboard → Authentication → URL Configuration**, set the development Site URL to `http://localhost:3000` and add these redirect URLs:

```text
http://localhost:3000/auth/confirm
http://127.0.0.1:3000/auth/confirm
```

Keep **Confirm email** enabled. Password-recovery emails use the same `/auth/confirm` callback and then redirect to `/update-password`. Before deployment, replace the Site URL with the production Vercel URL and add that domain’s `/auth/confirm` URL (including the appropriate preview URLs if preview auth is desired).

## Run it locally

1. Install [Node.js 20.9 or later](https://nodejs.org/).
2. In this project folder, run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000` in your browser.

## Checks

Run `npm run lint`, `npm run typecheck`, and `npm run build` before sharing or deploying.

## Design system

- Deep navy: `#0B1431`
- Sky blue: `#1E90FF`
- Safety orange: `#FF6A00`
- Display: Orbitron-style; body: Inter

The visual direction follows the approved MadeThis brand kit supplied for The Ramp.
