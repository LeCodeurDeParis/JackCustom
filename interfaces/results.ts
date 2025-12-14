export type GameResult = "WIN" | "LOSE";

export interface PlayerResult {
  userId: string;
  result: GameResult;
  playerScore: number;
  bankScore: number;
}
