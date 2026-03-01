/**
 * AgentSkillsTab - Drag-and-drop skill assignment
 *
 * Two-panel layout:
 * - Left: Assigned skills (sortable via drag, removable)
 * - Right: Available skills pool (draggable to assign)
 *
 * Uses @dnd-kit for drag-and-drop between panels.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Play, Plus, Search, ChevronDown } from 'lucide-react';
import type { SkillSummary, SkillExecuteResponse } from '../../types/skills';

interface SkillsAgent {
  id: string;
  name?: string;
  slug?: string;
}

interface AgentSkillsTabProps {
  agent: SkillsAgent;
  onSkillsChanged?: () => void;
}

interface AssignedSkill {
  id: string;
  name: string;
  display_name?: string;
  summary: string;
  skill_type: string;
  category: string;
  enabled: boolean;
  execution_count: number;
}

interface AgentSkillsResponse {
  agent_id: string;
  agent_slug: string;
  skill_ids: string[];
  skills: AssignedSkill[];
}

const CYAN = '#00d4ff';
const TEXT = '#f0f0f5';
const TEXT_MUTED = '#9ca3af';
const BG_CARD = 'rgba(255, 255, 255, 0.04)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const SUCCESS = '#10b981';
const DANGER = '#ef4444';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'mcp_tool': return '#3B82F6';
    case 'workflow': return '#8B5CF6';
    case 'knowledge': return '#10B981';
    case 'composite': return '#F59E0B';
    case 'prompt': return '#EC4899';
    default: return CYAN;
  }
};

// ─── Sortable Skill Card ──────────────────────────────────────────────
function SortableSkillCard({
  skill,
  onRemove,
  onExecute,
  isExecuting,
  executionResult,
}: {
  skill: AssignedSkill;
  onRemove: () => void;
  onExecute: () => void;
  isExecuting: boolean;
  executionResult?: { success: boolean; error?: string; duration_ms?: number } | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const typeColor = getTypeColor(skill.skill_type);

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          backgroundColor: BG_CARD,
          borderRadius: '10px',
          padding: '12px 14px',
          border: `1px solid ${isDragging ? CYAN : BORDER}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'border-color 0.2s',
        }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            color: TEXT_MUTED,
            flexShrink: 0,
            touchAction: 'none',
          }}
        >
          <GripVertical size={16} />
        </div>

        {/* Type Badge */}
        <span style={{
          display: 'inline-flex', padding: '2px 6px', borderRadius: '4px',
          fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.5px', backgroundColor: `${typeColor}18`,
          color: typeColor, flexShrink: 0,
        }}>
          {skill.skill_type.replace('_', ' ')}
        </span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '2px' }}>
            {skill.display_name || skill.name}
          </div>
          <div style={{
            fontSize: '11px', color: TEXT_MUTED, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {skill.summary}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={onExecute}
          disabled={isExecuting || !skill.enabled}
          title="Execute skill"
          style={{
            padding: '4px 10px', borderRadius: '5px', fontSize: '11px',
            fontWeight: 600, cursor: 'pointer', border: `1px solid rgba(16, 185, 129, 0.4)`,
            backgroundColor: 'rgba(16, 185, 129, 0.1)', color: SUCCESS,
            flexShrink: 0, opacity: (!skill.enabled || isExecuting) ? 0.5 : 1,
          }}
        >
          {isExecuting ? '...' : <Play size={12} />}
        </button>
        <button
          onClick={onRemove}
          title="Remove skill"
          style={{
            padding: '4px', borderRadius: '5px', cursor: 'pointer',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: DANGER,
            flexShrink: 0, display: 'flex', alignItems: 'center',
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Execution Result */}
      {executionResult && (
        <div style={{
          padding: '8px 12px', borderRadius: '6px', marginTop: '4px',
          backgroundColor: executionResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${executionResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '12px', color: executionResult.success ? SUCCESS : DANGER,
        }}>
          {executionResult.success
            ? `Executed in ${executionResult.duration_ms}ms`
            : `Failed: ${executionResult.error || 'Unknown error'}`
          }
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export const AgentSkillsTab: React.FC<AgentSkillsTabProps> = ({ agent, onSkillsChanged }) => {
  const [assignedSkills, setAssignedSkills] = useState<AssignedSkill[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SkillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAvailable, setShowAvailable] = useState(false);
  const [executingSkillId, setExecutingSkillId] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, { success: boolean; error?: string; duration_ms?: number }>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const agentSlug = agent.slug || agent.id;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchAssigned = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/agents/${agentSlug}/skills`);
        if (response.ok) {
          const data: AgentSkillsResponse = await response.json();
          setAssignedIds(data.skill_ids);
          setAssignedSkills(data.skills);
        } else {
          setAssignedIds([]);
          setAssignedSkills([]);
        }
      } catch {
        setAssignedIds([]);
        setAssignedSkills([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssigned();
  }, [agentSlug]);

  useEffect(() => {
    if (!showAvailable) {return;}
    const fetchAvailable = async () => {
      try {
        const response = await fetch('/api/v1/skills?page_size=100');
        if (response.ok) {
          const data = await response.json();
          setAvailableSkills(data.skills || []);
        }
      } catch {
        // Silently fail
      }
    };
    fetchAvailable();
  }, [showAvailable]);

  const handleAssignSkill = async (skillId: string) => {
    setSaving(true);
    setError(null);
    try {
      const newIds = [...assignedIds, skillId];
      const response = await fetch(`/api/v1/agents/${agentSlug}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_ids: newIds }),
      });
      if (!response.ok) {throw new Error('Failed to assign skill');}
      setAssignedIds(newIds);
      const skill = availableSkills.find(s => s.id === skillId);
      if (skill) {
        setAssignedSkills(prev => [...prev, {
          id: skill.id, name: skill.name, display_name: skill.display_name,
          summary: skill.summary, skill_type: skill.skill_type,
          category: skill.category, enabled: skill.enabled,
          execution_count: skill.execution_count,
        }]);
      }
      onSkillsChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign skill');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignSkill = async (skillId: string) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/agents/${agentSlug}/skills/${skillId}`, { method: 'DELETE' });
      if (!response.ok) {throw new Error('Failed to unassign skill');}
      setAssignedIds(prev => prev.filter(id => id !== skillId));
      setAssignedSkills(prev => prev.filter(s => s.id !== skillId));
      onSkillsChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign skill');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteSkill = async (skillId: string) => {
    setExecutingSkillId(skillId);
    try {
      const response = await fetch(`/api/v1/agents/${agentSlug}/skills/${skillId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      setExecutionResults(prev => ({ ...prev, [skillId]: result }));
    } catch (err) {
      setExecutionResults(prev => ({
        ...prev,
        [skillId]: { success: false, error: err instanceof Error ? err.message : 'Failed', duration_ms: 0 },
      }));
    } finally {
      setExecutingSkillId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) {return;}

    // Reorder assigned skills
    const oldIdx = assignedSkills.findIndex(s => s.id === active.id);
    const newIdx = assignedSkills.findIndex(s => s.id === over.id);
    if (oldIdx >= 0 && newIdx >= 0) {
      const updated = [...assignedSkills];
      const [moved] = updated.splice(oldIdx, 1);
      updated.splice(newIdx, 0, moved);
      setAssignedSkills(updated);
      setAssignedIds(updated.map(s => s.id));
    }
  };

  const filteredAvailable = availableSkills.filter(skill => {
    if (assignedIds.includes(skill.id)) {return false;}
    if (!search) {return true;}
    const q = search.toLowerCase();
    return (
      skill.name.toLowerCase().includes(q) ||
      skill.summary.toLowerCase().includes(q) ||
      skill.category.toLowerCase().includes(q)
    );
  });

  const activeSkill = activeId ? assignedSkills.find(s => s.id === activeId) : null;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: TEXT_MUTED }}>
        Loading skills...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: DANGER, fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT, letterSpacing: '-0.2px' }}>
            Assigned Skills ({assignedSkills.length})
          </div>
          <div style={{ fontSize: '13px', color: TEXT_MUTED, marginTop: '4px' }}>
            Drag to reorder &middot; Skills this agent can execute
          </div>
        </div>
        <button
          onClick={() => setShowAvailable(!showAvailable)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 212, 255, 0.2)',
            color: CYAN,
            border: '1px solid rgba(0, 212, 255, 0.4)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {showAvailable ? 'Close' : <><Plus size={14} /> Assign Skills</>}
        </button>
      </div>

      {/* Assigned Skills - Sortable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={assignedSkills.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {assignedSkills.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px', color: TEXT_MUTED,
              borderRadius: '10px', border: `2px dashed ${BORDER}`,
              background: BG_CARD,
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>&#9881;</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No skills assigned</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>
                Click "Assign Skills" to add skills from the library
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {assignedSkills.map((skill) => (
                <SortableSkillCard
                  key={skill.id}
                  skill={skill}
                  onRemove={() => handleUnassignSkill(skill.id)}
                  onExecute={() => handleExecuteSkill(skill.id)}
                  isExecuting={executingSkillId === skill.id}
                  executionResult={executionResults[skill.id]}
                />
              ))}
            </div>
          )}
        </SortableContext>

        <DragOverlay>
          {activeSkill ? (
            <div style={{
              backgroundColor: 'rgba(0, 212, 255, 0.15)',
              borderRadius: '10px',
              padding: '12px 14px',
              border: `1px solid ${CYAN}`,
              boxShadow: '0 8px 24px rgba(0, 212, 255, 0.2)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>
                {activeSkill.display_name || activeSkill.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Available Skills Panel */}
      {showAvailable && (
        <div style={{
          borderTop: `1px solid ${BORDER}`, paddingTop: '20px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT, letterSpacing: '-0.2px' }}>
            Available Skills
          </div>
          <div style={{ fontSize: '13px', color: TEXT_MUTED, marginTop: '4px', marginBottom: '12px' }}>
            Click "Assign" to add skills to this agent
          </div>

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={14} style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', color: TEXT_MUTED, pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 34px',
                backgroundColor: BG_CARD, border: `1px solid ${BORDER}`,
                borderRadius: '8px', color: TEXT, fontSize: '13px', outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
            />
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: '6px',
            maxHeight: '300px', overflowY: 'auto',
          }}>
            {filteredAvailable.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: TEXT_MUTED, fontSize: '13px' }}>
                {availableSkills.length === 0
                  ? 'No skills found. Create skills on the Skills page first.'
                  : 'No matching skills found.'}
              </div>
            ) : (
              filteredAvailable.map((skill) => {
                const typeColor = getTypeColor(skill.skill_type);
                return (
                  <div key={skill.id} style={{
                    backgroundColor: BG_CARD, borderRadius: '10px',
                    padding: '12px 14px', border: `1px solid ${BORDER}`,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{
                      display: 'inline-flex', padding: '2px 6px', borderRadius: '4px',
                      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.5px', backgroundColor: `${typeColor}18`,
                      color: typeColor, flexShrink: 0,
                    }}>
                      {skill.skill_type.replace('_', ' ')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '2px' }}>
                        {skill.display_name || skill.name}
                      </div>
                      <div style={{
                        fontSize: '11px', color: TEXT_MUTED, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {skill.summary}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignSkill(skill.id)}
                      disabled={saving}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0, 212, 255, 0.4)',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)', color: CYAN,
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
                        opacity: saving ? 0.5 : 1,
                      }}
                    >
                      <Plus size={12} />
                      Assign
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSkillsTab;
