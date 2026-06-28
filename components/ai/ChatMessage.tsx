"use client";

import { memo } from "react";
import { AlertCircle, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types/ai";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

function ChatMessageRaw({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      ) : (
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isError ? "bg-destructive/10" : "bg-primary/10"
          )}
        >
          {isError ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <span className="text-sm font-semibold text-primary">AI</span>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser &&
            "rounded-tr-sm bg-primary text-primary-foreground",
          !isUser &&
            !isError &&
            "rounded-tl-sm bg-secondary text-secondary-foreground",
          isError &&
            "rounded-tl-sm border border-destructive/20 bg-destructive/5 text-destructive"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time className="mt-1 block text-[10px] opacity-50">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}

export const ChatMessage = memo(ChatMessageRaw);
