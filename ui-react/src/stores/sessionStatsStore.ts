/**
 * sessionStatsStore.ts - Zustand store for tracking session-level usage statistics
 * Tracks token usage, costs, model usage, and agent activity during a chat session.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Provider pricing per 1K tokens (from backend cost/service.py)
export const PROVIDER_PRICING: Record<string, { input: number; output: number }> = {
  anthropic: { input: 0.003, output: 0.015 },
  openai: { input: 0.005, output: 0.015 },
  google: { input: 0.00125, output: 0.005 },
  openrouter: { input: 0.003, output: 0.015 }, // varies by model, using default
  ollama: { input: 0, output: 0 }, // local, free
};

export interface ModelUsage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
}

export interface AgentUsage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
  lastActive: Date;
}

export interface UsageDataPoint {
  timestamp: Date;
  inputTokens: number;
  outputTokens: number;
  model: string;
  agent?: string;
}

export interface SessionStats {
  // Totals
  totalInputTokens: number;
  totalOutputTokens: number;
  totalInputCost: number;
  totalOutputCost: number;
  totalCalls: number;

  // Breakdown by model
  modelUsage: Record<string, ModelUsage>;

  // Breakdown by agent
  agentUsage: Record<string, AgentUsage>;

  // Time series data for charts
  usageHistory: UsageDataPoint[];

  // Session metadata
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
}

interface SessionStatsState extends SessionStats {
  // Actions
  recordUsage: (params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    agent?: string;
    provider?: string;
  }) => void;
  resetSession: () => void;
  getFormattedCost: (cost: number) => string;
  getFormattedTokens: (tokens: number) => string;
  getTotalCost: () => number;
}

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const calculateCost = (tokens: number, rate: number): number => {
  return (tokens / 1000) * rate;
};

const getProviderFromModel = (model: string): string => {
  if (model.includes('claude') || model.includes('anthropic')) {return 'anthropic';}
  if (model.includes('gpt') || model.includes('openai')) {return 'openai';}
  if (model.includes('gemini') || model.includes('google')) {return 'google';}
  if (model.includes('ollama') || model.includes('llama')) {return 'ollama';}
  return 'openrouter'; // default for OpenRouter models
};

const initialState: SessionStats = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalInputCost: 0,
  totalOutputCost: 0,
  totalCalls: 0,
  modelUsage: {},
  agentUsage: {},
  usageHistory: [],
  sessionId: generateSessionId(),
  startTime: new Date(),
  lastActivity: new Date(),
};

export const useSessionStatsStore = create<SessionStatsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      recordUsage: ({ model, inputTokens, outputTokens, agent, provider }) => {
        const actualProvider = provider || getProviderFromModel(model);
        const pricing = PROVIDER_PRICING[actualProvider] || PROVIDER_PRICING.openrouter;

        const inputCost = calculateCost(inputTokens, pricing.input);
        const outputCost = calculateCost(outputTokens, pricing.output);

        set((state) => {
          // Update model usage
          const currentModelUsage = state.modelUsage[model] || {
            calls: 0,
            inputTokens: 0,
            outputTokens: 0,
            inputCost: 0,
            outputCost: 0,
          };

          const updatedModelUsage = {
            ...state.modelUsage,
            [model]: {
              calls: currentModelUsage.calls + 1,
              inputTokens: currentModelUsage.inputTokens + inputTokens,
              outputTokens: currentModelUsage.outputTokens + outputTokens,
              inputCost: currentModelUsage.inputCost + inputCost,
              outputCost: currentModelUsage.outputCost + outputCost,
            },
          };

          // Update agent usage if agent is specified
          let updatedAgentUsage = state.agentUsage;
          if (agent) {
            const currentAgentUsage = state.agentUsage[agent] || {
              calls: 0,
              inputTokens: 0,
              outputTokens: 0,
              model: '',
              lastActive: new Date(),
            };

            updatedAgentUsage = {
              ...state.agentUsage,
              [agent]: {
                calls: currentAgentUsage.calls + 1,
                inputTokens: currentAgentUsage.inputTokens + inputTokens,
                outputTokens: currentAgentUsage.outputTokens + outputTokens,
                model: model, // Track last used model
                lastActive: new Date(),
              },
            };
          }

          // Add to usage history
          const dataPoint: UsageDataPoint = {
            timestamp: new Date(),
            inputTokens,
            outputTokens,
            model,
            agent,
          };

          return {
            totalInputTokens: state.totalInputTokens + inputTokens,
            totalOutputTokens: state.totalOutputTokens + outputTokens,
            totalInputCost: state.totalInputCost + inputCost,
            totalOutputCost: state.totalOutputCost + outputCost,
            totalCalls: state.totalCalls + 1,
            modelUsage: updatedModelUsage,
            agentUsage: updatedAgentUsage,
            usageHistory: [...state.usageHistory, dataPoint],
            lastActivity: new Date(),
          };
        });
      },

      resetSession: () => {
        set({
          ...initialState,
          sessionId: generateSessionId(),
          startTime: new Date(),
          lastActivity: new Date(),
        });
      },

      getFormattedCost: (cost: number) => {
        return `$${cost.toFixed(4)}`;
      },

      getFormattedTokens: (tokens: number) => {
        if (tokens >= 1000000) {
          return `${(tokens / 1000000).toFixed(1)}M`;
        }
        if (tokens >= 1000) {
          return `${(tokens / 1000).toFixed(1)}K`;
        }
        return tokens.toLocaleString();
      },

      getTotalCost: () => {
        const state = get();
        return state.totalInputCost + state.totalOutputCost;
      },
    }),
    { name: 'pronetheia-session-stats' }
  )
);

// Selectors
export const selectTotalTokens = (state: SessionStatsState) =>
  state.totalInputTokens + state.totalOutputTokens;

export const selectTotalCost = (state: SessionStatsState) =>
  state.totalInputCost + state.totalOutputCost;

export const selectModelCount = (state: SessionStatsState) =>
  Object.keys(state.modelUsage).length;

export const selectAgentCount = (state: SessionStatsState) =>
  Object.keys(state.agentUsage).length;

export default useSessionStatsStore;
