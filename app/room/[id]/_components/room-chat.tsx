"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoomLog } from "@/interfaces/room-settings";
import { cn } from "@/lib/utils";

interface RoomChatProps {
  logs?: RoomLog[];
  currentUserId: string | null;
  onSendMessage: (message: string) => void;
}

export function RoomChat({ logs = [], currentUserId, onSendMessage }: RoomChatProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLogStyle = (log: RoomLog) => {
    switch (log.type) {
      case "system":
        return "text-amber-500 dark:text-amber-400 italic";
      case "game":
        return "text-emerald-600 dark:text-emerald-400";
      case "chat":
        return log.playerId === currentUserId
          ? "text-sky-600 dark:text-sky-400"
          : "text-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getLogIcon = (type: RoomLog["type"]) => {
    switch (type) {
      case "system":
        return "⚙️";
      case "game":
        return "🎴";
      case "chat":
        return "💬";
      default:
        return "•";
    }
  };

  return (
    <Card className="flex flex-col h-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">📜</span>
          Logs & Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Zone des logs/messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Aucun message pour le moment...
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300",
                  getLogStyle(log)
                )}
              >
                <span className="opacity-50 mr-2 text-xs font-mono">
                  {formatTime(log.timestamp)}
                </span>
                <span className="mr-1">{getLogIcon(log.type)}</span>
                {log.type === "chat" && log.playerName && (
                  <span className="font-semibold mr-1">{log.playerName}:</span>
                )}
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Zone de saisie */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-border/30 bg-muted/20"
        >
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
              maxLength={200}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim()}
              className="px-4 shrink-0"
            >
              Envoyer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

