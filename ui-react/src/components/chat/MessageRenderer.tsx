/**
 * MessageRenderer - Comprehensive message renderer for Pronetheia Chat
 * Supports multiple message types with specialized renderers
 */
import React, { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  UnifiedMessage,
  AgentExecutionMetadata,
  ToolResultMetadata,
  WorkflowExecutionMetadata,
} from '../../types/chat';
import {
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  Code2,
  Search,
  FileCode,
  HelpCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

import { COLORS } from '../../styles/colors';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

interface MessageRendererProps {
  message: UnifiedMessage;
  isLast?: boolean;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Collapsible section for expandable content
 */
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const styles = {
    container: {
      marginTop: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      userSelect: 'none' as const,
      transition: 'background 0.2s',
    } as React.CSSProperties,
    headerHover: {
      background: COLORS.bgAlt,
    } as React.CSSProperties,
    title: {
      flex: 1,
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.text,
    } as React.CSSProperties,
    content: {
      marginTop: '4px',
      padding: '12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      fontSize: '13px',
      lineHeight: '1.6',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.header}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, styles.headerHover);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = COLORS.bgCard;
        }}
      >
        {icon}
        <span style={styles.title}>{title}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      {isOpen && <div style={styles.content}>{children}</div>}
    </div>
  );
};

/**
 * Badge component for status indicators
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const variantColors = {
    default: { bg: COLORS.bgAlt, text: COLORS.textMuted },
    success: { bg: COLORS.success + '20', text: COLORS.successLight },
    error: { bg: COLORS.error + '20', text: COLORS.errorLight },
    warning: { bg: COLORS.warning + '20', text: COLORS.warning },
    info: { bg: COLORS.accent + '20', text: COLORS.accentLight },
  };

  const colors = variantColors[variant];

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: colors.bg,
    color: colors.text,
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return <span style={style}>{children}</span>;
};

/**
 * Code block with copy functionality
 */
interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const styles = {
    container: {
      marginTop: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: COLORS.codeBg,
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      borderBottom: `1px solid ${COLORS.border}`,
    } as React.CSSProperties,
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: COLORS.textMuted,
    } as React.CSSProperties,
    copyButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      background: 'transparent',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '4px',
      color: COLORS.text,
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    pre: {
      margin: 0,
      padding: '12px',
      background: COLORS.codeBg,
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px',
      overflowX: 'auto' as const,
      fontSize: '13px',
      lineHeight: '1.5',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    } as React.CSSProperties,
    code: {
      color: COLORS.text,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      {(filename || language) && (
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <Code2 size={14} />
            {filename && <span>{filename}</span>}
            {language && <span>({language})</span>}
          </div>
          <button style={styles.copyButton} onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <pre style={styles.pre}>
        <code style={styles.code}>{code}</code>
      </pre>
      {!filename && !language && (
        <button
          style={{
            ...styles.copyButton,
            position: 'absolute' as const,
            top: '8px',
            right: '8px',
          }}
          onClick={handleCopy}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
};

/**
 * Progress bar component
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = true,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const styles = {
    container: {
      marginTop: '8px',
    } as React.CSSProperties,
    bar: {
      width: '100%',
      height: '8px',
      background: COLORS.bgCard,
      borderRadius: '4px',
      overflow: 'hidden' as const,
    } as React.CSSProperties,
    fill: {
      height: '100%',
      background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight})`,
      width: `${percentage}%`,
      transition: 'width 0.3s ease',
    } as React.CSSProperties,
    label: {
      marginTop: '4px',
      fontSize: '12px',
      color: COLORS.textMuted,
      textAlign: 'right' as const,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.bar}>
        <div style={styles.fill} />
      </div>
      {showLabel && <div style={styles.label}>{percentage.toFixed(0)}%</div>}
    </div>
  );
};

// ============================================================================
// MESSAGE TYPE RENDERERS
// ============================================================================

/**
 * Enhanced markdown renderer with table support
 */
function renderMarkdown(content: string): string {
  // First, handle tables (must be done before line breaks)
  let result = content;

  // Parse markdown tables
  const tableRegex = /\n?\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
  result = result.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
    const rows = bodyRows.trim().split('\n').map((row: string) =>
      row.split('|').map((cell: string) => cell.trim()).filter(Boolean)
    );

    const tableStyle = 'width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;';
    const thStyle = 'padding:8px 12px;background:#1e293b;border:1px solid #334155;text-align:left;font-weight:600;color:#f1f5f9;';
    const tdStyle = 'padding:8px 12px;border:1px solid #334155;color:#cbd5e1;';

    let html = `<table style="${tableStyle}"><thead><tr>`;
    headers.forEach((h: string) => { html += `<th style="${thStyle}">${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach((row: string[]) => {
      html += '<tr>';
      row.forEach((cell: string) => { html += `<td style="${tdStyle}">${cell}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  });

  return result
    // Code blocks (must be first to avoid other replacements inside)
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre style="background:#1e293b;padding:12px;border-radius:8px;overflow-x:auto;margin:8px 0;font-size:13px;"><code>$2</code></pre>'
    )
    // Headers (h1-h4)
    .replace(/^#### (.+)$/gm, '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:#60a5fa;">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="margin:14px 0 8px;font-size:15px;font-weight:600;color:#60a5fa;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:16px 0 10px;font-size:17px;font-weight:600;color:#f1f5f9;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:20px 0 12px;font-size:20px;font-weight:700;color:#f1f5f9;">$1</h1>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #1e3a5f;margin:16px 0;"/>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:16px;list-style-type:decimal;margin-bottom:4px;">$2</li>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style-type:disc;margin-bottom:4px;">$1</li>')
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;font-size:12px;color:#60a5fa;">$1</code>'
    )
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#f1f5f9;">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:none;" target="_blank">$1</a>')
    // Line breaks (but not after block elements)
    .replace(/\n(?!<)/g, '<br/>');
}

/**
 * SECURITY: Sanitize renderMarkdown output to prevent XSS (C-1 fix)
 */
function safeRenderMarkdown(content: string): string {
  return DOMPurify.sanitize(renderMarkdown(content), {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'em', 'a', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'li', 'ul', 'ol', 'div', 'span'],
    ALLOWED_ATTR: ['style', 'href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Text Message Renderer
 */
const TextMessage: React.FC<{ message: UnifiedMessage }> = ({ message }) => {
  const renderedContent = useMemo(
    () => safeRenderMarkdown(message.content),
    [message.content]
  );

  return (
    <div
      style={{ color: COLORS.text }}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

/**
 * Agent Execution Message Renderer
 */
const AgentExecutionMessage: React.FC<{ message: UnifiedMessage }> = ({
  message,
}) => {
  const metadata = message.metadata as unknown as AgentExecutionMetadata;
  const statusVariant =
    metadata.status === 'completed'
      ? 'success'
      : metadata.status === 'failed'
      ? 'error'
      : metadata.status === 'running'
      ? 'info'
      : 'default';

  const statusIcon =
    metadata.status === 'completed' ? (
      <CheckCircle size={14} />
    ) : metadata.status === 'failed' ? (
      <XCircle size={14} />
    ) : metadata.status === 'running' ? (
      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
    ) : (
      <Play size={14} />
    );

  const styles = {
    container: {
      padding: '12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    } as React.CSSProperties,
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: COLORS.accent + '20',
      borderRadius: '8px',
      color: COLORS.accentLight,
    } as React.CSSProperties,
    info: {
      flex: 1,
    } as React.CSSProperties,
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '4px',
    } as React.CSSProperties,
    subtitle: {
      fontSize: '13px',
      color: COLORS.textMuted,
    } as React.CSSProperties,
    content: {
      marginTop: '8px',
      fontSize: '14px',
      color: COLORS.text,
      lineHeight: '1.6',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <Terminal size={18} />
        </div>
        <div style={styles.info}>
          <div style={styles.title}>Agent Execution</div>
          <div style={styles.subtitle}>ID: {metadata.execution_id}</div>
        </div>
        <Badge variant={statusVariant}>
          {statusIcon}
          {metadata.status}
        </Badge>
      </div>

      <div style={styles.content}>
        <strong>Task:</strong> {metadata.task}
      </div>

      {metadata.progress !== undefined && (
        <ProgressBar value={metadata.progress} />
      )}

      {metadata.output && (
        <Collapsible title="Output" defaultOpen={metadata.status === 'completed'}>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap' as const,
              wordBreak: 'break-word' as const,
            }}
          >
            {metadata.output}
          </pre>
        </Collapsible>
      )}
    </div>
  );
};

/**
 * Tool Result Message Renderer
 */
const ToolResultMessage: React.FC<{ message: UnifiedMessage }> = ({
  message,
}) => {
  const metadata = message.metadata as unknown as ToolResultMetadata;
  const resultString =
    typeof metadata.result === 'string'
      ? metadata.result
      : JSON.stringify(metadata.result, null, 2);

  const styles = {
    container: {
      padding: '12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    } as React.CSSProperties,
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: COLORS.success + '20',
      borderRadius: '8px',
      color: COLORS.successLight,
    } as React.CSSProperties,
    info: {
      flex: 1,
    } as React.CSSProperties,
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '4px',
    } as React.CSSProperties,
    meta: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: COLORS.textMuted,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <CheckCircle size={18} />
        </div>
        <div style={styles.info}>
          <div style={styles.title}>Tool: {metadata.tool_name}</div>
          {metadata.duration_ms && (
            <div style={styles.meta}>
              <Clock size={12} />
              <span>{metadata.duration_ms}ms</span>
            </div>
          )}
        </div>
        <Badge variant="success">Completed</Badge>
      </div>

      <Collapsible title="Result" defaultOpen icon={<Code2 size={14} />}>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-word' as const,
            fontSize: '13px',
          }}
        >
          {resultString}
        </pre>
      </Collapsible>
    </div>
  );
};

/**
 * Workflow Execution Message Renderer
 */
const WorkflowExecutionMessage: React.FC<{ message: UnifiedMessage }> = ({
  message,
}) => {
  const metadata = message.metadata as unknown as WorkflowExecutionMetadata;
  const statusVariant =
    metadata.status === 'completed'
      ? 'success'
      : metadata.status === 'failed'
      ? 'error'
      : metadata.status === 'running'
      ? 'info'
      : 'default';

  const styles = {
    container: {
      padding: '12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    } as React.CSSProperties,
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: COLORS.accent + '20',
      borderRadius: '8px',
      color: COLORS.accentLight,
    } as React.CSSProperties,
    info: {
      flex: 1,
    } as React.CSSProperties,
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '4px',
    } as React.CSSProperties,
    subtitle: {
      fontSize: '13px',
      color: COLORS.textMuted,
    } as React.CSSProperties,
    content: {
      marginTop: '8px',
      fontSize: '14px',
      color: COLORS.text,
      lineHeight: '1.6',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <Play size={18} />
        </div>
        <div style={styles.info}>
          <div style={styles.title}>Workflow Execution</div>
          <div style={styles.subtitle}>ID: {metadata.execution_id}</div>
        </div>
        <Badge variant={statusVariant}>{metadata.status}</Badge>
      </div>

      <div style={styles.content}>
        <strong>Workflow ID:</strong> {metadata.workflow_id}
      </div>

      {metadata.current_node && (
        <div style={{ ...styles.content, marginTop: '4px' }}>
          <strong>Current Node:</strong> {metadata.current_node}
        </div>
      )}

      {message.content && (
        <Collapsible title="Details" defaultOpen>
          <div
            dangerouslySetInnerHTML={{ __html: safeRenderMarkdown(message.content) }}
          />
        </Collapsible>
      )}
    </div>
  );
};

/**
 * Search Results Message Renderer
 */
const SearchResultsMessage: React.FC<{ message: UnifiedMessage }> = ({
  message,
}) => {
  const results = (message.metadata.results as any[]) || [];

  const styles = {
    container: {
      padding: '12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    } as React.CSSProperties,
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: COLORS.accent + '20',
      borderRadius: '8px',
      color: COLORS.accentLight,
    } as React.CSSProperties,
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
    } as React.CSSProperties,
    resultItem: {
      padding: '12px',
      background: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      marginTop: '8px',
    } as React.CSSProperties,
    resultTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.accentLight,
      marginBottom: '4px',
    } as React.CSSProperties,
    resultSnippet: {
      fontSize: '13px',
      color: COLORS.textMuted,
      lineHeight: '1.5',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <Search size={18} />
        </div>
        <div style={styles.title}>Search Results</div>
        <Badge variant="info">{results.length} results</Badge>
      </div>

      {results.length > 0 ? (
        results.map((result: any, index: number) => (
          <div key={index} style={styles.resultItem}>
            <div style={styles.resultTitle}>{result.title || `Result ${index + 1}`}</div>
            {result.snippet && (
              <div style={styles.resultSnippet}>{result.snippet}</div>
            )}
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '12px',
                  color: COLORS.accent,
                  textDecoration: 'none',
                }}
              >
                {result.url}
              </a>
            )}
          </div>
        ))
      ) : (
        <div style={{ fontSize: '13px', color: COLORS.textMuted }}>
          {message.content}
        </div>
      )}
    </div>
  );
};

