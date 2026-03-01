import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export type ToolSource = 'mcp' | 'builtin' | 'custom';

export interface Tool {
  id: string;
  name: string;
  description: string;
  source: ToolSource;
  schema: {
    type: string;
    properties: Record<string, {
      type: string;
      description?: string;
      required?: boolean;
    }>;
    required?: string[];
  };
  category?: string;
}

export interface ScrapeOptions {
  mode: 'scrape' | 'crawl';
  url: string;
  maxDepth?: number;
  format?: 'markdown' | 'text' | 'html';
}

export interface ScrapeResult {
  url: string;
  content: string;
  format: string;
  metadata?: Record<string, unknown>;
}

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: EditorFile[];
}

export interface EditorProject {
  id: string;
  name: string;
  path: string;
}

export type TabId = 'mcp-tools' | 'web-scraper' | 'editor';

interface ToolsState {
  // Tab state
  activeTab: TabId;

  // MCP Tools state
  tools: Tool[];
  selectedTool: Tool | null;
  searchQuery: string;
  toolsLoading: boolean;
  toolsError: string | null;
  executionResult: unknown | null;
  executionLoading: boolean;
  executionError: string | null;

  // Web Scraper state
  scrapeUrl: string;
  scrapeOptions: ScrapeOptions;
  scrapeResults: ScrapeResult | null;
  scrapeLoading: boolean;
  scrapeError: string | null;

  // Editor state
  editorProjects: EditorProject[];
  selectedProject: EditorProject | null;
  editorFiles: EditorFile[];
  selectedFile: EditorFile | null;
  editorLoading: boolean;
  editorError: string | null;

  // Actions
  setActiveTab: (tab: TabId) => void;
  loadTools: () => Promise<void>;
  selectTool: (tool: Tool | null) => void;
  executeTool: (toolId: string, params: Record<string, unknown>) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setScrapeUrl: (url: string) => void;
  setScrapeOptions: (options: Partial<ScrapeOptions>) => void;
  startScrape: () => Promise<void>;
  loadEditorProjects: () => Promise<void>;
  selectProject: (project: EditorProject | null) => Promise<void>;
  loadEditorFiles: (projectId: string) => Promise<void>;
  selectFile: (file: EditorFile | null) => Promise<void>;
  saveFile: (fileId: string, content: string) => Promise<void>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('pronetheia_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const useToolsStore = create<ToolsState>((set, get) => ({
  // Initial state
  activeTab: 'mcp-tools',

  tools: [],
  selectedTool: null,
  searchQuery: '',
  toolsLoading: false,
  toolsError: null,
  executionResult: null,
  executionLoading: false,
  executionError: null,

  scrapeUrl: '',
  scrapeOptions: {
    mode: 'scrape',
    url: '',
    format: 'markdown',
    maxDepth: 3,
  },
  scrapeResults: null,
  scrapeLoading: false,
  scrapeError: null,

  editorProjects: [],
  selectedProject: null,
  editorFiles: [],
  selectedFile: null,
  editorLoading: false,
  editorError: null,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  loadTools: async () => {
    set({ toolsLoading: true, toolsError: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/tools/mcp`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load tools');
      }

      const data = await response.json();
      set({
        tools: data.tools || [],
        toolsLoading: false
      });
    } catch (error) {
      set({
        toolsError: error instanceof Error ? error.message : 'Unknown error',
        toolsLoading: false
      });
    }
  },

  selectTool: (tool) => set({
    selectedTool: tool,
    executionResult: null,
    executionError: null
  }),

  executeTool: async (toolId, params) => {
    set({ executionLoading: true, executionError: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/tools/mcp/${toolId}/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ params }),
      });

      if (!response.ok) {
        throw new Error('Tool execution failed');
      }

      const result = await response.json();
      set({
        executionResult: result,
        executionLoading: false
      });
    } catch (error) {
      set({
        executionError: error instanceof Error ? error.message : 'Execution failed',
        executionLoading: false
      });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setScrapeUrl: (url) => set({ scrapeUrl: url }),

  setScrapeOptions: (options) => set((state) => ({
    scrapeOptions: { ...state.scrapeOptions, ...options }
  })),

  startScrape: async () => {
    const { scrapeOptions } = get();
    set({ scrapeLoading: true, scrapeError: null, scrapeResults: null });

    try {
      const endpoint = scrapeOptions.mode === 'scrape'
        ? '/api/v1/firecrawl/scrape'
        : '/api/v1/firecrawl/crawl';

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          url: scrapeOptions.url,
          format: scrapeOptions.format,
          ...(scrapeOptions.mode === 'crawl' ? { maxDepth: scrapeOptions.maxDepth } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error('Scraping failed');
      }

      const result = await response.json();
      set({
        scrapeResults: result,
        scrapeLoading: false
      });
    } catch (error) {
      set({
        scrapeError: error instanceof Error ? error.message : 'Scraping failed',
        scrapeLoading: false
      });
    }
  },

  loadEditorProjects: async () => {
    set({ editorLoading: true, editorError: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/editor/projects`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      set({
        editorProjects: data.projects || [],
        editorLoading: false
      });
    } catch (error) {
      set({
        editorError: error instanceof Error ? error.message : 'Unknown error',
        editorLoading: false
      });
    }
  },

  selectProject: async (project) => {
    set({ selectedProject: project, selectedFile: null });
    if (project) {
      await get().loadEditorFiles(project.id);
    } else {
      set({ editorFiles: [] });
    }
  },

  loadEditorFiles: async (projectId) => {
    set({ editorLoading: true, editorError: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/editor/projects/${projectId}/files`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      set({
        editorFiles: data.files || [],
        editorLoading: false
      });
    } catch (error) {
      set({
        editorError: error instanceof Error ? error.message : 'Unknown error',
        editorLoading: false
      });
    }
  },

  selectFile: async (file) => {
    if (!file || file.type === 'folder') {
      set({ selectedFile: null });
      return;
    }

    set({ editorLoading: true, editorError: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/editor/files/${file.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load file content');
      }

      const data = await response.json();
      set({
        selectedFile: { ...file, content: data.content },
        editorLoading: false
      });
    } catch (error) {
      set({
        editorError: error instanceof Error ? error.message : 'Unknown error',
        editorLoading: false
      });
    }
  },

  saveFile: async (fileId, content) => {
    set({ editorLoading: true, editorError: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/editor/files/${fileId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save file');
      }

      // Update local state
      set((state) => ({
        selectedFile: state.selectedFile ? { ...state.selectedFile, content } : null,
        editorLoading: false
      }));
    } catch (error) {
      set({
        editorError: error instanceof Error ? error.message : 'Save failed',
        editorLoading: false
      });
    }
  },
}));
