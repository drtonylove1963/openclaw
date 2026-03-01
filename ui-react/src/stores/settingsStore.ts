import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const getAuthToken = () => localStorage.getItem('pronetheia_token') || '';

// Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
}

export interface ApiKeyEntry {
  id: string;
  provider: string;
  key_hint: string;
  is_valid: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  docs_url: string;
  has_key: boolean;
  requires_api_key?: boolean;
}

export interface UserPreferences {
  theme_mode: 'dark' | 'light' | 'system';
  default_model: string;
  voice_model: string | null;
  notifications_enabled: boolean;
  cost_ceiling_tier: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
  billing_mode?: 'byok' | 'subscription';
}

export interface BillingInfo {
  tier: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
  agents_used: number;
  agents_limit: number;
  oneshots_used: number;
  oneshots_limit: number;
}

interface SettingsState {
  // State
  activeTab: string;
  profile: UserProfile | null;
  apiKeys: ApiKeyEntry[];
  providers: Provider[];
  preferences: UserPreferences;
  billing: BillingInfo | null;
  loading: boolean;
  error: string | null;

  // Actions
  setActiveTab: (tab: string) => void;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loadApiKeys: () => Promise<void>;
  addApiKey: (provider: string, apiKey: string) => Promise<void>;
  removeApiKey: (keyId: string) => Promise<void>;
  loadProviders: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>;
  loadBilling: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  activeTab: 'profile',
  profile: null,
  apiKeys: [],
  providers: [],
  preferences: {
    theme_mode: 'dark',
    default_model: 'claude-3-5-sonnet-20241022',
    voice_model: null,
    notifications_enabled: true,
    cost_ceiling_tier: 'FREE',
  },
  billing: null,
  loading: false,
  error: null,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  loadProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/user/profile`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {throw new Error('Failed to load profile');}

      const data = await response.json();
      set({ profile: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {throw new Error('Failed to update profile');}

      const updated = await response.json();
      set({ profile: updated, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/user/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {throw new Error('Failed to change password');}

      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  loadApiKeys: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/keys/`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {throw new Error('Failed to load API keys');}

      const data = await response.json();
      set({ apiKeys: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addApiKey: async (provider, apiKey) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/keys/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
        }),
      });

      if (!response.ok) {throw new Error('Failed to add API key');}

      await get().loadApiKeys();
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  removeApiKey: async (provider) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/keys/${provider}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {throw new Error('Failed to remove API key');}

      await get().loadApiKeys();
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  loadProviders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/keys/providers`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {throw new Error('Failed to load providers');}

      const data = await response.json();
      set({ providers: data.providers || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadPreferences: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch voice model preference
      const voiceModelResponse = await fetch(`${API_BASE}/api/v1/settings/settings/voice-model`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      let voiceModel = null;
      if (voiceModelResponse.ok) {
        const voiceData = await voiceModelResponse.json();
        voiceModel = voiceData.voice_model;
      }

      // Fetch billing mode
      const billingResponse = await fetch(`${API_BASE}/api/v1/settings/settings/billing-mode`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      let billingMode = 'byok';
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        billingMode = billingData.mode;
      }

      // Fetch cost ceiling
      const ceilingResponse = await fetch(`${API_BASE}/api/v1/settings/settings/cost-ceiling`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      let costCeilingTier = 'FREE';
      if (ceilingResponse.ok) {
        const ceilingData = await ceilingResponse.json();
        costCeilingTier = ceilingData.tier?.toUpperCase() || 'FREE';
      }

      set({ preferences: {
        theme_mode: 'dark',
        default_model: 'claude-3-5-sonnet-20241022',
        voice_model: voiceModel,
        notifications_enabled: true,
        cost_ceiling_tier: costCeilingTier as 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE',
      }, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updatePreferences: async (data) => {
    set({ loading: true, error: null });
    try {
      // Update voice model via settings endpoint
      if (data.voice_model !== undefined) {
        const response = await fetch(`${API_BASE}/api/v1/settings/settings/voice-model`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ voice_model: data.voice_model }),
        });
        if (!response.ok) {throw new Error('Failed to update voice model');}
      }

      // Update billing mode
      if (data.billing_mode !== undefined) {
        await fetch(`${API_BASE}/api/v1/settings/settings/billing-mode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ mode: data.billing_mode }),
        });
      }

      // Reload preferences
      await get().loadPreferences();
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  loadBilling: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/v1/user/billing`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {throw new Error('Failed to load billing info');}

      const data = await response.json();
      set({ billing: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
