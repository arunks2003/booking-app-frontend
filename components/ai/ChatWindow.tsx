"use client";

import { useEffect, useRef } from "react";
import { Bot, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat } from "@/hooks/useAIChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyState } from "./EmptyState";

export function ChatWindow() {
  const { messages, isLoading, sendMessage, clearConversation } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI Assistant
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {isLoading ? "Thinking…" : "Online"}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            id="ai-chat-clear"
            variant="ghost"
            size="icon"
            onClick={clearConversation}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Clear conversation</span>
          </Button>
        )}
      </div>

      {/* ── Messages ───────────────────────────── */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col">
          {messages.length === 0 && !isLoading ? (
            <EmptyState />
          ) : (
            <div className="py-2">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Input ──────────────────────────────── */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
