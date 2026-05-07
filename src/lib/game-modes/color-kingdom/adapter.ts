import type { GameModeAdapter } from "../types";
import type { ColorKingdomState } from "./types";
import {
  initGrid,
  getValidPlacements,
  countTiles,
  getWinner,
} from "./logic";
import type {
  TeamAssignedEvent,
  TerritoryUpdateEvent,
  PlacementPromptEvent,
} from "@/types";
import { assignTeams } from "@/lib/db/sessions";

const PLACEMENT_WINDOW_MS = 8_000;

export const colorKingdomAdapter: GameModeAdapter<ColorKingdomState> = {
  async onGameStart(session, players) {
    // Auto-balance teams by join order (round-robin)
    const assignments: { playerId: string; team: "a" | "b" }[] = players.map(
      (p, i) => ({ playerId: p.id, team: i % 2 === 0 ? "a" : "b" })
    );
    await assignTeams(session.id, assignments);

    // Build team event payload
    const enriched = players.map((p, i) => ({
      playerId: p.id,
      nickname: p.nickname,
      team: (i % 2 === 0 ? "a" : "b") as "a" | "b",
    }));

    const teamEvent: TeamAssignedEvent = {
      assignments: enriched,
      teamAName: session.team_a_name,
      teamBName: session.team_b_name,
    };

    const state: ColorKingdomState = {
      grid: initGrid(),
      pendingPlacements: [],
    };

    const scores = countTiles(state.grid);
    const territoryEvent: TerritoryUpdateEvent = {
      grid: state.grid,
      scoreA: scores.a,
      scoreB: scores.b,
    };

    return {
      state,
      events: [
        { event: "game:teams:assigned", data: teamEvent },
        { event: "game:territory:update", data: territoryEvent },
      ],
    };
  },

  async onAnswer(session, player, answer, currentState) {
    if (!answer.isCorrect || !player.team) {
      return { stateUpdate: {}, events: [] };
    }

    const validTiles = getValidPlacements(currentState.grid, player.team);
    if (validTiles.length === 0) {
      return { stateUpdate: {}, events: [] };
    }

    const expiresAt = Date.now() + PLACEMENT_WINDOW_MS;
    const newPending = [
      ...currentState.pendingPlacements.filter(
        (p) => p.playerId !== player.id
      ),
      { playerId: player.id, expiresAt },
    ];

    const promptEvent: PlacementPromptEvent = {
      playerId: player.id,
      validTiles,
      expiresAt,
    };

    return {
      stateUpdate: { pendingPlacements: newPending },
      events: [{ event: "game:placement:prompt", data: promptEvent }],
    };
  },

  async onQuestionReveal(session, currentState) {
    // Expire any stale pending placements
    const now = Date.now();
    const activePlacements = currentState.pendingPlacements.filter(
      (p) => p.expiresAt > now
    );

    const scores = countTiles(currentState.grid);
    const territoryEvent: TerritoryUpdateEvent = {
      grid: currentState.grid,
      scoreA: scores.a,
      scoreB: scores.b,
    };

    return {
      stateUpdate: { pendingPlacements: activePlacements },
      events: [{ event: "game:territory:update", data: territoryEvent }],
    };
  },

  async onQuestionEnd(_session, _currentState) {
    return { finished: false, stateUpdate: {} };
  },

  async onGameEnd(session, players, currentState) {
    const correctA = players
      .filter((p) => p.team === "a")
      .reduce((sum, p) => sum + p.score, 0);
    const correctB = players
      .filter((p) => p.team === "b")
      .reduce((sum, p) => sum + p.score, 0);

    const winner = getWinner(currentState.grid, correctA, correctB);
    const scores = countTiles(currentState.grid);

    const teamAName = session.team_a_name;
    const teamBName = session.team_b_name;

    let winnerLabel: string;
    let winnerId: string;
    if (winner === "a") {
      winnerLabel = `${teamAName} (${scores.a} tiles)`;
      winnerId = "team-a";
    } else if (winner === "b") {
      winnerLabel = `${teamBName} (${scores.b} tiles)`;
      winnerId = "team-b";
    } else {
      winnerLabel = "Tie!";
      winnerId = "tie";
    }

    const sorted = [...players].sort((a, b) => b.score - a.score);
    const top = sorted[0] ?? null;

    return {
      winnerLabel,
      winnerId,
      topScorer: top ? { nickname: top.nickname, score: top.score } : null,
    };
  },
};
