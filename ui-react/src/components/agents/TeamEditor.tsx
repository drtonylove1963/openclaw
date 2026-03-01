import React, { useState, useMemo } from 'react';
import type { SavedTeam, AgentTeamMember } from '../../types/agentTeams';
import type { Agent } from '../../types/agent';
import { agentTeamsService } from '../../services/agentTeamsService';
import { COLORS } from '../../styles/colors';

interface TeamEditorProps {
  team: SavedTeam | null; // null = create new
  agents: Agent[];
  onSave: (team: SavedTeam) => void;
  onClose: () => void;
}

export const TeamEditor: React.FC<TeamEditorProps> = ({ team, agents, onSave, onClose }) => {
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [selectedMembers, setSelectedMembers] = useState<AgentTeamMember[]>(team?.members || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const isEditing = team !== null;

  // Filter available agents based on search
  const filteredAgents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return agents.filter(agent =>
      agent.name.toLowerCase().includes(query) ||
      agent.category.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  // Check if an agent is already selected
  const isAgentSelected = (agentId: string): boolean => {
    return selectedMembers.some(m => m.agent_type === agentId);
  };

  const handleAddMember = (agent: Agent) => {
    if (!isAgentSelected(agent.id)) {
      setSelectedMembers([
        ...selectedMembers,
        {
          agent_type: agent.id,
          agent_name: agent.name,
          role: agent.category,
        },
      ]);
      setSearchQuery(''); // Clear search after adding
    }
  };

  const handleRemoveMember = (agentType: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.agent_type !== agentType));
  };

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('At least one team member is required');
      return;
    }

    const savedTeam: SavedTeam = {
      id: team?.id || crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      members: selectedMembers,
      created_at: team?.created_at || new Date().toISOString(),
    };

    onSave(savedTeam);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
      maxWidth: '700px',
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
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      color: COLORS.text,
      letterSpacing: '-0.3px',
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
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '32px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.text,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    input: {
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: COLORS.text,
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      transition: 'all 0.2s ease',
      outline: 'none',
    },
    textarea: {
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: COLORS.text,
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      transition: 'all 0.2s ease',
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical' as const,
    },
    selectedMembersContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '4px',
    },
    memberPill: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: `${COLORS.accent}15`,
      color: COLORS.accent,
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      border: `1px solid ${COLORS.accent}30`,
    },
    removeButton: {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: 'transparent',
      border: 'none',
      color: COLORS.accent,
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      padding: 0,
    },
    agentsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      maxHeight: '300px',
      overflowY: 'auto' as const,
      padding: '4px',
    },
    agentItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    agentItemSelected: {
      backgroundColor: `${COLORS.success}15`,
      borderColor: COLORS.success,
    },
    agentInfo: {
      flex: 1,
      minWidth: 0,
    },
    agentName: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '4px',
    },
    agentCategory: {
      fontSize: '12px',
      color: COLORS.textMuted,
    },
    addButton: {
      padding: '6px 12px',
      backgroundColor: COLORS.accent,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    checkmark: {
      fontSize: '16px',
      color: COLORS.success,
    },
    footer: {
      padding: '20px 32px',
      borderTop: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    },
    errorMessage: {
      fontSize: '13px',
      color: COLORS.danger,
      fontWeight: 500,
      flex: 1,
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
    },
    cancelButton: {
      padding: '12px 24px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    saveButton: {
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
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 700,
      color: COLORS.text,
      marginBottom: '4px',
      letterSpacing: '-0.2px',
    },
    emptyState: {
      padding: '40px 20px',
      textAlign: 'center' as const,
      color: COLORS.textMuted,
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{isEditing ? 'Edit Team' : 'Create Team'}</h2>
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

        {/* Content */}
        <div style={styles.content}>
          {/* Team Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Team Name</label>
            <input
              type="text"
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent;
                e.currentTarget.style.backgroundColor = COLORS.card;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.backgroundColor = COLORS.bgAlt;
              }}
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this team"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent;
                e.currentTarget.style.backgroundColor = COLORS.card;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.backgroundColor = COLORS.bgAlt;
              }}
            />
          </div>

          {/* Selected Members */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Team Members ({selectedMembers.length})</label>
            {selectedMembers.length > 0 ? (
              <div style={styles.selectedMembersContainer}>
                {selectedMembers.map((member) => (
                  <div key={member.agent_type} style={styles.memberPill}>
                    <span>{member.agent_name || member.agent_type}</span>
                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemoveMember(member.agent_type)}
                      title="Remove member"
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.danger;
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = COLORS.accent;
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: COLORS.textMuted, fontStyle: 'italic' }}>
                No members added yet
              </div>
            )}
          </div>

          {/* Add Members */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Add Agents</label>
            <input
              type="text"
              style={styles.input}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents by name or category..."
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent;
                e.currentTarget.style.backgroundColor = COLORS.card;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.backgroundColor = COLORS.bgAlt;
              }}
            />
            <div style={styles.agentsList}>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => {
                  const isSelected = isAgentSelected(agent.id);
                  return (
                    <div
                      key={agent.id}
                      style={{
                        ...styles.agentItem,
                        ...(isSelected ? styles.agentItemSelected : {}),
                      }}
                      onClick={() => !isSelected && handleAddMember(agent)}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = COLORS.card;
                          e.currentTarget.style.borderColor = COLORS.accent;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = COLORS.bgAlt;
                          e.currentTarget.style.borderColor = COLORS.border;
                        }
                      }}
                    >
                      <div style={styles.agentInfo}>
                        <div style={styles.agentName}>{agent.name}</div>
                        <div style={styles.agentCategory}>{agent.category}</div>
                      </div>
                      {isSelected ? (
                        <span style={styles.checkmark}>✓</span>
                      ) : (
                        <button
                          style={styles.addButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMember(agent);
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.accentHover;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.accent;
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={styles.emptyState}>
                  {searchQuery ? 'No agents found matching your search' : 'No agents available'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {error && <div style={styles.errorMessage}>{error}</div>}
          <div style={styles.buttonGroup}>
            <button
              style={styles.cancelButton}
              onClick={onClose}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.card;
                e.currentTarget.style.borderColor = COLORS.accent;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.bgAlt;
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            >
              Cancel
            </button>
            <button
              style={styles.saveButton}
              onClick={handleSave}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accent;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isEditing ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamEditor;
