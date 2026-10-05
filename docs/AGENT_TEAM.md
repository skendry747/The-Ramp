# The Ramp agent team

The Ramp uses a small specialist team for development and growth work:

| Role | Primary job |
| --- | --- |
| Coordinator | Owns the request, routes work, resolves tradeoffs, and integrates the final result |
| Lead Developer | Implements the feature and protects architectural consistency |
| QA / Bug Hunter | Tests behavior, regressions, edge cases, and readiness |
| UI / Product | Reviews pilot-facing usability, responsive behavior, and product clarity |
| Database / Security | Reviews Supabase, auth, RLS, migrations, secrets, and data integrity |
| Growth & Outreach | Finds audiences, promotion channels, partnerships, and drafts outreach that drives qualified pilots to The Ramp |

## Typical feature flow

A normal feature follows this path:

`Request → scope → specialist reviews → implementation → QA → integrated review → PR → merge`

Not every task needs every specialist. A CSS-only adjustment normally needs Lead Developer + UI/Product + QA. A new messaging feature needs all four technical specialists. A promotion or acquisition task can route directly to Growth & Outreach, with product/development support only when the website itself should change.

## Growth workflow

Growth & Outreach should continuously favor targeted aviation communities over broad untargeted promotion. Its job is to identify high-fit opportunities, prepare the exact action or copy, and surface measurable follow-up. Public posts, paid placements, outreach emails, or account actions remain approval-based unless explicitly authorized.

## Merge policy

Agent work should normally happen on a branch. A pull request records the specialist passes and validation. Production-sensitive or destructive changes require explicit user approval.

This structure is deliberately lightweight: the roles exist to improve decisions and review quality, not to create process for its own sake.
