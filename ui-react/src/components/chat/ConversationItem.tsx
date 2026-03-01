/**
 * ConversationItem - Single conversation item with edit/delete actions
 *
 * Features:
 * - Inline title editing with keyboard shortcuts (Enter/Escape)
 * - Hover actions (rename, delete)
 * - Active state highlighting
 * - Title truncation with tooltip
 * - Confirmation dialog for delete
 *
 * Usage:
 * <ConversationItem
 *   conversation={conv}
 *   isActive={conv.id === currentId}
 *   onSelect={() => handleSelect(conv.id)}
 *   onDelete={() => handleDelete(conv.id)}
 *   onRename={(title) => handleRename(conv.id, title)}
 * />
 */
import React, { useState, useRef, useEffect } from 'react';
import type { ConversationItemProps } from '../../types/chat';
import { COLORS } from '../../styles/colors';

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title || '');
      setIsEditing(false);
    }
  };

  const displayTitle = conversation.title || 'New conversation';
  const truncatedTitle = displayTitle.length > 28
    ? displayTitle.substring(0, 28) + '...'
    : displayTitle;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      background: isActive ? COLORS.bgAlt : 'transparent',
      border: isActive ? `1px solid ${COLORS.border}` : '1px solid transparent',
      transition: 'all 0.15s',
      marginBottom: '4px',
    },
    icon: {
      width: '20px',
      height: '20px',
      marginRight: '10px',
      color: isActive ? COLORS.accent : COLORS.textMuted,
      flexShrink: 0,
    },
    title: {
      flex: 1,
      fontSize: '14px',
      color: isActive ? COLORS.text : COLORS.textMuted,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    input: {
      flex: 1,
      background: COLORS.bg,
      border: `1px solid ${COLORS.accent}`,
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '14px',
      color: COLORS.text,
      outline: 'none',
    },
    actions: {
      display: 'flex',
      gap: '4px',
      opacity: isHovered && !isEditing ? 1 : 0,
      transition: 'opacity 0.15s',
    },
    actionBtn: {
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: '4px',
      color: COLORS.textMuted,
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
  };

  return (
    <div
      style={styles.container}
      onClick={() => !isEditing && onSelect()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Conversation: ${displayTitle}`}
      aria-current={isActive ? 'true' : 'false'}
    >
      <svg
        style={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {isEditing ? (
        <input
          ref={inputRef}
          style={styles.input}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          aria-label="Edit conversation title"
        />
      ) : (
        <span style={styles.title} title={displayTitle}>
          {truncatedTitle}
        </span>
      )}

      <div style={styles.actions}>
        <button
          style={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            setEditTitle(conversation.title || '');
            setIsEditing(true);
          }}
          title="Rename conversation"
          aria-label="Rename conversation"
          onMouseOver={(e) => e.currentTarget.style.background = COLORS.bgAlt}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          style={{ ...styles.actionBtn }}
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this conversation? This action cannot be undone.')) {
              onDelete();
            }
          }}
          title="Delete conversation"
          aria-label="Delete conversation"
          onMouseOver={(e) => {
            e.currentTarget.style.background = COLORS.bgAlt;
            e.currentTarget.style.color = COLORS.danger;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = COLORS.textMuted;
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ConversationItem;
