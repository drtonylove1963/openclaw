/**
 * AgenticModeToggle - Toggle for true agentic loop mode (like Claude Code)
 *
 * When enabled: Uses iterative tool execution loop until task is complete
 * When disabled: Single-turn tool execution then response
 */
import React from 'react';
import { COLORS } from '../../styles/colors';

interface AgenticModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function AgenticModeToggle({ enabled, onToggle, disabled = false, disabledReason }: AgenticModeToggleProps) {
  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      borderRadius: '6px',
      background: enabled ? `${COLORS.primary}15` : 'transparent',
      border: `1px solid ${enabled ? COLORS.primary : COLORS.border}`,
      transition: 'all 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    },
    toggle: {
      position: 'relative' as const,
      width: '36px',
      height: '20px',
      borderRadius: '10px',
      background: enabled ? COLORS.primary : COLORS.border,
      transition: 'background 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    toggleKnob: {
      position: 'absolute' as const,
      top: '2px',
      left: enabled ? '18px' : '2px',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: COLORS.text,
      transition: 'left 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    },
    label: {
      fontSize: '12px',
      fontWeight: 500,
      color: enabled ? COLORS.primary : COLORS.textMuted,
      letterSpacing: '0.02em',
      userSelect: 'none' as const,
    },
    icon: {
      width: '14px',
      height: '14px',
      color: enabled ? COLORS.primary : COLORS.textMuted,
    },
  };

  const handleClick = () => {
    if (!disabled) {
      onToggle(!enabled);
    }
  };

  const getTitle = () => {
    if (disabled && disabledReason) {
      return disabledReason;
    }
    return enabled 
      ? 'Agentic Mode: Iterative tool loop until task complete (like Claude Code)' 
      : 'Standard Mode: Single tool execution then response';
  };

  return (
    <div
      style={styles.container}
      onClick={handleClick}
      title={getTitle()}
    >
      {/* Loop/Infinity Icon for Agentic */}
      <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {enabled ? (
          // Infinity symbol for agentic loop
          <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          // Simple arrow for standard mode
          <>
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>

      {/* Toggle Switch */}
      <div style={styles.toggle}>
        <div style={styles.toggleKnob} />
      </div>

      {/* Label */}
      <span style={styles.label}>
        {enabled ? 'Agentic' : 'Standard'}
      </span>
    </div>
  );
}
