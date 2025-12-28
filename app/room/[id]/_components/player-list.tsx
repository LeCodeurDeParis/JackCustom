"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Room } from "@/interfaces/room";
import { PlayerCard } from "./player-card";

interface PlayerListProps {
  room: Room;
  currentUserId: string | null;
  onSetReady?: (ready: boolean) => void;
  onToggleAutoJoin?: (autoJoin: boolean) => void;
}

export function PlayerList({
  room,
  currentUserId,
  onSetReady,
  onToggleAutoJoin,
}: PlayerListProps) {
  return (
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
                <PlayerCard
                  key={player.userId}
                  player={player}
                  index={index}
                  isHost={isPlayerHost}
                  isCurrentUser={!!isCurrentUser}
                  roomId={room.id}
                  onSetReady={onSetReady}
                  onToggleAutoJoin={onToggleAutoJoin}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
