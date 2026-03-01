export interface ArcGaugeProps {
  /** Current value (0-100) */
  value: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Label text displayed below the value */
  label: string;
  /** Gradient colors as [start, end] */
  gradient?: [string, string];
  /** Size of the SVG viewport in px */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * ArcGauge - Circular SVG arc gauge for system vitals
 *
 * Renders a circular progress arc with a gradient stroke,
 * centered value text, and a label underneath.
 * Matches the Home page mockup vitals (CPU, Tokens, Uptime).
 */
export function ArcGauge({
  value,
  max = 100,
  label,
  gradient = ['#00d4ff', '#8b5cf6'],
  size = 100,
  strokeWidth = 8,
  className = '',
}: ArcGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const dashOffset = circumference * (1 - percent);
  const center = size / 2;

  // Unique gradient ID to avoid SVG conflicts when multiple gauges exist
  const gradientId = `arc-gauge-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      {/* Center label overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="font-bold"
          style={{ fontSize: `${size * 0.18}px`, color: '#f0f0f5' }}
          role="meter"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label}: ${Math.round(percent * 100)}%`}
        >
          {Math.round(percent * 100)}%
        </span>
        <span
          style={{
            fontSize: `${size * 0.11}px`,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
