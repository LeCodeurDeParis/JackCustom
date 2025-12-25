"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateRoom } from "@/hooks/use-room";
import { useState } from "react";

export default function CreateRoom() {
  const { mutate: createRoom, isPending } = useCreateRoom();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleCreateRoom = () => {
    console.log("🖱️ Bouton Create cliqué");
    setMessage(null);

    createRoom(undefined, {
      onSuccess: (room) => {
        console.log("✅ Succès dans le composant :", room);
        setMessage({
          type: "success",
          text: `Room créée avec succès ! ID: ${room.id}`,
        });
        setTimeout(() => setMessage(null), 3000);
      },
      onError: (error) => {
        console.error("❌ Erreur dans le composant :", error);
        setMessage({
          type: "error",
          text: `Erreur : ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`,
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
            Create Room
          </CardTitle>
        </CardHeader>
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
          <Button
            onClick={handleCreateRoom}
            className='w-full'
            disabled={isPending}
          >
            {isPending ? "Création..." : "Create"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
