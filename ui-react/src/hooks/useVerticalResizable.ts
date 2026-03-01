/**
 * useVerticalResizable hook
 * Provides drag-to-resize functionality for vertical panels (height)
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseVerticalResizableOptions {
  /** Initial height in pixels */
  initialHeight: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Direction of the resize handle (top = dragging up increases height) */
  direction?: 'top' | 'bottom';
  /** LocalStorage key for persistence (optional) */
  storageKey?: string;
  /** Callback when resize starts */
  onResizeStart?: () => void;
  /** Callback during resize with current height */
  onResize?: (height: number) => void;
  /** Callback when resize ends */
  onResizeEnd?: (height: number) => void;
}

export interface UseVerticalResizableResult {
  /** Current height */
  height: number;
  /** Whether currently resizing */
  isResizing: boolean;
  /** Props to spread on the resize handle element */
  handleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  /** Reset to initial height */
  reset: () => void;
  /** Set height programmatically */
  setHeight: (height: number) => void;
}

// Safe localStorage helper (handles private mode and quota errors)
function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

export function useVerticalResizable(options: UseVerticalResizableOptions): UseVerticalResizableResult {
  const {
    initialHeight,
    minHeight = 80,
    maxHeight = 500,
    direction = 'top',
    storageKey,
    onResizeStart,
    onResize,
    onResizeEnd,
  } = options;

  // Load initial height from localStorage if available
  const getStoredHeight = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = safeLocalStorageGet(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= minHeight && parsed <= maxHeight) {
          return parsed;
        }
      }
    }
    return initialHeight;
  }, [storageKey, initialHeight, minHeight, maxHeight]);

  const [height, setHeightState] = useState(getStoredHeight);
  const [isResizing, setIsResizing] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const currentHeightRef = useRef(height); // Track current height for closure-safe access

  // Keep ref in sync with state
  useEffect(() => {
    currentHeightRef.current = height;
  }, [height]);

  // Clamp height to min/max
  const clampHeight = useCallback(
    (h: number) => Math.min(maxHeight, Math.max(minHeight, h)),
    [minHeight, maxHeight]
  );

  // Update height and save to localStorage
  const setHeight = useCallback(
    (newHeight: number) => {
      const clamped = clampHeight(newHeight);
      setHeightState(clamped);
      if (storageKey) {
        safeLocalStorageSet(storageKey, String(clamped));
      }
    },
    [clampHeight, storageKey]
  );

  // Reset to initial height
  const reset = useCallback(() => {
    setHeight(initialHeight);
  }, [initialHeight, setHeight]);

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientY: number) => {
      // For direction 'top', dragging up (negative delta) increases height
      // For direction 'bottom', dragging down (positive delta) increases height
      const delta = direction === 'top'
        ? startYRef.current - clientY
        : clientY - startYRef.current;
      const newHeight = clampHeight(startHeightRef.current + delta);
      setHeightState(newHeight);
      onResize?.(newHeight);
    },
    [direction, clampHeight, onResize]
  );

  // Handle mouse/touch end - uses ref to avoid stale closure
  const handleEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Use ref for current height to avoid stale closure
    const finalHeight = currentHeightRef.current;

    if (storageKey) {
      safeLocalStorageSet(storageKey, String(finalHeight));
    }
    onResizeEnd?.(finalHeight);
  }, [storageKey, onResizeEnd]);

  // Mouse event handlers
  useEffect(() => {
    if (!isResizing) {return;}

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMove, handleEnd]);

  // Touch event handlers with AbortController for proper cleanup
  useEffect(() => {
    if (!isResizing) {return;}

    const controller = new AbortController();
    const { signal } = controller;

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent scrolling while resizing
      e.preventDefault();
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    // Use AbortController signal for clean event listener removal
    document.addEventListener('touchmove', handleTouchMove, { passive: false, signal });
    document.addEventListener('touchend', handleTouchEnd, { signal });
    document.addEventListener('touchcancel', handleTouchEnd, { signal });

    return () => {
      controller.abort();
    };
  }, [isResizing, handleMove, handleEnd]);

  // Start resize
  const startResize = useCallback(
    (clientY: number) => {
      setIsResizing(true);
      startYRef.current = clientY;
      startHeightRef.current = currentHeightRef.current;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      onResizeStart?.();
    },
    [onResizeStart]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startResize(e.clientY);
    },
    [startResize]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        startResize(e.touches[0].clientY);
      }
    },
    [startResize]
  );

  const handleProps = {
    onMouseDown,
    onTouchStart,
    style: {
      cursor: 'row-resize',
    } as React.CSSProperties,
  };

  return {
    height,
    isResizing,
    handleProps,
    reset,
    setHeight,
  };
}

export default useVerticalResizable;
