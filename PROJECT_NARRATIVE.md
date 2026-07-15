# CareerPath AI — Project Narrative for Resume & Interviews

> Use this as your answer to "Tell me about a project you're proud of" or "Describe a product you built from scratch." Practice the 2-minute version and the 5-minute version.

---

## The 30-Second Elevator Pitch

"I built CareerPath AI, a full-stack career guidance platform that helps people figure out what career they actually want — not just how to get there. It has an AI-powered conversational discovery flow for users who don't know their goal yet, plus a full roadmap, progress tracking, multi-career comparison, and community leaderboard for users who do. I built it as a product manager would: starting with the user problem, not the technology."

---

## The 2-Minute Version (for resume summaries or quick phone screens)

"I identified a gap in career guidance tools: they all assume you already know what you want. But most people — especially early-career professionals — don't. I built CareerPath AI to solve that.

**The product:** A retention-focused career growth platform with two entry points. Users who know their goal create a profile and get an AI-generated roadmap. Users who don't know launch a conversational AI discovery experience that explores their interests, strengths, and values through natural chat, then recommends specific career paths and seamlessly bridges into the roadmap system.

**What I built:** Full-stack TypeScript application — React frontend with TanStack Query, Express backend, PostgreSQL database with Drizzle ORM, OpenAI GPT-5.1 integration via Replit's managed proxy. I designed the database schema, API contract in OpenAPI, backend routes, frontend pages, and the AI prompt engineering for the discovery flow.

**Key result:** The app went from a single-use assessment tool to a platform with persistent progress tracking, multi-career management, community features, and a discovery flow that removes the #1 barrier to entry."

---

## The 5-Minute Version (for in-depth interviews)

### 1. Problem Discovery (the "why")

"I started by looking at existing career guidance tools — personality tests, skills assessments, job boards. They all had the same flaw: they assume the user already knows their career goal and just needs help getting there. But the real pain point for most people — especially recent graduates and career-changers — is **figuring out what the goal should be in the first place**.

I validated this by looking at my own experience and that of peers: we kept getting asked 'What's your career goal?' on every form, every application, every coaching session. When you don't have an answer, it's paralysing. That was the core problem I wanted to solve."

### 2. Product Strategy

"I framed the product around two personas:
- **The Unsure Explorer:** Doesn't know what they want. Needs gentle, conversational guidance to discover their fit.
- **The Transitioner:** Knows their target career. Needs a structured roadmap with milestones and progress tracking.

The key strategic decision was making the discovery flow an **additional entry point**, not a replacement. Both paths feed into the same backend infrastructure — profiles, career suggestions, roadmaps, progress tracking. This meant the existing 'I know my goal' flow stayed completely intact while the new flow expanded the addressable user base."

### 3. Architecture & Technical Decisions

"I chose a **contract-first API design**: OpenAPI spec as the single source of truth, with Orval auto-generating React Query hooks and Zod validation schemas. This eliminated API drift between frontend and backend — when I changed an endpoint, both sides updated automatically.

**Stack:**
- Frontend: React + Vite + TanStack Query + shadcn/ui + Wouter (lightweight routing)
- Backend: Express 5 + Drizzle ORM + PostgreSQL
- AI: OpenAI GPT-5.1 via Replit's managed AI integration (no API key management)
- Monorepo: pnpm workspace with shared libraries for DB schema, API spec, and generated clients

**Key technical decisions:**
- I used the **same `conversations` and `messages` tables** for both the AI coach and the discovery flow. No new database tables needed for discovery — it feeds the existing `profiles` and `career_suggestions` tables.
- I designed the **discovery AI prompt** to conduct a natural conversation (1-2 questions at a time, never a survey) and emit a JSON action marker when the user confirms their career choice. This kept the UI simple (just a chat interface) while the AI handled the conversational complexity.
- Profile creation from discovery uses a **two-stage AI process**: first the conversation, then a separate extraction call that parses the transcript into structured profile data + career suggestions. This is more reliable than trying to force structured output during a natural conversation.
- Authentication uses Replit Auth (OIDC) with `profiles.user_id` linking to the auth identity, so returning users auto-load their existing data — no starting from scratch."

### 4. What I Built (feature-by-feature)

"I built the product in four phases:

