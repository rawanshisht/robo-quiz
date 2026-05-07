# PRD: RoboQuiz Arena

**Version:** 0.1 — Draft
**Date:** 2026-03-03
**Author:** Product Strategy Session
**Status:** Awaiting engineering review
**Branch:** `games` (extends existing RoboQuiz codebase)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & How We Measure Success](#2-goals--how-we-measure-success)
3. [Scope: MVP → V1 → V2](#3-scope-mvp--v1--v2)
4. [Users & Roles](#4-users--roles)
5. [User Stories](#5-user-stories)
6. [Game Modes](#6-game-modes)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Game Engine Architecture](#9-game-engine-architecture)
10. [Realtime & Scaling Plan](#10-realtime--scaling-plan)
11. [Data Model](#11-data-model)
12. [Analytics & Events](#12-analytics--events)
13. [Anti-Cheat & Abuse](#13-anti-cheat--abuse)
14. [Accessibility & Classroom Safety](#14-accessibility--classroom-safety)
15. [Open Risks & Decisions](#15-open-risks--decisions)

---

## 1. Overview

RoboQuiz Arena extends the existing RoboQuiz platform with a family of interactive, real-time multiplayer game modes designed for physical classrooms. A teacher hosts a session on a projector; students (ages 6–18) join on their phones. Rather than a single quiz format, the teacher selects a **game mode** at session creation — each mode turns the same underlying question content into a distinct competitive or cooperative experience.

The initial two modes are:
- **Color Kingdom** — territory control (two teams)
- **Robot Run** — individual racing

All other modes are V2 and documented at concept level to guide future development.

**Extends:** existing RoboQuiz codebase on branch `games`
**Deployment:** single learning center, Vercel + Neon + Pusher
**Monetization:** none planned

---

## 2. Goals & How We Measure Success

### Primary Goals

| Goal | Description |
|------|-------------|
| Teacher adoption | Teachers voluntarily choose Arena modes over classic quiz |
| Student engagement | Measurable increase in on-task behavior during games |
| Stability | No session crashes or desync events during a live class |
| Ease of setup | Teacher can launch a new game mode in under 2 minutes |

### Success Metrics

| Metric | MVP Target | V1 Target |
|--------|-----------|-----------|
| Session launch time (quiz selected → game started) | < 90 seconds | < 60 seconds |
| Sessions with 0 reported desync events | ≥ 95% | ≥ 99% |
| Teacher re-use rate (same teacher plays ≥ 2 sessions) | ≥ 60% in first month | ≥ 80% |
| Student answer participation rate per question | ≥ 80% of joined players | ≥ 90% |
| Post-game winner display accuracy | 100% | 100% |
| Concurrent session capacity without degradation | 8 sessions / 80 players | 8 sessions / 80 players |

---

## 3. Scope: MVP → V1 → V2

| Feature / Mode | MVP | V1 | V2 |
|----------------|-----|----|----|
| **Color Kingdom** (territory control) | ✅ Full | Polish | — |
| **Robot Run** (race) | ✅ Full | Polish | — |
| Mode selector UI on session creation | ✅ | — | — |
| Auto team balancing | ✅ | — | — |
| Winner banner + top scorer display | ✅ | — | — |
| Pause / resume (inherited from M5) | ✅ | — | — |
| Host can end early (inherited from M5) | ✅ | — | — |
| **Submarine Squad** (co-op chase) | — | — | ✅ Concept |
| **Hangman** (word guessing) | — | — | ✅ Concept |
| **Code Hop** (kid coding puzzle) | — | — | ✅ Concept |
| Teacher analytics / question-level report | — | — | ✅ |
| Mixed-mode sessions | — | — | Consider |
| Mobile-native apps | — | — | Consider |

---

## 4. Users & Roles

| Role | Description | Device |
|------|-------------|--------|
| **Host (Teacher)** | Creates sessions, picks mode, controls game flow, monitors classroom | Laptop/tablet on projector |
| **Player (Student)** | Joins via session code, answers questions, sees mode-specific UI | Personal phone |

No student accounts. No persistent player identity. Identity lives in `localStorage` key `roboquiz_{code}` for the duration of a session, then discarded. Teachers authenticate via existing Auth.js credentials.

---

## 5. User Stories

### Host (Teacher)

- As a teacher, I want to pick a game mode when creating a session so that I can choose the experience that fits today's lesson.
- As a teacher, I want teams to be assigned automatically so that I don't waste class time organizing students.
- As a teacher, I want to see every team's territory / position on the projector so that the class has a shared focal point.
- As a teacher, I want to pause the game at any moment so that I can address a classroom disruption.
- As a teacher, I want to see a winner banner at the end so that the class has a clear, satisfying conclusion.
- As a teacher, I want to end the game early if time runs out so that I'm not held hostage by a long match.

### Player (Student)

- As a student, I want to join quickly with a code so that setup doesn't eat into play time.
- As a student, I want to know which team I'm on immediately after joining so that I feel invested.
- As a student, I want to see the effect of my correct answer on the shared board in real time so that my contribution feels meaningful.
- As a student, I want to see my current rank or position during the game so that I have a personal goal.
- As a student, I want a clear celebratory moment when my team or I win so that the effort feels rewarded.

---

## 6. Game Modes

### 6.1 Color Kingdom *(MVP — Territory Control)*

**Concept:** Two teams compete to control a grid map by answering questions correctly. The team that controls the most tiles at the end wins.

**Player experience:**
- On join, players are auto-assigned to **Team A (Blue)** or **Team B (Red)**, balanced by count.
- Each question is shown on every player's phone and the host screen simultaneously.
- A correct answer earns the player a **flag placement turn**. The player taps a tile on the grid to claim it — but only tiles **adjacent to their team's existing territory** are valid targets.
- Wrong answer: no placement, no penalty.
- After all valid placements resolve, the updated grid broadcasts to all screens.
- Game ends when all questions are exhausted. The team owning more tiles wins. Ties go to the team with more total correct answers.

**Grid specification:**

| Setting | Value |
|---------|-------|
| Grid size | 5 columns × 4 rows = 20 tiles |
| Starting tiles | Team A owns tile (0,0); Team B owns tile (4,3) |
| Valid placement | Adjacent (4-directional) to any tile already owned by player's team |
| Placement time window | 8 seconds after correct answer confirmed |
| Simultaneous placements | If two players on same team both earn a flag on same question, both may place (order: faster answer places first; second placement must re-validate adjacency) |

**Age adaptation flag (V1):**
For sessions tagged "Ages 6–8" by the teacher, placement rule relaxes to **place anywhere on the grid** (no adjacency requirement).

**Host screen:** Full-size grid, live tile ownership colors, question + timer, team score (tile count).
**Player screen:** Question + answer options, mini grid showing current ownership, placement UI after correct answer.

**Pusher events:**

| Event | Payload | Direction |
|-------|---------|-----------|
| `game:territory:update` | `{ grid: TileState[] }` | Server → all clients |
| `game:placement:prompt` | `{ playerId, validTiles: number[] }` | Server → specific player |
| `game:placement:confirm` | `{ tileIndex, team }` | Server → all clients |

---

### 6.2 Robot Run *(MVP — Race)*

**Concept:** Each player controls a robot on a linear race track. Correct answers move the robot forward; faster answers move it further. First robot to cross the finish line wins.

**Player experience:**
- No teams. Pure individual competition.
- A question appears on every screen. Players answer as fast as possible.
- **Correct answer** → robot advances based on speed bonus (see table below).
- **Wrong answer** → robot does not move. No backward penalty.
- All robots' positions are visible on the host screen as a live race track.
- Players see their own robot's position and the current leader on their phone.
- Game ends when **any robot crosses the finish line** (tile 20) OR all questions are exhausted.

**Movement formula:**

| Answer time | Tiles advanced |
|-------------|---------------|
| 0–2 seconds | 3 tiles |
| 2–5 seconds | 2 tiles |
| 5–10 seconds | 1 tile |
| Wrong / no answer | 0 tiles |

**Track specification:**

| Setting | Value |
|---------|-------|
| Track length | 20 tiles |
| Max players | 10 (one robot per player) |
| Robot identifiers | Robot #1–#10, each a distinct color + number label |
| Position display | Vertical or horizontal strip, host screen fills projector |

**Host screen:** Full-width race track with all robots, question + timer, current leader banner.
**Player screen:** Question + answer options, mini track showing own position vs leader.

**Pusher events:**

| Event | Payload | Direction |
|-------|---------|-----------|
| `game:race:update` | `{ positions: { playerId, tile }[] }` | Server → all clients |
| `game:race:finish` | `{ winnerId, winnerName }` | Server → all clients |

---

### 6.3 Submarine Squad *(V2 — Co-op Chase)*

**Concept:** The whole class operates a single submarine trying to escape a monster (or reach a goal). Every correct answer adds propulsion. Periodic "communication mini-phases" require players to call out matching symbols to unlock a speed burst. Failure is graceful — the submarine slows, not dies.

**Key design decisions deferred to V2:** map type, symbol-calling mechanic, failure states, visual metaphor.

---

### 6.4 Hangman *(V2 — Word Guessing)*

**Concept:** Classic hangman adapted for classroom safety. Teacher provides a word or phrase; players collectively suggest letters. Incorrect guesses add to a robot-malfunction animation (not a hanging figure).

---

### 6.5 Code Hop *(V2 — Kid Coding Puzzle)*

**Concept:** A puzzle screen shows a grid with a robot and a target. Players write a micro-program using block commands (Forward, Turn Left, Turn Right, Repeat) to move the robot to the target. Submitted programs scored by efficiency.

---

## 7. Functional Requirements

### 7.1 Session Creation

| ID | Requirement |
|----|-------------|
| FR-01 | Host selects a game mode from a mode picker before launching a session |
| FR-02 | Mode picker shows only MVP modes in V1; V2 modes shown as "Coming Soon" |
| FR-03 | Session code generation and lobby mechanics are unchanged from existing RoboQuiz flow |
| FR-04 | Host can see mode-specific settings before starting |
| FR-05 | Mode is locked once the first player joins |

### 7.2 Team Assignment

| ID | Requirement |
|----|-------------|
| FR-06 | On game start, server assigns players to teams using round-robin by join order |
| FR-07 | Team assignment is shown to the player immediately after start, before first question |
| FR-08 | Team colors use both color and name label (e.g., "Blue Team") |
| FR-09 | In Robot Run, each player receives a unique robot number (1–10) and color |

### 7.3 Question Flow

| ID | Requirement |
|----|-------------|
| FR-10 | Question display and timer mechanics are inherited from existing M4 loop |
| FR-11 | After reveal, mode-specific consequence logic fires (placement prompt, movement update) |
| FR-12 | Server is authoritative for all answer validation and score calculation |
| FR-13 | Players who answer after time expires receive 0 score and 0 movement/placement |

### 7.4 Mode-Specific Actions

| ID | Requirement |
|----|-------------|
| FR-14 | Color Kingdom: player who answered correctly receives a placement prompt within 500ms of reveal |
| FR-15 | Color Kingdom: placement tap is validated server-side (adjacency check); invalid taps rejected silently |
| FR-16 | Color Kingdom: placement window closes after 8 seconds; unclaimed flag is forfeited |
| FR-17 | Robot Run: server calculates tile advancement immediately on answer and broadcasts position update |
| FR-18 | Robot Run: game ends immediately when any player reaches tile 20 |

### 7.5 End-of-Game

| ID | Requirement |
|----|-------------|
| FR-19 | Server calculates final results and broadcasts `game:end` event |
| FR-20 | Host screen shows winner banner (team name for Color Kingdom, player name for Robot Run) |
| FR-21 | Host screen shows top-scoring individual player name and point total |
| FR-22 | Player screen shows win/lose/place result and personal score |
| FR-23 | Session is cleaned up from DB after `game:end` (existing M5 behavior) |

### 7.6 Pause & End Early *(inherited from M5)*

| ID | Requirement |
|----|-------------|
| FR-24 | Host can pause/resume at any point; mode-specific timers freeze |
| FR-25 | Host can end session early; `game:end` fires with current state as final result |

---

## 8. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Latency | Answer-to-board-update round trip ≤ 300ms on school WiFi |
| NFR-02 | Scalability | 8 concurrent sessions × 10 players = 80 simultaneous Pusher connections |
| NFR-03 | Reliability | Session state stored in Neon DB; a Vercel cold start must not lose game state |
| NFR-04 | Browser support | Chrome, Safari, Firefox — latest 2 major versions |
| NFR-05 | Device support | Any phone with a modern mobile browser; no app install required |
| NFR-06 | Screen readability | Host UI readable from 5 meters; minimum font size 24px for in-game labels |
| NFR-07 | Session recovery | If a player disconnects and reconnects within 60 seconds, state is restored |
| NFR-08 | Data retention | Session data deleted from DB on game end; no PII stored beyond the session |

---

## 9. Game Engine Architecture

### 9.1 Philosophy

The existing M4 game loop (question → answer → reveal → next) is a generic pipeline. Each game mode is a **plugin** that intercepts this pipeline at defined hooks and injects mode-specific logic. The host/player core — session creation, lobby, question display, timer, pause, end-early — is **shared and unchanged**.

### 9.2 Mode Adapter Interface

Each game mode exports a `GameModeAdapter` object:

```ts
interface GameModeAdapter {
  // Called once when host presses Start
  onGameStart(session: GameSession, players: GamePlayer[]): Promise<ModeState>

  // Called after server validates an answer
  onAnswer(
    session: GameSession,
    player: GamePlayer,
    answer: GameAnswer,
    currentState: ModeState
  ): Promise<{ stateUpdate: Partial<ModeState>; events: PusherEvent[] }>

  // Called when question timer expires or all players answered
  onQuestionReveal(
    session: GameSession,
    currentState: ModeState
  ): Promise<{ stateUpdate: Partial<ModeState>; events: PusherEvent[] }>

  // Called when host advances past reveal screen
  onQuestionEnd(
    session: GameSession,
    currentState: ModeState
  ): Promise<{ finished: boolean; stateUpdate: Partial<ModeState> }>

  // Called on game end
  onGameEnd(
    session: GameSession,
    currentState: ModeState
  ): Promise<GameResult>
}
```

### 9.3 Mode Registry

```ts
// src/lib/game-modes/registry.ts
export const MODE_REGISTRY: Record<string, GameModeAdapter> = {
  'color-kingdom': colorKingdomAdapter,
  'robot-run':     robotRunAdapter,
}
```

### 9.4 State Storage

Mode-specific state is stored in a `game_mode_state` JSONB column on `game_sessions`. State is atomic with the session row and survives serverless cold starts.

### 9.5 File Structure

```
src/
  lib/
    game-modes/
      registry.ts
      color-kingdom/
        adapter.ts
        logic.ts
        types.ts
      robot-run/
        adapter.ts
        logic.ts
        types.ts
  app/
    (game)/
      host/[code]/modes/
        color-kingdom/
        robot-run/
      play/[code]/modes/
        color-kingdom/
        robot-run/
```

### 9.6 Shared vs Mode-Specific Components

| Component | Shared | Mode-specific |
|-----------|--------|---------------|
| Lobby (host + player) | ✅ | — |
| Question display | ✅ | — |
| Answer buttons | ✅ | — |
| Timer bar | ✅ | — |
| Pause overlay | ✅ | — |
| Territory grid | — | Color Kingdom |
| Flag placement UI | — | Color Kingdom |
| Race track | — | Robot Run |
| Robot position strip | — | Robot Run |
| Winner banner | ✅ (generic) | Mode provides winner data |

---

## 10. Realtime & Scaling Plan

### 10.1 Transport

Pusher managed WebSockets (existing). Channel per session: `game-{code}` (public). No changes to channel model.

### 10.2 Authoritative Server

All game state mutations happen in Next.js API routes only. Clients send intents (answer, placement tap) and receive broadcasts. Clients never mutate state directly.

### 10.3 Ordering & Race Conditions

**Simultaneous placements (Color Kingdom):** First valid DB write wins. Tile marked "pending" under a DB transaction. Second player's request for same tile is rejected; they receive updated valid tiles.

**Simultaneous movement (Robot Run):** No conflict — each player has their own position. Updates are independent.

### 10.4 Latency Handling

- All timers run **client-side** (existing M4 pattern).
- Host client calls `/reveal` at `t=0`.
- Mode state updates broadcast on every answer (at most 10 Pusher messages per question).

### 10.5 Capacity Planning

| Resource | Limit | Peak Usage |
|----------|-------|------------|
| Pusher connections | 100 (free tier) | 80 players + 8 hosts = 88 |
| Pusher messages/day | 200,000 (free tier) | ~20,000 estimated |
| Neon compute | Serverless auto-scale | Negligible |

> **Warning:** Pusher free tier supports 100 connections. At 88 peak, buffer is only 12. Upgrade to Pusher Starter ($49/mo, 500 connections) before any expansion beyond 8 concurrent sessions.

### 10.6 Reconnection

On socket reconnect, player client calls `GET /api/sessions/[code]` to fetch current session + mode state and re-renders from authoritative server state.

---

## 11. Data Model

### 11.1 Schema Changes

```sql
-- Extend game_sessions
ALTER TABLE game_sessions
  ADD COLUMN mode         TEXT    NOT NULL DEFAULT 'classic',
  ADD COLUMN mode_state   JSONB,
  ADD COLUMN team_a_name  TEXT    DEFAULT 'Blue Team',
  ADD COLUMN team_b_name  TEXT    DEFAULT 'Red Team';

-- Extend game_players
ALTER TABLE game_players
  ADD COLUMN team         TEXT,     -- 'a' | 'b' | null
  ADD COLUMN robot_number INTEGER;  -- Robot Run only
```

### 11.2 JSONB State Shapes

**ColorKingdomState:**
```ts
{
  grid: Array<{ index: number; owner: 'a' | 'b' | null }>;
  pendingPlacements: Array<{ playerId: string; expiresAt: number }>;
}
```

**RobotRunState:**
```ts
{
  positions: Array<{ playerId: string; tile: number; finishedAt?: number }>;
  finished: boolean;
  winnerId?: string;
}
```

### 11.3 Table Overview

| Table | Changes |
|-------|---------|
| `game_sessions` | + `mode`, `mode_state`, `team_a_name`, `team_b_name` |
| `game_players` | + `team`, `robot_number` |
| `game_answers` | Unchanged |
| `tutors`, `quizzes`, `questions`, `options` | Unchanged |

No new tables required for MVP.

---

## 12. Analytics & Events

All events console-logged in MVP; persisted in V1.

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `session_created` | Host creates session | `{ mode, quizId, hostId }` |
| `session_started` | Host starts game | `{ sessionCode, playerCount, mode }` |
| `player_joined` | Player joins lobby | `{ sessionCode, playerName }` |
| `answer_submitted` | Player submits answer | `{ sessionCode, playerId, questionIndex, correct, latencyMs }` |
| `placement_made` | Color Kingdom: tile claimed | `{ sessionCode, playerId, team, tileIndex, latencyMs }` |
| `placement_expired` | Color Kingdom: window elapsed | `{ sessionCode, playerId }` |
| `robot_moved` | Robot Run: position updated | `{ sessionCode, playerId, fromTile, toTile }` |
| `game_finished` | Any mode ends | `{ sessionCode, mode, winnerTeam, winnerPlayerId, durationMs }` |
| `session_paused` | Host pauses | `{ sessionCode, questionIndex }` |
| `session_ended_early` | Host force-ends | `{ sessionCode, questionIndex, totalQuestions }` |

---

## 13. Anti-Cheat & Abuse

| Risk | Mitigation |
|------|-----------|
| Multiple answers per question | `UNIQUE(session_id, player_id, question_index)` DB constraint |
| Answer after time expires | Server compares `answered_at` vs `question_started_at + time_limit` |
| Fabricated placement requests | Server re-validates adjacency on every placement API call |
| Invalid robot position injection | Positions never sent from client; server calculates all movement |
| Session code guessing | 6-char alphanumeric = 2.2B combos; rate-limit `/join` to 5 attempts/IP/min |
| Offensive player names | Profanity blocklist + 20-character max |
| Answer endpoint flooding | Rate-limit to 1 request per player per question (DB constraint) |
| Ghost players | Non-answers recorded as null after reveal; score 0; no auto-kick |

---

## 14. Accessibility & Classroom Safety

### Display & Readability
- Host (projector) screen: minimum 24px body text, 40px+ headings, ≥ 44px touch targets.
- Team colors use **both color and label** — never color alone. Tiles show color fill + letter ("A"/"B").
- High contrast text on dark backgrounds (existing RoboQuiz convention).
- Robots identified by number + color + icon, not color alone.

### Age Appropriateness
- No content created by students is ever displayed publicly.
- Player names are ephemeral; visible only within the session.
- No chat, no free-text input beyond player name entry.

### Physical Classroom Safety
- Pause button always visible and one tap for host.
- No audio required. All feedback is visual.
- No flashing animations at > 3Hz. Transitions are smooth only.

### Cognitive Load
- Player phone shows one thing at a time: question → options → result → placement/move feedback.
- Color Kingdom valid tiles visually highlighted; invalid tiles grayed out. No error message needed.

### Reconnection Grace
- A student can rejoin with same name + session code and resume from current state without losing team or score.

---

## 15. Open Risks & Decisions

| ID | Risk / Decision | Status | Recommendation |
|----|----------------|--------|----------------|
| R-01 | Age-based placement rules (adjacency vs. free-place for 6–8) | Open | Add `session_age_group` field in V1 |
| R-02 | Robot Run tie-breaking (two players reach tile 20 same question) | Open | Award win to faster `answered_at` timestamp |
| R-03 | Pusher connection ceiling (88/100 free tier at peak) | Risk | Monitor; upgrade to Starter plan before expanding beyond 8 sessions |
| R-04 | Placement window UX (8s may feel short on slow phones) | Open | Make configurable (6s/8s/12s) in V1 |
| R-05 | Mixed-mode sessions | Deferred | Validate demand from teachers after MVP |
| R-06 | V2 mode timeline | No timeline | Revisit after 30 days of MVP teacher feedback |
| R-07 | Content moderation depth (blocklist only) | Accepted | Sufficient for single closed learning center |
| R-08 | Neon cold-start latency | Monitor | Enable PgBouncer pooling if P95 > 2s |
