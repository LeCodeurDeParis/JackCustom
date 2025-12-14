export type PlayerAction =
  | { type: "DRAW_CARD"; hidden: boolean }
  | { type: "STAND" };

export type BankAction =
  | { type: "DRAW_CARD" }
  | { type: "REVEAL_PLAYER"; playerId: string };
