import { api, type ApiResponse } from "@/lib/api";
import type { AIChatRequest, AIChatResponseData } from "@/types/ai";

// ──────────────────────────────────────────────
// AI Service — API Layer
// ──────────────────────────────────────────────

/**
 * Send a chat message to the AI assistant.
 */
export async function sendChatMessage(
  payload: AIChatRequest
): Promise<AIChatResponseData> {
  const res = await api.post<ApiResponse<AIChatResponseData>>(
    "/v1/ai/chat",
    payload
  );
  return res.data;
}
