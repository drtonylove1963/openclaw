import React, { useState, useEffect } from 'react';
import type { Execution } from '../../types/agent';
import { COLORS } from '../../styles/colors';

interface AgentHistoryProps {
  agentId?: string;  // Optional - filter to specific agent
}

export const AgentHistory: React.FC<AgentHistoryProps> = ({ agentId }) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'duration_ms' | 'cost_usd' | 'tokens_total'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
          sort_by: sortBy,
          sort_order: sortOrder,
        });

        if (agentId) {
          params.append('agent_id', agentId);
        }

        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        const response = await fetch(`/api/v1/agents/executions?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch executions: ${response.statusText}`);
        }
        const data = await response.json();
        setExecutions(data);
      } catch (err) {
        console.error('Error fetching executions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load executions');
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();
  }, [agentId, statusFilter, sortBy, sortOrder, page, pageSize]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'failed':
        return COLORS.danger;
      case 'running':
        return COLORS.accent;
      case 'pending':
        return COLORS.textMuted;
      default:
        return COLORS.textMuted;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {return `${days}d ago`;}
    if (hours > 0) {return `${hours}h ago`;}
    if (minutes > 0) {return `${minutes}m ago`;}
    return 'Just now';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) {return `${ms}ms`;}
    if (ms < 60000) {return `${(ms / 1000).toFixed(1)}s`;}
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatCost = (usd: number) => {
    if (usd < 0.01) {return `$${(usd * 100).toFixed(3)}c`;}
    return `$${usd.toFixed(4)}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {return text;}
    return text.substring(0, maxLength) + '...';
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleRowClick = (execution: Execution) => {
    setSelectedExecution(execution);
  };

  const handleCloseDetail = () => {
    setSelectedExecution(null);
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap' as const,
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      color: COLORS.text,
      letterSpacing: '-0.3px',
    },
    filters: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
    },
    select: {
      padding: '8px 12px',
      backgroundColor: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      cursor: 'pointer',
      outline: 'none',
    },
    tableContainer: {
      backgroundColor: COLORS.card,
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    thead: {
      backgroundColor: COLORS.bgAlt,
      borderBottom: `1px solid ${COLORS.border}`,
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left' as const,
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      cursor: 'pointer',
      userSelect: 'none' as const,
    },
    tr: {
      borderBottom: `1px solid ${COLORS.border}`,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    },
    trEven: {
      backgroundColor: `${COLORS.bgAlt}40`,
    },
    td: {
      padding: '12px 16px',
      fontSize: '14px',
      color: COLORS.text,
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    emptyState: {
      padding: '60px 32px',
      textAlign: 'center' as const,
      color: COLORS.textMuted,
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
    },
    emptyText: {
      fontSize: '16px',
      fontWeight: 600,
      marginBottom: '8px',
    },
    emptySubtext: {
      fontSize: '14px',
      color: COLORS.textMuted,
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      alignItems: 'center',
    },
    pageButton: {
      padding: '8px 16px',
      backgroundColor: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    pageInfo: {
      fontSize: '14px',
      color: COLORS.textMuted,
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 32px',
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      border: `4px solid ${COLORS.border}`,
      borderTop: `4px solid ${COLORS.accent}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    errorContainer: {
      backgroundColor: `${COLORS.danger}15`,
      border: `1px solid ${COLORS.danger}40`,
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    errorIcon: {
      fontSize: '20px',
      color: COLORS.danger,
    },
    errorText: {
      color: COLORS.danger,
      fontSize: '14px',
      fontWeight: 500,
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(4px)',
    },
    modalContent: {
      backgroundColor: COLORS.card,
      borderRadius: '20px',
      border: `1px solid ${COLORS.border}`,
      maxWidth: '700px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto',
      padding: '32px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 700,
      color: COLORS.text,
    },
    closeButton: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.bgAlt,
      color: COLORS.textMuted,
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    detailSection: {
      marginBottom: '20px',
    },
    detailLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    detailValue: {
      fontSize: '14px',
      color: COLORS.text,
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.container}>
        <div style={styles.header}>
          {!agentId && <h2 style={styles.title}>Execution History</h2>}
          <div style={styles.filters}>
            <select
              style={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
          </div>
        )}

        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {!loading && !error && executions.length === 0 && (
          <div style={styles.tableContainer}>
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <div style={styles.emptyText}>No executions found</div>
              <div style={styles.emptySubtext}>
                {statusFilter !== 'all'
                  ? `No ${statusFilter} executions yet`
                  : 'Start executing agents to see their history here'}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && executions.length > 0 && (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    {!agentId && (
                      <th style={styles.th}>
                        Agent
                      </th>
                    )}
                    <th style={styles.th}>
                      Task
                    </th>
                    <th style={styles.th}>
                      Status
                    </th>
                    <th style={styles.th} onClick={() => handleSort('tokens_total')}>
                      Tokens {sortBy === 'tokens_total' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={styles.th} onClick={() => handleSort('duration_ms')}>
                      Duration {sortBy === 'duration_ms' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={styles.th} onClick={() => handleSort('cost_usd')}>
                      Cost {sortBy === 'cost_usd' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={styles.th} onClick={() => handleSort('created_at')}>
                      Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((execution, index) => (
                    <tr
                      key={execution.id}
                      style={{
                        ...styles.tr,
                        ...(index % 2 === 1 ? styles.trEven : {}),
                      }}
                      onClick={() => handleRowClick(execution)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = `${COLORS.accent}10`;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 1 ? `${COLORS.bgAlt}40` : 'transparent';
                      }}
                    >
                      {!agentId && (
                        <td style={styles.td}>
                          {execution.agent_name || execution.agent_id}
                        </td>
                      )}
                      <td style={styles.td}>
                        {truncateText(execution.task, 50)}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: `${getStatusColor(execution.status)}15`,
                            color: getStatusColor(execution.status),
                            border: `1px solid ${getStatusColor(execution.status)}40`,
                          }}
                        >
                          {execution.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {execution.tokens_total.toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        {formatDuration(execution.duration_ms)}
                      </td>
                      <td style={styles.td}>
                        {formatCost(execution.cost_usd)}
                      </td>
                      <td style={styles.td}>
                        {formatDate(execution.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.pagination}>
              <button
                style={{
                  ...styles.pageButton,
                  opacity: page === 1 ? 0.5 : 1,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                onMouseOver={(e) => {
                  if (page > 1) {
                    e.currentTarget.style.backgroundColor = COLORS.bgAlt;
                    e.currentTarget.style.borderColor = COLORS.accent;
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.card;
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>Page {page}</span>
              <button
                style={{
                  ...styles.pageButton,
                  opacity: executions.length < pageSize ? 0.5 : 1,
                  cursor: executions.length < pageSize ? 'not-allowed' : 'pointer',
                }}
                onClick={() => setPage(page + 1)}
                disabled={executions.length < pageSize}
                onMouseOver={(e) => {
                  if (executions.length >= pageSize) {
                    e.currentTarget.style.backgroundColor = COLORS.bgAlt;
                    e.currentTarget.style.borderColor = COLORS.accent;
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.card;
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <div style={styles.modal} onClick={handleCloseDetail}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Execution Details</h3>
              <button
                style={styles.closeButton}
                onClick={handleCloseDetail}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.card;
                  e.currentTarget.style.color = COLORS.text;
                  e.currentTarget.style.borderColor = COLORS.accent;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgAlt;
                  e.currentTarget.style.color = COLORS.textMuted;
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                ×
              </button>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Execution ID</div>
              <div style={styles.detailValue}>{selectedExecution.id}</div>
            </div>

            {selectedExecution.agent_name && (
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Agent</div>
                <div style={styles.detailValue}>{selectedExecution.agent_name}</div>
              </div>
            )}

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Task</div>
              <div style={styles.detailValue}>{selectedExecution.task}</div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Status</div>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: `${getStatusColor(selectedExecution.status)}15`,
                  color: getStatusColor(selectedExecution.status),
                  border: `1px solid ${getStatusColor(selectedExecution.status)}40`,
                }}
              >
                {selectedExecution.status}
              </span>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Metrics</div>
              <div style={styles.detailValue}>
                <div>Tokens: {selectedExecution.tokens_total.toLocaleString()}</div>
                <div>Duration: {formatDuration(selectedExecution.duration_ms)}</div>
                <div>Cost: {formatCost(selectedExecution.cost_usd)}</div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailLabel}>Created</div>
              <div style={styles.detailValue}>
                {new Date(selectedExecution.created_at).toLocaleString()}
              </div>
            </div>

            {selectedExecution.completed_at && (
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Completed</div>
                <div style={styles.detailValue}>
                  {new Date(selectedExecution.completed_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AgentHistory;
