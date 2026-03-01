# RoboQuiz — Product Requirements, System Design & Development Plan

---

## Table of Contents

1. [Product Requirements Document (PRD)](#1-product-requirements-document)
2. [System Design](#2-system-design)
3. [Development Plan](#3-development-plan)

---

## 1. Product Requirements Document

### 1.1 Problem Statement

Learning centers with multiple tutors rely on a single shared account on Kahoot. Two core problems arise:

- **Session conflict** — when a second tutor logs in, the first is kicked out
- **Concurrent hosting** — multiple tutors cannot run live quiz sessions simultaneously under one account

### 1.2 Solution

An internal web-based live quiz platform built specifically for the learning center. It supports multiple concurrent tutor logins and simultaneous live game sessions under a single shared account model.

### 1.3 Target Users

| User | Description |
|---|---|
| Tutor | Creates quizzes, hosts live sessions, monitors leaderboard |
| Student | Joins a session via room code, answers questions on their device |

### 1.4 Scope

**Type:** Internal tool — single learning center, not a public SaaS product.
**No multi-tenancy.** No billing. No public signup.

---

### 1.5 MVP Feature Set

#### Tutor-facing

| Feature | Detail |
|---|---|
| Authentication | Email + password login. Multiple tutors can be logged in simultaneously. |
| Quiz library | Shared across all tutors — anyone can view, create, edit, delete any quiz. |
| Quiz builder | Create quizzes with MCQ and True/False questions. Each question supports an optional image upload. |
| Host a session | Start a live session from any quiz. Generates a 6-digit room code. |
| Game controls | Advance to the next question manually or let auto-advance run. Can pause between questions. |
| Live leaderboard | Displays after each question, showing ranked player scores in real time. |

#### Student-facing

| Feature | Detail |
|---|---|
| Join session | Enter 6-digit room code + nickname on any browser. No account required. |
| Answer questions | Tap/click an answer within the 20-second timer window. |
| Feedback | See if answer was correct after time expires. |
| Final screen | Final leaderboard shown at game end. |

---

### 1.6 Game Mechanics

| Rule | Value |
|---|---|
| Timer per question | 20 seconds (fixed) |
| Scoring | Speed-based: `points = 1000 × (timeRemaining / 20)` if correct, 0 if wrong |
| Max points per question | 1000 |
| Pacing | Auto-advance after reveal; tutor can pause between questions |
| Post-game data | Ephemeral — nothing stored after game ends |
| Anti-cheat | Not needed — trusted classroom environment (tutor present) |

---

### 1.7 Question Types

| Type | Detail |
|---|---|
| Multiple Choice (MCQ) | 4 options, exactly one correct, optional image |
| True / False | 2 options ("True" / "False"), one correct, optional image |

---

### 1.8 Roles & Permissions

All tutors are equal — flat permission model. Any tutor can:
- Log in from any device simultaneously
- Create, edit, delete any quiz
- Host any quiz as a live session

No admin role needed at MVP.

---

### 1.9 Success Metrics (MVP)

- All 6 tutors can be logged in simultaneously with no session conflicts
- Up to 6 concurrent live game sessions run without interference
- Student join-to-answer latency < 500 ms on a typical classroom network
- Host controls respond within 200 ms

---

### 1.10 V1 Roadmap (post-MVP, in priority order)

| Priority | Feature | Detail |
|---|---|---|
| 1 | CSV quiz import | Bulk upload questions from a spreadsheet. Define a CSV template (question, type, options, correct). |
| 2 | Short answer questions | Open text response; tutor marks correct or incorrect manually. |
| 3 | Post-game summary | Save and review final scores per session. |
| 4 | Quiz duplication | Clone an existing quiz to create variants. |

---

### 1.11 Out of Scope (explicit non-goals)

- Student accounts / persistent identity
- Multi-center / SaaS / billing
- Public sign-up
- Anti-cheat mechanisms
- Mobile apps (web-only)
- Kahoot-style music or animated transitions

---

## 2. System Design

### 2.1 Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend + API | Next.js 16 (App Router) on Vercel | Full-stack JS, native serverless deployment |
| Database | Neon — serverless Postgres | Native Vercel integration, generous free tier, structured data |
| Auth | Auth.js v5 (next-auth) | Credentials provider, JWT sessions, Next.js native |
| Realtime | Pusher | Managed WebSocket layer; Vercel serverless cannot hold persistent connections |
| File storage | Vercel Blob | Image uploads for quiz questions, 2 MB limit per file |
| Language | TypeScript | End-to-end type safety |

---

### 2.2 Why Pusher (not self-hosted WebSockets)

Vercel's serverless functions are stateless and short-lived — they cannot hold open TCP connections. A self-hosted Socket.io server would require a separate persistent process (e.g. Railway). At our scale (~54 concurrent connections peak), Pusher's free tier (100 concurrent connections) covers the full load without any extra DevOps.

---

### 2.3 Why Neon for Ephemeral Session State

Vercel function instances do not share memory. In-memory objects (a `Map` of active sessions) would not survive between API calls. Rather than adding Redis (Upstash), all active game state is stored in Neon during the session and deleted when the game ends. At our scale this adds negligible latency.

---

### 2.4 Data Model

```sql
-- ── Permanent tables ──────────────────────────────────────────────────────

tutors
  id          UUID PK DEFAULT gen_random_uuid()
  email       TEXT UNIQUE NOT NULL
  name        TEXT NOT NULL
  password    TEXT NOT NULL          -- bcrypt hash
  created_at  TIMESTAMPTZ DEFAULT NOW()

quizzes
  id          UUID PK DEFAULT gen_random_uuid()
  title       TEXT NOT NULL
  created_by  UUID → tutors.id ON DELETE CASCADE
  created_at  TIMESTAMPTZ DEFAULT NOW()
  updated_at  TIMESTAMPTZ DEFAULT NOW()

questions
  id          UUID PK DEFAULT gen_random_uuid()
  quiz_id     UUID → quizzes.id ON DELETE CASCADE
  type        TEXT CHECK (type IN ('mcq', 'true_false'))
  text        TEXT NOT NULL
  image_url   TEXT NULL
  order       INT NOT NULL DEFAULT 0
  created_at  TIMESTAMPTZ DEFAULT NOW()

options
  id          UUID PK DEFAULT gen_random_uuid()
  question_id UUID → questions.id ON DELETE CASCADE
  text        TEXT NOT NULL
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE

-- ── Ephemeral tables (deleted when game ends) ────────────────────────────

game_sessions
  id          UUID PK DEFAULT gen_random_uuid()
  quiz_id     UUID → quizzes.id
  host_id     UUID → tutors.id
  room_code   CHAR(6) UNIQUE NOT NULL
  status      TEXT CHECK (status IN ('lobby','active','finished')) DEFAULT 'lobby'
  current_q   INT NOT NULL DEFAULT 0
  is_paused   BOOLEAN NOT NULL DEFAULT FALSE
  created_at  TIMESTAMPTZ DEFAULT NOW()

game_players
  id          UUID PK DEFAULT gen_random_uuid()
  session_id  UUID → game_sessions.id ON DELETE CASCADE
  nickname    TEXT NOT NULL
  score       INT NOT NULL DEFAULT 0

game_answers
  id          UUID PK DEFAULT gen_random_uuid()
  player_id   UUID → game_players.id ON DELETE CASCADE
  question_id UUID → questions.id
  option_id   UUID NULL                  -- NULL = no answer (timed out)
  answered_at TIMESTAMPTZ DEFAULT NOW()  -- used to calculate speed-based score
```

---

### 2.5 API Routes

#### Auth
```
/api/auth/[...nextauth]     Auth.js handlers (GET, POST)
```

#### Quizzes
```
GET    /api/quizzes              List all quizzes (newest first)
POST   /api/quizzes              Create quiz + questions + options in one call
GET    /api/quizzes/[id]         Get quiz with questions and options
PUT    /api/quizzes/[id]         Replace quiz title, questions, options
DELETE /api/quizzes/[id]         Delete quiz (cascade cleans up questions/options)
```

#### Images
```
POST   /api/upload               Upload image to Vercel Blob → returns { url }
```

#### Game Sessions
```
POST   /api/sessions                    Create session, returns { room_code }
GET    /api/sessions/[code]             Student join — validates code, returns quiz metadata
POST   /api/sessions/[code]/join        Register player { nickname } → returns { player_id }
POST   /api/sessions/[code]/start       Host starts game → broadcasts first question
POST   /api/sessions/[code]/next        Host advances to next question (or ends game)
POST   /api/sessions/[code]/pause       Host toggles pause
POST   /api/sessions/[code]/answer      Student submits { option_id } → server scores it
DELETE /api/sessions/[code]             End session + delete all ephemeral rows
```

---

### 2.6 Realtime Architecture (Pusher)

#### Channels

| Channel | Who subscribes | Purpose |
|---|---|---|
| `presence-game-{roomCode}` | Host + all players | Presence awareness, lobby player list |
| `private-host-{roomCode}` | Host only | Host-only events (e.g. per-player answer status) |

#### Server → Client Events

| Event | Payload | Trigger |
|---|---|---|
| `game:lobby-update` | `{ players: string[] }` | Player joins lobby |
| `game:question` | `{ index, total, text, type, image_url, options: [{id, text}], duration }` | Host starts / advances |
| `game:tick` | `{ remaining: number }` | Every second, server-broadcast |
| `game:reveal` | `{ correct_option_id, leaderboard: [{nickname, score}] }` | Timer expires or all answered |
| `game:end` | `{ final_rankings: [{nickname, score}] }` | Last question revealed |

**Note:** `options` sent to players **omit** `is_correct` — correct answer only revealed in `game:reveal`.

#### Client → Server Flow

All student/host actions go through API POST calls. The API handler then triggers Pusher events server-side. Clients never push directly to Pusher channels.

```
Student answers  →  POST /api/sessions/[code]/answer
                      ↳ score calculated server-side
                      ↳ if all answered: Pusher game:reveal
Host presses next →  POST /api/sessions/[code]/next
                      ↳ Pusher game:question (next) or game:end
```

#### Timer Management

The server (API route) sets a 20-second deadline when a question starts (`question_deadline = NOW() + 20s`), stored in `game_sessions`. A background tick is broadcast via Pusher every second from the server. When the deadline passes (or all players have answered), the server triggers `game:reveal`.

**The server is the single source of truth for time.** Client-side countdown is display-only.

---

### 2.7 Scoring Formula

```
points = Math.round(1000 × (timeRemaining / totalDuration))   if correct
points = 0                                                      if wrong or no answer

timeRemaining = deadline - answered_at   (in seconds, clamped to [0, 20])
```

---

### 2.8 Room Code Generation

```typescript
// 6 uppercase alphanumeric characters, excluding ambiguous chars (0, O, I, 1)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateRoomCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}
// Retry on collision (checked against game_sessions.room_code)
```

---

### 2.9 Page & Component Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               ← Tutor login
│   ├── (dashboard)/
│   │   ├── layout.tsx                   ← Navbar, auth guard
│   │   └── quizzes/
│   │       ├── page.tsx                 ← Quiz library
│   │       ├── new/page.tsx             ← New quiz
│   │       └── [id]/edit/page.tsx       ← Edit quiz
│   ├── (game)/
│   │   ├── host/[code]/page.tsx         ← Host game screen
│   │   └── play/[code]/page.tsx         ← Student game screen
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── quizzes/route.ts
│       ├── quizzes/[id]/route.ts
│       ├── sessions/route.ts
│       ├── sessions/[code]/route.ts
│       ├── sessions/[code]/join/route.ts
│       ├── sessions/[code]/start/route.ts
│       ├── sessions/[code]/next/route.ts
│       ├── sessions/[code]/pause/route.ts
│       ├── sessions/[code]/answer/route.ts
│       └── upload/route.ts
├── components/ui/
│   ├── Navbar.tsx
│   ├── QuizBuilder.tsx                  ← Shared quiz builder form
│   ├── HostLobby.tsx                    ← Lobby waiting room (host view)
│   ├── HostQuestion.tsx                 ← Active question (host view)
│   ├── HostLeaderboard.tsx              ← Between-question leaderboard
│   ├── PlayerJoin.tsx                   ← Room code + nickname entry
│   ├── PlayerLobby.tsx                  ← Waiting room (player view)
│   ├── PlayerQuestion.tsx               ← Answer options (player view)
│   └── PlayerReveal.tsx                 ← Correct/wrong feedback
├── lib/
│   ├── auth.ts                          ← Auth.js config
│   ├── pusher/
│   │   ├── server.ts                    ← Pusher server client
│   │   └── client.ts                    ← Pusher browser client
│   └── db/
│       ├── index.ts                     ← Neon SQL client
│       ├── tutors.ts
│       ├── quizzes.ts
│       └── sessions.ts
├── types/
│   ├── index.ts                         ← Shared entity + event types
│   └── next-auth.d.ts                   ← Session type extension
└── proxy.ts                             ← Route protection (Next.js 16)
```

---

### 2.10 Environment Variables

```bash
# Database
DATABASE_URL=                    # Neon connection string (pooled)

# Auth
AUTH_SECRET=                     # 32-byte random hex (npx auth secret)

# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=          # Exposed to browser
NEXT_PUBLIC_PUSHER_CLUSTER=      # Exposed to browser

# Vercel Blob
BLOB_READ_WRITE_TOKEN=
```

---

### 2.11 Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Serverless statelessness | Game state lost between requests | Store all session state in Neon; delete on game end |
| Timer drift across devices | Unfair scoring | Server calculates score using DB timestamps, not client time |
| Pusher free tier limits | 100 concurrent connections max | Our peak is ~54; well within limit |
| Room code collision | Two sessions share a code | Generate → check uniqueness in DB → retry if collision |
| Image upload abuse | Large files, wrong types | 2 MB cap + MIME type check in API before Blob upload |
| Stale session rows | DB pollution if host abandons game | Auto-cleanup: delete sessions older than 24 h via a cron or on next-session creation |

---

## 3. Development Plan

### 3.1 Milestones

---

#### Milestone 1 — Foundation & Auth ✅ COMPLETE

**Goal:** Tutors can log in; DB schema is live.

| Task | Status |
|---|---|
| Next.js 16 project scaffold | ✅ |
| Neon project + all 7 DB tables | ✅ |
| Auth.js credentials provider (email + password) | ✅ |
| Login page (`/login`) | ✅ |
| Route protection via `proxy.ts` | ✅ |
| Seed script (`npm run seed`) | ✅ |
| `.env.local` with real credentials | ✅ |

---

#### Milestone 2 — Quiz Builder ✅ COMPLETE

**Goal:** Tutors can create, edit, and delete quizzes with MCQ and True/False questions.

| Task | Status |
|---|---|
| Quiz library page (`/quizzes`) | ✅ |
| New quiz page (`/quizzes/new`) | ✅ |
| Edit quiz page (`/quizzes/[id]/edit`) | ✅ |
| `QuizBuilder` shared component | ✅ |
| Quiz CRUD API routes | ✅ |
| Image upload API (`/api/upload`) | ✅ |
| Dashboard layout + Navbar | ✅ |

---

#### Milestone 3 — Live Session Setup

**Goal:** Host can start a session; students can join the lobby in real time.

| Task | Status |
|---|---|
| Pusher account setup + env vars | ⬜ |
| Pusher server client (`lib/pusher/server.ts`) | ⬜ |
| Pusher browser client (`lib/pusher/client.ts`) | ⬜ |
| `POST /api/sessions` — create session + room code | ⬜ |
| `GET /api/sessions/[code]` — validate code for student join | ⬜ |
| `POST /api/sessions/[code]/join` — register player nickname | ⬜ |
| Host lobby screen (`/host/[code]`) — shows player list, start button | ⬜ |
| Student join screen (`/play`) — room code + nickname entry | ⬜ |
| Student lobby screen (`/play/[code]`) — waiting room | ⬜ |
| Pusher `game:lobby-update` event on player join | ⬜ |

---

#### Milestone 4 — Gameplay Loop

**Goal:** Questions are broadcast, players answer, scores are calculated in real time.

| Task | Status |
|---|---|
| `POST /api/sessions/[code]/start` — broadcast first question | ⬜ |
| `POST /api/sessions/[code]/answer` — receive answer, calculate score | ⬜ |
| Server-side 20s deadline management | ⬜ |
| Pusher `game:tick` broadcast (countdown) | ⬜ |
| Pusher `game:reveal` — correct answer + updated scores | ⬜ |
| Host question screen — question text, options, answer status per player | ⬜ |
| Student question screen — answer options with countdown | ⬜ |
| Student reveal screen — correct/wrong feedback + score delta | ⬜ |

---

#### Milestone 5 — Leaderboard, Polish & Game End

**Goal:** Full game loop with leaderboard and clean game-end flow.

| Task | Status |
|---|---|
| `POST /api/sessions/[code]/next` — advance or end game | ⬜ |
| `POST /api/sessions/[code]/pause` — toggle pause | ⬜ |
| Host leaderboard screen between questions | ⬜ |
| Pusher `game:end` — final rankings | ⬜ |
| Final leaderboard screen (host + student) | ⬜ |
| Session cleanup — delete ephemeral rows on game end | ⬜ |
| `DELETE /api/sessions/[code]` — manual end by host | ⬜ |
| Quiz picker on host dashboard — launch session from any quiz | ⬜ |

---

#### V1 — CSV Quiz Import

**Goal:** Tutors can bulk-upload questions from a spreadsheet.

| Task | Status |
|---|---|
| Define and document CSV template | ⬜ |
| CSV parse + validation API | ⬜ |
| Bulk insert into quiz (questions + options) | ⬜ |
| Upload UI on quiz builder page | ⬜ |
| Error reporting (bad rows, invalid types) | ⬜ |

---

### 3.2 Build Sequence Rationale

```
M1 Auth  →  M2 Quiz Builder  →  M3 Session Setup  →  M4 Gameplay  →  M5 Polish
```

Each milestone is independently deployable and testable. M3 depends on M2 (needs real quizzes to host). M4 depends on M3 (needs a lobby to push questions into). M5 wraps up what M4 started.

---

### 3.3 Testing Approach

| Layer | Approach |
|---|---|
| API routes | Manual testing with browser dev tools + Neon console during build |
| Realtime events | Two browser windows — one as host, one as student |
| Scoring | Verify `answered_at` timestamps against calculated scores |
| Concurrent sessions | Open 2 host windows with different room codes simultaneously |
| Auth isolation | Sign in as two different tutors simultaneously in two browsers |

---

### 3.4 Deployment Checklist (before first use)

- [ ] Push repo to GitHub
- [ ] Create Vercel project, link to repo
- [ ] Set all env vars in Vercel dashboard
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Create Pusher app, fill in Pusher env vars
- [ ] Enable Vercel Blob storage, copy `BLOB_READ_WRITE_TOKEN`
- [ ] Run `npm run seed` locally (one-time) to create tutor accounts
- [ ] Verify login works on production URL
- [ ] Test full game loop with two devices on production

---

*Document generated: March 2026*
