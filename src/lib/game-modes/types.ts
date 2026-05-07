import type { GameSession, GamePlayer } from "@/types";

export interface GameAnswer {
  playerId: string;
  optionId: string | null;
  isCorrect: boolean;
  answeredAt: Date;
}

export interface PusherEvent {
  event: string;
  data: unknown;
  /** If set, only trigger for this specific Pusher socket — not used here (public channels only) */
  channel?: string;
}

export interface GameResult {
  /** Display name of the winner — team name or player nickname */
  winnerLabel: string;
  /** For team modes: 'a' | 'b'; for individual: playerId */
  winnerId: string;
  topScorer: { nickname: string; score: number } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameModeAdapter<TState = any> {
  /**
   * Called once when the host presses Start.
   * Returns the initial mode_state to persist.
   */
  onGameStart(
    session: GameSession,
    players: GamePlayer[]
  ): Promise<{ state: TState; events: PusherEvent[] }>;

  /**
   * Called after a player answer is validated and scored.
   * Returns state delta to persist and any Pusher events to fire.
   */
  onAnswer(
    session: GameSession,
    player: GamePlayer,
    answer: GameAnswer,
    currentState: TState
  ): Promise<{ stateUpdate: Partial<TState>; events: PusherEvent[] }>;

  /**
   * Called when the question is revealed (timeout or all answered).
   * Returns state delta and events.
   */
  onQuestionReveal(
    session: GameSession,
    currentState: TState
  ): Promise<{ stateUpdate: Partial<TState>; events: PusherEvent[] }>;

  /**
   * Called when the host advances past the reveal screen.
   * If finished: true, the game ends instead of showing the next question.
   */
  onQuestionEnd(
    session: GameSession,
    currentState: TState
  ): Promise<{ finished: boolean; stateUpdate: Partial<TState> }>;

  /**
   * Called on game end (last question or host ends early).
   * Returns the result for the winner banner.
   */
  onGameEnd(
    session: GameSession,
    players: GamePlayer[],
    currentState: TState
  ): Promise<GameResult>;
}
