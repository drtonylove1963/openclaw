import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chatService } from '../services/chatService';
import { CHAT_DEFAULTS, STORAGE_KEYS } from '../constants/chat';
import type {
  Conversation as APIConversation,
  ConversationDetail,
  Message as APIMessage,
} from '../types/chat';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  capabilities: ('vision' | 'tools' | 'streaming')[];
}

export interface AgentMentionData {
  name: string;
  color: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentMentions?: AgentMentionData[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  model: string;
}

interface ChatState {
  conversations: APIConversation[];
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  selectedModel: ModelConfig | null;
  agentMode: 'standard' | 'multi-agent' | 'swarm';
  agenticMode: boolean;  // True agentic loop mode (like Claude Code) - default ON
  temperature: number;
  systemPrompt: string;
  memoryEnabled: boolean;
  conversationsLoading: boolean;
  conversationsError: string | null;
}

interface ChatActions {
  renameConversation: (id: string, title: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  newConversation: () => void;
  setModel: (model: ModelConfig) => void;
  setAgentMode: (mode: 'standard' | 'multi-agent' | 'swarm') => void;
  setAgenticMode: (enabled: boolean) => void;  // Toggle agentic loop mode
  setTemperature: (value: number) => void;
  setSystemPrompt: (prompt: string) => void;
  toggleMemory: () => void;
  addMessage: (message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  deleteConversation: (id: string) => Promise<void>;
  deleteMultipleConversations: (ids: string[]) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<APIConversation>;
}

/** Convert backend Message to local Message format */
function toLocalMessage(msg: APIMessage): Message {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.created_at,
  };
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: [],
      isStreaming: false,
      selectedModel: null,
      agentMode: 'standard',
      agenticMode: true,  // Default ON for Claude Code-like behavior
      temperature: CHAT_DEFAULTS.defaultTemperature,
      systemPrompt: '',
      memoryEnabled: true,
      conversationsLoading: false,
      conversationsError: null,

      renameConversation: async (id: string, title: string) => {
        await chatService.updateConversation(id, { title });
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }));
      },

      fetchConversations: async () => {
        set({ conversationsLoading: true, conversationsError: null });
        try {
          const conversations = await chatService.listConversations(50, 0);
          set({ conversations, conversationsLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load conversations';
          set({ conversationsError: message, conversationsLoading: false });
        }
      },

      loadConversation: async (id: string) => {
        set({ activeConversationId: id, isStreaming: false });
        try {
          const detail: ConversationDetail = await chatService.getConversation(id);
          const messages = detail.messages.map(toLocalMessage);
          set({ messages, activeConversationId: id });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load conversation';
          set({
            messages: [{
              id: `error-${Date.now()}`,
              role: 'system',
              content: `Failed to load conversation: ${message}`,
              timestamp: new Date().toISOString(),
            }],
          });
        }
      },

      createConversation: async (title?: string) => {
        const conv = await chatService.createConversation({ title });
        set((state) => ({
          conversations: [conv, ...state.conversations],
          activeConversationId: conv.id,
          messages: [],
        }));
        return conv;
      },

      newConversation: () => {
        set({
          activeConversationId: null,
          messages: [],
          isStreaming: false,
        });
      },

      setModel: (model) => set({ selectedModel: model }),
      setAgentMode: (mode) => set({ agentMode: mode }),
      setAgenticMode: (enabled) => set({ agenticMode: enabled }),
      setTemperature: (value) => set({ temperature: value }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      toggleMemory: () => set((state) => ({ memoryEnabled: !state.memoryEnabled })),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateStreamingMessage: (content) =>
        set((state) => {
          const msgs = [...state.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.isStreaming) {
            msgs[msgs.length - 1] = { ...last, content };
          }
          return { messages: msgs };
        }),

      setStreaming: (isStreaming) => set({ isStreaming }),

      deleteConversation: async (id: string) => {
        await chatService.deleteConversation(id);
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          messages: state.activeConversationId === id ? [] : state.messages,
        }));
      },

      deleteMultipleConversations: async (ids: string[]) => {
        const results = await Promise.allSettled(
          ids.map((id) => chatService.deleteConversation(id))
        );
        const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled');
        const deletedSet = new Set(deletedIds);
        set((state) => ({
          conversations: state.conversations.filter((c) => !deletedSet.has(c.id)),
          activeConversationId:
            state.activeConversationId && deletedSet.has(state.activeConversationId)
              ? null
              : state.activeConversationId,
          messages:
            state.activeConversationId && deletedSet.has(state.activeConversationId)
              ? []
              : state.messages,
        }));
        // Re-fetch to pick up any remaining conversations beyond the deleted batch
        await get().fetchConversations();
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length > 0) {
          throw new Error(`Failed to delete ${failed.length} conversation(s)`);
        }
      },

      deleteAllConversations: async () => {
        await chatService.deleteAllConversations();
        set({ conversations: [], activeConversationId: null, messages: [] });
      },
    }),
    {
      name: STORAGE_KEYS.chatState,
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        agentMode: state.agentMode,
        agenticMode: state.agenticMode,
        temperature: state.temperature,
        systemPrompt: state.systemPrompt,
        memoryEnabled: state.memoryEnabled,
      }),
    }
  )
);
