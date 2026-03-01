import type { OrbState } from '../../stores/voiceStore';

export interface OrbStatusTextProps {
  /** Current voice state */
  orbState: OrbState;
  /** CSS class */
  className?: string;
}

const STATUS_TEXT: Record<OrbState, string> = {
  idle: 'Tap or say "Hey Athena"',
  connecting: 'Connecting...',
  listening: 'Athena is listening...',
  thinking: 'Processing...',
  speaking: '',
  complete: 'Tap or say "Hey Athena"',
  error: 'Connection failed',
};

const STATUS_COLOR: Record<OrbState, string> = {
  idle: 'rgba(255, 255, 255, 0.5)',
  connecting: '#f59e0b',
  listening: '#00f0ff',
  thinking: '#7b61ff',
  speaking: 'rgba(255, 255, 255, 0.5)',
  complete: 'rgba(255, 255, 255, 0.5)',
  error: '#ef4444',
};

/**
 * OrbStatusText - Status message displayed below the Athena Orb.
 *
 * Dynamically changes text and color based on current voice state.
 * Uses aria-live="polite" for screen reader announcements.
 */
export function OrbStatusText({ orbState, className = '' }: OrbStatusTextProps) {
  const text = STATUS_TEXT[orbState];
  const color = STATUS_COLOR[orbState];

  return (
    <div
      className={`text-center transition-all duration-300 ${className}`}
      style={{
        fontSize: '16px',
        color,
        minHeight: '24px',
        animation: orbState === 'idle' || orbState === 'complete' ? 'fade-in-out 2s ease-in-out infinite' : 'none',
      }}
      aria-live="polite"
      id="orb-status"
    >
      {text}
      {orbState === 'thinking' && (
        <span style={{ animation: 'blink 1s step-end infinite' }}>...</span>
      )}
    </div>
  );
}
