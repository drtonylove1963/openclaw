import { type Story, type StoryPriority } from '../../stores/sprintStore';
import { GlassCard } from '../shared';

interface SprintCardProps {
  story: Story;
  onDragStart: (story: Story) => void;
  onDragEnd: () => void;
}

const priorityConfig: Record<
  StoryPriority,
  { label: string; color: string; bg: string }
> = {
  critical: {
    label: 'Critical',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
  },
  high: {
    label: 'High',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  medium: {
    label: 'Medium',
    color: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.15)',
  },
  low: {
    label: 'Low',
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.15)',
  },
};

/**
 * SprintCard - Individual story card in sprint board
 *
 * Shows story title, priority, assignee, story points.
 * Draggable for moving between columns.
 */
export function SprintCard({ story, onDragStart, onDragEnd }: SprintCardProps) {
  const priorityStyle = priorityConfig[story.priority];

  return (
    <div
      draggable
      onDragStart={() => onDragStart(story)}
      onDragEnd={onDragEnd}
      className="cursor-move"
    >
      <GlassCard
        variant="bordered"
        className="flex flex-col gap-3"
        style={{ padding: '14px' }}
      >
        {/* Title */}
        <h4
          className="m-0 line-clamp-2"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#f0f0f5',
            lineHeight: 1.4,
          }}
        >
          {story.title}
        </h4>

        {/* Footer: Priority, Assignee, Points */}
        <div className="flex items-center justify-between gap-2">
          {/* Priority Badge */}
          <span
            className="text-[10px] font-medium flex-shrink-0"
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: priorityStyle.bg,
              color: priorityStyle.color,
              border: `1px solid ${priorityStyle.color}40`,
            }}
          >
            {priorityStyle.label}
          </span>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Assignee Avatar */}
            {story.assignee_name && (
              <div className="flex items-center gap-1.5">
                {story.assignee_avatar ? (
                  <img
                    src={story.assignee_avatar}
                    alt={story.assignee_name}
                    className="rounded-full"
                    style={{
                      width: '20px',
                      height: '20px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full text-[10px] font-medium"
                    style={{
                      width: '20px',
                      height: '20px',
                      background: 'rgba(0, 212, 255, 0.2)',
                      color: '#00d4ff',
                    }}
                  >
                    {story.assignee_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* Story Points */}
            {story.story_points !== undefined && (
              <span
                className="text-[11px] font-medium flex-shrink-0"
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#8b5cf6',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                {story.story_points}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
