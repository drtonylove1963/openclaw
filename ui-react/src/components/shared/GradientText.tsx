import { type ReactNode, type ElementType } from 'react';

export type GradientPreset = 'cyan-violet' | 'amber' | 'emerald' | 'tricolor';

export interface GradientTextProps {
  children: ReactNode;
  /** HTML element to render */
  as?: ElementType;
  /** Whether to animate the gradient (shimmer effect) */
  animate?: boolean;
  /** Preset gradient or custom CSS gradient string */
  gradient?: GradientPreset | string;
  /** Whether to include a drop-shadow glow */
  glow?: boolean;
  /** Additional CSS class */
  className?: string;
}

const GRADIENT_PRESETS: Record<GradientPreset, string> = {
  'cyan-violet': 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
  amber: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  emerald: 'linear-gradient(135deg, #10b981, #34d399)',
  tricolor: 'linear-gradient(135deg, #00d4ff, #8b5cf6, #f59e0b)',
};

const SHIMMER_PRESETS: Record<GradientPreset, string> = {
  'cyan-violet': 'linear-gradient(135deg, #00d4ff, #8b5cf6, #00d4ff)',
  amber: 'linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b)',
  emerald: 'linear-gradient(135deg, #10b981, #34d399, #10b981)',
  tricolor: 'linear-gradient(135deg, #00d4ff, #8b5cf6, #f59e0b, #00d4ff)',
};

/**
 * GradientText - Text component with animated gradient fill
 *
 * Supports preset gradients or custom CSS gradient strings.
 * When `animate` is true, applies the shimmer animation from tailwind config.
 * When `glow` is true, adds a matching drop-shadow.
 */
export function GradientText({
  children,
  as: Tag = 'span',
  animate = false,
  gradient = 'cyan-violet',
  glow = false,
  className = '',
}: GradientTextProps) {
  const isPreset = gradient in GRADIENT_PRESETS;
  const bg = animate
    ? isPreset
      ? SHIMMER_PRESETS[gradient as GradientPreset]
      : gradient
    : isPreset
    ? GRADIENT_PRESETS[gradient as GradientPreset]
    : gradient;

  const animateClass = animate ? 'animate-shimmer' : '';

  return (
    <Tag
      className={`${animateClass} ${className}`}
      style={{
        background: bg,
        backgroundSize: animate ? '200% 100%' : undefined,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: glow ? 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))' : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
