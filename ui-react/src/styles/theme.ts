/**
 * Unified Design System for Pronetheia
 * Multi-theme support with color palettes
 */

// ============================================================================
// COLOR PALETTES - Define accent colors for each palette
// ============================================================================

export interface ColorPalette {
  id: string;
  name: string;
  // Dark mode colors
  dark: {
    primary: string;
    primaryHover: string;
    primaryMuted: string;
    primaryGlow: string;
  };
  // Light mode colors
  light: {
    primary: string;
    primaryHover: string;
    primaryMuted: string;
    primaryGlow: string;
  };
  // Preview color (for palette selector)
  preview: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    dark: {
      primary: '#10b981',
      primaryHover: '#059669',
      primaryMuted: '#064e3b',
      primaryGlow: 'rgba(16, 185, 129, 0.15)',
    },
    light: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryMuted: '#d1fae5',
      primaryGlow: 'rgba(5, 150, 105, 0.15)',
    },
    preview: '#10b981',
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    dark: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryMuted: '#1e3a5f',
      primaryGlow: 'rgba(59, 130, 246, 0.15)',
    },
    light: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      primaryMuted: '#dbeafe',
      primaryGlow: 'rgba(37, 99, 235, 0.15)',
    },
    preview: '#3b82f6',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    dark: {
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      primaryMuted: '#2e1065',
      primaryGlow: 'rgba(139, 92, 246, 0.15)',
    },
    light: {
      primary: '#7c3aed',
      primaryHover: '#6d28d9',
      primaryMuted: '#ede9fe',
      primaryGlow: 'rgba(124, 58, 237, 0.15)',
    },
    preview: '#8b5cf6',
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    dark: {
      primary: '#f43f5e',
      primaryHover: '#e11d48',
      primaryMuted: '#4c0519',
      primaryGlow: 'rgba(244, 63, 94, 0.15)',
    },
    light: {
      primary: '#e11d48',
      primaryHover: '#be123c',
      primaryMuted: '#ffe4e6',
      primaryGlow: 'rgba(225, 29, 72, 0.15)',
    },
    preview: '#f43f5e',
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    dark: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      primaryMuted: '#431407',
      primaryGlow: 'rgba(249, 115, 22, 0.15)',
    },
    light: {
      primary: '#ea580c',
      primaryHover: '#c2410c',
      primaryMuted: '#ffedd5',
      primaryGlow: 'rgba(234, 88, 12, 0.15)',
    },
    preview: '#f97316',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    dark: {
      primary: '#06b6d4',
      primaryHover: '#0891b2',
      primaryMuted: '#083344',
      primaryGlow: 'rgba(6, 182, 212, 0.15)',
    },
    light: {
      primary: '#0891b2',
      primaryHover: '#0e7490',
      primaryMuted: '#cffafe',
      primaryGlow: 'rgba(8, 145, 178, 0.15)',
    },
    preview: '#06b6d4',
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    dark: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
      primaryMuted: '#451a03',
      primaryGlow: 'rgba(245, 158, 11, 0.15)',
    },
    light: {
      primary: '#d97706',
      primaryHover: '#b45309',
      primaryMuted: '#fef3c7',
      primaryGlow: 'rgba(217, 119, 6, 0.15)',
    },
    preview: '#f59e0b',
  },
  {
    id: 'teal',
    name: 'Teal Green',
    dark: {
      primary: '#14b8a6',
      primaryHover: '#0d9488',
      primaryMuted: '#042f2e',
      primaryGlow: 'rgba(20, 184, 166, 0.15)',
    },
    light: {
      primary: '#0d9488',
      primaryHover: '#0f766e',
      primaryMuted: '#ccfbf1',
      primaryGlow: 'rgba(13, 148, 136, 0.15)',
    },
    preview: '#14b8a6',
  },
];

// ============================================================================
// BASE THEMES - Backgrounds, borders, text (mode-dependent, not palette)
// ============================================================================

