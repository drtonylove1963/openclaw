/**
 * Authentication Context (Secure Cookie-Based)
 * Manages user authentication state using HttpOnly cookies
 * 
 * SECURITY IMPROVEMENTS:
 * - Tokens stored in HttpOnly cookies (not accessible to JavaScript)
 * - No localStorage token storage (prevents XSS token theft)
 * - Credentials included in all API requests
 * - No token syncing to browser extensions
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
  refreshAuth: () => Promise<void>;
  // Password reset
  requestPasswordReset: (email: string) => Promise<PasswordResetResponse>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
}

// Storage keys (only for non-sensitive data like theme preferences)
const USER_KEY = 'pronetheia_user';
const THEME_MODE_KEY = 'pronetheia_theme_mode';
const THEME_PALETTE_KEY = 'pronetheia_theme_palette';

// Load user preferences from backend and sync to localStorage
async function loadAndSyncPreferences() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings`, {
      credentials: 'include', // Send cookies
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

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user info from cookie-based session
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
        credentials: 'include', // Send cookies
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Store user info in localStorage for offline reference (non-sensitive)
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        return userData;
      } else {
        // Not authenticated or token expired
        setUser(null);
        localStorage.removeItem(USER_KEY);
        return null;
      }
    } catch (e) {
      console.error('Failed to fetch current user:', e);
      setUser(null);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }, []);

  // Load stored auth on mount
  useEffect(() => {
    const initAuth = async () => {
      // Try to fetch current user from cookie
      const userData = await fetchCurrentUser();
      
      if (userData) {
        // Load preferences from backend
        await loadAndSyncPreferences();
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [fetchCurrentUser]);

  // Clear auth state
  const clearAuth = useCallback(() => {
    setUser(null);
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
      credentials: 'include', // Send and receive cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    // Fetch user info (token is now in HttpOnly cookie)
    await fetchCurrentUser();

    // Load user preferences from backend and sync to localStorage
    await loadAndSyncPreferences();
  }, [fetchCurrentUser]);

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
      credentials: 'include', // Send and receive cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    // Auto-login after registration
    await login(username, password);
  }, [login]);

  // Logout
  const logout = useCallback(async () => {
    // Call logout endpoint to clear cookies
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send cookies
      });
    } catch (e) {
      console.warn('Logout request failed:', e);
      // Still clear local state even if request fails
    }
    
    clearAuth();
  }, [clearAuth]);

  // Refresh authentication (fetch updated user info)
  const refreshAuth = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string): Promise<PasswordResetResponse> => {
    const response = await fetch(`${API_BASE}/api/v1/auth/password-reset-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      credentials: 'include',
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
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password reset failed');
    }
  }, []);

  // Auto-refresh user info periodically (every 5 minutes)
  useEffect(() => {
    if (!user) {return;}

    const interval = setInterval(() => {
      fetchCurrentUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, fetchCurrentUser]);

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
    isAuthenticated: !!user,
    isLoading,
    hasRole,
    hasPermission,
    isAdmin,
    isPro,
    login,
    register,
    logout,
    refreshAuth,
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
