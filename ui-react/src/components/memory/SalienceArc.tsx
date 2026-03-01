import { useId } from 'react';

export interface SalienceArcProps {
  /** Salience value 0-1 */
  value: number;
  /** Start gradient color */
  colorStart?: string;
  /** End gradient color */
  colorEnd?: string;
}

/**
 * SalienceArc - Small SVG arc gauge for episode salience display
 *
 * 32x16px arc that fills based on salience score (0-1).
 */
export function SalienceArc({
  value,
  colorStart = '#00d4ff',
  colorEnd = '#8b5cf6',
}: SalienceArcProps) {
  const totalLength = 40;
  // Higher salience = less dashoffset
  const offset = totalLength * (1 - Math.min(Math.max(value, 0), 1));
  const gradientId = useId();

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px]" style={{ color: '#6b7280' }}>
        Salience
      </span>
      <div className="w-8 h-4 relative">
        <svg
          width="32"
          height="16"
          style={{ transform: 'rotate(180deg)' }}
          role="meter"
          aria-valuenow={Math.round(value * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Salience: ${Math.round(value * 100)}%`}
        >
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="0%" stopColor={colorStart} />
              <stop offset="100%" stopColor={colorEnd} />
            </linearGradient>
          </defs>
          {/* Background track */}
          <path
            d="M2,14 Q16,2 30,14"
            fill="none"
            stroke={`${colorStart}33`}
            strokeWidth="3"
          />
          {/* Value arc */}
          <path
            d="M2,14 Q16,2 30,14"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3"
            strokeDasharray={totalLength}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
    </div>
  );
}
