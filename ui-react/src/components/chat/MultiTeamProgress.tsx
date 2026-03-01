/**
 * MultiTeamProgress Component
 * Shows progress of a multi-team project with cross-team messaging
 * Displays each team as a card with workflow progress, plus cross-team message feed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { COLORS } from '../../styles/colors';
import { agentTeamsService } from '../../services/agentTeamsService';
import type { ProjectSession, CrossTeamMessage, TeamRegistration } from '../../types/agentTeams';

interface MultiTeamProgressProps {
  projectId: string;
  onClose?: () => void;
}

export const MultiTeamProgress: React.FC<MultiTeamProgressProps> = ({
  projectId,
  onClose,
}) => {
  const [project, setProject] = useState<ProjectSession | null>(null);
  const [messages, setMessages] = useState<CrossTeamMessage[]>([]);
  const [showMessages, setShowMessages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const data = await agentTeamsService.getProject(projectId);
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await agentTeamsService.getCrossTeamMessages(projectId, undefined, 20);
      setMessages(msgs);
    } catch {
      // Non-critical, don't set error
    }
  }, [projectId]);

  // Initial load and polling
  useEffect(() => {
    fetchProject();
    fetchMessages();
    const interval = setInterval(() => {
      fetchProject();
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchProject, fetchMessages]);

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'backend': return '#3b82f6';
      case 'frontend': return '#8b5cf6';
      case 'database': return '#f59e0b';
      case 'testing': return '#10b981';
      case 'devops': return '#ef4444';
      case 'design': return '#ec4899';
      default: return COLORS.accent;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return COLORS.accent;
      case 'completed': return COLORS.success;
      case 'failed': return COLORS.danger;
      default: return COLORS.textMuted;
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: COLORS.bgPanel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        marginBottom: '16px',
      }}>
        <div style={{ color: COLORS.textMuted, fontSize: '14px' }}>Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: `${COLORS.danger}10`,
        border: `1px solid ${COLORS.danger}40`,
        borderRadius: '12px',
        marginBottom: '16px',
      }}>
        <div style={{ color: COLORS.danger, fontSize: '14px' }}>{error || 'Project not found'}</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: COLORS.bgPanel,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Project Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.purple} strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text }}>
              {project.name}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
              {project.team_count} teams | {project.active_teams} active
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: `${getStatusColor(project.status)}20`,
            color: getStatusColor(project.status),
            textTransform: 'capitalize',
          }}>
            {project.status}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: COLORS.textMuted,
                padding: '4px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Team Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {project.teams.map((team: TeamRegistration) => (
          <div
            key={team.team_id}
            style={{
              backgroundColor: COLORS.bgMuted,
              borderRadius: '8px',
              padding: '12px',
              borderLeft: `3px solid ${getRoleColor(team.role)}`,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.text }}>
                {team.team_name}
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 500,
                backgroundColor: `${getStatusColor(team.status)}20`,
                color: getStatusColor(team.status),
                textTransform: 'capitalize',
              }}>
                {team.status}
              </span>
            </div>
            <div style={{
              fontSize: '11px',
              color: COLORS.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px',
            }}>
              {team.role}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {team.agent_types.map((at) => (
                <span
                  key={at}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    backgroundColor: `${getRoleColor(team.role)}15`,
                    color: getRoleColor(team.role),
                  }}
                >
                  {at}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dependencies Summary */}
      {project.dependencies.total > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 12px',
          backgroundColor: COLORS.bgMuted,
          borderRadius: '8px',
          marginBottom: '12px',
          fontSize: '13px',
        }}>
          <span style={{ color: COLORS.textMuted }}>Dependencies:</span>
          <span style={{ color: COLORS.success, fontWeight: 500 }}>
            {project.dependencies.satisfied} satisfied
          </span>
          <span style={{ color: COLORS.warning, fontWeight: 500 }}>
            {project.dependencies.pending} pending
          </span>
        </div>
      )}

      {/* Cross-Team Messages */}
      <div>
        <button
          onClick={() => setShowMessages(!showMessages)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: COLORS.textMuted,
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: showMessages ? '8px' : '0',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: showMessages ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Cross-Team Messages ({messages.length})
        </button>

        {showMessages && messages.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  backgroundColor: COLORS.bgMuted,
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.purple} strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{msg.source_team_name}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{msg.target_team_name}</span>
                  </div>
                  <div style={{ color: COLORS.textMuted, fontWeight: 500, marginBottom: '2px' }}>
                    {msg.subject}
                  </div>
                  <div style={{
                    color: COLORS.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {msg.body}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px',
                  color: COLORS.textMuted,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {showMessages && messages.length === 0 && (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            color: COLORS.textMuted,
            fontSize: '12px',
          }}>
            No cross-team messages yet
          </div>
        )}
      </div>
    </div>
  );
};
