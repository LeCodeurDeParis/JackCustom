"use client";

import { Button } from "@/components/ui/button";

interface RoomCodeProps {
  code: string;
}

export function RoomCode({ code }: RoomCodeProps) {
  const handleCopyCode = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        // Optionnel: afficher un message de confirmation
      } catch (err) {
        console.error("Erreur lors de la copie du code:", err);
      }
    }
  };

  return (
    <div className='flex items-center gap-3'>
      <div className='flex-1'>
        <p className='text-sm text-muted-foreground mb-1'>Code de la room</p>
        <div className='flex items-center gap-2'>
          <div className='px-4 py-2 bg-primary/10 rounded-lg font-mono text-lg font-semibold tracking-wider'>
            {code}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleCopyCode}
            className='shrink-0'
          >
            Copier
          </Button>
        </div>
      </div>
    </div>
  );
}
