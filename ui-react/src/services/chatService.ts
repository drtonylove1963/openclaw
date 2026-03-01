/**
 * Chat API Service for Pronetheia
 * Consolidated service handling all chat-related API calls.
 *
 * Endpoints used:
 *   /api/v1/chat/persistent/conversations - CRUD for conversations (DB-backed)
 *   /api/v1/chat/agent-stream            - Agent mode streaming
 *   /api/v1/chat/agent-stream/answer     - Submit answer to agent question
 *   /api/v1/chat/persistent/chat         - Persistent chat streaming
 *   /api/v1/chat/persistent/regenerate   - Regenerate a message
 *   /api/v1/chat/simple                  - Simple LLM mode streaming
 */
import { api } from '../config/api';
import { parseSSEStream } from '../utils/sseParser';
import { STORAGE_KEYS } from '../constants/chat';
import type {
  Conversation,
  ConversationDetail,
  CreateConversationRequest,
  UpdateConversationRequest,
  AgentChatRequest,
  AgentStreamEvent,
  AgentDoneEvent,
  AgenticStreamEvent,
  AgenticCompleteEvent,
} from '../types/chat';

/**
 * Simple chat stream event type for Pure LLM Mode
 */
export interface SimpleChatEvent {
  type: 'start' | 'content' | 'reasoning' | 'done' | 'error' | 'gsd_command_start' | 'gsd_command_complete';
  conversation_id?: string;
  chunk?: string;
  content?: string;
  completion_time_ms?: number;
  message?: string;
  command?: string;
  success?: boolean;
  command_type?: string;
  data?: Record<string, unknown>;
  next_action?: string;
  requires_followup?: boolean;
}

// Storage key for auth token (must match AuthContext)
const TOKEN_KEY = STORAGE_KEYS.token;
const REFRESH_TOKEN_KEY = STORAGE_KEYS.refreshToken;
const USER_KEY = STORAGE_KEYS.user;

/**
 * Handle 401 responses by clearing auth state and notifying AuthContext.
 * This triggers redirect to login page.
 */
function handleAuthExpired(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('auth-expired'));
}

