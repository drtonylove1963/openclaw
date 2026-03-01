import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export type SprintColumn = 'backlog' | 'ready' | 'in_progress' | 'review' | 'qa' | 'done';
export type StoryPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Story {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  column: SprintColumn;
  priority: StoryPriority;
  story_points?: number;
  assignee_name?: string;
  assignee_avatar?: string;
  created_at: string;
  updated_at: string;
}

interface SprintState {
  // State
  stories: Story[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
  draggedStory: Story | null;

  // Actions
  loadStories: (projectId: string) => Promise<void>;
  createStory: (story: Omit<Story, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateStory: (storyId: string, updates: Partial<Story>) => Promise<void>;
  moveStory: (storyId: string, fromColumn: SprintColumn, toColumn: SprintColumn) => Promise<void>;
  setDraggedStory: (story: Story | null) => void;
  setActiveProject: (projectId: string | null) => void;
}

export const useSprintStore = create<SprintState>((set, get) => ({
  // Initial state
  stories: [],
  activeProjectId: null,
  loading: false,
  error: null,
  draggedStory: null,

  // Load stories for a project
  loadStories: async (projectId) => {
    set({ loading: true, error: null, activeProjectId: projectId });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/stories`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load stories: ${response.statusText}`);
      }

      const data = await response.json();
      set({ stories: data.stories ?? [], loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load stories';
      set({ error: message, loading: false, stories: [] });
      console.error('Load stories error:', error);
    }
  },

  // Create new story
  createStory: async (story) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/projects/${story.project_id}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(story),
      });

      if (!response.ok) {
        throw new Error(`Failed to create story: ${response.statusText}`);
      }

      const newStory = await response.json();
      set((state) => ({
        stories: [...state.stories, newStory],
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create story';
      set({ error: message, loading: false });
      console.error('Create story error:', error);
      throw error;
    }
  },

  // Update existing story
  updateStory: async (storyId, updates) => {
    const state = get();
    if (!state.activeProjectId) {return;}

    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(
        `${API_BASE}/api/v1/projects/${state.activeProjectId}/stories/${storyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update story: ${response.statusText}`);
      }

      const updatedStory = await response.json();
      set((state) => ({
        stories: state.stories.map((s) => (s.id === storyId ? updatedStory : s)),
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update story';
      set({ error: message, loading: false });
      console.error('Update story error:', error);
    }
  },

  // Move story between columns
  moveStory: async (storyId, fromColumn, toColumn) => {
    // Optimistic update
    set((state) => ({
      stories: state.stories.map((s) =>
        s.id === storyId ? { ...s, column: toColumn } : s
      ),
    }));

    // Persist to API
    await get().updateStory(storyId, { column: toColumn });
  },

  // Set currently dragged story
  setDraggedStory: (story) => {
    set({ draggedStory: story });
  },

  // Set active project (clears stories when changed)
  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId, stories: [] });
  },
}));
