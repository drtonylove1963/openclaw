/**
 * Security Module - Client-side security validation
 *
 * Provides client-side validation for sensitive data patterns.
 * Part of the ShieldPrompt integration for defense-in-depth security.
 *
 * Usage:
 *   import { securityValidator, validateContent, hasSensitiveData } from '@/security';
 *
 *   // Quick check
 *   if (hasSensitiveData(content)) {
 *     // Handle sensitive data
 *   }
 *
 *   // Full validation
 *   const result = validateContent(content);
 *   if (!result.isValid) {
 *     // Show warning modal
 *   }
 *
 *   // With validator instance
 *   const validator = new SecurityValidator({ blockOnError: true });
 *   const result = validator.validate(content);
 */

export {
  SECURITY_PATTERNS,
  detectPatterns,
  validateContent,
  hasSensitiveData,
  getPatternsByCategory,
  getCategories,
} from './patterns';

export type {
  PatternMatch,
  ValidationResult,
  SecurityPattern,
} from './patterns';

export {
  SecurityValidator,
  securityValidator,
} from './validator';

export type {
  SecurityValidatorOptions,
} from './validator';
