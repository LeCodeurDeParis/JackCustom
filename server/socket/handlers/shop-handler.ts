import { Server, Socket } from "socket.io";
import { rooms } from "@/server/storage/rooms";
import { getShopItemById } from "@/server/data/shop-items";
import { randomUUID } from "crypto";
import {
  applyVisionAlteree,
  applyPauseLucide,
  applyDoseAuChoix,
  applyALaTienne,
  applyEncoreUn,
  applyDoublePioche,
  applyMainFigee,
  applyDernierAppel,
} from "@/server/services/shop-effect-service";

export const shopHandlers = (io: Server, socket: Socket) => {
  // Achat d'un item boutique
  socket.on("shop:buy", ({ roomId, itemId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("shop:error", { message: "Room non trouvée" });
      return;
    }

    if (!room.currentGame) {
      socket.emit("shop:error", { message: "Aucune partie en cours" });
      return;
    }

    const game = room.currentGame;
    const userId = socket.data.user.id;

    // Trouver le joueur acheteur
    const buyer =
      game.players.find((p) => p.userId === userId) ||
      (game.bank.userId === userId ? game.bank : null);

    if (!buyer) {
      socket.emit("shop:error", { message: "Joueur non trouvé" });
      return;
    }

    // Vérifier que l'item existe
    const item = getShopItemById(itemId);
    if (!item) {
      socket.emit("shop:error", { message: "Item non trouvé" });
      return;
    }

    // Vérifier que l'item est activé dans les settings
    if (!room.settings.enabledShopItems.includes(itemId)) {
      socket.emit("shop:error", { message: "Item désactivé pour cette partie" });
      return;
    }

    // Vérifier les points
    if (buyer.sessionPoints < item.cost) {
      socket.emit("shop:error", { message: "Points insuffisants" });
      return;
    }

    // Vérifier la cible si nécessaire
    let target = null;
    if (item.targetType === "PLAYER") {
      if (!targetUserId) {
        socket.emit("shop:error", { message: "Cible requise" });
        return;
      }
      target = game.players.find((p) => p.userId === targetUserId);
      if (!target) {
        socket.emit("shop:error", { message: "Cible non trouvée" });
        return;
      }
      if (target.userId === userId) {
        socket.emit("shop:error", {
          message: "Vous ne pouvez pas vous cibler vous-même avec un malus",
        });
        return;
      }
    } else if (item.targetType === "BANK") {
      target = game.bank;
    } else if (item.targetType === "SELF") {
      target = buyer;
    }

    // Déduire les points
    buyer.sessionPoints -= item.cost;

    // Synchroniser les points avec room.players
    const roomPlayer = room.players.find((p) => p.userId === buyer.userId);
    if (roomPlayer) {
      roomPlayer.sessionPoints = buyer.sessionPoints;
    }

    // Appliquer l'effet
    let effectMessage = "";
    switch (itemId) {
      case "vision-alteree":
        effectMessage = applyVisionAlteree(game);
        break;
      case "pause-lucide":
        effectMessage = applyPauseLucide(buyer);
        break;
      case "dose-au-choix":
        effectMessage = applyDoseAuChoix(game, buyer);
        break;
      case "a-la-tienne":
        if (target) effectMessage = applyALaTienne(target);
        break;
      case "encore-un":
        if (target) effectMessage = applyEncoreUn(target);
        break;
      case "double-pioche":
        if (target) effectMessage = applyDoublePioche(game, target);
        break;
      case "main-figee":
        if (target) effectMessage = applyMainFigee(target);
        break;
      case "dernier-appel":
        effectMessage = applyDernierAppel(game);
        break;
    }

    // Ajouter au log
    const targetName = target?.username || "";
    const logMessage =
      item.targetType === "NONE" || item.targetType === "SELF"
        ? `${buyer.username} a utilisé "${item.name}"`
        : `${buyer.username} a utilisé "${item.name}" sur ${targetName}`;

    if (!room.logs) room.logs = [];
    room.logs.push({
      id: randomUUID(),
      type: "shop",
      message: logMessage,
      timestamp: Date.now(),
      playerId: buyer.userId,
      playerName: buyer.username,
    });

    // Ajouter l'effet au log si présent
    if (effectMessage) {
      room.logs.push({
        id: randomUUID(),
        type: "game",
        message: effectMessage,
        timestamp: Date.now(),
      });
    }

    // Ajouter à l'historique des achats du joueur
    buyer.purchases.push({
      itemId,
      targetUserId,
      timestamp: Date.now(),
    });

    // Emettre les états mis à jour
    io.to(roomId).emit("shop:purchased", {
      buyerId: buyer.userId,
      buyerName: buyer.username,
      itemId,
      itemName: item.name,
      targetUserId,
      targetName,
      effectMessage,
    });
    io.to(roomId).emit("game:state", game);
    io.to(roomId).emit("room:state", room);
  });

  // Choix de carte pour "Dose au choix"
  socket.on("shop:dose-choice", ({ roomId, cardIndex }) => {
    const room = rooms.get(roomId);
    if (!room?.currentGame) {
      socket.emit("shop:error", { message: "Partie non trouvée" });
      return;
    }

    const game = room.currentGame;
    const userId = socket.data.user.id;

    // Vérifier qu'il y a un choix en attente pour ce joueur
    if (!game.pendingDoseChoice || game.pendingDoseChoice.userId !== userId) {
      socket.emit("shop:error", { message: "Aucun choix en attente" });
      return;
    }

    if (cardIndex < 0 || cardIndex >= game.pendingDoseChoice.cards.length) {
      socket.emit("shop:error", { message: "Index de carte invalide" });
      return;
    }

    // Trouver le joueur
    const player = game.players.find((p) => p.userId === userId);
    if (!player) {
      socket.emit("shop:error", { message: "Joueur non trouvé" });
      return;
    }

    // Ajouter la carte choisie à la main du joueur
    const chosenCard = game.pendingDoseChoice.cards[cardIndex];
    chosenCard.hidden = false;
    player.hand.push(chosenCard);

    // Remettre l'autre carte dans le deck (à la fin)
    const otherCardIndex = cardIndex === 0 ? 1 : 0;
    const otherCard = game.pendingDoseChoice.cards[otherCardIndex];
    game.deck.push(otherCard);

    // Effacer le choix en attente
    game.pendingDoseChoice = undefined;

    // Log
    if (!room.logs) room.logs = [];
    room.logs.push({
      id: randomUUID(),
      type: "game",
      message: `${player.username} a choisi une carte (Dose au choix)`,
      timestamp: Date.now(),
    });

    io.to(roomId).emit("game:state", game);
    io.to(roomId).emit("room:state", room);
  });
};



