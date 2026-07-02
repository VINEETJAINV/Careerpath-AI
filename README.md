# CareerPath AI

An AI-powered career counselling platform that gives honest, brutally frank guidance — including both strengths and weaknesses — to help users find and pursue the right career.

## Overview

CareerPath AI is a full-stack web application that guides people through a structured career assessment, generates personalised career recommendations with compatibility scores, builds a phased career roadmap, and provides an AI-powered chat coach for ongoing career guidance.

## Problem Statement

Choosing a career is overwhelming. Traditional career counselling is expensive, slow, and often generic. People need honest, personalised guidance that considers their actual skills, interests, and goals — not one-size-fits-all advice.

## Solution

CareerPath AI uses AI to deliver personalised career counselling at scale. Users answer targeted assessment questions, receive honest analysis including strengths AND weaknesses, get matched to 3–5 career paths with realistic salary ranges, and receive a step-by-step roadmap with curated learning resources. The community feed and privacy controls let users share progress publicly or keep everything private.

## Features

- **Profile Builder** — Collects qualifications, skills, interests, and career goals
- **AI Career Assessment** — 10 adaptive questions with honest strength/weakness analysis
- **Career Recommendations** — 3–5 matched paths with compatibility scores, pros/cons, and salary ranges
- **Phased Career Roadmap** — Milestone-based roadmap for the top matched career
- **Where to Learn** — AI-generated curated learning resources (courses, YouTube, books, certifications)
- **AI Career Coach** — Real-time streamed chat for ongoing guidance
- **Community** — Public members directory + progress sharing feed (privacy toggle per profile)
- **Privacy Controls** — Public/private profile toggle with transparent visibility

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, TypeScript 5.9, Tailwind CSS 4, shadcn/ui |
| **Routing** | wouter |
| **State** | TanStack Query (React Query) |
| **Backend** | Express 5, Node.js 24 |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | OpenAI GPT-5.1 via Replit AI Integrations |
| **Validation** | Zod (v4), drizzle-zod |
| **API Codegen** | Orval (OpenAPI spec → hooks + Zod schemas) |
| **Build** | esbuild (CJS bundle for server), Vite (frontend) |

## System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   React     │────▶│   Express    │────▶│  PostgreSQL  │
│   (Vite)    │     │   API Server │     │  (Drizzle)   │
└─────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   OpenAI     │
                    │  (Replit AI  │
                    │ Integrations)│
                    └──────────────┘
```

- **Contract-first**: `lib/api-spec/openapi.yaml` is the source of truth. Orval generates React Query hooks and Zod schemas from it.
- **Server-side AI**: All OpenAI calls go through the Express backend — API keys never reach the client.
- **SSE streaming**: AI chat uses Server-Sent Events for real-time streamed responses.
- **Database-first design**: Drizzle schema files in `lib/db` define the data model; `drizzle-kit push` applies changes.

## Folder Structure

```
.
├── artifacts/                  # Deployable applications
│   ├── api-server/             # Express 5 backend (port 8080)
│   ├── career-counsel/         # React + Vite frontend
│   └── mockup-sandbox/         # Component preview server
├── lib/                        # Shared libraries
│   ├── api-spec/               # OpenAPI spec + Orval config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas
│   ├── db/                     # Drizzle ORM schema & migrations
│   ├── integrations-openai-ai-server/  # OpenAI SDK wrapper (server)
│   ├── integrations-openai-ai-react/   # OpenAI SDK wrapper (client)
│   └── replit-auth-web/        # Replit Auth client utilities
├── scripts/                    # Shared scripts
│   └── post-merge.sh           # Auto-push DB schema on merge
├── package.json                # Root workspace orchestration
├── pnpm-workspace.yaml         # Workspace config + catalog
└── tsconfig.base.json          # Shared TS compiler options
```

## Installation

**Prerequisites:**
- Node.js 24+ with pnpm
- PostgreSQL database (Replit provides one automatically)

**Steps:**

```bash
# Clone and install dependencies
pnpm install

# Push the database schema (development only)
pnpm --filter @workspace/db run push

# Generate API hooks and Zod schemas from OpenAPI
pnpm --filter @workspace/api-spec run codegen
```

## Running the Project

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/career-counsel run dev

# Typecheck everything
pnpm run typecheck

# Full build
pnpm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (Replit proxy) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key (Replit proxy) |
| `SESSION_SECRET` | Session encryption key |
| `BASE_PATH` | Artifact base path for routing |
| `PORT` | Port for the running artifact |

All OpenAI variables are auto-configured via **Replit AI Integrations** — no manual setup needed.

## Live Demo

🌐 [[https://career-navigator--vineeetvj593.replit.app/](https://career-navigator--vineeetvj593.replit.app/)]

## Screenshots

> 📸 *Screenshots to be added here. Recommended captures:*
>
> - **Dashboard** — Profile overview with privacy toggle card
> - **Assessment** — AI-powered career questionnaire
> - **Results** — Career recommendations with compatibility scores
> - **Roadmap** — Phased career plan + "Where to Learn" tab
> - **Community** — Public members directory and progress feed
> - **AI Coach** — Real-time chat with streamed responses

## Future Improvements

- [ ] OAuth login (Google, GitHub)
- [ ] Resume upload and AI analysis
- [ ] Job market integration (salary data from real APIs)
- [ ] Bookmarking and tracking job applications
- [ ] Email digest with weekly progress and new career opportunities
- [ ] Mobile app (Expo / React Native)

## License

MIT
