/**
 * useTouchDevice - Detect touch capability and iPad-specific features
 *
 * Used to conditionally enable touch-optimized interactions.
 */

import { useState, useEffect } from 'react';

export interface TouchDeviceInfo {
  isTouchDevice: boolean;
  isIPad: boolean;
  isIOS: boolean;
  supportsHaptics: boolean;
}

export function useTouchDevice(): TouchDeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<TouchDeviceInfo>(() => detectTouchDevice());

  useEffect(() => {
    // Re-detect on mount (SSR safety)
    setDeviceInfo(detectTouchDevice());
  }, []);

  return deviceInfo;
}

function detectTouchDevice(): TouchDeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isTouchDevice: false,
      isIPad: false,
      isIOS: false,
      supportsHaptics: false,
    };
  }

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // iPad detection (including iPadOS 13+ which reports as Macintosh)
  const isIPad = /iPad/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && isTouchDevice);

  // iOS detection
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || isIPad;

  // Haptics support
  const supportsHaptics = 'vibrate' in navigator;

  return {
    isTouchDevice,
    isIPad,
    isIOS,
    supportsHaptics,
  };
}

/**
 * Trigger haptic feedback
 */
export function triggerHaptics(pattern: number | number[] = 10): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export const HAPTIC_PATTERNS = {
  dragStart: 10,
  drop: [10, 50, 10] as number[],
  error: 100,
  success: [10, 30] as number[],
};
