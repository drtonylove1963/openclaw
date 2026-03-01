import { useId } from 'react';

export interface ConfidenceGaugeProps {
  /** Confidence value 0-1 */
  value: number;
  className?: string;
}

/**
 * ConfidenceGauge - Small circular progress ring with value text
 *
 * 36x36 SVG with r=14, stroke-width=4. Shows confidence as
 * a purple gradient ring with the value in the center.
 */
export function ConfidenceGauge({ value, className = '' }: ConfidenceGaugeProps) {
  const circumference = 2 * Math.PI * 14; // ~87.96
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 1));
  const gradientId = useId();

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: '36px', height: '36px' }}
      role="meter"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence: ${Math.round(value * 100)}%`}
    >
      <svg
        width="36"
        height="36"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="18"
          cy="18"
          r="14"
          stroke="rgba(139, 92, 246, 0.2)"
          strokeWidth="4"
          fill="none"
        />
        {/* Progress */}
        <circle
          cx="18"
          cy="18"
          r="14"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* Center value */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold"
        style={{ color: '#c084fc' }}
      >
        .{Math.round(value * 100)}
      </span>
    </div>
  );
}
