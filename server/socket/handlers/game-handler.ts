import { Server, Socket } from "socket.io";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";
import { RoomState } from "@/states/room-states";
import { GameState } from "@/states/game-states";
import {
  bankDenouncePlayer,
  bankDrawCard,
  endBankTurn,
  resolveRound,
  rotateDealerIndex,
  startGame,
} from "@/server/services/game-service";
import { drawCard, distributeInitialCards } from "@/game-utils/game-utils";

export const gameHandlers = (io: Server, socket: Socket) => {
  socket.on("game:start", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (socket.data.user.id !== room.hostId) {
      socket.emit("game:error", { message: "Only host can start the game" });
      return;
    }

    startGame(room);

    io.to(roomId).emit("game:started", {
      redirect: "/game",
    });

    distributeInitialCards(room);

    io.to(roomId).emit("game:state", room.currentGame);
    io.to(roomId).emit("room:state", room);
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

    room.players.forEach((p) => {
      p.state = p.autoJoinNext ? PlayerState.READY : PlayerState.WAITING;
      p.hand = [];
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

    switch (action) {
      case "hit": {
        const wantsHidden = options?.hidden === true;

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
        currentPlayer.state = PlayerState.STAND;
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
  });

  socket.on("bank:draw", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    // Vérifier que c'est bien la banque qui tire
    if (socket.data.user.id !== room.currentGame.bank.userId) {
      socket.emit("game:error", { message: "Seule la banque peut tirer" });
      return;
    }

    bankDrawCard(room.currentGame);

    io.to(roomId).emit("game:state", room.currentGame);
  });

  socket.on("bank:denounce", ({ roomId, playerId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    // Vérifier que c'est bien la banque qui dénonce
    if (socket.data.user.id !== room.currentGame.bank.userId) {
      socket.emit("game:error", { message: "Seule la banque peut dénoncer" });
      return;
    }

    const result = bankDenouncePlayer(room.currentGame, playerId);

    if (!result.success) {
      socket.emit("game:error", { message: result.message });
      return;
    }

    io.to(roomId).emit("game:state", room.currentGame);
  });

  socket.on("bank:end-turn", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    // Vérifier que c'est bien la banque qui termine
    if (socket.data.user.id !== room.currentGame.bank.userId) {
      socket.emit("game:error", {
        message: "Seule la banque peut terminer son tour",
      });
      return;
    }

    endBankTurn(room.currentGame);

    io.to(roomId).emit("game:state", room.currentGame);
  });

  socket.on("game:resolve-round", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) return;

    resolveRound(room.currentGame);

    // Faire tourner le dealer pour la prochaine manche
    rotateDealerIndex(room);

    io.to(roomId).emit("game:state", room.currentGame);
    io.to(roomId).emit("room:state", room);
  });
};
