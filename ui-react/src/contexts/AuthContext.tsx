/**
 * Authentication Context
 * Manages user authentication state and JWT tokens
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: string; // FREE, PRO, ENTERPRISE, ADMIN
  permissions: string[]; // ["chat:create", "session:unlimited", etc.]
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface PasswordResetResponse {
  message: string;
  reset_token?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Role/permission helpers
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isPro: boolean;
  // Auth methods
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  // Password reset
  requestPasswordReset: (email: string) => Promise<PasswordResetResponse>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
}

// Storage keys
const TOKEN_KEY = 'pronetheia_token';
const REFRESH_TOKEN_KEY = 'pronetheia_refresh_token';
const USER_KEY = 'pronetheia_user';
const THEME_MODE_KEY = 'pronetheia_theme_mode';
const THEME_PALETTE_KEY = 'pronetheia_theme_palette';

// Sync auth token to browser extension if installed
function syncTokenToExtension(token: string | null) {
  try {
    const connector = (window as any).__PRONETHEIA_CONNECTOR__;
    if (connector?.setAuthToken && token) {
      connector.setAuthToken(token);
    }
  } catch (e) {
    // Extension not installed or error - ignore
  }
}

// Load user preferences from backend and sync to localStorage
async function loadAndSyncPreferences(accessToken: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const prefs = await response.json();

      // Sync theme preferences to localStorage for immediate use by ThemeContext
      if (prefs.theme_mode) {
        localStorage.setItem(THEME_MODE_KEY, prefs.theme_mode);
      }
      if (prefs.theme_palette) {
        localStorage.setItem(THEME_PALETTE_KEY, prefs.theme_palette);
      }

      // Dispatch event for ThemeContext to reload from localStorage
      window.dispatchEvent(new CustomEvent('preferences-loaded', { detail: prefs }));

      return prefs;
    }
  } catch (e) {
    console.warn('Failed to load user preferences:', e);
  }
  return null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Parse JWT payload
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) {return true;}
  const exp = payload.exp as number;
  return Date.now() >= exp * 1000;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        setRefreshTokenValue(storedRefresh);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        // Sync to browser extension if installed
        syncTokenToExtension(storedToken);
        // Load preferences from backend (in case they changed on another device)
        await loadAndSyncPreferences(storedToken);
      } else if (storedRefresh) {
        // Token expired but have refresh token - try to refresh
        refreshToken();
      } else {
        // No valid auth
        clearAuth();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Clear auth state
  const clearAuth = useCallback(() => {
    setToken(null);
    setRefreshTokenValue(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  // Listen for auth-expired events from API services (e.g., 401 responses)
  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuth();
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [clearAuth]);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const tokens: AuthTokens = await response.json();

    // Parse user from token
    const payload = parseJwt(tokens.access_token);
    if (payload) {
      const userData: User = {
        id: payload.user_id as string,
        username: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
        permissions: (payload.permissions as string[]) || [],
      };
      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }

    setToken(tokens.access_token);
    setRefreshTokenValue(tokens.refresh_token);
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

    // Sync to browser extension if installed
    syncTokenToExtension(tokens.access_token);

    // Load user preferences from backend and sync to localStorage
    await loadAndSyncPreferences(tokens.access_token);
  }, []);

  // Register
  const register = useCallback(async (
    email: string,
    username: string,
    password: string,
    fullName?: string
  ) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        username,
        password,
        full_name: fullName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    // Auto-login after registration
    await login(username, password);
  }, [login]);

  // Logout
  const logout = useCallback(() => {
    // Call logout endpoint (optional, for audit logging)
    if (token) {
      fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignore errors - logout is primarily client-side
      });
    }
    clearAuth();
  }, [token, clearAuth]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    const storedRefresh = refreshTokenValue || localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefresh) {
      clearAuth();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: storedRefresh,
        }),
      });

      if (!response.ok) {
        clearAuth();
        return;
      }

      const tokens: AuthTokens = await response.json();

      // Parse user from token
      const payload = parseJwt(tokens.access_token);
      if (payload) {
        const userData: User = {
          id: payload.user_id as string,
          username: payload.sub as string,
          email: payload.email as string,
          role: payload.role as string,
          permissions: (payload.permissions as string[]) || [],
        };
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      }

      setToken(tokens.access_token);
      setRefreshTokenValue(tokens.refresh_token);
      localStorage.setItem(TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

      // Sync to browser extension if installed
      syncTokenToExtension(tokens.access_token);
    } catch {
      clearAuth();
    }
  }, [refreshTokenValue, clearAuth]);

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string): Promise<PasswordResetResponse> => {
    const response = await fetch(`${API_BASE}/api/v1/auth/password-reset-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password reset request failed');
    }

    return response.json();
  }, []);

  // Confirm password reset
  const confirmPasswordReset = useCallback(async (resetToken: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/v1/auth/password-reset-confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: resetToken,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password reset failed');
    }
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) {return;}

    const payload = parseJwt(token);
    if (!payload || !payload.exp) {return;}

    const exp = (payload.exp as number) * 1000;
    const now = Date.now();
    const timeUntilExpiry = exp - now;

    // Refresh 5 minutes before expiry
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime > 0) {
      const timer = setTimeout(() => {
        refreshToken();
      }, refreshTime);
      return () => clearTimeout(timer);
    }
  }, [token, refreshToken]);

  // Role/permission helpers
  const hasRole = useCallback((role: string) => user?.role === role, [user]);
  const hasPermission = useCallback(
    (permission: string) => {
      if (user?.role === 'ADMIN') {return true;} // Admin has all permissions
      return user?.permissions?.includes(permission) ?? false;
    },
    [user]
  );
  const isAdmin = user?.role === 'ADMIN';
  const isPro = ['PRO', 'ENTERPRISE', 'ADMIN'].includes(user?.role ?? '');

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !isTokenExpired(token),
    isLoading,
    hasRole,
    hasPermission,
    isAdmin,
    isPro,
    login,
    register,
    logout,
    refreshToken,
    requestPasswordReset,
    confirmPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
