/**
 * Security Patterns Library - Client-side Pattern Validation
 *
 * Provides client-side validation for sensitive data patterns before
 * messages are sent to the backend. Part of the ShieldPrompt integration.
 *
 * Pattern Categories:
 * - API Keys: OpenAI, Anthropic, AWS, etc.
 * - PII: SSN, Phone, Email, Credit Card
 * - Credentials: Passwords in URLs, Database URLs, Private Keys
 */

export interface PatternMatch {
  patternName: string;
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  match: string;
  start: number;
  end: number;
  redactedPreview: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: PatternMatch[];
  errors: PatternMatch[];
  hasSensitiveData: boolean;
}

export interface SecurityPattern {
  name: string;
  category: string;
  pattern: RegExp;
  description: string;
  severity: 'high' | 'medium' | 'low';
  aliasPrefix: string;
}

// =============================================================================
// Pattern Definitions
// =============================================================================

export const SECURITY_PATTERNS: Record<string, SecurityPattern> = {
  // API Keys
  openai_api_key: {
    name: 'openai_api_key',
    category: 'api_keys',
    pattern: /\bsk-[a-zA-Z0-9]{20,}(?:-[a-zA-Z0-9]+)?\b/g,
    description: 'OpenAI API Key',
    severity: 'high',
    aliasPrefix: 'OPENAI_KEY',
  },
  anthropic_api_key: {
    name: 'anthropic_api_key',
    category: 'api_keys',
    pattern: /\bsk-ant-[a-zA-Z0-9-]{40,}\b/g,
    description: 'Anthropic API Key',
    severity: 'high',
    aliasPrefix: 'ANTHROPIC_KEY',
  },
  aws_access_key: {
    name: 'aws_access_key',
    category: 'cloud',
    pattern: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    description: 'AWS Access Key ID',
    severity: 'high',
    aliasPrefix: 'AWS_KEY',
  },
  google_api_key: {
    name: 'google_api_key',
    category: 'api_keys',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    description: 'Google API Key',
    severity: 'high',
    aliasPrefix: 'GOOGLE_KEY',
  },
  stripe_api_key: {
    name: 'stripe_api_key',
    category: 'api_keys',
    pattern: /\b(sk|pk)_(test|live)_[a-zA-Z0-9]{24,}\b/g,
    description: 'Stripe API Key',
    severity: 'high',
    aliasPrefix: 'STRIPE_KEY',
  },
  github_token: {
    name: 'github_token',
    category: 'api_keys',
    pattern: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}\b/g,
    description: 'GitHub Token',
    severity: 'high',
    aliasPrefix: 'GITHUB_TOKEN',
  },
  slack_token: {
    name: 'slack_token',
    category: 'api_keys',
    pattern: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}\b/g,
    description: 'Slack Token',
    severity: 'high',
    aliasPrefix: 'SLACK_TOKEN',
  },

  // PII
  ssn: {
    name: 'ssn',
    category: 'pii',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    description: 'Social Security Number',
    severity: 'high',
    aliasPrefix: 'SSN',
  },
  credit_card: {
    name: 'credit_card',
    category: 'financial',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    description: 'Credit Card Number',
    severity: 'high',
    aliasPrefix: 'CC',
  },
  email: {
    name: 'email',
    category: 'pii',
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    description: 'Email Address',
    severity: 'medium',
    aliasPrefix: 'EMAIL',
  },
  phone_us: {
    name: 'phone_us',
    category: 'pii',
    pattern: /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    description: 'US Phone Number',
    severity: 'medium',
    aliasPrefix: 'PHONE',
  },

  // Credentials
  password_in_url: {
    name: 'password_in_url',
    category: 'credentials',
    pattern: /:\/\/[^:]+:([^@]+)@/g,
    description: 'Password in URL',
    severity: 'high',
    aliasPrefix: 'PWD',
  },
  database_url: {
    name: 'database_url',
    category: 'database',
    pattern: /\b(?:postgres|mysql|mongodb|redis)(?:ql)?:\/\/[^\s]+/g,
    description: 'Database Connection URL',
    severity: 'high',
    aliasPrefix: 'DB_URL',
  },
  private_key: {
    name: 'private_key',
    category: 'credentials',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    description: 'Private Key Header',
    severity: 'high',
    aliasPrefix: 'PRIVKEY',
  },
  jwt_token: {
    name: 'jwt_token',
    category: 'credentials',
    pattern: /\beyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\b/g,
    description: 'JWT Token',
    severity: 'high',
    aliasPrefix: 'JWT',
  },
};

// =============================================================================
// Detection Functions
// =============================================================================

/**
 * Create a redacted preview of matched content
 */
function createRedactedPreview(match: string, maxVisible: number = 4): string {
  if (match.length <= maxVisible * 2) {
    return '*'.repeat(match.length);
  }
  const prefix = match.substring(0, maxVisible);
  const suffix = match.substring(match.length - maxVisible);
  const hidden = '*'.repeat(Math.min(match.length - maxVisible * 2, 10));
  return `${prefix}${hidden}${suffix}`;
}

/**
 * Detect all security patterns in content
 */
export function detectPatterns(content: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const [name, pattern] of Object.entries(SECURITY_PATTERNS)) {
    // Reset regex lastIndex
    pattern.pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = pattern.pattern.exec(content)) !== null) {
      matches.push({
        patternName: name,
        category: pattern.category,
        description: pattern.description,
        severity: pattern.severity,
        match: match[0],
        start: match.index,
        end: match.index + match[0].length,
        redactedPreview: createRedactedPreview(match[0]),
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  return matches;
}

/**
 * Validate content for security issues
 */
export function validateContent(content: string): ValidationResult {
  const matches = detectPatterns(content);

  const errors = matches.filter((m) => m.severity === 'high');
  const warnings = matches.filter((m) => m.severity !== 'high');

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    hasSensitiveData: matches.length > 0,
  };
}

/**
 * Quick check if content contains any sensitive patterns
 */
export function hasSensitiveData(content: string): boolean {
  for (const pattern of Object.values(SECURITY_PATTERNS)) {
    pattern.pattern.lastIndex = 0;
    if (pattern.pattern.test(content)) {
      return true;
    }
  }
  return false;
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: string): SecurityPattern[] {
  return Object.values(SECURITY_PATTERNS).filter((p) => p.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  const categories = new Set<string>();
  for (const pattern of Object.values(SECURITY_PATTERNS)) {
    categories.add(pattern.category);
  }
  return Array.from(categories);
}
