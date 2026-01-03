import { ShopItem } from "@/interfaces/shop";

export const SHOP_ITEMS: ShopItem[] = [
  // BONUS (pour s'aider)
  {
    id: "vision-alteree",
    name: "Vision altérée",
    cost: 15,
    description:
      "Bois une gorgée ou une taffe : au tour de la banque, le nombre de joueurs bust sera révélé.",
    targetType: "NONE",
    category: "BONUS",
  },
  {
    id: "pause-lucide",
    name: "Pause lucide",
    cost: 20,
    description:
      "Bois une gorgée ou une taffe : ignore le prochain effet qui te forcerait à piocher.",
    targetType: "SELF",
    category: "BONUS",
  },
  {
    id: "dose-au-choix",
    name: "Dose au choix",
    cost: 25,
    description:
      "Bois une gorgée ou une taffe : pioche 2 cartes visibles et garde celle de ton choix.",
    targetType: "SELF",
    category: "BONUS",
  },

  // MALUS (contre un joueur)
  {
    id: "a-la-tienne",
    name: "À la tienne",
    cost: 20,
    description:
      "Bois ou fumes avec un joueur : il devra piocher face ouverte à son prochain tirage (stand impossible).",
    targetType: "PLAYER",
    category: "MALUS",
  },
  {
    id: "encore-un",
    name: "Encore un",
    cost: 25,
    description:
      "Bois une gorgée ou une taffe : retourne une carte visible de la cible face cachée et oblige-la à tirer face cachée.",
    targetType: "PLAYER",
    category: "MALUS",
  },
  {
    id: "double-pioche",
    name: "Double pioche",
    cost: 30,
    description:
      "Bois une gorgée ou une taffe : 2 cartes visibles sont tirées automatiquement pour la cible.",
    targetType: "PLAYER",
    category: "MALUS",
  },
  {
    id: "main-figee",
    name: "Main figée",
    cost: 35,
    description:
      "Bois une gorgée ou une taffe : bloque la main de la cible jusqu'à ce que la banque la dénonce.",
    targetType: "PLAYER",
    category: "MALUS",
  },
  {
    id: "dernier-appel",
    name: "Dernier appel",
    cost: 30,
    description:
      "Bois une gorgée ou une taffe : force la banque à dénoncer immédiatement un joueur au début de son tour.",
    targetType: "BANK",
    category: "MALUS",
  },
];

export function getShopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

export function getEnabledShopItems(enabledIds: string[]): ShopItem[] {
  return SHOP_ITEMS.filter((item) => enabledIds.includes(item.id));
}



