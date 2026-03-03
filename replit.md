# Curio

A private PWA where two friends share one daily discovery each, maintain a streak, and browse a chronological archive.

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Radix UI components
- **Backend**: Express.js with session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (client), Express (server)
- **State**: TanStack Query for server state management

## Data Model

- `users` — id, name, avatar, pairingId
- `pairings` — id, inviteCode, user1Id, user2Id
- `facts` — id, text, imageUrl, authorId, pairingId, date, categories (jsonb)
- `reactions` — id, factId, userId, type

## Key Features

- **Pairing System**: User 1 signs up → gets invite code → shares link → User 2 joins via `/invite/:code`
- **Daily Discovery**: Each user can post one thought per day with categories and optional image
- **Blind Reveal**: Partner's post stays hidden until you post yours for the same day
- **Streak Counter**: Counts consecutive days where both users posted
- **Reactions**: 6 reaction types (mind-blown, fascinating, heart, laugh, thinking, sad) with burst animations
- **Session Auth**: express-session with connect-pg-simple for persistent sessions

## File Structure

- `shared/schema.ts` — Drizzle schema + Zod validation
- `server/db.ts` — Database connection
- `server/storage.ts` — Storage interface (DatabaseStorage)
- `server/routes.ts` — API routes with session auth
- `client/src/App.tsx` — Main app with auth flow
- `client/src/pages/home.tsx` — Home page with form overlay
- `client/src/pages/archive.tsx` — Chronological archive with filters
- `client/src/pages/login.tsx` — Login/signup page
- `client/src/components/layout.tsx` — App shell with nav
- `client/src/lib/mock-data.ts` — Shared TypeScript types

## Design

- Hyper-minimal aesthetic, cream background (#FBF9F6)
- Serif headings, no shadows except subtle shadow-sm on white cards
- Category system: Science, History, Etymology, Space, Art, Us, Random
- "Us" category gets rose tinting throughout
