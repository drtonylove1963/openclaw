/**
 * ErrorDisplay - Graceful error display with retry functionality
 * Shows user-friendly error messages with retry and dismiss options
 */
import React from 'react';
import { COLORS } from '../../styles/colors';

export interface ErrorDisplayProps {
  /** The error message (can be technical) */
  error: string;
  /** Optional callback to retry the last action */
  onRetry?: () => void;
  /** Optional callback to dismiss the error */
  onDismiss?: () => void;
  /** Whether retry is available (default true) */
  canRetry?: boolean;
}

/**
 * Maps technical error messages to user-friendly descriptions
 */
function getFriendlyErrorMessage(error: string): { title: string; message: string } {
  const errorLower = error.toLowerCase();

  // HTTP error codes
  if (errorLower.includes('http error 500') || errorLower.includes('500')) {
    return {
      title: 'Server Error',
      message: 'The server encountered an error. Please try again.',
    };
  }

  if (errorLower.includes('http error 503') || errorLower.includes('503') || errorLower.includes('service unavailable')) {
    return {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again in a moment.',
    };
  }

  if (errorLower.includes('http error 429') || errorLower.includes('429') || errorLower.includes('too many requests') || errorLower.includes('rate limit')) {
    return {
      title: 'Rate Limited',
      message: 'Too many requests. Please wait a moment before trying again.',
    };
  }

  if (errorLower.includes('http error 401') || errorLower.includes('401') || errorLower.includes('unauthorized')) {
    return {
      title: 'Authentication Required',
      message: 'Your session may have expired. Please refresh the page and try again.',
    };
  }

  if (errorLower.includes('http error 403') || errorLower.includes('403') || errorLower.includes('forbidden')) {
    return {
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.',
    };
  }

  if (errorLower.includes('http error 404') || errorLower.includes('404') || errorLower.includes('not found')) {
    return {
      title: 'Not Found',
      message: 'The requested resource was not found.',
    };
  }

  // Network errors
  if (errorLower.includes('failed to fetch') || errorLower.includes('networkerror') || errorLower.includes('network error')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect. Please check your internet connection.',
    };
  }

  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
    };
  }

  // AbortError should not show error (user cancelled)
  if (errorLower.includes('aborterror') || errorLower.includes('aborted')) {
    return {
      title: 'Cancelled',
      message: 'The request was cancelled.',
    };
  }

  // Default: show original error with prefix
  return {
    title: 'Something went wrong',
    message: error,
  };
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  canRetry = true,
}: ErrorDisplayProps) {
  const { title, message } = getFriendlyErrorMessage(error);

  // Don't show error for cancelled requests
  if (error.toLowerCase().includes('aborterror') || error.toLowerCase().includes('aborted')) {
    return null;
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '16px',
      margin: '0 0 16px',
      background: COLORS.dangerBg,
      border: `1px solid ${COLORS.danger}`,
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    iconWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: `${COLORS.danger}20`,
      flexShrink: 0,
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: '15px',
      fontWeight: 600,
      color: COLORS.text,
      margin: 0,
    },
    message: {
      fontSize: '14px',
      color: COLORS.textMuted,
      margin: '4px 0 0',
      lineHeight: 1.5,
    },
    actions: {
      display: 'flex',
      gap: '8px',
      marginTop: '4px',
    },
    retryButton: {
      padding: '8px 16px',
      background: COLORS.accent,
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background 0.15s ease',
    },
    dismissButton: {
      padding: '8px 16px',
      background: 'transparent',
      color: COLORS.textMuted,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
  };

  return (
    <div style={styles.container} role="alert" data-testid="error-display">
      <div style={styles.header}>
        {/* Error Icon - Exclamation in circle */}
        <div style={styles.iconWrapper}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.danger}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div style={styles.titleSection}>
          <h4 style={styles.title} data-testid="error-title">{title}</h4>
          <p style={styles.message} data-testid="error-message">{message}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {(onRetry || onDismiss) && (
        <div style={styles.actions}>
          {onRetry && canRetry && (
            <button
              style={styles.retryButton}
              onClick={onRetry}
              data-testid="retry-button"
              onMouseOver={(e) => {
                e.currentTarget.style.background = COLORS.accentHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = COLORS.accent;
              }}
            >
              {/* Retry Icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Try Again
            </button>
          )}

          {onDismiss && (
            <button
              style={styles.dismissButton}
              onClick={onDismiss}
              data-testid="dismiss-button"
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = COLORS.textMuted;
                e.currentTarget.style.color = COLORS.text;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.textMuted;
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorDisplay;
