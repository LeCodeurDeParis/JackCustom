"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { RoomSettings, RoomLog } from "@/interfaces/room-settings";
import { Room } from "@/interfaces/room";

interface UseSocketOptions {
  roomId: string;
  onRoomState?: (room: Room) => void;
  onChatMessage?: (log: RoomLog) => void;
  onSettingsUpdated?: (settings: RoomSettings) => void;
  onError?: (error: { message: string }) => void;
}

export function useSocket({
  roomId,
  onRoomState,
  onChatMessage,
  onSettingsUpdated,
  onError,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Utiliser des refs pour les callbacks pour éviter les reconnexions
  const onRoomStateRef = useRef(onRoomState);
  const onChatMessageRef = useRef(onChatMessage);
  const onSettingsUpdatedRef = useRef(onSettingsUpdated);
  const onErrorRef = useRef(onError);

  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onRoomStateRef.current = onRoomState;
    onChatMessageRef.current = onChatMessage;
    onSettingsUpdatedRef.current = onSettingsUpdated;
    onErrorRef.current = onError;
  }, [onRoomState, onChatMessage, onSettingsUpdated, onError]);

  useEffect(() => {
    if (!roomId) return;

    // Éviter les connexions multiples
    if (socketRef.current?.connected) {
      return;
    }

    // Créer la connexion socket avec les cookies (pour better-auth)
    const socket = io({
      withCredentials: true, // Envoyer les cookies d'authentification
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      // Rejoindre la room
      socket.emit("room:join", { roomId });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("room:state", (room: Room) => {
      onRoomStateRef.current?.(room);
    });

    socket.on("room:chat-message", (log: RoomLog) => {
      onChatMessageRef.current?.(log);
    });

    socket.on("room:settings-updated", (settings: RoomSettings) => {
      onSettingsUpdatedRef.current?.(settings);
    });

    socket.on("room:error", (error: { message: string }) => {
      console.error("Room error:", error.message);
      onErrorRef.current?.(error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("room:leave", { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("room:chat", {
        roomId,
        message,
      });
    }
  }, [roomId]);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("room:update-settings", {
        roomId,
        settings,
      });
    }
  }, [roomId]);

  return {
    isConnected,
    sendMessage,
    updateSettings,
  };
}

