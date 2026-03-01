/**
 * API Configuration
 *
 * Uses environment variable VITE_API_URL if set, otherwise falls back to
 * relative URLs (which work with vite proxy in development).
 */

// In production (CT 123), set VITE_API_URL=http://192.168.1.243:8000
// In development, leave unset to use vite's proxy
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  tools: `${API_BASE_URL}/api/v1/tools`,
  toolStats: `${API_BASE_URL}/api/v1/tools/stats`,
  toolCategories: `${API_BASE_URL}/api/v1/tools/categories`,
  toolExecutions: `${API_BASE_URL}/api/v1/tools/executions`,
  agents: `${API_BASE_URL}/api/v1/agents`,
  mcpServers: `${API_BASE_URL}/api/v1/mcp/servers`,
  chat: `${API_BASE_URL}/api/v1/chat`,
  conversations: `${API_BASE_URL}/api/v1/chat/persistent/conversations`,
  commands: `${API_BASE_URL}/api/v1/commands`,
  agentTeams: `${API_BASE_URL}/api/v1/agent-teams`,
};

// API client with common HTTP methods
export const apiClient = {
  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // S-09: Send auth cookies
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // S-09: Send auth cookies
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};
