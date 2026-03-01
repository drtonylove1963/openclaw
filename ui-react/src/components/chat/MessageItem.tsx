/**
 * MessageItem - Single message component with markdown rendering
 * Claude Code-like compact layout with resend capability
 * Supports GSD command output rendering
 */
import React, { useState } from 'react';
import type { MessageItemProps } from '../../types/chat';
import { COLORS } from '../../styles/colors';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GSDCommandOutput } from './GSDCommandOutput';

// Resend icon component
const ResendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

// Regenerate icon component
const RegenerateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

export function MessageItem({ message, isLast = false, onResend, onRegenerate }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [isHovered, setIsHovered] = useState(false);

  const handleResend = () => {
    if (onResend) {
      onResend(message.content);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate && message.id) {
      onRegenerate(message.id);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: '2px',
      padding: isUser ? '4px 8px' : '2px 0',
      background: isUser ? COLORS.userBg : 'transparent',
      borderRadius: isUser ? '6px' : 0,
      position: 'relative',
    },
    avatar: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: isUser ? COLORS.accent : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '11px',
      fontWeight: 600,
      flexShrink: 0,
    },
    content: {
      flex: 1,
      color: COLORS.text,
      fontSize: '13px',
      lineHeight: '1.4',
      minWidth: 0,
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      opacity: isHovered ? 1 : 0,
      transition: 'opacity 0.15s ease',
    },
    actionButton: {
      background: 'transparent',
      border: 'none',
      color: COLORS.textMuted,
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease',
    },
  };

  return (
    <div
      style={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.avatar}>
        {isUser ? 'U' : 'P'}
      </div>
      <div style={styles.content}>
        {message.gsdResult ? (
          <GSDCommandOutput
            result={message.gsdResult}
            commandName={message.gsdResult.command_type}
          />
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
      {/* User message: show resend button */}
      {isUser && onResend && (
        <div style={styles.actions}>
          <button
            style={styles.actionButton}
            onClick={handleResend}
            title="Resend this prompt"
            onMouseOver={(e) => {
              e.currentTarget.style.background = COLORS.bgAlt;
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = COLORS.textMuted;
            }}
          >
            <ResendIcon />
          </button>
        </div>
      )}
      {/* Assistant message: show regenerate button */}
      {isAssistant && onRegenerate && (
        <div style={styles.actions}>
          <button
            style={styles.actionButton}
            onClick={handleRegenerate}
            title="Regenerate this response"
            onMouseOver={(e) => {
              e.currentTarget.style.background = COLORS.bgAlt;
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = COLORS.textMuted;
            }}
          >
            <RegenerateIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageItem;
