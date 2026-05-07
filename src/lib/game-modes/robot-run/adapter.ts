import type { GameModeAdapter, PusherEvent } from "../types";
import type { RobotRunState } from "./types";
import {
  initPositions,
  calcMovement,
  advanceRobot,
  checkFinish,
} from "./logic";
import type { RobotAssignedEvent, RaceUpdateEvent, RaceFinishEvent } from "@/types";
import { assignRobotNumbers } from "@/lib/db/sessions";

export const robotRunAdapter: GameModeAdapter<RobotRunState> = {
  async onGameStart(session, players) {
    const positions = initPositions(players);

    // Persist robot number assignments
    await assignRobotNumbers(
      session.id,
      positions.map((p) => ({ playerId: p.playerId, robotNumber: p.robotNumber }))
    );

    const assignedEvent: RobotAssignedEvent = {
      assignments: positions.map((p) => ({
        playerId: p.playerId,
        nickname: p.nickname,
        robotNumber: p.robotNumber,
      })),
    };

    const raceUpdate: RaceUpdateEvent = { positions };

    const state: RobotRunState = { positions, finished: false };

    return {
      state,
      events: [
        { event: "game:robots:assigned", data: assignedEvent },
        { event: "game:race:update", data: raceUpdate },
      ],
    };
  },

  async onAnswer(session, player, answer, currentState) {
    if (currentState.finished || !answer.isCorrect) {
      return { stateUpdate: {}, events: [] };
    }

    const latencyMs =
      answer.answeredAt.getTime() -
      new Date(session.question_started_at!).getTime();
    const tiles = calcMovement(latencyMs);
    if (tiles === 0) return { stateUpdate: {}, events: [] };

    const newPositions = advanceRobot(currentState.positions, player.id, tiles);
    const winnerId = checkFinish(newPositions);

    const raceUpdate: RaceUpdateEvent = { positions: newPositions };
    const events: PusherEvent[] = [{ event: "game:race:update", data: raceUpdate }];

    if (winnerId) {
      const winner = newPositions.find((p) => p.playerId === winnerId)!;
      const finishEvent: RaceFinishEvent = {
        winnerId,
        winnerName: winner.nickname,
        winnerRobotNumber: winner.robotNumber,
      };
      events.push({ event: "game:race:finish", data: finishEvent });
    }

    return {
      stateUpdate: {
        positions: newPositions,
        finished: !!winnerId,
        ...(winnerId && {
          winnerId,
          winnerName: newPositions.find((p) => p.playerId === winnerId)?.nickname,
          winnerRobotNumber: newPositions.find((p) => p.playerId === winnerId)?.robotNumber,
        }),
      },
      events,
    };
  },

  async onQuestionReveal(_session, _currentState) {
    return { stateUpdate: {}, events: [] };
  },

  async onQuestionEnd(_session, currentState) {
    // If someone finished, end the game immediately
    return { finished: currentState.finished, stateUpdate: {} };
  },

  async onGameEnd(_session, players, currentState) {
    // Winner is either the first finisher or the player furthest on the track
    let winnerPos = currentState.positions.find(
      (p) => p.playerId === currentState.winnerId
    );
    if (!winnerPos) {
      // No finisher — pick furthest player
      winnerPos = [...currentState.positions].sort(
        (a, b) => b.tile - a.tile
      )[0];
    }

    const sorted = [...players].sort((a, b) => b.score - a.score);
    const top = sorted[0] ?? null;

    return {
      winnerLabel: winnerPos
        ? `${winnerPos.nickname} (Robot #${winnerPos.robotNumber})`
        : "Nobody",
      winnerId: winnerPos?.playerId ?? "",
      topScorer: top ? { nickname: top.nickname, score: top.score } : null,
    };
  },
};
