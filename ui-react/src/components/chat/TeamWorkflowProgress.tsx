/**
 * TeamWorkflowProgress Component
 * Real-time display of team workflow execution progress
 * Shows tasks, status, agents, and completion percentage
 */

import React, { useState } from 'react';
import { COLORS } from '../../styles/colors';
import type { Workflow, WorkflowTask, TaskStatus } from '../../types/agentTeams';

interface TeamWorkflowProgressProps {
  workflow: Workflow | null;
  isActive: boolean;
}

export const TeamWorkflowProgress: React.FC<TeamWorkflowProgressProps> = ({
  workflow,
  isActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!workflow) {
    return null;
  }

  const { progress_pct, completed_tasks, total_tasks, tasks, is_complete } = workflow;

  // Get status color
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'in_progress':
      case 'claimed':
        return COLORS.accent;
      case 'failed':
        return COLORS.danger;
      case 'ready':
        return COLORS.warning;
      case 'blocked':
      case 'pending':
      case 'cancelled':
        return COLORS.textMuted;
      default:
        return COLORS.textMuted;
    }
  };

  // Get status icon
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'in_progress':
      case 'claimed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'failed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'ready':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" opacity="0.3" />
          </svg>
        );
    }
  };

  // Container
  const containerStyle: React.CSSProperties = {
    backgroundColor: COLORS.bgPanel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  // Header
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    color: COLORS.text,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const statusBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: is_complete ? `${COLORS.success}20` : `${COLORS.accent}20`,
    color: is_complete ? COLORS.success : COLORS.accent,
  };

  // Progress bar container
  const progressBarContainerStyle: React.CSSProperties = {
    height: '8px',
    backgroundColor: COLORS.bgMuted,
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
    position: 'relative',
  };

  const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${progress_pct}%`,
    backgroundColor: is_complete ? COLORS.success : COLORS.accent,
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  };

  // Progress text
  const progressTextStyle: React.CSSProperties = {
    fontSize: '13px',
    color: COLORS.textMuted,
    marginBottom: '12px',
  };

  // Task list
  const taskListStyle: React.CSSProperties = {
    display: isExpanded ? 'flex' : 'none',
    flexDirection: 'column',
    gap: '8px',
  };

  // Task row
  const taskRowStyle = (status: TaskStatus): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: COLORS.bgMuted,
    borderRadius: '8px',
    borderLeft: `3px solid ${getStatusColor(status)}`,
  });

  const taskIconStyle = (status: TaskStatus): React.CSSProperties => ({
    color: getStatusColor(status),
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  });

  const taskContentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const taskTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const taskMetaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const agentPillStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: `${COLORS.purple}20`,
    color: COLORS.purple,
  };

  const statusPillStyle = (status: TaskStatus): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: `${getStatusColor(status)}20`,
    color: getStatusColor(status),
    textTransform: 'capitalize',
  });

  // Completion summary
  const summaryStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: `${COLORS.success}15`,
    border: `1px solid ${COLORS.success}`,
    borderRadius: '8px',
    marginTop: '12px',
    fontSize: '13px',
    color: COLORS.success,
  };

  // Chevron icon
  const ChevronIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{
        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  // Check icon
  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={titleStyle}>
          <span>Team Workflow</span>
          <span style={statusBadgeStyle}>
            {isActive && !is_complete && (
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.accent,
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
            {is_complete ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <ChevronIcon />
      </div>

      {/* Progress bar */}
      <div style={progressBarContainerStyle}>
        <div style={progressBarFillStyle} />
      </div>

      {/* Progress text */}
      <div style={progressTextStyle}>
        {completed_tasks} of {total_tasks} tasks completed ({Math.round(progress_pct)}%)
      </div>

      {/* Task list */}
      <div style={taskListStyle}>
        {tasks.map((task: WorkflowTask) => (
          <div key={task.id} style={taskRowStyle(task.status)}>
            <div style={taskIconStyle(task.status)}>{getStatusIcon(task.status)}</div>
            <div style={taskContentStyle}>
              <div style={taskTitleStyle} title={task.title}>
                {task.title}
              </div>
              <div style={taskMetaStyle}>
                <span style={agentPillStyle}>{task.agent_type}</span>
                <span style={statusPillStyle(task.status)}>{task.status.replace('_', ' ')}</span>
                {task.error_message && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: COLORS.danger,
                      fontStyle: 'italic',
                    }}
                    title={task.error_message}
                  >
                    Error
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion summary */}
      {is_complete && (
        <div style={summaryStyle}>
          <CheckIcon />
          <span>
            Workflow completed successfully! {total_tasks} tasks finished in {Math.round(workflow.total_time)}s
          </span>
        </div>
      )}

      {/* Add pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};
