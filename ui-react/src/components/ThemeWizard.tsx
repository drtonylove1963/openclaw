/**
 * ThemeWizard - Visual theme selection for project creation
 *
 * Ex Nihilo Phase: Design Differentiation
 * Allows users to configure visual identity before architecture design.
 *
 * Features:
 * - Personality selection with visual previews
 * - Dark/light mode toggle
 * - Primary color customization
 * - Font pairing selection
 * - Live preview panel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { COLORS } from '../styles/colors';

// ============================================================================
// Types
// ============================================================================

interface ColorPalette {
  primary: string;
  primary_dark: string;
  primary_light: string;
  secondary: string;
  accent: string;
  background: string;
  background_alt: string;
  surface: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface Typography {
  heading_font: string;
  body_font: string;
  mono_font: string;
  base_size: number;
  scale_ratio: number;
}

interface DesignTokens {
  colors: ColorPalette;
  typography: Typography;
  border_radius: string;
  shadow_style: string;
  motion_style: string;
  spacing_unit: number;
  max_content_width: number;
}

interface LogoConfig {
  style: string;
  layout: string;
  text: string;
  tagline?: string;
  icon_category?: string;
  icon_name?: string;
  primary_color: string;
  secondary_color?: string;
  background_color?: string;
  font_family: string;
  font_weight: number;
  icon_size: number;
  text_size: number;
  spacing: number;
  use_gradient: boolean;
  gradient_direction: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  personality: string;
  industry: string;
  dark_mode: boolean;
  tokens: DesignTokens;
  logo?: LogoConfig;
  css_variables?: string;
  tailwind_extend?: Record<string, any>;
  created_at: string;
}

interface Personality {
  value: string;
  label: string;
  description: string;
  colors: { primary: string; secondary: string; accent: string };
}

interface FontPairing {
  heading: string;
  body: string;
  category: string;
}

interface ThemeWizardProps {
  intent: string;
  projectName: string;
  onComplete: (theme: ThemeConfig, sessionId: string) => void;
  onBack: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const PERSONALITIES: Personality[] = [
  { value: 'modern', label: 'Modern', description: 'Clean lines, blue tones', colors: { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#F59E0B' } },
  { value: 'warm', label: 'Warm', description: 'Welcoming, orange tones', colors: { primary: '#EA580C', secondary: '#DC2626', accent: '#FBBF24' } },
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated, dark tones', colors: { primary: '#1E293B', secondary: '#64748B', accent: '#C9A227' } },
  { value: 'bold', label: 'Bold', description: 'Strong colors, impactful', colors: { primary: '#DC2626', secondary: '#7C3AED', accent: '#10B981' } },
  { value: 'minimal', label: 'Minimal', description: 'Clean, focused on content', colors: { primary: '#18181B', secondary: '#71717A', accent: '#3B82F6' } },
  { value: 'corporate', label: 'Corporate', description: 'Professional, trustworthy', colors: { primary: '#1E40AF', secondary: '#3B82F6', accent: '#059669' } },
  { value: 'playful', label: 'Playful', description: 'Fun, energetic colors', colors: { primary: '#8B5CF6', secondary: '#EC4899', accent: '#14B8A6' } },
  { value: 'tech', label: 'Tech', description: 'Futuristic, developer-friendly', colors: { primary: '#06B6D4', secondary: '#8B5CF6', accent: '#22C55E' } },
];

// Font pairings using DISTINCTIVE fonts (not generic Inter/Roboto)
// Anti-Clone: Each pairing is unique and avoids overused template fonts
const FONT_PAIRINGS: FontPairing[] = [
  { heading: 'Satoshi', body: 'General Sans', category: 'Modern' },
  { heading: 'Playfair Display', body: 'Lato', category: 'Elegant' },
  { heading: 'Dela Gothic One', body: 'Barlow', category: 'Bold' },
  { heading: 'Vollkorn', body: 'Cabin', category: 'Warm' },
  { heading: 'Archivo', body: 'Jost', category: 'Minimal' },
  { heading: 'Plus Jakarta Sans', body: 'Figtree', category: 'Corporate' },
  { heading: 'Fredoka One', body: 'Quicksand', category: 'Playful' },
  { heading: 'Space Mono', body: 'Space Grotesk', category: 'Tech' },
];

const BORDER_STYLES = [
  { value: 'sharp', label: 'Sharp', preview: '4px' },
  { value: 'soft', label: 'Soft', preview: '8px' },
  { value: 'rounded', label: 'Rounded', preview: '12px' },
  { value: 'pill', label: 'Pill', preview: '9999px' },
];

const LOGO_STYLES = [
  { value: 'text_only', label: 'Text Only', description: 'Clean wordmark' },
  { value: 'icon_only', label: 'Icon Only', description: 'Standalone symbol' },
  { value: 'icon_text', label: 'Icon + Text', description: 'Icon with name' },
  { value: 'monogram', label: 'Monogram', description: 'Stylized initials' },
  { value: 'abstract', label: 'Abstract', description: 'Unique shape' },
];

const LOGO_LAYOUTS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'stacked', label: 'Stacked' },
];

const ICON_CATEGORIES = [
  { value: 'tech', label: 'Tech', icons: ['code', 'cpu', 'terminal', 'database', 'cloud'] },
  { value: 'nature', label: 'Nature', icons: ['leaf', 'tree', 'sun', 'mountain', 'flower'] },
  { value: 'abstract', label: 'Abstract', icons: ['hexagon', 'circle', 'star', 'diamond', 'sparkles'] },
  { value: 'business', label: 'Business', icons: ['building', 'briefcase', 'trending-up', 'target', 'rocket'] },
  { value: 'creative', label: 'Creative', icons: ['palette', 'brush', 'camera', 'music', 'wand'] },
  { value: 'community', label: 'Community', icons: ['users', 'heart', 'globe', 'home', 'hand-helping'] },
];

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ============================================================================
// API Functions
// ============================================================================

async function generateTheme(token: string, request: {
  intent: string;
  project_name: string;
  preferences?: {
    personality?: string;
    dark_mode?: boolean;
    primary_color?: string;
    heading_font?: string;
    body_font?: string;
    border_radius?: string;
    logo?: {
      style?: string;
      layout?: string;
      text?: string;
      tagline?: string;
      icon_category?: string;
      icon_name?: string;
      primary_color?: string;
      use_gradient?: boolean;
    };
  };
}) {
  const response = await fetch(`${API_BASE}/api/v1/theme/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate theme: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Component
// ============================================================================

export const ThemeWizard: React.FC<ThemeWizardProps> = ({
  intent,
  projectName,
  onComplete,
  onBack,
}) => {
  // State
  const [selectedPersonality, setSelectedPersonality] = useState<string>('modern');
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string>('#3B82F6');
  const [selectedFonts, setSelectedFonts] = useState<FontPairing>(FONT_PAIRINGS[0]);
  const [borderRadius, setBorderRadius] = useState<string>('soft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logo state
  const [logoStyle, setLogoStyle] = useState<string>('icon_text');
  const [logoLayout, setLogoLayout] = useState<string>('horizontal');
  const [logoText, setLogoText] = useState<string>(projectName);
  const [logoTagline, setLogoTagline] = useState<string>('');
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('abstract');
  const [selectedIcon, setSelectedIcon] = useState<string>('hexagon');
  const [useGradient, setUseGradient] = useState(false);

  const token = localStorage.getItem('pronetheia_token') || '';

  // Update primary color when personality changes
  useEffect(() => {
    const personality = PERSONALITIES.find(p => p.value === selectedPersonality);
    if (personality) {
      setPrimaryColor(personality.colors.primary);
      // Also update font pairing to match
      const matchingFont = FONT_PAIRINGS.find(f => f.category.toLowerCase() === selectedPersonality);
      if (matchingFont) {
        setSelectedFonts(matchingFont);
      }
    }
  }, [selectedPersonality]);

  // Handle theme generation
  const handleContinue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateTheme(token, {
        intent,
        project_name: projectName,
        preferences: {
          personality: selectedPersonality,
          dark_mode: darkMode,
          primary_color: primaryColor,
          heading_font: selectedFonts.heading,
          body_font: selectedFonts.body,
          border_radius: borderRadius,
          logo: {
            style: logoStyle,
            layout: logoLayout,
            text: logoText,
            tagline: logoTagline || undefined,
            icon_category: selectedIconCategory,
            icon_name: selectedIcon,
            primary_color: primaryColor,
            use_gradient: useGradient,
          },
        },
      });

      onComplete(result.theme, result.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate theme');
    } finally {
      setLoading(false);
    }
  }, [intent, projectName, selectedPersonality, darkMode, primaryColor, selectedFonts, borderRadius, logoStyle, logoLayout, logoText, logoTagline, selectedIconCategory, selectedIcon, useGradient, token, onComplete]);

  // Get current preview colors
  const previewColors = PERSONALITIES.find(p => p.value === selectedPersonality)?.colors || PERSONALITIES[0].colors;
  const previewBg = darkMode ? '#0F172A' : '#FFFFFF';
  const previewText = darkMode ? '#F8FAFC' : '#111827';
  const previewTextMuted = darkMode ? '#94A3B8' : '#6B7280';

  // ============================================================================
  // Styles
  // ============================================================================

  const styles = {
    container: {
      backgroundColor: COLORS.bgAlt,
      borderRadius: '12px',
      padding: '24px',
      minHeight: '600px',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      color: COLORS.text,
    },
    subtitle: {
      fontSize: '14px',
      color: COLORS.textMuted,
      marginTop: '4px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '24px',
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '12px',
    },
    personalityGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
    },
    personalityCard: (selected: boolean) => ({
      padding: '16px',
      borderRadius: '8px',
      border: `2px solid ${selected ? COLORS.info : COLORS.border}`,
      backgroundColor: selected ? COLORS.info + '10' : COLORS.bg,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }),
    colorDots: {
      display: 'flex',
      gap: '4px',
      marginBottom: '8px',
    },
    colorDot: (color: string) => ({
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: color,
    }),
    personalityLabel: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
    },
    personalityDesc: {
      fontSize: '12px',
      color: COLORS.textMuted,
      marginTop: '2px',
    },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      backgroundColor: COLORS.bg,
      borderRadius: '8px',
      marginBottom: '12px',
    },
    toggle: (active: boolean) => ({
      width: '48px',
      height: '24px',
      borderRadius: '12px',
      backgroundColor: active ? COLORS.info : COLORS.bgPanel,
      position: 'relative' as const,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    }),
    toggleKnob: (active: boolean) => ({
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: '#fff',
      position: 'absolute' as const,
      top: '2px',
      left: active ? '26px' : '2px',
      transition: 'left 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }),
    colorPicker: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    colorInput: {
      width: '48px',
      height: '48px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
    },
    fontGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
    },
    fontCard: (selected: boolean) => ({
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${selected ? COLORS.info : COLORS.border}`,
      backgroundColor: selected ? COLORS.info + '10' : COLORS.bg,
      cursor: 'pointer',
    }),
    fontHeading: {
      fontSize: '16px',
      fontWeight: 600,
      color: COLORS.text,
    },
    fontBody: {
      fontSize: '12px',
      color: COLORS.textMuted,
    },
    borderGrid: {
      display: 'flex',
      gap: '12px',
    },
    borderCard: (selected: boolean) => ({
      flex: 1,
      padding: '16px',
      borderRadius: '8px',
      border: `1px solid ${selected ? COLORS.info : COLORS.border}`,
      backgroundColor: selected ? COLORS.info + '10' : COLORS.bg,
      cursor: 'pointer',
      textAlign: 'center' as const,
    }),
    borderPreview: (radius: string) => ({
      width: '40px',
      height: '40px',
      backgroundColor: COLORS.info,
      borderRadius: radius,
      margin: '0 auto 8px',
    }),
    preview: {
      backgroundColor: COLORS.bg,
      borderRadius: '12px',
      padding: '16px',
      position: 'sticky' as const,
      top: '24px',
    },
    previewTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '16px',
    },
    previewPanel: (bg: string, text: string) => ({
      backgroundColor: bg,
      borderRadius: '8px',
      padding: '20px',
      color: text,
    }),
    previewHeader: (font: string) => ({
      fontFamily: `'${font}', system-ui, sans-serif`,
      fontSize: '20px',
      fontWeight: 700,
      marginBottom: '8px',
    }),
    previewBody: (font: string, color: string) => ({
      fontFamily: `'${font}', system-ui, sans-serif`,
      fontSize: '14px',
      color: color,
      marginBottom: '16px',
    }),
    previewButton: (color: string, radius: string) => ({
      backgroundColor: color,
      color: '#fff',
      padding: '10px 20px',
      border: 'none',
      borderRadius: radius,
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
    }),
    previewCard: (bg: string, border: string, radius: string) => ({
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: radius,
      padding: '16px',
      marginTop: '16px',
    }),
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: `1px solid ${COLORS.border}`,
    },
    button: (primary: boolean = false) => ({
      padding: '12px 24px',
      borderRadius: '8px',
      border: primary ? 'none' : `1px solid ${COLORS.border}`,
      backgroundColor: primary ? COLORS.info : 'transparent',
      color: primary ? '#fff' : COLORS.textMuted,
      cursor: loading ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      opacity: loading ? 0.6 : 1,
    }),
    error: {
      backgroundColor: COLORS.error + '10',
      color: COLORS.error,
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
    },
    // Logo styles
    logoStyleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '8px',
    },
    logoStyleCard: (selected: boolean) => ({
      padding: '12px 8px',
      borderRadius: '8px',
      border: `1px solid ${selected ? COLORS.info : COLORS.border}`,
      backgroundColor: selected ? COLORS.info + '10' : COLORS.bg,
      cursor: 'pointer',
      textAlign: 'center' as const,
    }),
    logoLayoutGrid: {
      display: 'flex',
      gap: '8px',
    },
    logoLayoutCard: (selected: boolean) => ({
      flex: 1,
      padding: '10px',
      borderRadius: '8px',
      border: `1px solid ${selected ? COLORS.info : COLORS.border}`,
      backgroundColor: selected ? COLORS.info + '10' : COLORS.bg,
      cursor: 'pointer',
      textAlign: 'center' as const,
    }),
    iconCategoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
    },
    iconCategoryCard: (selected: boolean) => ({
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${selected ? COLORS.info : COLORS.border}`,
      backgroundColor: selected ? COLORS.info + '10' : COLORS.bg,
      cursor: 'pointer',
    }),
    iconGrid: {
      display: 'flex',
      gap: '6px',
      marginTop: '6px',
      flexWrap: 'wrap' as const,
    },
    iconButton: (selected: boolean) => ({
      padding: '8px 12px',
      borderRadius: '6px',
      border: `1px solid ${selected ? COLORS.info : COLORS.border}`,
      backgroundColor: selected ? COLORS.info : COLORS.bg,
      color: selected ? '#fff' : COLORS.textMuted,
      cursor: 'pointer',
      fontSize: '12px',
    }),
    textInput: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.bg,
      color: COLORS.text,
      fontSize: '14px',
    },
    logoPreview: {
      marginTop: '16px',
      padding: '20px',
      backgroundColor: darkMode ? '#1E293B' : '#F9FAFB',
      borderRadius: '8px',
      textAlign: 'center' as const,
    },
  };

  // Get border radius preview value
  const getBorderRadiusPreview = () => {
    const style = BORDER_STYLES.find(s => s.value === borderRadius);
    return style?.preview || '8px';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>Theme & Visual Design</div>
        <div style={styles.subtitle}>
          Configure the visual identity for {projectName}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {/* Left: Controls */}
        <div>
          {/* Personality Selection */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Design Personality</div>
            <div style={styles.personalityGrid}>
              {PERSONALITIES.map((p) => (
                <div
                  key={p.value}
                  style={styles.personalityCard(selectedPersonality === p.value)}
                  onClick={() => setSelectedPersonality(p.value)}
                >
                  <div style={styles.colorDots}>
                    <div style={styles.colorDot(p.colors.primary)} />
                    <div style={styles.colorDot(p.colors.secondary)} />
                    <div style={styles.colorDot(p.colors.accent)} />
                  </div>
                  <div style={styles.personalityLabel}>{p.label}</div>
                  <div style={styles.personalityDesc}>{p.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div style={styles.section}>
            <div style={styles.toggleRow}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: COLORS.text }}>
                  Dark Mode
                </div>
                <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                  Use dark background colors
                </div>
              </div>
              <div style={styles.toggle(darkMode)} onClick={() => setDarkMode(!darkMode)}>
                <div style={styles.toggleKnob(darkMode)} />
              </div>
            </div>
          </div>

          {/* Primary Color */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Primary Color</div>
            <div style={styles.colorPicker}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={styles.colorInput}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.bg,
                  color: COLORS.text,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          {/* Font Selection */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Typography</div>
            <div style={styles.fontGrid}>
              {FONT_PAIRINGS.map((font) => (
                <div
                  key={font.heading}
                  style={styles.fontCard(selectedFonts.heading === font.heading)}
                  onClick={() => setSelectedFonts(font)}
                >
                  <div style={styles.fontHeading}>{font.heading}</div>
                  <div style={styles.fontBody}>Body: {font.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Corner Style</div>
            <div style={styles.borderGrid}>
              {BORDER_STYLES.map((style) => (
                <div
                  key={style.value}
                  style={styles.borderCard(borderRadius === style.value)}
                  onClick={() => setBorderRadius(style.value)}
                >
                  <div style={styles.borderPreview(style.preview)} />
                  <div style={{ fontSize: '14px', color: COLORS.text }}>{style.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Logo Configuration */}
          <div style={{ ...styles.section, borderTop: `1px solid ${COLORS.border}`, paddingTop: '24px', marginTop: '8px' }}>
            <div style={{ ...styles.sectionTitle, fontSize: '18px', marginBottom: '16px' }}>Logo Design</div>

            {/* Logo Style */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ ...styles.sectionTitle, fontSize: '14px' }}>Logo Style</div>
              <div style={styles.logoStyleGrid}>
                {LOGO_STYLES.map((style) => (
                  <div
                    key={style.value}
                    style={styles.logoStyleCard(logoStyle === style.value)}
                    onClick={() => setLogoStyle(style.value)}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>{style.label}</div>
                    <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>{style.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logo Layout (only for icon+text styles) */}
            {(logoStyle === 'icon_text' || logoStyle === 'monogram') && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ ...styles.sectionTitle, fontSize: '14px' }}>Layout</div>
                <div style={styles.logoLayoutGrid}>
                  {LOGO_LAYOUTS.map((layout) => (
                    <div
                      key={layout.value}
                      style={styles.logoLayoutCard(logoLayout === layout.value)}
                      onClick={() => setLogoLayout(layout.value)}
                    >
                      <div style={{ fontSize: '13px', color: COLORS.text }}>{layout.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logo Text */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ ...styles.sectionTitle, fontSize: '14px' }}>Brand Name</div>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                placeholder="Enter your brand name"
                style={styles.textInput}
              />
            </div>

            {/* Tagline (optional) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ ...styles.sectionTitle, fontSize: '14px' }}>Tagline (optional)</div>
              <input
                type="text"
                value={logoTagline}
                onChange={(e) => setLogoTagline(e.target.value)}
                placeholder="Your brand tagline"
                style={styles.textInput}
              />
            </div>

            {/* Icon Selection (for icon styles) */}
            {(logoStyle === 'icon_text' || logoStyle === 'icon_only' || logoStyle === 'abstract') && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ ...styles.sectionTitle, fontSize: '14px' }}>Icon Category</div>
                <div style={styles.iconCategoryGrid}>
                  {ICON_CATEGORIES.map((cat) => (
                    <div
                      key={cat.value}
                      style={styles.iconCategoryCard(selectedIconCategory === cat.value)}
                      onClick={() => {
                        setSelectedIconCategory(cat.value);
                        setSelectedIcon(cat.icons[0]);
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>{cat.label}</div>
                      <div style={styles.iconGrid}>
                        {cat.icons.slice(0, 3).map((icon) => (
                          <span
                            key={icon}
                            style={{
                              ...styles.iconButton(selectedIconCategory === cat.value && selectedIcon === icon),
                              padding: '4px 8px',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIconCategory(cat.value);
                              setSelectedIcon(icon);
                            }}
                          >
                            {icon}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gradient Toggle */}
            <div style={styles.toggleRow}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: COLORS.text }}>
                  Use Gradient
                </div>
                <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                  Add gradient effect to logo
                </div>
              </div>
              <div style={styles.toggle(useGradient)} onClick={() => setUseGradient(!useGradient)}>
                <div style={styles.toggleKnob(useGradient)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={styles.preview}>
          <div style={styles.previewTitle}>Live Preview</div>
          <div style={styles.previewPanel(previewBg, previewText)}>
            <div style={styles.previewHeader(selectedFonts.heading)}>
              Welcome to {projectName}
            </div>
            <div style={styles.previewBody(selectedFonts.body, previewTextMuted)}>
              This is how your application will look with the selected theme settings.
              The personality affects colors, typography, and overall feel.
            </div>
            <button style={styles.previewButton(primaryColor, getBorderRadiusPreview())}>
              Get Started
            </button>

            <div style={styles.previewCard(
              darkMode ? '#1E293B' : '#F9FAFB',
              darkMode ? '#334155' : '#E5E7EB',
              getBorderRadiusPreview()
            )}>
              <div style={{ ...styles.previewHeader(selectedFonts.heading), fontSize: '16px', marginBottom: '4px' }}>
                Sample Card
              </div>
              <div style={styles.previewBody(selectedFonts.body, previewTextMuted)}>
                Cards and containers will use these styles.
              </div>
            </div>

            {/* Logo Preview */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: darkMode ? '#0F172A' : '#F1F5F9',
              borderRadius: getBorderRadiusPreview(),
              border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
            }}>
              <div style={{ fontSize: '11px', color: previewTextMuted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Logo Preview
              </div>
              <div style={{
                display: 'flex',
                alignItems: logoLayout === 'vertical' ? 'center' : 'center',
                flexDirection: logoLayout === 'vertical' ? 'column' : 'row',
                gap: '8px',
              }}>
                {/* Icon */}
                {(logoStyle === 'icon_text' || logoStyle === 'icon_only' || logoStyle === 'abstract') && (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: logoStyle === 'abstract' ? '8px' : '50%',
                    background: useGradient
                      ? `linear-gradient(135deg, ${primaryColor}, ${previewColors.secondary})`
                      : primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}>
                    {selectedIcon.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Text */}
                {(logoStyle !== 'icon_only') && (
                  <div style={{
                    textAlign: logoLayout === 'vertical' ? 'center' : 'left',
                  }}>
                    <div style={{
                      fontFamily: `'${selectedFonts.heading}', sans-serif`,
                      fontSize: logoStyle === 'monogram' ? '24px' : '18px',
                      fontWeight: 700,
                      color: useGradient ? primaryColor : previewText,
                      letterSpacing: logoStyle === 'monogram' ? '2px' : '0',
                    }}>
                      {logoStyle === 'monogram' ? logoText.split(' ').map(w => w.charAt(0)).join('') : logoText}
                    </div>
                    {logoTagline && logoStyle !== 'monogram' && (
                      <div style={{
                        fontSize: '10px',
                        color: previewTextMuted,
                        marginTop: '2px',
                      }}>
                        {logoTagline}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Color swatches */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: primaryColor }} />
                <div style={{ fontSize: '10px', marginTop: '4px', color: previewTextMuted }}>Primary</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: previewColors.secondary }} />
                <div style={{ fontSize: '10px', marginTop: '4px', color: previewTextMuted }}>Secondary</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: previewColors.accent }} />
                <div style={{ fontSize: '10px', marginTop: '4px', color: previewTextMuted }}>Accent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.button()} onClick={onBack} disabled={loading}>
          Back to Tech Stack
        </button>
        <button style={styles.button(true)} onClick={handleContinue} disabled={loading}>
          {loading ? 'Generating Theme...' : 'Continue to Architecture'}
        </button>
      </div>
    </div>
  );
};

export default ThemeWizard;
