"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetRoom, useLeaveRoom } from "@/hooks/use-room";
import { useSetReady, useToggleAutoJoin } from "@/hooks/use-ready";
import { useSocket } from "@/hooks/use-socket";
import { Card } from "@/components/ui/card";
import { RoomState } from "@/states/room-states";
import { authClient } from "@/utils/auth-client";
import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RoomHeader } from "./_components/room-header";
import { RoomInfo } from "./_components/room-info";
import { PlayerList } from "./_components/player-list";
import { RoomLoading } from "./_components/room-loading";
import { RoomError } from "./_components/room-error";
import { RoomChat } from "./_components/room-chat";
import { RoomSettingsPanel } from "./_components/room-settings-panel";
import { getRoomCode } from "./_components/utils";
import { Room } from "@/interfaces/room";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const roomId = params.id as string;
  const { data: room, isLoading, error } = useGetRoom(roomId);
  const { mutate: leaveRoom, isPending: isLeaving } = useLeaveRoom();
  const [isStarting, setIsStarting] = useState(false);
  const { mutate: setReady } = useSetReady();
  const { mutate: toggleAutoJoin } = useToggleAutoJoin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Callback pour mettre à jour le cache quand on reçoit un état via socket
  const handleRoomState = useCallback(
    (updatedRoom: Room) => {
      queryClient.setQueryData(["room", roomId], updatedRoom);
    },
    [queryClient, roomId]
  );

  // Callback pour la redirection quand le jeu démarre
  const handleGameStarted = useCallback(
    (data: { redirect: string }) => {
      router.push(`${data.redirect}?roomId=${roomId}`);
    },
    [router, roomId]
  );

  // Hook socket pour le chat et les settings en temps réel
  const { sendMessage, updateSettings, addTestPlayer, startGame } = useSocket({
    roomId,
    onRoomState: handleRoomState,
    onGameStarted: handleGameStarted,
  });

  useEffect(() => {
    // Récupérer l'utilisateur actuel
    authClient.getSession().then((session) => {
      if (session?.data?.user?.id) {
        setCurrentUserId(session.data.user.id);
      }
    });
  }, []);

  const isHost = !!(room && currentUserId && room.hostId === currentUserId);
  const allPlayersReady = room?.players.every((p) => p.ready) ?? false;
  const hasEnoughPlayers = (room?.players.length ?? 0) >= 2;
  const canStart =
    isHost && room?.state === RoomState.WAITING && allPlayersReady && hasEnoughPlayers;
  const roomCode = room ? getRoomCode(room.id) : "";

  const handleStartRoom = () => {
    if (roomId) {
      startGame();
    }
  };

  const handleLeaveRoom = () => {
    if (roomId && currentUserId) {
      leaveRoom(
        { roomId, playerId: currentUserId },
        {
          onSuccess: () => {
            // Rediriger vers le lobby après avoir quitté la room
            router.push("/lobby");
          },
          onError: (error) => {
            console.error("Erreur lors de la sortie de la room:", error);
          },
        }
      );
    }
  };

  const handleSetReady = (ready: boolean) => {
    if (roomId) {
      setReady({ roomId, ready });
    }
  };

  const handleToggleAutoJoin = (autoJoin: boolean) => {
    if (roomId) {
      toggleAutoJoin({ roomId, autoJoinNext: autoJoin });
    }
  };

  if (isLoading) {
    return <RoomLoading />;
  }

  if (error || !room) {
    return <RoomError error={error} />;
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-background via-background to-muted/20'>
      <div className='container mx-auto p-4 max-w-7xl'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Colonne principale (gauche) */}
          <div className='lg:col-span-2 flex flex-col gap-6'>
        <Card className='gap-4'>
          <RoomHeader
            room={room}
            onLeaveRoom={handleLeaveRoom}
            isLeaving={isLeaving}
          />
          <RoomInfo
            room={room}
            roomCode={roomCode}
            canStart={canStart}
            onStartRoom={handleStartRoom}
            isStarting={isStarting}
          />
        </Card>

        <PlayerList
          room={room}
          currentUserId={currentUserId}
          onSetReady={handleSetReady}
          onToggleAutoJoin={handleToggleAutoJoin}
        />
          </div>

          {/* Colonne de droite (chat + settings) */}
          <div className='flex flex-col gap-6'>
            {/* Settings uniquement pour le host */}
            {isHost && (
              <RoomSettingsPanel
                settings={room.settings}
                isHost={isHost}
                onSettingsChange={updateSettings}
                onAddTestPlayer={addTestPlayer}
                playerCount={room.players.length}
              />
            )}

            {/* Chat et logs */}
            <div className='flex-1 min-h-[400px]'>
              <RoomChat
                logs={room.logs}
                currentUserId={currentUserId}
                onSendMessage={sendMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
