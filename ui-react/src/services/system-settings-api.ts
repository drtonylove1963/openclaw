/**
 * System Settings API Service
 *
 * Admin-only API for managing encrypted system-level configuration.
 * Used for Sentry DSN, SMTP credentials, and other system-wide secrets.
 */

import { API_BASE_URL } from '../config/api';

export interface SystemSetting {
  key: string;
  value: string | null;
  is_secret: boolean;
  description?: string;
  category?: string;
  updated_at?: string;
}

export interface SystemSettingCreate {
  value: string;
  is_secret: boolean;
  description?: string;
  category?: string;
}

export interface GatewayConfig {
  telegram_bot_token?: string;
  whatsapp_enabled?: boolean;
  whatsapp_session_path?: string;
  notification_channel?: string;
}

export interface GatewayConfigResponse {
  category: string;
  settings: {
    telegram_bot_token: string | null;
    whatsapp_enabled: string;
    whatsapp_session_path: string | null;
    notification_channel: string | null;
  };
  configured: boolean;
  telegram_configured: boolean;
  whatsapp_configured: boolean;
}

export interface SystemSettingListResponse {
  settings: SystemSetting[];
  total: number;
}

export function useSystemSettingsAPI(token: string) {
  // Use window.location.origin as fallback for relative URLs
  const baseUrl = API_BASE_URL || window.location.origin;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  return {
    /**
     * List all system settings
     */
    async listSettings(category?: string): Promise<SystemSettingListResponse> {
      let url = `${baseUrl}/api/v1/system/settings`;
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to list settings' }));
        throw new Error(error.detail || 'Failed to list settings');
      }
      return res.json();
    },

    /**
     * Get a specific setting
     */
    async getSetting(key: string, includeValue = false): Promise<SystemSetting> {
      let url = `${baseUrl}/api/v1/system/settings/${encodeURIComponent(key)}`;
      if (includeValue) {
        url += '?include_value=true';
      }
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Setting not found' }));
        throw new Error(error.detail || 'Setting not found');
      }
      return res.json();
    },

    /**
     * Create or update a setting
     */
    async setSetting(key: string, data: SystemSettingCreate): Promise<SystemSetting> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to save setting' }));
        throw new Error(error.detail || 'Failed to save setting');
      }
      return res.json();
    },

    /**
     * Delete a setting
     */
    async deleteSetting(key: string): Promise<void> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to delete setting' }));
        throw new Error(error.detail || 'Failed to delete setting');
      }
    },

    /**
     * Quick set Sentry DSN (convenience method)
     */
    async setSentryDSN(dsn: string): Promise<{ message: string; key: string }> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/sentry/dsn`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(dsn),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to save Sentry DSN' }));
        throw new Error(error.detail || 'Failed to save Sentry DSN');
      }
      return res.json();
    },

    /**
     * Get Sentry configuration status
     */
    async getSentryConfig(): Promise<{ category: string; settings: Record<string, string>; configured: boolean }> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/sentry/config`, { headers });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to get Sentry config' }));
        throw new Error(error.detail || 'Failed to get Sentry config');
      }
      return res.json();
    },

    // =========================================================================
    // Gateway Settings
    // =========================================================================

    /**
     * Get Gateway configuration status
     */
    async getGatewayConfig(): Promise<GatewayConfigResponse> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/gateway/config`, { headers });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to get Gateway config' }));
        throw new Error(error.detail || 'Failed to get Gateway config');
      }
      return res.json();
    },

    /**
     * Set Gateway configuration (partial update)
     */
    async setGatewayConfig(config: GatewayConfig): Promise<{ message: string; updated: string[] }> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/gateway/config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to save Gateway config' }));
        throw new Error(error.detail || 'Failed to save Gateway config');
      }
      return res.json();
    },

    /**
     * Set Telegram bot token (convenience method)
     */
    async setGatewayTelegramToken(token: string): Promise<{ message: string; key: string }> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/gateway/telegram-token`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to save Telegram token' }));
        throw new Error(error.detail || 'Failed to save Telegram token');
      }
      return res.json();
    },

    /**
     * Delete Telegram bot token
     */
    async deleteGatewayTelegramToken(): Promise<{ message: string }> {
      const res = await fetch(`${baseUrl}/api/v1/system/settings/gateway/telegram-token`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Failed to delete Telegram token' }));
        throw new Error(error.detail || 'Failed to delete Telegram token');
      }
      return res.json();
    },
  };
}
