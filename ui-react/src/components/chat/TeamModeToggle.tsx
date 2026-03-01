/**
 * TeamModeToggle Component
 * Toggle control for enabling Team Mode in chat sessions
 * Allows users to switch between single-agent and multi-agent team execution
 */

import React from 'react';
import { COLORS } from '../../styles/colors';

interface TeamModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export const TeamModeToggle: React.FC<TeamModeToggleProps> = ({
  enabled,
  onToggle,
  disabled = false,
  disabledReason,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onToggle(!enabled);
    }
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${enabled ? COLORS.purple : COLORS.border}`,
    backgroundColor: enabled ? `${COLORS.purple}15` : COLORS.bgPanel,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
  };

  // Icon container
  const iconContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    color: enabled ? COLORS.purple : COLORS.textMuted,
    transition: 'all 0.2s ease',
  };

  // Label
  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: enabled ? COLORS.purple : COLORS.text,
    transition: 'all 0.2s ease',
  };

  // Toggle switch container
  const toggleContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '40px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: enabled ? COLORS.purple : COLORS.border,
    transition: 'all 0.2s ease',
    marginLeft: '4px',
  };

  // Toggle knob
  const toggleKnobStyle: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: enabled ? '22px' : '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: COLORS.bg,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
  };

  // Team icon SVG (group of people)
  const TeamIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      title={disabled ? disabledReason : 'Toggle Team Mode'}
      role="button"
      aria-pressed={enabled}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Team icon */}
      <div style={iconContainerStyle}>
        <TeamIcon />
      </div>

      {/* Label */}
      <span style={labelStyle}>Team Mode</span>

      {/* Toggle switch */}
      <div style={toggleContainerStyle}>
        <div style={toggleKnobStyle} />
      </div>
    </div>
  );
};
