import { useState } from 'react';
import { X, Play, Sparkles, Wrench, Award, Clock, CheckCircle, XCircle, Loader, Edit2, Trash2, Save, XOctagon } from 'lucide-react';
import { GlassCard, StatusIndicator, NeuralModal, NeuralButton } from '../shared';
import type { Agent, AgentUpdateData } from '../../stores/agentsStore';
import { useAgentsStore } from '../../stores/agentsStore';

export interface AgentDetailPanelProps {
  agent: Agent;
  onClose: () => void;
}

// Category color mapping (same as AgentCard)
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
  default: '#6b7280',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
}

/**
 * AgentDetailPanel - Slide-out panel showing full agent details with edit/delete
 *
 * Features:
 * - Right-side panel (400px wide)
 * - Glass background
 * - Full agent details (name, description, model, category, tools, skills)
 * - Edit mode (inline editing)
 * - Delete with confirmation
 * - Execute button
 * - Execution history
 * - Close button
 */
export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const [taskInput, setTaskInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<AgentUpdateData>({
    name: agent.name,
    description: agent.description,
    model: agent.model,
    tools: agent.tools,
    icon: agent.icon,
    system_prompt: agent.system_prompt,
    color: agent.color,
    phase: agent.phase,
  });

  const executeAgent = useAgentsStore((state) => state.executeAgent);
  const updateAgent = useAgentsStore((state) => state.updateAgent);
  const deleteAgent = useAgentsStore((state) => state.deleteAgent);

  const categoryColor = getCategoryColor(agent.category);
  const isSystemAgent = agent.ownership === 'system';

  const handleExecute = async () => {
    if (!taskInput.trim() || isExecuting) {return;}

    setIsExecuting(true);
    try {
      await executeAgent(agent.id, taskInput);
      setTaskInput('');
    } catch (error) {
      console.error('Failed to execute agent:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) {return;}

    setIsSaving(true);
    try {
      await updateAgent(agent.slug, editForm);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save agent:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: agent.name,
      description: agent.description,
      model: agent.model,
      tools: agent.tools,
      icon: agent.icon,
      system_prompt: agent.system_prompt,
      color: agent.color,
      phase: agent.phase,
    });
    setIsEditMode(false);
  };

  const handleDelete = async () => {
    if (isDeleting) {return;}

    setIsDeleting(true);
    try {
      await deleteAgent(agent.slug);
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete agent:', error);
      setIsDeleting(false);
    }
  };

  const handleToolAdd = (tool: string) => {
    if (!tool.trim()) {return;}
    setEditForm((prev) => ({
      ...prev,
      tools: [...(prev.tools || []), tool.trim()],
    }));
  };

  const handleToolRemove = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      tools: prev.tools?.filter((_, i) => i !== index) || [],
    }));
  };

  const getExecutionIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'failed':
        return <XCircle size={16} style={{ color: '#ef4444' }} />;
      case 'running':
        return <Loader size={16} style={{ color: '#00d4ff' }} className="animate-spin" />;
      default:
        return <Clock size={16} style={{ color: '#6b7280' }} />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(5, 5, 10, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 ni-scrollbar"
        style={{
          width: '400px',
          background: 'rgba(15, 15, 25, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
          overflowY: 'auto',
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            position: 'sticky',
            top: 0,
            background: 'rgba(15, 15, 25, 0.95)',
            backdropFilter: 'blur(40px)',
            zIndex: 10,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: `${categoryColor}15`,
                  border: `1px solid ${categoryColor}40`,
                }}
              >
                {agent.icon ? (
                  <span style={{ fontSize: '28px' }}>{agent.icon}</span>
                ) : (
                  <Sparkles size={28} style={{ color: categoryColor }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#f0f0f5',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '8px',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00d4ff';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                  />
                ) : (
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#f0f0f5',
                      margin: '0 0 8px 0',
                      lineHeight: 1.3,
                    }}
                  >
                    {agent.name}
                  </h2>
                )}
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: `${categoryColor}20`,
                      color: categoryColor,
                      border: `1px solid ${categoryColor}40`,
                    }}
                  >
                    {agent.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Edit Button */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                disabled={isSystemAgent}
                title={isSystemAgent ? 'System agents cannot be modified' : 'Edit agent'}
                className="flex-shrink-0 flex items-center justify-center transition-colors duration-200"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isEditMode ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: isEditMode ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isEditMode ? '#00d4ff' : '#6b7280',
                  cursor: isSystemAgent ? 'not-allowed' : 'pointer',
                  opacity: isSystemAgent ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSystemAgent) {
                    e.currentTarget.style.color = '#00d4ff';
                    e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSystemAgent && !isEditMode) {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
              >
                <Edit2 size={18} />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isSystemAgent}
                title={isSystemAgent ? 'System agents cannot be deleted' : 'Delete agent'}
                className="flex-shrink-0 flex items-center justify-center transition-colors duration-200"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#6b7280',
                  cursor: isSystemAgent ? 'not-allowed' : 'pointer',
                  opacity: isSystemAgent ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSystemAgent) {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSystemAgent) {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
              >
                <Trash2 size={18} />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 flex items-center justify-center transition-colors duration-200"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f0f0f5';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <StatusIndicator status={agent.status} text={agent.status} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Description */}
          <div>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#f0f0f5',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Description
            </h3>
            {isEditMode ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#f0f0f5',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00d4ff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              />
            ) : (
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#9ca3af',
                  margin: 0,
                }}
              >
                {agent.description}
              </p>
            )}
          </div>

          {/* Model */}
          <div>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#f0f0f5',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Model
            </h3>
            {isEditMode ? (
              <input
                type="text"
                value={editForm.model}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#f0f0f5',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00d4ff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#f0f0f5',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {agent.model}
              </div>
            )}
          </div>

          {/* Tools */}
          {(agent.tools && agent.tools.length > 0) || isEditMode ? (
            <div>
              <h3
                className="flex items-center gap-2"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <Wrench size={16} />
                Tools ({editForm.tools?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(isEditMode ? editForm.tools : agent.tools)?.map((tool, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 212, 255, 0.1)',
                      color: '#00d4ff',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {tool}
                    {isEditMode && (
                      <button
                        onClick={() => handleToolRemove(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00d4ff',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
                {isEditMode && (
                  <input
                    type="text"
                    placeholder="Add tool..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleToolAdd(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#f0f0f5',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      outline: 'none',
                      minWidth: '120px',
                    }}
                  />
                )}
              </div>
            </div>
          ) : null}

          {/* Skills */}
          {agent.skills && agent.skills.length > 0 && (
            <div>
              <h3
                className="flex items-center gap-2"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <Award size={16} />
                Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {agent.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Edit Mode Actions */}
          {isEditMode && (
            <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <NeuralButton
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </NeuralButton>
              <NeuralButton
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <XOctagon size={18} />
                Cancel
              </NeuralButton>
            </div>
          )}

          {/* Execute Section */}
          {!isEditMode && (
            <div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Execute Task
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Describe the task..."
                  disabled={isExecuting}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    color: '#f0f0f5',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#00d4ff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                />
                <button
                  onClick={handleExecute}
                  disabled={!taskInput.trim() || isExecuting}
                  className="flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    background: isExecuting || !taskInput.trim()
                      ? 'rgba(0, 212, 255, 0.1)'
                      : 'rgba(0, 212, 255, 0.2)',
                    color: '#00d4ff',
                    border: '1px solid rgba(0, 212, 255, 0.4)',
                    cursor: isExecuting || !taskInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: isExecuting || !taskInput.trim() ? 0.5 : 1,
                  }}
                >
                  {isExecuting ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Execute
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Execution History */}
          {!isEditMode && agent.executionHistory && agent.executionHistory.length > 0 && (
            <div>
              <h3
                className="flex items-center gap-2"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <Clock size={16} />
                Recent Executions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {agent.executionHistory.slice(0, 5).map((execution) => (
                  <GlassCard
                    key={execution.id}
                    variant="bordered"
                    style={{
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getExecutionIcon(execution.status)}
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#f0f0f5',
                          }}
                        >
                          {execution.status}
                        </span>
                      </div>
                      {execution.duration && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                          }}
                        >
                          {execution.duration}ms
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        lineHeight: 1.4,
                        color: '#9ca3af',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {execution.task}
                    </p>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                      }}
                    >
                      {new Date(execution.timestamp).toLocaleString()}
                    </span>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <NeuralModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Agent"
        footer={
          <>
            <NeuralButton variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </NeuralButton>
            <NeuralButton variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete
                </>
              )}
            </NeuralButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#9ca3af', margin: 0 }}>
            Are you sure you want to delete <strong style={{ color: '#f0f0f5' }}>{agent.name}</strong>?
          </p>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#9ca3af', margin: 0 }}>
            This will archive this agent. This action can be undone by restoring the agent from the archive.
          </p>
        </div>
      </NeuralModal>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
