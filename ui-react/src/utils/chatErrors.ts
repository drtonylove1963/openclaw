/**
 * Chat error classification utility.
 * Provides structured error types and user-friendly messages.
 */

export enum ChatErrorType {
  AUTH_EXPIRED = 'auth_expired',
  NETWORK = 'network',
  SERVER = 'server',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
}

export interface ChatError {
  type: ChatErrorType;
  message: string;
  /** Optional action label (e.g., "Log in again") */
  action?: string;
  /** Optional action callback */
  onAction?: () => void;
}

/**
 * Classify an error into a structured ChatError.
 */
export function classifyError(
  error: unknown,
  statusCode?: number,
): ChatError {
  // Cancelled request (AbortController)
  if (error instanceof Error && error.name === 'AbortError') {
    return { type: ChatErrorType.CANCELLED, message: 'Request cancelled.' };
  }

  // HTTP status code classification
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      return {
        type: ChatErrorType.AUTH_EXPIRED,
        message: 'Session expired. Please log in again.',
        action: 'Log in',
        onAction: () => window.dispatchEvent(new Event('auth-expired')),
      };
    }
    if (statusCode === 429) {
      return {
        type: ChatErrorType.RATE_LIMIT,
        message: 'Too many requests. Please wait a moment.',
      };
    }
    if (statusCode === 404) {
      return {
        type: ChatErrorType.NOT_FOUND,
        message: 'Service not available. Please check backend deployment.',
      };
    }
    if (statusCode >= 500) {
      return {
        type: ChatErrorType.SERVER,
        message: 'Server error. Please try again later.',
      };
    }
  }

  // Network errors (fetch failed entirely)
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
      return {
        type: ChatErrorType.NETWORK,
        message: 'Unable to reach the server. Check your connection.',
      };
    }
  }

  // Error with message
  if (error instanceof Error) {
    if (error.message.includes('expired') || error.message.includes('401')) {
      return {
        type: ChatErrorType.AUTH_EXPIRED,
        message: error.message,
        action: 'Log in',
        onAction: () => window.dispatchEvent(new Event('auth-expired')),
      };
    }
    return { type: ChatErrorType.UNKNOWN, message: error.message };
  }

  // Fallback
  return {
    type: ChatErrorType.UNKNOWN,
    message: typeof error === 'string' ? error : 'An unexpected error occurred.',
  };
}

/** Map error types to banner colors */
export const ERROR_COLORS: Record<ChatErrorType, { bg: string; border: string; text: string }> = {
  [ChatErrorType.AUTH_EXPIRED]: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
  [ChatErrorType.NETWORK]:     { bg: 'rgba(239, 68, 68, 0.1)',  border: 'rgba(239, 68, 68, 0.3)',  text: '#fca5a5' },
  [ChatErrorType.SERVER]:      { bg: 'rgba(239, 68, 68, 0.1)',  border: 'rgba(239, 68, 68, 0.3)',  text: '#fca5a5' },
  [ChatErrorType.RATE_LIMIT]:  { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
  [ChatErrorType.NOT_FOUND]:   { bg: 'rgba(239, 68, 68, 0.1)',  border: 'rgba(239, 68, 68, 0.3)',  text: '#fca5a5' },
  [ChatErrorType.VALIDATION]:  { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
  [ChatErrorType.CANCELLED]:   { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: '#9ca3af' },
  [ChatErrorType.UNKNOWN]:     { bg: 'rgba(239, 68, 68, 0.1)',  border: 'rgba(239, 68, 68, 0.3)',  text: '#fca5a5' },
};
