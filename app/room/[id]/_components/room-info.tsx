"use client";

import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoomCode } from "./room-code";
import { Room } from "@/interfaces/room";
import { RoomState } from "@/states/room-states";

interface RoomInfoProps {
  room: Room;
  roomCode: string;
  canStart: boolean;
  onStartRoom: () => void;
  isStarting: boolean;
}

export function RoomInfo({
  room,
  roomCode,
  canStart,
  onStartRoom,
  isStarting,
}: RoomInfoProps) {
  return (
    <CardContent>
      <div className='flex flex-col gap-4'>
        <RoomCode code={roomCode} />
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
              onClick={onStartRoom}
              disabled={isStarting}
              className='ml-auto'
            >
              {isStarting ? "Démarrage..." : "Lancer la partie"}
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  );
}
