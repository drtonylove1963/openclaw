import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';

export type GlassCardVariant = 'standard' | 'bordered' | 'highlighted';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Visual variant */
  variant?: GlassCardVariant;
  /** Accent glow color (CSS color string) for highlighted variant */
  glowColor?: string;
  /** Additional CSS class names */
  className?: string;
  /** Whether to show hover effect */
  hoverable?: boolean;
}

/**
 * GlassCard - Glassmorphic card component
 *
 * Surface levels from DESIGN-SYSTEM.md:
 * - standard: Level 1 (rgba(255,255,255,0.03), blur(20px))
 * - bordered: Level 1 + visible border
 * - highlighted: Level 1 + colored left accent bar + subtle glow
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      children,
      variant = 'standard',
      glowColor,
      className = '',
      hoverable = false,
      style,
      ...rest
    },
    ref
  ) {
    const baseClasses = 'relative rounded-card transition-all duration-300';
    const hoverClasses = hoverable ? 'hover:bg-neural-card-hover hover:-translate-y-0.5' : '';

    const variantStyles: Record<GlassCardVariant, React.CSSProperties> = {
      standard: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid transparent',
      },
      bordered: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      },
      highlighted: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderLeftWidth: '3px',
        borderLeftColor: glowColor || '#00d4ff',
        boxShadow: glowColor
          ? `0 0 20px ${glowColor}20`
          : '0 0 20px rgba(0, 212, 255, 0.1)',
      },
    };

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${hoverClasses} ${className}`}
        style={{
          ...variantStyles[variant],
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
