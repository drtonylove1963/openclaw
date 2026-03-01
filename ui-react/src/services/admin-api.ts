/**
 * Admin API Service - User and stats management
 */

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
  is_active: boolean;
  created_at?: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  recent_registrations: number;
}

interface ListUsersResponse {
  users: AdminUser[];
  total: number;
}

interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: string;
}

interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  role?: string;
  full_name?: string;
}

const API_BASE = '/api/v1/auth';

export function useAdminAPI(token: string) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return {
    async listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
      const queryParams = new URLSearchParams();
      if (params.page) {queryParams.set('page', String(params.page));}
      if (params.limit) {queryParams.set('limit', String(params.limit));}
      if (params.role) {queryParams.set('role', params.role);}

      const response = await fetch(`${API_BASE}/admin/users?${queryParams}`, { headers });
      if (!response.ok) {throw new Error('Failed to fetch users');}
      return response.json();
    },

    async getStats(): Promise<AdminStats> {
      const response = await fetch(`${API_BASE}/admin/stats`, { headers });
      if (!response.ok) {throw new Error('Failed to fetch stats');}
      return response.json();
    },

    async createUser(params: CreateUserParams): Promise<AdminUser> {
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to create user' }));
        throw new Error(error.detail || 'Failed to create user');
      }
      return response.json();
    },

    async updateUser(userId: string, updates: Partial<AdminUser>): Promise<AdminUser> {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update user' }));
        throw new Error(error.detail || 'Failed to update user');
      }
      return response.json();
    },

    async deleteUser(userId: string): Promise<void> {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to delete user' }));
        throw new Error(error.detail || 'Failed to delete user');
      }
    },
  };
}