**Phase 1: Core Infrastructure**
- OpenAPI spec as source of truth with Orval codegen for type-safe API clients
- Database schema with `profiles`, `assessments`, `career_suggestions` tables
- Express backend with Zod-validated routes
- React frontend with TanStack Query for server state management

**Phase 2: The Existing Flow**
- Profile creation form with validation
- AI-generated assessment with structured questions
- Career results page with top match, compatibility scores, and alternatives
- Roadmap generation via GPT with milestone breakdowns
- AI career coach chat with streaming responses

**Phase 3: Retention Features (the platform layer)**
- `followed_careers` table for multi-career tracking (max 3 active, 1 primary)
- Enhanced `roadmap_progress` with status enum (`not_started`, `in_progress`, `completed`) + progress percentage + notes
- `user_resource_progress` for tracking learning resources (courses, books, certifications)
- Dashboard with stats, recent milestones, and quick-action sidebar
- Career comparison page (salary, timeline, difficulty, pros/cons side-by-side)
- Community leaderboard ranking by roadmap completion + skills tested
- Auth-linked profile retrieval (`GET /profiles/me`) so logged-in users auto-load their data

**Phase 4: Career Discovery (the differentiator)**
- Landing page redesigned with two clear entry points
- `/discover` page with intro screen and AI chat interface
- Discovery-specific system prompt that guides GPT through natural conversation
- Profile extraction endpoint that parses conversation transcript into structured data
- Seamless bridge: discovery flow creates profile + career suggestions, then redirects to the existing results page
- Non-judgmental profile form: renamed 'Career Goals' to 'What are you drawn to?' with explicit '(optional)' label

**Everything was built while maintaining full backward compatibility.** All existing features continue working exactly as before."

### 5. Challenges & How I Solved Them

**Challenge 1: How do you extract structured data from a natural conversation?**
> "I tried having the AI emit structured JSON during the chat, but it broke the conversational flow — the user would see weird formatting or the AI would get confused between chatting and data entry. My solution was a **two-stage approach**: let the AI have a completely natural conversation, and only when the user confirms their career choice, send the full transcript to a separate GPT call with an extraction prompt. This prompt specifically asks for structured profile fields and career suggestions. Much cleaner, much more reliable."

**Challenge 2: Orval-generated hooks fire on mount even when the user isn't authenticated.**
> "The auto-generated `useGetMyProfile()` hook from Orval would immediately fire a request, which returned 401 for unauthenticated users and showed console errors. I couldn't easily modify the generated hook. My solution was using the **raw `useQuery` hook directly** with `enabled: isAuthenticated` and the Orval-generated `queryKey` and `queryFn`. This gave me full control over when the query executes while keeping type safety."

**Challenge 3: How do you make the AI feel like a career counsellor, not a chatbot?**
> "The system prompt was critical. I iterated on it multiple times. The breakthrough was specifying **'ask 1-2 questions at a time'** and **'build on what they said before asking the next question'**. This prevented the AI from firing a survey-style list of questions, which kills the conversational feel. I also told it to be 'warm but direct' — to tell people what they need to hear, not what they want to hear. This created the 'brutally honest' brand voice."

**Challenge 4: The profile form's 'Career Goals' field created psychological pressure.**
> "Users who don't know their goal would freeze at this field or drop off. I reframed it as 'What are you drawn to? (optional)' with a placeholder like 'Even vague thoughts help... or leave blank if you're not sure yet.' This tiny copy change removed the pressure and kept users in the flow."

### 6. Metrics I'd Track

"If this were a live product, I'd focus on:
- **Discovery-to-roadmap conversion rate** — what % of discovery users complete the chat and build a roadmap
- **7-day return rate** — the core retention metric
- **Average careers followed per user** — are people exploring or committing?
- **Milestone completion rate** — are roadmaps actually being used?
- **Time from landing page to first value** — how quickly do users get a career recommendation?"

### 7. What I Learned

"**Product:** The biggest product insight was that the entry point matters more than the feature set. You can have the best roadmap engine in the world, but if users drop off before they ever get a recommendation, it doesn't matter. The discovery flow addressed the #1 funnel leak.

**Technical:** Contract-first API design with codegen is incredibly powerful for solo development — it catches type mismatches at build time instead of runtime. The monorepo structure with shared libraries kept the codebase clean as it grew.

