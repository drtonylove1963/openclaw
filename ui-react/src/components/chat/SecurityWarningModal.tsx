/**
 * Security Warning Modal - Alert user about detected sensitive data
 *
 * Displays when sensitive patterns are detected in message content.
 * Allows user to:
 * - Review what was detected
 * - Edit their message to remove sensitive data
 * - Proceed anyway (for non-blocking warnings)
 * - Cancel the message
 */

import React, { useCallback } from 'react';
import { PatternMatch, ValidationResult } from '../../security';

interface SecurityWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onEdit: () => void;
  validation: ValidationResult;
  canProceed?: boolean;
}

const SecurityWarningModal: React.FC<SecurityWarningModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  onEdit,
  validation,
  canProceed = true,
}) => {
  if (!isOpen) {return null;}

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const renderMatch = (match: PatternMatch, index: number) => (
    <div
      key={`${match.patternName}-${index}`}
      className="flex items-start gap-3 p-2 rounded bg-gray-800/50"
    >
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(match.severity)}`}>
        {match.severity.toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-200">{match.description}</div>
        <div className="text-sm text-gray-400 font-mono truncate">
          {match.redactedPreview}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-700 ${hasErrors ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
          <div className="flex items-center gap-3">
            <svg
              className={`w-6 h-6 ${hasErrors ? 'text-red-400' : 'text-yellow-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-white">
              {hasErrors ? 'Sensitive Data Detected' : 'Security Warning'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          <p className="text-gray-300 mb-4">
            {hasErrors
              ? 'Your message contains sensitive information that should not be sent to an AI model.'
              : 'Your message may contain sensitive information. Please review before sending.'}
          </p>

          {/* Errors (High Severity) */}
          {hasErrors && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Blocked ({validation.errors.length})
              </h3>
              <div className="space-y-2">
                {validation.errors.map((match, i) => renderMatch(match, i))}
              </div>
            </div>
          )}

          {/* Warnings (Medium/Low Severity) */}
          {hasWarnings && (
            <div>
              <h3 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
                Warnings ({validation.warnings.length})
              </h3>
              <div className="space-y-2">
                {validation.warnings.map((match, i) => renderMatch(match, i))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Edit Message
          </button>
          {canProceed && !hasErrors && (
            <button
              onClick={onProceed}
              className="px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
            >
              Send Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityWarningModal;
