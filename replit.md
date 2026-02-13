# PrepEngine - Engineering Exam Prep

## Overview
A topic-based exam prep web app for first-year engineering students featuring interactive Learn Mode with study cards, Practice Mode with template-generated questions, and comprehensive progress tracking. Built with a NoteGPT-inspired dark UI.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, shadcn/ui, wouter routing, TanStack Query
- **Backend**: Express.js, passport (local strategy), express-session with PostgreSQL store
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based with scrypt password hashing

## Project Architecture
```
client/src/
  App.tsx               - Main app with auth gate, sidebar layout, routing
  components/
    app-sidebar.tsx     - Left sidebar with nav links, user info, theme toggle
    theme-provider.tsx  - Dark/light mode provider (defaults to dark)
  hooks/
    use-auth.tsx        - Auth context provider with login/register/logout
  pages/
    auth.tsx            - Login/signup page
    dashboard.tsx       - Hero, stats, topic cards with progress
    topics.tsx          - Topic listing with search filter
    learn.tsx           - Learn mode with card navigation, mark complete, quick checks
    practice.tsx        - Practice mode with question generation, grading, regenerate
    progress.tsx        - Progress overview per topic
server/
  auth.ts              - Passport setup, login/register/logout routes
  db.ts                - Drizzle database connection
  routes.ts            - All API endpoints + question template engine
  seed.ts              - Seeds 5 topics with learn cards and question templates
  storage.ts           - Database CRUD operations interface
shared/
  schema.ts            - Drizzle schema + Zod types for all tables
```

## Key Data Models
- **users**: id, username, password (hashed), displayName
- **topics**: id, name, description, icon, orderIndex
- **learn_cards**: id, topicId, title, content, quickCheck, quickCheckAnswer, orderIndex
- **question_templates**: id, topicId, templateText, solutionTemplate, answerType, parameters (JSONB)
- **user_learn_progress**: tracks which learn cards each user has completed
- **user_practice_progress**: tracks correct answers per question template
- **practice_attempts**: server-side record of generated questions with correct answers (for secure grading)

## Important Design Decisions
- Practice grading is done server-side: generate creates an attempt record, grade verifies against stored correct answer
- Question templates use parameterized generation with random values within ranges
- Dark mode is the default theme
- Uses session-based auth (not JWT) with PostgreSQL session store

## Recent Changes
- Feb 2026: Initial MVP build with all core features
