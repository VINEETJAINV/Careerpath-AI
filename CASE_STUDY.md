# CareerPath AI — Product Management Case Study

> A retention-focused career growth platform built with modern web technologies. This document serves as a portfolio-ready case study for Product Management interviews.

---

## 1. Problem Statement

**Original MVP pain points:**
- Single-use assessment: users completed the quiz once, got results, and never returned
- No persistence: career roadmaps, progress, and learning resources were ephemeral
- No ownership: users couldn't track multiple career paths or compare options side-by-side
- No community: no social proof, gamification, or peer motivation to drive retention

**Target outcome:** Transform CareerPath AI from a one-time tool into a platform users visit weekly to track career growth.

---

## 2. User Persona

**Name:** Alex, 26, Junior Developer
**Goal:** Transition from frontend dev to AI/ML engineering within 2 years
**Pain:** Generic online courses don't tell them *which* skills to learn, in *what order*, for *their* background
**Behaviour:** Needs structured milestones, progress visibility, and occasional coaching nudges

---

## 3. Product Requirements

### Must-Have (P0)
| Feature | Why it drives retention | Status |
|---|---|---|
| Multi-career tracking (max 3 active, 1 primary) | Users explore options before committing | Done |
| Persistent milestone progress with status enum | Visual progress = dopamine loop | Done |
| Comprehensive dashboard (stats, recent wins, shortcuts) | Single pane of glass for daily check-in | Done |
| Career comparison (salary, timeline, difficulty, pros/cons) | Reduces decision paralysis | Done |
| Community leaderboard (public profiles only) | Social proof + friendly competition | Done |
| Resource progress tracking (courses, books, certifications) | Learning becomes measurable | Done |

### Should-Have (P1)
| Feature | Status |
|---|---|
| AI coach career context switcher | Partial (coach knows profile, career context next) |
| Push/email nudges for stalled milestones | Not started |
| LinkedIn profile import for auto-skill detection | Not started |

---

## 4. Technical Architecture

```
Frontend (React + Vite + TanStack Query)
    |
    |-- OpenAPI contract-first API calls (Orval codegen)
    |
Backend (Express 5 + Drizzle ORM + PostgreSQL)
    |
    |-- AI integration (OpenAI GPT-5.1 via Replit proxy)
    |
Database (PostgreSQL)
    |-- profiles, assessments, career_suggestions
    |-- followed_careers (NEW: multi-career tracking)
    |-- roadmap_progress (ENHANCED: status + percent + notes)
    |-- user_resource_progress (NEW: learning tracking)
```

### Key Design Decisions
- **Contract-first API:** OpenAPI spec is source of truth; React hooks + Zod schemas auto-generated. Eliminates API drift.
- **Backward compatibility:** Legacy `completed` boolean field preserved; new `status` enum overlays it.
- **Auth-linked profiles:** `profiles.user_id` links to Replit Auth identity so returning users auto-load their data.

---

## 5. Metrics & Success Criteria

| Metric | Baseline (MVP) | Target (v2) |
|---|---|---|
| Return rate (7-day) | ~5% | 40% |
| Avg. session duration | 3 min | 8 min |
| Assessment completion | 60% | 75% |
| Roadmap milestone engagement | 0 (no tracking) | 60% of users complete >= 3 milestones |
| Careers followed per user | 1 (implicit) | 2.2 average |

---

## 6. Trade-offs & Lessons

1. **Max 3 active careers:** Chosen to prevent overwhelm. Users can archive and swap freely.
2. **Leaderboard only for public profiles:** Respects privacy while creating social layer.
3. **Status enum over boolean:** `not_started | in_progress | completed` captures partial progress. Kept legacy `completed` field for backward compat.
4. **Orval codegen friction:** `queryKey` is required in every `query` option. Solved by using raw `useQuery` for auth-gated calls.

---

## 7. Running the App Locally

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/career-counsel run dev

# Typecheck everything
pnpm run typecheck

# Regenerate API clients after openapi.yaml changes
pnpm --filter @workspace/api-spec run codegen
```

---

## 8. Future Roadmap

- **v2.1:** AI coach career context switcher (coach knows which career you're asking about)
- **v2.2:** Email nudges for stalled milestones + weekly progress digest
- **v2.3:** Job market integration (real job listings matched to roadmap milestones)
- **v2.4:** Mentor marketplace (connect with people who completed the same roadmap)