const DARK_BASE = {
  // === BACKGROUNDS ===
  bg: '#09090b',
  bgElevated: '#0f0f10',
  bgPanel: '#141415',
  bgMuted: '#18181b',
  bgHover: '#1f1f23',
  bgActive: '#27272a',

  // === BORDERS ===
  border: '#27272a',
  borderMuted: '#1f1f23',
  borderFocus: '#3f3f46',

  // === TEXT ===
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textDim: '#52525b',

  // === SEMANTIC COLORS ===
  success: '#22c55e',
  successMuted: '#14532d',
  warning: '#f59e0b',
  warningMuted: '#451a03',
  error: '#ef4444',
  errorMuted: '#450a0a',
  info: '#3b82f6',
  infoMuted: '#172554',

  // === SPECIAL ===
  purple: '#8b5cf6',
  purpleMuted: '#2e1065',

  // === SHADOWS ===
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
    glow: '0 0 20px rgba(16, 185, 129, 0.2)',
  },
};

const LIGHT_BASE = {
  // === BACKGROUNDS ===
  bg: '#ffffff',
  bgElevated: '#fafafa',
  bgPanel: '#f4f4f5',
  bgMuted: '#f4f4f5',
  bgHover: '#e4e4e7',
  bgActive: '#d4d4d8',

  // === BORDERS ===
  border: '#e4e4e7',
  borderMuted: '#f4f4f5',
  borderFocus: '#a1a1aa',

  // === TEXT ===
  text: '#09090b',
  textSecondary: '#52525b',
  textMuted: '#71717a',
  textDim: '#a1a1aa',

  // === SEMANTIC COLORS ===
  success: '#16a34a',
  successMuted: '#dcfce7',
  warning: '#d97706',
  warningMuted: '#fef3c7',
  error: '#dc2626',
  errorMuted: '#fee2e2',
  info: '#2563eb',
  infoMuted: '#dbeafe',

  // === SPECIAL ===
  purple: '#7c3aed',
  purpleMuted: '#ede9fe',

  // === SHADOWS ===
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(5, 150, 105, 0.15)',
  },
};

// Shared constants
const SHARED = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  transition: {
    fast: '0.1s ease',
    normal: '0.15s ease',
    slow: '0.25s ease',
  },
};

// ============================================================================
// THEME GENERATION
// ============================================================================

export interface Theme {
  // Backgrounds
  bg: string;
  bgElevated: string;
  bgPanel: string;
  bgMuted: string;
  bgHover: string;
  bgActive: string;
  // Borders
  border: string;
  borderMuted: string;
  borderFocus: string;
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  // Primary accent
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  primaryGlow: string;
  // Semantic colors
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  error: string;
  errorMuted: string;
  info: string;
  infoMuted: string;
  // Special
  purple: string;
  purpleMuted: string;
  // Typography
  fontFamily: string;
  fontMono: string;
  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  // Border radius
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  // Transitions
  transition: {
    fast: string;
    normal: string;
    slow: string;
  };
  // Shadows
  shadow: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type PaletteId = string;

/**
 * Generate a complete theme from mode and palette
 */
export function generateTheme(mode: 'light' | 'dark', paletteId: PaletteId): Theme {
  const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
  const base = mode === 'dark' ? DARK_BASE : LIGHT_BASE;
  const colors = mode === 'dark' ? palette.dark : palette.light;

  return {
    ...base,
    ...colors,
    ...SHARED,
    shadow: {
      ...base.shadow,
      glow: `0 0 20px ${colors.primaryGlow}`,
    },
  };
}

/**
 * Get theme based on mode and palette
 */
export function getTheme(mode: ThemeMode, paletteId: PaletteId = 'emerald'): Theme {
  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return generateTheme(prefersDark ? 'dark' : 'light', paletteId);
  }
  return generateTheme(mode, paletteId);
}

// ============================================================================
// LEGACY EXPORTS (backwards compatibility)
// ============================================================================

export const DARK_THEME = generateTheme('dark', 'emerald');
export const LIGHT_THEME = generateTheme('light', 'emerald');
// Global mutable theme object - updated by ThemeContext
export const THEME: Theme = { ...DARK_THEME };

// Function to update the global THEME object in place
export function updateGlobalTheme(newTheme: Theme): void {
  Object.assign(THEME, newTheme);
}
