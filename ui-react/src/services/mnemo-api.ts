/**
 * Mnemosyne Memory Service API - Memory lifecycle management
 */

// Enums
export const Stratum = {
  SIGNAL: 'signal',
  FACT: 'fact',
  INSIGHT: 'insight',
  PRINCIPLE: 'principle',
  AXIOM: 'axiom',
} as const;
export type StratumType = typeof Stratum[keyof typeof Stratum];

export const Scope = {
  PRIVATE: 'private',
  SHARED: 'shared',
  PUBLIC: 'public',
  UNIVERSAL: 'universal',
} as const;
export type ScopeType = typeof Scope[keyof typeof Scope];

export const Temporality = {
  EPHEMERAL: 'ephemeral',
  SESSION: 'session',
  PERSISTENT: 'persistent',
  ETERNAL: 'eternal',
} as const;
export type TemporalityType = typeof Temporality[keyof typeof Temporality];

export const Confidence = {
  OBSERVED: 'observed',
  INFERRED: 'inferred',
  VALIDATED: 'validated',
  PROVEN: 'proven',
} as const;
export type ConfidenceType = typeof Confidence[keyof typeof Confidence];

export const SensitivityLevel = {
  NONE: 'none',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  PII: 'pii',
  PHI: 'phi',
} as const;

export const MEMORY_SPACES = [
  'requirements', 'architecture', 'implementation', 'quality',
  'design', 'delivery', 'athena', 'system',
] as const;

// Interfaces
export interface MemoryUnit {
  id: string;
  stratum: string;
  scope: string;
  temporality: string;
  confidence: string;
  confidence_score: number;
  validation_count: number;
  contradiction_count: number;
  agent_id: string;
  agent_category: string;
  project_id: string | null;
  memory_space: string | null;
  content_type: string;
  content: Record<string, unknown>;
  summary: string;
  tags: string[];
  sensitivity_level: string;
  redacted: boolean;
  created_at: string;
  last_accessed: string | null;
}

export interface MemoryCreateRequest {
  content: Record<string, unknown>;
  summary: string;
  stratum?: StratumType;
  scope?: ScopeType;
  confidence?: ConfidenceType;
  temporality?: TemporalityType;
  content_type?: string;
  agent_id?: string;
  agent_category?: string;
  project_id: string;
  workflow_id?: string;
  tags?: string[];
  derived_from?: string[];
  supersedes_id?: string;
}

export interface MemorySearchRequest {
  query: string;
  project_id?: string;
  memory_space?: string;
  min_stratum?: StratumType;
  max_scope?: ScopeType;
  min_similarity?: number;
  limit?: number;
  max_tokens?: number;
}

export interface MemoryContestRequest {
  contradicting_content: Record<string, unknown>;
  contradicting_summary: string;
  contesting_agent_id?: string;
  contesting_agent_category?: string;
  project_id: string;
}

export interface MnemoHealth {
  status: string;
  postgres_connected: boolean;
  redis_connected: boolean;
  memory_count: number;
  event_count: number;
}

export interface MnemoStats {
  total_memories: number;
  by_stratum: Record<string, number>;
  by_scope: Record<string, number>;
  by_space: Record<string, number>;
  total_events: number;
}

export interface SpacePermission {
  space: string;
  min_stratum?: string;
  max_scope?: string;
  allowed_strata?: string[];
}

export interface MemoryContract {
  agent_category: string;
  read_spaces: SpacePermission[];
  write_spaces: SpacePermission[];
  subscriptions: string[];
  emissions: string[];
}

const API_BASE = '/api/v1/mnemo';

export function useMnemoAPI(token: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return {
    async getHealth(): Promise<MnemoHealth> {
      const r = await fetch(`${API_BASE}/health`, { headers });
      if (!r.ok) {throw new Error('Failed to fetch health');}
      return r.json();
    },

    async getStats(): Promise<MnemoStats> {
      const r = await fetch(`${API_BASE}/stats`, { headers });
      if (!r.ok) {throw new Error('Failed to fetch stats');}
      return r.json();
    },

    async searchMemories(params: MemorySearchRequest): Promise<{ results: MemoryUnit[]; count: number }> {
      const r = await fetch(`${API_BASE}/memories/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      if (!r.ok) {throw new Error('Search failed');}
      return r.json();
    },

    async getMemory(id: string): Promise<MemoryUnit> {
      const r = await fetch(`${API_BASE}/memories/${id}`, { headers });
      if (!r.ok) {throw new Error('Memory not found');}
      return r.json();
    },

    async getProjectMemories(projectId: string, filters?: {
      min_stratum?: string;
      scope?: string;
      memory_space?: string;
      limit?: number;
    }): Promise<{ memories: MemoryUnit[]; count: number }> {
      const qp = new URLSearchParams();
      if (filters?.min_stratum) {qp.set('min_stratum', filters.min_stratum);}
      if (filters?.scope) {qp.set('scope', filters.scope);}
      if (filters?.memory_space) {qp.set('memory_space', filters.memory_space);}
      if (filters?.limit) {qp.set('limit', String(filters.limit));}
      const r = await fetch(`${API_BASE}/memories/project/${projectId}?${qp}`, { headers });
      if (!r.ok) {throw new Error('Failed to fetch project memories');}
      return r.json();
    },

    async createMemory(data: MemoryCreateRequest): Promise<{ id: string; status: string }> {
      const r = await fetch(`${API_BASE}/memories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: 'Failed to create memory' }));
        throw new Error(err.detail || 'Failed to create memory');
      }
      return r.json();
    },

    async validateMemory(id: string, agent?: string): Promise<{ memory_id: string; status: string }> {
      const r = await fetch(`${API_BASE}/memories/${id}/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          validator_agent_id: agent || 'api',
          validator_agent_category: 'developer',
        }),
      });
      if (!r.ok) {throw new Error('Validation failed');}
      return r.json();
    },

    async contestMemory(id: string, data: MemoryContestRequest): Promise<{ new_memory_id: string; contested_memory_id: string; status: string }> {
      const r = await fetch(`${API_BASE}/memories/${id}/contest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!r.ok) {throw new Error('Contest failed');}
      return r.json();
    },

    async getContracts(): Promise<{ contracts: MemoryContract[] }> {
      const r = await fetch(`${API_BASE}/contracts`, { headers });
      if (!r.ok) {throw new Error('Failed to fetch contracts');}
      return r.json();
    },

    async seedContracts(): Promise<{ status: string }> {
      const r = await fetch(`${API_BASE}/contracts/seed`, { method: 'POST', headers });
      if (!r.ok) {throw new Error('Failed to seed contracts');}
      return r.json();
    },

    async triggerDecay(): Promise<{ status: string; stats: Record<string, unknown> }> {
      const r = await fetch(`${API_BASE}/metabolism/decay`, { method: 'POST', headers });
      if (!r.ok) {throw new Error('Decay trigger failed');}
      return r.json();
    },

    async triggerPromote(): Promise<{ status: string; stats: Record<string, unknown> }> {
      const r = await fetch(`${API_BASE}/metabolism/promote`, { method: 'POST', headers });
      if (!r.ok) {throw new Error('Promote trigger failed');}
      return r.json();
    },

    async triggerConsolidate(): Promise<{ status: string; stats: Record<string, unknown> }> {
      const r = await fetch(`${API_BASE}/metabolism/consolidate`, { method: 'POST', headers });
      if (!r.ok) {throw new Error('Consolidate trigger failed');}
      return r.json();
    },
  };
}
