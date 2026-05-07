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

export type GameMode = "classic" | "color-kingdom" | "robot-run";

export type MiniGameType = "flying-math" | "typing" | "robocody";

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
  mode: GameMode;
  mode_state: unknown | null;
  team_a_name: string;
  team_b_name: string;
  mini_game_type: MiniGameType | null;
}

export interface RobocodyQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctId: string;
}

export interface GameBreakStartEvent {
  gameType: MiniGameType;
  level: number;
  robocodyQuestions?: RobocodyQuestion[];
}

export interface MiniGameResult {
  finalScore: number;
  level: number;
  gameType: MiniGameType;
  completed: boolean;
}


export interface GamePlayer {
  id: string;
  session_id: string;
  nickname: string;
  score: number;
  team: "a" | "b" | null;
  robot_number: number | null;
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

// ── Game mode types ────────────────────────────────────────────────────────

export interface TeamAssignedEvent {
  assignments: { playerId: string; nickname: string; team: "a" | "b" }[];
  teamAName: string;
  teamBName: string;
}

export interface RobotAssignedEvent {
  assignments: { playerId: string; nickname: string; robotNumber: number }[];
}

// Color Kingdom
export interface TileState {
  index: number;
  owner: "a" | "b" | null;
}

export interface TerritoryUpdateEvent {
  grid: TileState[];
  scoreA: number;
  scoreB: number;
}

export interface PlacementPromptEvent {
  playerId: string;
  validTiles: number[];
  expiresAt: number; // unix ms
}

export interface PlacementConfirmEvent {
  tileIndex: number;
  team: "a" | "b";
  playerId: string;
}

// Robot Run
export interface RobotPosition {
  playerId: string;
  nickname: string;
  robotNumber: number;
  tile: number;
}

export interface RaceUpdateEvent {
  positions: RobotPosition[];
}

export interface RaceFinishEvent {
  winnerId: string;
  winnerName: string;
  winnerRobotNumber: number;
}
