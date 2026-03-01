import { useEffect, useCallback, useRef } from 'react';
import { AthenaOrb } from './AthenaOrb';
import { useVoiceStore } from '../../stores/voiceStore';
import { useLiveKitVoice } from '../../hooks/useLiveKitVoice';

export interface VoiceOverlayProps {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Handler to close the overlay */
  onClose: () => void;
  /** CSS class */
  className?: string;
}

/**
 * VoiceOverlay - Full-screen voice interaction overlay.
 *
 * Triggered from MiniOrb click or Ctrl+Shift+V on any page.
 * - Background dims to 20% opacity
 * - Large centered AthenaOrb with full state animations
 * - Floating transcript below in glassmorphic speech bubbles
 * - Close via Escape, X button, background click, or Ctrl+Shift+V again
 *
 * Focus management:
 * - On open: focus moves to the orb
 * - Tab order: Orb -> User bubble -> Assistant bubble -> Replay -> Close
 * - On close: focus returns to trigger element
 *
 * From VOICE-INTERACTION-SPEC.md Section 5.
 */
export function VoiceOverlay({ isOpen, onClose, className = '' }: VoiceOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const orbState = useVoiceStore(s => s.orbState);
  const userTranscript = useVoiceStore(s => s.userTranscript);
  const assistantResponse = useVoiceStore(s => s.assistantResponse);
  const lastError = useVoiceStore(s => s.lastError);
  const setOrbState = useVoiceStore(s => s.setOrbState);
  const setUserTranscript = useVoiceStore(s => s.setUserTranscript);
  const setAssistantResponse = useVoiceStore(s => s.setAssistantResponse);
  const setError = useVoiceStore(s => s.setError);

  const {
    isConnected,
    connect,
    startListening: lkStartListening,
    stopListening: lkStopListening,
  } = useLiveKitVoice({
    roomName: 'athena-voice',
    autoConnect: false,
    onTranscript: (text, isFinal) => {
      setUserTranscript(text);
      if (isFinal) {
        setOrbState('thinking');
      }
    },
    onAgentSpeaking: (speaking) => {
      if (speaking) {
        setOrbState('speaking');
      } else if (orbState === 'speaking') {
        setOrbState('complete');
      }
    },
    onAgentResponse: (text) => {
      setAssistantResponse(text);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Auto-connect to LiveKit when overlay opens
  useEffect(() => {
    if (isOpen && !isConnected) {
      connect().catch((err) => {
        setError(err instanceof Error ? err.message : 'Voice connection failed');
      });
    }
  }, [isOpen, isConnected, connect, setError]);

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the orb after animation
      const timer = setTimeout(() => {
        const orb = overlayRef.current?.querySelector('[role="button"]');
        orb?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) {return;}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (orbState === 'listening') {
          lkStopListening();
          setOrbState('thinking');
        } else {
          onClose();
        }
      } else if (e.key === ' ' && e.target === overlayRef.current?.querySelector('[role="button"]')) {
        // Space on orb toggles listening (handled by AthenaOrb's onTap)
      } else if (e.key === 'r' || e.key === 'R') {
        if (orbState === 'complete' && assistantResponse) {
          e.preventDefault();
          setOrbState('speaking');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, orbState, assistantResponse, lkStopListening, onClose, setOrbState]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) {return;}

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !overlayRef.current) {return;}

      const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
        'button, [role="button"], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {return;}

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleOrbTap = useCallback(async () => {
    try {
      if (!isConnected) {
        await connect();
      }

      switch (orbState) {
        case 'idle':
        case 'complete':
          setUserTranscript('');
          setAssistantResponse('');
          await lkStartListening();
          setOrbState('listening');
          break;
        case 'listening':
          await lkStopListening();
          setOrbState('thinking');
          break;
        case 'speaking':
          // Barge-in: interrupt and start listening
          await lkStartListening();
          setOrbState('listening');
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice connection failed');
    }
  }, [orbState, isConnected, connect, lkStartListening, lkStopListening, setOrbState, setUserTranscript, setAssistantResponse, setError]);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-400 ${className}`}
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        visibility: isOpen ? 'visible' : 'hidden',
      }}
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-label="Athena Voice Interface"
    >
      {/* Dimmed background */}
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{
          background: 'rgba(5, 5, 10, 0.8)',
          opacity: isOpen ? 1 : 0,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          transform: isOpen ? 'scale(1)' : 'scale(0.8)',
          transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <AthenaOrb
          orbState={orbState}
          userTranscript={userTranscript}
          assistantResponse={assistantResponse}
          error={lastError}
          onTap={handleOrbTap}
          onReplay={() => setOrbState('speaking')}
          onErrorDismiss={() => setError(null)}
          size="large"
        />
      </div>

      {/* Close button */}
      <button
        className="absolute z-10 flex items-center justify-center rounded-full transition-all duration-300
          hover:bg-white/10 hover:text-[#00f0ff]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]/40"
        style={{
          bottom: '40px',
          right: '40px',
          width: '44px',
          height: '44px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '20px',
          cursor: 'pointer',
        }}
        onClick={onClose}
        aria-label="Close voice overlay"
        tabIndex={isOpen ? 0 : -1}
      >
        &#10005;
      </button>
    </div>
  );
}
