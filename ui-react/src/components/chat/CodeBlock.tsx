/**
 * CodeBlock - Syntax-highlighted code block with copy functionality
 * Uses react-syntax-highlighter with PrismLight for efficient highlighting
 */
import React, { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Register commonly used languages to reduce bundle size
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';

import { COLORS } from '../../styles/colors';

// Register languages
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('rs', rust);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('cs', csharp);

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

// Copy icon component
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// Check icon component
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Language display name mapping
const languageDisplayNames: Record<string, string> = {
  typescript: 'TypeScript',
  ts: 'TypeScript',
  javascript: 'JavaScript',
  js: 'JavaScript',
  python: 'Python',
  py: 'Python',
  bash: 'Bash',
  shell: 'Shell',
  sh: 'Shell',
  json: 'JSON',
  css: 'CSS',
  sql: 'SQL',
  markdown: 'Markdown',
  md: 'Markdown',
  tsx: 'TSX',
  jsx: 'JSX',
  yaml: 'YAML',
  yml: 'YAML',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  java: 'Java',
  csharp: 'C#',
  cs: 'C#',
  text: 'Plain Text',
};

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Handle empty code
  if (!code || code.trim() === '') {
    return null;
  }

  // Normalize language (fallback to 'text' for unknown languages)
  const normalizedLanguage = language?.toLowerCase() || 'text';
  const displayLanguage = languageDisplayNames[normalizedLanguage] || language || 'Plain Text';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      marginTop: '8px',
      marginBottom: '8px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${COLORS.border}`,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: COLORS.codeBg,
      borderBottom: `1px solid ${COLORS.border}`,
    },
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: COLORS.textMuted,
    },
    languageBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      background: COLORS.accent + '20',
      color: COLORS.accent,
      fontSize: '11px',
      fontWeight: 500,
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    filename: {
      fontSize: '12px',
      color: COLORS.text,
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    },
    copyButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      background: 'transparent',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '4px',
      color: copied ? COLORS.success : COLORS.textMuted,
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    codeWrapper: {
      margin: 0,
      padding: 0,
    },
  };

  // Custom style overrides for the syntax highlighter
  const customStyle: React.CSSProperties = {
    margin: 0,
    padding: '12px',
    background: COLORS.codeBg,
    fontSize: '13px',
    lineHeight: '1.5',
    borderRadius: 0,
  };

  return (
    <div style={styles.container} data-testid="code-block">
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <span style={styles.languageBadge} data-testid="language-badge">{displayLanguage}</span>
          {filename && <span style={styles.filename} data-testid="code-filename">{filename}</span>}
        </div>
        <button
          style={styles.copyButton}
          onClick={handleCopy}
          data-testid="copy-button"
          onMouseOver={(e) => {
            if (!copied) {
              e.currentTarget.style.color = COLORS.text;
              e.currentTarget.style.borderColor = COLORS.textMuted;
            }
          }}
          onMouseOut={(e) => {
            if (!copied) {
              e.currentTarget.style.color = COLORS.textMuted;
              e.currentTarget.style.borderColor = COLORS.border;
            }
          }}
          title="Copy code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div style={styles.codeWrapper} data-testid="code-content">
        <SyntaxHighlighter
          language={normalizedLanguage}
          style={oneDark}
          customStyle={customStyle}
          wrapLines={true}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default CodeBlock;
