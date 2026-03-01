export interface BrainStat {
  label: string;
  value: string;
}

export interface BrainOrbitVizProps {
  stats: BrainStat[];
  className?: string;
}

/**
 * BrainOrbitViz - Animated brain core with orbiting stat labels
 *
 * A pulsing radial-gradient brain core (100x100) with 4 stat
 * labels orbiting around it at 80px radius. Each stat staggers
 * by -5s offset for even distribution.
 */
export function BrainOrbitViz({ stats, className = '' }: BrainOrbitVizProps) {
  return (
    <div
      className={`relative w-full flex items-center justify-center mb-5 ${className}`}
      style={{ height: '180px' }}
      aria-label="Memory vitals visualization"
    >
      {/* Brain core */}
      <div
        className="absolute animate-brain-pulse"
        style={{
          width: '100px',
          height: '100px',
          background:
            'radial-gradient(circle, rgba(0, 212, 255, 0.3), rgba(139, 92, 246, 0.3))',
          borderRadius: '50%',
        }}
        aria-hidden="true"
      />

      {/* Orbiting stat rings */}
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="absolute flex flex-col items-center animate-orbit"
          style={{
            animationDelay: `${-i * 5}s`,
          }}
          role="meter"
          aria-label={`${stat.label}: ${stat.value}`}
        >
          <span
            className="text-[18px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {stat.value}
          </span>
          <span
            className="text-[10px] uppercase mt-0.5"
            style={{ color: '#6b7280', letterSpacing: '0.5px' }}
          >
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