class ChatService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthExpired();
        throw new Error('Session expired. Please log in again.');
      }
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  /**
   * Make an SSE streaming request with shared parsing logic.
   */
  private async fetchSSE(url: string, body: unknown, abortSignal?: AbortSignal): Promise<Response> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthExpired();
        throw new Error('Session expired. Please log in again.');
      }
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      if (response.status === 404) {
        throw new Error('Endpoint not available. Please check backend deployment.');
      }
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    return response;
  }

  // ============================================================================
  // CONVERSATION CRUD (Database-backed via /persistent/conversations)
  // ============================================================================

  async listConversations(
    limit = 50,
    offset = 0,
    includeArchived = false
  ): Promise<Conversation[]> {
    const response = await this.fetch<{ conversations: Conversation[]; total: number }>(
      `${api.conversations}?limit=${limit}&offset=${offset}&include_archived=${includeArchived}`
    );
    return response.conversations;
  }

  async getConversation(id: string): Promise<ConversationDetail> {
    return this.fetch<ConversationDetail>(`${api.conversations}/${id}`);
  }

  async createConversation(data: CreateConversationRequest = {}): Promise<Conversation> {
    return this.fetch<Conversation>(api.conversations, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(id: string, data: UpdateConversationRequest): Promise<Conversation> {
    return this.fetch<Conversation>(`${api.conversations}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.fetch<{ status: string }>(`${api.conversations}/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllConversations(): Promise<{ count: number }> {
    return this.fetch<{ status: string; count: number }>(api.conversations, {
      method: 'DELETE',
    });
  }

  // Backward-compat aliases (used by useChat.ts, will be removed in Phase 4)
  async listPersistentConversations(limit = 50, offset = 0, includeArchived = false): Promise<Conversation[]> {
    return this.listConversations(limit, offset, includeArchived);
  }
  async getPersistentConversation(id: string): Promise<ConversationDetail> {
    return this.getConversation(id);
  }
  async deletePersistentConversation(id: string): Promise<void> {
    return this.deleteConversation(id);
  }

  // ============================================================================
  // AGENT MODE STREAMING
  // ============================================================================

  async sendAgentChatStream(
    data: AgentChatRequest,
    onEvent: (event: AgentStreamEvent) => void,
    abortSignal?: AbortSignal
  ): Promise<AgentDoneEvent['result'] | null> {
    let doneResult: AgentDoneEvent['result'] | null = null;

    try {
      const response = await this.fetchSSE(`${api.chat}/agent-stream`, data, abortSignal);

      await parseSSEStream<AgentStreamEvent>(response, (event) => {
        onEvent(event);
        if (event.type === 'done' && (event).result) {
          doneResult = (event).result;
        }
      }, { onYield: ['content_chunk'] });

      return doneResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      onEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async submitQuestionAnswer(
    conversationId: string,
    questionId: string,
    answer: string,
    selectedOptions?: string[]
  ): Promise<{
    success: boolean;
    conversation_id: string;
    question_id: string;
    answer_recorded: string;
    message: string;
    context_addition: string;
  }> {
    return this.fetch(`${api.chat}/agent-stream/answer`, {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        question_id: questionId,
        answer,
        selected_options: selectedOptions,
      }),
    });
  }

  // ============================================================================
  // PERSISTENT CHAT STREAMING
  // ============================================================================

  async sendPersistentChatStream(
    data: AgentChatRequest,
    onEvent: (event: AgentStreamEvent) => void,
    abortSignal?: AbortSignal
  ): Promise<AgentDoneEvent['result'] | null> {
    let doneResult: AgentDoneEvent['result'] | null = null;

    try {
      const response = await this.fetchSSE(`${api.chat}/persistent/chat`, data, abortSignal);

      await parseSSEStream<AgentStreamEvent>(response, (event) => {
        onEvent(event);
        if (event.type === 'done' && (event).result) {
          doneResult = (event).result;
        }
      }, { onYield: ['content_chunk'] });

      return doneResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      onEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async regenerateMessage(
    messageId: string,
    model?: string
  ): Promise<{
    status: string;
    conversation_id: string;
    prompt: string;
    model?: string;
    phase?: string;
    message: string;
  }> {
    return this.fetch(`${api.chat}/persistent/regenerate`, {
      method: 'POST',
      body: JSON.stringify({
        message_id: messageId,
        model,
      }),
    });
  }

  // ============================================================================
  // AGENTIC CHAT STREAMING (True agentic loop with iterative tool execution)
  // ============================================================================

  /**
   * Agentic chat stream event types
   */
  async sendAgenticChatStream(
    data: {
      message: string;
      conversation_id?: string;
      user_id?: string;
      model?: string;
      phase?: string;
      skills?: string[];
      project_path?: string;
      max_iterations?: number;
      timeout_seconds?: number;
      enable_self_healing?: boolean;
    },
    onEvent: (event: AgenticStreamEvent) => void,
    abortSignal?: AbortSignal
  ): Promise<AgenticCompleteEvent | null> {
    let completeEvent: AgenticCompleteEvent | null = null;

    try {
      const response = await this.fetchSSE(`${api.chat}/agentic-stream`, data, abortSignal);

      await parseSSEStream<AgenticStreamEvent>(response, (event) => {
        onEvent(event);
        if (event.type === 'complete') {
          completeEvent = event;
        }
      }, { onYield: ['content_chunk', 'tool_start', 'tool_result', 'iteration_start'] });

      return completeEvent;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  // ============================================================================
  // SIMPLE CHAT STREAMING (Pure LLM Mode)
  // ============================================================================

  async sendSimpleChatStream(
    data: {
      message: string;
      conversation_id?: string;
      model?: string;
      system_prompt?: string;
      temperature?: number;
      max_tokens?: number;
      project_path?: string;
    },
    onEvent: (event: SimpleChatEvent) => void,
    abortSignal?: AbortSignal
  ): Promise<string | null> {
    let conversationId: string | null = null;

    try {
      const response = await this.fetchSSE(`${api.chat}/simple`, data, abortSignal);

      await parseSSEStream<SimpleChatEvent>(response, (event) => {
        onEvent(event);
        if (event.conversation_id) {
          conversationId = event.conversation_id;
        }
      }, { onYield: ['content'] });

      return conversationId;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      onEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
