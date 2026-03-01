/**
 * TeamWorkflowsTab - N8N-style visual workflow orchestration
 *
 * Two modes:
 * 1. Workflow List - Shows saved projects/workflows as cards with full CRUD
 * 2. Workflow Builder - Drag-and-drop canvas to orchestrate teams visually
 *
 * Users can drag teams and agents onto a canvas, connect them with
 * dependency arrows, configure execution order, and save workflows.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GlassCard, NeuralModal, NeuralButton, NeuralEmptyState } from '../shared';
import {
  GitBranch, Plus, FolderKanban, Users, ArrowRight,
  ChevronDown, MessageSquare, Loader, Sparkles, X,
  Pencil, Trash2, ArrowLeft, Save, Play,
} from 'lucide-react';
import { useAgentsStore } from '../../stores/agentsStore';
import { agentTeamsService } from '../../services/agentTeamsService';
import { WorkflowCanvas } from './WorkflowCanvas';
import type { PaletteItem } from './PalettePanel';
import type { Node, Edge } from 'reactflow';
import type {
  ProjectSession, SavedTeam, TeamRole,
  CrossTeamDependency, CrossTeamMessage, TeamPlan,
} from '../../types/agentTeams';

const TEAM_ROLES: TeamRole[] = ['backend', 'frontend', 'database', 'testing', 'devops', 'design', 'custom'];

const CYAN = '#00d4ff';
const TEXT = '#f0f0f5';
const TEXT_MUTED = '#9ca3af';
const BG_CARD = 'rgba(255, 255, 255, 0.04)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const SUCCESS = '#10b981';

const ROLE_COLORS: Record<string, string> = {
  backend: '#3b82f6',
  frontend: '#14b8a6',
  database: '#84cc16',
  testing: '#10b981',
  devops: '#f59e0b',
  design: '#8b5cf6',
  custom: '#6b7280',
};

const STORAGE_KEY = 'pronetheia-workflow-canvases';

interface WorkflowCanvasState {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  created_at: string;
  updated_at: string;
}

function loadSavedWorkflows(): WorkflowCanvasState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWorkflows(workflows: WorkflowCanvasState[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export function TeamWorkflowsTab() {
  const { agents } = useAgentsStore();
  const [workflows, setWorkflows] = useState<WorkflowCanvasState[]>([]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowCanvasState | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Builder state
  const [builderName, setBuilderName] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderNodes, setBuilderNodes] = useState<Node[]>([]);
  const [builderEdges, setBuilderEdges] = useState<Edge[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // NL Compose
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [composePlan, setComposePlan] = useState<TeamPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWorkflows(loadSavedWorkflows());
    setSavedTeams(agentTeamsService.getSavedTeams());
  }, []);

  // Build palette items: include both individual agents and saved teams
  const paletteItems: PaletteItem[] = useMemo(() => {
    const teamItems: PaletteItem[] = savedTeams.map((team) => ({
      id: `team-${team.id}`,
      type: 'canvasNode',
      label: team.name,
      icon: <Users size={16} />,
      category: 'Teams',
      color: '#8b5cf6',
      data: {
        label: team.name,
        subtitle: `${team.members.length} members`,
        icon: undefined,
        color: '#8b5cf6',
        status: 'idle',
        badges: team.members.slice(0, 2).map((m) => m.agent_name || m.agent_type),
        teamId: team.id,
        nodeKind: 'team',
      },
    }));

    const agentItems: PaletteItem[] = agents.slice(0, 30).map((agent) => ({
      id: `agent-${agent.id}`,
      type: 'canvasNode',
      label: agent.name,
      icon: agent.icon ? <span>{agent.icon}</span> : undefined,
      category: agent.category || 'Agents',
      color: '#00d4ff',
      data: {
        label: agent.name,
        subtitle: agent.category || 'Agent',
        icon: agent.icon || undefined,
        color: '#00d4ff',
        status: 'idle',
        agentId: agent.id,
        nodeKind: 'agent',
      },
    }));

    // Add special workflow nodes
    const workflowNodes: PaletteItem[] = [
      {
        id: 'trigger-start', type: 'canvasNode', label: 'Start Trigger',
        category: 'Workflow', color: '#10b981',
        data: { label: 'Start', subtitle: 'Workflow trigger', color: '#10b981', icon: undefined, status: 'idle', nodeKind: 'trigger' },
      },
      {
        id: 'gate-condition', type: 'canvasNode', label: 'Condition Gate',
        category: 'Workflow', color: '#f59e0b',
        data: { label: 'Condition', subtitle: 'Branch logic', color: '#f59e0b', icon: undefined, status: 'idle', nodeKind: 'gate' },
      },
      {
        id: 'merge-join', type: 'canvasNode', label: 'Merge/Join',
        category: 'Workflow', color: '#6366f1',
        data: { label: 'Merge', subtitle: 'Join parallel branches', color: '#6366f1', icon: undefined, status: 'idle', nodeKind: 'merge' },
      },
      {
        id: 'output-end', type: 'canvasNode', label: 'Output',
        category: 'Workflow', color: '#ec4899',
        data: { label: 'Output', subtitle: 'Workflow output', color: '#ec4899', icon: undefined, status: 'idle', nodeKind: 'output' },
      },
    ];

    return [...workflowNodes, ...teamItems, ...agentItems];
  }, [agents, savedTeams]);

  const openBuilder = useCallback((workflow?: WorkflowCanvasState) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setBuilderName(workflow.name);
      setBuilderDescription(workflow.description);
      setBuilderNodes(workflow.nodes);
      setBuilderEdges(workflow.edges);
    } else {
      setEditingWorkflow(null);
      setBuilderName('');
      setBuilderDescription('');
      setBuilderNodes([]);
      setBuilderEdges([]);
    }
    setViewMode('builder');
  }, []);

  const handleSaveWorkflow = useCallback(async () => {
    if (!builderName.trim() || isSaving) {return;}
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const wf: WorkflowCanvasState = {
        id: editingWorkflow?.id || crypto.randomUUID(),
        name: builderName.trim(),
        description: builderDescription.trim(),
        nodes: builderNodes,
        edges: builderEdges,
        created_at: editingWorkflow?.created_at || now,
        updated_at: now,
      };

      const current = loadSavedWorkflows();
      const idx = current.findIndex((w) => w.id === wf.id);
      if (idx >= 0) {
        current[idx] = wf;
      } else {
        current.push(wf);
      }
      saveWorkflows(current);
      setWorkflows(current);
      setViewMode('list');
    } catch (err) {
      console.error('Failed to save workflow:', err);
    } finally {
      setIsSaving(false);
    }
  }, [builderName, builderDescription, builderNodes, builderEdges, editingWorkflow, isSaving]);

  const handleDelete = (id: string) => {
    const updated = workflows.filter((w) => w.id !== id);
    saveWorkflows(updated);
    setWorkflows(updated);
    setDeleteConfirmId(null);
  };

  const handleCanvasChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setBuilderNodes(nodes);
    setBuilderEdges(edges);
  }, []);

  const handleCompose = async () => {
    if (!composeText.trim()) {return;}
    setIsComposing(true);
    setComposePlan(null);
    try {
      const plan = await agentTeamsService.compose(composeText.trim());
      setComposePlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compose failed');
    } finally {
      setIsComposing(false);
    }
  };

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
        {data.nodeKind && (
          <div>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 8px',
              borderRadius: '4px', backgroundColor: `${data.color || CYAN}18`,
              color: data.color || CYAN, textTransform: 'uppercase',
            }}>
              {data.nodeKind}
            </span>
          </div>
        )}
        {data.badges && data.badges.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Members
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {data.badges.map((badge: string, i: number) => (
                <span key={i} style={{
                  fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                  background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
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
            value={builderName}
            onChange={(e) => setBuilderName(e.target.value)}
            placeholder="Workflow name..."
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

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: '12px', color: TEXT_MUTED }}>
            {builderNodes.length} nodes &middot; {builderEdges.length} connections
          </span>

          <button
            onClick={handleSaveWorkflow}
            disabled={!builderName.trim() || isSaving}
            className="flex items-center gap-2"
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: 'rgba(0, 212, 255, 0.2)', color: CYAN,
              border: '1px solid rgba(0, 212, 255, 0.4)', cursor: 'pointer',
              opacity: (!builderName.trim() || isSaving) ? 0.5 : 1,
            }}
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : editingWorkflow ? 'Save Changes' : 'Save Workflow'}
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          <WorkflowCanvas
            paletteItems={paletteItems}
            initialNodes={builderNodes}
            initialEdges={builderEdges}
            paletteTitle="Workflow Nodes"
            emptyMessage="Drag teams and agents here to build your workflow"
            onChange={handleCanvasChange}
            onSave={() => handleSaveWorkflow()}
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
          Team Workflows ({workflows.length})
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2"
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 600, borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6',
              border: '1px solid rgba(139, 92, 246, 0.4)', cursor: 'pointer',
            }}
          >
            <Sparkles size={18} />
            NL Compose
          </button>
          <button
            onClick={() => openBuilder()}
            className="flex items-center gap-2"
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 600, borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.2)', color: CYAN,
              border: '1px solid rgba(0, 212, 255, 0.4)', cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            Build Workflow
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between" style={{
          padding: '10px 14px', borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444', fontSize: '13px', marginBottom: '16px',
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty State */}
      {workflows.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <NeuralEmptyState
            icon={<FolderKanban size={32} />}
            title="No Workflows Yet"
            description="Build your first workflow using the visual drag-and-drop builder, or use NL Compose to generate one automatically."
          />
        </div>
      )}

      {/* Workflows Grid */}
      {workflows.length > 0 && (
        <div
          className="flex-1 overflow-auto ni-scrollbar"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
            alignContent: 'start',
          }}
        >
          {workflows.map((wf) => (
            <GlassCard
              key={wf.id}
              variant="bordered"
              hoverable
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer' }}
              onClick={() => openBuilder(wf)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(0, 212, 255, 0.15)',
                    border: '1px solid rgba(0, 212, 255, 0.4)',
                  }}
                >
                  <FolderKanban size={24} style={{ color: CYAN }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, margin: '0 0 6px 0' }}>
                    {wf.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '12px', color: TEXT_MUTED }}>
                      {wf.nodes.length} nodes &middot; {wf.edges.length} connections
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openBuilder(wf)}
                    title="Edit workflow"
                    style={{
                      padding: '6px', borderRadius: '6px',
                      background: 'rgba(0, 212, 255, 0.1)',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      color: CYAN, cursor: 'pointer',
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(wf.id)}
                    title="Delete workflow"
                    style={{
                      padding: '6px', borderRadius: '6px',
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {wf.description && (
                <div style={{ fontSize: '13px', color: TEXT_MUTED, lineHeight: 1.5 }}>
                  {wf.description}
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#4b5563' }}>
                Updated {new Date(wf.updated_at).toLocaleDateString()}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <NeuralModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Workflow"
        footer={
          <>
            <NeuralButton variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</NeuralButton>
            <NeuralButton variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Delete Workflow
            </NeuralButton>
          </>
        }
      >
        <p style={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          Are you sure you want to delete this workflow? This action cannot be undone.
        </p>
      </NeuralModal>

      {/* NL Compose Modal */}
      <NeuralModal
        isOpen={showCompose}
        onClose={() => { setShowCompose(false); setComposeText(''); setComposePlan(null); }}
        title="Natural Language Compose"
        footer={
          <>
            <NeuralButton variant="secondary" onClick={() => { setShowCompose(false); setComposeText(''); setComposePlan(null); }}>
              Close
            </NeuralButton>
            {!composePlan && (
              <NeuralButton variant="primary" onClick={handleCompose} disabled={!composeText.trim() || isComposing}>
                {isComposing ? 'Generating...' : 'Generate Plan'}
              </NeuralButton>
            )}
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            placeholder="Describe what you want to build, e.g., 'Build a user authentication system with login, registration, and JWT tokens'"
            rows={4}
            style={{
              width: '100%', padding: '10px 14px', fontSize: '14px',
              color: TEXT, background: BG_CARD,
              border: `1px solid ${BORDER}`, borderRadius: '8px',
              resize: 'vertical', outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
          />

          {isComposing && (
            <div className="flex items-center justify-center gap-2" style={{ padding: '20px', color: TEXT_MUTED }}>
              <Loader size={16} className="animate-spin" />
              <span style={{ fontSize: '13px' }}>Generating team plan...</span>
            </div>
          )}

          {composePlan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex items-center gap-2">
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', textTransform: 'uppercase',
                }}>
                  {composePlan.workflow_type}
                </span>
                <span style={{ fontSize: '13px', color: TEXT_MUTED }}>
                  {composePlan.task_count} tasks &bull; {Math.round(composePlan.confidence * 100)}% confidence
                </span>
              </div>
              <div style={{
                padding: '12px 16px', borderRadius: '8px', background: BG_CARD,
                border: `1px solid ${BORDER}`, fontSize: '13px', color: TEXT_MUTED, lineHeight: 1.6,
              }}>
                {composePlan.reasoning}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {composePlan.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3" style={{
                    padding: '10px 14px', borderRadius: '8px',
                    background: BG_CARD, border: `1px solid ${BORDER}`,
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: CYAN, width: '24px', flexShrink: 0 }}>
                      #{i + 1}
                    </span>
                    <span style={{ fontSize: '13px', color: TEXT, flex: 1 }}>{task.title}</span>
                    <span style={{
                      fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: 'rgba(0, 212, 255, 0.1)', color: CYAN,
                    }}>
                      {task.agent_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </NeuralModal>
    </div>
  );
}
