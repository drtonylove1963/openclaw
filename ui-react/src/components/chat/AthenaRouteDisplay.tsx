/**
 * AthenaRouteDisplay - Shows Athena routing metadata in chat
 *
 * Displays which agent and skills were matched for a message,
 * providing visibility into the orchestration layer.
 */
import React, { useState } from 'react';
import type { RouteResponse, MatchedSkill, MatchedAgent } from '../../services/athena-api';

interface AthenaRouteDisplayProps {
  routeData: RouteResponse | null;
  isLoading?: boolean;
  error?: string | null;
  compact?: boolean;
  // Auto-generation props
  isGenerating?: boolean;
  generatedSkill?: any | null;
  generationError?: string | null;
}

export const AthenaRouteDisplay: React.FC<AthenaRouteDisplayProps> = ({
  routeData,
  isLoading = false,
  error = null,
  compact = true,
  isGenerating = false,
  generatedSkill = null,
  generationError = null,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingRow}>
          <span style={styles.loadingDot}>●</span>
          <span style={styles.loadingText}>Athena routing...</span>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingRow}>
          <span style={{ ...styles.loadingDot, color: '#f59e0b' }}>●</span>
          <span style={styles.loadingText}>Generating new skill...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorRow}>
          <span style={styles.errorIcon}>⚠</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      </div>
    );
  }

  if (!routeData) {
    return null;
  }

  const { matched_agent, matched_skills, gap_detected, parsed_task } = routeData;

  // Compact view - single line summary
  if (compact && !expanded) {
    return (
      <div style={styles.container} onClick={() => setExpanded(true)}>
        <div style={styles.compactRow}>
          <span style={styles.athenaLabel}>🧠 Athena</span>
          {matched_agent ? (
            <span style={styles.agentBadge}>
              {matched_agent.agent_name}
              <span style={styles.score}>{Math.round(matched_agent.score * 100)}%</span>
            </span>
          ) : (
            <span style={styles.noAgentBadge}>No agent matched</span>
          )}
          {matched_skills.length > 0 && (
            <span style={styles.skillCount}>
              +{matched_skills.length} skill{matched_skills.length !== 1 ? 's' : ''}
            </span>
          )}
          {gap_detected && !generatedSkill && (
            <span style={styles.gapBadge}>Gap Detected</span>
          )}
          {generatedSkill && (
            <span style={styles.generatedBadge}>✨ New: {generatedSkill.name}</span>
          )}
          {generationError && (
            <span style={styles.errorBadge}>Generation failed</span>
          )}
          <span style={styles.expandHint}>▼</span>
        </div>
      </div>
    );
  }

  // Expanded view - full details
  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setExpanded(false)}>
        <span style={styles.athenaLabel}>🧠 Athena Orchestration</span>
        <span style={styles.collapseHint}>▲ collapse</span>
      </div>

      {/* Parsed Task */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Task Analysis</div>
        <div style={styles.taskGrid}>
          <div style={styles.taskItem}>
            <span style={styles.taskLabel}>Intent</span>
            <span style={styles.taskValue}>{parsed_task.intent || 'Unknown'}</span>
          </div>
          <div style={styles.taskItem}>
            <span style={styles.taskLabel}>Type</span>
            <span style={styles.taskValue}>{parsed_task.task_type || 'Unknown'}</span>
          </div>
          <div style={styles.taskItem}>
            <span style={styles.taskLabel}>Complexity</span>
            <span style={styles.taskValue}>{parsed_task.complexity}</span>
          </div>
        </div>
        {parsed_task.keywords.length > 0 && (
          <div style={styles.tagRow}>
            {parsed_task.keywords.slice(0, 5).map(kw => (
              <span key={kw} style={styles.keywordTag}>{kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* Matched Agent */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Matched Agent</div>
        {matched_agent ? (
          <div style={styles.agentCard}>
            <div style={styles.agentHeader}>
              <span style={styles.agentName}>{matched_agent.agent_name}</span>
              <span style={styles.agentScore}>
                {Math.round(matched_agent.score * 100)}% match
              </span>
            </div>
            <div style={styles.agentSlug}>{matched_agent.agent_slug}</div>
            {matched_agent.match_reasons.length > 0 && (
              <div style={styles.reasonsRow}>
                {matched_agent.match_reasons.map((reason, i) => (
                  <span key={i} style={styles.reasonTag}>{reason}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.noMatch}>No agent matched above threshold</div>
        )}
      </div>

      {/* Matched Skills */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          Injected Skills
          <span style={styles.countBadge}>{matched_skills.length}</span>
        </div>
        {matched_skills.length > 0 ? (
          <div style={styles.skillsList}>
            {matched_skills.slice(0, 5).map((skill, i) => (
              <div key={skill.skill_id} style={styles.skillItem}>
                <span style={styles.skillRank}>#{i + 1}</span>
                <span style={styles.skillName}>{skill.skill_name}</span>
                <span style={styles.skillScore}>
                  {Math.round(skill.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noMatch}>No skills matched</div>
        )}
      </div>

      {/* Gap Alert */}
      {gap_detected && (
        <div style={styles.gapAlert}>
          <span style={styles.gapIcon}>⚠️</span>
          <span>Gap detected - no skills matched above threshold. Consider creating a new skill.</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '8px',
    fontSize: '12px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    cursor: 'pointer',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  loadingDot: {
    color: '#3b82f6',
    animation: 'pulse 1s infinite',
  },
  loadingText: {
    color: '#94a3b8',
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    color: '#f87171',
  },
  errorText: {
    color: '#f87171',
  },
  compactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  athenaLabel: {
    fontWeight: 600,
    color: '#a78bfa',
  },
  agentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 8px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: '4px',
    color: '#10b981',
    fontWeight: 500,
  },
  noAgentBadge: {
    padding: '2px 8px',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: '4px',
    color: '#64748b',
  },
  score: {
    fontSize: '10px',
    opacity: 0.8,
  },
  skillCount: {
    color: '#3b82f6',
  },
  gapBadge: {
    padding: '2px 8px',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: '4px',
    color: '#f59e0b',
    fontWeight: 500,
  },
  generatedBadge: {
    padding: '2px 8px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: '4px',
    color: '#10b981',
    fontWeight: 500,
  },
  errorBadge: {
    padding: '2px 8px',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: '4px',
    color: '#ef4444',
    fontWeight: 500,
  },
  expandHint: {
    marginLeft: 'auto',
    color: '#64748b',
    fontSize: '10px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(100, 116, 139, 0.3)',
  },
  collapseHint: {
    color: '#64748b',
    fontSize: '11px',
  },
  section: {
    marginBottom: '12px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  countBadge: {
    padding: '1px 6px',
    backgroundColor: '#3b82f6',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '10px',
  },
  taskGrid: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
  },
  taskItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  taskLabel: {
    fontSize: '10px',
    color: '#64748b',
  },
  taskValue: {
    color: '#e2e8f0',
    fontWeight: 500,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  keywordTag: {
    padding: '2px 6px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '3px',
    color: '#93c5fd',
    fontSize: '11px',
  },
  agentCard: {
    padding: '10px',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '6px',
  },
  agentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  agentName: {
    fontWeight: 600,
    color: '#f8fafc',
  },
  agentScore: {
    padding: '2px 8px',
    backgroundColor: '#10b981',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 500,
  },
  agentSlug: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: '8px',
  },
  reasonsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  reasonTag: {
    padding: '2px 6px',
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
    borderRadius: '3px',
    color: '#93c5fd',
    fontSize: '10px',
  },
  noMatch: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  skillsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  skillItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '4px',
  },
  skillRank: {
    width: '20px',
    fontSize: '10px',
    color: '#64748b',
    fontWeight: 600,
  },
  skillName: {
    flex: 1,
    color: '#e2e8f0',
  },
  skillScore: {
    padding: '2px 6px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: '3px',
    color: '#10b981',
    fontSize: '10px',
    fontWeight: 500,
  },
  gapAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: 'rgba(120, 53, 15, 0.3)',
    borderRadius: '6px',
    color: '#fde68a',
  },
  gapIcon: {
    fontSize: '14px',
  },
};

export default AthenaRouteDisplay;
