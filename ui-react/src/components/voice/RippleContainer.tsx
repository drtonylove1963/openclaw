export interface RippleContainerProps {
  /** Whether ripples are visible */
  active: boolean;
  /** Ripple border color (default cyan for listening, amber for speaking) */
  color?: string;
  /** CSS class for the container */
  className?: string;
}

/**
 * RippleContainer - 3 expanding ripple rings emanating from center.
 *
 * Used during listening (cyan) and speaking (amber) states.
 * Ripples expand from 180px to 380px, fading from 0.8 to 0 opacity.
 * Staggered by 0.6s between each ripple.
 */
export function RippleContainer({
  active,
  color = 'rgba(0, 240, 255, 0.5)',
  className = '',
}: RippleContainerProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'} ${className}`}
      aria-hidden="true"
    >
      {[0, 0.6, 1.2].map((delay, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            border: `2px solid ${color}`,
            animation: `ripple-expand 2s ease-out infinite`,
            animationDelay: `${delay}s`,
            width: '180px',
            height: '180px',
          }}
        />
      ))}
    </div>
  );
}
