// ──────────────────────────────────────────────
// AI Chat Types
// ──────────────────────────────────────────────

export interface AIChatRequest {
  message: string;
  sessionId?: string;
}

export interface AIChatResponseData {
  sessionId: string;
  reply: string;
  toolsUsed?: ToolUsage[];
}

export interface ToolUsage {
  tool: string;
  input: Record<string, unknown>;
  result: Record<string, unknown> | string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;
}
