/**
 * Sentry Error Tracking and Performance Monitoring
 *
 * This module initializes Sentry for the Pronetheia frontend.
 * It provides error tracking, performance monitoring, and session replay.
 *
 * Usage:
 *   import { initSentry } from './lib/sentry';
 *   initSentry(); // Call before ReactDOM.createRoot()
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry SDK for the frontend
 *
 * @returns true if initialized, false if skipped (no DSN)
 */
export function initSentry(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

  // Skip if no DSN configured
  if (!dsn) {
    console.info('Sentry DSN not configured, skipping initialization');
    return false;
  }

  Sentry.init({
    dsn,
    environment,

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace all navigation
        enableInp: true,
      }),

      // Session replay for debugging (captures user actions)
      Sentry.replayIntegration({
        // Mask all text by default for privacy
        maskAllText: true,
        // Block all media by default
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    // Capture 10% of transactions in production, 100% in development
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session Replay
    // Capture 10% of sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking (set via build process)
    release: import.meta.env.VITE_SENTRY_RELEASE,

    // Filter events
    beforeSend(event, hint) {
      // Filter out specific errors
      const error = hint.originalException;

      if (error instanceof Error) {
        // Don't report network errors (user might be offline)
        if (error.message.includes('Failed to fetch')) {
          return null;
        }

        // Don't report ResizeObserver errors (browser quirk)
        if (error.message.includes('ResizeObserver')) {
          return null;
        }
      }

      return event;
    },

    // Filter transactions
    beforeSendTransaction(event) {
      // Filter out health check transactions
      const transaction = event.transaction || '';
      if (transaction.includes('/health') || transaction.includes('/api/health')) {
        return null;
      }

      return event;
    },

    // Don't send PII
    sendDefaultPii: false,
  });

  console.info(`Sentry initialized: environment=${environment}`);
  return true;
}

/**
 * Set the current user context for Sentry events
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
} | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture an exception manually
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string | undefined {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): string | undefined {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set a tag for the current scope
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set additional context
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  Sentry.setContext(name, context);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Create a Sentry error boundary wrapper
 * Use this to wrap components that might throw
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with error boundary
 */
export const withSentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * Profiler component for performance monitoring
 */
export const SentryProfiler = Sentry.Profiler;

/**
 * HOC to wrap components with profiler
 */
export const withSentryProfiler = Sentry.withProfiler;
