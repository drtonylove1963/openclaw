/**
 * Authenticated Fetch Hook
 * 
 * Provides a wrapper around fetch that automatically includes credentials
 * for cookie-based authentication.
 * 
 * This replaces the need to access localStorage.getItem('pronetheia_token')
 * throughout the application.
 */

import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface FetchOptions extends RequestInit {
  // Additional options can be added here
}

export function useAuthenticatedFetch() {
  const { logout } = useAuth();

  const authenticatedFetch = useCallback(
    async (url: string, options: FetchOptions = {}) => {
      // Ensure credentials are included
      const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include', // Always include cookies
      };

      // Make the request
      const response = await fetch(
        url.startsWith('http') ? url : `${API_BASE}${url}`,
        fetchOptions
      );

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Trigger auth-expired event
        window.dispatchEvent(new Event('auth-expired'));
        logout();
        throw new Error('Authentication expired. Please log in again.');
      }

      return response;
    },
    [logout]
  );

  return authenticatedFetch;
}

/**
 * Convenience method for JSON requests
 */
export function useAuthenticatedJson() {
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchJson = useCallback(
    async <T = any>(url: string, options: FetchOptions = {}): Promise<T> => {
      const response = await authenticatedFetch(url, options);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    [authenticatedFetch]
  );

  return fetchJson;
}
