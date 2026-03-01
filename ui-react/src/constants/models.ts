/**
 * Available AI Models
 * 
 * Central source of truth for all models across the application.
 * Used by ModelSelector component and agentic chat router.
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed?: 'ultra-fast' | 'fast' | 'standard';
  capabilities?: {
    thinking?: boolean;
    vision?: boolean;
    imageGen?: boolean;
    longContext?: boolean;
    code?: boolean;
    realtime?: boolean;
    streaming?: boolean;
    tools?: boolean;
    agents?: boolean;
  };
}

/**
 * All available models
 * 
 * Provider groups:
 * - Z.AI: Subscription endpoint (GLM Coding Plan)
 * - Anthropic: Direct API
 * - Cerebras: Ultra-fast inference (~2000 tok/s)
 * - Groq: Fast inference (~500 tok/s)
 * - DeepSeek: Direct API, excellent for coding
 * - GLM: ZhipuAI direct API (China)
 * - Local: Local llama.cpp models
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  // =============================================================================
  // Z.AI GLM MODELS (Subscription - Coding Plan)
  // Uses Anthropic-compatible endpoint at api.z.ai/api/anthropic
  // =============================================================================
  {
    id: 'zai/glm-5',
    name: 'GLM-5',
    provider: 'Z.AI',
    description: 'Opus-level, complex reasoning',
    speed: 'standard',
    capabilities: { thinking: true, vision: true, longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'zai/glm-4.7',
    name: 'GLM-4.7',
    provider: 'Z.AI',
    description: 'Sonnet-level, daily development',
    speed: 'fast',
    capabilities: { vision: true, longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'zai/glm-4.5-air',
    name: 'GLM-4.5 Air',
    provider: 'Z.AI',
    description: 'Haiku-level, fast & efficient',
    speed: 'ultra-fast',
    capabilities: { longContext: true, realtime: true, streaming: true },
  },

  // =============================================================================
  // ANTHROPIC CLAUDE MODELS (Direct API)
  // =============================================================================
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    description: 'Latest flagship, 200K context',
    speed: 'standard',
    capabilities: { thinking: true, vision: true, longContext: true, code: true, tools: true, agents: true, streaming: true },
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    description: 'Most capable for complex tasks',
    speed: 'standard',
    capabilities: { thinking: true, vision: true, longContext: true, code: true, tools: true, agents: true, streaming: true },
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Best balance of speed and intelligence',
    speed: 'fast',
    capabilities: { thinking: true, vision: true, longContext: true, code: true, tools: true, agents: true, streaming: true },
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Previous generation balanced',
    speed: 'fast',
    capabilities: { vision: true, longContext: true, code: true, tools: true, agents: true, streaming: true },
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient',
    speed: 'ultra-fast',
    capabilities: { vision: true, longContext: true, tools: true, streaming: true },
  },

  // =============================================================================
  // CEREBRAS MODELS (Ultra-fast inference ~2000 tok/s)
  // =============================================================================
  {
    id: 'cerebras/llama-3.1-8b',
    name: 'Llama 3.1 8B (Cerebras)',
    provider: 'Cerebras',
    description: 'FREE ultra-fast inference',
    speed: 'ultra-fast',
    capabilities: { realtime: true, streaming: true },
  },
  {
    id: 'cerebras/llama-3.1-70b',
    name: 'Llama 3.1 70B (Cerebras)',
    provider: 'Cerebras',
    description: 'Fastest 70B inference',
    speed: 'ultra-fast',
    capabilities: { realtime: true, tools: true, streaming: true },
  },

  // =============================================================================
  // GROQ MODELS (Fast inference ~500 tok/s)
  // =============================================================================
  {
    id: 'groq/llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'Groq',
    description: 'High quality, ~100ms latency',
    speed: 'ultra-fast',
    capabilities: { realtime: true, tools: true, longContext: true, streaming: true },
  },
  {
    id: 'groq/llama-3.1-8b-instant',
    name: 'Llama 3.1 8B (Groq)',
    provider: 'Groq',
    description: 'Ultra-fast for simple tasks',
    speed: 'ultra-fast',
    capabilities: { realtime: true, streaming: true },
  },
  {
    id: 'groq/mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (Groq)',
    provider: 'Groq',
    description: 'MoE model, good balance',
    speed: 'ultra-fast',
    capabilities: { realtime: true, longContext: true, streaming: true },
  },

  // =============================================================================
  // DEEPSEEK MODELS (Direct API)
  // =============================================================================
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Excellent for coding',
    speed: 'fast',
    capabilities: { longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'deepseek/deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    description: 'Code-specialized',
    speed: 'fast',
    capabilities: { longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'deepseek/deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    description: 'Reasoning model, complex problems',
    speed: 'standard',
    capabilities: { thinking: true, longContext: true, streaming: true },
  },

  // =============================================================================
  // GLM MODELS (ZhipuAI Direct API - China)
  // =============================================================================
  {
    id: 'glm/glm-4-flash',
    name: 'GLM-4 Flash',
    provider: 'GLM',
    description: 'Ultra-cheap, ultra-fast',
    speed: 'ultra-fast',
    capabilities: { tools: true, longContext: true, streaming: true },
  },
  {
    id: 'glm/glm-4-air',
    name: 'GLM-4 Air',
    provider: 'GLM',
    description: 'Fast, cost-effective',
    speed: 'fast',
    capabilities: { tools: true, longContext: true, streaming: true },
  },
  {
    id: 'glm/glm-4-plus',
    name: 'GLM-4 Plus',
    provider: 'GLM',
    description: 'Flagship Chinese/English',
    speed: 'standard',
    capabilities: { tools: true, longContext: true, code: true, streaming: true },
  },

  // =============================================================================
  // LOCAL MODELS (llama.cpp)
  // =============================================================================
  {
    id: 'local/mistral-7b',
    name: 'Mistral 7B (Local)',
    provider: 'Local',
    description: 'FREE local inference',
    speed: 'fast',
    capabilities: { streaming: true },
  },
  {
    id: 'local/minimax-228b',
    name: 'MiniMax 228B (Local)',
    provider: 'Local',
    description: 'FREE local reasoning',
    speed: 'standard',
    capabilities: { thinking: true, streaming: true },
  },

  // =============================================================================
  // OPENAI MODELS (via OpenRouter or Direct API)
  // =============================================================================
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'OpenAI flagship multimodal',
    speed: 'fast',
    capabilities: { vision: true, imageGen: true, longContext: true, tools: true, agents: true, streaming: true },
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and affordable',
    speed: 'ultra-fast',
    capabilities: { vision: true, longContext: true, tools: true, streaming: true },
  },
  {
    id: 'o1-preview',
    name: 'o1 Preview',
    provider: 'OpenAI',
    description: 'Advanced reasoning',
    speed: 'standard',
    capabilities: { thinking: true, longContext: true, code: true },
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    provider: 'OpenAI',
    description: 'Faster reasoning',
    speed: 'fast',
    capabilities: { thinking: true, code: true },
  },

  // =============================================================================
  // GOOGLE MODELS (via OpenRouter or Direct API)
  // =============================================================================
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Latest generation, very fast',
    speed: 'ultra-fast',
    capabilities: { vision: true, longContext: true, tools: true, realtime: true, streaming: true },
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: '1M token context',
    speed: 'fast',
    capabilities: { vision: true, longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    description: 'Fast, 1M context',
    speed: 'ultra-fast',
    capabilities: { vision: true, longContext: true, tools: true, realtime: true, streaming: true },
  },

  // =============================================================================
  // META LLAMA MODELS (via OpenRouter)
  // =============================================================================
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Latest Llama, high performance',
    speed: 'fast',
    capabilities: { longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'llama-3.1-405b',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    description: 'Largest open-weight model',
    speed: 'standard',
    capabilities: { longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    description: 'High performance open model',
    speed: 'fast',
    capabilities: { longContext: true, tools: true, streaming: true },
  },
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    description: 'Fast open-weight model',
    speed: 'ultra-fast',
    capabilities: { longContext: true, streaming: true },
  },

  // =============================================================================
  // MISTRAL MODELS (via OpenRouter or Direct API)
  // =============================================================================
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'Flagship multilingual',
    speed: 'standard',
    capabilities: { longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    provider: 'Mistral',
    description: 'Fast and efficient',
    speed: 'ultra-fast',
    capabilities: { tools: true, realtime: true, streaming: true },
  },
  {
    id: 'codestral-latest',
    name: 'Codestral',
    provider: 'Mistral',
    description: 'Code-specialized',
    speed: 'fast',
    capabilities: { code: true, longContext: true, streaming: true },
  },

  // =============================================================================
  // XAI MODELS (via OpenRouter)
  // =============================================================================
  {
    id: 'grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    description: 'Latest Grok model',
    speed: 'fast',
    capabilities: { vision: true, longContext: true, tools: true, streaming: true },
  },

  // =============================================================================
  // QWEN MODELS (via OpenRouter)
  // =============================================================================
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    provider: 'Qwen',
    description: 'Large multilingual model',
    speed: 'standard',
    capabilities: { longContext: true, tools: true, code: true, streaming: true },
  },
  {
    id: 'qwen-2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'Qwen',
    description: 'Code-specialized',
    speed: 'fast',
    capabilities: { code: true, longContext: true, streaming: true },
  },
  {
    id: 'qwq-32b-preview',
    name: 'QwQ 32B',
    provider: 'Qwen',
    description: 'Reasoning-focused',
    speed: 'standard',
    capabilities: { thinking: true, longContext: true, code: true, streaming: true },
  },

  // =============================================================================
  // MOONSHOT AI / KIMI MODELS (via OpenRouter)
  // =============================================================================
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    provider: 'MoonshotAI',
    description: '1T params, 128K context, agentic',
    speed: 'standard',
    capabilities: { longContext: true, agents: true, tools: true, streaming: true },
  },
  {
    id: 'kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'MoonshotAI',
    description: 'Advanced reasoning, 256K context',
    speed: 'standard',
    capabilities: { thinking: true, longContext: true, agents: true, streaming: true },
  },
];

/**
 * Default model for agentic chat
 */
export const DEFAULT_AGENTIC_MODEL = 'zai/glm-4.7';

/**
 * Default model for simple chat
 */
export const DEFAULT_SIMPLE_MODEL = 'cerebras/llama-3.1-8b';

/**
 * Get model info by ID
 */
export function getModelById(id: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: string): ModelInfo[] {
  return AVAILABLE_MODELS.filter(m => m.provider === provider);
}

/**
 * Get models with a specific capability
 */
export function getModelsByCapability(capability: keyof NonNullable<ModelInfo['capabilities']>): ModelInfo[] {
  return AVAILABLE_MODELS.filter(m => m.capabilities?.[capability]);
}