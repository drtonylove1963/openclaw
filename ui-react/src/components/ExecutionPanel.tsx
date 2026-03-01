import React from 'react';
import { COLORS } from '../styles/colors';

interface ExecutionPanelProps {
  status: 'idle' | 'running' | 'success' | 'error';
  logs?: string[];
  onClose: () => void;
}

export function ExecutionPanel({ status, logs = [], onClose }: ExecutionPanelProps) {
  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: COLORS.sidebar,
      color: COLORS.text,
    },
    header: {
      padding: '12px 16px',
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    title: {
      fontSize: '14px',
      fontWeight: 600,
      margin: 0,
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 500,
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      color: COLORS.textMuted,
      cursor: 'pointer',
      fontSize: '18px',
      padding: '4px 8px',
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: '12px 16px',
      fontFamily: 'monospace',
      fontSize: '13px',
      backgroundColor: COLORS.bg,
    },
    logLine: {
      padding: '4px 0',
      borderBottom: `1px solid ${COLORS.bgHover}`,
    },
    timestamp: {
      color: COLORS.textDim,
      marginRight: '12px',
    },
    emptyState: {
      color: COLORS.textDim,
      textAlign: 'center' as const,
      padding: '24px',
    },
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'running':
        return { backgroundColor: COLORS.warning, color: COLORS.bg };
      case 'success':
        return { backgroundColor: COLORS.success, color: 'white' };
      case 'error':
        return { backgroundColor: COLORS.error, color: 'white' };
      default:
        return { backgroundColor: COLORS.bgActive, color: 'white' };
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return '⏳ Running';
      case 'success':
        return '✅ Success';
      case 'error':
        return '❌ Error';
      default:
        return '⏸️ Idle';
    }
  };

  const sampleLogs = status !== 'idle' ? [
    { time: '12:00:01', message: 'Workflow execution started' },
    { time: '12:00:02', message: 'Processing trigger node...' },
    { time: '12:00:03', message: 'Executing agent: Developer' },
    ...(status === 'success' ? [
      { time: '12:00:15', message: 'Agent completed successfully' },
      { time: '12:00:16', message: 'Workflow finished' },
    ] : []),
    ...(status === 'error' ? [
      { time: '12:00:10', message: 'Error: Connection timeout' },
    ] : []),
    ...(status === 'running' ? [
      { time: '12:00:04', message: 'Waiting for LLM response...' },
    ] : []),
  ] : [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleArea}>
          <h3 style={styles.title}>Execution</h3>
          <span style={{ ...styles.statusBadge, ...getStatusStyle() }}>
            {getStatusText()}
          </span>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>

      <div style={styles.content}>
        {sampleLogs.length > 0 ? (
          sampleLogs.map((log, index) => (
            <div key={index} style={styles.logLine}>
              <span style={styles.timestamp}>[{log.time}]</span>
              <span>{log.message}</span>
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            No execution logs. Click "Execute" to run the workflow.
          </div>
        )}
      </div>
    </div>
  );
}
