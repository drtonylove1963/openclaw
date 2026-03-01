export interface EntityNodeProps {
  label: string;
  /** "large" for prominent entities */
  size?: 'normal' | 'large';
  /** CSS position values */
  style?: React.CSSProperties;
  /** Animation delay in seconds */
  animationDelay?: number;
  className?: string;
}

/**
 * EntityNode - Floating entity label for the knowledge constellation
 *
 * Absolute-positioned pill with float animation and hover glow.
 */
export function EntityNode({
  label,
  size = 'normal',
  style,
  animationDelay = 0,
  className = '',
}: EntityNodeProps) {
  const isLarge = size === 'large';

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 animate-node-float ${className}`}
      style={{
        padding: isLarge ? '10px 18px' : '8px 14px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        fontSize: isLarge ? '13px' : '11px',
        fontWeight: isLarge ? 600 : 400,
        color: '#f0f0f5',
        animationDelay: `${animationDelay}s`,
        zIndex: 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(0, 212, 255, 0.15)';
        el.style.borderColor = 'rgba(0, 212, 255, 0.4)';
        el.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
        el.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(255, 255, 255, 0.05)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        el.style.boxShadow = 'none';
        el.style.transform = '';
      }}
    >
      {label}
    </div>
  );
}
