# CareerPath AI — Product Management Case Study

> A retention-focused career growth platform built with modern web technologies. This document serves as a portfolio-ready case study for Product Management interviews.

---

## 1. Problem Statement

**Original MVP pain points:**
- Single-use assessment: users completed the quiz once, got results, and never returned
- No persistence: career roadmaps, progress, and learning resources were ephemeral
- No ownership: users couldn't track multiple career paths or compare options side-by-side
- No community: no social proof, gamification, or peer motivation to drive retention
- **Critical missing piece:** The app assumed users already knew their career goal — no entry point for people who don't know what they want

**Target outcome:** Transform CareerPath AI from a one-time tool into a platform users visit weekly to track career growth.

---

## 2. User Personas

### Primary: The Unsure Explorer
**Name:** Jamie, 22, Recent Graduate
**Goal:** Find a career they actually care about
**Pain:** No idea where to start; overwhelmed by "what's your career goal?" questions; afraid of committing to the wrong path
**Behaviour:** Needs gentle, conversational guidance that helps them discover their fit before locking in a direction

### Secondary: The Transitioner
**Name:** Alex, 26, Junior Developer
**Goal:** Transition from frontend dev to AI/ML engineering within 2 years
**Pain:** Generic online courses don't tell them *which* skills to learn, in *what order*, for *their* background
**Behaviour:** Needs structured milestones, progress visibility, and occasional coaching nudges

---

## 3. Product Requirements

### P0 — Discovery & Onboarding
| Feature | Why it drives retention | Status |
|---|---|---|
| AI Career Discovery (conversational, not a form) | Removes "goal pressure" from unsure users | Done |
| Natural AI chat — 1-2 questions at a time | Feels like talking to a person, not a survey | Done |
| 3–5 career recommendations with honest pros/cons | Reduces decision paralysis with specificity | Done |
| Seamless bridge to roadmap system | No dead-end after recommendations | Done |
| Two-path onboarding ("discover" vs "I know") | Respects user confidence level | Done |
| Non-judgmental profile form (optional goals field) | No pressure to have it figured out | Done |

### P0 — Core Platform
| Feature | Why it drives retention | Status |
|---|---|---|
| Multi-career tracking (max 3 active, 1 primary) | Users explore options before committing | Done |
| Persistent milestone progress with status enum | Visual progress = dopamine loop | Done |
| Comprehensive dashboard (stats, recent wins, shortcuts) | Single pane of glass for daily check-in | Done |
| Career comparison (salary, timeline, difficulty, pros/cons) | Reduces decision paralysis | Done |
| Community leaderboard (public profiles only) | Social proof + friendly competition | Done |
| Resource progress tracking (courses, books, certifications) | Learning becomes measurable | Done |

### P1
| Feature | Status |
|---|---|
| AI coach career context switcher | Partial (coach knows profile, career context next) |
| Push/email nudges for stalled milestones | Not started |
| LinkedIn profile import for auto-skill detection | Not started |

---

## 4. The Career Discovery Flow

```
Landing Page
    |
    |-- "Help me discover my path"  --> /discover
    |                                    AI starts a conversation
    |                                    7-10 natural exchanges
    |                                    AI presents 3-5 career options
    |                                    User confirms which one(s) to pursue
    |                                    "Build My Roadmap" button
    |                                    Backend extracts profile from transcript
    |                                    --> Results page (existing flow)
    |                                        --> Roadmap (existing flow)
    |
    |-- "I know my goal"              --> /profile/new
    |                                    Standard profile form
    |                                    --> Assessment (existing flow)
    |                                        --> Results (existing flow)
    |                                            --> Roadmap (existing flow)
```

**Key design principle:** The discovery flow is an *additional entry point*, not a replacement. It reuses the existing profile, career_suggestions, and roadmap infrastructure. AI extracts structured profile data from the conversation and seeds it into the same database tables the existing flow uses.

---

## 5. Technical Architecture

```
Frontend (React + Vite + TanStack Query)
    |
    |-- OpenAPI contract-first API calls (Orval codegen)
    |
Backend (Express 5 + Drizzle ORM + PostgreSQL)
    |
    |-- AI integration (OpenAI GPT-5.1 via Replit proxy)
    |-- Discovery route: `/api/discovery/conversations/:id/create-profile`
    |       → Extracts profile + careers from conversation transcript
    |
Database (PostgreSQL)
    |-- profiles (ENHANCED: linked to user_id for auth)
    |-- conversations, messages (NEW: discovery uses same tables)
    |-- career_suggestions (REUSED: seeded from AI extraction)
    |-- followed_careers (NEW: multi-career tracking)
    |-- roadmap_progress (ENHANCED: status + percent + notes)
    |-- user_resource_progress (NEW: learning tracking)
```

### Key Design Decisions
- **Contract-first API:** OpenAPI spec is source of truth; React hooks + Zod schemas auto-generated. Eliminates API drift.
- **Discovery reuses existing data model:** No new tables needed — discovery is a conversation that feeds the same `career_suggestions` and `profiles` tables.
- **AI extraction post-conversation:** Instead of asking the AI to generate structured data mid-chat (awkward), the backend sends the full conversation transcript to GPT after the user confirms their choices, and extracts a structured profile + careers from it.
- **Backward compatibility:** Legacy `completed` boolean field preserved; new `status` enum overlays it.
- **Auth-linked profiles:** `profiles.user_id` links to Replit Auth identity so returning users auto-load their data.

---

## 6. Metrics & Success Criteria

| Metric | Baseline (MVP) | Target (v2) |
|---|---|---|
| Return rate (7-day) | ~5% | 40% |
| Avg. session duration | 3 min | 8 min |
| Assessment completion | 60% | 75% |
| Roadmap milestone engagement | 0 (no tracking) | 60% of users complete >= 3 milestones |
| Careers followed per user | 1 (implicit) | 2.2 average |
| Discovery-to-roadmap conversion | N/A | 50% |

---

## 7. Trade-offs & Lessons

1. **Max 3 active careers:** Chosen to prevent overwhelm. Users can archive and swap freely.
2. **Leaderboard only for public profiles:** Respects privacy while creating social layer.
3. **Status enum over boolean:** `not_started | in_progress | completed` captures partial progress. Kept legacy `completed` field for backward compat.
4. **Orval codegen friction:** `queryKey` is required in every `query` option. Solved by using raw `useQuery` for auth-gated calls.
5. **Discovery prompt engineering over structured chat UI:** Rather than building a rigid Q&A wizard, we used a carefully crafted system prompt that tells GPT how to conduct the conversation, ask 1-2 questions at a time, and emit a JSON action marker when ready. This keeps the UI simple (just a chat interface) while the AI handles the complexity.
6. **"What are you drawn to?" instead of "Career Goals":** The profile form previously asked "Career Goals" which created pressure. Rebranding the field and making it explicitly optional removed the psychological barrier for unsure users.

---

## 8. Running the App Locally

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

## 9. Future Roadmap

- **v2.1:** AI coach career context switcher (coach knows which career you're asking about)
- **v2.2:** Email nudges for stalled milestones + weekly progress digest
- **v2.3:** Job market integration (real job listings matched to roadmap milestones)
- **v2.4:** Mentor marketplace (connect with people who completed the same roadmap)
- **v2.5:** Discovery follow-up — users who haven't decided after one session can resume where they left off
