import type { GameModeAdapter } from "../types";

/** No-op adapter for the classic quiz mode — existing behaviour unchanged. */
export const classicAdapter: GameModeAdapter<null> = {
  async onGameStart() {
    return { state: null, events: [] };
  },
  async onAnswer() {
    return { stateUpdate: null, events: [] };
  },
  async onQuestionReveal() {
    return { stateUpdate: null, events: [] };
  },
  async onQuestionEnd() {
    return { finished: false, stateUpdate: null };
  },
  async onGameEnd(_session, players) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const top = sorted[0] ?? null;
    return {
      winnerLabel: top?.nickname ?? "Nobody",
      winnerId: top?.id ?? "",
      topScorer: top ? { nickname: top.nickname, score: top.score } : null,
    };
  },
};
