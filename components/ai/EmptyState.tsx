"use client";

import { Bot, MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Bot className="h-8 w-8 text-primary" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          RoomBook AI Assistant
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          I can help you book rooms, check availability, and manage your
          meetings. Just type a message to get started!
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {[
          "Book a room for tomorrow",
          "What rooms are available?",
          "Find a room for 10 people",
        ].map((suggestion) => (
          <div
            key={suggestion}
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground"
          >
            <MessageSquare className="h-3 w-3" />
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
}
