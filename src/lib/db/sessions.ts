import { sql } from "./index";
import type { GameMode, GameSession, GamePlayer, MiniGameType } from "@/types";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(): string {
  return Array.from(
    { length: 6 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

export async function createSession(
  quizId: string,
  hostId: string,
  mode: GameMode = "classic",
  miniGameType: MiniGameType | null = null
): Promise<GameSession> {
  let roomCode: string = "";
  let attempts = 0;

  while (true) {
    roomCode = generateRoomCode();
    const existing =
      await sql`SELECT id FROM game_sessions WHERE room_code = ${roomCode}`;
    if (existing.length === 0) break;
    if (++attempts > 10) throw new Error("Failed to generate unique room code");
  }

  const rows = await sql`
    INSERT INTO game_sessions (quiz_id, host_id, room_code, mode, mini_game_type)
    VALUES (${quizId}, ${hostId}, ${roomCode}, ${mode}, ${miniGameType})
    RETURNING id, quiz_id, host_id, room_code, status, current_q, is_paused, created_at,
              question_started_at, mode, mode_state, team_a_name, team_b_name, mini_game_type
  `;
  return rows[0] as GameSession;
}

export async function getSessionByCode(
  code: string
): Promise<GameSession | null> {
  const rows = await sql`
    SELECT id, quiz_id, host_id, room_code, status, current_q, is_paused, created_at,
           question_started_at, mode, mode_state, team_a_name, team_b_name, mini_game_type
    FROM game_sessions
    WHERE room_code = ${code.toUpperCase()}
  `;
  return (rows[0] as GameSession) ?? null;
}

export async function setBreakPendingQuestion(
  sessionId: string,
  nextIndex: number
): Promise<void> {
  await sql`UPDATE game_sessions SET current_q = ${nextIndex} WHERE id = ${sessionId}`;
}

export async function setModeState(
  sessionId: string,
  state: unknown
): Promise<void> {
  await sql`
    UPDATE game_sessions SET mode_state = ${JSON.stringify(state)}::jsonb WHERE id = ${sessionId}
  `;
}

export async function addPlayer(
  sessionId: string,
  nickname: string
): Promise<GamePlayer> {
  const rows = await sql`
    INSERT INTO game_players (session_id, nickname)
    VALUES (${sessionId}, ${nickname})
    RETURNING id, session_id, nickname, score, team, robot_number
  `;
  return rows[0] as GamePlayer;
}

export async function assignTeams(
  sessionId: string,
  assignments: { playerId: string; team: "a" | "b" }[]
): Promise<void> {
  for (const { playerId, team } of assignments) {
    await sql`UPDATE game_players SET team = ${team} WHERE id = ${playerId}`;
  }
}

export async function assignRobotNumbers(
  sessionId: string,
  assignments: { playerId: string; robotNumber: number }[]
): Promise<void> {
  for (const { playerId, robotNumber } of assignments) {
    await sql`UPDATE game_players SET robot_number = ${robotNumber} WHERE id = ${playerId}`;
  }
}

export async function getPlayersInSession(
  sessionId: string
): Promise<GamePlayer[]> {
  const rows = await sql`
    SELECT id, session_id, nickname, score, team, robot_number
    FROM game_players
    WHERE session_id = ${sessionId}
    ORDER BY nickname ASC
  `;
  return rows as GamePlayer[];
}

export async function startQuestion(
  sessionId: string,
  questionIndex: number
): Promise<void> {
  await sql`
    UPDATE game_sessions
    SET status = 'active', current_q = ${questionIndex}, question_started_at = NOW()
    WHERE id = ${sessionId}
  `;
}

export async function advanceQuestion(
  sessionId: string,
  nextIndex: number
): Promise<void> {
  await sql`
    UPDATE game_sessions
    SET current_q = ${nextIndex}, question_started_at = NOW()
    WHERE id = ${sessionId}
  `;
}

export async function hasPlayerAnswered(
  playerId: string,
  questionId: string
): Promise<boolean> {
  const rows = await sql`
    SELECT id FROM game_answers
    WHERE player_id = ${playerId} AND question_id = ${questionId}
  `;
  return rows.length > 0;
}

export async function recordAnswer(
  playerId: string,
  questionId: string,
  optionId: string | null
): Promise<void> {
  await sql`
    INSERT INTO game_answers (player_id, question_id, option_id)
    VALUES (${playerId}, ${questionId}, ${optionId})
  `;
}

export async function addPointsToPlayer(
  playerId: string,
  points: number
): Promise<void> {
  await sql`UPDATE game_players SET score = score + ${points} WHERE id = ${playerId}`;
}

export async function getAnswerCountForQuestion(
  sessionId: string,
  questionId: string
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS count
    FROM game_answers ga
    JOIN game_players gp ON ga.player_id = gp.id
    WHERE gp.session_id = ${sessionId} AND ga.question_id = ${questionId}
  `;
  return Number((rows[0] as { count: string }).count);
}

export async function getLeaderboard(
  sessionId: string
): Promise<{ nickname: string; score: number }[]> {
  const rows = await sql`
    SELECT nickname, score
    FROM game_players
    WHERE session_id = ${sessionId}
    ORDER BY score DESC, nickname ASC
  `;
  return rows as { nickname: string; score: number }[];
}

export async function togglePause(
  sessionId: string,
  paused: boolean
): Promise<void> {
  await sql`UPDATE game_sessions SET is_paused = ${paused} WHERE id = ${sessionId}`;
}

export async function finishSession(sessionId: string): Promise<void> {
  await sql`UPDATE game_sessions SET status = 'finished' WHERE id = ${sessionId}`;
}

export async function deleteSessionData(sessionId: string): Promise<void> {
  // ON DELETE CASCADE removes game_players and game_answers automatically
  await sql`DELETE FROM game_sessions WHERE id = ${sessionId}`;
}
