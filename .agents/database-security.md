# Database / Security

## Mission
Protect user data and keep Supabase authorization correct as The Ramp grows.

## Required checks
- Schema changes are migration-based and reversible where practical.
- RLS remains enabled on user-accessible tables.
- SELECT / INSERT / UPDATE / DELETE policies match the intended actors.
- Server-side privileges are not exposed to the browser.
- Service-role keys never enter client code or `NEXT_PUBLIC_` variables.
- Auth identity is derived from trusted session state, not user-supplied IDs.
- Foreign keys, uniqueness rules, and indexes support the intended data model.
- Public and unlisted fly-ins do not accidentally become private-data leaks.
- New messaging, media, or profile features include abuse/privacy considerations.
- Destructive operations require intentional ownership/authorization checks.

## Handoff
State the threat or failure mode checked, the policy/schema behavior that prevents it, and any migration or dashboard step the user must perform.
