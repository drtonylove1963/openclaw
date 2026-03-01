import { useEffect, useRef } from 'react';

export interface NeuralSparksProps {
  /** Whether sparks are visible and animating */
  active: boolean;
  /** Number of spark particles (default 20) */
  sparkCount?: number;
  /** CSS class for the container */
  className?: string;
}

/**
 * NeuralSparks - Floating animated spark particles for THINKING state.
 *
 * 20 small particles (3px diameter, #7b61ff with 8px glow) positioned randomly
 * within a 50-150px radius from center. Positions re-randomize every 150ms.
 * Opacity varies 0.2-1.0 randomly per particle.
 *
 * Uses requestAnimationFrame for smooth animation.
 */
export function NeuralSparks({
  active,
  sparkCount = 20,
  className = '',
}: NeuralSparksProps) {
  const sparksRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = (timestamp: number) => {
      // Update positions every ~150ms
      if (timestamp - lastUpdateRef.current > 150) {
        lastUpdateRef.current = timestamp;
        sparksRef.current.forEach(spark => {
          if (!spark) {return;}
          const angle = Math.random() * 360;
          const distance = Math.random() * 100 + 50;
          const x = Math.cos((angle * Math.PI) / 180) * distance;
          const y = Math.sin((angle * Math.PI) / 180) * distance;
          spark.style.left = `calc(50% + ${x}px)`;
          spark.style.top = `calc(50% + ${y}px)`;
          spark.style.opacity = String(Math.random() * 0.8 + 0.2);
        });
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'} ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: sparkCount }).map((_, i) => (
        <div
          key={i}
          ref={el => { sparksRef.current[i] = el; }}
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            background: '#7b61ff',
            borderRadius: '50%',
            boxShadow: '0 0 8px #7b61ff',
            transition: 'left 0.15s ease, top 0.15s ease, opacity 0.15s ease',
          }}
        />
      ))}
    </div>
  );
}
