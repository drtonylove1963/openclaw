/**
 * MicButton - Click-to-toggle microphone button for voice input
 *
 * Supports both Whisper STT (self-hosted) and browser Web Speech API.
 * Auto-selects Whisper if available, falls back to browser speech.
 * Click to start listening, click again or wait for speech to stop.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useWhisperSTT } from '../../hooks/useWhisperSTT';
import { useAvatarStore } from '../../stores/avatarStore';
import { COLORS } from '../../styles/colors';

/** STT provider type */
export type STTProvider = 'whisper' | 'browser' | 'auto';

interface MicButtonProps {
  /** Callback when speech is recognized */
  onSpeechResult: (transcript: string) => void;
  /** Whether input is disabled (e.g., during response) */
  disabled?: boolean;
  /** Size of the button */
  size?: 'small' | 'medium' | 'large';
  /** Show transcript preview while speaking */
  showPreview?: boolean;
  /** Custom style */
  style?: React.CSSProperties;
  /** STT provider: 'whisper', 'browser', or 'auto' (default: auto) */
  sttProvider?: STTProvider;
  /** Show which provider is being used */
  showProvider?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  onSpeechResult,
  disabled = false,
  size = 'medium',
  showPreview = true,
  style,
  sttProvider = 'auto',
  showProvider = false,
}) => {
  const setAvatarState = useAvatarStore((state) => state.setState);
  const [activeProvider, setActiveProvider] = useState<'whisper' | 'browser'>('browser');

  // Memoize the onResult callback to prevent recreation of SpeechRecognition
  const handleResult = useCallback((finalTranscript: string) => {
    if (finalTranscript.trim()) {
      onSpeechResult(finalTranscript.trim());
    }
    setAvatarState('idle');
  }, [onSpeechResult, setAvatarState]);

  // Memoize the options object for browser speech recognition
  const speechOptions = useMemo(() => ({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    onResult: handleResult,
  }), [handleResult]);

  // Browser Web Speech API
  const browser = useSpeechRecognition(speechOptions);

  // Whisper STT
  const whisper = useWhisperSTT({
    language: 'en',
    onResult: handleResult,
    onInterimResult: (text) => {
      // Update transcript preview during recording/transcribing
    },
  });

  // Determine which provider to use
  useEffect(() => {
    if (sttProvider === 'whisper') {
      setActiveProvider('whisper');
    } else if (sttProvider === 'browser') {
      setActiveProvider('browser');
    } else {
      // Auto: prefer Whisper if ready, fallback to browser
      if (whisper.isReady && whisper.isSupported) {
        setActiveProvider('whisper');
      } else if (browser.isSupported) {
        setActiveProvider('browser');
      }
    }
  }, [sttProvider, whisper.isReady, whisper.isSupported, browser.isSupported]);

  // Get the active provider's state
  const isWhisperActive = activeProvider === 'whisper';
  const isSupported = isWhisperActive ? whisper.isSupported : browser.isSupported;
  const isListening = isWhisperActive ? whisper.isListening : browser.isListening;
  const isTranscribing = isWhisperActive ? whisper.isTranscribing : false;
  const transcript = isWhisperActive ? whisper.transcript : browser.transcript;
  const error = isWhisperActive ? whisper.error : browser.error;

  // Toggle listening for the active provider
  const toggleListening = useCallback(async () => {
    if (isWhisperActive) {
      await whisper.toggleListening();
    } else {
      browser.toggleListening();
    }
  }, [isWhisperActive, whisper, browser]);

  // Update avatar state when listening or transcribing
  useEffect(() => {
    if (isListening || isTranscribing) {
      setAvatarState('listening');
    } else {
      setAvatarState('idle');
    }
  }, [isListening, isTranscribing, setAvatarState]);

  // Handle click to toggle listening
  const handleClick = useCallback(() => {
    if (disabled || !isSupported) {return;}
    toggleListening();
  }, [disabled, isSupported, toggleListening]);

  // Handle keyboard for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Size configurations
  const sizeConfig = {
    small: { button: 40, icon: 18, ring: 48 },
    medium: { button: 56, icon: 24, ring: 68 },
    large: { button: 72, icon: 32, ring: 88 },
  };
  const { button: buttonSize, icon: iconSize, ring: ringSize } = sizeConfig[size];

  if (!isSupported) {
    return (
      <div style={{ ...styles.notSupported, ...style }}>
        <MicOffIcon size={iconSize} />
        <span style={styles.notSupportedText}>Voice input not supported</span>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...style }}>
      {/* Pulsing ring when listening */}
      {isListening && (
        <div
          style={{
            ...styles.pulseRing,
            width: ringSize,
            height: ringSize,
          }}
        />
      )}

      {/* Main button */}
      <button
        style={{
          ...styles.button,
          width: buttonSize,
          height: buttonSize,
          backgroundColor: isListening
            ? COLORS.accent || '#10b981'
            : disabled
            ? COLORS.textMuted
            : COLORS.card,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        title={isListening ? 'Click to stop' : 'Click to speak'}
        aria-label={isListening ? 'Click to stop listening' : 'Click to start voice input'}
      >
        {isListening ? (
          <MicActiveIcon size={iconSize} />
        ) : (
          <MicIcon size={iconSize} />
        )}
      </button>

      {/* Status text */}
      <div style={styles.statusContainer}>
        {isTranscribing && (
          <span style={styles.transcribingText}>Transcribing...</span>
        )}
        {isListening && !isTranscribing && (
          <span style={styles.listeningText}>Recording...</span>
        )}
        {!isListening && !isTranscribing && !error && (
          <span style={styles.hintText}>Click to speak</span>
        )}
        {error && (
          <span style={styles.errorText}>{error}</span>
        )}
        {showProvider && (
          <span style={styles.providerText}>
            {isWhisperActive ? 'Whisper' : 'Browser'}
          </span>
        )}
      </div>

      {/* Transcript preview */}
      {showPreview && (isListening || isTranscribing) && transcript && (
        <div style={styles.transcriptPreview}>
          <p style={styles.transcriptText}>{transcript}</p>
        </div>
      )}
    </div>
  );
};

// Microphone Icons
const MicIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicActiveIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" strokeWidth="2" />
    <line x1="12" y1="19" x2="12" y2="23" fill="none" strokeWidth="2" />
    <line x1="8" y1="23" x2="16" y2="23" fill="none" strokeWidth="2" />
  </svg>
);

const MicOffIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: `2px solid ${COLORS.border}`,
    color: '#fff',
    transition: 'all 0.2s ease',
    position: 'relative',
    zIndex: 1,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: '50%',
    border: `3px solid ${COLORS.accent || '#10b981'}`,
    animation: 'micPulse 1.5s ease-out infinite',
    opacity: 0.6,
  },
  statusContainer: {
    minHeight: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningText: {
    fontSize: '13px',
    fontWeight: 500,
    color: COLORS.accent || '#10b981',
    animation: 'micBlink 1s ease-in-out infinite',
  },
  transcribingText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#3b82f6',
    animation: 'micBlink 0.8s ease-in-out infinite',
  },
  hintText: {
    fontSize: '12px',
    color: COLORS.textMuted,
  },
  providerText: {
    fontSize: '10px',
    color: COLORS.textMuted,
    marginLeft: '8px',
    opacity: 0.7,
  },
  errorText: {
    fontSize: '12px',
    color: '#ef4444',
    maxWidth: '200px',
    textAlign: 'center',
  },
  transcriptPreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '8px',
    padding: '8px 12px',
    maxWidth: '250px',
    marginTop: '8px',
  },
  transcriptText: {
    margin: 0,
    fontSize: '14px',
    color: COLORS.text,
    textAlign: 'center',
  },
  notSupported: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.textMuted,
    padding: '16px',
  },
  notSupportedText: {
    fontSize: '12px',
    textAlign: 'center',
  },
};

// Add animations for pulse effect
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('mic-button-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'mic-button-styles';
    styleSheet.textContent = `
      @keyframes micPulse {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      @keyframes micBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default MicButton;
