/**
 * Security Validator - Integration service for content validation
 *
 * Provides validation hooks and utilities for integrating security
 * checks into React components.
 */

import { detectPatterns, validateContent, hasSensitiveData, ValidationResult, PatternMatch } from './patterns';

export interface SecurityValidatorOptions {
  enabled?: boolean;
  blockOnError?: boolean;
  warnOnMedium?: boolean;
  maxPreviewLength?: number;
}

const DEFAULT_OPTIONS: SecurityValidatorOptions = {
  enabled: true,
  blockOnError: true,
  warnOnMedium: true,
  maxPreviewLength: 50,
};

/**
 * Security Validator class for managing validation state
 */
export class SecurityValidator {
  private options: SecurityValidatorOptions;

  constructor(options: Partial<SecurityValidatorOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate content and return result
   */
  validate(content: string): ValidationResult {
    if (!this.options.enabled) {
      return {
        isValid: true,
        warnings: [],
        errors: [],
        hasSensitiveData: false,
      };
    }

    return validateContent(content);
  }

  /**
   * Quick check for sensitive data
   */
  hasSensitiveData(content: string): boolean {
    if (!this.options.enabled) {
      return false;
    }
    return hasSensitiveData(content);
  }

  /**
   * Check if content should be blocked
   */
  shouldBlock(result: ValidationResult): boolean {
    if (!this.options.blockOnError) {
      return false;
    }
    return result.errors.length > 0;
  }

  /**
   * Check if content should show warning
   */
  shouldWarn(result: ValidationResult): boolean {
    if (!this.options.warnOnMedium) {
      return result.errors.length > 0;
    }
    return result.hasSensitiveData;
  }

  /**
   * Format matches for display
   */
  formatMatches(matches: PatternMatch[]): string[] {
    return matches.map((m) => {
      const preview = m.redactedPreview.length > (this.options.maxPreviewLength || 50)
        ? m.redactedPreview.substring(0, this.options.maxPreviewLength) + '...'
        : m.redactedPreview;
      return `${m.description}: ${preview}`;
    });
  }

  /**
   * Get summary message for validation result
   */
  getSummaryMessage(result: ValidationResult): string {
    if (!result.hasSensitiveData) {
      return '';
    }

    const parts: string[] = [];

    if (result.errors.length > 0) {
      const types = [...new Set(result.errors.map((e) => e.description))];
      parts.push(`Found ${result.errors.length} sensitive item(s): ${types.join(', ')}`);
    }

    if (result.warnings.length > 0) {
      const types = [...new Set(result.warnings.map((w) => w.description))];
      parts.push(`${result.warnings.length} potential issue(s): ${types.join(', ')}`);
    }

    return parts.join('. ');
  }
}

// Export singleton validator with default options
export const securityValidator = new SecurityValidator();

// Re-export types and utilities
export { detectPatterns, validateContent, hasSensitiveData };
export type { ValidationResult, PatternMatch };
