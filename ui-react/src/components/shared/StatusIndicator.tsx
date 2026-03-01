export interface StatusIndicatorProps {
  /** Status state */
  status?: 'active' | 'idle' | 'offline';
  /** Status text displayed next to the dot */
  text?: string;
  /** Additional CSS class */
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  idle: '#f59e0b',
  offline: '#6b7280',
};

/**
 * StatusIndicator - Pulsing dot with status text
 *
 * Shows a colored dot with optional pulse animation
 * and an accompanying text label.
 */
export function StatusIndicator({
  status = 'active',
  text = 'neural network active',
  className = '',
}: StatusIndicatorProps) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.active;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block rounded-full animate-pulse-dot"
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
      <span style={{ fontSize: '14px', color: '#6b7280' }}>
        {text}
      </span>
    </div>
  );
}
