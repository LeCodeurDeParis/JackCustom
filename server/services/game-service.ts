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

  // Ne prendre que les joueurs qui sont ready
  const readyPlayers = room.players.filter((p) => p.ready);

  // Initialiser dealerIndex si c'est la première manche
  if (room.dealerIndex === undefined) {
    room.dealerIndex = 0;
  }

  // S'assurer que dealerIndex est valide parmi les joueurs ready
  room.dealerIndex = room.dealerIndex % readyPlayers.length;

  // Reset les joueurs ready
  readyPlayers.forEach((player) => {
    player.hand = [];
    player.state = PlayerState.PLAYING;
    player.isDealer = false;
  });

  // Sélectionner le joueur qui sera la banque parmi les joueurs ready
  const dealerPlayer = readyPlayers[room.dealerIndex];

  // Créer le joueur banque (dealer)
  const bank: Player = {
    ...dealerPlayer,
    isDealer: true,
    hand: [],
    state: PlayerState.WAITING,
  };

  // Les joueurs de la partie sont les joueurs ready SAUF la banque
  const gamePlayers = readyPlayers.filter(
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

// Vérifie si tous les joueurs ont été dénoncés
export function areAllPlayersDenounced(game: BlackjackGame): boolean {
  return game.players.every(
    (p) => p.state === PlayerState.BUST || p.state === PlayerState.WIN
  );
}

export function bankDrawCard(game: BlackjackGame): {
  success: boolean;
  message?: string;
} {
  if (game.state !== GameState.BANK_TURN) {
    return { success: false, message: "Ce n'est pas le tour de la banque" };
  }

  // Bloquer le tirage si "Dernier appel" est actif (la banque doit d'abord dénoncer)
  if (game.forceDenounceAtStart) {
    return {
      success: false,
      message: "Dernier appel ! Vous devez d'abord dénoncer un joueur",
    };
  }

  // Vérifier si tous les joueurs sont dénoncés
  if (areAllPlayersDenounced(game)) {
    return { success: false, message: "Tous les joueurs ont été dénoncés" };
  }

  drawCard(game.deck, game.bank, false);
  game.bankHasDrawn = true; // La banque a tiré au moins une carte

  const total = calculateTotal(game.bank.hand);

  if (total > 21) {
    // La banque a perdu
    game.bank.state = PlayerState.BUST;
    game.state = GameState.RESOLUTION;
  }

  return { success: true };
}

export function bankDenouncePlayer(
  game: BlackjackGame,
  playerId: string
): { success: boolean; message?: string } {
  if (game.state !== GameState.BANK_TURN) {
    return { success: false, message: "Ce n'est pas le tour de la banque" };
  }

  // La banque doit avoir tiré au moins 1 carte avant de pouvoir dénoncer
  // SAUF si l'effet "Dernier appel" est actif
  if (!game.bankHasDrawn && !game.forceDenounceAtStart) {
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

export function resolveRound(game: BlackjackGame, room: Room) {
  if (game.state !== GameState.RESOLUTION) return;

  const bankTotal = calculateTotal(game.bank.hand);
  const bankHasBlackjack = isBlackjack(game.bank.hand);
  const bankBusted = bankTotal > 21;

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

    if (bankBusted) {
      player.state = PlayerState.WIN;
      player.sessionPoints += 50;
    } else if (playerHasBlackjack && !bankHasBlackjack) {
      // Blackjack naturel bat tout sauf blackjack de la banque
      player.state = PlayerState.WIN;
      player.sessionPoints += 50;
    } else if (playerTotal > 21) {
      // Le joueur a bust (et la banque n'a pas bust)
      player.state = PlayerState.BUST;
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

  // Synchroniser les points avec les joueurs de la room
  syncPointsToRoom(game, room);

  // Fin de la manche
  game.state = GameState.FINISHED;
}

// Synchronise les points du jeu vers les joueurs de la room
function syncPointsToRoom(game: BlackjackGame, room: Room) {
  // Synchroniser les points des joueurs
  game.players.forEach((gamePlayer) => {
    const roomPlayer = room.players.find((p) => p.userId === gamePlayer.userId);
    if (roomPlayer) {
      roomPlayer.sessionPoints = gamePlayer.sessionPoints;
    }
  });

  // Synchroniser les points de la banque
  const bankInRoom = room.players.find((p) => p.userId === game.bank.userId);
  if (bankInRoom) {
    bankInRoom.sessionPoints = game.bank.sessionPoints;
  }
}

// Fonction pour faire tourner le dealer à la fin d'une manche
export function rotateDealerIndex(room: Room) {
  room.dealerIndex = (room.dealerIndex + 1) % room.players.length;
}