/**
 * Code Generation Message Renderer
 */
const CodeGenerationMessage: React.FC<{ message: UnifiedMessage }> = ({
  message,
}) => {
  const files = (message.metadata.files as any[]) || [];
  const language = (message.metadata.language as string) || 'javascript';

  const styles = {
    container: {
      padding: '12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    } as React.CSSProperties,
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: COLORS.success + '20',
      borderRadius: '8px',
      color: COLORS.successLight,
    } as React.CSSProperties,
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <FileCode size={18} />
        </div>
        <div style={styles.title}>Code Generation</div>
        {files.length > 0 && <Badge variant="success">{files.length} files</Badge>}
      </div>

      {message.content && (
        <div
          style={{ marginBottom: '12px', fontSize: '14px', color: COLORS.text }}
          dangerouslySetInnerHTML={{ __html: safeRenderMarkdown(message.content) }}
        />
      )}

      {files.length > 0 ? (
        files.map((file: any, index: number) => (
          <CodeBlock
            key={index}
            code={file.content || file.code || ''}
            filename={file.filename || file.name}
            language={file.language || language}
          />
        ))
      ) : (
        <CodeBlock code={message.content} language={language} />
      )}
    </div>
  );
};

/**
 * Help Message Renderer
 */
const HelpMessage: React.FC<{ message: UnifiedMessage }> = ({ message }) => {
  const commands = (message.metadata.commands as any[]) || [];

  const styles = {
    container: {
      padding: '12px',
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    } as React.CSSProperties,
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: COLORS.accent + '20',
      borderRadius: '8px',
      color: COLORS.accentLight,
    } as React.CSSProperties,
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
    } as React.CSSProperties,
    content: {
      fontSize: '14px',
      color: COLORS.text,
      lineHeight: '1.6',
      marginBottom: '12px',
    } as React.CSSProperties,
    commandList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    } as React.CSSProperties,
    commandItem: {
      padding: '8px 12px',
      background: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
    } as React.CSSProperties,
    commandName: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.accentLight,
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    } as React.CSSProperties,
    commandDesc: {
      fontSize: '13px',
      color: COLORS.textMuted,
      marginTop: '4px',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <HelpCircle size={18} />
        </div>
        <div style={styles.title}>Help</div>
      </div>

      {message.content && (
        <div
          style={styles.content}
          dangerouslySetInnerHTML={{ __html: safeRenderMarkdown(message.content) }}
        />
      )}

      {commands.length > 0 && (
        <div style={styles.commandList}>
          {commands.map((cmd: any, index: number) => (
            <div key={index} style={styles.commandItem}>
              <div style={styles.commandName}>{cmd.command || cmd.name}</div>
              {cmd.description && (
                <div style={styles.commandDesc}>{cmd.description}</div>
              )}
              {cmd.usage && (
                <div style={{ ...styles.commandDesc, marginTop: '4px' }}>
                  Usage: {cmd.usage}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Error Message Renderer
 */
const ErrorMessage: React.FC<{ message: UnifiedMessage }> = ({ message }) => {
  const errorType = (message.metadata.error_type as string) || 'Error';
  const errorDetails = message.metadata.details as string;

  const styles = {
    container: {
      padding: '12px',
      background: COLORS.error + '10',
      border: `1px solid ${COLORS.error}`,
      borderRadius: '8px',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    } as React.CSSProperties,
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: COLORS.error + '20',
      borderRadius: '8px',
      color: COLORS.errorLight,
    } as React.CSSProperties,
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.errorLight,
    } as React.CSSProperties,
    content: {
      fontSize: '14px',
      color: COLORS.text,
      lineHeight: '1.6',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <AlertTriangle size={18} />
        </div>
        <div style={styles.title}>{errorType}</div>
        <Badge variant="error">Error</Badge>
      </div>

      <div style={styles.content}>{message.content}</div>

      {errorDetails && (
        <Collapsible title="Error Details" icon={<Code2 size={14} />}>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap' as const,
              wordBreak: 'break-word' as const,
              fontSize: '13px',
              color: COLORS.textMuted,
            }}
          >
            {errorDetails}
          </pre>
        </Collapsible>
      )}
    </div>
  );
};

// ============================================================================
// MAIN RENDERER
// ============================================================================

/**
 * MessageRenderer - Routes messages to appropriate renderer based on type
 */
export const MessageRenderer: React.FC<MessageRendererProps> = ({
  message,
  isLast = false,
}) => {
  const isUser = message.role === 'user';

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      padding: '0 24px',
    },
    wrapper: {
      display: 'flex',
      alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
      maxWidth: message.message_type === 'text' ? '80%' : '90%',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: isUser
        ? COLORS.accent
        : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 600,
      marginRight: isUser ? 0 : '12px',
      marginLeft: isUser ? '12px' : 0,
      flexShrink: 0,
    },
    bubble: {
      flex: 1,
      padding: message.message_type === 'text' ? '12px 16px' : '0',
      borderRadius:
        message.message_type === 'text'
          ? isUser
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px'
          : '0',
      background:
        message.message_type === 'text'
          ? isUser
            ? COLORS.accent
            : COLORS.bgAlt
          : 'transparent',
      color: COLORS.text,
      fontSize: '15px',
      lineHeight: '1.6',
    },
  };

  // Render appropriate component based on message type
  const renderContent = () => {
    switch (message.message_type) {
      case 'agent_execution':
        return <AgentExecutionMessage message={message} />;
      case 'tool_result':
        return <ToolResultMessage message={message} />;
      case 'workflow_execution':
        return <WorkflowExecutionMessage message={message} />;
      case 'search_results':
        return <SearchResultsMessage message={message} />;
      case 'code_generation':
        return <CodeGenerationMessage message={message} />;
      case 'help':
        return <HelpMessage message={message} />;
      case 'error':
        return <ErrorMessage message={message} />;
      case 'text':
      default:
        return <TextMessage message={message} />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.avatar}>{isUser ? 'U' : 'P'}</div>
        <div style={styles.bubble}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default MessageRenderer;
