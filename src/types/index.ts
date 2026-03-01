// ── Database entity types ──────────────────────────────────────────────────

export type QuestionType = "mcq" | "true_false";

export interface Tutor {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  text: string;
  image_url: string | null;
  order: number;
  options: Option[];
}

export interface Option {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
}

// ── Game session types (ephemeral, not persisted after game ends) ──────────

export type SessionStatus = "lobby" | "active" | "finished";

export interface GameSession {
  id: string;
  quiz_id: string;
  host_id: string;
  room_code: string;
  status: SessionStatus;
  current_q: number;
  is_paused: boolean;
  created_at: string;
  question_started_at: string | null;
}

export interface GamePlayer {
  id: string;
  session_id: string;
  nickname: string;
  score: number;
}

// ── Pusher event payloads ──────────────────────────────────────────────────

export interface LobbyUpdateEvent {
  players: string[]; // nicknames
}

export interface QuestionEvent {
  index: number;
  total: number;
  text: string;
  type: QuestionType;
  image_url: string | null;
  options: { id: string; text: string }[]; // is_correct omitted for players
  duration: number; // seconds
  started_at: string; // ISO timestamp, for client-side countdown sync
}

export interface AnswerCountEvent {
  answered: number;
  total: number;
}

export interface TickEvent {
  remaining: number;
}

export interface PauseEvent {
  paused: boolean;
}

export interface RevealEvent {
  correct_option_id: string;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
}

export interface EndEvent {
  final_rankings: LeaderboardEntry[];
}
