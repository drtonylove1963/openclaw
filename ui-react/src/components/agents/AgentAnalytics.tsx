import React, { useState, useEffect } from 'react';
import type { AnalyticsSummary, UsageDataPoint, TopAgent, CostBreakdown } from '../../types/agent';
import { COLORS } from '../../styles/colors';

export const AgentAnalytics: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [usage, setUsage] = useState<UsageDataPoint[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all analytics data in parallel
        const [summaryRes, usageRes, topAgentsRes, costsRes] = await Promise.all([
          fetch('/api/v1/agents/analytics/summary'),
          fetch(`/api/v1/agents/analytics/usage?days=${dateRange}&granularity=day`),
          fetch(`/api/v1/agents/analytics/top-agents?limit=10&metric=executions`),
          fetch(`/api/v1/agents/analytics/costs?days=${dateRange}`),
        ]);

        if (!summaryRes.ok || !usageRes.ok || !topAgentsRes.ok || !costsRes.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const [summaryData, usageData, topAgentsData, costsData] = await Promise.all([
          summaryRes.json(),
          usageRes.json(),
          topAgentsRes.json(),
          costsRes.json(),
        ]);

        setSummary(summaryData);
        setUsage(usageData);
        setTopAgents(topAgentsData);
        setCosts(costsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {return `${(num / 1000000).toFixed(1)}M`;}
    if (num >= 1000) {return `${(num / 1000).toFixed(1)}K`;}
    return num.toString();
  };

  const formatCost = (usd: number): string => {
    if (usd < 0.01) {return `$${(usd * 100).toFixed(2)}c`;}
    return `$${usd.toFixed(2)}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) {return `${ms}ms`;}
    if (ms < 60000) {return `${(ms / 1000).toFixed(1)}s`;}
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '32px',
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
    dateSelector: {
      display: 'flex',
      gap: '8px',
      backgroundColor: COLORS.card,
      padding: '4px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.border}`,
    },
    dateButton: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: COLORS.textMuted,
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    dateButtonActive: {
      backgroundColor: COLORS.accent,
      color: COLORS.text,
    },
    summaryCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
      padding: '24px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    cardLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '12px',
    },
    cardValue: {
      fontSize: '32px',
      fontWeight: 700,
      color: COLORS.text,
      marginBottom: '8px',
      letterSpacing: '-0.5px',
    },
    cardSubtext: {
      fontSize: '13px',
      color: COLORS.textMuted,
      lineHeight: 1.5,
    },
    section: {
      backgroundColor: COLORS.card,
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
      padding: '24px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: COLORS.text,
      marginBottom: '20px',
      letterSpacing: '-0.2px',
    },
    chartContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    chartBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    chartLabel: {
      fontSize: '12px',
      color: COLORS.textMuted,
      minWidth: '80px',
      textAlign: 'right' as const,
    },
    chartBarContainer: {
      flex: 1,
      height: '32px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '6px',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    chartBarFill: {
      height: '100%',
      backgroundColor: COLORS.accent,
      borderRadius: '6px',
      transition: 'width 0.5s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '8px',
    },
    chartValue: {
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.text,
      minWidth: '60px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left' as const,
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    td: {
      padding: '12px 16px',
      fontSize: '14px',
      color: COLORS.text,
      borderBottom: `1px solid ${COLORS.border}`,
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
    progressBar: {
      height: '8px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.5s ease',
    },
  };

  const maxUsageCount = usage.length > 0 ? Math.max(...usage.map(u => u.count)) : 1;

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
          <h2 style={styles.title}>Analytics Dashboard</h2>
          <div style={styles.dateSelector}>
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                style={{
                  ...styles.dateButton,
                  ...(dateRange === days ? styles.dateButtonActive : {}),
                }}
                onClick={() => setDateRange(days as 7 | 30 | 90)}
              >
                {days}d
              </button>
            ))}
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

        {!loading && !error && summary && (
          <>
            {/* Summary Cards */}
            <div style={styles.summaryCards}>
              <div
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.accent}20`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.cardLabel}>Total Executions</div>
                <div style={styles.cardValue}>{formatNumber(summary.total_executions)}</div>
                <div style={styles.cardSubtext}>
                  {summary.unique_agents_used} unique agents used
                </div>
              </div>

              <div
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.success}20`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.cardLabel}>Success Rate</div>
                <div style={{ ...styles.cardValue, color: COLORS.success }}>
                  {(summary.success_rate * 100).toFixed(1)}%
                </div>
                <div style={styles.cardSubtext}>
                  {summary.successful_executions} succeeded, {summary.failed_executions} failed
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${summary.success_rate * 100}%`,
                      backgroundColor: COLORS.success,
                    }}
                  />
                </div>
              </div>

              <div
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.accent}20`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.cardLabel}>Total Tokens</div>
                <div style={styles.cardValue}>{formatNumber(summary.total_tokens_used)}</div>
                <div style={styles.cardSubtext}>
                  Avg {formatNumber(Math.floor(summary.total_tokens_used / Math.max(summary.total_executions, 1)))} per execution
                </div>
              </div>

              <div
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.warning}20`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.cardLabel}>Total Cost</div>
                <div style={{ ...styles.cardValue, color: COLORS.warning }}>
                  {formatCost(summary.total_cost_usd)}
                </div>
                <div style={styles.cardSubtext}>
                  Avg {formatCost(summary.total_cost_usd / Math.max(summary.total_executions, 1))} per execution
                </div>
              </div>
            </div>

            {/* Usage Over Time */}
            {usage.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Usage Over Time</h3>
                <div style={styles.chartContainer}>
                  {usage.slice().toReversed().slice(0, 14).map((dataPoint, index) => (
                    <div key={index} style={styles.chartBar}>
                      <div style={styles.chartLabel}>
                        {new Date(dataPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={styles.chartBarContainer}>
                        <div
                          style={{
                            ...styles.chartBarFill,
                            width: `${(dataPoint.count / maxUsageCount) * 100}%`,
                          }}
                        >
                          {dataPoint.count > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 600, paddingRight: '4px' }}>
                              {dataPoint.count}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={styles.chartValue}>{dataPoint.count} exec</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Agents */}
            {topAgents.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Top Agents</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Agent</th>
                      <th style={styles.th}>Executions</th>
                      <th style={styles.th}>Success Rate</th>
                      <th style={styles.th}>Total Tokens</th>
                      <th style={styles.th}>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAgents.map((agent, index) => (
                      <tr key={index}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 600 }}>{agent.agent_name || agent.agent_id}</div>
                        </td>
                        <td style={styles.td}>{agent.executions}</td>
                        <td style={styles.td}>
                          <span style={{ color: agent.success_rate > 0.8 ? COLORS.success : COLORS.textMuted }}>
                            {(agent.success_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td style={styles.td}>{formatNumber(agent.total_tokens)}</td>
                        <td style={styles.td}>{formatCost(agent.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cost Breakdown */}
            {costs && costs.by_agent && costs.by_agent.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Cost Breakdown by Agent</h3>
                <div style={styles.chartContainer}>
                  {costs.by_agent.slice(0, 10).map((item, index) => {
                    const percentage = (item.cost / costs.total_cost) * 100;
                    return (
                      <div key={index} style={styles.chartBar}>
                        <div style={{ ...styles.chartLabel, minWidth: '150px' }}>
                          {item.agent_name || item.agent_id}
                        </div>
                        <div style={styles.chartBarContainer}>
                          <div
                            style={{
                              ...styles.chartBarFill,
                              width: `${percentage}%`,
                              backgroundColor: COLORS.warning,
                            }}
                          />
                        </div>
                        <div style={styles.chartValue}>{formatCost(item.cost)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Average Duration */}
            {summary.average_duration_ms > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Performance</h3>
                <div style={{ fontSize: '14px', color: COLORS.text }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: COLORS.textMuted }}>Average Execution Time: </span>
                    <span style={{ fontWeight: 600 }}>{formatDuration(summary.average_duration_ms)}</span>
                  </div>
                  <div>
                    <span style={{ color: COLORS.textMuted }}>Total Executions: </span>
                    <span style={{ fontWeight: 600 }}>{summary.total_executions}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AgentAnalytics;
