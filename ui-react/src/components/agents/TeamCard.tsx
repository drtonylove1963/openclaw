import React, { useState } from 'react';
import type { SavedTeam } from '../../types/agentTeams';
import { COLORS } from '../../styles/colors';

interface TeamCardProps {
  team: SavedTeam;
  onSelect: (team: SavedTeam) => void;
  onEdit: (team: SavedTeam) => void;
  onDelete: (teamId: string) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onSelect, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Shorten agent_type for display (e.g., "backend-developer" -> "backend-dev")
  const shortenAgentType = (type: string): string => {
    const parts = type.split('-');
    if (parts.length > 1) {
      return parts.map((p, i) => i === parts.length - 1 ? p.slice(0, 3) : p).join('-');
    }
    return type.length > 12 ? type.slice(0, 12) + '...' : type;
  };

  // Get unique agent types for display
  const uniqueTypes = Array.from(new Set(team.members.map(m => m.agent_type)));

  const handleClick = () => {
    onSelect(team);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(team);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(team.id);
  };

  const styles = {
    card: {
      backgroundColor: COLORS.card,
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${COLORS.accent}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      height: '100%',
      position: 'relative' as const,
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
    },
    nameSection: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: '17px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '8px',
      letterSpacing: '-0.2px',
    },
    description: {
      fontSize: '14px',
      color: COLORS.textMuted,
      lineHeight: 1.6,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginBottom: '12px',
    },
    actionsContainer: {
      display: 'flex',
      gap: '8px',
      opacity: isHovered ? 1 : 0,
      transition: 'opacity 0.2s ease',
    },
    actionButton: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.bgAlt,
      color: COLORS.textMuted,
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      marginTop: 'auto',
    },
    memberCount: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.text,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    memberIcon: {
      fontSize: '16px',
    },
    agentPills: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '6px',
    },
    agentPill: {
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: `${COLORS.accent}15`,
      color: COLORS.accent,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.3px',
    },
  };

  return (
    <div
      style={styles.card}
      onClick={handleClick}
      onMouseOver={(e) => {
        setIsHovered(true);
        const element = e.currentTarget as HTMLDivElement;
        element.style.transform = 'translateY(-4px)';
        element.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.08)';
        element.style.borderLeftColor = COLORS.accentHover;
      }}
      onMouseOut={(e) => {
        setIsHovered(false);
        const element = e.currentTarget as HTMLDivElement;
        element.style.transform = 'translateY(0)';
        element.style.boxShadow = 'none';
        element.style.borderLeftColor = COLORS.accent;
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.nameSection}>
          <div style={styles.name}>{team.name}</div>
        </div>
        <div style={styles.actionsContainer}>
          <button
            style={styles.actionButton}
            onClick={handleEdit}
            title="Edit team"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.card;
              e.currentTarget.style.color = COLORS.accent;
              e.currentTarget.style.borderColor = COLORS.accent;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgAlt;
              e.currentTarget.style.color = COLORS.textMuted;
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            ✎
          </button>
          <button
            style={styles.actionButton}
            onClick={handleDelete}
            title="Delete team"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.dangerBg;
              e.currentTarget.style.color = COLORS.danger;
              e.currentTarget.style.borderColor = COLORS.danger;
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
      </div>

      {/* Description */}
      <div style={styles.description}>{team.description}</div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.memberCount}>
          <span style={styles.memberIcon}>👥</span>
          {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
        </div>
      </div>

      {/* Agent Type Pills */}
      <div style={styles.agentPills}>
        {uniqueTypes.slice(0, 4).map((type, index) => (
          <span key={index} style={styles.agentPill}>
            {shortenAgentType(type)}
          </span>
        ))}
        {uniqueTypes.length > 4 && (
          <span style={{ ...styles.agentPill, backgroundColor: COLORS.bgAlt, color: COLORS.textMuted }}>
            +{uniqueTypes.length - 4}
          </span>
        )}
      </div>
    </div>
  );
};

export default TeamCard;
