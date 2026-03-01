/**
 * HandsFreeMode - Hands-free voice interaction with wake word detection
 *
 * Enables "Hey Athena" wake word for hands-free conversation with the AI avatar.
 * Once the wake word is detected, the user's request is captured until they
 * stop speaking, then Athena responds automatically.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWakeWord, WakeWordStatus } from '../../hooks/useWakeWord';
import { useAvatarStore } from '../../stores/avatarStore';
import { COLORS } from '../../styles/colors';

interface HandsFreeModeProps {
  /** Callback when a request is captured and ready to send */
  onRequestReady: (transcript: string) => void;
  /** Callback for auto-submit (when auto-submit is enabled) */
  onAutoSubmit?: (transcript: string) => void;
  /** Whether the system is processing/responding */
  isProcessing?: boolean;
  /** Custom wake word (default: "hey athena") */
  wakeWord?: string;
  /** Avatar name for display */
  avatarName?: string;
  /** Style overrides */
  style?: React.CSSProperties;
  /** Initial auto-submit state */
  defaultAutoSubmit?: boolean;
}

export const HandsFreeMode: React.FC<HandsFreeModeProps> = ({
  onRequestReady,
  onAutoSubmit,
  isProcessing = false,
  wakeWord = 'hey athena',
  avatarName = 'Athena',
  style,
  defaultAutoSubmit = true,
}) => {
  const setAvatarState = useAvatarStore((state) => state.setState);
  const setAvatarEmotion = useAvatarStore((state) => state.setEmotion);
  const avatarIsSpeaking = useAvatarStore((state) => state.state === 'speaking');
  const [autoSubmit, setAutoSubmit] = useState(defaultAutoSubmit);
  const [alwaysListen, setAlwaysListen] = useState(() => {
    return localStorage.getItem('athena_always_listen') === 'true';
  });

  const handleWakeWordDetected = useCallback(() => {
    setAvatarState('listening');
    setAvatarEmotion('focused');
  }, [setAvatarState, setAvatarEmotion]);

  const handleRequestCaptured = useCallback((transcript: string) => {
    setAvatarState('processing');
    onRequestReady(transcript);
    // Auto-submit if enabled
    if (autoSubmit && onAutoSubmit) {
      setTimeout(() => {
        onAutoSubmit(transcript);
      }, 100);
    }
  }, [onRequestReady, onAutoSubmit, autoSubmit, setAvatarState]);

  const handleStatusChange = useCallback((newStatus: WakeWordStatus) => {
    switch (newStatus) {
      case 'listening':
        setAvatarState('idle');
        setAvatarEmotion('neutral');
        break;
      case 'wake_detected':
      case 'recording':
        setAvatarState('listening');
        setAvatarEmotion('focused');
        break;
      case 'processing':
        setAvatarState('processing');
        setAvatarEmotion('thinking');
        break;
    }
  }, [setAvatarState, setAvatarEmotion]);

  const {
    isSupported,
    status,
    isEnabled,
    transcript,
    enable,
    disable,
    toggle,
    error,
  } = useWakeWord({
    wakeWord,
    alternativeWakeWords: ['athena', 'athina', 'hey arena'],
    skipWakeWord: alwaysListen,
    silenceTimeout: 1800,
    maxRecordingTime: 60000,
    onWakeWordDetected: handleWakeWordDetected,
    onRequestCaptured: handleRequestCaptured,
    onStatusChange: handleStatusChange,
  });

  // Pause wake word detection while Athena is responding OR speaking TTS.
  // Without this, always-listen mode picks up TTS audio as new speech input → feedback loop.
  const shouldPause = isProcessing || avatarIsSpeaking;
  const pausedRef = useRef(false);
  useEffect(() => {
    if (shouldPause && isEnabled) {
      pausedRef.current = true;
      disable();
    } else if (!shouldPause && pausedRef.current) {
      pausedRef.current = false;
      // Delay re-enable so trailing TTS audio doesn't trigger recognition
      const timer = setTimeout(() => {
        enable();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldPause, isEnabled, disable, enable]);

  const getStatusDisplay = () => {
    if (avatarIsSpeaking) {
      return {
        text: `${avatarName} is speaking...`,
        color: COLORS.accent || '#10b981',
        icon: <SpeakingIcon />,
      };
    }
    if (isProcessing) {
      return {
        text: `${avatarName} is responding...`,
        color: COLORS.accent || '#10b981',
        icon: <SpeakingIcon />,
      };
    }

    switch (status) {
      case 'listening':
        return {
          text: alwaysListen ? `${avatarName} is listening — just speak` : `Say "Hey ${avatarName}" to start`,
          color: alwaysListen ? '#3b82f6' : COLORS.textMuted,
          icon: <ListeningIcon />,
        };
      case 'wake_detected':
        return {
          text: `${avatarName} is listening...`,
          color: '#3b82f6',
          icon: <ActiveIcon />,
        };
      case 'recording':
        return {
          text: 'Speak your request...',
          color: COLORS.accent || '#10b981',
          icon: <RecordingIcon />,
        };
      case 'processing':
        return {
          text: 'Processing...',
          color: '#f59e0b',
          icon: <ProcessingIcon />,
        };
      default:
        return {
          text: 'Hands-free mode disabled',
          color: COLORS.textMuted,
          icon: <DisabledIcon />,
        };
    }
  };

  if (!isSupported) {
    return (
      <div style={{ ...styles.container, ...style }}>
        <div style={styles.notSupported}>
          <MicOffIcon />
          <span>Voice detection not supported in this browser</span>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div style={{ ...styles.container, ...style }}>
      {/* Toggle Buttons */}
      <div style={styles.toggleContainer}>
        {/* Hands-Free Toggle */}
        <button
          style={{
            ...styles.toggleButton,
            ...(isEnabled && styles.toggleButtonActive),
          }}
          onClick={toggle}
          title={isEnabled ? 'Disable hands-free mode' : 'Enable hands-free mode'}
        >
          <WakeWordIcon active={isEnabled} />
          <span>Hands-Free</span>
          <span style={styles.toggleStatus}>{isEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Always Listen Toggle - Skip wake word */}
        {isEnabled && (
          <button
            style={{
              ...styles.toggleButton,
              ...styles.toggleButtonSmall,
              ...(alwaysListen && styles.toggleButtonAlwaysListen),
            }}
            onClick={() => {
              const next = !alwaysListen;
              setAlwaysListen(next);
              localStorage.setItem('athena_always_listen', String(next));
            }}
            title={alwaysListen ? 'Require "Hey Athena" wake word' : 'Skip wake word — just start talking'}
          >
            <AlwaysListenIcon active={alwaysListen} />
            <span>Always Listen</span>
            <span style={styles.toggleStatus}>{alwaysListen ? 'ON' : 'OFF'}</span>
          </button>
        )}

        {/* Auto-Submit Toggle - Only show when hands-free is enabled */}
        {isEnabled && (
          <button
            style={{
              ...styles.toggleButton,
              ...styles.toggleButtonSmall,
              ...(autoSubmit && styles.toggleButtonAutoSubmit),
            }}
            onClick={() => setAutoSubmit(!autoSubmit)}
            title={autoSubmit ? 'Disable auto-submit' : 'Enable auto-submit'}
          >
            <AutoSubmitIcon active={autoSubmit} />
            <span>Auto-Submit</span>
            <span style={styles.toggleStatus}>{autoSubmit ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {/* Status Display */}
      {isEnabled && (
        <div style={styles.statusContainer}>
          {/* Animated listening indicator */}
          <div style={styles.statusRow}>
            <div
              style={{
                ...styles.statusIcon,
                color: statusDisplay.color,
              }}
            >
              {statusDisplay.icon}
            </div>
            <span
              style={{
                ...styles.statusText,
                color: statusDisplay.color,
              }}
            >
              {statusDisplay.text}
            </span>
          </div>

          {/* Transcript preview */}
          {(status === 'recording' || status === 'wake_detected') && transcript && (
            <div style={styles.transcriptContainer}>
              <p style={styles.transcript}>"{transcript}"</p>
            </div>
          )}

          {/* Visual indicator rings */}
          {(status === 'listening' || status === 'recording') && (
            <div style={styles.visualIndicator}>
              <div
                style={{
                  ...styles.pulseRing,
                  ...(status === 'recording' && styles.pulseRingActive),
                }}
              />
              <div
                style={{
                  ...styles.pulseRing,
                  ...(status === 'recording' && styles.pulseRingActive),
                  animationDelay: '0.5s',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {/* Wake word hint */}
      {isEnabled && status === 'listening' && (
        <div style={styles.hintContainer}>
          <span style={styles.hintText}>
            {alwaysListen
              ? `Just start talking — ${avatarName} will respond when you pause.`
              : `Try saying: "Hey ${avatarName}, what can you help me with?"`}
          </span>
        </div>
      )}
    </div>
  );
};

// Icons
const AutoSubmitIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

const AlwaysListenIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const WakeWordIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    {active && (
      <>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeDasharray="4 4" />
      </>
    )}
  </svg>
);

const ListeningIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
  </svg>
);

const ActiveIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" strokeWidth="2" />
  </svg>
);

const RecordingIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="6" />
  </svg>
);

const ProcessingIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const SpeakingIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const DisabledIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M4.93 4.93l14.14 14.14" />
  </svg>
);

const MicOffIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
  },
  toggleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '24px',
    color: COLORS.textMuted,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.accent || '#10b981',
    color: COLORS.accent || '#10b981',
  },
  toggleButtonSmall: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '16px',
  },
  toggleButtonAlwaysListen: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
    color: '#a855f7',
  },
  toggleButtonAutoSubmit: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
    color: '#3b82f6',
  },
  toggleStatus: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: '14px',
    fontWeight: 500,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '12px',
    padding: '12px 16px',
    maxWidth: '300px',
    width: '100%',
  },
  transcript: {
    margin: 0,
    fontSize: '15px',
    color: COLORS.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  visualIndicator: {
    position: 'relative',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: `2px solid ${COLORS.textMuted}`,
    opacity: 0.3,
    animation: 'wakeWordPulse 2s ease-out infinite',
  },
  pulseRingActive: {
    borderColor: COLORS.accent || '#10b981',
    opacity: 0.6,
    animation: 'wakeWordPulseActive 1s ease-out infinite',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  errorText: {
    fontSize: '13px',
    color: '#ef4444',
  },
  hintContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '8px 12px',
    maxWidth: '280px',
  },
  hintText: {
    fontSize: '12px',
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notSupported: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.textMuted,
    padding: '16px',
    textAlign: 'center',
    fontSize: '13px',
  },
};

// Add animations
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('hands-free-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'hands-free-styles';
    styleSheet.textContent = `
      @keyframes wakeWordPulse {
        0% {
          transform: scale(1);
          opacity: 0.3;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      @keyframes wakeWordPulseActive {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default HandsFreeMode;
