/**
 * DndContext - Touch-friendly drag-and-drop provider using @dnd-kit
 *
 * Features:
 * - Touch sensor with 150ms delay (long-press to drag)
 * - Mouse sensor with 10px activation distance
 * - Keyboard sensor for accessibility
 * - Drag overlay for visual feedback
 * - Error boundary to prevent crashes
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, Component, ErrorInfo } from 'react';
import {
  DndContext as DndKitContext,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from '@dnd-kit/core';
import { triggerHaptics, HAPTIC_PATTERNS } from '../hooks/useTouchDevice';

// Types for drag data
export interface NodeDragData {
  type: 'node';
  nodeType: string;
  label: string;
  data?: Record<string, unknown>;
}

export interface CardDragData {
  type: 'card';
  cardId: string;
  sourceColumn: string;
}

export type DragData = NodeDragData | CardDragData;

// Context for accessing drag state
interface DndContextValue {
  activeId: string | null;
  activeData: DragData | null;
  isDragging: boolean;
}

const DndStateContext = createContext<DndContextValue>({
  activeId: null,
  activeData: null,
  isDragging: false,
});

export function useDndState() {
  return useContext(DndStateContext);
}

// Error Boundary for DnD - prevents drag errors from crashing the app
interface DndErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DndErrorBoundary extends Component<{ children: ReactNode }, DndErrorBoundaryState> {
  state: DndErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): DndErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('DnD Error:', error, info);
    // Trigger error haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(HAPTIC_PATTERNS.error);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '16px',
            margin: '8px',
            backgroundColor: '#1a1a2e',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 600 }}>
            Drag-and-drop error
          </div>
          <div style={{ color: '#a1a1aa', marginBottom: '12px' }}>
            {this.state.error?.message || 'An error occurred during drag operation'}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              color: '#e4e4e7',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Props for DndProvider
interface DndProviderProps {
  children: ReactNode;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  collisionDetection?: CollisionDetection;
}

export function DndProvider({
  children,
  onDragEnd,
  onDragOver,
  collisionDetection,
}: DndProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<DragData | null>(null);

  // Touch sensor: 150ms delay for long-press activation (reduced from 250ms for better UX)
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 8,
    },
  });

  // Mouse sensor: 10px distance before drag starts
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  // Keyboard sensor for accessibility
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(touchSensor, mouseSensor, keyboardSensor);

  // Safe haptic trigger that checks for support
  const safeHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore haptic errors
      }
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveData(active.data.current as DragData);
    safeHaptic(HAPTIC_PATTERNS.dragStart);
  }, [safeHaptic]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;

    if (over) {
      safeHaptic(HAPTIC_PATTERNS.drop);
    }

    setActiveId(null);
    setActiveData(null);
    onDragEnd?.(event);
  }, [onDragEnd, safeHaptic]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    onDragOver?.(event);
  }, [onDragOver]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveData(null);
    safeHaptic(HAPTIC_PATTERNS.error);
  }, [safeHaptic]);

  // Optimized collision detection based on drag type
  const defaultCollision: CollisionDetection = useCallback((args) => {
    const activeData = args.active.data.current as DragData | undefined;

    // Canvas drops (nodes): prefer pointer detection
    if (activeData?.type === 'node') {
      return pointerWithin(args);
    }

    // List sorting (cards): prefer closest center
    if (activeData?.type === 'card') {
      const centerCollisions = closestCenter(args);
      if (centerCollisions.length > 0) {return centerCollisions;}
      return rectIntersection(args);
    }

    // Default: try all methods
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {return pointerCollisions;}

    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {return rectCollisions;}

    return closestCenter(args);
  }, []);

  const contextValue: DndContextValue = {
    activeId,
    activeData,
    isDragging: activeId !== null,
  };

  return (
    <DndErrorBoundary>
      <DndStateContext.Provider value={contextValue}>
        <DndKitContext
          sensors={sensors}
          collisionDetection={collisionDetection || defaultCollision}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragCancel={handleDragCancel}
        >
          {children}
        </DndKitContext>
      </DndStateContext.Provider>
    </DndErrorBoundary>
  );
}

// Re-export useful types and utilities from @dnd-kit
export { DragOverlay } from '@dnd-kit/core';
export type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
