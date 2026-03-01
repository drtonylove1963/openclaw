/**
 * MessageList - Scrollable list of messages with auto-scroll
 * Includes Claude Code-like tool activity and execution progress display
 */
import React, { useRef, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { MessageItem } from './MessageItem';
import { ToolActivityDisplay } from './ToolActivityDisplay';
import { ExecutionProgress } from './ExecutionProgress';
import type { ExecutionStep } from '../../types/chat';
import type { MessageListProps, ToolActivity } from '../../types/chat';
import { COLORS } from '../../styles/colors';
import { PulsingPronetheiaLogo } from '../shared/PulsingPronetheiaLogo';

// Enhanced markdown renderer with table support and proper list handling (must match MessageItem.tsx)
function renderMarkdown(content: string): string {
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

  // Process code blocks first to protect them
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#1e293b;padding:12px;border-radius:6px;overflow-x:auto;margin:8px 0;font-size:13px;"><code>$2</code></pre>');

  // Process headers
  result = result
    .replace(/^#### (.+)$/gm, '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:#60a5fa;">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="margin:14px 0 8px;font-size:15px;font-weight:600;color:#60a5fa;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:16px 0 10px;font-size:17px;font-weight:600;color:#f1f5f9;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:20px 0 12px;font-size:20px;font-weight:700;color:#f1f5f9;">$1</h1>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #1e3a5f;margin:16px 0;"/>');

  // Process numbered lists - preserve original numbers and style consistently
  const listItemStyle = 'margin-bottom:6px;color:#cbd5e1;padding-left:8px;';
  result = result.replace(/^(\d+)\. (.+)$/gm,
    `<div style="${listItemStyle}"><span style="color:#60a5fa;font-weight:500;margin-right:8px;">$1.</span>$2</div>`
  );

  // Process unordered lists - style as indented bullet points
  const bulletStyle = 'margin-bottom:4px;color:#cbd5e1;margin-left:40px;padding-left:20px;position:relative;';
  result = result.replace(/^- (.+)$/gm,
    `<div style="${bulletStyle}"><span style="position:absolute;left:0;color:#60a5fa;">•</span>$1</div>`
  );

  // Process inline elements
  return result
    .replace(/`([^`]+)`/g, '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;font-size:12px;color:#60a5fa;">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#f1f5f9;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:none;" target="_blank">$1</a>')
    .replace(/\n(?!<)/g, '<br/>');
}

interface ExtendedMessageListProps extends MessageListProps {
  toolActivities?: ToolActivity[];
  statusMessage?: string | null;
  streamingContent?: string | null;
  executionSteps?: ExecutionStep[];
  currentPhase?: string | null;
  isStreaming?: boolean;
}

export function MessageList({
  messages,
  isLoading = false,
  toolActivities = [],
  statusMessage = null,
  streamingContent = null,
  executionSteps = [],
  currentPhase = null,
  isStreaming = false,
  onResendMessage,
  onRegenerateMessage,
}: ExtendedMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or execution updates
  // Uses scrollTop for more reliable scrolling during streaming
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages, toolActivities, statusMessage, streamingContent, executionSteps, isLoading]);

  // Also scroll on streaming content changes (more frequent updates)
  useEffect(() => {
    if (streamingContent && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [streamingContent]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      flex: 1,
      overflowY: 'auto',
      padding: '4px 0',
    },
    empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: COLORS.textMuted,
      textAlign: 'center',
      padding: '24px',
    },
    emptyIcon: {
      fontSize: '28px',
      marginBottom: '8px',
      opacity: 0.5,
    },
    loadingDot: {
      display: 'inline-block',
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      background: COLORS.textMuted,
      margin: '0 2px',
      animation: 'pulse 1.5s infinite',
    },
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>💬</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#f1f5f9' }}>
            Start a conversation
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Send a message to begin chatting with Pronetheia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.container}>
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
          onResend={onResendMessage}
          onRegenerate={onRegenerateMessage}
        />
      ))}
      {/* Claude Code-style execution progress display - show whenever there are steps */}
      {(executionSteps.length > 0 || currentPhase) && (
        <ExecutionProgress
          steps={executionSteps}
          currentPhase={currentPhase || undefined}
          statusMessage={statusMessage}
          isStreaming={isStreaming || isLoading}
        />
      )}
      {isLoading && (
        <>
          {/* Fallback: Tool activity display for legacy/MCP tools */}
          {executionSteps.length === 0 && (toolActivities.length > 0 || statusMessage) && (
            <ToolActivityDisplay
              activities={toolActivities}
              statusMessage={statusMessage}
            />
          )}
          {/* Streaming content - show assistant response as it arrives with markdown rendering */}
          {streamingContent && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '2px', padding: '2px 0' }}>
              <PulsingPronetheiaLogo size={28} />
              <div
                style={{
                  flex: 1,
                  color: '#f1f5f9',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(streamingContent)) }}
              />
            </div>
          )}
          {/* Simple loading indicator for LLM Mode - pulsing logo with "Processing Request" */}
          {executionSteps.length === 0 && toolActivities.length === 0 && !statusMessage && !streamingContent && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
              padding: '12px 16px',
              background: '#0f1f38',
              borderRadius: '12px',
              border: '1px solid #1e3a5f',
            }}>
              <PulsingPronetheiaLogo size={36} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 500 }}>Processing Request</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Generating response...</span>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
