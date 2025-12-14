export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  description: string;
}

export interface PlayerPurchase {
  playerId: string;
  itemId: string;
}
