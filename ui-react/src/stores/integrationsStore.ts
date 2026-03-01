import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const getAuthToken = () => localStorage.getItem('pronetheia_token') || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'url' | 'secret' | 'boolean' | 'textarea';
  required?: boolean;
  placeholder?: string;
  default?: unknown;
}

export interface ServiceTypeInfo {
  name: string;
  icon: string;
  category: string;
  description: string;
  fields: FieldDef[];
  test_endpoint?: string;
}

export interface Integration {
  id: string;
  name: string;
  service_type: string;
  type_info: ServiceTypeInfo;
  data: Record<string, unknown>;
  is_enabled: boolean;
  is_valid: boolean | null;
  last_tested_at: string | null;
  test_error: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface TestResult {
  success: boolean;
  error: string | null;
  tested_at?: string | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface IntegrationsState {
  integrations: Integration[];
  serviceTypes: Record<string, ServiceTypeInfo>;
  loading: boolean;
  error: string | null;
  testing: string | null; // ID currently being tested

  loadIntegrations: () => Promise<void>;
  loadServiceTypes: () => Promise<void>;
  createIntegration: (data: {
    name: string;
    service_type: string;
    credentials: Record<string, unknown>;
    is_enabled?: boolean;
    metadata?: Record<string, unknown>;
  }) => Promise<Integration>;
  updateIntegration: (
    id: string,
    data: {
      name?: string;
      credentials?: Record<string, unknown>;
      is_enabled?: boolean;
      metadata?: Record<string, unknown>;
    },
  ) => Promise<Integration>;
  deleteIntegration: (id: string) => Promise<void>;
  toggleIntegration: (id: string, enabled: boolean) => Promise<void>;
  testConnection: (id: string) => Promise<TestResult>;
  testRawConnection: (
    service_type: string,
    credentials: Record<string, unknown>,
  ) => Promise<TestResult>;
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  integrations: [],
  serviceTypes: {},
  loading: false,
  error: null,
  testing: null,

  loadIntegrations: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to load integrations (${res.status})`);
      }
      const data: Integration[] = await res.json();
      set({ integrations: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  loadServiceTypes: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/services`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) {return;} // silently skip — loadIntegrations handles auth errors
      const data = await res.json();
      set({ serviceTypes: data.services ?? {} });
    } catch {
      // non-critical — service types are only needed for add/edit modal
    }
  },

  createIntegration: async (body) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || 'Failed to create integration');
      }
      const created: Integration = await res.json();
      await get().loadIntegrations();
      set({ loading: false });
      return created;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateIntegration: async (id, body) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || 'Failed to update integration');
      }
      const updated: Integration = await res.json();
      await get().loadIntegrations();
      set({ loading: false });
      return updated;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteIntegration: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) {throw new Error('Failed to delete integration');}
      await get().loadIntegrations();
      set({ loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  toggleIntegration: async (id, enabled) => {
    set({ error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {throw new Error('Failed to toggle integration');}
      await get().loadIntegrations();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  testConnection: async (id) => {
    set({ testing: id, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) {throw new Error('Test request failed');}
      const result: TestResult = await res.json();
      await get().loadIntegrations();
      set({ testing: null });
      return result;
    } catch (err) {
      set({ testing: null, error: (err as Error).message });
      throw err;
    }
  },

  testRawConnection: async (service_type, credentials) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/integrations/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ service_type, credentials }),
      });
      if (!res.ok) {throw new Error('Test request failed');}
      return (await res.json()) as TestResult;
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },
}));
