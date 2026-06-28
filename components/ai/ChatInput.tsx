"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            id="ai-chat-input"
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full resize-none rounded-xl border border-border bg-secondary/50 px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            style={{ maxHeight: "160px" }}
          />
        </div>
        <Button
          id="ai-chat-send"
          size="icon"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="h-11 w-11 shrink-0 rounded-xl"
        >
          <SendHorizonal className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground/60">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
