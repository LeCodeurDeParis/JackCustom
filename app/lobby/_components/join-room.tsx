"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useJoinRoom } from "@/hooks/use-room";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoom() {
  const router = useRouter();
  const { mutate: joinRoom, isPending } = useJoinRoom();
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (!roomId.trim()) {
      setMessage({
        type: "error",
        text: "Veuillez entrer un ID de room",
      });
      return;
    }

    joinRoom(roomId, {
      onSuccess: (room) => {
        // Rediriger vers la page room
        router.push(`/room/${room.id}`);
      },
      onError: (error: unknown) => {
        let errorMessage = "Erreur lors de la connexion à la room";

        if (error && typeof error === "object" && "message" in error) {
          const orpcError = error as { message?: string; code?: string };
          if (orpcError.code === "NOT_FOUND") {
            errorMessage = "Room introuvable";
          } else if (orpcError.code === "CONFLICT") {
            errorMessage = "La room est pleine";
          } else if (orpcError.code === "BAD_REQUEST") {
            errorMessage = "La partie a déjà commencé";
          } else if (orpcError.message) {
            errorMessage = orpcError.message;
          }
        }

        setMessage({
          type: "error",
          text: errorMessage,
        });
        setTimeout(() => setMessage(null), 5000);
      },
    });
  };

  return (
    <div>
      <Card className='py-8'>
        <CardHeader>
          <CardTitle className='flex items-center justify-center'>
            Join Room
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleJoinRoom}>
          <CardContent className='space-y-4'>
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.type === "success"
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
            <Input
              type='text'
              placeholder='Room ID'
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={isPending}
            />
          </CardContent>
          <CardFooter>
            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? "Connexion..." : "Join"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
