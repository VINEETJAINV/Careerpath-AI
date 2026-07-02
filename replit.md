# CareerPath AI — Project Notes

> For the full README, see [README.md](README.md).

## Quick Commands

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/career-counsel run dev` — frontend
- `pnpm run typecheck` — typecheck everything
- `pnpm --filter @workspace/api-spec run codegen` — regenerate from OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)

## Key Files

| File | Purpose |
|------|---------|
| `lib/api-spec/openapi.yaml` | API contract source of truth |
| `lib/db/src/schema/` | Drizzle ORM schema |
| `artifacts/api-server/src/routes/` | Express route handlers |
| `artifacts/career-counsel/src/pages/` | Frontend pages |

## Gotchas

- Always re-run codegen after changing `openapi.yaml`
- The `conversations` table variable is `conversations` (not `conversationsTable`)
- OpenAPI body schemas must use entity names (e.g. `ProfileInput`) not operation names to avoid TS2308 collisions

## User Preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
