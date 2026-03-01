/**
 * ExecutionProgress - Claude Code-like execution progress display
 * Shows real-time agent execution with phases, skills, tools, and thinking
 */
import React from 'react';
import type { ExecutionStep } from '../../types/chat';
import { COLORS } from '../../styles/colors';

// Re-export for backward compatibility
export type { ExecutionStep } from '../../types/chat';

interface ExecutionProgressProps {
  steps: ExecutionStep[];
  currentPhase?: string;
  statusMessage?: string | null;
  isStreaming?: boolean;
}

export function ExecutionProgress({
  steps,
  currentPhase,
  statusMessage,
  isStreaming = false
}: ExecutionProgressProps) {

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      padding: '8px 0',
      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: '12px',
    },
    headerBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: `linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.accent}05)`,
      borderRadius: '8px',
      marginBottom: '8px',
      border: `1px solid ${COLORS.accent}30`,
    },
    phaseIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    phaseDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: COLORS.accent,
      animation: 'pulse 1.5s ease-in-out infinite',
    },
    phaseText: {
      color: COLORS.accent,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      fontSize: '11px',
    },
    statusText: {
      color: COLORS.textMuted,
      fontSize: '11px',
      marginLeft: 'auto',
    },
    stepsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1px',
    },
    step: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '6px 12px',
      borderRadius: '4px',
      transition: 'background 0.15s ease',
    },
    stepRunning: {
      background: `${COLORS.accent}08`,
    },
    stepComplete: {
      background: 'transparent',
    },
    stepError: {
      background: `${COLORS.error}08`,
    },
    stepIcon: {
      width: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '1px',
    },
    spinner: {
      width: '14px',
      height: '14px',
      border: `2px solid ${COLORS.border}`,
      borderTopColor: COLORS.accent,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    checkmark: {
      color: COLORS.success,
      fontSize: '14px',
    },
    errorIcon: {
      color: COLORS.error,
      fontSize: '14px',
    },
    stepContent: {
      flex: 1,
      minWidth: 0,
    },
    stepHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    stepType: {
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '9px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    typeThinking: {
      background: `${COLORS.warning}20`,
      color: COLORS.warning,
    },
    typePhase: {
      background: `${COLORS.accent}20`,
      color: COLORS.accent,
    },
    typeSkill: {
      background: `${COLORS.success}20`,
      color: COLORS.success,
    },
    typeTool: {
      background: `${COLORS.info || '#3b82f6'}20`,
      color: COLORS.info || '#3b82f6',
    },
    typeContent: {
      background: `${COLORS.textMuted}20`,
      color: COLORS.textMuted,
    },
    stepTitle: {
      color: COLORS.text,
      fontWeight: 500,
      fontSize: '12px',
    },
    stepDetails: {
      color: COLORS.textMuted,
      fontSize: '11px',
      marginTop: '2px',
      lineHeight: 1.4,
    },
    skillsList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '4px',
    },
    skillChip: {
      padding: '2px 8px',
      borderRadius: '12px',
      background: `${COLORS.success}15`,
      color: COLORS.success,
      fontSize: '10px',
      fontWeight: 500,
      border: `1px solid ${COLORS.success}30`,
    },
    keywordChip: {
      padding: '2px 6px',
      borderRadius: '8px',
      background: `${COLORS.accent}10`,
      color: COLORS.accent,
      fontSize: '9px',
      fontFamily: 'monospace',
    },
    toolBox: {
      marginTop: '4px',
      padding: '6px 8px',
      background: COLORS.bgAlt,
      borderRadius: '4px',
      border: `1px solid ${COLORS.border}`,
    },
    toolInput: {
      color: COLORS.textMuted,
      fontSize: '10px',
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    toolResult: {
      color: COLORS.text,
      fontSize: '10px',
      fontFamily: 'monospace',
      marginTop: '4px',
      maxHeight: '60px',
      overflow: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
    timestamp: {
      color: COLORS.textMuted,
      fontSize: '9px',
      marginLeft: 'auto',
      opacity: 0.6,
    },
    streamingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      color: COLORS.textMuted,
      fontSize: '11px',
    },
    streamingDots: {
      display: 'flex',
      gap: '3px',
    },
    dot: {
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: COLORS.accent,
      animation: 'bounce 1.4s ease-in-out infinite',
    },
  };

  const getTypeStyle = (type: ExecutionStep['type']): React.CSSProperties => {
    switch (type) {
      case 'thinking': return { ...styles.stepType, ...styles.typeThinking };
      case 'phase': return { ...styles.stepType, ...styles.typePhase };
      case 'skill': return { ...styles.stepType, ...styles.typeSkill };
      case 'tool': return { ...styles.stepType, ...styles.typeTool };
      case 'content': return { ...styles.stepType, ...styles.typeContent };
      default: return styles.stepType;
    }
  };

  const getStepStyle = (status: ExecutionStep['status']): React.CSSProperties => {
    switch (status) {
      case 'running': return { ...styles.step, ...styles.stepRunning };
      case 'error': return { ...styles.step, ...styles.stepError };
      default: return { ...styles.step, ...styles.stepComplete };
    }
  };

  const getTypeLabel = (type: ExecutionStep['type']): string => {
    switch (type) {
      case 'thinking': return 'Thinking';
      case 'phase': return 'Phase';
      case 'skill': return 'Skills';
      case 'tool': return 'Tool';
      case 'content': return 'Response';
      default: return type;
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatInput = (input?: Record<string, unknown>): string => {
    if (!input || Object.keys(input).length === 0) {return '';}
    const entries = Object.entries(input).slice(0, 2);
    return entries.map(([k, v]) => {
      const val = typeof v === 'string' ? v.slice(0, 40) : JSON.stringify(v).slice(0, 40);
      return `${k}: ${val}`;
    }).join(' | ');
  };

  if (steps.length === 0 && !statusMessage && !currentPhase) {
    return null;
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.16s; }
        .dot-3 { animation-delay: 0.32s; }
      `}</style>

      {/* Header with current phase */}
      {(currentPhase || statusMessage) && (
        <div style={styles.headerBar}>
          <div style={styles.phaseIndicator}>
            <div style={styles.phaseDot} />
            <span style={styles.phaseText}>
              {currentPhase || 'Processing'}
            </span>
          </div>
          {statusMessage && (
            <span style={styles.statusText}>{statusMessage}</span>
          )}
        </div>
      )}

      {/* Steps list */}
      <div style={styles.stepsList}>
        {steps.map((step) => (
          <div key={step.id} style={getStepStyle(step.status)}>
            {/* Status icon */}
            <div style={styles.stepIcon}>
              {step.status === 'running' ? (
                <div style={styles.spinner} />
              ) : step.status === 'error' ? (
                <span style={styles.errorIcon}>✗</span>
              ) : (
                <span style={styles.checkmark}>✓</span>
              )}
            </div>

            {/* Content */}
            <div style={styles.stepContent}>
              <div style={styles.stepHeader}>
                <span style={getTypeStyle(step.type)}>
                  {getTypeLabel(step.type)}
                </span>
                <span style={styles.stepTitle}>{step.title}</span>
                <span style={styles.timestamp}>{formatTime(step.timestamp)}</span>
              </div>

              {step.details && (
                <div style={styles.stepDetails}>{step.details}</div>
              )}

              {/* Skills chips */}
              {step.metadata?.skills && step.metadata.skills.length > 0 && (
                <div style={styles.skillsList}>
                  {step.metadata.skills.map((skill, i) => (
                    <span key={i} style={styles.skillChip}>{skill}</span>
                  ))}
                </div>
              )}

              {/* Keywords */}
              {step.metadata?.keywords && step.metadata.keywords.length > 0 && (
                <div style={{ ...styles.skillsList, marginTop: '4px' }}>
                  {step.metadata.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} style={styles.keywordChip}>{kw}</span>
                  ))}
                </div>
              )}

              {/* Tool details */}
              {step.type === 'tool' && step.metadata?.toolName && (
                <div style={styles.toolBox}>
                  {step.metadata.toolInput && (
                    <div style={styles.toolInput}>
                      {formatInput(step.metadata.toolInput)}
                    </div>
                  )}
                  {step.metadata.toolResult && (
                    <div style={styles.toolResult}>
                      {step.metadata.toolResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div style={styles.streamingIndicator}>
          <div style={styles.streamingDots}>
            <div className="dot-1" style={{ ...styles.dot, animationDelay: '0s' }} />
            <div className="dot-2" style={{ ...styles.dot, animationDelay: '0.16s' }} />
            <div className="dot-3" style={{ ...styles.dot, animationDelay: '0.32s' }} />
          </div>
          <span>Generating response...</span>
        </div>
      )}
    </div>
  );
}

export default ExecutionProgress;
