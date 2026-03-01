import { create } from 'zustand';

// API base URL from environment
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// Types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  nodeCount: number;
  lastExecuted: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  schedule?: string; // cron expression or 'manual'
  webhookUrl?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  duration: number | null; // in milliseconds
  trigger: string; // 'manual', 'schedule', 'webhook'
  error?: string;
}

interface WorkflowState {
  // State
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  executions: WorkflowExecution[];
  loading: boolean;
  error: string | null;
  activePanel: 'list' | 'detail' | 'history';

  // Actions
  loadWorkflows: () => Promise<void>;
  selectWorkflow: (id: string | null) => Promise<void>;
  executeWorkflow: (id: string) => Promise<void>;
  loadExecutions: (workflowId: string) => Promise<void>;
  createWorkflow: (data: Partial<Workflow>) => Promise<void>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  toggleWorkflowStatus: (id: string) => Promise<void>;
  setActivePanel: (panel: 'list' | 'detail' | 'history') => void;
  clearError: () => void;
}

// Mock data for development (remove when API is connected)
const mockWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Customer Onboarding',
    description: 'Automated workflow for new customer registration and setup',
    status: 'active',
    nodeCount: 8,
    lastExecuted: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    tags: ['customer', 'onboarding'],
    schedule: '0 9 * * *',
  },
  {
    id: 'wf-2',
    name: 'Data Sync Pipeline',
    description: 'Synchronize data between CRM and database',
    status: 'active',
    nodeCount: 5,
    lastExecuted: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    tags: ['sync', 'database'],
    schedule: '*/30 * * * *',
  },
  {
    id: 'wf-3',
    name: 'Report Generator',
    description: 'Generate and email weekly analytics reports',
    status: 'inactive',
    nodeCount: 12,
    lastExecuted: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    tags: ['reports', 'analytics'],
    schedule: '0 0 * * 1',
  },
  {
    id: 'wf-4',
    name: 'Error Alert System',
    description: 'Monitor system errors and send alerts to Slack',
    status: 'active',
    nodeCount: 6,
    lastExecuted: new Date(Date.now() - 900000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    tags: ['alerts', 'monitoring'],
    schedule: 'manual',
    webhookUrl: 'https://api.pronetheia.com/webhooks/error-alerts',
  },
];

const mockExecutions: WorkflowExecution[] = [
  {
    id: 'exec-1',
    workflowId: 'wf-1',
    status: 'success',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    finishedAt: new Date(Date.now() - 3540000).toISOString(),
    duration: 60000,
    trigger: 'schedule',
  },
  {
    id: 'exec-2',
    workflowId: 'wf-1',
    status: 'success',
    startedAt: new Date(Date.now() - 90000000).toISOString(),
    finishedAt: new Date(Date.now() - 89940000).toISOString(),
    duration: 60000,
    trigger: 'schedule',
  },
  {
    id: 'exec-3',
    workflowId: 'wf-1',
    status: 'failed',
    startedAt: new Date(Date.now() - 176400000).toISOString(),
    finishedAt: new Date(Date.now() - 176340000).toISOString(),
    duration: 60000,
    trigger: 'manual',
    error: 'Database connection timeout',
  },
  {
    id: 'exec-4',
    workflowId: 'wf-1',
    status: 'running',
    startedAt: new Date(Date.now() - 30000).toISOString(),
    finishedAt: null,
    duration: null,
    trigger: 'webhook',
  },
];

// Helper: get auth token
const getToken = (): string | null => {
  return localStorage.getItem('pronetheia_token');
};

