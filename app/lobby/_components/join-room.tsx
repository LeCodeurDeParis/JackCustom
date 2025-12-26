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
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setMessage({
        type: "error",
        text: "Veuillez entrer un code de room",
      });
      return;
    }

    if (normalizedCode.length !== 6) {
      setMessage({
        type: "error",
        text: "Le code doit contenir exactement 6 caractères",
      });
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setMessage({
        type: "error",
        text: "Le code doit contenir uniquement des lettres et des chiffres",
      });
      return;
    }

    joinRoom(normalizedCode, {
      onSuccess: (room) => {
        // Rediriger vers la page room
        router.push(`/room/${room.id}`);
      },
      onError: (error: unknown) => {
        let errorMessage = "Erreur lors de la connexion à la room";

        if (error && typeof error === "object" && "message" in error) {
          const orpcError = error as { message?: string; code?: string };
          if (orpcError.code === "NOT_FOUND") {
            errorMessage = "Aucune room trouvée avec ce code";
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
              placeholder='Code (6 caractères) - Ex: A3F2B1'
              value={code}
              onChange={(e) => {
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "");
                if (value.length <= 6) {
                  setCode(value);
                }
              }}
              maxLength={6}
              disabled={isPending}
              className='font-mono text-center text-lg tracking-wider'
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
