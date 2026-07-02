# Contributing to CareerPath AI

Thank you for your interest! This guide covers everything you need to get started.

## Project Setup

### Prerequisites

- Node.js 24+
- pnpm (install via `npm install -g pnpm`)
- A Replit account (for the PostgreSQL database and AI integrations)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Push the database schema (development)
pnpm --filter @workspace/db run push

# 3. Generate API hooks and Zod schemas
pnpm --filter @workspace/api-spec run codegen

# 4. Typecheck everything
pnpm run typecheck
```

### Running in Development

```bash
# Terminal 1 — API server (auto-builds on start)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (Vite dev server)
pnpm --filter @workspace/career-counsel run dev
```

Open your browser to the URL shown by the frontend dev server.

## Branch Naming

Use the following prefixes:

| Prefix | Use for |
|--------|---------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring with no functional change |
| `chore/` | Tooling, dependencies, build changes |

Examples: `feature/skill-leaderboard`, `fix/roadmap-milestone-toggle`

## Commit Message Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(community): add leaderboard tab with skill rankings`
- `fix(api): handle missing profile in feed query`
- `docs(readme): update environment variable list`

## Coding Standards

### TypeScript

- **Strict mode is on** — no `any` without a comment explaining why
- Use `unknown` instead of `any` for catch variables
- Prefer `interface` for public API shapes, `type` for unions/utility types
- Explicit return types on exported functions

### API Changes

1. Update `lib/api-spec/openapi.yaml` first
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Implement the route handler in `artifacts/api-server/src/routes/`
4. Update the frontend using the generated hooks in `lib/api-client-react`
5. Typecheck: `pnpm run typecheck`

### Database Changes

1. Update the schema in `lib/db/src/schema/`
2. Run `pnpm --filter @workspace/db run push` (development only)
3. Never write custom migration scripts for production — Replit handles publish-time schema diffs

### Styling

- Use Tailwind CSS utility classes
- shadcn/ui components live in `artifacts/career-counsel/src/components/ui/`
- Custom components go in `artifacts/career-counsel/src/components/`
- Keep components under ~200 lines — split into sub-components if needed

### Logging (Server)

- Never use `console.log` in server code
- In route handlers: use `req.log` (via pino-http)
- In non-request code: import the `logger` singleton

## How to Submit Changes

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feature/your-feature`
3. **Make your changes** with clean, focused commits
4. **Typecheck**: `pnpm run typecheck` must pass
5. **Build**: `pnpm run build` must pass
6. **Open a Pull Request** with:
   - A clear description of what changed and why
   - Screenshots for UI changes
   - Any breaking changes noted

## File Ownership

| Path | Owned by |
|------|----------|
| `lib/api-spec/openapi.yaml` | Everyone — requires regeneration after change |
| `lib/db/src/schema/` | Backend + anyone adding a feature |
| `artifacts/api-server/src/routes/` | Backend work |
| `artifacts/career-counsel/src/pages/` | Frontend work |
| `artifacts/career-counsel/src/components/` | Frontend work |
| `replit.md` | Auto-generated project notes — edit when needed |

## Questions?

Open an issue or reach out in the project discussions. Happy building!
