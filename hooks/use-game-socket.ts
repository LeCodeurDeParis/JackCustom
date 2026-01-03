"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BlackjackGame } from "@/interfaces/blackjack";
import { Room } from "@/interfaces/room";
import { RoomLog } from "@/interfaces/room-settings";

interface ShopPurchaseEvent {
  buyerId: string;
  buyerName: string;
  itemId: string;
  itemName: string;
  targetUserId?: string;
  targetName?: string;
  effectMessage?: string;
}

interface UseGameSocketOptions {
  roomId: string;
  onGameState?: (game: BlackjackGame) => void;
  onRoomState?: (room: Room) => void;
  onGameEnded?: (room: Room) => void;
  onError?: (error: { message: string }) => void;
  onShopPurchase?: (event: ShopPurchaseEvent) => void;
  onShopError?: (error: { message: string }) => void;
  onChatMessage?: (log: RoomLog) => void;
}

export function useGameSocket({
  roomId,
  onGameState,
  onRoomState,
  onGameEnded,
  onError,
  onShopPurchase,
  onShopError,
  onChatMessage,
}: UseGameSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs pour les callbacks
  const onGameStateRef = useRef(onGameState);
  const onRoomStateRef = useRef(onRoomState);
  const onGameEndedRef = useRef(onGameEnded);
  const onErrorRef = useRef(onError);
  const onShopPurchaseRef = useRef(onShopPurchase);
  const onShopErrorRef = useRef(onShopError);
  const onChatMessageRef = useRef(onChatMessage);

  useEffect(() => {
    onGameStateRef.current = onGameState;
    onRoomStateRef.current = onRoomState;
    onGameEndedRef.current = onGameEnded;
    onErrorRef.current = onError;
    onShopPurchaseRef.current = onShopPurchase;
    onShopErrorRef.current = onShopError;
    onChatMessageRef.current = onChatMessage;
  }, [
    onGameState,
    onRoomState,
    onGameEnded,
    onError,
    onShopPurchase,
    onShopError,
    onChatMessage,
  ]);

  useEffect(() => {
    if (!roomId) return;

    if (socketRef.current?.connected) {
      return;
    }

    const socket = io({
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Game socket connected:", socket.id);
      setIsConnected(true);
      socket.emit("room:join", { roomId });
    });

    socket.on("disconnect", () => {
      console.log("Game socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Game socket connection error:", err.message);
    });

    socket.on("game:state", (game: BlackjackGame) => {
      onGameStateRef.current?.(game);
    });

    socket.on("room:state", (room: Room) => {
      onRoomStateRef.current?.(room);
    });

    socket.on("game:ended", (room: Room) => {
      onGameEndedRef.current?.(room);
    });

    socket.on("game:error", (error: { message: string }) => {
      console.error("Game error:", error.message);
      onErrorRef.current?.(error);
    });

    socket.on("room:chat-message", (log: RoomLog) => {
      onChatMessageRef.current?.(log);
    });

    socket.on("shop:purchased", (event: ShopPurchaseEvent) => {
      onShopPurchaseRef.current?.(event);
    });

    socket.on("shop:error", (error: { message: string }) => {
      console.error("Shop error:", error.message);
      onShopErrorRef.current?.(error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  // Actions joueur
  const hit = useCallback(
    (hidden: boolean = false) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("game:action", {
          roomId,
          action: "hit",
          options: { hidden },
        });
      }
    },
    [roomId]
  );

  const stand = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("game:action", {
        roomId,
        action: "stand",
      });
    }
  }, [roomId]);

  // Actions banque
  const bankDraw = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("bank:draw", { roomId });
    }
  }, [roomId]);

  const bankDenounce = useCallback(
    (playerId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("bank:denounce", { roomId, playerId });
      }
    },
    [roomId]
  );

  const bankEndTurn = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("bank:end-turn", { roomId });
    }
  }, [roomId]);

  const resolveRound = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("game:resolve-round", { roomId });
    }
  }, [roomId]);

  const endGame = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("game:end", { roomId });
    }
  }, [roomId]);

  const replay = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("game:replay", { roomId });
    }
  }, [roomId]);

  const revealHiddenCard = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("player:reveal-hidden", { roomId });
    }
  }, [roomId]);

  // Actions boutique
  const buyItem = useCallback(
    (itemId: string, targetUserId?: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("shop:buy", { roomId, itemId, targetUserId });
      }
    },
    [roomId]
  );

  const selectDoseCard = useCallback(
    (cardIndex: number) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("shop:dose-choice", { roomId, cardIndex });
      }
    },
    [roomId]
  );

  // DEBUG: Donner des points (à retirer en production)
  const debugGivePoints = useCallback(
    (points: number = 9999) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("debug:give-points", { roomId, points });
      }
    },
    [roomId]
  );

  // Chat
  const sendMessage = useCallback(
    (message: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("room:chat", { roomId, message });
      }
    },
    [roomId]
  );

  return {
    isConnected,
    // Actions joueur
    hit,
    stand,
    revealHiddenCard,
    // Actions banque
    bankDraw,
    bankDenounce,
    bankEndTurn,
    resolveRound,
    endGame,
    replay,
    // Actions boutique
    buyItem,
    selectDoseCard,
    // Chat
    sendMessage,
    // DEBUG
    debugGivePoints,
  };
}
