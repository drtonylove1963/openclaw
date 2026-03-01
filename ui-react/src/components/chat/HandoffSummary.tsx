/**
 * HandoffSummary - GSD phase transition display component
 * Shows summary when GSD workflows transition between phases
 * Displays from/to phases, summary, key actions, and files modified
 */
import React from 'react';
import { COLORS } from '../../styles/colors';

interface HandoffSummaryProps {
  handoff: {
    from_phase: string;
    to_phase: string;
    summary: string;
    key_actions: string[];
    files_modified: string[];
  };
}

export function HandoffSummary({ handoff }: HandoffSummaryProps) {
  const { from_phase, to_phase, summary, key_actions, files_modified } = handoff;

  return (
    <div style={styles.container} data-testid="handoff-summary">
      {/* Header with badge and phase transition */}
      <div style={styles.header}>
        <span style={styles.badge} data-testid="handoff-badge">Phase Transition</span>
        <span style={styles.phaseTransition} data-testid="phase-transition">
          <span style={styles.phaseName}>{from_phase}</span>
          <span style={styles.arrow}>{'\u2192'}</span>
          <span style={styles.phaseName}>{to_phase}</span>
        </span>
      </div>

      {/* Summary paragraph */}
      <p style={styles.summary} data-testid="handoff-summary-text">{summary}</p>

      {/* Actions Completed section */}
      {key_actions.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Actions Completed</h4>
          <ul style={styles.list} data-testid="handoff-actions">
            {key_actions.map((action, index) => (
              <li key={index} style={styles.listItem}>
                <span style={styles.bullet}>{'\u2022'}</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Files Modified section */}
      {files_modified.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Files Modified</h4>
          <div style={styles.fileList} data-testid="handoff-files">
            {files_modified.map((file, index) => (
              <code key={index} style={styles.fileItem}>
                {file}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: COLORS.bgPanel,
    border: `1px solid ${COLORS.border}`,
    borderLeft: `3px solid ${COLORS.accent}`,
    borderRadius: '12px',
    padding: '16px',
    margin: '12px 0',
    maxWidth: '600px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  badge: {
    background: COLORS.accentMuted,
    color: COLORS.accent,
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  phaseTransition: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  phaseName: {
    color: COLORS.text,
    fontWeight: 500,
  },
  arrow: {
    color: COLORS.textMuted,
    fontSize: '16px',
  },
  summary: {
    color: COLORS.text,
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
  },
  section: {
    marginTop: '12px',
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    color: COLORS.text,
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '4px',
  },
  bullet: {
    color: COLORS.accent,
    fontSize: '12px',
    flexShrink: 0,
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fileItem: {
    background: COLORS.bgHover,
    color: COLORS.textMuted,
    fontSize: '12px',
    fontFamily: 'monospace',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block',
    wordBreak: 'break-all',
  },
};

export default HandoffSummary;
