import React from 'react';
import type { Tool } from '../../types/tools';
import { COLORS } from '../../styles/colors';

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  filesystem: '📁',
  database: '🗄️',
  api: '🔌',
  utility: '🔧',
  communication: '💬',
  'data-processing': '⚙️',
  'ml-ai': '🤖',
  testing: '🧪',
  monitoring: '📊',
  git: '🔀',
  search: '🔍',
  shell: '💻',
  custom: '🔧',
  other: '📦',
};

// MCP server display names and colors
const MCP_SERVER_DISPLAY: Record<string, { name: string; color: string }> = {
  'context7-mcp': { name: 'Context7', color: '#8b5cf6' },
  'context7': { name: 'Context7', color: '#8b5cf6' },
  'puppeteer': { name: 'Puppeteer', color: '#00d8a2' },
  'memory': { name: 'Memory', color: '#f59e0b' },
  'filesystem': { name: 'Filesystem', color: '#10b981' },
  'github': { name: 'GitHub', color: '#6e5494' },
  'brave-search': { name: 'Brave Search', color: '#fb542b' },
  'postgres': { name: 'PostgreSQL', color: '#336791' },
};

// Status colors
const STATUS_COLORS = {
  active: COLORS.success,
  inactive: COLORS.textMuted,
  deprecated: COLORS.warning,
  error: COLORS.danger,
};

interface ToolCardProps {
  tool: Tool;
  onClick: (tool: Tool) => void;
  onExecute: (tool: Tool) => void;
  onEdit: (tool: Tool) => void;
  isSelected?: boolean;
  onToggleSelect?: (toolId: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onClick,
  onExecute,
  onEdit,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleExecuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExecute(tool);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(tool);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(tool.id);
    }
  };

  const styles = {
    card: {
      backgroundColor: isSelected ? `${COLORS.accent}10` : COLORS.card,
      border: `1px solid ${isSelected ? COLORS.accent : (isHovered ? COLORS.accent : COLORS.border)}`,
      borderRadius: '12px',
      padding: '20px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      height: '100%',
      boxShadow: isHovered ? `0 4px 12px ${COLORS.accent}30` : 'none',
      position: 'relative' as const,
    },
    checkbox: {
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      border: `2px solid ${isSelected ? COLORS.accent : COLORS.border}`,
      backgroundColor: isSelected ? COLORS.accent : 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      flexShrink: 0,
      marginLeft: '8px',
    },
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
    },
    iconContainer: {
      width: '48px',
      height: '48px',
      borderRadius: '10px',
      backgroundColor: COLORS.bgAlt,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      flexShrink: 0,
    },
    titleSection: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: '16px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    source: {
      fontSize: '12px',
      color: COLORS.textMuted,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    statusBadge: {
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: `${STATUS_COLORS[tool.status]}20`,
      color: STATUS_COLORS[tool.status],
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      flexShrink: 0,
    },
    description: {
      fontSize: '14px',
      color: COLORS.textMuted,
      lineHeight: 1.5,
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      flex: 1,
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '6px',
      marginTop: '4px',
    },
    tag: {
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      backgroundColor: COLORS.bgAlt,
      color: COLORS.textMuted,
      fontWeight: 500,
    },
    mcpBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.3px',
    },
    mcpIcon: {
      fontSize: '12px',
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: '12px',
      borderTop: `1px solid ${COLORS.border}`,
      marginTop: 'auto',
    },
    stats: {
      display: 'flex',
      gap: '16px',
      fontSize: '12px',
      color: COLORS.textMuted,
    },
    stat: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    statValue: {
      fontWeight: 600,
      color: COLORS.text,
    },
    actions: {
      display: 'flex',
      gap: '8px',
    },
    button: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    executeButton: {
      backgroundColor: COLORS.accent,
      color: 'white',
    },
    editButton: {
      backgroundColor: COLORS.bgAlt,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
    },
  };

  return (
    <div
      style={styles.card}
      onClick={() => onClick(tool)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.header}>
        <div style={styles.iconContainer}>
          {CATEGORY_ICONS[tool.category] || CATEGORY_ICONS.other}
        </div>
        <div style={styles.titleSection}>
          <h3 style={styles.title} title={tool.name}>
            {tool.name}
          </h3>
          <div style={styles.source} title={tool.source}>
            {tool.source}
          </div>
        </div>
        <div style={styles.statusBadge}>{tool.status}</div>
        {/* Selection checkbox */}
        {onToggleSelect && (
          <div
            style={styles.checkbox}
            onClick={handleCheckboxClick}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = COLORS.accent;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = isSelected ? COLORS.accent : COLORS.border;
            }}
          >
            {isSelected && (
              <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        )}
      </div>

      {/* MCP Server Badge */}
      {(tool.mcp_server || tool.mcp_package) && (() => {
        const serverKey = tool.mcp_server ||
          (tool.mcp_package?.split('/').pop()?.replace('@', '') || '');
        const mcpInfo = MCP_SERVER_DISPLAY[serverKey] || {
          name: tool.mcp_server || tool.mcp_package?.split('/').pop() || 'MCP',
          color: COLORS.accent
        };
        return (
          <div
            style={{
              ...styles.mcpBadge,
              backgroundColor: `${mcpInfo.color}20`,
              color: mcpInfo.color,
            }}
            title={tool.mcp_package || tool.mcp_server}
          >
            <span style={styles.mcpIcon}>⚡</span>
            <span>{mcpInfo.name}</span>
          </div>
        );
      })()}

      <p style={styles.description} title={tool.description}>
        {tool.description}
      </p>

      {tool.tags && tool.tags.length > 0 && (
        <div style={styles.tagsContainer}>
          {tool.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={styles.tag}>
              {tag}
            </span>
          ))}
          {tool.tags.length > 3 && (
            <span style={styles.tag}>+{tool.tags.length - 3}</span>
          )}
        </div>
      )}

      <div style={styles.footer}>
        <div style={styles.stats}>
          {tool.usage_count !== undefined && (
            <div style={styles.stat}>
              <span style={styles.statValue}>{tool.usage_count}</span>
              <span>uses</span>
            </div>
          )}
          {tool.version && (
            <div style={styles.stat}>
              <span>v{tool.version}</span>
            </div>
          )}
        </div>
        <div style={styles.actions}>
          <button
            style={{ ...styles.button, ...styles.executeButton }}
            onClick={handleExecuteClick}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentLight;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accent;
            }}
          >
            Execute
          </button>
          <button
            style={{ ...styles.button, ...styles.editButton }}
            onClick={handleEditClick}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = COLORS.accent;
              e.currentTarget.style.color = COLORS.accent;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.color = COLORS.text;
            }}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
