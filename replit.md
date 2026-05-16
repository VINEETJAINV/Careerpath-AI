# CareerPath AI

An AI-powered career counselling platform that gives honest, brutally frank guidance — including both strengths and weaknesses — to help users find and pursue the right career.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/career-counsel run dev` — run the frontend (uses PORT env var)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — set via Replit AI Integrations

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + wouter + TanStack Query + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI via Replit AI Integrations (gpt-5.1, streaming SSE)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema files (profiles, assessments, conversations, messages)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/career-counsel/src/pages/` — Frontend pages
- `lib/integrations-openai-ai-server/` — OpenAI SDK wrapper (server-side)

## Architecture decisions

- Contract-first: OpenAPI spec drives codegen for both React Query hooks and Zod validators
- All AI calls go through the server (never direct from frontend) — keeps API keys safe
- Assessment answers are stored per question; AI analysis runs at submission time
- Career suggestions are persisted in DB after assessment so roadmap/suggestions pages load fast
- SSE streaming for AI chat — frontend uses manual fetch + ReadableStream (not generated hook)

## Product

- Users create a profile with their qualifications, skills, interests, and goals
- AI asks 10 assessment questions (multiple choice, scale 1-10, open text)
- AI analyses answers and gives honest feedback including strengths AND weaknesses
- Suggests 3-5 career paths with compatibility scores, honest pros/cons, salary ranges
- Generates a phased career roadmap for the top matched career
- AI chat coach for ongoing career guidance (streamed responses)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always re-run codegen after changing `lib/api-spec/openapi.yaml`
- The `conversations` table uses the variable name `conversations` (not `conversationsTable`) — from the OpenAI integration template
- Body schemas in OpenAPI must use entity-shaped names (e.g. `ProfileInput`) not operation-shaped names (e.g. `CreateProfileBody`) to avoid TS2308 collisions

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
