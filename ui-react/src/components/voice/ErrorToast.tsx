import { useEffect, useState } from 'react';

export interface ErrorToastProps {
  /** Error message to display */
  message: string | null;
  /** Auto-dismiss duration in ms (default 5000) */
  dismissAfter?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** CSS class */
  className?: string;
}

/**
 * ErrorToast - Error notification that appears below the orb.
 *
 * Displays a rose-tinted glassmorphic toast with contextual error message.
 * Auto-dismisses after 5s or on click/tap.
 */
export function ErrorToast({
  message,
  dismissAfter = 5000,
  onDismiss,
  className = '',
}: ErrorToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, dismissAfter);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, dismissAfter, onDismiss]);

  if (!message) {return null;}

  return (
    <div
      className={`transition-all duration-300 cursor-pointer ${className}`}
      style={{
        background: 'rgba(255, 107, 157, 0.1)',
        border: '1px solid rgba(255, 107, 157, 0.3)',
        borderRadius: '12px',
        padding: '12px 20px',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '14px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maxWidth: '400px',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(5px)',
      }}
      onClick={() => {
        setVisible(false);
        onDismiss?.();
      }}
      role="alert"
    >
      {message}
    </div>
  );
}
