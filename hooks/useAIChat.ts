"use client";

import { useState, useCallback, useRef } from "react";
import { sendChatMessage } from "@/services/ai.service";
import type { ChatMessage } from "@/types/ai";
import { ApiError } from "@/lib/api";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const SESSION_STORAGE_KEY = "roombook_ai_session";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

function storeSessionId(id: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  }
}

function clearStoredSessionId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(getStoredSessionId());

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Append user message immediately
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: content.trim(),
        sessionId: sessionIdRef.current ?? undefined,
      });

      // Persist sessionId
      if (response.sessionId) {
        sessionIdRef.current = response.sessionId;
        storeSessionId(response.sessionId);
      }

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: response.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      let errorContent = "Something went wrong. Please try again.";

      if (error instanceof ApiError) {
        if (error.status === 429) {
          errorContent = "The AI is receiving too many requests. Please wait a moment and try again.";
        } else if (error.status === 502 || error.status === 504) {
          errorContent = "The AI service is temporarily unavailable. Please try again shortly.";
        } else if (error.status === 401) {
          errorContent = "Your session has expired. Please log in again.";
        } else {
          errorContent = error.message || errorContent;
        }
      } else if (error instanceof TypeError && error.message.includes("fetch")) {
        errorContent = "Unable to connect to the server. Please check your internet connection.";
      }

      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "error",
        content: errorContent,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = null;
    clearStoredSessionId();
  }, []);

  return {
    messages,
    isLoading,
    sessionId: sessionIdRef.current,
    sendMessage,
    clearConversation,
  };
}