**AI:** Prompt engineering is product design. The system prompt IS the product experience for the AI features. Investing time in getting the prompt right — specifying tone, question cadence, transition logic — produced a dramatically better user experience than any UI polish could.

**UX:** Small copy changes have outsized impact. 'Career Goals' vs 'What are you drawn to?' is the difference between a user dropping off and a user completing the form."

---

## Resume Bullet Points

Use these directly on your resume:

> **Product & Strategy:**
- Identified a gap in career guidance tools (all assume users know their goal) and designed a dual-entry product strategy serving both "unsure explorers" and "targeted transitioners"
- Led end-to-end product development from problem discovery through MVP to retention-focused platform with multi-career tracking, progress analytics, and community features

> **Technical Implementation:**
- Built full-stack career guidance platform: React + TypeScript frontend, Express + Drizzle ORM backend, PostgreSQL database, OpenAI GPT-5.1 integration
- Designed contract-first API architecture with OpenAPI spec as single source of truth; auto-generated type-safe React Query hooks and Zod validation schemas via Orval
- Implemented AI-powered conversational career discovery flow with two-stage extraction (natural chat → structured profile data) bridging seamlessly into existing roadmap system

> **Impact & Growth:**
- Transformed single-use assessment tool into retention platform with persistent progress tracking, multi-career comparison, community leaderboard, and learning resource management
- Solved the #1 funnel leak by replacing high-pressure "career goal" form fields with optional, conversational AI discovery that removes decision paralysis

---

## Common Interview Questions & Answers

**Q: "Tell me about a time you identified a user problem and built something to solve it."**
> "I noticed that every career guidance tool — assessments, job boards, coaching — assumes you already know what you want. But most early-career professionals don't. I built CareerPath AI with a conversational AI discovery flow that helps users figure out their career fit before generating a roadmap. The discovery flow became the primary entry point, and conversion to roadmap creation increased because we removed the #1 barrier: the pressure to name a goal upfront."

**Q: "How did you prioritise features?"**
> "I used a simple framework: which feature removes the biggest barrier to user value? Phase 1 was the core infrastructure. Phase 2 was the 'I know my goal' flow because it was the shortest path to a working product. Phase 3 was retention features — multi-career tracking, progress persistence, community — because without those, users would churn after one use. Phase 4 was the discovery flow because it expanded the addressable market from 'people who know their goal' to 'everyone who wants career guidance'."

**Q: "What would you do differently?"**
> "I'd add analytics instrumentation from day one. Right now I know the app works functionally, but I don't have real user behaviour data to validate whether the discovery flow actually converts better than the direct profile form. I'd also add A/B testing infrastructure early so I could test variants of the landing page copy and the AI prompt."

**Q: "How did you handle scope creep?"**
> "I was strict about the 'additional entry point, not replacement' rule for the discovery flow. Every time I considered a new feature — like adding a separate discovery-specific database schema — I asked: 'Does this break existing functionality?' If yes, I found a way to reuse existing infrastructure. This constraint actually made the architecture cleaner — discovery feeds the same tables as the existing flow."

**Q: "What was the hardest technical challenge?"**
> "Making the AI feel like a real career counsellor, not a chatbot. The breakthrough was realising that the system prompt IS the UX design for the AI features. I spent more time iterating on the prompt — specifying 'ask 1-2 questions at a time', 'build on what they said', 'be warm but direct' — than on any UI component. The prompt engineering was the product design."

---

## Practice Tips

1. **Time yourself** — The 2-minute version should take exactly 2 minutes. The 5-minute version exactly 5.
2. **Have a demo ready** — Be prepared to screenshare the app and walk through the discovery flow live.
3. **Know the numbers** — Even if they're estimates, be ready to say "I designed for a 40% 7-day return rate target" or "The discovery flow targets a 50% conversion to roadmap."
4. **Lead with the user problem** — Never start with the tech stack. Start with "People who don't know their career goal get stuck at every form..."
5. **Be honest about what you don't know** — "I didn't instrument analytics from day one, but here's how I'd validate this with real users..."

---

> **Pro tip:** Print the 2-minute version on a card and practice it until it feels natural, not rehearsed. The best interview answers sound like you're thinking out loud because you've thought about it so much.
