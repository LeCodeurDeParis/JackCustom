"use client";

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoomStateBadge } from "./room-state-badge";
import { Room } from "@/interfaces/room";

interface RoomHeaderProps {
  room: Room;
  onLeaveRoom: () => void;
  isLeaving: boolean;
}

export function RoomHeader({ room, onLeaveRoom, isLeaving }: RoomHeaderProps) {
  return (
    <CardHeader>
      <div className='flex items-center justify-between'>
        <CardTitle>Room {room.id.slice(0, 8)}...</CardTitle>
        <div className='flex items-center gap-3'>
          <RoomStateBadge state={room.state} />
          <Button
            variant='destructive'
            size='sm'
            onClick={onLeaveRoom}
            disabled={isLeaving}
          >
            {isLeaving ? "Sortie..." : "Quitter la room"}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
