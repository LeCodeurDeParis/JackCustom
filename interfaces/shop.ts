export type TargetType = "SELF" | "PLAYER" | "BANK" | "NONE";

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  targetType: TargetType;
  category: "BONUS" | "MALUS";
}

export interface PlayerPurchase {
  itemId: string;
  targetUserId?: string;
  timestamp: number;
}
