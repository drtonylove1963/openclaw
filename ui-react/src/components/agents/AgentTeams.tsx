import React, { useState, useEffect, useCallback } from 'react';
import { TeamCard } from './TeamCard';
import { TeamEditor } from './TeamEditor';
import type { SavedTeam } from '../../types/agentTeams';
import type { Agent } from '../../types/agent';
import { agentTeamsService } from '../../services/agentTeamsService';
import { COLORS } from '../../styles/colors';

interface AgentTeamsProps {
  agents: Agent[];
  onTeamSelect?: (team: SavedTeam) => void;
}

export const AgentTeams: React.FC<AgentTeamsProps> = ({ agents, onTeamSelect }) => {
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTeam, setEditingTeam] = useState<SavedTeam | null>(null);

  const loadTeams = useCallback(() => {
    setLoading(true);
    try {
      const savedTeams = agentTeamsService.getSavedTeams();
      setTeams(savedTeams);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setShowEditor(true);
  };

  const handleEditTeam = (team: SavedTeam) => {
    setEditingTeam(team);
    setShowEditor(true);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      agentTeamsService.deleteTeam(teamId);
      loadTeams();
    }
  };

  const handleSaveTeam = (team: SavedTeam) => {
    agentTeamsService.saveTeam(team);
    loadTeams();
    setShowEditor(false);
    setEditingTeam(null);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingTeam(null);
  };

  const handleSelectTeam = (team: SavedTeam) => {
    if (onTeamSelect) {
      onTeamSelect(team);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: COLORS.text,
      letterSpacing: '-0.2px',
    },
    headerSubtitle: {
      fontSize: '14px',
      color: COLORS.textMuted,
      marginTop: '4px',
    },
    createButton: {
      padding: '12px 20px',
      backgroundColor: COLORS.accent,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
      width: '100%',
    },
    skeleton: {
      backgroundColor: COLORS.card,
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${COLORS.border}`,
      height: '180px',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center' as const,
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '20px',
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '8px',
    },
    emptyText: {
      fontSize: '14px',
      color: COLORS.textMuted,
      maxWidth: '400px',
      lineHeight: 1.6,
      marginBottom: '24px',
    },
    emptyButton: {
      padding: '12px 24px',
      backgroundColor: COLORS.accent,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
  };

  // Loading skeleton
  if (loading) {
    return (
      <div style={styles.container}>
        <style>
          {`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}
        </style>
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>Agent Teams</div>
            <div style={styles.headerSubtitle}>Loading teams...</div>
          </div>
        </div>
        <div style={styles.grid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} style={styles.skeleton} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (teams.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👥</div>
          <div style={styles.emptyTitle}>No teams yet</div>
          <div style={styles.emptyText}>
            Create your first agent team to coordinate multiple agents working together on complex tasks.
          </div>
          <button
            style={styles.emptyButton}
            onClick={handleCreateTeam}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accent;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Create Team
          </button>
        </div>

        {/* Editor Modal */}
        {showEditor && (
          <TeamEditor
            team={editingTeam}
            agents={agents}
            onSave={handleSaveTeam}
            onClose={handleCloseEditor}
          />
        )}
      </div>
    );
  }

  // Teams grid
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>Agent Teams</div>
          <div style={styles.headerSubtitle}>
            {teams.length} {teams.length === 1 ? 'team' : 'teams'}
          </div>
        </div>
        <button
          style={styles.createButton}
          onClick={handleCreateTeam}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accentHover;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accent;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>+</span>
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      <div style={styles.grid}>
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onSelect={handleSelectTeam}
            onEdit={handleEditTeam}
            onDelete={handleDeleteTeam}
          />
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <TeamEditor
          team={editingTeam}
          agents={agents}
          onSave={handleSaveTeam}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
};

export default AgentTeams;
