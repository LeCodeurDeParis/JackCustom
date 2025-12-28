import { Card } from "@/interfaces/card";
import { Player } from "@/interfaces/player";
import { Room } from "@/interfaces/room";
import { GameState } from "@/states/game-states";
import { PlayerState } from "@/states/player-states";

export function createDeck(): Card[] {
  const suits: Card["suit"][] = ["hearts", "diamonds", "clubs", "spades"];
  const values = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    10,
    10,
    10, // As, 2..10, J, Q, K
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ value, suit, hidden: false });
    }
  }

  return deck.sort(() => Math.random() - 0.5); // Mélange
}

// Fonction pour créer un deck de cartes (placeholder)
export function drawCard(
  deck: Card[],
  player: Player,
  hidden: boolean = false
): Card | null {
  if (deck.length === 0) return null;

  const card = deck.pop()!;
  const cardCopy: Card = { ...card, hidden };

  player.hand.push(cardCopy);

  return cardCopy;
}

export function distributeInitialCards(room: Room) {
  if (!room.currentGame) return;

  const deck = room.currentGame.deck;
  const players = room.currentGame.players;
  const bank = room.currentGame.bank;

  // 1. Distribuer une carte visible à chaque joueur et à la banque
  players.forEach((player) => drawCard(deck, player, false)); // face visible
  drawCard(deck, bank, false); // banque face visible

  // 2. Distribuer une carte cachée à chaque joueur
  players.forEach((player) => drawCard(deck, player, true)); // face cachée

  // 3. Mettre tous les joueurs prêts à jouer et la banque en attente
  players.forEach((player) => (player.state = PlayerState.PLAYING));
  bank.state = PlayerState.WAITING;

  // 4. Mettre à jour l'état de la partie pour indiquer que la distribution est terminée
  room.currentGame.state = GameState.PLAYER_TURNS;
  room.currentGame.currentPlayerIndex = 0;

  return room.currentGame;
}

export function calculateTotal(hand: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.value === 1) {
      aces++;
      total += 11; // On compte l'As comme 11 par défaut
    } else {
      total += card.value;
    }
  }

  // On réduit les As de 11 à 1 si le total dépasse 21
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateTotal(hand) === 21;
}

// Vérifie si le joueur a une carte cachée dans sa main
export function hasHiddenCard(hand: Card[]): boolean {
  return hand.some((card) => card.hidden);
}

// Calcule le total visible (sans les cartes cachées)
export function calculateVisibleTotal(hand: Card[]): number {
  const visibleHand = hand.filter((card) => !card.hidden);
  return calculateTotal(visibleHand);
}
