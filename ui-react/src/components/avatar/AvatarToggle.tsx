/**
 * AvatarToggle - Simple toggle button for enabling/disabling the AI Avatar
 */
import React from 'react';
import { useAvatarStore, selectAvatarEnabled } from '../../stores/avatarStore';
import { COLORS } from '../../styles/colors';

interface AvatarToggleProps {
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}

export const AvatarToggle: React.FC<AvatarToggleProps> = ({
  className,
  style,
  showLabel = true,
}) => {
  const isEnabled = useAvatarStore(selectAvatarEnabled);
  const { setEnabled, isMuted, setMuted } = useAvatarStore();

  return (
    <div style={{ ...styles.container, ...style }} className={className}>
      {/* Main Toggle */}
      <button
        style={{
          ...styles.toggleButton,
          ...(isEnabled && styles.toggleButtonActive),
        }}
        onClick={() => setEnabled(!isEnabled)}
        title={isEnabled ? 'Disable Avatar' : 'Enable Avatar'}
      >
        <AvatarIcon active={isEnabled} />
        {showLabel && <span style={styles.label}>{isEnabled ? 'Avatar On' : 'Avatar Off'}</span>}
      </button>

      {/* Mute Button (only visible when enabled) */}
      {isEnabled && (
        <button
          style={{
            ...styles.muteButton,
            ...(isMuted && styles.muteButtonActive),
          }}
          onClick={() => setMuted(!isMuted)}
          title={isMuted ? 'Unmute Avatar' : 'Mute Avatar'}
        >
          {isMuted ? <MutedIcon /> : <UnmutedIcon />}
        </button>
      )}
    </div>
  );
};

// Icons
const AvatarIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
    {active && (
      <>
        <circle cx="17" cy="5" r="3" fill={COLORS.accent || '#10b981'} stroke="none" />
      </>
    )}
  </svg>
);

const MutedIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const UnmutedIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: COLORS.bgAlt || '#141415',
    border: `1px solid ${COLORS.border || '#27272a'}`,
    borderRadius: '8px',
    color: COLORS.textMuted || '#a1a1aa',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: COLORS.accent || '#10b981',
    color: COLORS.accent || '#10b981',
  },
  label: {
    whiteSpace: 'nowrap',
  },
  muteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: COLORS.bgAlt || '#141415',
    border: `1px solid ${COLORS.border || '#27272a'}`,
    borderRadius: '8px',
    color: COLORS.textMuted || '#a1a1aa',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  muteButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    color: '#ef4444',
  },
};

export default AvatarToggle;
