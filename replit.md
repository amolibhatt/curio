# Curio

A private PWA where two partners share one daily discovery each, maintain a streak, and browse a chronological archive.

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Radix UI components
- **Backend**: Express.js (serves static files only — no API routes)
- **Database**: Firebase Firestore (client-side SDK)
- **Auth**: Firebase Anonymous Auth with `browserLocalPersistence`
- **Routing**: wouter (client)

## Data Model (Firestore Collections)

- `users` — name, avatar, pairingId (doc ID = Firebase Auth UID)
- `pairings` — inviteCode, user1Id, user2Id, anniversaryDate (optional)
- `facts` — text, authorId, pairingId, date, categories[]
  - `facts/{id}/reactions` — subcollection, doc ID = userId, field: type
- `dailyAnswers` — doc ID = `{pairingId}_{date}`, fields: pairingId, date, questionText, category, answers (map of userId → answer text)

## Key Features

- **Pairing System**: User 1 signs up → gets invite code → shares link → User 2 joins via `/invite/:code`
- **Daily Discovery**: Each user can post one thought per day with categories
- **Blind Reveal**: Partner's post stays hidden until you post yours for the same day
- **Streak Counter**: Counts consecutive days where both users posted
- **Reactions**: 6 reaction types (mind-blown, fascinating, heart, laugh, thinking, sad) with optimistic UI + burst animations
- **Daily Q&A**: Each day a categorized question (About Us, Dreams, Memories, Fun, Deep, Favorites) is shown; both partners answer independently; answers are hidden until both submit; full Q&A history in archive
- **Rich Text Editor**: WYSIWYG contentEditable editor with B/I/U/headings, markdown storage
- **Edit Entry**: Can edit today's entry after posting
- **Relationship Timeline** (`/us`): Anniversary date, days-together counter, milestone celebrations, anniversary countdown
- **Anonymous Auth**: Auto sign-in, no logout, permanent session

## File Structure

- `client/src/lib/firebase.ts` — Firebase app init, auth, Firestore
- `client/src/lib/firestore.ts` — All Firestore CRUD operations
- `client/src/lib/mock-data.ts` — Shared TypeScript types
- `client/src/lib/format-text.tsx` — Markdown-to-React renderer
- `client/src/App.tsx` — Main app with auth flow + data fetching
- `client/src/pages/home.tsx` — Home page with discovery form overlay
- `client/src/pages/archive.tsx` — Chronological archive with filters + reactions
- `client/src/pages/login.tsx` — Name input page
- `client/src/components/layout.tsx` — App shell with sticky header + bottom nav
- `client/src/pages/timeline.tsx` — Relationship timeline with milestones + anniversary
- `client/src/lib/daily-questions.ts` — 170+ categorized couple questions, deterministic daily selection
- `client/src/components/rich-editor.tsx` — WYSIWYG contentEditable editor
- `client/public/sw.js` — Service worker (caches static assets only, skips Firebase)
- `server/routes.ts` — Empty (no API routes)

## Design

- Hyper-minimal aesthetic, cream background (#FBF9F6)
- Serif headings (Playfair Display), no shadows except subtle shadow-sm
- Category system: Science, History, Etymology, Space, Art, Us, Random
- "Us" category gets rose tinting throughout
- User1 avatar: pink bg (#ffd5dc), User2 avatar: blue bg (#d5e0ff)

## Firebase

- **Project**: curio-1d592
- **Hosting**: curio-1d592.web.app
- **Firestore rules must allow**: `allow read, write: if request.auth != null;`
- **Deploy**: `npx firebase deploy --only hosting --token "..."` from project root

## Notes

- IDs are strings (Firebase auto-generated or Auth UIDs)
- Service worker v3 skips all googleapis.com, firebase, gstatic.com, identitytoolkit, securetoken domains
- Reactions use optimistic UI updates (instant visual feedback, Firestore write in background)
- Reaction locking is per-fact (Set<string>), not global — users can react to different facts rapidly
- Reactions write directly to Firestore (setReaction/removeReaction) based on optimistic state — no stale read-then-write race condition
- All date strings use local timezone via `getLocalDateStr()` from `date-utils.ts` — never `toISOString().split('T')[0]`
- `todayStr` is reactive (checks every 30s for midnight rollover)
- `fetchFacts` uses a ref for pairingId to avoid interval restarts on auth refresh
- Reactions subcollection reads are parallelized with Promise.all
- Burst animation timeout is cleaned up on component unmount via ref
