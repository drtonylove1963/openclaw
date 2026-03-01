/**
 * AvatarStatus - Status indicator and subtitle display for AI Avatar
 */
import React, { useState, useEffect } from 'react';
import type { AvatarState } from '../../types/avatar';
import { COLORS } from '../../styles/colors';

interface AvatarStatusProps {
  state: AvatarState;
  currentText?: string;
  showSubtitles?: boolean;
}

export const AvatarStatus: React.FC<AvatarStatusProps> = ({
  state,
  currentText,
  showSubtitles = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate text appearance (typewriter effect for subtitles)
  useEffect(() => {
    if (!currentText || !showSubtitles) {
      setDisplayedText('');
      return;
    }

    setIsAnimating(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index <= currentText.length) {
        setDisplayedText(currentText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 30); // 30ms per character

    return () => clearInterval(interval);
  }, [currentText, showSubtitles]);

  const getStatusConfig = () => {
    switch (state) {
      case 'speaking':
        return {
          icon: <SpeakingIcon />,
          label: 'Speaking',
          color: COLORS.accent || '#10b981',
          pulse: true,
        };
      case 'listening':
        return {
          icon: <ListeningIcon />,
          label: 'Listening',
          color: '#3b82f6',
          pulse: true,
        };
      case 'thinking':
        return {
          icon: <ThinkingIcon />,
          label: 'Thinking',
          color: '#f59e0b',
          pulse: true,
        };
      case 'processing':
        return {
          icon: <ProcessingIcon />,
          label: 'Processing',
          color: '#8b5cf6',
          pulse: true,
        };
      case 'idle':
      default:
        return {
          icon: <IdleIcon />,
          label: 'Ready',
          color: COLORS.textMuted || '#71717a',
          pulse: false,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div style={styles.container}>
      {/* Status Badge */}
      <div style={styles.statusBadge}>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: statusConfig.color,
            ...(statusConfig.pulse && styles.pulse),
          }}
        />
        <span style={{ ...styles.statusIcon, color: statusConfig.color }}>
          {statusConfig.icon}
        </span>
        <span style={styles.statusLabel}>{statusConfig.label}</span>
      </div>

      {/* Subtitles */}
      {showSubtitles && displayedText && (
        <div style={styles.subtitlesContainer}>
          <p style={styles.subtitles}>
            {displayedText}
            {isAnimating && <span style={styles.cursor}>|</span>}
          </p>
        </div>
      )}
    </div>
  );
};

// Status Icons
const SpeakingIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const ListeningIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
  </svg>
);

const ThinkingIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ProcessingIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IdleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  pulse: {
    animation: 'avatarPulse 2s ease-in-out infinite',
  },
  statusIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: COLORS.text || '#fafafa',
  },
  subtitlesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '8px',
    padding: '10px 14px',
    maxHeight: '80px',
    overflow: 'hidden',
  },
  subtitles: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.5,
    color: COLORS.text || '#fafafa',
    textAlign: 'left',
  },
  cursor: {
    opacity: 1,
    animation: 'blink 0.7s ease-in-out infinite',
  },
};

// Add animations
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('avatar-status-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'avatar-status-styles';
    styleSheet.textContent = `
      @keyframes avatarPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default AvatarStatus;
