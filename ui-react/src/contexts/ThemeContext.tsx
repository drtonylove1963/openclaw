/**
 * Theme Context
 * Manages application theme mode (light/dark/system) and color palette
 * with localStorage persistence and backend sync
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Theme, ThemeMode, PaletteId, getTheme, COLOR_PALETTES, updateGlobalTheme } from '../styles/theme';

const THEME_MODE_KEY = 'pronetheia_theme_mode';
const THEME_PALETTE_KEY = 'pronetheia_theme_palette';
const TOKEN_KEY = 'pronetheia_token';
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// Sync theme preferences to backend (fire and forget)
async function syncThemeToBackend(themeMode: ThemeMode, themePalette: string) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {return;} // Not authenticated, skip sync

  try {
    await fetch(`${API_BASE}/api/v1/settings/theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        theme_mode: themeMode,
        theme_palette: themePalette,
      }),
    });
  } catch (e) {
    console.warn('Failed to sync theme to backend:', e);
  }
}

interface ThemeContextType {
  themeMode: ThemeMode;
  paletteId: PaletteId;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  setPaletteId: (id: PaletteId) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Load theme mode from localStorage, default to 'dark'
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_MODE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'dark';
  });

  // Load palette from localStorage, default to 'emerald'
  const [paletteId, setPaletteIdState] = useState<PaletteId>(() => {
    const stored = localStorage.getItem(THEME_PALETTE_KEY);
    if (stored && COLOR_PALETTES.some(p => p.id === stored)) {
      return stored;
    }
    return 'emerald';
  });

  const [theme, setTheme] = useState<Theme>(() => getTheme(themeMode, paletteId));

  // Listen for preferences-loaded event from AuthContext
  // This fires when user logs in and preferences are synced from backend
  useEffect(() => {
    const handlePreferencesLoaded = (event: CustomEvent) => {
      const prefs = event.detail;
      if (prefs?.theme_mode) {
        const newMode = prefs.theme_mode as ThemeMode;
        if (newMode !== themeMode) {
          setThemeModeState(newMode);
        }
      }
      if (prefs?.theme_palette) {
        const newPalette = prefs.theme_palette;
        if (newPalette !== paletteId && COLOR_PALETTES.some(p => p.id === newPalette)) {
          setPaletteIdState(newPalette);
        }
      }
    };

    window.addEventListener('preferences-loaded', handlePreferencesLoaded as EventListener);
    return () => {
      window.removeEventListener('preferences-loaded', handlePreferencesLoaded as EventListener);
    };
  }, [themeMode, paletteId]);

  // Update theme when mode or palette changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = getTheme(themeMode, paletteId);
      setTheme(newTheme);
      updateGlobalTheme(newTheme); // Update global THEME object

      // Set CSS custom properties for global access
      const root = document.documentElement;
      root.style.setProperty('--theme-bg', newTheme.bg);
      root.style.setProperty('--theme-bg-elevated', newTheme.bgElevated);
      root.style.setProperty('--theme-bg-panel', newTheme.bgPanel);
      root.style.setProperty('--theme-bg-muted', newTheme.bgMuted);
      root.style.setProperty('--theme-bg-hover', newTheme.bgHover);
      root.style.setProperty('--theme-bg-active', newTheme.bgActive);
      root.style.setProperty('--theme-border', newTheme.border);
      root.style.setProperty('--theme-border-muted', newTheme.borderMuted);
      root.style.setProperty('--theme-border-focus', newTheme.borderFocus);
      root.style.setProperty('--theme-text', newTheme.text);
      root.style.setProperty('--theme-text-secondary', newTheme.textSecondary);
      root.style.setProperty('--theme-text-muted', newTheme.textMuted);
      root.style.setProperty('--theme-text-dim', newTheme.textDim);
      root.style.setProperty('--theme-primary', newTheme.primary);
      root.style.setProperty('--theme-primary-hover', newTheme.primaryHover);
      root.style.setProperty('--theme-primary-muted', newTheme.primaryMuted);
      root.style.setProperty('--theme-primary-glow', newTheme.primaryGlow);
      root.style.setProperty('--theme-success', newTheme.success);
      root.style.setProperty('--theme-warning', newTheme.warning);
      root.style.setProperty('--theme-error', newTheme.error);
      root.style.setProperty('--theme-info', newTheme.info);
    };

    updateTheme();

    // Listen for system theme changes if mode is 'system'
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [themeMode, paletteId]);

  // Save theme mode to localStorage and sync to backend
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_MODE_KEY, mode);
    // Sync to backend (fire and forget)
    syncThemeToBackend(mode, paletteId);
  }, [paletteId]);

  // Save palette to localStorage and sync to backend
  const setPaletteId = useCallback((id: PaletteId) => {
    setPaletteIdState(id);
    localStorage.setItem(THEME_PALETTE_KEY, id);
    // Sync to backend (fire and forget)
    syncThemeToBackend(themeMode, id);
  }, [themeMode]);

  // Determine if current theme is dark
  const isDark = theme.bg === '#09090b';

  const value: ThemeContextType = {
    themeMode,
    paletteId,
    theme,
    setThemeMode,
    setPaletteId,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
