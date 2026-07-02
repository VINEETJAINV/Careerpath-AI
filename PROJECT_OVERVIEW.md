# CareerPath AI — Project Overview

A recruiter-friendly deep dive into what this application does, how it works, and why the technical choices matter.

---

## Project Goals

1. **Democratise career counselling** — Make high-quality, personalised career guidance accessible to everyone, not just people who can afford a career coach.
2. **Honesty over flattery** — The AI gives frank feedback including both strengths and weaknesses. Users need realistic expectations to make good career decisions.
3. **Actionable outcomes** — Not just suggestions, but a concrete roadmap with curated learning resources so users know exactly what to do next.
4. **Privacy by design** — Users control whether their profile is public or private. No one appears in the community directory without explicitly opting in.

---

## Target Users

- University students choosing their first career
- Professionals considering a career switch
- Recent graduates unsure which path to take
- Self-taught developers and bootcamp graduates entering the job market
- Anyone who wants an honest, data-driven second opinion on their career direction

---

## Main Workflows

### 1. Onboarding & Profile Creation
- User signs in via Replit Auth
- Fills out profile: name, age, education level, field of study, work experience, skills, interests, goals
- Profile is stored in PostgreSQL via Drizzle ORM

### 2. Career Assessment
- AI generates 10 personalised questions based on the user's profile
- Question types: multiple choice, scale (1–10), open text
- Answers are stored per question
- On submission, AI analyses the answers and produces:
  - Summary of strengths
  - Honest weaknesses / gaps
  - 3–5 career path recommendations with compatibility scores
  - Pros and cons for each path
  - Realistic salary ranges
  - Top matched career gets a phased roadmap

### 3. Career Roadmap & Learning Resources
- Roadmap is broken into phases with milestones (e.g., "Complete SQL course", "Build a portfolio project")
- Milestones can be checked off as completed
- "Where to Learn" tab: AI generates curated resources specific to the user's target career — courses, YouTube channels, books, certifications, practice platforms, filtered by difficulty and free/paid

### 4. AI Career Coach (Chat)
- Persistent chat sessions tied to the user's profile
- Real-time streamed responses using Server-Sent Events
- Coach remembers context from previous messages and the user's profile data

### 5. Community & Progress Sharing
- **Members tab** — Browse public profiles with search and stats (only `isPublic=1` profiles appear)
- **Progress Feed** — See milestone completions and skill achievements from other public users
- Users can share milestones and test results to the feed with one click
- Privacy toggle on the dashboard controls visibility

---

## Architecture Overview

### Contract-First Development

The API is defined in `lib/api-spec/openapi.yaml`. Orval generates:
- React Query hooks (`lib/api-client-react`)
- Zod validation schemas (`lib/api-zod`)

The server uses the same Zod schemas to validate inputs. Changing the API means updating one OpenAPI file and regenerating — both frontend and backend stay in sync.

### Monorepo Structure (pnpm workspaces)

- **Buildable libs** (`lib/*`) emit TypeScript declarations via `tsc --build`
- **Leaf apps** (`artifacts/*`, `scripts`) are checked with `tsc --noEmit`
- This prevents type portability issues and keeps compile times fast

### Database Design

PostgreSQL with Drizzle ORM. Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data + `is_public` flag |
| `career_suggestions` | AI-generated career recommendations |
| `assessment_answers` | Per-question answers |
| `conversations` / `messages` | AI chat sessions |
| `roadmap_phases` / `roadmap_milestones` | Career roadmap structure |
| `user_skills` | Self-rated and AI-tested skills |
| `learning_resources` | AI-generated resources for careers/skills |
| `progress_posts` | Community feed posts |

### AI Architecture

All AI calls flow through the Express backend via the `integrations-openai-ai-server` library. The frontend never holds an API key. Streaming chat uses manual `fetch` + `ReadableStream` because Orval doesn't generate SSE-aware hooks — this is an intentional tradeoff for real-time UX.

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **Contract-first (OpenAPI)** | Eliminates API drift between frontend and backend. One source of truth. |
| **Server-side AI only** | API keys stay secure. Rate limiting and response caching are possible. |
| **Drizzle over Prisma** | Type-safe SQL queries without a build step. Simpler in a monorepo context. |
| **wouter over React Router** | Lighter weight, matches the project scope, zero-config in Vite. |
| **shadcn/ui over custom CSS** | Consistent, accessible, composable components. Fast to build with. |
| **pnpm workspace catalog** | Single source of truth for shared dependency versions. |
| **Progressive privacy** | Profiles default to public but the user can toggle. Transparent, user-first. |

---

## Known Limitations

1. **No OAuth providers yet** — Only Replit Auth (email/password). Google/GitHub login is planned.
2. **No resume parsing** — Users manually enter skills and experience.
3. **Learning resources are AI-generated** — Links are not guaranteed to exist. URLs should be verified by users.
4. **Salary data is AI-estimated** — Not sourced from live job market APIs.
5. **No push notifications** — Community feed is pull-based only.
6. **No dark mode** — UI is light-themed only.

---

## Future Enhancements

1. **Resume upload & AI analysis** — Parse PDF/DOCX, extract skills, compare against market demand
2. **OAuth login** — Google, GitHub sign-in
3. **Real salary API integration** — Glassdoor / Levels.fyi / PayScale
4. **Job application tracker** — Bookmark jobs, track application status, set reminders
5. **Weekly email digest** — Progress summary + new opportunities
6. **Dark mode** — Theme toggle
7. **Mobile app** — Expo / React Native wrapper
8. **Leaderboard** — Rank members by roadmap completion and skill scores

---

## Metrics to Watch

- Assessment completion rate
- Roadmap milestone completion rate
- Learning resource click-through rate
- Community feed engagement (shares, views)
- Privacy toggle distribution (% public vs private)
- Chat session length and return rate

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and how to submit changes.
