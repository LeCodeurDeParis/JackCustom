import { Server, Socket } from "socket.io";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";
import { RoomState } from "@/states/room-states";
import { GameState } from "@/states/game-states";
import {
  areAllPlayersDenounced,
  bankDenouncePlayer,
  bankDrawCard,
  endBankTurn,
  resolveRound,
  rotateDealerIndex,
  startGame,
} from "@/server/services/game-service";
import { drawCard, distributeInitialCards } from "@/game-utils/game-utils";
import {
  isBot,
  checkNextPlayer,
  executeBankBotTurn,
} from "@/server/services/bot-ai-service";

export const gameHandlers = (io: Server, socket: Socket) => {
  socket.on("game:start", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (socket.data.user.id !== room.hostId) {
      socket.emit("game:error", { message: "Only host can start the game" });
      return;
    }

    // Vérifier qu'il y a au moins 2 joueurs pour lancer une partie
    if (room.players.length < 2) {
      socket.emit("game:error", {
        message: "Il faut au moins 2 joueurs pour lancer une partie",
      });
      return;
    }

    startGame(room);

    io.to(roomId).emit("game:started", {
      redirect: "/game",
    });

    distributeInitialCards(room);

    io.to(roomId).emit("game:state", room.currentGame);
    io.to(roomId).emit("room:state", room);

    // Si le premier joueur est un bot, déclencher son tour automatiquement
    if (room.currentGame) {
      checkNextPlayer(room.currentGame, io, roomId);
    }
  });

  socket.on("player:set-ready", ({ roomId, ready }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === socket.data.user.id);
    if (!player) return;

    player.state = ready ? PlayerState.READY : PlayerState.WAITING;
    player.ready = ready;

    io.to(roomId).emit("room:state", room);
  });

  socket.on("player:set-autojoin", ({ roomId, autoJoinNext }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === socket.data.user.id);
    if (!player) return;

    player.autoJoinNext = autoJoinNext;

    io.to(roomId).emit("room:state", room);
  });

  socket.on("game:end", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Réinitialiser tous les joueurs proprement
    room.players.forEach((p) => {
      p.hand = [];
      // Les bots (test-*) sont toujours ready, les humains dépendent de autoJoinNext
      const isTestPlayer = p.userId.startsWith("test-");
      if (isTestPlayer) {
        p.state = PlayerState.READY;
        p.ready = true;
      } else {
        p.state = p.autoJoinNext ? PlayerState.READY : PlayerState.WAITING;
        p.ready = p.autoJoinNext;
      }
      // Réinitialiser les flags d'effets boutique
      p.forceVisibleDraw = undefined;
      p.forceHiddenDraw = undefined;
      p.immuneToForceDraw = undefined;
      p.frozenHand = undefined;
    });

    room.currentGame = undefined;
    room.state = RoomState.WAITING;

    io.to(roomId).emit("room:state", room);
    io.to(roomId).emit("game:ended", room);
  });

  socket.on("game:action", ({ roomId, action, options }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    const game = room.currentGame;
    const currentPlayer = game.players[game.currentPlayerIndex];

    if (currentPlayer.userId !== socket.data.user.id) {
      socket.emit("game:error", { message: "Not your turn" });
      return;
    }

    // Vérifier si le joueur a la main figée (effet boutique)
    if (currentPlayer.frozenHand) {
      socket.emit("game:error", {
        message: "Votre main est figée ! Attendez que la banque vous dénonce.",
      });
      return;
    }

    // Vérifier si un choix "Dose au choix" est en attente
    if (
      game.pendingDoseChoice &&
      game.pendingDoseChoice.userId === currentPlayer.userId
    ) {
      socket.emit("game:error", {
        message: "Vous devez d'abord choisir une carte (Dose au choix)",
      });
      return;
    }

    switch (action) {
      case "hit": {
        let wantsHidden = options?.hidden === true;

        // Effet boutique: forceVisibleDraw (À la tienne)
        if (currentPlayer.forceVisibleDraw) {
          wantsHidden = false; // Force la carte visible
          currentPlayer.forceVisibleDraw = undefined; // Consommer l'effet
        }

        // Effet boutique: forceHiddenDraw (Encore un)
        if (currentPlayer.forceHiddenDraw) {
          wantsHidden = true; // Force la carte cachée
          currentPlayer.forceHiddenDraw = undefined; // Consommer l'effet
        }

        // Si le joueur veut une carte cachée, il doit d'abord révéler sa carte cachée actuelle
        if (wantsHidden) {
          const hasHiddenCard = currentPlayer.hand.some((card) => card.hidden);
          if (hasHiddenCard) {
            // Révéler la carte cachée existante avant de tirer
            currentPlayer.hand.forEach((card) => {
              if (card.hidden) card.hidden = false;
            });
          }
        }

        drawCard(game.deck, currentPlayer, wantsHidden);
        break;
      }

      case "stand": {
        // Effet boutique: forceVisibleDraw empêche le stand (sauf dernier joueur)
        const isLastPlayer =
          game.currentPlayerIndex === game.players.length - 1;
        if (currentPlayer.forceVisibleDraw && !isLastPlayer) {
          socket.emit("game:error", {
            message:
              "Vous devez piocher ! (effet À la tienne - stand impossible)",
          });
          return;
        }

        currentPlayer.state = PlayerState.STAND;
        // Consommer l'effet si le joueur est le dernier
        if (currentPlayer.forceVisibleDraw) {
          currentPlayer.forceVisibleDraw = undefined;
        }
        game.currentPlayerIndex++;

        if (game.currentPlayerIndex >= game.players.length) {
          game.state = GameState.BANK_TURN;
        }
        break;
      }

      default:
        socket.emit("game:error", { message: "Unknown action" });
        return;
    }

    io.to(roomId).emit("game:state", game);

    // Si le prochain joueur est un bot, déclencher son tour
    // Ou si c'est le tour de la banque bot
    checkNextPlayer(game, io, roomId);
  });

  // Révéler sa propre carte cachée
  socket.on("player:reveal-hidden", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    const player = room.currentGame.players.find(
      (p) => p.userId === socket.data.user.id
    );

    if (!player) {
      socket.emit("game:error", { message: "Joueur non trouvé" });
      return;
    }

    // Révéler toutes les cartes cachées du joueur
    let revealed = false;
    player.hand.forEach((card) => {
      if (card.hidden) {
        card.hidden = false;
        revealed = true;
      }
    });

    if (revealed) {
      io.to(roomId).emit("game:state", room.currentGame);
    }
  });

  socket.on("bank:draw", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    // Vérifier que c'est bien la banque qui tire
    if (socket.data.user.id !== room.currentGame.bank.userId) {
      socket.emit("game:error", { message: "Seule la banque peut tirer" });
      return;
    }

    const result = bankDrawCard(room.currentGame);

    if (!result.success) {
      socket.emit("game:error", { message: result.message });
      return;
    }

    io.to(roomId).emit("game:state", room.currentGame);
  });

  socket.on("bank:denounce", ({ roomId, playerId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    const game = room.currentGame;

    // Vérifier que c'est bien la banque qui dénonce
    if (socket.data.user.id !== game.bank.userId) {
      socket.emit("game:error", { message: "Seule la banque peut dénoncer" });
      return;
    }

    const result = bankDenouncePlayer(game, playerId);

    if (!result.success) {
      socket.emit("game:error", { message: result.message });
      return;
    }

    // Débloquer la main figée du joueur dénoncé (effet boutique)
    const denouncedPlayer = game.players.find((p) => p.userId === playerId);
    if (denouncedPlayer?.frozenHand) {
      denouncedPlayer.frozenHand = undefined;
    }

    // Consommer l'effet "Dernier appel" si actif
    if (game.forceDenounceAtStart) {
      game.forceDenounceAtStart = undefined;
    }

    // Si tous les joueurs ont été dénoncés, terminer automatiquement le tour
    if (areAllPlayersDenounced(game)) {
      endBankTurn(game);
    }

    io.to(roomId).emit("game:state", game);
  });

  socket.on("bank:end-turn", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    const game = room.currentGame;

    // Vérifier que c'est bien la banque qui termine
    if (socket.data.user.id !== game.bank.userId) {
      socket.emit("game:error", {
        message: "Seule la banque peut terminer son tour",
      });
      return;
    }

    // Bloquer si "Dernier appel" est actif
    if (game.forceDenounceAtStart) {
      socket.emit("game:error", {
        message: "Dernier appel ! Vous devez d'abord dénoncer un joueur",
      });
      return;
    }

    endBankTurn(game);

    io.to(roomId).emit("game:state", game);
  });

  socket.on("game:resolve-round", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    // Permettre à n'importe qui de résoudre si la banque est un bot
    const isBankBot = room.currentGame.bank.userId.startsWith("test-");
    const isBank = socket.data.user.id === room.currentGame.bank.userId;

    if (!isBankBot && !isBank) {
      socket.emit("game:error", {
        message: "Seule la banque peut résoudre la manche",
      });
      return;
    }

    resolveRound(room.currentGame, room);

    // Faire tourner le dealer pour la prochaine manche
    rotateDealerIndex(room);

    io.to(roomId).emit("game:state", room.currentGame);
    io.to(roomId).emit("room:state", room);

    // Vérifier si tous les joueurs ont l'auto-join activé (ou sont des bots)
    const allHaveAutoJoin = room.players.every(
      (p) => p.autoJoinNext || p.userId.startsWith("test-")
    );

    if (allHaveAutoJoin && room.players.length >= 2) {
      // Lancer le countdown d'auto-replay
      let countdown = 3;
      io.to(roomId).emit("game:auto-replay-countdown", { countdown });

      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          io.to(roomId).emit("game:auto-replay-countdown", { countdown });
        } else {
          clearInterval(countdownInterval);
          io.to(roomId).emit("game:auto-replay-countdown", { countdown: null });

          // Relancer la partie automatiquement
          const currentRoom = rooms.get(roomId);
          if (!currentRoom) return;

          // Réinitialiser les joueurs
          currentRoom.players.forEach((p) => {
            p.hand = [];
            p.state = PlayerState.READY;
            p.ready = true;
            p.forceVisibleDraw = undefined;
            p.forceHiddenDraw = undefined;
            p.immuneToForceDraw = undefined;
            p.frozenHand = undefined;
          });

          // Lancer la nouvelle partie
          startGame(currentRoom);
          distributeInitialCards(currentRoom);

          io.to(roomId).emit("game:state", currentRoom.currentGame);
          io.to(roomId).emit("room:state", currentRoom);

          // Si le premier joueur est un bot, déclencher son tour
          if (currentRoom.currentGame) {
            checkNextPlayer(currentRoom.currentGame, io, roomId);
          }
        }
      }, 1000);
    }
  });

  // Rejouer une manche (sans passer par la room)
  socket.on("game:replay", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Seule la banque actuelle, le host, ou n'importe qui si la banque est un bot peut relancer
    const isBank = room.currentGame?.bank.userId === socket.data.user.id;
    const isHost = socket.data.user.id === room.hostId;
    const isBankBot = room.currentGame?.bank.userId.startsWith("test-");

    if (!isBank && !isHost && !isBankBot) {
      socket.emit("game:error", {
        message: "Seule la banque ou le host peut relancer",
      });
      return;
    }

    // L'utilisateur qui lance le replay
    const replayInitiatorId = socket.data.user.id;

    // Réinitialiser les joueurs selon leur préférence autoJoin
    room.players.forEach((p) => {
      p.hand = [];
      // Les bots (test-*) sont toujours ready
      // Les humains sont ready s'ils ont autoJoinNext OU s'ils sont l'initiateur du replay
      const isBot = p.userId.startsWith("test-");
      const isInitiator = p.userId === replayInitiatorId;
      if (isBot || p.autoJoinNext || isInitiator) {
        p.state = PlayerState.READY;
        p.ready = true;
      } else {
        p.state = PlayerState.WAITING;
        p.ready = false;
      }
      // Réinitialiser les flags d'effets boutique
      p.forceVisibleDraw = undefined;
      p.forceHiddenDraw = undefined;
      p.immuneToForceDraw = undefined;
      p.frozenHand = undefined;
    });

    // Vérifier qu'il y a assez de joueurs ready pour lancer (minimum 2)
    const readyCount = room.players.filter((p) => p.ready).length;
    if (readyCount < 2) {
      socket.emit("game:error", {
        message: "Pas assez de joueurs avec auto-join activé (minimum 2)",
      });
      room.state = RoomState.WAITING;
      room.currentGame = undefined;
      io.to(roomId).emit("room:state", room);
      return;
    }

    // Lancer la nouvelle partie
    startGame(room);
    distributeInitialCards(room);

    io.to(roomId).emit("game:state", room.currentGame);
    io.to(roomId).emit("room:state", room);

    // Si le premier joueur est un bot, déclencher son tour
    if (room.currentGame) {
      checkNextPlayer(room.currentGame, io, roomId);
    }
  });

  // Quitter la partie (seul le joueur qui appelle quitte)
  socket.on("game:leave", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const userId = socket.data.user.id;

    // Retirer le joueur de la partie en cours s'il y en a une
    if (room.currentGame) {
      // Retirer des joueurs du jeu
      room.currentGame.players = room.currentGame.players.filter(
        (p) => p.userId !== userId
      );

      // Si c'était la banque qui quitte, on doit gérer ce cas
      if (room.currentGame.bank.userId === userId) {
        // La banque quitte - terminer la partie
        room.state = RoomState.WAITING;
        room.currentGame = undefined;
        io.to(roomId).emit("game:ended", room);
        io.to(roomId).emit("room:state", room);
      } else {
        // Simple joueur qui quitte - mettre à jour l'état
        io.to(roomId).emit("game:state", room.currentGame);
      }
    }

    // Mettre le joueur en état WAITING dans la room (il reste dans la room)
    const roomPlayer = room.players.find((p) => p.userId === userId);
    if (roomPlayer) {
      roomPlayer.state = PlayerState.WAITING;
      roomPlayer.ready = false;
      roomPlayer.hand = [];
    }

    // Quitter la socket room du jeu mais pas la room principale
    socket.leave(`game:${roomId}`);

    io.to(roomId).emit("room:state", room);
  });

  // DEBUG: Donner des points (à retirer en production)
  socket.on("debug:give-points", ({ roomId, points }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    const userId = socket.data.user.id;
    const game = room.currentGame;

    // Trouver le joueur dans le jeu
    const gamePlayer =
      game.players.find((p) => p.userId === userId) ||
      (game.bank.userId === userId ? game.bank : null);

    // Trouver le joueur dans la room
    const roomPlayer = room.players.find((p) => p.userId === userId);

    if (gamePlayer) {
      gamePlayer.sessionPoints += points;
    }
    if (roomPlayer) {
      roomPlayer.sessionPoints += points;
    }

    io.to(roomId).emit("game:state", game);
    io.to(roomId).emit("room:state", room);
  });
};
