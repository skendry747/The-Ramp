# The Ramp

The Ramp is a polished aviation social product for discovering and hosting fly-ins. The approved Phase 2 interface remains browser-demo-driven while the Phase 3.1 Supabase foundation is prepared underneath it.

## What’s included

- Discover page with sample fly-ins and a toggleable illustrative map
- Fly-in detail panel with local join state and in-browser group chat demo
- Create Fly-In form that creates a temporary local card
- Supabase-backed authenticated pilot profile (with local demo fly-ins retained)
- Responsive desktop/mobile navigation
- Clear demo-data disclosures and a MadeThis footer
- Supabase SSR client utilities, PostgreSQL migration foundation, RLS policies, and development airport seed data

## Supabase foundation (Phase 3.2)

The app now uses Supabase Auth and a persistent `profiles` record for the signed-in pilot. Fly-ins, attendance, chat, and the create flow intentionally remain local browser demos until later phases.

### Local configuration

Create a root `.env.local` file with these public values from your Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`.env.local` is ignored by Git and must never be committed. Do not add a service-role key for this phase.

### Database workflow

The migration is located at `supabase/migrations/20260815150000_initial_the_ramp_schema.sql` and the development-only airport seed is `supabase/seed.sql`.

1. Create or link a local Supabase project using the Supabase CLI outside this application codebase.
2. Apply the migration through the CLI or paste it into the Supabase SQL Editor for the intended project.
3. Run `supabase/seed.sql` only in development to add the small North Texas airport sample.
4. Confirm RLS is enabled before connecting any product UI to the database.

The migration creates the profile bootstrap trigger on `auth.users`, core fly-in/attendance/chat tables, moderation foundation tables, indexes, timestamp triggers, and RLS policies. It does not create Storage buckets; that is intentionally deferred until image upload work begins.

For Phase 3.2+, normal Discover queries must read `public.discoverable_fly_ins`, which explicitly contains only scheduled public fly-ins. A direct detail route may query `public.fly_ins` by its UUID for a scheduled public or unlisted fly-in. In V1, unlisted means link-only—not private or access-token-protected.

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
