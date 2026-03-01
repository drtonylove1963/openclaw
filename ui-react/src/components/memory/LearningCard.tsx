import { Check, X } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';

export type LearningStatus = 'pending' | 'approved' | 'rejected';

export interface Learning {
  id: string;
  content: string;
  source: string;
  confidence: number;
  decay: number; // 0-100, higher = more decay
  status: LearningStatus;
  timestamp: string;
}

export interface LearningCardProps {
  learning: Learning;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
}

/**
 * LearningCard - Displays a single learning item
 *
 * Shows learning content, source, confidence indicator, decay bar, status badge,
 * and approve/reject buttons for pending learnings.
 */
export function LearningCard({
  learning,
  onApprove,
  onReject,
  className = '',
}: LearningCardProps) {
  const isPending = learning.status === 'pending';
  const confidencePercent = Math.min(Math.max(learning.confidence, 0), 100);
  const decayPercent = Math.min(Math.max(learning.decay, 0), 100);

  // Format timestamp
  const formattedTime = new Date(learning.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Confidence color
  const confidenceColor =
    confidencePercent >= 70
      ? '#10b981' // green
      : confidencePercent >= 40
      ? '#f59e0b' // yellow
      : '#ef4444'; // red

  // Status color
  const statusColors: Record<LearningStatus, { bg: string; text: string; border: string }> = {
    pending: {
      bg: 'rgba(251, 191, 36, 0.15)',
      text: '#fbbf24',
      border: 'rgba(251, 191, 36, 0.3)',
    },
    approved: {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#10b981',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    rejected: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#ef4444',
      border: 'rgba(239, 68, 68, 0.3)',
    },
  };

  const statusStyle = statusColors[learning.status];

  return (
    <GlassCard variant="bordered" className={className} style={{ padding: '16px' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Content */}
        <div className="flex-1">
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#f0f0f5',
              marginBottom: '8px',
            }}
          >
            {learning.content}
          </p>

          {/* Source */}
          <p
            style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '12px',
            }}
          >
            Source: {learning.source}
          </p>
        </div>

        {/* Status Badge */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: statusStyle.bg,
            border: `1px solid ${statusStyle.border}`,
            color: statusStyle.text,
            whiteSpace: 'nowrap',
          }}
        >
          {learning.status}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="flex items-center gap-4 mb-3">
        {/* Confidence Indicator */}
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: confidenceColor,
              boxShadow: `0 0 8px ${confidenceColor}60`,
            }}
          />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {confidencePercent}% confidence
          </span>
        </div>

        {/* Decay Bar */}
        <div className="flex-1 flex items-center gap-2">
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Decay:</span>
          <div
            style={{
              flex: 1,
              height: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${decayPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b60 0%, #ef444460 100%)',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{decayPercent}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '12px', color: '#6b7280' }}>{formattedTime}</span>

        {/* Approve/Reject Buttons (only for pending) */}
        {isPending && (onApprove || onReject) && (
          <div className="flex gap-2">
            {onApprove && (
              <button
                onClick={() => onApprove(learning.id)}
                className="flex items-center gap-1.5 text-[12px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(16, 185, 129, 0.25)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(16, 185, 129, 0.15)';
                }}
              >
                <Check size={14} />
                Approve
              </button>
            )}

            {onReject && (
              <button
                onClick={() => onReject(learning.id)}
                className="flex items-center gap-1.5 text-[12px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(239, 68, 68, 0.15)';
                }}
              >
                <X size={14} />
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
