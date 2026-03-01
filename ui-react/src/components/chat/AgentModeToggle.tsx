/**
 * AgentModeToggle - Toggle between LLM Mode and Agent Mode
 *
 * LLM Mode: Sends messages directly to LLM (fast, simple)
 * Agent Mode: Uses Universal Agent with skills and phases (structured, powerful)
 */
import React from 'react';
import { COLORS } from '../../styles/colors';

interface AgentModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function AgentModeToggle({ enabled, onToggle, disabled = false, disabledReason }: AgentModeToggleProps) {
  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      borderRadius: '6px',
      background: enabled ? `${COLORS.success}15` : 'transparent',
      border: `1px solid ${enabled ? COLORS.success : COLORS.border}`,
      transition: 'all 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    },
    toggle: {
      position: 'relative',
      width: '36px',
      height: '20px',
      borderRadius: '10px',
      background: enabled ? COLORS.success : COLORS.border,
      transition: 'background 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    toggleKnob: {
      position: 'absolute',
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
      color: enabled ? COLORS.success : COLORS.textMuted,
      letterSpacing: '0.02em',
      userSelect: 'none',
    },
    icon: {
      width: '14px',
      height: '14px',
      color: enabled ? COLORS.success : COLORS.textMuted,
    },
  };

  const handleClick = () => {
    if (!disabled) {
      onToggle(!enabled);
    }
  };

  // Determine the tooltip text
  const getTitle = () => {
    if (disabled && disabledReason) {
      return disabledReason;
    }
    return enabled ? 'Agent Mode: Using Universal Agent with skills' : 'LLM Mode: Fast direct LLM responses';
  };

  return (
    <div
      style={styles.container}
      onClick={handleClick}
      title={getTitle()}
    >
      {/* Agent Icon */}
      <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        {enabled && (
          <>
            <circle cx="12" cy="8" r="1" fill="currentColor" />
            <path d="M8 5l-2-2M16 5l2-2" strokeLinecap="round" />
          </>
        )}
      </svg>

      {/* Toggle Switch */}
      <div style={styles.toggle}>
        <div style={styles.toggleKnob} />
      </div>

      {/* Label */}
      <span style={styles.label}>
        {enabled ? 'Agent Mode' : 'LLM Mode'}
      </span>
    </div>
  );
}
