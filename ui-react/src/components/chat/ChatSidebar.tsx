/**
 * ChatSidebar - Claude.ai-like sidebar with navigation and conversation list
 * Includes Chat/Code toggle in header and multi-select delete functionality
 * Supports resizable width with drag handle
 */
import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatSidebarProps, Conversation, GroupedConversations } from '../../types/chat';
import { COLORS } from '../../styles/colors';
import { ResizeHandle } from '../ResizeHandle';
import { CHANNEL_COLORS, CHAT_DEFAULTS, DATE_GROUP_DAYS } from '../../constants/chat';

// View mode type
type ViewMode = 'chat' | 'code';

interface ExtendedChatSidebarProps extends ChatSidebarProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  // Resizable props
  width?: number;
  isResizing?: boolean;
  resizeHandleProps?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
}

// Checkbox component for selection
const Checkbox = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onChange(); }}
    disabled={disabled}
    style={{
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      border: `2px solid ${checked ? COLORS.accent : COLORS.textMuted}`,
      background: checked ? COLORS.accent : 'transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {checked && (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </button>
);

// Conversation item props
interface ConversationItemProps {
  conv: Conversation;
  isActive: boolean;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onToggleSelection: () => void;
  onDelete: () => void;
  onRename: (id: string, title: string) => void;
}

// Channel icon components
const TelegramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const getChannelIcon = (channel?: string) => {
  switch (channel) {
    case 'telegram':
      return <TelegramIcon />;
    case 'whatsapp':
      return <WhatsAppIcon />;
    default:
      return null;
  }
};

const getChannelColor = (channel?: string) => {
  if (channel && CHANNEL_COLORS[channel]) {return CHANNEL_COLORS[channel];}
  return COLORS.textMuted;
};

// Simple conversation item - defined outside to prevent recreation on each render
const SimpleConversationItem = React.memo(({
  conv,
  isActive,
  isSelected,
  selectionMode,
  onSelect,
  onToggleSelection,
  onDelete,
  onRename,
}: ConversationItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showConfirm) {
      onDelete();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(conv.title || '');
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const handleSubmitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conv.title) {
      onRename(conv.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleClick = () => {
    if (isRenaming) {return;}
    if (selectionMode) {
      onToggleSelection();
    } else {
      onSelect();
    }
  };

  const channelIcon = getChannelIcon(conv.channel);
  const channelColor = getChannelColor(conv.channel);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowConfirm(false); }}
      style={{
        padding: '10px 14px',
        paddingRight: isHovered && !selectionMode ? '8px' : '14px',
        borderRadius: '8px',
        cursor: isRenaming ? 'default' : 'pointer',
        background: isSelected ? `${COLORS.accent}22` : isActive ? COLORS.bgHover : isHovered ? COLORS.bg : 'transparent',
        color: COLORS.text,
        fontSize: '14px',
        transition: 'background 0.15s',
        marginBottom: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        border: isSelected ? `1px solid ${COLORS.accent}44` : '1px solid transparent',
      }}
    >
      {/* Checkbox in selection mode */}
      {selectionMode && (
        <Checkbox
          checked={isSelected}
          onChange={onToggleSelection}
        />
      )}
      {/* Channel icon for non-web channels */}
      {channelIcon && (
        <span style={{ color: channelColor, display: 'flex', alignItems: 'center' }} title={`${conv.channel} conversation`}>
          {channelIcon}
        </span>
      )}
      {/* Inline rename input or title text */}
      {isRenaming ? (
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleSubmitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSubmitRename(); }
            if (e.key === 'Escape') {setIsRenaming(false);}
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            background: COLORS.bg,
            border: `1px solid ${COLORS.accent}`,
            borderRadius: '4px',
            color: COLORS.text,
            fontSize: '13px',
            padding: '2px 6px',
            outline: 'none',
          }}
          autoFocus
        />
      ) : (
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }}>
          {conv.title || 'Untitled'}
        </span>
      )}
      {/* Show action buttons only when not in selection mode */}
      {!selectionMode && isHovered && !isRenaming && (
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {showConfirm ? (
            <>
              <button
                onClick={handleDelete}
                style={{
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
                title="Confirm delete"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                onClick={handleCancelDelete}
                style={{
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  background: COLORS.bgHover,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textMuted,
                }}
                title="Cancel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Rename button (pencil) */}
              <button
                onClick={handleStartRename}
                style={{
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textMuted,
                  transition: 'color 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
                title="Rename conversation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
              {/* Delete button (trash) */}
              <button
                onClick={handleDelete}
                style={{
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textMuted,
                  transition: 'color 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
                title="Delete conversation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Group conversations by date relative to today
 */
function groupByDate(conversations: Conversation[]): GroupedConversations {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - DATE_GROUP_DAYS);

  const groups: GroupedConversations = {
    today: [],
    yesterday: [],
    previousWeek: [],
    older: [],
  };

  const sorted = [...conversations].toSorted((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  sorted.forEach(conv => {
    const date = new Date(conv.updated_at || conv.created_at);
    if (date >= today) {
      groups.today.push(conv);
    } else if (date >= yesterday) {
      groups.yesterday.push(conv);
    } else if (date >= weekAgo) {
      groups.previousWeek.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onDeleteMultipleConversations,
  onDeleteAllConversations,
  onRenameConversation,
  isCollapsed = false,
  onToggleCollapse,
  viewMode = 'chat',
  onViewModeChange,
  width = CHAT_DEFAULTS.sidebarWidth,
  isResizing = false,
  resizeHandleProps,
}: ExtendedChatSidebarProps) {
  const navigateTo = useNavigate();
  const grouped = useMemo(() => groupByDate(conversations), [conversations]);

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle selection for a single conversation
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select/deselect all
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations.map(c => c.id)));
    }
  }, [selectedIds.size, conversations]);

  // Exit selection mode and clear selections
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  // Handle bulk delete - uses delete-all endpoint when all conversations selected
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {return;}
    setIsDeleting(true);
    try {
      if (selectedIds.size === conversations.length) {
        // All visible conversations selected - use server-side delete-all
        // which handles pagination internally (deletes beyond the limit=50)
        await onDeleteAllConversations();
      } else {
        const idsToDelete = Array.from(selectedIds);
        await onDeleteMultipleConversations(idsToDelete);
      }
      exitSelectionMode();
    } catch {
      // Error handling is done by parent (ChatPage shows error banner)
    } finally {
      setIsDeleting(false);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'relative',
      width: isCollapsed ? '60px' : `${width}px`,
      minWidth: isCollapsed ? '60px' : `${width}px`,
      height: '100%',
      background: COLORS.bgAlt,
      borderRight: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: isResizing ? 'none' : 'width 0.2s, min-width 0.2s',
      overflow: 'visible',  // Allow resize handle to extend outside
    },
    header: {
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
    },
    toggleBtn: {
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: '6px',
      color: COLORS.textMuted,
      cursor: 'pointer',
    },
    viewToggleGroup: {
      display: 'flex',
      background: COLORS.bg,
      borderRadius: '6px',
      padding: '2px',
      gap: '2px',
    },
    viewToggleBtn: {
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    newChatBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      margin: '0 12px 8px',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 0.15s',
    },
    newChatIcon: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: COLORS.accentOrange,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 600,
    },
    menuSection: {
      padding: '0 12px',
      marginBottom: '8px',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: COLORS.textMuted,
      fontSize: '14px',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      transition: 'background 0.15s, color 0.15s',
    },
    menuItemActive: {
      background: COLORS.bgHover,
      color: COLORS.text,
    },
    sectionLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '16px 14px 8px',
    },
    listWrapper: {
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    empty: {
      padding: '24px 16px',
      textAlign: 'center',
      color: COLORS.textMuted,
      fontSize: '14px',
      lineHeight: '1.6',
    },
    conversationList: {
      padding: '0 8px',
    },
  };

  if (isCollapsed) {
    return (
      <nav style={styles.container}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            style={styles.toggleBtn}
            onClick={onToggleCollapse}
            onMouseOver={(e) => e.currentTarget.style.background = COLORS.bgHover}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          {/* Chat/Code toggle icons when collapsed */}
          {onViewModeChange && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => onViewModeChange('chat')}
                style={{
                  ...styles.viewToggleBtn,
                  background: viewMode === 'chat' ? COLORS.accent : 'transparent',
                  color: viewMode === 'chat' ? '#fff' : COLORS.textMuted,
                }}
                title="Chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('code')}
                style={{
                  ...styles.viewToggleBtn,
                  background: viewMode === 'code' ? COLORS.accent : 'transparent',
                  color: viewMode === 'code' ? '#fff' : COLORS.textMuted,
                }}
                title="Code"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => onNewChat()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: COLORS.accentOrange,
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav style={styles.container}>
      {/* Resize Handle */}
      {resizeHandleProps && !isCollapsed && (
        <ResizeHandle
          position="right"
          isResizing={isResizing}
          onMouseDown={resizeHandleProps.onMouseDown}
          onTouchStart={resizeHandleProps.onTouchStart}
          theme={{
            border: COLORS.border,
            hover: COLORS.textMuted,
            active: COLORS.accent,
          }}
        />
      )}
      {/* Header with collapse toggle and Chat/Code toggle */}
      <div style={styles.header}>
        {onToggleCollapse && (
          <button
            style={styles.toggleBtn}
            onClick={onToggleCollapse}
            onMouseOver={(e) => e.currentTarget.style.background = COLORS.bgHover}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            title="Collapse sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}
        {/* Chat/Code toggle icons */}
        {onViewModeChange && (
          <div style={styles.viewToggleGroup}>
            <button
              onClick={() => onViewModeChange('chat')}
              style={{
                ...styles.viewToggleBtn,
                background: viewMode === 'chat' ? COLORS.accent : 'transparent',
                color: viewMode === 'chat' ? '#fff' : COLORS.textMuted,
              }}
              title="Chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('code')}
              style={{
                ...styles.viewToggleBtn,
                background: viewMode === 'code' ? COLORS.accent : 'transparent',
                color: viewMode === 'code' ? '#fff' : COLORS.textMuted,
              }}
              title="Code"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <button
        style={styles.newChatBtn}
        onClick={() => onNewChat()}
        onMouseOver={(e) => e.currentTarget.style.background = COLORS.bgHover}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span style={styles.newChatIcon}>+</span>
        New chat
      </button>

      {/* Menu Items - removed Code */}
      <div style={styles.menuSection}>
        <button
          style={{ ...styles.menuItem, ...styles.menuItemActive }}
          onMouseOver={(e) => e.currentTarget.style.background = COLORS.bgHover}
          onMouseOut={(e) => e.currentTarget.style.background = COLORS.bgHover}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chats
        </button>
        <button
          style={styles.menuItem}
          onClick={() => navigateTo('/projects')}
          onMouseOver={(e) => {
            e.currentTarget.style.background = COLORS.bgHover;
            e.currentTarget.style.color = COLORS.text;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = COLORS.textMuted;
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Projects
        </button>
      </div>

      {/* Recents Section with Selection Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 14px 8px',
      }}>
        {selectionMode ? (
          <>
            {/* Select All checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                checked={selectedIds.size === conversations.length && conversations.length > 0}
                onChange={toggleSelectAll}
                disabled={conversations.length === 0}
              />
              <span style={{
                fontSize: '12px',
                color: COLORS.textMuted,
              }}>
                {selectedIds.size} selected
              </span>
            </div>
            {/* Selection mode actions */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedIds.size === 0 || isDeleting}
                style={{
                  padding: '4px 8px',
                  background: selectedIds.size > 0 ? '#ef4444' : COLORS.bgHover,
                  border: 'none',
                  borderRadius: '4px',
                  color: selectedIds.size > 0 ? '#fff' : COLORS.textMuted,
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                title="Delete selected"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={exitSelectionMode}
                style={{
                  padding: '4px 8px',
                  background: COLORS.bgHover,
                  border: 'none',
                  borderRadius: '4px',
                  color: COLORS.textMuted,
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                title="Cancel selection"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Recents
            </span>
            {/* Select mode toggle button */}
            {conversations.length > 0 && (
              <button
                onClick={() => setSelectionMode(true)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = COLORS.bgHover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Select multiple chats to delete"
              >
                Select
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div style={{
          margin: '0 12px 8px',
          padding: '12px',
          background: COLORS.bg,
          borderRadius: '8px',
          border: `1px solid #ef4444`,
        }}>
          <div style={{
            fontSize: '13px',
            color: COLORS.text,
            marginBottom: '12px',
          }}>
            Delete {selectedIds.size} conversation{selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              style={{
                padding: '6px 12px',
                background: COLORS.bgHover,
                border: 'none',
                borderRadius: '6px',
                color: COLORS.text,
                fontSize: '12px',
                fontWeight: 500,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.7 : 1,
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Conversation List - wrapper prevents overflow from clipping resize handle */}
      <div style={styles.listWrapper}>
        <div style={styles.list}>
          {conversations.length === 0 ? (
            <div style={styles.empty}>
              No conversations yet.<br />
              Start a new chat!
            </div>
          ) : (
            <div style={styles.conversationList}>
              {(
                [
                  { label: 'Today', items: grouped.today },
                  { label: 'Yesterday', items: grouped.yesterday },
                  { label: 'Previous 7 Days', items: grouped.previousWeek },
                  { label: 'Older', items: grouped.older },
                ] as { label: string; items: Conversation[] }[]
              )
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <div key={group.label}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: COLORS.textMuted,
                      padding: '12px 14px 6px',
                      letterSpacing: '0.3px',
                    }}>
                      {group.label}
                    </div>
                    {group.items.map((conv) => (
                      <SimpleConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === currentConversationId}
                        isSelected={selectedIds.has(conv.id)}
                        selectionMode={selectionMode}
                        onSelect={() => onSelectConversation(conv.id)}
                        onToggleSelection={() => toggleSelection(conv.id)}
                        onDelete={() => onDeleteConversation(conv.id)}
                        onRename={onRenameConversation}
                      />
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default ChatSidebar;
