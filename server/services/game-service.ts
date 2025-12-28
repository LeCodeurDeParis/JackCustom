// server/services/game-services.ts
import { Room } from "@/interfaces/room";
import { Player } from "@/interfaces/player";
import { PlayerState } from "@/states/player-states";
import { GameState } from "@/states/game-states";
import { randomUUID } from "crypto";
import { ORPCError } from "@orpc/server";
import { RoomState } from "@/states/room-states";
import {
  calculateTotal,
  createDeck,
  drawCard,
  isBlackjack,
} from "@/game-utils/game-utils";
import { BlackjackGame } from "@/interfaces/blackjack";

export function startGame(room: Room) {
  if (!room)
    throw new ORPCError("NOT_FOUND", { data: { message: "Room not found" } });

  // Initialiser dealerIndex si c'est la première manche
  if (room.dealerIndex === undefined) {
    room.dealerIndex = 0;
  }

  // S'assurer que dealerIndex est valide
  room.dealerIndex = room.dealerIndex % room.players.length;

  // Reset les joueurs
  room.players.forEach((player) => {
    player.hand = [];
    player.state = PlayerState.PLAYING;
    player.isDealer = false;
  });

  // Sélectionner le joueur qui sera la banque
  const dealerPlayer = room.players[room.dealerIndex];

  // Créer le joueur banque (dealer)
  const bank: Player = {
    ...dealerPlayer,
    isDealer: true,
    hand: [],
    state: PlayerState.WAITING,
  };

  // Les joueurs de la partie sont tous SAUF la banque
  const gamePlayers = room.players.filter(
    (p) => p.userId !== dealerPlayer.userId
  );

  // Initialiser currentGame avec la pioche
  room.currentGame = {
    id: randomUUID(),
    state: GameState.DEALING,
    players: gamePlayers,
    bank,
    deck: createDeck(), // Pioche créée ici
    currentPlayerIndex: 0,
    sessionId: room.id,
    bankHasDrawn: false, // La banque n'a pas encore tiré
  };

  room.state = RoomState.PLAYING;

  return room;
}

// Fonction qui prépare automatiquement les joueurs pour la prochaine partie si autoJoin est activé
export function startNextGameIfPossible(room: Room) {
  const readyPlayers = room.players.filter((p) => p.autoJoinNext);

  if (readyPlayers.length === 0) {
    room.state = RoomState.WAITING;
    room.currentGame = undefined;
    return;
  }

  room.players = readyPlayers.map((p) => ({
    ...p,
    hand: [],
    purchases: [],
    state: PlayerState.READY,
  }));

  startGame(room);
}

export function startBankTurn(game: BlackjackGame) {
  game.state = GameState.BANK_TURN;
  game.bank.state = PlayerState.PLAYING;
}

export function bankDrawCard(game: BlackjackGame) {
  if (game.state !== GameState.BANK_TURN) return;

  drawCard(game.deck, game.bank, false);
  game.bankHasDrawn = true; // La banque a tiré au moins une carte

  const total = calculateTotal(game.bank.hand);

  if (total > 21) {
    // La banque a perdu
    game.bank.state = PlayerState.BUST;
    game.state = GameState.RESOLUTION;
  }
}

export function bankDenouncePlayer(
  game: BlackjackGame,
  playerId: string
): { success: boolean; message?: string } {
  if (game.state !== GameState.BANK_TURN) {
    return { success: false, message: "Ce n'est pas le tour de la banque" };
  }

  // La banque doit avoir tiré au moins 1 carte avant de pouvoir dénoncer
  if (!game.bankHasDrawn) {
    return {
      success: false,
      message: "La banque doit tirer au moins une carte avant de dénoncer",
    };
  }

  const player = game.players.find((p) => p.userId === playerId);
  if (!player) {
    return { success: false, message: "Joueur non trouvé" };
  }

  // Joueur déjà dénoncé
  if (player.state === PlayerState.BUST || player.state === PlayerState.WIN) {
    return { success: false, message: "Joueur déjà dénoncé" };
  }

  // Révéler toutes les cartes du joueur dénoncé
  player.hand.forEach((card) => {
    card.hidden = false;
  });

  const bankTotal = calculateTotal(game.bank.hand);
  const playerTotal = calculateTotal(player.hand);

  const playerHasBlackjack = isBlackjack(player.hand);
  const bankHasBlackjack = isBlackjack(game.bank.hand);

  // Gestion du blackjack naturel
  if (playerHasBlackjack) {
    if (bankHasBlackjack) {
      // Égalité de blackjack → la banque gagne
      player.state = PlayerState.BUST;
    } else {
      // Le joueur a un blackjack, pas la banque → joueur gagne
      player.state = PlayerState.WIN;
    }
    return { success: true };
  }

  // Règles normales pour dénoncer :
  // - Joueur > 21 → BUST
  // - Joueur ≤ 21 mais ≤ banque → BUST (égalité = banque gagne)
  // - Joueur > banque et ≤ 21 → WIN
  if (playerTotal > 21) {
    player.state = PlayerState.BUST;
  } else if (playerTotal <= bankTotal) {
    player.state = PlayerState.BUST;
  } else {
    // Le joueur bat la banque
    player.state = PlayerState.WIN;
  }

  return { success: true };
}

export function endBankTurn(game: BlackjackGame) {
  if (game.state !== GameState.BANK_TURN) return;

  // La banque termine son tour
  game.state = GameState.RESOLUTION;

  // Tous les joueurs encore debout sont considérés pour la résolution
  game.players.forEach((player) => {
    if (player.state !== PlayerState.BUST) {
      player.state = PlayerState.PLAYING; // prêt pour le calcul des points
    }
  });

  // La banque ne joue plus
  game.bank.state = PlayerState.STAND;
}

export function resolveRound(game: BlackjackGame) {
  if (game.state !== GameState.RESOLUTION) return;

  const bankTotal = calculateTotal(game.bank.hand);
  const bankHasBlackjack = isBlackjack(game.bank.hand);

  game.players.forEach((player) => {
    // Si le joueur a déjà été dénoncé (BUST ou WIN), on ne change pas son état
    if (player.state === PlayerState.BUST || player.state === PlayerState.WIN) {
      return;
    }

    // Révéler toutes les cartes restantes pour la résolution
    player.hand.forEach((card) => {
      card.hidden = false;
    });

    const playerTotal = calculateTotal(player.hand);
    const playerHasBlackjack = isBlackjack(player.hand);

    if (playerTotal > 21) {
      player.state = PlayerState.BUST;
    } else if (playerHasBlackjack && !bankHasBlackjack) {
      // Blackjack naturel bat tout sauf blackjack de la banque
      player.state = PlayerState.WIN;
      player.sessionPoints += 50;
    } else if (bankTotal > 21) {
      // La banque a bust → le joueur gagne
      player.state = PlayerState.WIN;
      player.sessionPoints += 50;
    } else if (playerTotal > bankTotal) {
      // Le joueur bat la banque
      player.state = PlayerState.WIN;
      player.sessionPoints += 50;
    } else {
      // Le joueur perd contre la banque (égalité incluse)
      player.state = PlayerState.BUST;
    }
  });

  // Points de la banque pour les joueurs battus
  const losersCount = game.players.filter(
    (p) => p.state === PlayerState.BUST
  ).length;
  game.bank.sessionPoints += losersCount * 10;

  // Fin de la manche
  game.state = GameState.FINISHED;
}

// Fonction pour faire tourner le dealer à la fin d'une manche
export function rotateDealerIndex(room: Room) {
  room.dealerIndex = (room.dealerIndex + 1) % room.players.length;
}
