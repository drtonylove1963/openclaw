/**
 * MarkdownRenderer - React-markdown based rendering with custom components
 * Supports GFM (GitHub Flavored Markdown) with syntax-highlighted code blocks
 * and inline diff views for code changes
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import { DiffViewer } from './DiffViewer';
import { COLORS } from '../../styles/colors';

/**
 * Parse Claude's edit markers format:
 * <<<<<<< OLD
 * old code here
 * =======
 * new code here
 * >>>>>>> NEW
 */
function parseClaudeEditMarkers(code: string): { oldCode: string; newCode: string } | null {
  const oldMatch = code.match(/<<<<<<< OLD\n([\s\S]*?)\n=======/);
  const newMatch = code.match(/=======\n([\s\S]*?)\n>>>>>>> NEW/);

  if (oldMatch && newMatch) {
    return {
      oldCode: oldMatch[1] || '',
      newCode: newMatch[1] || '',
    };
  }
  return null;
}

/**
 * Check if code block looks like a unified diff
 */
function isUnifiedDiffContent(code: string): boolean {
  const lines = code.split('\n');
  // Check for diff markers in first few lines
  const hasMarkers = lines.some(line =>
    line.startsWith('---') ||
    line.startsWith('+++') ||
    line.startsWith('@@')
  );
  // Or check if lines start with +/- (simple diff format)
  const hasDiffPrefixes = lines.filter(l => l.trim()).some(line =>
    line.startsWith('+') || line.startsWith('-')
  );
  return hasMarkers || hasDiffPrefixes;
}

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom components for react-markdown
const createComponents = (): Components => ({
  // Code blocks and inline code
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : undefined;
    const codeString = String(children).replace(/\n$/, '');

    // Check if this is a code block (has language) or inline code
    // Code blocks typically have newlines or are wrapped in triple backticks
    const isCodeBlock = language || codeString.includes('\n');

    if (isCodeBlock) {
      // Check for diff language - render with DiffViewer
      if (language === 'diff') {
        return <DiffViewer unified={codeString} />;
      }

      // Check for Claude's edit markers format
      const editMarkers = parseClaudeEditMarkers(codeString);
      if (editMarkers) {
        return (
          <DiffViewer
            oldCode={editMarkers.oldCode}
            newCode={editMarkers.newCode}
            language={language}
          />
        );
      }

      // Check if content looks like a diff even without diff language tag
      if (isUnifiedDiffContent(codeString) && !language) {
        return <DiffViewer unified={codeString} />;
      }

      return <CodeBlock code={codeString} language={language} />;
    }

    // Inline code styling
    return (
      <code
        style={{
          background: COLORS.codeBg,
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          color: COLORS.accent,
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },

  // Headers
  h1({ children }) {
    return (
      <h1
        style={{
          margin: '20px 0 12px',
          fontSize: '20px',
          fontWeight: 700,
          color: COLORS.text,
          lineHeight: 1.3,
        }}
      >
        {children}
      </h1>
    );
  },

  h2({ children }) {
    return (
      <h2
        style={{
          margin: '16px 0 10px',
          fontSize: '17px',
          fontWeight: 600,
          color: COLORS.text,
          lineHeight: 1.3,
        }}
      >
        {children}
      </h2>
    );
  },

  h3({ children }) {
    return (
      <h3
        style={{
          margin: '14px 0 8px',
          fontSize: '15px',
          fontWeight: 600,
          color: COLORS.accent,
          lineHeight: 1.3,
        }}
      >
        {children}
      </h3>
    );
  },

  h4({ children }) {
    return (
      <h4
        style={{
          margin: '12px 0 8px',
          fontSize: '14px',
          fontWeight: 600,
          color: COLORS.accent,
          lineHeight: 1.3,
        }}
      >
        {children}
      </h4>
    );
  },

  // Tables
  table({ children }) {
    return (
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '12px 0',
          fontSize: '13px',
        }}
      >
        {children}
      </table>
    );
  },

  thead({ children }) {
    return <thead>{children}</thead>;
  },

  tbody({ children }) {
    return <tbody>{children}</tbody>;
  },

  tr({ children }) {
    return <tr>{children}</tr>;
  },

  th({ children }) {
    return (
      <th
        style={{
          padding: '8px 12px',
          background: COLORS.codeBg,
          border: `1px solid ${COLORS.border}`,
          textAlign: 'left',
          fontWeight: 600,
          color: COLORS.text,
        }}
      >
        {children}
      </th>
    );
  },

  td({ children }) {
    return (
      <td
        style={{
          padding: '8px 12px',
          border: `1px solid ${COLORS.border}`,
          color: COLORS.textMuted,
        }}
      >
        {children}
      </td>
    );
  },

  // Links
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: COLORS.accent,
          textDecoration: 'none',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        {children}
      </a>
    );
  },

  // Lists
  ul({ children }) {
    return (
      <ul
        style={{
          margin: '8px 0',
          paddingLeft: '24px',
          listStyleType: 'disc',
        }}
      >
        {children}
      </ul>
    );
  },

  ol({ children }) {
    return (
      <ol
        style={{
          margin: '8px 0',
          paddingLeft: '24px',
          listStyleType: 'decimal',
        }}
      >
        {children}
      </ol>
    );
  },

  li({ children }) {
    return (
      <li
        style={{
          marginBottom: '4px',
          color: COLORS.textMuted,
          lineHeight: 1.5,
        }}
      >
        {children}
      </li>
    );
  },

  // Paragraphs
  p({ children }) {
    return (
      <p
        style={{
          margin: '8px 0',
          lineHeight: 1.6,
          color: COLORS.text,
        }}
      >
        {children}
      </p>
    );
  },

  // Horizontal rule
  hr() {
    return (
      <hr
        style={{
          border: 'none',
          borderTop: `1px solid ${COLORS.border}`,
          margin: '16px 0',
        }}
      />
    );
  },

  // Blockquote
  blockquote({ children }) {
    return (
      <blockquote
        style={{
          margin: '12px 0',
          padding: '8px 16px',
          borderLeft: `3px solid ${COLORS.accent}`,
          background: COLORS.codeBg,
          borderRadius: '0 4px 4px 0',
          color: COLORS.textMuted,
        }}
      >
        {children}
      </blockquote>
    );
  },

  // Strong/Bold
  strong({ children }) {
    return (
      <strong
        style={{
          color: COLORS.text,
          fontWeight: 600,
        }}
      >
        {children}
      </strong>
    );
  },

  // Emphasis/Italic
  em({ children }) {
    return (
      <em
        style={{
          fontStyle: 'italic',
        }}
      >
        {children}
      </em>
    );
  },

  // Strikethrough (GFM)
  del({ children }) {
    return (
      <del
        style={{
          textDecoration: 'line-through',
          color: COLORS.textMuted,
        }}
      >
        {children}
      </del>
    );
  },

  // Pre (for code blocks without language)
  pre({ children }) {
    return <>{children}</>;
  },

  // Images
  img({ src, alt }) {
    return (
      <img
        src={src}
        alt={alt || ''}
        style={{
          maxWidth: '100%',
          borderRadius: '8px',
          margin: '8px 0',
        }}
      />
    );
  },
});

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Handle empty content gracefully
  if (!content) {
    return null;
  }

  const components = createComponents();

  return (
    <div
      className={className}
      style={{
        color: COLORS.text,
        fontSize: '13px',
        lineHeight: 1.4,
        wordBreak: 'break-word',
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
