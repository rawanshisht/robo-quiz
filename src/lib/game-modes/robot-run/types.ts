export interface RobotRunPosition {
  playerId: string;
  nickname: string;
  robotNumber: number;
  tile: number;
  finishedAt?: number; // unix ms, set when tile >= TRACK_LENGTH
}

export interface RobotRunState {
  positions: RobotRunPosition[];
  finished: boolean;
  winnerId?: string;
  winnerName?: string;
  winnerRobotNumber?: number;
}
