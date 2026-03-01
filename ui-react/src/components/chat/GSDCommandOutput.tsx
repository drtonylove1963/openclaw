/**
 * GSDCommandOutput - Renders GSD command responses in chat
 * Displays command results with success/failure status, data, and next actions
 */
import React from 'react';
import { COLORS } from '../../styles/colors';
import { MarkdownRenderer } from './MarkdownRenderer';

// GSD command result from backend
export interface GSDCommandResultData {
  success: boolean;
  command_type: string;
  message: string;
  data?: Record<string, unknown>;
  next_action?: string;
  requires_followup?: boolean;
  streaming?: boolean;
  followup_prompt?: string;
}

interface GSDCommandOutputProps {
  result: GSDCommandResultData;
  commandName?: string;
}

/**
 * Render a GSD command result in the chat
 */
export function GSDCommandOutput({ result, commandName }: GSDCommandOutputProps) {
  const { success, command_type, message, data, next_action } = result;

  // Get status icon and color
  const statusIcon = success ? '\u2713' : '\u2717';
  const statusColor = success ? COLORS.success : COLORS.error;

  return (
    <div style={styles.container} data-testid="gsd-command-output">
      {/* Header with command name and status */}
      <div style={styles.header}>
        <span style={{ ...styles.statusIcon, color: statusColor }} data-testid="gsd-status-icon">
          {statusIcon}
        </span>
        <span style={styles.commandName} data-testid="gsd-command-name">
          /gsd:{commandName || command_type}
        </span>
        <span style={{ ...styles.statusBadge, background: success ? COLORS.successLight : COLORS.errorLight, color: statusColor }}>
          {success ? 'Success' : 'Failed'}
        </span>
      </div>

      {/* Message content with markdown support */}
      <div style={styles.message} data-testid="gsd-message">
        <MarkdownRenderer content={message} />
      </div>

      {/* Data display for commands that return structured data */}
      {data && Object.keys(data).length > 0 && (
        <div style={styles.dataSection} data-testid="gsd-data">
          <GSDDataDisplay data={data} />
        </div>
      )}

      {/* Next action suggestion */}
      {next_action && (
        <div style={styles.nextAction} data-testid="gsd-next-action">
          <span style={styles.nextActionLabel}>Next:</span>
          <span style={styles.nextActionText}>{next_action}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Display structured data from GSD commands
 */
interface GSDDataDisplayProps {
  data: Record<string, unknown>;
}

function GSDDataDisplay({ data }: GSDDataDisplayProps) {
  // Special renderers for known data types
  if ('todos' in data && Array.isArray(data.todos)) {
    return <GSDTodoList todos={data.todos as string[]} />;
  }

  if ('phase_count' in data || 'completed_plans' in data) {
    return <GSDProgressTable data={data} />;
  }

  if ('project_path' in data) {
    return <GSDProjectInfo data={data} />;
  }

  // Default: render as key-value pairs
  return (
    <div style={styles.dataTable}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} style={styles.dataRow}>
          <span style={styles.dataKey}>{formatKey(key)}:</span>
          <span style={styles.dataValue}>{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Render a todo list
 */
function GSDTodoList({ todos }: { todos: string[] }) {
  if (todos.length === 0) {
    return <p style={styles.emptyText}>No pending todos</p>;
  }

  return (
    <ul style={styles.todoList}>
      {todos.map((todo, index) => (
        <li key={index} style={styles.todoItem}>
          <span style={styles.todoCheckbox}>{'\u2610'}</span>
          {todo}
        </li>
      ))}
    </ul>
  );
}

/**
 * Render progress table for audit/progress commands
 */
function GSDProgressTable({ data }: { data: Record<string, unknown> }) {
  const rows = [
    { label: 'Phases', value: data.phase_count },
    { label: 'Plans Completed', value: `${data.completed_plans}/${data.total_plans}` },
    { label: 'Completion', value: `${data.completion_pct ?? 0}%` },
  ].filter(row => row.value !== undefined);

  return (
    <table style={styles.progressTable}>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <td style={styles.tableLabel}>{row.label}</td>
            <td style={styles.tableValue}>{String(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Render project info for new-project command
 */
function GSDProjectInfo({ data }: { data: Record<string, unknown> }) {
  const projectName = data.project_name ? String(data.project_name) : null;
  const projectPath = data.project_path ? String(data.project_path) : null;
  const gitInitialized = Boolean(data.git_initialized);
  const githubCreated = Boolean(data.github_created);

  return (
    <div style={styles.projectInfo}>
      {projectName && (
        <div style={styles.projectName}>{projectName}</div>
      )}
      {projectPath && (
        <code style={styles.projectPath}>{projectPath}</code>
      )}
      <div style={styles.projectFlags}>
        {gitInitialized && <span style={styles.flag}>Git</span>}
        {githubCreated && <span style={styles.flag}>GitHub</span>}
      </div>
    </div>
  );
}

// Helper functions
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {return '-';}
  if (typeof value === 'boolean') {return value ? 'Yes' : 'No';}
  if (Array.isArray(value)) {return value.join(', ');}
  if (typeof value === 'object') {return JSON.stringify(value);}
  return String(value);
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: COLORS.bgPanel,
    border: `1px solid ${COLORS.border}`,
    borderLeft: `3px solid ${COLORS.accent}`,
    borderRadius: '12px',
    padding: '16px',
    margin: '12px 0',
    maxWidth: '700px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  statusIcon: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  commandName: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.accent,
    background: COLORS.bgHover,
    padding: '4px 8px',
    borderRadius: '4px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  message: {
    color: COLORS.text,
    fontSize: '14px',
    lineHeight: '1.6',
  },
  dataSection: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  dataTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dataRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
  },
  dataKey: {
    color: COLORS.textMuted,
    minWidth: '120px',
    flexShrink: 0,
  },
  dataValue: {
    color: COLORS.text,
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  nextAction: {
    marginTop: '16px',
    padding: '12px',
    background: COLORS.accentMuted,
    borderRadius: '8px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  nextActionLabel: {
    color: COLORS.accent,
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  nextActionText: {
    color: COLORS.text,
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  todoList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  todoItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    fontSize: '13px',
    color: COLORS.text,
    marginBottom: '6px',
  },
  todoCheckbox: {
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: '13px',
    fontStyle: 'italic',
    margin: 0,
  },
  progressTable: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: '300px',
  },
  tableLabel: {
    color: COLORS.textMuted,
    fontSize: '13px',
    padding: '6px 12px 6px 0',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  tableValue: {
    color: COLORS.text,
    fontSize: '13px',
    fontWeight: 500,
    padding: '6px 0',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  projectInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  projectName: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.text,
  },
  projectPath: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    background: COLORS.bgHover,
    padding: '6px 10px',
    borderRadius: '4px',
    wordBreak: 'break-all',
  },
  projectFlags: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  flag: {
    fontSize: '11px',
    fontWeight: 500,
    color: COLORS.success,
    background: COLORS.successLight,
    padding: '2px 8px',
    borderRadius: '4px',
  },
};

export default GSDCommandOutput;
