/**
 * SortableCard - Touch-friendly sortable card for Kanban board
 *
 * Uses @dnd-kit's useSortable for drag-and-drop with touch support.
 * Long-press (250ms) triggers drag on touch devices.
 */

import React, { CSSProperties, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCardProps {
  id: string;
  children: ReactNode;
  style?: CSSProperties;
  disabled?: boolean;
}

export function SortableCard({
  id,
  children,
  style,
  disabled = false,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    // Minimum touch target
    minHeight: '44px',
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...sortableStyle, ...style }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

/**
 * CardDragOverlay - Visual feedback during card drag
 */
interface CardDragOverlayProps {
  children: ReactNode;
}

export function CardDragOverlay({ children }: CardDragOverlayProps) {
  return (
    <div
      style={{
        transform: 'scale(1.02)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        cursor: 'grabbing',
      }}
    >
      {children}
    </div>
  );
}
