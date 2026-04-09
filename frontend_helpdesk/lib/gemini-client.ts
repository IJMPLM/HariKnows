import { authFetch } from "./auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatHistory = {
  messages: ChatMessage[];
};

export type ChatResponse = {
  conversationId: string;
  message: ChatMessage;
  meta?: RagResponseMeta;
};

export type RagCitation = {
  id: number;
  title: string;
  url: string;
  scopeType: string;
  category: string;
};

export type RagResponseMeta = {
  reply: string;
  modelSource: string;
  routing: string;
  confidence: number;
  citations: RagCitation[];
  redirectOffice?: string | null;
  redirectReason?: string | null;
};

export type ConversationSession = {
  conversationId: string;
  firstMessageAt: string;
  lastMessageAt: string;
  messageCount: number;
  previewText: string;
  expiresInDays: number;
};

/**
 * Send a chat message to Gemini API
 */
export async function sendChatMessage(
  content: string,
  conversationId?: string
): Promise<ChatResponse> {
  const url = new URL(`${API_BASE}/api/chat/message`);
  if (conversationId) {
    url.searchParams.set("conversationId", conversationId);
  }

  const response = await authFetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return (await response.json()) as ChatResponse;
}

/**
 * Get chat history for a conversation
 */
export async function getChatHistory(
  conversationId: string,
  limit: number = 20
): Promise<ChatMessage[]> {
  const url = new URL(`${API_BASE}/api/chat/history`);
  url.searchParams.set("conversationId", conversationId);
  url.searchParams.set("limit", String(limit));

  const response = await authFetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load history");
  }

  const data = (await response.json()) as ChatHistory;
  return data.messages;
}

/**
 * Clear chat history for a conversation
 */
export async function clearChatHistory(conversationId: string): Promise<void> {
  const url = new URL(`${API_BASE}/api/chat/history`);
  url.searchParams.set("conversationId", conversationId);

  const response = await authFetch(url.toString(), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to clear history");
  }
}

/**
 * Get all conversation sessions for the current user
 */
export async function getConversationSessions(maxAgeInDays: number = 30): Promise<ConversationSession[]> {
  const url = new URL(`${API_BASE}/api/chat/conversations`);
  url.searchParams.set("maxAgeInDays", String(maxAgeInDays));

  const response = await authFetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load conversations");
  }

  const data = (await response.json()) as { sessions: ConversationSession[] };
  return data.sessions;
}
