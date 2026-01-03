import { Server } from "socket.io";
import { BlackjackGame } from "@/interfaces/blackjack";
import { Player } from "@/interfaces/player";
import { Card } from "@/interfaces/card";
import { PlayerState } from "@/states/player-states";
import { GameState } from "@/states/game-states";
import {
  calculateTotal,
  calculateVisibleTotal,
  hasHiddenCard,
  drawCard,
} from "@/game-utils/game-utils";
import {
  areAllPlayersDenounced,
  bankDrawCard,
  bankDenouncePlayer,
  endBankTurn,
} from "./game-service";

// Délai entre les actions des bots (1-2 secondes pour le réalisme)
function getRandomDelay(): number {
  return 1000 + Math.random() * 1000;
}

// Récupère la carte visible de la banque
export function getBankVisibleCard(game: BlackjackGame): Card | null {
  const visibleCards = game.bank.hand.filter((card) => !card.hidden);
  return visibleCards[0] || null;
}

// Vérifie si un joueur est un bot
export function isBot(player: Player): boolean {
  return player.userId.startsWith("test-");
}

// Détermine si le bot devrait tirer une carte
export function shouldBotHit(
  player: Player,
  bankVisibleCard: Card | null
): boolean {
  const total = calculateTotal(player.hand);

  // Total <= 11 : toujours tirer (pas de risque de bust)
  if (total <= 11) {
    return true;
  }

  // Total >= 17 : toujours rester
  if (total >= 17) {
    return false;
  }

  // Total 12-16 : dépend de la carte visible de la banque
  if (bankVisibleCard) {
    const bankValue = bankVisibleCard.value === 1 ? 11 : bankVisibleCard.value;
    // Si la banque montre 7+ (danger), on tire
    if (bankValue >= 7) {
      return true;
    }
  }

  // Par défaut, on reste si total 12-16 et banque montre <= 6
  return false;
}

// Détermine si le bot devrait tirer une carte cachée
export function shouldBotHitHidden(player: Player): boolean {
  // Le bot tire une carte cachée s'il n'en a pas et a un total <= 14
  // (stratégie : garder une marge de manœuvre)
  if (hasHiddenCard(player.hand)) {
    return false; // Déjà une carte cachée
  }

  const total = calculateTotal(player.hand);
  // Tire cachée si total <= 14 (assez bas pour risquer une carte mystère)
  return total <= 14;
}

// Exécute le tour d'un bot joueur
export async function executeBotTurn(
  game: BlackjackGame,
  io: Server,
  roomId: string
): Promise<void> {
  const currentPlayer = game.players[game.currentPlayerIndex];

  if (!currentPlayer || !isBot(currentPlayer)) {
    return;
  }

  const bankVisibleCard = getBankVisibleCard(game);

  // Boucle de jeu du bot
  const playTurn = async () => {
    // Vérifier si le joueur a bust
    const total = calculateTotal(currentPlayer.hand);
    if (total > 21) {
      currentPlayer.state = PlayerState.STAND;
      game.currentPlayerIndex++;
      if (game.currentPlayerIndex >= game.players.length) {
        game.state = GameState.BANK_TURN;
      }
      io.to(roomId).emit("game:state", game);

      // Vérifier si le prochain joueur est aussi un bot
      await checkNextPlayer(game, io, roomId);
      return;
    }

    // Décider de l'action
    if (shouldBotHit(currentPlayer, bankVisibleCard)) {
      // Décider si on tire visible ou cachée
      const wantsHidden = shouldBotHitHidden(currentPlayer);

      // Si on veut une carte cachée mais on en a déjà une, révéler d'abord
      if (wantsHidden && hasHiddenCard(currentPlayer.hand)) {
        currentPlayer.hand.forEach((card) => {
          if (card.hidden) card.hidden = false;
        });
      }

      drawCard(game.deck, currentPlayer, wantsHidden);
      io.to(roomId).emit("game:state", game);

      // Continuer à jouer après un délai
      setTimeout(playTurn, getRandomDelay());
    } else {
      // Stand
      currentPlayer.state = PlayerState.STAND;
      game.currentPlayerIndex++;

      if (game.currentPlayerIndex >= game.players.length) {
        game.state = GameState.BANK_TURN;
      }

      io.to(roomId).emit("game:state", game);

      // Vérifier si le prochain joueur est aussi un bot
      await checkNextPlayer(game, io, roomId);
    }
  };

  // Démarrer le tour avec un délai
  setTimeout(playTurn, getRandomDelay());
}

// Vérifie si le prochain joueur est un bot et exécute son tour
export async function checkNextPlayer(
  game: BlackjackGame,
  io: Server,
  roomId: string
): Promise<void> {
  // Si c'est le tour de la banque
  if (game.state === GameState.BANK_TURN) {
    if (isBot(game.bank)) {
      setTimeout(() => executeBankBotTurn(game, io, roomId), getRandomDelay());
    }
    return;
  }

  // Si c'est encore le tour des joueurs
  if (
    game.state === GameState.PLAYER_TURNS &&
    game.currentPlayerIndex < game.players.length
  ) {
    const nextPlayer = game.players[game.currentPlayerIndex];
    if (nextPlayer && isBot(nextPlayer)) {
      executeBotTurn(game, io, roomId);
    }
  }
}

