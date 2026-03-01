/**
 * Chat system constants.
 * Centralizes all magic values from ChatPage, ChatSidebar, chatStore, chatService.
 */

import { API_BASE_URL } from '../config/api';
import { AVAILABLE_MODELS, DEFAULT_SIMPLE_MODEL, DEFAULT_AGENTIC_MODEL, type ModelInfo } from './models';

// Re-export for backward compatibility
export { AVAILABLE_MODELS as FALLBACK_MODELS, DEFAULT_SIMPLE_MODEL, DEFAULT_AGENTIC_MODEL };
export type { ModelInfo };

// === API Endpoints ===

export const CHAT_ENDPOINTS = {
  simple: `${API_BASE_URL}/api/v1/chat/simple`,
  agentStream: `${API_BASE_URL}/api/v1/chat/agent-stream`,
  agenticStream: `${API_BASE_URL}/api/v1/chat/agentic-stream`,  // True agentic loop (like Claude Code)
  conversations: `${API_BASE_URL}/api/v1/chat/persistent/conversations`,
  swarmCreate: `${API_BASE_URL}/api/v1/swarm/create`,
  swarmExecute: (id: string) => `${API_BASE_URL}/api/v1/swarm/${id}/execute`,
  models: `${API_BASE_URL}/api/v1/models/`,
} as const;

// === localStorage Keys ===

export const STORAGE_KEYS = {
  token: 'pronetheia_token',
  refreshToken: 'pronetheia_refresh_token',
  user: 'pronetheia_user',
  chatState: 'pronetheia-chat',
} as const;

// === File Upload ===

export const FILE_UPLOAD = {
  maxSizeBytes: 10 * 1024 * 1024,
  maxSizeMB: 10,
  /** Max text content to inline (50KB) */
  maxInlineBytes: 50_000,
  acceptedTypes: '.txt,.pdf,.py,.js,.ts,.json,.md,.csv,.xml,.yaml,.yml,.html,.css,.log',
  /** Extensions that can be read as text */
  textExtensions: new Set([
    '.txt', '.py', '.js', '.ts', '.json', '.md', '.csv',
    '.xml', '.yaml', '.yml', '.html', '.css', '.log',
  ]),
  /** Extensions that are binary (cannot inline) */
  binaryExtensions: new Set(['.pdf']),
} as const;

// === Chat Defaults ===

export const CHAT_DEFAULTS = {
  defaultModelId: DEFAULT_SIMPLE_MODEL,
  agenticModelId: DEFAULT_AGENTIC_MODEL,
  defaultTemperature: 0.7,
  defaultAgentMode: 'standard' as const,
  placeholder: 'Message Athena...',
  maxTextareaHeight: 150,
  sidebarWidth: 260,
  sidebarCollapsedWidth: 60,
} as const;

// === Swarm Strategies ===

export type SwarmStrategy = 'democratic' | 'competitive' | 'collaborative' | 'hierarchical' | 'stigmergic';

export const SWARM_STRATEGIES: readonly { id: SwarmStrategy; label: string; description: string }[] = [
  { id: 'collaborative', label: 'Collaborative', description: 'Agents work together' },
  { id: 'democratic', label: 'Democratic', description: 'Agents vote on decisions' },
  { id: 'competitive', label: 'Competitive', description: 'Agents compete for best solution' },
  { id: 'hierarchical', label: 'Hierarchical', description: 'Leader coordinates agents' },
  { id: 'stigmergic', label: 'Stigmergic', description: 'Indirect coordination via shared state' },
] as const;

// === Validation ===

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// === SSE Buffer ===

export const SSE_MAX_BUFFER_SIZE = 10 * 1024 * 1024;

// === Agent Modes ===

export type AgentMode = 'standard' | 'multi-agent' | 'swarm';

export const AGENT_MODES: readonly { id: AgentMode; label: string; color: string; title: string }[] = [
  { id: 'standard', label: 'Standard', color: '#a0a0b0', title: 'Pure LLM - direct model response' },
  { id: 'multi-agent', label: 'Agent', color: '#8b5cf6', title: 'Multi-Agent - specialist orchestration' },
  { id: 'swarm', label: 'Swarm', color: '#f59e0b', title: 'Swarm Intelligence - collaborative AI swarm' },
] as const;

// === Channel Colors ===

export const CHANNEL_COLORS: Record<string, string> = {
  telegram: '#0088cc',
  whatsapp: '#25D366',
  voice: '#8b5cf6',
  web: '#00d4ff',
} as const;

// === Date Grouping ===

export const DATE_GROUP_DAYS = 7;
