import { useState } from 'react';
import { type SprintColumn as ColumnType, type Story } from '../../stores/sprintStore';
import { SprintCard } from './SprintCard';

interface SprintColumnProps {
  column: ColumnType;
  title: string;
  stories: Story[];
  onDrop: (column: ColumnType) => void;
  onDragStart: (story: Story) => void;
  onDragEnd: () => void;
}

const columnConfig: Record<
  ColumnType,
  { color: string; bg: string; borderColor: string }
> = {
  backlog: {
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.08)',
    borderColor: '#6b7280',
  },
  ready: {
    color: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.08)',
    borderColor: '#00d4ff',
  },
  in_progress: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    borderColor: '#f59e0b',
  },
  review: {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    borderColor: '#8b5cf6',
  },
  qa: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
  },
  done: {
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.08)',
    borderColor: '#34d399',
  },
};

/**
 * SprintColumn - Kanban column for sprint board
 *
 * Displays column header with count badge and list of story cards.
 * Handles drag-and-drop events for moving stories.
 */
export function SprintColumn({
  column,
  title,
  stories,
  onDrop,
  onDragStart,
  onDragEnd,
}: SprintColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = columnConfig[column];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(column);
  };

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{
        width: '300px',
        maxHeight: '100%',
      }}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between gap-2 mb-4"
        style={{
          padding: '12px 16px',
          borderRadius: '12px 12px 0 0',
          background: config.bg,
          borderTop: `3px solid ${config.borderColor}`,
          borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <h3
          className="m-0 text-[14px] font-semibold"
          style={{ color: config.color }}
        >
          {title}
        </h3>
        <span
          className="flex items-center justify-center text-[11px] font-bold"
          style={{
            minWidth: '22px',
            height: '22px',
            padding: '0 6px',
            borderRadius: '11px',
            background: `${config.color}20`,
            color: config.color,
            border: `1px solid ${config.color}40`,
          }}
        >
          {stories.length}
        </span>
      </div>

      {/* Column Body (Drop Zone) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 flex flex-col gap-3 overflow-auto ni-scrollbar transition-all duration-200"
        style={{
          padding: '16px',
          borderRadius: '0 0 12px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isDragOver
            ? `2px dashed ${config.borderColor}`
            : '1px solid rgba(255, 255, 255, 0.06)',
          minHeight: '200px',
        }}
      >
        {stories.length === 0 ? (
          <div
            className="flex items-center justify-center flex-1 text-[13px]"
            style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}
          >
            Drop stories here
          </div>
        ) : (
          stories.map((story) => (
            <SprintCard
              key={story.id}
              story={story}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}
