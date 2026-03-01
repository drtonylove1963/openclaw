import { create } from 'zustand';

export interface Episode {
  id: string;
  agentId: string;
  agentName: string;
  eventType: 'perception' | 'consolidation' | 'retrieval' | 'working_memory';
  content: Record<string, unknown>;
  summary: string;
  salienceScore: number;
  occurredAt: string;
  sessionId?: string;
}

export interface MemoryFilters {
  eventType: string | null;
  agentId: string | null;
  dateRange: { start: string; end: string } | null;
  minSalience: number;
}

export interface MemoryVitals {
  episodicCount: number;
  factsCount: number;
  entitiesCount: number;
  relationsCount: number;
  consolidationActive: boolean;
  lastConsolidation: string;
}

export interface MemorySearchResult {
  id: string;
  source: 'episodic' | 'knowledge';
  content: Record<string, unknown>;
  score: number;
  eventType?: string;
  agentId?: string;
  occurredAt?: string;
}

interface MemoryState {
  episodes: Episode[];
  searchResults: MemorySearchResult[];
  searchQuery: string;
  activeTab: 'timeline' | 'knowledge-graph' | 'search' | 'analytics' | 'mnemosyne' | 'learnings';
  filters: MemoryFilters;
  vitals: MemoryVitals | null;
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMoreEpisodes: boolean;
}

interface MemoryActions {
  searchMemory: (query: string) => Promise<void>;
  loadEpisodes: (offset: number) => Promise<void>;
  loadMoreEpisodes: () => Promise<void>;
  setActiveTab: (tab: MemoryState['activeTab']) => void;
  setFilters: (filters: Partial<MemoryFilters>) => void;
  clearFilters: () => void;
  loadVitals: () => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export const useMemoryStore = create<MemoryState & MemoryActions>()((set, _get) => ({
  episodes: [],
  searchResults: [],
  searchQuery: '',
  activeTab: 'timeline',
  filters: {
    eventType: null,
    agentId: null,
    dateRange: null,
    minSalience: 0,
  },
  vitals: null,
  isSearching: false,
  isLoadingMore: false,
  hasMoreEpisodes: true,

  searchMemory: async (_query: string) => {
    set({ isSearching: true });
    // Implementation will call GET /api/v1/memory/search
    set({ isSearching: false });
  },

  loadEpisodes: async (_offset: number) => {
    // Implementation will call GET /api/v1/memory/search with filters
  },

  loadMoreEpisodes: async () => {
    set({ isLoadingMore: true });
    // Implementation will paginate
    set({ isLoadingMore: false });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearFilters: () =>
    set({
      filters: {
        eventType: null,
        agentId: null,
        dateRange: null,
        minSalience: 0,
      },
    }),

  loadVitals: async () => {
    // Implementation will call GET /api/v1/ums/health
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
