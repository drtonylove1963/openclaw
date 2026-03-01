/**
 * ToolActivityDisplay - Claude Code-like tool execution visibility
 * Shows real-time tool execution with status, inputs, and results
 */
import React from 'react';
import type { ToolActivity } from '../../types/chat';
import { COLORS } from '../../styles/colors';

interface ToolActivityDisplayProps {
  activities: ToolActivity[];
  statusMessage?: string | null;
}

export function ToolActivityDisplay({ activities, statusMessage }: ToolActivityDisplayProps) {
  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '4px 0',
      marginBottom: '2px',
    },
    statusBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      background: COLORS.bgAlt,
      borderRadius: '4px',
      marginBottom: '4px',
      fontSize: '11px',
      color: COLORS.textMuted,
    },
    spinner: {
      width: '12px',
      height: '12px',
      border: `2px solid ${COLORS.border}`,
      borderTopColor: COLORS.accent,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    activityList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    activityItem: {
      display: 'flex',
      flexDirection: 'column',
      padding: '6px 10px',
      background: COLORS.bgTool,
      borderRadius: '4px',
      border: `1px solid ${COLORS.border}`,
    },
    activityHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    toolIcon: {
      fontSize: '12px',
    },
    toolName: {
      fontWeight: 600,
      fontSize: '12px',
      color: COLORS.text,
      fontFamily: 'monospace',
    },
    statusBadge: {
      marginLeft: 'auto',
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 500,
    },
    inputSection: {
      marginTop: '4px',
      padding: '4px 6px',
      background: COLORS.bg,
      borderRadius: '3px',
      fontSize: '10px',
      fontFamily: 'monospace',
      color: COLORS.textMuted,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    resultSection: {
      marginTop: '4px',
      padding: '4px 6px',
      background: COLORS.bg,
      borderRadius: '3px',
      fontSize: '10px',
      fontFamily: 'monospace',
      color: COLORS.textMuted,
      maxHeight: '60px',
      overflow: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
    label: {
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: COLORS.textMuted,
      marginBottom: '2px',
    },
  };

  // Status badge styles based on status
  const getStatusBadgeStyle = (status: ToolActivity['status']): React.CSSProperties => {
    const baseStyle = { ...styles.statusBadge };
    switch (status) {
      case 'running':
        return {
          ...baseStyle,
          background: `${COLORS.accent}20`,
          color: COLORS.accent,
        };
      case 'success':
        return {
          ...baseStyle,
          background: `${COLORS.success}20`,
          color: COLORS.success,
        };
      case 'error':
        return {
          ...baseStyle,
          background: `${COLORS.error}20`,
          color: COLORS.error,
        };
      default:
        return baseStyle;
    }
  };

  const getStatusIcon = (status: ToolActivity['status']): string => {
    switch (status) {
      case 'running':
        return '⚡';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  const getStatusText = (status: ToolActivity['status']): string => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'success':
        return 'Complete';
      case 'error':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatInput = (input?: Record<string, unknown>): string => {
    if (!input || Object.keys(input).length === 0) {return 'No input';}
    const entries = Object.entries(input).slice(0, 3);
    const formatted = entries.map(([k, v]) => {
      const val = typeof v === 'string' ? v.slice(0, 50) : JSON.stringify(v).slice(0, 50);
      return `${k}: ${val}`;
    }).join(', ');
    return Object.keys(input).length > 3 ? `${formatted}...` : formatted;
  };

  if (activities.length === 0 && !statusMessage) {
    return null;
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {statusMessage && (
        <div style={styles.statusBar}>
          <div style={styles.spinner} />
          <span>{statusMessage}</span>
        </div>
      )}

      {activities.length > 0 && (
        <div style={styles.activityList}>
          {activities.map((activity) => (
            <div key={activity.id} style={styles.activityItem}>
              <div style={styles.activityHeader}>
                <span style={styles.toolIcon}>{getStatusIcon(activity.status)}</span>
                <span style={styles.toolName}>{activity.tool}</span>
                <span style={getStatusBadgeStyle(activity.status)}>
                  {getStatusText(activity.status)}
                </span>
              </div>

              {activity.input && Object.keys(activity.input).length > 0 && (
                <div>
                  <div style={styles.label}>Input</div>
                  <div style={styles.inputSection}>
                    {formatInput(activity.input)}
                  </div>
                </div>
              )}

              {activity.result && (
                <div>
                  <div style={styles.label}>Result</div>
                  <div style={styles.resultSection}>
                    {activity.result}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ToolActivityDisplay;
