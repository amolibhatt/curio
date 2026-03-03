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
- **Daily Q&A**: Each day a categorized question (Us, Deep, Memory Lane, Dream Big, Hot Takes, Hypothetical, Intimacy, Gratitude, Play, Before Us) is shown; both partners answer independently; answers are hidden until both submit; full Q&A history in archive
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
- `client/src/lib/daily-questions.ts` — 280+ categorized couple questions, deterministic daily selection
- `client/src/components/rich-editor.tsx` — WYSIWYG contentEditable editor
- `client/public/sw.js` — Service worker (caches static assets only, skips Firebase)
- `server/routes.ts` — Empty (no API routes)

## Design

- Hyper-minimal aesthetic, cream background (#FAF9F7), near-black text (#1C1C1C)
- Serif headings (Playfair Display), no shadows except subtle shadow-sm
- Category system: Science, History, Etymology, Space, Art, Us, Random
- "Us" category gets rose tinting throughout; all other elements use warm neutrals
- User1 avatar: pink bg (#ffd5dc) with long-hair variants + no beard; User2 avatar: blue bg (#d5e0ff)
- All active states use solid bg-[#1C1C1C] — no gradients
- Confetti uses warm muted tones (#D4C5B9, #B8A99A, etc.) — no saturated rainbow
- Logo icon: BookOpen in warm taupe (#8B7E74) on #EDEAE6 rounded-xl
- Glow/pulse animations use neutral warm tones, not pink/rose

## Firebase

- **Project**: curio-1d592
- **Hosting**: curio-1d592.web.app
- **Deploy**: `npx firebase deploy --only hosting,firestore --token "..."` from project root
- **Security rules**: Locked-down per-pairing access using `getUserPairingId()` helper function in rules
  - Users: create restricted to `name`, `avatar`, `pairingId` fields with type/size validation; update restricted to only `name` and `avatar` (pairingId immutable after creation) — prevents pairingId hijacking attack
  - Facts/dailyAnswers: read/write restricted to pairing members only
  - Pairings: read allowed for members + unfilled pairings (invite flow) + users whose user doc points to the pairing (reconnect); create restricted to `inviteCode`, `user1Id`, `user2Id` fields only; create enforces `user2Id == null`, inviteCode is string 1-32 chars
  - Pairing join: `affectedKeys().hasOnly(['user2Id'])` prevents modifying other fields during join
  - Pairing reconnect: cross-check prevents partner from hijacking the other slot (user2 can't overwrite user1Id, vice versa)
  - Anniversary date: validated as string with size 10 in pairing update rules
  - Fact create: validates date (string, length 10), categories (list, 1-7 items), restricts to exactly `text`, `authorId`, `pairingId`, `date`, `categories` fields
  - Fact update: re-validates text (string, 1-5000 chars) and categories (list, 1-7 items) on edit
  - Fact authorId update (reconnect): requires pairing membership check via `getUserPairingId()`
  - Reactions: validated against allowed types; write restricted to `type` field only
  - dailyAnswers create: validates field types, answer value must be string 1-2000 chars; restricts to `pairingId`, `date`, `questionText`, `category`, `answers` fields
  - dailyAnswers update: only user's own answer key can be modified; answer value validated as string 1-2000 chars

## Notes

- IDs are strings (Firebase auto-generated or Auth UIDs)
- Service worker v8 skips all googleapis.com, firebase, gstatic.com, identitytoolkit, securetoken, dicebear.com domains
- Reactions use optimistic UI updates (instant visual feedback, Firestore write in background)
- Reaction locking is per-fact (Set<string>), not global — users can react to different facts rapidly
- Reactions write directly to Firestore (setReaction/removeReaction) based on optimistic state — no stale read-then-write race condition
- All date strings use local timezone via `getLocalDateStr()` from `date-utils.ts` — never `toISOString().split('T')[0]`
- `todayStr` is reactive across all pages (home, archive, timeline) — checks every 30s for midnight rollover
- Timeline countdowns and day counter depend on `todayStr` for midnight reactivity
- `fetchFacts` uses a ref for pairingId to avoid interval restarts on auth refresh
- Reactions subcollection reads are parallelized with Promise.all
- Burst animation timeout is cleaned up on component unmount via ref
- Archive dates use local `new Date(y, m-1, d)` — never `parseISO()` which creates UTC dates causing off-by-one in western timezones
- Login and handleLogin enforce min 2-char names both at UI and handler level
- Initial data fetch shows skeleton loading state before facts/answers load
- Editor close (Escape/X) prompts "Discard your changes?" when content has been modified
- Daily answer textarea auto-grows with content (max 160px height)
- `submitDailyAnswer` uses Firestore `runTransaction` for atomic read-then-write (prevents partner answers being overwritten on concurrent submission)
- Input validation: fact text max 5000 chars, answer text max 2000 chars, name max 50 chars, categories validated against allowed set, reaction types validated against allowed set, anniversary date fully validated (format, date validity, no future dates), fact date format validated as YYYY-MM-DD
- `reconnectUser` creates user doc first (enables pairing read via `getUserPairingId()` rule), then validates pairing exists and user membership matches; on failure, cleans up the tentative user doc before throwing; sanitizes name from cookie (trim + length check); clears stale cookies on failure
- `getReconnectCookie` validates parsed JSON shape (uid, name, pairingId are non-empty strings, isUser1 is boolean) before returning; prevents crashes from corrupted/tampered cookies
- `joinPairing` uses Firestore `runTransaction` to atomically verify user2Id is null before setting it; prevents race conditions where two users try to join simultaneously
- `reconnectUser` copies (not moves) old answer keys and reaction docs during UID migration — old orphaned keys are harmless since no user has the old UID; avoids PERMISSION_DENIED from rules that restrict deletions to own UID
- `hasPostedToday` filters authorId server-side in Firestore query (3-field query: pairingId + authorId + date)
- Composite indexes configured in `firestore.indexes.json` for multi-field queries on facts collection
- Fact update rule restricts author edits to only `text` and `categories` fields — prevents malicious pairingId/date/authorId changes
- `handleEditFact` stores sanitized (truncated + validated) values in local state, not raw component values
- `handleLogin` trims name before length check to prevent whitespace-only names passing validation
- `handleLogin` invite flow: if `joinPairing` fails, cleans up the user doc to prevent orphaned state; if `user2Id` already matches current uid (retry case), skips join and proceeds
- `deleteUser` utility function exported from firestore.ts for cleanup operations
- `handleSubmitAnswer` triggers a background `fetchFacts()` after Q&A submission to pick up partner's answer sooner
- `fetchFacts` error toast only shows on initial load, not during periodic 15s polling — prevents toast spam when Firestore is temporarily unreachable
