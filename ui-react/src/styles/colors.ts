/**
 * Shared COLORS constant for backward compatibility
 * Maps to the unified THEME system
 *
 * Now uses a Proxy to dynamically read from THEME,
 * so colors update automatically when theme changes.
 */
import { THEME, Theme } from './theme';

/**
 * Create COLORS object from a theme
 * Use this function with useTheme() for dynamic theming:
 * const { theme } = useTheme();
 * const colors = createColors(theme);
 */
export function createColors(theme: Theme) {
  return {
    bg: theme.bg,
    bgAlt: theme.bgElevated,
    bgPanel: theme.bgPanel,
    bgHover: theme.bgHover,
    bgActive: theme.bgActive,
    bgCard: theme.bgPanel,
    bgTool: theme.bgMuted,
    bgLight: theme.bgMuted,
    userBg: theme.primary,
    codeBg: theme.bgMuted,
    sidebar: theme.bgElevated,
    sidebarHover: theme.bgHover,
    card: theme.bgPanel,
    cardHover: theme.bgHover,
    panelBg: theme.bgPanel,
    accent: theme.primary,
    accentLight: theme.primary,
    accentMuted: theme.primaryMuted,
    accentHover: theme.primaryHover,
    accentOrange: theme.warning,
    text: theme.text,
    textMuted: theme.textSecondary,
    textDim: theme.textDim,
    border: theme.border,
    borderLight: theme.borderMuted,
    borderFocus: theme.borderFocus,
    success: theme.success,
    successLight: theme.successMuted,
    warning: theme.warning,
    error: theme.error,
    errorLight: theme.errorMuted,
    danger: theme.error,
    dangerBg: theme.errorMuted,
    info: theme.info,
    pending: theme.warning,
    sage: theme.textMuted,
    purple: theme.purple,
    premium: theme.warning,
    standard: theme.textSecondary,
    fast: theme.success,
    free: theme.textMuted,
    openrouter: theme.purple,
    direct: theme.primary,
    input: theme.bgMuted,
    inputBorder: theme.border,
    inputFocus: theme.borderFocus,
  };
}

// Color mapping from COLORS keys to THEME keys
const colorMapping: Record<string, keyof Theme> = {
  bg: 'bg',
  bgAlt: 'bgElevated',
  bgPanel: 'bgPanel',
  bgHover: 'bgHover',
  bgActive: 'bgActive',
  bgCard: 'bgPanel',
  bgTool: 'bgMuted',
  bgLight: 'bgMuted',
  userBg: 'primary',
  codeBg: 'bgMuted',
  sidebar: 'bgElevated',
  sidebarHover: 'bgHover',
  card: 'bgPanel',
  cardHover: 'bgHover',
  panelBg: 'bgPanel',
  accent: 'primary',
  accentLight: 'primary',
  accentMuted: 'primaryMuted',
  accentHover: 'primaryHover',
  accentOrange: 'warning',
  text: 'text',
  textMuted: 'textSecondary',
  textDim: 'textDim',
  border: 'border',
  borderLight: 'borderMuted',
  borderFocus: 'borderFocus',
  success: 'success',
  successLight: 'successMuted',
  warning: 'warning',
  error: 'error',
  errorLight: 'errorMuted',
  danger: 'error',
  dangerBg: 'errorMuted',
  info: 'info',
  pending: 'warning',
  sage: 'textMuted',
  purple: 'purple',
  premium: 'warning',
  standard: 'textSecondary',
  fast: 'success',
  free: 'textMuted',
  openrouter: 'purple',
  direct: 'primary',
  input: 'bgMuted',
  inputBorder: 'border',
  inputFocus: 'borderFocus',
};

// Dynamic COLORS - reads from global THEME at access time
export const COLORS = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    const themeKey = colorMapping[prop];
    if (themeKey) {
      return THEME[themeKey];
    }
    return undefined;
  },
});

// Re-export THEME for new components
export { THEME };
