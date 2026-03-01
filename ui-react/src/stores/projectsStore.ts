import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export type ProjectStatus = 'active' | 'paused' | 'complete';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  tech_stack: string[];
  git_repo_url?: string;
  progress: number; // 0-100
  last_modified: string;
  created_at: string;
}

export interface ProjectFilter {
  status?: ProjectStatus | 'all';
  search: string;
}

interface ProjectsState {
  // State
  projects: Project[];
  activeTab: 'projects' | 'sprint-board';
  selectedProject: Project | null;
  filter: ProjectFilter;
  loading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'last_modified' | 'progress'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  selectProject: (project: Project | null) => void;
  setFilter: (filter: Partial<ProjectFilter>) => void;
  setActiveTab: (tab: 'projects' | 'sprint-board') => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // Initial state
  projects: [],
  activeTab: 'projects',
  selectedProject: null,
  filter: {
    status: 'all',
    search: '',
  },
  loading: false,
  error: null,

  // Load projects from API
  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/projects`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`);
      }

      const data = await response.json();
      set({ projects: data.projects ?? [], loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      set({ error: message, loading: false });
      console.error('Load projects error:', error);
    }
  },

  // Create new project
  createProject: async (project) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }

      const newProject = await response.json();
      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: message, loading: false });
      console.error('Create project error:', error);
      throw error; // Re-throw so modal can handle it
    }
  },

  // Update existing project
  updateProject: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }

      const updatedProject = await response.json();
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        selectedProject: state.selectedProject?.id === id ? updatedProject : state.selectedProject,
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      set({ error: message, loading: false });
      console.error('Update project error:', error);
    }
  },

  // Select project (for detail view or sprint board)
  selectProject: (project) => {
    set({ selectedProject: project });
  },

  // Update filter
  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  // Switch active tab
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },
}));
