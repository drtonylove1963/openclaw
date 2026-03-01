export interface ConsolidationStatusProps {
  active: boolean;
  className?: string;
}

/**
 * ConsolidationStatus - Active/idle status badge with flow animation
 *
 * Shows "Consolidation Active" with an animated flow indicator
 * or "Consolidation Idle" when inactive.
 */
export function ConsolidationStatus({ active, className = '' }: ConsolidationStatusProps) {
  return (
    <div
      className={`flex items-center justify-center gap-[10px] text-[13px] ${className}`}
      style={{
        padding: '15px',
        background: active
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(107, 114, 128, 0.1)',
        border: active
          ? '1px solid rgba(16, 185, 129, 0.2)'
          : '1px solid rgba(107, 114, 128, 0.2)',
        borderRadius: '12px',
        color: active ? '#34d399' : '#6b7280',
      }}
      role="status"
      aria-live="polite"
    >
      <span>{active ? 'Consolidation Active' : 'Consolidation Idle'}</span>
      {active && (
        <div
          className="overflow-hidden"
          style={{
            width: '40px',
            height: '3px',
            background: 'rgba(16, 185, 129, 0.3)',
            borderRadius: '2px',
          }}
          aria-hidden="true"
        >
          <div
            className="animate-flow-move"
            style={{
              width: '20px',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent, #10b981, transparent)',
            }}
          />
        </div>
      )}
    </div>
  );
}
