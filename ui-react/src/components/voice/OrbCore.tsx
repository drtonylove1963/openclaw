import type { OrbState } from '../../stores/voiceStore';

export interface OrbCoreProps {
  /** Current voice state */
  orbState: OrbState;
  /** CSS class */
  className?: string;
}

const GRADIENTS: Record<OrbState, string> = {
  idle: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(0,240,255,0.6) 40%, rgba(0,100,150,0.2))',
  connecting: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(245,158,11,0.5) 40%, rgba(150,80,0,0.2))',
  listening: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(0,240,255,0.6) 40%, rgba(0,100,150,0.2))',
  thinking: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(123,97,255,0.6) 40%, rgba(80,40,150,0.2))',
  speaking: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(245,158,11,0.6) 30%, rgba(0,240,255,0.4) 60%)',
  complete: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(0,240,255,0.6) 40%, rgba(0,100,150,0.2))',
  error: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(239,68,68,0.6) 40%, rgba(150,20,20,0.2))',
};

const SHADOWS: Record<OrbState, string> = {
  idle: '0 0 60px rgba(0,240,255,0.5), 0 0 100px rgba(0,240,255,0.3), inset 0 0 40px rgba(255,255,255,0.2)',
  connecting: '0 0 50px rgba(245,158,11,0.4), 0 0 90px rgba(245,158,11,0.2)',
  listening: '0 0 80px rgba(0,240,255,0.7), 0 0 120px rgba(0,240,255,0.4)',
  thinking: '0 0 60px rgba(123,97,255,0.6), 0 0 100px rgba(123,97,255,0.4)',
  speaking: '0 0 70px rgba(245,158,11,0.5), 0 0 110px rgba(0,240,255,0.3)',
  complete: '0 0 60px rgba(0,240,255,0.5), 0 0 100px rgba(0,240,255,0.3), inset 0 0 40px rgba(255,255,255,0.2)',
  error: '0 0 60px rgba(239,68,68,0.5), 0 0 100px rgba(239,68,68,0.3)',
};

/**
 * OrbCore - The inner 180px gradient circle of the Athena Orb.
 *
 * Changes gradient and glow based on voice state:
 * - idle/complete: cyan radial gradient, breathing animation
 * - listening: intensified cyan glow, scale 1.1
 * - thinking: violet radial gradient, violet glow
 * - speaking: amber/cyan blend gradient
 *
 * Transitions smooth via CSS transition on background/box-shadow/transform.
 */
export function OrbCore({ orbState, className = '' }: OrbCoreProps) {
  const scale = orbState === 'listening' ? 'scale(1.1)' : 'scale(1)';

  return (
    <div
      className={`absolute rounded-full z-[3] ${className}`}
      style={{
        width: '180px',
        height: '180px',
        background: GRADIENTS[orbState],
        boxShadow: SHADOWS[orbState],
        transform: scale,
        animation: 'orb-breathe 4s ease-in-out infinite',
        transition: 'background 500ms ease-in-out, box-shadow 500ms ease-in-out, transform 300ms ease-in-out',
      }}
    />
  );
}