// Helper: fetch with auth
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  return response.json();
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  workflows: [],
  selectedWorkflow: null,
  executions: [],
  loading: false,
  error: null,
  activePanel: 'list',

  // Load all workflows
  loadWorkflows: async () => {
    set({ loading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const data = await authFetch('/api/v1/workflows');

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ workflows: mockWorkflows, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load workflows',
        loading: false,
      });
    }
  },

  // Select workflow and load its details
  selectWorkflow: async (id: string | null) => {
    if (!id) {
      set({ selectedWorkflow: null, executions: [] });
      return;
    }

    set({ loading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const workflow = await authFetch(`/api/v1/workflows/${id}`);

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 300));
      const workflow = get().workflows.find((w) => w.id === id);
      if (!workflow) {throw new Error('Workflow not found');}

      set({ selectedWorkflow: workflow, loading: false });

      // Auto-load executions
      get().loadExecutions(id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load workflow',
        loading: false,
      });
    }
  },

  // Execute workflow
  executeWorkflow: async (id: string) => {
    set({ error: null });
    try {
      // TODO: Replace with real API call
      // await authFetch(`/api/v1/workflows/${id}/execute`, { method: 'POST' });

      // Mock execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add running execution
      const newExecution: WorkflowExecution = {
        id: `exec-${Date.now()}`,
        workflowId: id,
        status: 'running',
        startedAt: new Date().toISOString(),
        finishedAt: null,
        duration: null,
        trigger: 'manual',
      };

      set((state) => ({
        executions: [newExecution, ...state.executions],
      }));

      // Update last executed time
      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === id ? { ...w, lastExecuted: new Date().toISOString() } : w
        ),
        selectedWorkflow:
          state.selectedWorkflow?.id === id
            ? { ...state.selectedWorkflow, lastExecuted: new Date().toISOString() }
            : state.selectedWorkflow,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to execute workflow',
      });
    }
  },

  // Load execution history for workflow
  loadExecutions: async (workflowId: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const data = await authFetch(`/api/v1/workflows/${workflowId}/executions`);

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 300));
      const filtered = mockExecutions.filter((e) => e.workflowId === workflowId);
      set({ executions: filtered, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load executions',
        loading: false,
      });
    }
  },

  // Create new workflow
  createWorkflow: async (data: Partial<Workflow>) => {
    set({ loading: true, error: null });
    try {
      // TODO: Replace with real API call
      // const newWorkflow = await authFetch('/api/v1/workflows', {
      //   method: 'POST',
      //   body: JSON.stringify(data),
      // });

      // Mock creation
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newWorkflow: Workflow = {
        id: `wf-${Date.now()}`,
        name: data.name || 'Untitled Workflow',
        description: data.description || '',
        status: 'inactive',
        nodeCount: 0,
        lastExecuted: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: data.tags || [],
        schedule: data.schedule || 'manual',
        webhookUrl: data.webhookUrl,
      };

      set((state) => ({
        workflows: [newWorkflow, ...state.workflows],
        selectedWorkflow: newWorkflow,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create workflow',
        loading: false,
      });
    }
  },

  // Update workflow
  updateWorkflow: async (id: string, data: Partial<Workflow>) => {
    set({ error: null });
    try {
      // TODO: Replace with real API call
      // await authFetch(`/api/v1/workflows/${id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(data),
      // });

      // Mock update
      await new Promise((resolve) => setTimeout(resolve, 300));

      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w
        ),
        selectedWorkflow:
          state.selectedWorkflow?.id === id
            ? { ...state.selectedWorkflow, ...data, updatedAt: new Date().toISOString() }
            : state.selectedWorkflow,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update workflow',
      });
    }
  },

  // Delete workflow
  deleteWorkflow: async (id: string) => {
    set({ error: null });
    try {
      // TODO: Replace with real API call
      // await authFetch(`/api/v1/workflows/${id}`, { method: 'DELETE' });

      // Mock delete
      await new Promise((resolve) => setTimeout(resolve, 300));

      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        selectedWorkflow: state.selectedWorkflow?.id === id ? null : state.selectedWorkflow,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete workflow',
      });
    }
  },

  // Toggle workflow status
  toggleWorkflowStatus: async (id: string) => {
    set({ error: null });
    try {
      const workflow = get().workflows.find((w) => w.id === id);
      if (!workflow) {throw new Error('Workflow not found');}

      const newStatus = workflow.status === 'active' ? 'inactive' : 'active';

      // TODO: Replace with real API call
      // await authFetch(`/api/v1/workflows/${id}/status`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ status: newStatus }),
      // });

      // Mock toggle
      await new Promise((resolve) => setTimeout(resolve, 300));

      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === id ? { ...w, status: newStatus } : w
        ),
        selectedWorkflow:
          state.selectedWorkflow?.id === id
            ? { ...state.selectedWorkflow, status: newStatus }
            : state.selectedWorkflow,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle workflow status',
      });
    }
  },

  // Set active panel
  setActivePanel: (panel: 'list' | 'detail' | 'history') => {
    set({ activePanel: panel });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
