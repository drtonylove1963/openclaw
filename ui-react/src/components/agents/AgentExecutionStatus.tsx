import React, { useState, useEffect, useRef } from 'react';
import type { Execution } from '../../types/agent';
import { COLORS } from '../../styles/colors';

interface ExecutionStatusProps {
  executionId: string;
  onComplete?: () => void;
}

export const AgentExecutionStatus: React.FC<ExecutionStatusProps> = ({
  executionId,
  onComplete,
}) => {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchExecutionStatus = async () => {
    try {
      const response = await fetch(`/api/v1/agents/executions/${executionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch execution status: ${response.statusText}`);
      }
      const data = await response.json();
      setExecution(data);
      setLoading(false);

      // Stop polling if status is terminal
      if (['completed', 'failed', 'cancelled'].includes(data.status)) {
        setPolling(false);
        if (data.status === 'completed' && onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      console.error('Error fetching execution status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load execution status');
      setLoading(false);
      setPolling(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchExecutionStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(() => {
      if (polling) {
        fetchExecutionStatus();
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [executionId, polling]);

  // Stop polling when status becomes terminal
  useEffect(() => {
    if (!polling && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, [polling]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return COLORS.pending;
      case 'running':
        return COLORS.accent;
      case 'completed':
        return COLORS.success;
      case 'failed':
        return COLORS.danger;
      case 'cancelled':
        return COLORS.warning;
      default:
        return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '▶';
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'cancelled':
        return '⊗';
      default:
        return '◯';
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) {return 'N/A';}
    if (ms < 1000) {return `${ms}ms`;}
    if (ms < 60000) {return `${(ms / 1000).toFixed(1)}s`;}
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatCost = (cost?: number): string => {
    if (!cost) {return '$0.00';}
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens?: number): string => {
    if (!tokens) {return '0';}
    return tokens.toLocaleString();
  };

  const formatOutput = (output: any): string => {
    if (!output) {return '';}
    if (typeof output === 'string') {return output;}
    return JSON.stringify(output, null, 2);
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    statusHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '20px 24px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
    },
    statusIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      flexShrink: 0,
    },
    statusInfo: {
      flex: 1,
      minWidth: 0,
    },
    statusLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '4px',
    },
    statusValue: {
      fontSize: '18px',
      fontWeight: 700,
      letterSpacing: '-0.2px',
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '3px solid rgba(255, 255, 255, 0.2)',
      borderTop: '3px solid #ffffff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    progressBar: {
      width: '100%',
      height: '4px',
      backgroundColor: COLORS.card,
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '12px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: COLORS.accent,
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
    },
    metricCard: {
      backgroundColor: COLORS.bgAlt,
      borderRadius: '10px',
      padding: '16px',
      border: `1px solid ${COLORS.border}`,
    },
    metricLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '6px',
    },
    metricValue: {
      fontSize: '16px',
      fontWeight: 700,
      color: COLORS.text,
    },
    taskSection: {
      backgroundColor: COLORS.bgAlt,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${COLORS.border}`,
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 700,
      color: COLORS.text,
      marginBottom: '12px',
      letterSpacing: '-0.1px',
    },
    taskText: {
      fontSize: '14px',
      color: COLORS.textMuted,
      lineHeight: 1.6,
    },
    outputContainer: {
      backgroundColor: COLORS.bg,
      borderRadius: '10px',
      padding: '16px',
      border: `1px solid ${COLORS.border}`,
      maxHeight: '400px',
      overflowY: 'auto' as const,
    },
    outputText: {
      fontFamily: "'Fira Code', 'Courier New', monospace",
      fontSize: '13px',
      lineHeight: 1.7,
      color: COLORS.text,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
    },
    errorContainer: {
      backgroundColor: `${COLORS.danger}15`,
      border: `1px solid ${COLORS.danger}40`,
      borderRadius: '10px',
      padding: '16px',
    },
    errorText: {
      color: COLORS.danger,
      fontSize: '13px',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      border: `4px solid ${COLORS.border}`,
      borderTop: `4px solid ${COLORS.accent}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
  };

  if (loading && !execution) {
    return (
      <div style={styles.container}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { transform: translateX(-100%); }
              50% { transform: translateX(100%); }
            }
          `}
        </style>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorText}>{error}</div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return null;
  }

  const statusColor = getStatusColor(execution.status);
  const statusIcon = getStatusIcon(execution.status);
  const isRunning = execution.status === 'running';

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
        `}
      </style>

      {/* Status Header */}
      <div style={styles.statusHeader}>
        <div
          style={{
            ...styles.statusIcon,
            backgroundColor: `${statusColor}20`,
            border: `2px solid ${statusColor}40`,
          }}
        >
          {isRunning ? <div style={styles.spinner} /> : statusIcon}
        </div>
        <div style={styles.statusInfo}>
          <div style={styles.statusLabel}>Execution Status</div>
          <div style={{ ...styles.statusValue, color: statusColor }}>
            {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
          </div>
          {isRunning && (
            <div style={styles.progressBar}>
              <div style={styles.progressFill} />
            </div>
          )}
        </div>
      </div>

      {/* Task Description */}
      <div style={styles.taskSection}>
        <div style={styles.sectionTitle}>Task</div>
        <div style={styles.taskText}>{execution.task}</div>
      </div>

      {/* Metrics */}
      {(execution.tokens_total || execution.duration_ms || execution.cost_usd) && (
        <div style={styles.metricsGrid}>
          {execution.tokens_total !== undefined && (
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Tokens Used</div>
              <div style={styles.metricValue}>{formatTokens(execution.tokens_total)}</div>
            </div>
          )}
          {execution.duration_ms !== undefined && (
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Duration</div>
              <div style={styles.metricValue}>{formatDuration(execution.duration_ms)}</div>
            </div>
          )}
          {execution.cost_usd !== undefined && (
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Cost</div>
              <div style={styles.metricValue}>{formatCost(execution.cost_usd)}</div>
            </div>
          )}
        </div>
      )}

      {/* Output or Error */}
      {execution.status === 'completed' && execution.output_data && (
        <div style={styles.taskSection}>
          <div style={styles.sectionTitle}>Output</div>
          <div style={styles.outputContainer}>
            <pre style={styles.outputText}>{formatOutput(execution.output_data)}</pre>
          </div>
        </div>
      )}

      {execution.status === 'failed' && execution.error_message && (
        <div style={styles.errorContainer}>
          <div style={{ ...styles.sectionTitle, color: COLORS.danger, marginBottom: '8px' }}>
            Error
          </div>
          <div style={styles.errorText}>{execution.error_message}</div>
        </div>
      )}

      {/* Execution ID for debugging */}
      <div
        style={{
          fontSize: '11px',
          color: COLORS.textMuted,
          fontFamily: "'Fira Code', 'Courier New', monospace",
          textAlign: 'center' as const,
        }}
      >
        Execution ID: {execution.id}
      </div>
    </div>
  );
};

export default AgentExecutionStatus;
