import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  size: number;
  type: string;
}

interface Session {
  id: string;
  name: string;
  createdAt: string;
  model: string;
  content: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
}

type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';
type ActiveTab = 'oneshot' | 'code-ide';

interface BuildState {
  // Tab state
  activeTab: ActiveTab;

  // OneShot state
  description: string;
  industry: string;
  generationStatus: GenerationStatus;
  generatedFiles: GeneratedFile[];
  currentSessionId: string | null;
  errorMessage: string | null;

  // Code IDE state
  sessions: Session[];
  activeSessionId: string | null;
  selectedModel: string;
  skills: Skill[];
  models: Model[];
  skillsLoading: boolean;
  sessionsLoading: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setDescription: (description: string) => void;
  setIndustry: (industry: string) => void;
  startGeneration: () => Promise<void>;
  pollGenerationStatus: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  createSession: (name: string) => Promise<void>;
  selectSession: (sessionId: string) => void;
  loadSkills: () => Promise<void>;
  loadModels: () => Promise<void>;
  setSelectedModel: (modelId: string) => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  // Initial state
  activeTab: 'oneshot',
  description: '',
  industry: 'SaaS',
  generationStatus: 'idle',
  generatedFiles: [],
  currentSessionId: null,
  errorMessage: null,
  sessions: [],
  activeSessionId: null,
  selectedModel: 'claude-opus-4-6',
  skills: [],
  models: [],
  skillsLoading: false,
  sessionsLoading: false,

  // Tab actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  // OneShot actions
  setDescription: (description) => set({ description }),
  setIndustry: (industry) => set({ industry }),

  startGeneration: async () => {
    const { description, industry } = get();

    if (!description.trim()) {
      set({ errorMessage: 'Please provide a description', generationStatus: 'error' });
      return;
    }

    set({ generationStatus: 'generating', errorMessage: null, generatedFiles: [] });

    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/oneshot/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ description, industry }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Generation failed');
      }

      const data = await response.json();
      set({ currentSessionId: data.session_id });

      // Start polling for status
      get().pollGenerationStatus(data.session_id);
    } catch (error) {
      console.error('Generation error:', error);
      set({
        generationStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Generation failed',
      });
    }
  },

  pollGenerationStatus: async (sessionId: string) => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('pronetheia_token');
        const response = await fetch(`${API_BASE}/api/v1/oneshot/status/${sessionId}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        if (data.status === 'complete') {
          set({
            generationStatus: 'complete',
            generatedFiles: data.files || [],
          });
        } else if (data.status === 'error') {
          set({
            generationStatus: 'error',
            errorMessage: data.error || 'Generation failed',
          });
        } else if (data.status === 'generating') {
          // Continue polling
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Status polling error:', error);
        set({
          generationStatus: 'error',
          errorMessage: 'Failed to check generation status',
        });
      }
    };

    checkStatus();
  },

  // Code IDE actions
  loadSessions: async () => {
    set({ sessionsLoading: true });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/code-ide/sessions`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      set({ sessions: data.sessions || [], sessionsLoading: false });
    } catch (error) {
      console.error('Load sessions error:', error);
      set({ sessions: [], sessionsLoading: false });
    }
  },

  createSession: async (name: string) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/code-ide/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name,
          model: get().selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      const newSession: Session = {
        id: data.session_id,
        name,
        createdAt: new Date().toISOString(),
        model: get().selectedModel,
        content: '',
      };

      set({
        sessions: [newSession, ...get().sessions],
        activeSessionId: newSession.id,
      });
    } catch (error) {
      console.error('Create session error:', error);
    }
  },

  selectSession: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  loadSkills: async () => {
    set({ skillsLoading: true });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/skills`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load skills');
      }

      const data = await response.json();
      set({ skills: data.skills || [], skillsLoading: false });
    } catch (error) {
      console.error('Load skills error:', error);
      // Set some default skills for demo
      set({
        skills: [
          {
            id: '1',
            name: 'React Development',
            description: 'Build modern React applications with hooks and context',
            category: 'Frontend',
            version: '1.0.0',
          },
          {
            id: '2',
            name: 'API Design',
            description: 'Design RESTful and GraphQL APIs',
            category: 'Backend',
            version: '1.0.0',
          },
          {
            id: '3',
            name: 'Database Modeling',
            description: 'Design and optimize database schemas',
            category: 'Database',
            version: '1.0.0',
          },
          {
            id: '4',
            name: 'Testing',
            description: 'Write comprehensive unit and integration tests',
            category: 'Quality',
            version: '1.0.0',
          },
          {
            id: '5',
            name: 'DevOps',
            description: 'Setup CI/CD pipelines and deployment',
            category: 'Infrastructure',
            version: '1.0.0',
          },
        ],
        skillsLoading: false,
      });
    }
  },

  loadModels: async () => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/models`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load models');
      }

      const data = await response.json();
      set({ models: data.models || [] });
    } catch (error) {
      console.error('Load models error:', error);
      // Set default models
      set({
        models: [
          {
            id: 'claude-opus-4-6',
            name: 'Claude Opus 4.6',
            provider: 'Anthropic',
            contextWindow: 200000,
          },
          {
            id: 'claude-sonnet-4-5',
            name: 'Claude Sonnet 4.5',
            provider: 'Anthropic',
            contextWindow: 200000,
          },
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            provider: 'OpenAI',
            contextWindow: 128000,
          },
        ],
      });
    }
  },

  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },
}));
