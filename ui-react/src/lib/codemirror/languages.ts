/**
 * CodeMirror 6 Language Support
 *
 * Provides language extensions for syntax highlighting and features.
 * Languages are loaded dynamically to reduce bundle size.
 */

import { Extension } from '@codemirror/state';
import { LanguageSupport } from '@codemirror/language';

// Language imports
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { yaml } from '@codemirror/lang-yaml';

/**
 * Supported languages with their configurations
 */
export const languageConfigs: Record<string, () => LanguageSupport | Extension> = {
  // JavaScript family
  javascript: () => javascript(),
  js: () => javascript(),
  jsx: () => javascript({ jsx: true }),
  typescript: () => javascript({ typescript: true }),
  ts: () => javascript({ typescript: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),

  // Python
  python: () => python(),
  py: () => python(),

  // Data formats
  json: () => json(),
  yaml: () => yaml(),
  yml: () => yaml(),

  // Web
  html: () => html(),
  htm: () => html(),
  css: () => css(),
  scss: () => css(), // Basic CSS highlighting for SCSS
  less: () => css(), // Basic CSS highlighting for LESS

  // Documentation
  markdown: () => markdown(),
  md: () => markdown(),

  // Database
  sql: () => sql(),
  postgresql: () => sql(),
  mysql: () => sql(),

  // Plain text (no highlighting)
  text: () => [],
  txt: () => [],
  plain: () => [],
};

/**
 * File extension to language mapping
 */
export const extensionToLanguage: Record<string, string> = {
  // JavaScript
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.tsx': 'tsx',

  // Python
  '.py': 'python',
  '.pyw': 'python',
  '.pyi': 'python',

  // Data
  '.json': 'json',
  '.jsonc': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'yaml', // Basic support

  // Web
  '.html': 'html',
  '.htm': 'html',
  '.xhtml': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',

  // Documentation
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.mdx': 'markdown',

  // Database
  '.sql': 'sql',

  // Config files
  '.env': 'text',
  '.gitignore': 'text',
  '.dockerignore': 'text',

  // Shell
  '.sh': 'text',
  '.bash': 'text',
  '.zsh': 'text',

  // Plain text
  '.txt': 'text',
  '.log': 'text',
};

/**
 * Get language extension for CodeMirror
 *
 * @param language - Language name or file extension
 * @returns CodeMirror language extension
 */
export function getLanguageExtension(language: string): Extension {
  // Normalize the language name
  const normalized = language.toLowerCase().trim();

  // Check if it's a file extension
  if (normalized.startsWith('.')) {
    const mappedLang = extensionToLanguage[normalized];
    if (mappedLang && languageConfigs[mappedLang]) {
      return languageConfigs[mappedLang]();
    }
  }

  // Check direct language name
  if (languageConfigs[normalized]) {
    return languageConfigs[normalized]();
  }

  // Default to plain text (no highlighting)
  console.warn(`Unknown language: ${language}, using plain text`);
  return [];
}

/**
 * Get list of supported languages
 *
 * @returns Array of supported language names
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(languageConfigs).filter(
    // Remove duplicates/aliases
    (lang) => !['js', 'ts', 'py', 'yml', 'htm', 'txt', 'plain'].includes(lang)
  );
}

/**
 * Detect language from file name
 *
 * @param fileName - File name with extension
 * @returns Detected language or 'text'
 */
export function detectLanguage(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return extensionToLanguage[ext] || 'text';
}

/**
 * Get language display name
 *
 * @param language - Internal language name
 * @returns Human-readable name
 */
export function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    jsx: 'JSX',
    typescript: 'TypeScript',
    tsx: 'TSX',
    python: 'Python',
    json: 'JSON',
    yaml: 'YAML',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    less: 'LESS',
    markdown: 'Markdown',
    sql: 'SQL',
    text: 'Plain Text',
  };

  return displayNames[language.toLowerCase()] || language.toUpperCase();
}
