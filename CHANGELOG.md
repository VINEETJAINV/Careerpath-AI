# Changelog

All notable changes to CareerPath AI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- "Where to Learn" section — AI-generated curated learning resources for careers and individual skills
- Community progress sharing feed — share milestone completions and skill achievements
- Privacy controls — toggle profile visibility (public / private) from the dashboard
- Public members directory — browse and search community members who opted in
- Skill learning resources panel — inline resource generation per skill card

## [1.2.0] — 2025-06-02

### Added
- User authentication and public profile features
- Public profile page with shareable URL
- Community insights — compare your data with anonymised community averages

### Changed
- Backend refactored to use Orval-generated Zod schemas for validation
- Improved assessment accuracy with better AI prompting

## [1.1.0] — 2025-05-27

### Added
- Alternative career roadmaps — explore and plan for secondary matched careers
- Roadmap milestone tracking with completion state
- Skill tests with self-rating and AI-driven assessment
- Community insights page for cross-user comparison

### Changed
- Assessment UI redesigned for better UX
- Results page now shows persisted AI analysis across sessions
- Career suggestions cached in DB for faster page loads

## [1.0.0] — 2025-05-20

### Added
- Career assessment — 10 adaptive questions with AI analysis
- Career recommendations — 3–5 matched paths with compatibility scores
- Phased career roadmap generation
- AI career coach — real-time chat with streamed responses via SSE
- Profile management — create, update, and persist user profiles
- PostgreSQL database with Drizzle ORM schema
- OpenAPI contract-first API with Orval code generation
- Express 5 backend with request logging via pino
- React + Vite frontend with shadcn/ui components
- TanStack Query for server state management
- Replit Auth integration for user authentication

### Technical
- pnpm monorepo with shared library packages
- TypeScript 5.9 strict mode
- Tailwind CSS 4 with custom theme tokens
- Contract-first API design (OpenAPI → hooks + Zod)

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.3.0 (unreleased) | — | Learning resources, progress feed, privacy controls |
| 1.2.0 | 2025-06-02 | Auth, public profiles, community insights |
| 1.1.0 | 2025-05-27 | Skill tests, roadmap tracking, alternative careers |
| 1.0.0 | 2025-05-20 | MVP — assessment, recommendations, coach, roadmap |
