import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const getAuthToken = () => localStorage.getItem('pronetheia_token') || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PVENode {
  node: string;
  status: string;
  cpu: number | null;
  maxcpu: number | null;
  mem: number | null;
  maxmem: number | null;
  uptime: number | null;
}

export interface PVEContainer {
  vmid: number;
  name: string;
  status: string;
  node: string;
  cpus: number;
  maxmem: number;
  maxdisk: number;
  mem: number;
  disk: number;
  uptime: number;
  netin: number;
  netout: number;
}

export interface PVEActionResult {
  success: boolean;
  upid: string;
  action: string;
  vmid: number;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface PVEState {
  containers: PVEContainer[];
  nodes: PVENode[];
  loading: boolean;
  error: string | null;
  actionLoading: string | null; // "node/vmid" currently being acted on

  loadNodes: () => Promise<void>;
  loadContainers: () => Promise<void>;
  startContainer: (node: string, vmid: number) => Promise<PVEActionResult>;
  stopContainer: (node: string, vmid: number) => Promise<PVEActionResult>;
  restartContainer: (node: string, vmid: number) => Promise<PVEActionResult>;
}

export const usePVEStore = create<PVEState>((set, get) => ({
  containers: [],
  nodes: [],
  loading: false,
  error: null,
  actionLoading: null,

  loadNodes: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/pve/nodes`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to load nodes (${res.status})`);
      }
      const data: PVENode[] = await res.json();
      set({ nodes: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadContainers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/pve/containers`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to load containers (${res.status})`);
      }
      const data: PVEContainer[] = await res.json();
      set({ containers: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  startContainer: async (node, vmid) => {
    const key = `${node}/${vmid}`;
    set({ actionLoading: key, error: null });
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/admin/pve/containers/${node}/${vmid}/start`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to start container');
      }
      const result: PVEActionResult = await res.json();
      set({ actionLoading: null });
      // Refresh container list after action
      await get().loadContainers();
      return result;
    } catch (err) {
      set({ actionLoading: null, error: (err as Error).message });
      throw err;
    }
  },

  stopContainer: async (node, vmid) => {
    const key = `${node}/${vmid}`;
    set({ actionLoading: key, error: null });
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/admin/pve/containers/${node}/${vmid}/stop`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to stop container');
      }
      const result: PVEActionResult = await res.json();
      set({ actionLoading: null });
      await get().loadContainers();
      return result;
    } catch (err) {
      set({ actionLoading: null, error: (err as Error).message });
      throw err;
    }
  },

  restartContainer: async (node, vmid) => {
    const key = `${node}/${vmid}`;
    set({ actionLoading: key, error: null });
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/admin/pve/containers/${node}/${vmid}/restart`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to restart container');
      }
      const result: PVEActionResult = await res.json();
      set({ actionLoading: null });
      await get().loadContainers();
      return result;
    } catch (err) {
      set({ actionLoading: null, error: (err as Error).message });
      throw err;
    }
  },
}));
