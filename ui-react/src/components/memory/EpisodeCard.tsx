import { SalienceArc } from './SalienceArc';

export interface EpisodeCardProps {
  /** Agent name (e.g., "Perception Layer") */
  agent: string;
  /** Emoji icon for the agent orb */
  icon: string;
  /** Event type badge text */
  eventType: string;
  /** Episode description */
  content: string;
  /** Time label (e.g., "2 hours ago") */
  time: string;
  /** Salience score 0-1 */
  salience: number;
  /** Accent color hex (e.g., "#00d4ff") */
  accentColor: string;
  /** Stagger animation delay in seconds */
  animationDelay?: number;
  className?: string;
}

/**
 * EpisodeCard - Timeline episode card with agent orb, event badge, and salience arc
 *
 * Features:
 * - Left accent border matching agent color
 * - Agent orb with glow
 * - Event type badge (uppercase)
 * - Hover: translateX + shadow
 * - Staggered appear animation
 */
export function EpisodeCard({
  agent,
  icon,
  eventType,
  content,
  time,
  salience,
  accentColor,
  animationDelay = 0,
  className = '',
}: EpisodeCardProps) {
  const glowColor = `${accentColor}4D`; // ~30% opacity

  return (
    <div
      className={`relative cursor-pointer animate-episode-appear transition-all duration-300 ${className}`}
      style={{
        margin: '20px 0',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '16px',
        animationDelay: `${animationDelay}s`,
        ['--accent-color' as string]: accentColor,
        ['--accent-glow' as string]: glowColor,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(255, 255, 255, 0.05)';
        el.style.transform = 'translateX(5px)';
        el.style.boxShadow = `-5px 0 30px rgba(0, 0, 0, 0.3), 0 0 30px ${glowColor}`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(255, 255, 255, 0.03)';
        el.style.transform = 'translateX(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Header: agent orb + meta */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center justify-center text-[16px] rounded-full shrink-0"
          style={{
            width: '36px',
            height: '36px',
            background: accentColor,
            boxShadow: `0 0 20px ${glowColor}`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold" style={{ color: '#f0f0f5' }}>
            {agent}
          </div>
          <span
            className="inline-block text-[10px] font-semibold uppercase mt-1"
            style={{
              padding: '3px 10px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              letterSpacing: '0.5px',
              color: accentColor,
            }}
          >
            {eventType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="text-[14px] mb-3"
        style={{ color: '#f0f0f5', lineHeight: 1.6 }}
      >
        {content}
      </div>

      {/* Footer: time + salience */}
      <div className="flex justify-between items-center">
        <span className="text-[11px]" style={{ color: '#6b7280' }}>
          {time}
        </span>
        <SalienceArc value={salience} colorStart={accentColor} />
      </div>
    </div>
  );
}
