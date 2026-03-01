/**
 * DroppableColumn - Droppable column for Kanban board
 *
 * Uses @dnd-kit's useDroppable to create drop zones for cards.
 * Provides visual feedback when cards are dragged over.
 */

import React, { CSSProperties, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface DroppableColumnProps {
  id: string;
  items: string[]; // Card IDs for sortable context
  children: ReactNode;
  style?: CSSProperties;
}

export function DroppableColumn({
  id,
  items,
  children,
  style,
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      columnId: id,
    },
  });

  const columnStyle: CSSProperties = {
    ...style,
    // Visual feedback when dragging over
    backgroundColor: isOver ? 'rgba(34, 197, 94, 0.1)' : style?.backgroundColor,
    outline: isOver ? '2px dashed #22c55e' : undefined,
    outlineOffset: '-2px',
    transition: 'background-color 0.2s, outline 0.2s',
  };

  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} style={columnStyle}>
        {children}
      </div>
    </SortableContext>
  );
}
