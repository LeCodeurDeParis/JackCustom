"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RoomErrorProps {
  error?: Error | null;
}

export function RoomError({ error }: RoomErrorProps) {
  const router = useRouter();

  return (
    <div className='flex flex-col items-center justify-center h-screen gap-4'>
      <div className='text-lg text-red-600 dark:text-red-400'>
        {error ? "Erreur lors du chargement de la room" : "Room introuvable"}
      </div>
      <Button onClick={() => router.push("/lobby")}>Retour au lobby</Button>
    </div>
  );
}
