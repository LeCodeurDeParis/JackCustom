"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoomLog } from "@/interfaces/room-settings";
import { cn } from "@/lib/utils";

interface GameChatProps {
  logs?: RoomLog[];
  currentUserId: string | null;
  onSendMessage: (message: string) => void;
}

export function GameChat({
  logs = [],
  currentUserId,
  onSendMessage,
}: GameChatProps) {
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
        return "text-amber-500 italic";
      case "game":
        return "text-emerald-400";
      case "shop":
        return "text-purple-400";
      case "chat":
        return log.playerId === currentUserId
          ? "text-sky-400"
          : "text-slate-200";
      default:
        return "text-slate-400";
    }
  };

  const getLogIcon = (type: RoomLog["type"]) => {
    switch (type) {
      case "system":
        return "⚙️";
      case "game":
        return "🎴";
      case "shop":
        return "🛒";
      case "chat":
        return "💬";
      default:
        return "•";
    }
  };

  return (
    <div className='w-72 shrink-0 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col h-screen'>
      {/* Header */}
      <div className='flex items-center px-4 py-3 border-b border-slate-700/30 shrink-0'>
        <span className='text-sm font-medium text-slate-300 flex items-center gap-2'>
          💬 Logs & Chat
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className='flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent'
      >
        {logs.length === 0 ? (
          <p className='text-slate-500 text-sm text-center py-4'>
            Aucun message...
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={cn(
                "text-xs leading-relaxed animate-in fade-in slide-in-from-right-2 duration-200",
                getLogStyle(log)
              )}
            >
              <span className='opacity-50 mr-1.5 text-[10px] font-mono'>
                {formatTime(log.timestamp)}
              </span>
              <span className='mr-1'>{getLogIcon(log.type)}</span>
              {log.type === "chat" && log.playerName && (
                <span className='font-semibold mr-1'>{log.playerName}:</span>
              )}
              <span className='break-words'>{log.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className='p-2 border-t border-slate-700/30 shrink-0'
      >
        <div className='flex gap-2'>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Message...'
            className='flex-1 h-8 text-sm bg-slate-800/50 border-slate-700/50'
            maxLength={200}
          />
          <Button
            type='submit'
            size='sm'
            disabled={!message.trim()}
            className='h-8 px-2'
          >
            ➤
          </Button>
        </div>
      </form>
    </div>
  );
}
