import { useEffect, useRef, useCallback } from 'react';
import { useVoiceStore, type OrbState } from '../stores/voiceStore';

/**
 * Valid state transitions per VOICE-INTERACTION-SPEC.md Section 2.3
 */
const VALID_TRANSITIONS: Record<OrbState, OrbState[]> = {
  idle: ['connecting', 'listening'],
  connecting: ['listening', 'error', 'idle'],
  listening: ['thinking', 'idle'],
  thinking: ['speaking', 'idle', 'error'],
  speaking: ['complete', 'listening'],
  complete: ['idle', 'listening'],
  error: ['idle', 'connecting'],
};

interface UseOrbStateOptions {
  /** Auto-return from COMPLETE to IDLE after this delay (default 3000ms) */
  completeAutoReturnMs?: number;
  /** Auto-return from ERROR to IDLE (not currently exposed) */
  errorAutoReturnMs?: number;
}

interface UseOrbStateReturn {
  /** Current orb state */
  orbState: OrbState;
  /** Transition to a new state (validates transition) */
  transition: (to: OrbState) => boolean;
  /** Force set state (bypasses validation, use sparingly) */
  forceState: (state: OrbState) => void;
  /** Whether a given transition is valid from current state */
  canTransition: (to: OrbState) => boolean;
}

/**
 * useOrbState - State machine hook for Athena Orb voice states.
 *
 * Manages valid transitions between:
 *   idle -> listening -> thinking -> speaking -> complete -> idle
 *
 * Features:
 * - Validates transitions against the state machine
 * - Auto-returns from COMPLETE to IDLE after 3s
 * - Integrates with voiceStore for global state
 *
 * Usage:
 *   const { orbState, transition, canTransition } = useOrbState();
 *   transition('listening'); // Returns true if valid
 */
export function useOrbState(options: UseOrbStateOptions = {}): UseOrbStateReturn {
  const { completeAutoReturnMs = 3000 } = options;

  const orbState = useVoiceStore(s => s.orbState);
  const setOrbState = useVoiceStore(s => s.setOrbState);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const canTransition = useCallback((to: OrbState): boolean => {
    return VALID_TRANSITIONS[orbState]?.includes(to) ?? false;
  }, [orbState]);

  const transition = useCallback((to: OrbState): boolean => {
    if (!canTransition(to)) {
      return false;
    }
    setOrbState(to);
    return true;
  }, [canTransition, setOrbState]);

  const forceState = useCallback((state: OrbState) => {
    setOrbState(state);
  }, [setOrbState]);

  // Auto-return from COMPLETE to IDLE
  useEffect(() => {
    if (orbState === 'complete') {
      timerRef.current = setTimeout(() => {
        setOrbState('idle');
      }, completeAutoReturnMs);
      return () => clearTimeout(timerRef.current);
    }
  }, [orbState, completeAutoReturnMs, setOrbState]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return {
    orbState,
    transition,
    forceState,
    canTransition,
  };
}

export default useOrbState;
