import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) {throw new Error('Login failed');}
          const data = await res.json();
          set({
            token: data.access_token,
            user: data.user,
            isAuthenticated: true,
            isAdmin: data.user?.role === 'admin',
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
          throw new Error('Login failed');
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) {return;}
        try {
          const res = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!res.ok) {throw new Error('Refresh failed');}
          const data = await res.json();
          set({ token: data.access_token });
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
        }
      },

      setUser: (user: User) => set({ user, isAdmin: user.role === 'admin' }),
      setToken: (token: string) => set({ token }),
    }),
    {
      name: 'pronetheia-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
