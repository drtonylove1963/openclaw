import { useCallback } from 'react';
import type { OrbState } from '../../stores/voiceStore';
import { OrbCore } from './OrbCore';
import { OrbitalRings } from './OrbitalRings';
import { RippleContainer } from './RippleContainer';
import { WaveformVisualizer } from './WaveformVisualizer';
import { NeuralSparks } from './NeuralSparks';
import { OrbStatusText } from './OrbStatusText';
import { SpeechBubble } from './SpeechBubble';
import { ReplayButton } from './ReplayButton';
import { ErrorToast } from './ErrorToast';

export interface AthenaOrbProps {
  /** Current orb state */
  orbState: OrbState;
  /** User transcript text */
  userTranscript: string;
  /** Assistant response text */
  assistantResponse: string;
  /** Error message (null if no error) */
  error?: string | null;
  /** Audio data for waveform visualization */
  audioData?: Uint8Array | null;
  /** Handler when orb is tapped/clicked */
  onTap: () => void;
  /** Handler for replay button */
  onReplay: () => void;
  /** Handler when error toast is dismissed */
  onErrorDismiss?: () => void;
  /** Size variant: 'large' for home/overlay (280px), 'medium' for smaller contexts */
  size?: 'large' | 'medium';
  /** CSS class */
  className?: string;
}

/**
 * AthenaOrb - Main voice interaction orb with full state machine animations.
 *
 * States: idle -> connecting -> listening -> thinking -> speaking -> complete (+ error)
 *
 * Composes:
 * - OrbCore: Inner gradient circle with state-driven colors
 * - OrbitalRings: 4 rotating rings with colored dots
 * - RippleContainer: Expanding ripple rings (listening/speaking)
 * - WaveformVisualizer: Circular bars (listening) or horizontal bars (speaking)
 * - NeuralSparks: Floating particles (thinking)
 * - OrbStatusText: State-dependent status message
 * - SpeechBubble: Transcript/response display
 * - ReplayButton: Replay last response
 * - ErrorToast: Error notification
 *
 * All transitions use CSS for 60fps performance.
 * Accessibility: role="button", keyboard activation, aria-live status region.
 */
export function AthenaOrb({
  orbState,
  userTranscript,
  assistantResponse,
  error = null,
  audioData = null,
  onTap,
  onReplay,
  onErrorDismiss,
  size = 'large',
  className = '',
}: AthenaOrbProps) {
  const containerSize = size === 'large' ? 280 : 200;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap();
    }
  }, [onTap]);

  const showUserBubble = orbState === 'listening' || orbState === 'thinking' || orbState === 'speaking' || orbState === 'complete';
  const showAssistantBubble = orbState === 'speaking' || orbState === 'complete';
  const showReplay = orbState === 'complete' && !!assistantResponse;

  const rippleColor = orbState === 'speaking'
    ? 'rgba(245, 158, 11, 0.5)'
    : 'rgba(0, 240, 255, 0.5)';

  return (
    <div
      className={`flex flex-col items-center gap-[30px] ${className}`}
    >
      {/* Orb container */}
      <div
        className="relative flex items-center justify-center cursor-pointer"
        style={{
          width: `${containerSize}px`,
          height: `${containerSize}px`,
        }}
        onClick={onTap}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Athena voice assistant"
        aria-describedby="orb-status"
      >
        {/* Orbital Rings */}
        <OrbitalRings orbState={orbState} />

        {/* Core Orb */}
        <OrbCore orbState={orbState} />

        {/* Ripple Rings (listening + speaking) */}
        <RippleContainer
          active={orbState === 'listening' || orbState === 'speaking'}
          color={rippleColor}
        />

        {/* Circular Waveform Ring (listening) */}
        <WaveformVisualizer
          mode="circular"
          active={orbState === 'listening'}
          audioData={audioData}
        />

        {/* Neural Sparks (thinking) */}
        <NeuralSparks active={orbState === 'thinking'} />
      </div>

      {/* Horizontal Audio Waveform (speaking) */}
      <WaveformVisualizer
        mode="horizontal"
        active={orbState === 'speaking'}
        audioData={audioData}
      />

      {/* Status Text */}
      <OrbStatusText orbState={orbState} />

      {/* User Speech Bubble */}
      <SpeechBubble
        role="user"
        text={userTranscript}
        visible={showUserBubble && !!userTranscript}
        typing={orbState === 'listening'}
      />

      {/* Assistant Speech Bubble */}
      <SpeechBubble
        role="assistant"
        text={assistantResponse}
        visible={showAssistantBubble && !!assistantResponse}
        typing={orbState === 'speaking'}
      >
        <ReplayButton
          visible={showReplay}
          onClick={onReplay}
        />
      </SpeechBubble>

      {/* Error Toast */}
      <ErrorToast
        message={error}
        onDismiss={onErrorDismiss}
      />

      {/* Screen reader status region */}
      <div className="sr-only" aria-live="polite" id="orb-sr-status">
        {orbState === 'idle' && 'Athena voice assistant ready. Press Ctrl Shift V or click to activate.'}
        {orbState === 'connecting' && 'Connecting to voice service.'}
        {orbState === 'listening' && 'Athena is listening. Speak now.'}
        {orbState === 'thinking' && 'Athena is processing your request.'}
        {orbState === 'speaking' && 'Athena is responding.'}
        {orbState === 'complete' && 'Athena has finished responding. Press Space to ask another question.'}
        {orbState === 'error' && 'Voice connection error. Click to retry.'}
      </div>
    </div>
  );
}
