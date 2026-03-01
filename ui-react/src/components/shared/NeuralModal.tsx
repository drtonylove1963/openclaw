import { useEffect, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface NeuralModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Footer actions (buttons) */
  footer?: ReactNode;
  /** Modal max-width (default: 560px) */
  maxWidth?: string;
  className?: string;
}

/**
 * NeuralModal - Glassmorphic modal dialog
 *
 * Features:
 * - Glass background with blur backdrop
 * - Escape key to close
 * - Click-outside to close
 * - Animated entrance
 */
export function NeuralModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '560px',
  className = '',
}: NeuralModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {return null;}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ padding: '40px' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(5, 5, 10, 0.8)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full animate-in fade-in zoom-in-95 ${className}`}
        style={{
          maxWidth,
          maxHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 15, 25, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 212, 255, 0.1)',
        }}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{
              padding: '24px 28px 0',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#f0f0f5',
                margin: 0,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-colors duration-200 border-0 outline-none cursor-pointer"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#6b7280',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#f0f0f5';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#6b7280';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div
          className="flex-1 overflow-auto ni-scrollbar"
          style={{ padding: '24px 28px' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 flex-shrink-0"
            style={{
              padding: '0 28px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '20px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable button styles for modal footers
 */
export function NeuralButton({
  children,
  variant = 'secondary',
  onClick,
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'rgba(0, 212, 255, 0.2)',
      border: '1px solid rgba(0, 212, 255, 0.4)',
      color: '#00d4ff',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#f0f0f5',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      color: '#ef4444',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 text-[14px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none ${className}`}
      style={{
        padding: '10px 20px',
        borderRadius: '12px',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}
