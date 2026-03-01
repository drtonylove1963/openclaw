/**
 * AgentTeamsTab - N8N-style visual team builder
 *
 * Two modes:
 * 1. Team List View - Shows saved teams as cards with full CRUD
 * 2. Team Builder View - Drag-and-drop canvas to compose teams visually
 *
 * Users can drag agents from a palette onto a canvas to build teams,
 * connect agents to define collaboration flows, then save the team.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GlassCard, NeuralModal, NeuralButton, NeuralEmptyState } from '../shared';
import {
  Users, Plus, Pencil, Trash2, ChevronDown, LayoutGrid,
  GitBranch, Eye, ArrowLeft, Save,
} from 'lucide-react';
import { useAgentsStore } from '../../stores/agentsStore';
import { agentTeamsService } from '../../services/agentTeamsService';
import { WorkflowCanvas } from './WorkflowCanvas';
import type { PaletteItem } from './PalettePanel';
import type { Node, Edge } from 'reactflow';
import type { SavedTeam, AgentTeamMember } from '../../types/agentTeams';

const WORKFLOW_TYPES = [
  'feature_development', 'bug_fix', 'code_review', 'refactoring',
  'testing', 'deployment', 'research', 'custom',
] as const;

const MEMBER_ROLES = [
  'lead', 'developer', 'reviewer', 'tester',
  'architect', 'devops', 'analyst', 'custom',
] as const;

const CYAN = '#00d4ff';
const TEXT = '#f0f0f5';
const TEXT_MUTED = '#9ca3af';
const BG_CARD = 'rgba(255, 255, 255, 0.04)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

const CATEGORY_COLORS: Record<string, string> = {
  development: '#00d4ff',
  testing: '#10b981',
  security: '#ef4444',
  devops: '#f59e0b',
  design: '#8b5cf6',
  planning: '#06b6d4',
  documentation: '#6366f1',
  debugging: '#ec4899',
  orchestration: '#a855f7',
  backend: '#3b82f6',
  frontend: '#14b8a6',
  database: '#84cc16',
  infrastructure: '#f97316',
};

const getWorkflowBadgeColor = (wf: string) => {
  switch (wf) {
    case 'feature_development': return '#00d4ff';
    case 'bug_fix': return '#ef4444';
    case 'code_review': return '#f59e0b';
    case 'refactoring': return '#8b5cf6';
    case 'testing': return '#10b981';
    case 'deployment': return '#3b82f6';
    case 'research': return '#ec4899';
    default: return '#6b7280';
  }
};

interface TeamCanvasData {
  nodes: Node[];
  edges: Edge[];
}

export function AgentTeamsTab() {
  const { agents } = useAgentsStore();
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [editingTeam, setEditingTeam] = useState<SavedTeam | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Builder state
  const [builderTeamName, setBuilderTeamName] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderWorkflowType, setBuilderWorkflowType] = useState<string>('feature_development');
  const [builderNodes, setBuilderNodes] = useState<Node[]>([]);
  const [builderEdges, setBuilderEdges] = useState<Edge[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTeams(agentTeamsService.getSavedTeams());
  }, []);

  // Build palette items from available agents
  const paletteItems: PaletteItem[] = useMemo(
    () =>
      agents.map((agent) => ({
        id: agent.id,
        type: 'canvasNode',
        label: agent.name,
        icon: agent.icon ? <span>{agent.icon}</span> : undefined,
        category: agent.category || 'Uncategorized',
        color: CATEGORY_COLORS[agent.category?.toLowerCase()] || '#6b7280',
        data: {
          label: agent.name,
          subtitle: `${agent.category} - ${agent.model}`,
          icon: agent.icon || undefined,
          color: CATEGORY_COLORS[agent.category?.toLowerCase()] || '#6b7280',
          status: agent.status === 'active' ? 'active' : 'idle',
          badges: agent.tools?.slice(0, 2) || [],
          agentId: agent.id,
          agentSlug: agent.slug,
          role: 'developer',
        },
      })),
    [agents]
  );

  const openBuilder = useCallback((team?: SavedTeam) => {
    if (team) {
      setEditingTeam(team);
      setBuilderTeamName(team.name);
      setBuilderDescription(team.description);
      setBuilderWorkflowType((team as any).workflow_type || 'feature_development');

      // Convert team members to canvas nodes
      const savedCanvas: TeamCanvasData | undefined = (team as any)._canvasData;
      if (savedCanvas) {
        setBuilderNodes(savedCanvas.nodes);
        setBuilderEdges(savedCanvas.edges);
      } else {
        // Generate nodes from members
        const memberNodes: Node[] = team.members.map((m, i) => {
          const agent = agents.find((a) => a.id === m.agent_type);
          return {
            id: `member-${m.agent_type}-${i}`,
            type: 'canvasNode',
            position: { x: 150 + (i % 3) * 260, y: 100 + Math.floor(i / 3) * 160 },
            data: {
              label: agent?.name || m.agent_name || m.agent_type,
              subtitle: `${agent?.category || 'agent'} - ${m.role || 'developer'}`,
              icon: agent?.icon || undefined,
              color: CATEGORY_COLORS[agent?.category?.toLowerCase() || ''] || '#6b7280',
              status: 'idle',
              agentId: m.agent_type,
              role: m.role || 'developer',
            },
          };
        });
        setBuilderNodes(memberNodes);
        setBuilderEdges([]);
      }
    } else {
      setEditingTeam(null);
      setBuilderTeamName('');
      setBuilderDescription('');
      setBuilderWorkflowType('feature_development');
      setBuilderNodes([]);
      setBuilderEdges([]);
    }
    setViewMode('builder');
  }, [agents]);

  const handleSaveTeam = async () => {
    if (!builderTeamName.trim() || builderNodes.length === 0 || isSaving) {return;}
    setIsSaving(true);
    try {
      const members: AgentTeamMember[] = builderNodes.map((node) => ({
        agent_type: node.data.agentId || node.id,
        agent_name: node.data.label,
        role: node.data.role || 'developer',
      }));

      const teamData: SavedTeam & { workflow_type?: string; _canvasData?: TeamCanvasData } = {
        id: editingTeam?.id || crypto.randomUUID(),
        name: builderTeamName.trim(),
        description: builderDescription.trim(),
        members,
        created_at: editingTeam?.created_at || new Date().toISOString(),
        workflow_type: builderWorkflowType,
        _canvasData: { nodes: builderNodes, edges: builderEdges },
      };

      agentTeamsService.saveTeam(teamData as SavedTeam);
      setTeams(agentTeamsService.getSavedTeams());
      setViewMode('list');
    } catch (error) {
      console.error('Failed to save team:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (teamId: string) => {
    agentTeamsService.deleteTeam(teamId);
    setTeams(agentTeamsService.getSavedTeams());
    setDeleteConfirmId(null);
  };

  const handleCanvasChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setBuilderNodes(nodes);
    setBuilderEdges(edges);
  }, []);

  const renderNodeConfig = useCallback((node: Node) => {
    const data = node.data;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>
            {data.label}
          </div>
          <div style={{ fontSize: '12px', color: TEXT_MUTED }}>{data.subtitle}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Role
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={data.role || 'developer'}
              onChange={(e) => {
                setBuilderNodes((prev) =>
                  prev.map((n) =>
                    n.id === node.id
                      ? { ...n, data: { ...n.data, role: e.target.value, subtitle: `${data.subtitle?.split(' - ')[0]} - ${e.target.value}` } }
                      : n
                  )
                );
              }}
              style={{
                width: '100%',
                padding: '8px 30px 8px 10px',
                fontSize: '13px',
                color: CYAN,
                background: BG_CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: '6px',
                cursor: 'pointer',
                appearance: 'none',
              }}
            >
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r} style={{ background: '#1a1a2e', color: TEXT }}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)', color: TEXT_MUTED, pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {data.badges && data.badges.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tools
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {data.badges.map((badge: string, i: number) => (
                <span key={i} style={{
                  fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                  background: 'rgba(0, 212, 255, 0.1)', color: CYAN,
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, []);

  // ─── Builder View ────────────────────────────────────────────────────
  if (viewMode === 'builder') {
    return (
      <div className="flex flex-col h-full" style={{ gap: '0' }}>
        {/* Builder Header */}
        <div
          className="flex items-center gap-3"
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${BORDER}`,
            background: 'rgba(15, 15, 25, 0.95)',
          }}
        >
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
            style={{
              padding: '6px 12px', borderRadius: '6px',
              background: BG_CARD, border: `1px solid ${BORDER}`,
              color: TEXT_MUTED, cursor: 'pointer', fontSize: '13px',
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <input
            type="text"
            value={builderTeamName}
            onChange={(e) => setBuilderTeamName(e.target.value)}
            placeholder="Team name..."
            style={{
              flex: 1, maxWidth: '280px', padding: '8px 12px', fontSize: '14px',
              fontWeight: 600, color: TEXT, background: BG_CARD,
              border: `1px solid ${BORDER}`, borderRadius: '8px', outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
          />

          <input
            type="text"
            value={builderDescription}
            onChange={(e) => setBuilderDescription(e.target.value)}
            placeholder="Description..."
            style={{
              flex: 1, maxWidth: '300px', padding: '8px 12px', fontSize: '13px',
              color: TEXT_MUTED, background: BG_CARD,
              border: `1px solid ${BORDER}`, borderRadius: '8px', outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
          />

          <div style={{ position: 'relative' }}>
            <select
              value={builderWorkflowType}
              onChange={(e) => setBuilderWorkflowType(e.target.value)}
              style={{
                padding: '8px 30px 8px 10px', fontSize: '12px', fontWeight: 600,
                color: getWorkflowBadgeColor(builderWorkflowType),
                background: BG_CARD, border: `1px solid ${BORDER}`,
                borderRadius: '6px', cursor: 'pointer', appearance: 'none',
              }}
            >
              {WORKFLOW_TYPES.map((wf) => (
                <option key={wf} value={wf} style={{ background: '#1a1a2e', color: TEXT }}>
                  {wf.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            <ChevronDown size={12} style={{
              position: 'absolute', right: '10px', top: '50%',
              transform: 'translateY(-50%)', color: TEXT_MUTED, pointerEvents: 'none',
            }} />
          </div>

          <div style={{ flex: 1 }} />

          <button
            onClick={handleSaveTeam}
            disabled={!builderTeamName.trim() || builderNodes.length === 0 || isSaving}
            className="flex items-center gap-2"
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: 'rgba(0, 212, 255, 0.2)', color: CYAN,
              border: '1px solid rgba(0, 212, 255, 0.4)', cursor: 'pointer',
              opacity: (!builderTeamName.trim() || builderNodes.length === 0 || isSaving) ? 0.5 : 1,
            }}
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : editingTeam ? 'Save Changes' : 'Save Team'}
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          <WorkflowCanvas
            paletteItems={paletteItems}
            initialNodes={builderNodes}
            initialEdges={builderEdges}
            paletteTitle="Agents"
            emptyMessage="Drag agents here to build your team"
            onChange={handleCanvasChange}
            onSave={(nodes, edges) => {
              setBuilderNodes(nodes);
              setBuilderEdges(edges);
              handleSaveTeam();
            }}
            renderConfigPanel={renderNodeConfig}
          />
        </div>
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: TEXT, margin: 0 }}>
          Agent Teams ({teams.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openBuilder()}
            className="flex items-center gap-2 transition-all duration-200"
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 600, borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.2)', color: CYAN,
              border: '1px solid rgba(0, 212, 255, 0.4)', cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            Build Team
          </button>
        </div>
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <NeuralEmptyState
            icon={<Users size={32} />}
            title="No Teams Yet"
            description="Build your first agent team using the visual drag-and-drop builder."
          />
        </div>
      )}

      {/* Teams Grid */}
      {teams.length > 0 && (
        <div
          className="flex-1 overflow-auto ni-scrollbar"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
            alignContent: 'start',
          }}
        >
          {teams.map((team) => {
            const wfType = (team).workflow_type || 'custom';
            const wfColor = getWorkflowBadgeColor(wfType);
            return (
              <GlassCard
                key={team.id}
                variant="bordered"
                hoverable
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                {/* Team Header */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                    }}
                  >
                    <Users size={24} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, margin: '0 0 6px 0', lineHeight: 1.3 }}>
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '4px', backgroundColor: `${wfColor}18`, color: wfColor,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {wfType.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '12px', color: TEXT_MUTED }}>
                        {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openBuilder(team)}
                      title="Edit team in builder"
                      style={{
                        padding: '6px', borderRadius: '6px',
                        background: 'rgba(0, 212, 255, 0.1)',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        color: CYAN, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(team.id)}
                      title="Delete team"
                      style={{
                        padding: '6px', borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {team.description && (
                  <div style={{ fontSize: '13px', color: TEXT_MUTED, lineHeight: 1.5 }}>
                    {team.description}
                  </div>
                )}

                {/* Members */}
                {team.members.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      Members
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {team.members.slice(0, 5).map((member: AgentTeamMember, idx: number) => {
                        const agent = agents.find((a) => a.id === member.agent_type);
                        return (
                          <span
                            key={idx}
                            className="flex items-center gap-1"
                            style={{
                              fontSize: '12px', fontWeight: 500, padding: '4px 10px',
                              borderRadius: '6px', background: 'rgba(0, 212, 255, 0.1)',
                              color: CYAN, border: '1px solid rgba(0, 212, 255, 0.2)',
                            }}
                          >
                            {agent?.name || member.agent_name || member.agent_type}
                            {member.role && (
                              <span style={{ color: TEXT_MUTED, fontSize: '11px', marginLeft: '4px' }}>
                                ({member.role})
                              </span>
                            )}
                          </span>
                        );
                      })}
                      {team.members.length > 5 && (
                        <span style={{
                          fontSize: '12px', fontWeight: 500, padding: '4px 10px',
                          borderRadius: '6px', background: BG_CARD,
                          color: '#6b7280', border: `1px solid ${BORDER}`,
                        }}>
                          +{team.members.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>
                  Created {new Date(team.created_at).toLocaleDateString()}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <NeuralModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Team"
        footer={
          <>
            <NeuralButton variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </NeuralButton>
            <NeuralButton variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Delete Team
            </NeuralButton>
          </>
        }
      >
        <p style={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          Are you sure you want to delete this team? This action cannot be undone.
        </p>
      </NeuralModal>
    </div>
  );
}
