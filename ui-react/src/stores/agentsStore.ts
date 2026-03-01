import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  model: string;
  tools: string[];
  status: 'active' | 'idle' | 'offline';
  skills?: string[];
  icon?: string;
  system_prompt?: string;
  color?: string;
  ownership?: string;
  phase?: string;
  executionHistory?: AgentExecution[];
}

export interface AgentExecution {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'running';
  duration?: number;
  task: string;
}

export interface AgentUpdateData {
  name?: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  tools?: string[];
  icon?: string;
  color?: string;
  phase?: string;
}

export interface AgentTeam {
  id: string;
  name: string;
  members: string[];
  status: 'active' | 'idle';
}

interface AgentsState {
  agents: Agent[];
  teams: AgentTeam[];
  activeAgents: string[];
  selectedAgent: Agent | null;
  filter: {
    category: string | null;
    search: string;
  };
  categories: string[];
  loading: boolean;
  error: string | null;
}

interface AgentsActions {
  loadAgents: () => Promise<void>;
  loadTeams: () => Promise<void>;
  loadCategories: () => Promise<void>;
  selectAgent: (id: string | null) => void;
  setFilter: (filter: Partial<AgentsState['filter']>) => void;
  clearFilter: () => void;
  createTeam: (team: Partial<AgentTeam>) => Promise<void>;
  executeAgent: (agentId: string, task: string) => Promise<void>;
  updateAgent: (slug: string, updates: AgentUpdateData) => Promise<void>;
  deleteAgent: (slug: string) => Promise<void>;
  refreshAgent: (slug: string) => Promise<void>;
}

export const useAgentsStore = create<AgentsState & AgentsActions>()((set, get) => ({
  agents: [],
  teams: [],
  activeAgents: [],
  selectedAgent: null,
  filter: {
    category: null,
    search: '',
  },
  categories: [],
  loading: false,
  error: null,

  loadAgents: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agents`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.statusText}`);
      }

      const data = await response.json();
      const agents = Array.isArray(data) ? data : data.agents || [];

      // Extract active agents (those with status 'active')
      const activeAgents = agents
        .filter((a: Agent) => a.status === 'active')
        .map((a: Agent) => a.id);

      set({ agents, activeAgents, loading: false });
    } catch (error) {
      console.error('Failed to load agents:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load agents',
        loading: false
      });
    }
  },

  loadTeams: async () => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agent-teams/projects`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        // Teams endpoint may not be available; AgentTeamsTab uses localStorage instead
        return;
      }

      const data = await response.json();
      const teams = Array.isArray(data) ? data : data.teams || [];
      set({ teams });
    } catch {
      // Silently ignore - teams are managed via localStorage in AgentTeamsTab
    }
  },

  loadCategories: async () => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agents/categories`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        // Fallback: extract categories from loaded agents
        const uniqueCategories = Array.from(
          new Set(get().agents.map((a) => a.category))
        );
        set({ categories: uniqueCategories });
        return;
      }

      const data = await response.json();
      const categories = Array.isArray(data) ? data : data.categories || [];
      set({ categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback: extract categories from loaded agents
      const uniqueCategories = Array.from(
        new Set(get().agents.map((a) => a.category))
      );
      set({ categories: uniqueCategories });
    }
  },

  selectAgent: (id) => {
    if (!id) {
      set({ selectedAgent: null });
      return;
    }
    const agent = get().agents.find((a) => a.id === id) || null;
    set({ selectedAgent: agent });
  },

  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),

  clearFilter: () => set({ filter: { category: null, search: '' } }),

  createTeam: async (team: Partial<AgentTeam>) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agent-teams/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(team),
      });

      if (!response.ok) {
        // Fallback: add to local state only (AgentTeamsTab uses localStorage)
        const newTeam = { id: crypto.randomUUID(), ...team } as AgentTeam;
        set((state) => ({ teams: [...state.teams, newTeam] }));
        return;
      }

      const newTeam = await response.json();
      set((state) => ({ teams: [...state.teams, newTeam] }));
    } catch {
      // Fallback: add to local state only
      const newTeam = { id: crypto.randomUUID(), ...team } as AgentTeam;
      set((state) => ({ teams: [...state.teams, newTeam] }));
    }
  },

  executeAgent: async (agentId: string, task: string) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) {
        throw new Error(`Failed to execute agent: ${response.statusText}`);
      }

      // Reload agents to get updated execution history
      await get().loadAgents();
    } catch (error) {
      console.error('Failed to execute agent:', error);
      throw error;
    }
  },

  updateAgent: async (slug: string, updates: AgentUpdateData) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agents/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update agent: ${response.statusText}`);
      }

      const updatedAgent = await response.json();

      // Update agent in local state
      set((state) => ({
        agents: state.agents.map((a) => (a.slug === slug ? { ...a, ...updatedAgent } : a)),
        selectedAgent: state.selectedAgent?.slug === slug
          ? { ...state.selectedAgent, ...updatedAgent }
          : state.selectedAgent,
      }));
    } catch (error) {
      console.error('Failed to update agent:', error);
      throw error;
    }
  },

  deleteAgent: async (slug: string) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agents/${slug}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete agent: ${response.statusText}`);
      }

      // Remove from local state
      set((state) => ({
        agents: state.agents.filter((a) => a.slug !== slug),
        selectedAgent: state.selectedAgent?.slug === slug ? null : state.selectedAgent,
      }));
    } catch (error) {
      console.error('Failed to delete agent:', error);
      throw error;
    }
  },

  refreshAgent: async (slug: string) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/agents/${slug}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh agent: ${response.statusText}`);
      }

      const updatedAgent = await response.json();

      // Update agent in local state
      set((state) => ({
        agents: state.agents.map((a) => (a.slug === slug ? { ...a, ...updatedAgent } : a)),
        selectedAgent: state.selectedAgent?.slug === slug
          ? { ...state.selectedAgent, ...updatedAgent }
          : state.selectedAgent,
      }));
    } catch (error) {
      console.error('Failed to refresh agent:', error);
      throw error;
    }
  },
}));