// Détermine si la banque bot devrait dénoncer un joueur
export function shouldBankDenounce(
  game: BlackjackGame,
  player: Player
): boolean {
  const bankTotal = calculateTotal(game.bank.hand);
  const playerVisibleTotal = calculateVisibleTotal(player.hand);

  // Ne pas dénoncer les joueurs déjà résolus
  if (
    player.state === PlayerState.BUST ||
    player.state === PlayerState.WIN ||
    player.state === PlayerState.STAND
  ) {
    // STAND signifie déjà dénoncé dans ce contexte
    if (player.hand.every((card) => !card.hidden)) {
      return false; // Déjà dénoncé (toutes cartes visibles)
    }
  }

  // Stratégie de dénonciation :
  // 1. Si le total visible du joueur est <= au total de la banque, dénoncer
  if (playerVisibleTotal <= bankTotal) {
    return true;
  }

  // 2. Si le total visible est élevé (16+), risque de bust caché, dénoncer
  if (playerVisibleTotal >= 16) {
    return Math.random() > 0.3; // 70% de chance de dénoncer
  }

  // 3. Si la banque a un bon score (18+), être plus agressif
  if (bankTotal >= 18 && playerVisibleTotal <= bankTotal + 2) {
    return true;
  }

  return false;
}

// Trouve un joueur à dénoncer (avec stratégie)
function findPlayerToDenounce(game: BlackjackGame): Player | null {
  for (const player of game.players) {
    // Vérifier si le joueur a encore des cartes cachées (pas encore dénoncé)
    if (hasHiddenCard(player.hand) && shouldBankDenounce(game, player)) {
      return player;
    }
  }
  return null;
}

// Trouve N'IMPORTE QUEL joueur à dénoncer (pour "Dernier appel")
function findAnyPlayerToDenounce(game: BlackjackGame): Player | null {
  for (const player of game.players) {
    // Trouver le premier joueur qui n'a pas encore été dénoncé
    if (player.state !== PlayerState.BUST && player.state !== PlayerState.WIN) {
      return player;
    }
  }
  return null;
}

// Exécute le tour de la banque bot
export async function executeBankBotTurn(
  game: BlackjackGame,
  io: Server,
  roomId: string
): Promise<void> {
  if (!isBot(game.bank)) {
    return;
  }

  const playBankTurn = async () => {
    // Vérifier si le jeu est déjà en résolution (tous dénoncés)
    if ((game.state as GameState) === GameState.RESOLUTION) {
      io.to(roomId).emit("game:state", game);
      return;
    }

    // Phase 0: Effet "Dernier appel" - doit dénoncer immédiatement
    if (game.forceDenounceAtStart) {
      const playerToDenounce = findAnyPlayerToDenounce(game);
      if (playerToDenounce) {
        bankDenouncePlayer(game, playerToDenounce.userId);
      }
      // Consommer l'effet même si aucun joueur trouvé
      game.forceDenounceAtStart = undefined;

      // Vérifier si tous les joueurs sont dénoncés (fin automatique)
      if (areAllPlayersDenounced(game)) {
        endBankTurn(game);
      }

      io.to(roomId).emit("game:state", game);

      // Continuer à jouer si pas en résolution
      if ((game.state as GameState) !== GameState.RESOLUTION) {
        setTimeout(playBankTurn, getRandomDelay());
      }
      return;
    }

    const bankTotal = calculateTotal(game.bank.hand);

    // Vérifier si la banque a bust
    if (bankTotal > 21) {
      endBankTurn(game);
      io.to(roomId).emit("game:state", game);
      return;
    }

    // Phase 1: Tirer des cartes jusqu'à 17+ (seulement si pas tous dénoncés)
    if (bankTotal < 17 && !areAllPlayersDenounced(game)) {
      const result = bankDrawCard(game);
      io.to(roomId).emit("game:state", game);

      // Si la banque a bust après avoir tiré, le jeu passe en résolution
      if ((game.state as GameState) === GameState.RESOLUTION) {
        return;
      }

      if (result.success) {
        setTimeout(playBankTurn, getRandomDelay());
      }
      return;
    }

    // Phase 2: Dénoncer des joueurs (seulement si la banque a tiré au moins une carte)
    if (game.bankHasDrawn) {
      const playerToDenounce = findPlayerToDenounce(game);
      if (playerToDenounce) {
        bankDenouncePlayer(game, playerToDenounce.userId);

        // Vérifier si tous les joueurs sont dénoncés (fin automatique)
        if (areAllPlayersDenounced(game)) {
          endBankTurn(game);
        }

        io.to(roomId).emit("game:state", game);

        // Si pas encore en résolution, continuer à jouer
        if ((game.state as GameState) !== GameState.RESOLUTION) {
          setTimeout(playBankTurn, getRandomDelay());
        }
        return;
      }
    }

    // Phase 3: Terminer le tour
    endBankTurn(game);
    io.to(roomId).emit("game:state", game);
  };

  // Démarrer le tour de la banque avec un délai
  setTimeout(playBankTurn, getRandomDelay());
}
