"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetRoom, useStartRoom } from "@/hooks/use-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomState } from "@/states/room-states";
import { authClient } from "@/utils/auth-client";
import { useEffect, useState } from "react";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { data: room, isLoading, error } = useGetRoom(roomId);
  const { mutate: startRoom, isPending: isStarting } = useStartRoom();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer l'utilisateur actuel
    authClient.getSession().then((session) => {
      if (session?.data?.user?.id) {
        setCurrentUserId(session.data.user.id);
      }
    });
  }, []);

  const isHost = room && currentUserId && room.hostId === currentUserId;
  const canStart = isHost && room?.state === RoomState.WAITING;

  const handleStartRoom = () => {
    if (roomId) {
      startRoom(roomId, {
        onSuccess: () => {
          // La room sera automatiquement mise à jour via le polling
        },
      });
    }
  };

  const getStateBadgeColor = (state: RoomState) => {
    switch (state) {
      case RoomState.WAITING:
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case RoomState.PLAYING:
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case RoomState.ENDED:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-lg'>Chargement de la room...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className='flex flex-col items-center justify-center h-screen gap-4'>
        <div className='text-lg text-red-600 dark:text-red-400'>
          {error ? "Erreur lors du chargement de la room" : "Room introuvable"}
        </div>
        <Button onClick={() => router.push("/lobby")}>Retour au lobby</Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4 max-w-4xl'>
      <div className='flex flex-col gap-6'>
        {/* En-tête avec état de la room */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Room {room.id.slice(0, 8)}...</CardTitle>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStateBadgeColor(
                  room.state
                )}`}
              >
                {room.state}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Host: {room.hostId.slice(0, 8)}...
                </p>
                <p className='text-sm text-muted-foreground'>
                  Joueurs: {room.players.length}/8
                </p>
              </div>
              {canStart && (
                <Button
                  onClick={handleStartRoom}
                  disabled={isStarting}
                  className='ml-auto'
                >
                  {isStarting ? "Démarrage..." : "Lancer la partie"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Liste des joueurs */}
        <Card>
          <CardHeader>
            <CardTitle>Joueurs connectés</CardTitle>
          </CardHeader>
          <CardContent>
            {room.players.length === 0 ? (
              <p className='text-muted-foreground'>Aucun joueur</p>
            ) : (
              <div className='space-y-2'>
                {room.players.map((player, index) => {
                  const isPlayerHost = player.userId === room.hostId;
                  const isCurrentUser = player.userId === currentUserId;
                  return (
                    <div
                      key={player.userId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isCurrentUser
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-gray-50 dark:bg-gray-900/20"
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold'>
                          {index + 1}
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>
                              {player.username}
                            </span>
                            {isPlayerHost && (
                              <span className='px-2 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'>
                                Host
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className='px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'>
                                Vous
                              </span>
                            )}
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            Points: {player.sessionPoints} | État:{" "}
                            {player.state}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
