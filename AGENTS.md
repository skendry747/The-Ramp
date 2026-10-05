<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# The Ramp agent team

This repository uses a coordinated specialist workflow. The coordinator owns the task, chooses the specialists that apply, reconciles their findings, and is responsible for the final change.

## Specialists

- **Lead Developer** — implementation, architecture, code quality, and integration. See `.agents/lead-developer.md`.
- **QA / Bug Hunter** — regression analysis, edge cases, mobile behavior, auth flows, and validation. See `.agents/qa.md`.
- **UI / Product** — pilot-facing UX, clarity, accessibility, responsive behavior, and product consistency. See `.agents/ui-product.md`.
- **Database / Security** — Supabase schema, migrations, RLS, authorization, secrets, and data integrity. See `.agents/database-security.md`.
- **Growth & Outreach** — audience development, promotion opportunities, partnerships, campaign ideas, and outreach drafts. See `.agents/growth-outreach.md`.

## Routing rules

1. Every code change gets a Lead Developer pass and a QA pass.
2. Any user-facing behavior or layout change also gets a UI / Product pass.
3. Any Supabase, auth, profile, fly-in visibility, attendance, chat, storage, API, or server-side data change also gets a Database / Security pass.
4. Acquisition, promotion, partnership, SEO, community outreach, launch, or campaign work routes to Growth & Outreach.
5. Specialists should review the same proposed solution, not invent unrelated parallel implementations.
6. The coordinator resolves conflicts and produces one integrated implementation.

## Safety and production rules

- Treat `main` as production-sensitive. Work on a branch unless the user explicitly asks for a direct production change.
- Never commit secrets, service-role keys, tokens, or local env files.
- Preserve and verify RLS for every table exposed through Supabase.
- Do not weaken auth or authorization to make a feature easier to implement.
- Do not change production data, destructive migrations, or deployment settings without explicit user authorization.
- Preserve existing public/unlisted fly-in behavior unless the requested feature intentionally changes it.
- Keep FAA airport imports idempotent and preserve referenced airport UUIDs.
- Public promotion and outreach must be approval-based unless the user has explicitly authorized a specific channel/action.

## Required validation

Before a change is considered ready to merge, run or otherwise verify:

```bash
npm run lint
npm run typecheck
npm run build
```

For changes that cannot be fully exercised locally, document the exact manual checks still required. Use `.github/PULL_REQUEST_TEMPLATE.md` as the integration checklist.
