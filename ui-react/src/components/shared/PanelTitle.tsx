import { type ReactNode } from 'react';

export interface PanelTitleProps {
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * PanelTitle - Section title typography component
 *
 * Renders an uppercase, letter-spaced label for panel/card sections.
 * Matches the design system spec: 14px, weight 600, uppercase, 1px letter-spacing.
 */
export function PanelTitle({ children, className = '' }: PanelTitleProps) {
  return (
    <h3
      className={`ni-gradient-text ${className}`}
      style={{
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}
    >
      {children}
    </h3>
  );
}
