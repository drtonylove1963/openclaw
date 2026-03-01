/**
 * ThemePreview - Visual demonstration of theme colors and components
 * Useful for testing and showcasing the theme system
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemePreview() {
  const { theme } = useTheme();

  return (
    <div style={{
      padding: theme.spacing.xl,
      background: theme.bg,
      color: theme.text,
      minHeight: '100vh',
      fontFamily: theme.fontFamily,
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: theme.spacing.lg }}>
        Theme Preview
      </h1>

      {/* Backgrounds */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: theme.spacing.md }}>
          Backgrounds
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md }}>
          {[
            { name: 'bg', color: theme.bg },
            { name: 'bgElevated', color: theme.bgElevated },
            { name: 'bgPanel', color: theme.bgPanel },
            { name: 'bgMuted', color: theme.bgMuted },
            { name: 'bgHover', color: theme.bgHover },
            { name: 'bgActive', color: theme.bgActive },
          ].map(({ name, color }) => (
            <div
              key={name}
              style={{
                padding: theme.spacing.lg,
                background: color,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius.lg,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: theme.spacing.xs }}>{name}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, fontFamily: theme.fontMono }}>{color}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Text Colors */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: theme.spacing.md }}>
          Text Colors
        </h2>
        <div style={{ background: theme.bgPanel, padding: theme.spacing.lg, borderRadius: theme.radius.lg }}>
          <p style={{ fontSize: 16, color: theme.text, marginBottom: theme.spacing.sm }}>
            Primary Text (theme.text)
          </p>
          <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: theme.spacing.sm }}>
            Secondary Text (theme.textSecondary)
          </p>
          <p style={{ fontSize: 16, color: theme.textMuted, marginBottom: theme.spacing.sm }}>
            Muted Text (theme.textMuted)
          </p>
          <p style={{ fontSize: 16, color: theme.textDim }}>
            Dim Text (theme.textDim)
          </p>
        </div>
      </section>

      {/* Semantic Colors */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: theme.spacing.md }}>
          Semantic Colors
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md }}>
          {[
            { name: 'Success', color: theme.success, bg: theme.successMuted },
            { name: 'Warning', color: theme.warning, bg: theme.warningMuted },
            { name: 'Error', color: theme.error, bg: theme.errorMuted },
            { name: 'Info', color: theme.info, bg: theme.infoMuted },
            { name: 'Primary', color: theme.primary, bg: theme.primaryMuted },
            { name: 'Purple', color: theme.purple, bg: theme.purpleMuted },
          ].map(({ name, color, bg }) => (
            <div
              key={name}
              style={{
                padding: theme.spacing.lg,
                background: bg,
                border: `1px solid ${color}44`,
                borderRadius: theme.radius.lg,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color, marginBottom: theme.spacing.xs }}>
                {name}
              </div>
              <div style={{ fontSize: 12, color: theme.textMuted, fontFamily: theme.fontMono }}>
                {color}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: theme.spacing.md }}>
          Buttons
        </h2>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
          <button style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            background: theme.primary,
            color: '#fff',
            border: 'none',
            borderRadius: theme.radius.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: theme.transition.normal,
          }}>
            Primary Button
          </button>
          <button style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            background: 'transparent',
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: theme.transition.normal,
          }}>
            Secondary Button
          </button>
          <button style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            background: theme.error,
            color: '#fff',
            border: 'none',
            borderRadius: theme.radius.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: theme.transition.normal,
          }}>
            Danger Button
          </button>
        </div>
      </section>

      {/* Cards */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: theme.spacing.md }}>
          Cards
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.md }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                padding: theme.spacing.lg,
                background: theme.bgPanel,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius.lg,
                boxShadow: theme.shadow.md,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: theme.spacing.sm }}>
                Card Title {i}
              </h3>
              <p style={{ fontSize: 14, color: theme.textSecondary, marginBottom: theme.spacing.md }}>
                This is a sample card demonstrating the theme's card styling with background, borders, and shadows.
              </p>
              <button style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: theme.primary,
                color: '#fff',
                border: 'none',
                borderRadius: theme.radius.md,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                Action
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: theme.spacing.md }}>
          Typography
        </h2>
        <div style={{ background: theme.bgPanel, padding: theme.spacing.lg, borderRadius: theme.radius.lg }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: theme.spacing.sm }}>Heading 1</h1>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: theme.spacing.sm }}>Heading 2</h2>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: theme.spacing.sm }}>Heading 3</h3>
          <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: theme.spacing.md }}>
            Body text with default styling. The quick brown fox jumps over the lazy dog.
          </p>
          <code style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: theme.bgMuted,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius.sm,
            fontFamily: theme.fontMono,
            fontSize: 13,
            color: theme.primary,
          }}>
            const code = "monospace text";
          </code>
        </div>
      </section>
    </div>
  );
}

export default ThemePreview;
