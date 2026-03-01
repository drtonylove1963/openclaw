/**
 * useResizable hook
 * Provides drag-to-resize functionality for panels
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseResizableOptions {
  /** Initial width in pixels */
  initialWidth: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Direction of the resize handle */
  direction?: 'left' | 'right';
  /** LocalStorage key for persistence (optional) */
  storageKey?: string;
  /** Callback when resize starts */
  onResizeStart?: () => void;
  /** Callback during resize with current width */
  onResize?: (width: number) => void;
  /** Callback when resize ends */
  onResizeEnd?: (width: number) => void;
}

export interface UseResizableResult {
  /** Current width */
  width: number;
  /** Whether currently resizing */
  isResizing: boolean;
  /** Props to spread on the resize handle element */
  handleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  /** Reset to initial width */
  reset: () => void;
  /** Set width programmatically */
  setWidth: (width: number) => void;
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

export function useResizable(options: UseResizableOptions): UseResizableResult {
  const {
    initialWidth,
    minWidth = 100,
    maxWidth = 800,
    direction = 'right',
    storageKey,
    onResizeStart,
    onResize,
    onResizeEnd,
  } = options;

  // Load initial width from localStorage if available
  const getStoredWidth = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = safeLocalStorageGet(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    }
    return initialWidth;
  }, [storageKey, initialWidth, minWidth, maxWidth]);

  const [width, setWidthState] = useState(getStoredWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const currentWidthRef = useRef(width); // Track current width for closure-safe access

  // Keep ref in sync with state
  useEffect(() => {
    currentWidthRef.current = width;
  }, [width]);

  // Clamp width to min/max
  const clampWidth = useCallback(
    (w: number) => Math.min(maxWidth, Math.max(minWidth, w)),
    [minWidth, maxWidth]
  );

  // Update width and save to localStorage
  const setWidth = useCallback(
    (newWidth: number) => {
      const clamped = clampWidth(newWidth);
      setWidthState(clamped);
      if (storageKey) {
        safeLocalStorageSet(storageKey, String(clamped));
      }
    },
    [clampWidth, storageKey]
  );

  // Reset to initial width
  const reset = useCallback(() => {
    setWidth(initialWidth);
  }, [initialWidth, setWidth]);

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number) => {
      const delta = direction === 'right'
        ? clientX - startXRef.current
        : startXRef.current - clientX;
      const newWidth = clampWidth(startWidthRef.current + delta);
      setWidthState(newWidth);
      onResize?.(newWidth);
    },
    [direction, clampWidth, onResize]
  );

  // Handle mouse/touch end - uses ref to avoid stale closure
  const handleEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Use ref for current width to avoid stale closure
    const finalWidth = currentWidthRef.current;

    if (storageKey) {
      safeLocalStorageSet(storageKey, String(finalWidth));
    }
    onResizeEnd?.(finalWidth);
  }, [storageKey, onResizeEnd]);

  // Mouse event handlers
  useEffect(() => {
    if (!isResizing) {return;}

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
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
        handleMove(e.touches[0].clientX);
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
    (clientX: number) => {
      setIsResizing(true);
      startXRef.current = clientX;
      startWidthRef.current = currentWidthRef.current;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      onResizeStart?.();
    },
    [onResizeStart]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startResize(e.clientX);
    },
    [startResize]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        startResize(e.touches[0].clientX);
      }
    },
    [startResize]
  );

  const handleProps = {
    onMouseDown,
    onTouchStart,
    style: {
      cursor: 'col-resize',
    } as React.CSSProperties,
  };

  return {
    width,
    isResizing,
    handleProps,
    reset,
    setWidth,
  };
}

export default useResizable;
