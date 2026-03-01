import React, { useState, useEffect } from 'react';
import { AgentExecutionForm } from './AgentExecutionForm';
import { AgentExecutionStatus } from './AgentExecutionStatus';
import { AgentEditForm } from './AgentEditForm';
import { AgentSkillsTab } from './AgentSkillsTab';
import type { AgentFull } from '../../types/agent';
import { COLORS } from '../../styles/colors';

interface AgentDetailProps {
  agentId: string;
  onClose: () => void;
}

export const AgentDetail: React.FC<AgentDetailProps> = ({ agentId, onClose }) => {
  const [agent, setAgent] = useState<AgentFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'prompt' | 'skills' | 'execute' | 'edit'>('overview');
  const [executionId, setExecutionId] = useState<string | null>(null);

  const handleAgentSaved = (updatedAgent: AgentFull) => {
    setAgent(updatedAgent);
    setActiveTab('overview');
  };

  useEffect(() => {
    const fetchAgentDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/agents/${agentId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch agent details: ${response.statusText}`);
        }
        const data = await response.json();
        setAgent(data);
      } catch (err) {
        console.error('Error fetching agent details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agent details');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentId]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleExecutionStarted = (newExecutionId: string) => {
    setExecutionId(newExecutionId);
  };

  const handleExecutionComplete = () => {
    // Keep showing the completed status
  };

  // Model tier colors
  const getModelColor = (model: string): string => {
    const normalized = model.toLowerCase();
    if (normalized.includes('haiku')) {return '#3B82F6';} // Blue
    if (normalized.includes('sonnet')) {return '#8B5CF6';} // Purple
    if (normalized.includes('opus')) {return '#F59E0B';} // Gold
    return COLORS.accent; // Default blue
  };

  const modelColor = agent ? getModelColor(agent.model) : COLORS.accent;

  const styles = {
    overlay: {
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
    modal: {
      backgroundColor: COLORS.card,
      borderRadius: '20px',
      border: `1px solid ${COLORS.border}`,
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    header: {
      padding: '24px 32px',
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '20px',
    },
    headerContent: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      color: COLORS.text,
      marginBottom: '8px',
      letterSpacing: '-0.3px',
    },
    categoryTag: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      backgroundColor: `${COLORS.accent}15`,
      color: COLORS.accent,
      marginBottom: '12px',
    },
    description: {
      fontSize: '14px',
      color: COLORS.textMuted,
      lineHeight: 1.6,
    },
    closeButton: {
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.bgAlt,
      color: COLORS.textMuted,
      fontSize: '20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      flexShrink: 0,
    },
    tabsContainer: {
      display: 'flex',
      gap: '4px',
      padding: '0 32px',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    tab: {
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.textMuted,
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    tabActive: {
      color: COLORS.accent,
      borderBottomColor: COLORS.accent,
    },
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '32px',
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 32px',
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
    overviewSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    },
    infoCard: {
      backgroundColor: COLORS.bgAlt,
      borderRadius: '12px',
      padding: '16px 20px',
      border: `1px solid ${COLORS.border}`,
    },
    infoLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    infoValue: {
      fontSize: '15px',
      fontWeight: 600,
      color: COLORS.text,
    },
    modelBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '0.3px',
      backgroundColor: `${modelColor}20`,
      color: modelColor,
      border: `1px solid ${modelColor}40`,
    },
    toolsList: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '8px',
    },
    toolTag: {
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: COLORS.card,
      color: COLORS.textMuted,
      border: `1px solid ${COLORS.border}`,
    },
    tagsList: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '8px',
    },
    tag: {
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: `${COLORS.accent}10`,
      color: COLORS.accent,
      border: `1px solid ${COLORS.accent}30`,
    },
    promptContainer: {
      backgroundColor: COLORS.bg,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${COLORS.border}`,
    },
    promptText: {
      fontFamily: "'Fira Code', 'Courier New', monospace",
      fontSize: '13px',
      lineHeight: 1.7,
      color: COLORS.text,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: COLORS.text,
      marginBottom: '16px',
      letterSpacing: '-0.2px',
    },
  };

  const tabs: Array<'overview' | 'prompt' | 'skills' | 'execute' | 'edit'> = ['overview', 'prompt', 'skills', 'execute', 'edit'];

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            {loading ? (
              <div style={{ ...styles.title, color: COLORS.textMuted }}>Loading...</div>
            ) : agent ? (
              <>
                <div style={styles.categoryTag}>{agent.category}</div>
                <h2 style={styles.title}>{agent.name}</h2>
                <p style={styles.description}>{agent.description}</p>
              </>
            ) : null}
          </div>
          <button
            style={styles.closeButton}
            onClick={onClose}
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

        {/* Tabs */}
        {!loading && !error && agent && (
          <div style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab(tab)}
                onMouseOver={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.color = COLORS.text;
                  }
                }}
                onMouseOut={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.color = COLORS.textMuted;
                  }
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={styles.content}>
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

          {!loading && !error && agent && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div style={styles.overviewSection}>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoCard}>
                      <div style={styles.infoLabel}>Model</div>
                      <div style={styles.modelBadge}>{agent.model}</div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoLabel}>Tools</div>
                      <div style={styles.infoValue}>
                        {agent.tools.length} {agent.tools.length === 1 ? 'tool' : 'tools'}
                      </div>
                    </div>
                    <div style={styles.infoCard}>
                      <div style={styles.infoLabel}>Category</div>
                      <div style={styles.infoValue}>{agent.category}</div>
                    </div>
                  </div>

                  {agent.tools.length > 0 && (
                    <div>
                      <div style={styles.sectionTitle}>Available Tools</div>
                      <div style={styles.toolsList}>
                        {agent.tools.map((tool, index) => (
                          <span key={index} style={styles.toolTag}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.tags && agent.tags.length > 0 && (
                    <div>
                      <div style={styles.sectionTitle}>Tags</div>
                      <div style={styles.tagsList}>
                        {agent.tags.map((tag, index) => (
                          <span key={index} style={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.file_path && (
                    <div>
                      <div style={styles.sectionTitle}>File Path</div>
                      <div
                        style={{
                          ...styles.infoCard,
                          fontFamily: "'Fira Code', 'Courier New', monospace",
                          fontSize: '12px',
                          color: COLORS.textMuted,
                        }}
                      >
                        {agent.file_path}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Tab */}
              {activeTab === 'prompt' && (
                <div>
                  <div style={styles.sectionTitle}>System Prompt</div>
                  <div style={styles.promptContainer}>
                    <pre style={styles.promptText}>{agent.full_prompt}</pre>
                  </div>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <AgentSkillsTab agent={agent} />
              )}

              {/* Execute Tab */}
              {activeTab === 'execute' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {!executionId ? (
                    <AgentExecutionForm
                      agentId={agent.id}
                      agentName={agent.name}
                      onExecutionStarted={handleExecutionStarted}
                    />
                  ) : (
                    <>
                      <AgentExecutionStatus
                        executionId={executionId}
                        onComplete={handleExecutionComplete}
                      />
                      <button
                        onClick={() => setExecutionId(null)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: COLORS.bgAlt,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '10px',
                          color: COLORS.text,
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.card;
                          e.currentTarget.style.borderColor = COLORS.accent;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.bgAlt;
                          e.currentTarget.style.borderColor = COLORS.border;
                        }}
                      >
                        Start New Execution
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Edit Tab */}
              {activeTab === 'edit' && (
                <AgentEditForm
                  agent={agent}
                  onSave={handleAgentSaved}
                  onCancel={() => setActiveTab('overview')}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
