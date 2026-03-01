/**
 * LettaLayout - Clean Three-Panel Layout
 * Uses unified theme system for consistent styling
 */
import React, { useState } from 'react';
import { THEME } from '../../styles/theme';

// Re-export THEME as LETTA_COLORS for backward compatibility
export const LETTA_COLORS = THEME;

interface LettaLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  leftPanelCollapsed?: boolean;
  rightPanelCollapsed?: boolean;
  onLeftPanelToggle?: () => void;
  onRightPanelToggle?: () => void;
}

export function LettaLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  leftPanelWidth = 300,
  rightPanelWidth = 340,
  leftPanelCollapsed = false,
  rightPanelCollapsed = false,
  onLeftPanelToggle,
  onRightPanelToggle,
}: LettaLayoutProps) {
  const collapsedWidth = 48;

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        backgroundColor: THEME.bg,
        fontFamily: THEME.fontFamily,
        overflow: 'hidden',
      }}
    >
      {/* Left Panel */}
      <div
        style={{
          width: leftPanelCollapsed ? collapsedWidth : leftPanelWidth,
          minWidth: leftPanelCollapsed ? collapsedWidth : leftPanelWidth,
          height: '100%',
          backgroundColor: THEME.bgElevated,
          borderRight: `1px solid ${THEME.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: `width ${THEME.transition.slow}, min-width ${THEME.transition.slow}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Panel Toggle */}
        {onLeftPanelToggle && (
          <button
            onClick={onLeftPanelToggle}
            style={{
              position: 'absolute',
              top: '50%',
              right: '-12px',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: THEME.radius.full,
              backgroundColor: THEME.bgPanel,
              border: `1px solid ${THEME.border}`,
              color: THEME.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              zIndex: 10,
              transition: `all ${THEME.transition.fast}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgHover;
              e.currentTarget.style.color = THEME.text;
              e.currentTarget.style.borderColor = THEME.borderFocus;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgPanel;
              e.currentTarget.style.color = THEME.textMuted;
              e.currentTarget.style.borderColor = THEME.border;
            }}
          >
            {leftPanelCollapsed ? '>' : '<'}
          </button>
        )}
        {leftPanel}
      </div>

      {/* Center Panel */}
      <div
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: THEME.bg,
        }}
      >
        {centerPanel}
      </div>

      {/* Right Panel */}
      <div
        style={{
          width: rightPanelCollapsed ? collapsedWidth : rightPanelWidth,
          minWidth: rightPanelCollapsed ? collapsedWidth : rightPanelWidth,
          height: '100%',
          backgroundColor: THEME.bgElevated,
          borderLeft: `1px solid ${THEME.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: `width ${THEME.transition.slow}, min-width ${THEME.transition.slow}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Panel Toggle */}
        {onRightPanelToggle && (
          <button
            onClick={onRightPanelToggle}
            style={{
              position: 'absolute',
              top: '50%',
              left: '-12px',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: THEME.radius.full,
              backgroundColor: THEME.bgPanel,
              border: `1px solid ${THEME.border}`,
              color: THEME.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              zIndex: 10,
              transition: `all ${THEME.transition.fast}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgHover;
              e.currentTarget.style.color = THEME.text;
              e.currentTarget.style.borderColor = THEME.borderFocus;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgPanel;
              e.currentTarget.style.color = THEME.textMuted;
              e.currentTarget.style.borderColor = THEME.border;
            }}
          >
            {rightPanelCollapsed ? '<' : '>'}
          </button>
        )}
        {rightPanel}
      </div>
    </div>
  );
}

// Panel Section Component
interface PanelSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  actions?: React.ReactNode;
}

export function PanelSection({
  title,
  icon,
  children,
  collapsible = true,
  defaultCollapsed = false,
  actions,
}: PanelSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div style={{ borderBottom: `1px solid ${THEME.border}` }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          cursor: collapsible ? 'pointer' : 'default',
          backgroundColor: collapsed ? 'transparent' : THEME.bgMuted,
          transition: `background ${THEME.transition.fast}`,
        }}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && <span style={{ fontSize: '13px', opacity: 0.7 }}>{icon}</span>}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: THEME.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actions}
          {collapsible && (
            <span
              style={{
                fontSize: '8px',
                color: THEME.textDim,
                transition: `transform ${THEME.transition.fast}`,
                transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              }}
            >
              ▼
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {!collapsed && <div style={{ padding: '12px 14px' }}>{children}</div>}
    </div>
  );
}

// Button Component
interface LettaButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;
}

export function LettaButton({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
}: LettaButtonProps) {
  const [hovered, setHovered] = useState(false);

  const variants = {
    primary: {
      bg: THEME.primary,
      bgHover: THEME.primaryHover,
      text: '#000',
      border: 'transparent',
    },
    secondary: {
      bg: 'transparent',
      bgHover: THEME.bgHover,
      text: THEME.text,
      border: THEME.border,
    },
    ghost: {
      bg: 'transparent',
      bgHover: THEME.bgHover,
      text: THEME.textSecondary,
      border: 'transparent',
    },
    danger: {
      bg: 'transparent',
      bgHover: THEME.errorMuted,
      text: THEME.error,
      border: THEME.error,
    },
  };

  const sizes = {
    sm: { padding: '6px 10px', fontSize: '12px' },
    md: { padding: '8px 14px', fontSize: '13px' },
    lg: { padding: '10px 18px', fontSize: '14px' },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 500,
        color: v.text,
        backgroundColor: hovered && !disabled ? v.bgHover : v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: THEME.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: `all ${THEME.transition.fast}`,
        fontFamily: THEME.fontFamily,
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// Input Component
interface LettaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
  label?: string;
  disabled?: boolean;
}

export function LettaInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  label,
  disabled = false,
}: LettaInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: THEME.textSecondary }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '8px 12px',
          fontSize: '13px',
          color: THEME.text,
          backgroundColor: THEME.bgMuted,
          border: `1px solid ${focused ? THEME.borderFocus : THEME.border}`,
          borderRadius: THEME.radius.md,
          outline: 'none',
          transition: `border-color ${THEME.transition.fast}`,
          fontFamily: THEME.fontFamily,
        }}
      />
    </div>
  );
}

// Select Component - supports both flat options and grouped options (optgroup)
interface SelectOption {
  value: string;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface LettaSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  label?: string;
  disabled?: boolean;
}

export function LettaSelect({
  value,
  onChange,
  options,
  groups,
  label,
  disabled = false,
}: LettaSelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: THEME.textSecondary }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: '8px 12px',
          fontSize: '13px',
          color: THEME.text,
          backgroundColor: THEME.bgMuted,
          border: `1px solid ${THEME.border}`,
          borderRadius: THEME.radius.md,
          outline: 'none',
          cursor: 'pointer',
          fontFamily: THEME.fontFamily,
        }}
      >
        {/* Render grouped options if provided */}
        {groups && groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
        {/* Render flat options if no groups */}
        {!groups && options && options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Toggle Component
interface LettaToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function LettaToggle({
  checked,
  onChange,
  label,
  disabled = false,
}: LettaToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      {label && <span style={{ fontSize: '13px', color: THEME.text }}>{label}</span>}
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: '40px',
          height: '22px',
          borderRadius: THEME.radius.full,
          backgroundColor: checked ? THEME.primary : THEME.bgActive,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          transition: `background-color ${THEME.transition.fast}`,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: THEME.radius.full,
            backgroundColor: checked ? '#000' : THEME.textMuted,
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            transition: `left ${THEME.transition.fast}`,
          }}
        />
      </button>
    </div>
  );
}

export default LettaLayout;
