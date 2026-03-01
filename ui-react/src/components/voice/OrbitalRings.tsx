import { useMemo } from 'react';
import type { OrbState } from '../../stores/voiceStore';

export interface OrbitalRingsProps {
  /** Current orb state drives rotation speed */
  orbState: OrbState;
  /** CSS class for the container */
  className?: string;
}

const RING_CONFIGS = [
  { size: 200, normalDuration: 20, dotCount: 3 },
  { size: 230, normalDuration: 15, dotCount: 4, reverse: true },
  { size: 260, normalDuration: 25, dotCount: 5 },
  { size: 280, normalDuration: 18, dotCount: 6, reverse: true },
];

const DOT_COLORS = ['#00f0ff', '#7b61ff', '#ff6b9d', '#10b981'];

function getRotationDuration(orbState: OrbState, normalDuration: number): number {
  switch (orbState) {
    case 'listening':
      return 8;
    case 'thinking':
      return 5;
    default:
      return normalDuration;
  }
}

/**
 * OrbitalRings - 4 concentric orbital rings with colored dots rotating around the orb.
 *
 * Ring speeds change based on voice state:
 * - idle: normal speed (15-25s)
 * - listening: accelerated (8s)
 * - thinking: fast (5s)
 * - speaking/complete: normal
 *
 * Each ring has a different number of orbital dots cycling through 4 accent colors.
 */
export function OrbitalRings({ orbState, className = '' }: OrbitalRingsProps) {
  const rings = useMemo(() => RING_CONFIGS.map((ring, ringIndex) => {
    const dots = Array.from({ length: ring.dotCount }).map((_, i) => {
      const angle = (i / ring.dotCount) * 360;
      const radius = ring.size / 2;
      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const y = Math.sin((angle * Math.PI) / 180) * radius;
      const color = DOT_COLORS[i % DOT_COLORS.length];
      return { x, y, color, key: `${ringIndex}-${i}` };
    });
    return { ...ring, dots, ringIndex };
  }), []);

  return (
    <>
      {rings.map(ring => {
        const duration = getRotationDuration(orbState, ring.normalDuration);
        return (
          <div
            key={ring.ringIndex}
            className={`absolute rounded-full ${className}`}
            style={{
              width: `${ring.size}px`,
              height: `${ring.size}px`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: `spin ${duration}s linear infinite${ring.reverse ? ' reverse' : ''}`,
              transition: 'animation-duration 1s ease',
            }}
            aria-hidden="true"
          >
            {ring.dots.map(dot => (
              <div
                key={dot.key}
                style={{
                  position: 'absolute',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: dot.color,
                  boxShadow: `0 0 10px ${dot.color}`,
                  left: `calc(50% + ${dot.x}px - 4px)`,
                  top: `calc(50% + ${dot.y}px - 4px)`,
                }}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
