/**
 * WorkflowCanvas - Center panel showing workflow detail
 * Features:
 * - Workflow overview (NOT a visual node editor)
 * - Execute, edit, and delete actions
 * - Status toggle
 * - Node and connection summary
 */

import { useState } from 'react';
import {
  Play,
  Pause,
  Trash2,
  ExternalLink,
  GitBranch,
  Activity,
  Calendar,
  Webhook,
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { GlassCard } from '../shared/GlassCard';
import { NeuralEmptyState } from '../shared/NeuralEmptyState';
import { NeuralModal, NeuralButton } from '../shared/NeuralModal';

export function WorkflowCanvas() {
  const {
    selectedWorkflow,
    executeWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
  } = useWorkflowStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // No workflow selected
  if (!selectedWorkflow) {
    return (
      <GlassCard variant="bordered" className="flex-1">
        <NeuralEmptyState
          icon={<GitBranch size={32} />}
          title="No workflow selected"
          description="Select a workflow from the list or create a new one to get started"
        />
      </GlassCard>
    );
  }

  // Handle execute
  const handleExecute = async () => {
    await executeWorkflow(selectedWorkflow.id);
  };

  // Handle delete
  const handleDelete = async () => {
    await deleteWorkflow(selectedWorkflow.id);
    setShowDeleteModal(false);
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    await toggleWorkflowStatus(selectedWorkflow.id);
  };

  // Handle edit in N8N
  const handleEditInN8N = () => {
    // TODO: Open N8N UI with workflow ID
    const n8nUrl = `${import.meta.env.VITE_N8N_URL || 'http://192.168.1.201:5678'}/workflow/${selectedWorkflow.id}`;
    window.open(n8nUrl, '_blank');
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) {return 'Never';}
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <GlassCard variant="bordered" className="flex-1 flex flex-col" style={{ padding: '28px' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#f0f0f5',
                  margin: 0,
                }}
              >
                {selectedWorkflow.name}
              </h2>
              <span
                className="inline-block rounded-full"
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor:
                    selectedWorkflow.status === 'active'
                      ? '#10b981'
                      : selectedWorkflow.status === 'error'
                      ? '#ef4444'
                      : '#6b7280',
                  boxShadow:
                    selectedWorkflow.status === 'active'
                      ? '0 0 12px #10b981'
                      : selectedWorkflow.status === 'error'
                      ? '0 0 12px #ef4444'
                      : 'none',
                }}
              />
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {selectedWorkflow.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Execute button */}
            <button
              onClick={handleExecute}
              disabled={selectedWorkflow.status !== 'active'}
              className="flex items-center gap-2 transition-all duration-200 border-0 outline-none cursor-pointer"
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '12px',
                background: 'rgba(0, 212, 255, 0.2)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                color: '#00d4ff',
                opacity: selectedWorkflow.status !== 'active' ? 0.5 : 1,
                cursor: selectedWorkflow.status !== 'active' ? 'not-allowed' : 'pointer',
              }}
            >
              <Play size={16} />
              Execute
            </button>

            {/* Edit in N8N */}
            <button
              onClick={handleEditInN8N}
              className="flex items-center gap-2 transition-all duration-200 border-0 outline-none cursor-pointer"
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                color: '#8b5cf6',
              }}
            >
              <ExternalLink size={16} />
              Edit in N8N
            </button>

            {/* Delete button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center transition-all duration-200 border-0 outline-none cursor-pointer"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
              }}
              aria-label="Delete workflow"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div
          className="grid gap-4 mb-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          {/* Status Card */}
          <GlassCard variant="bordered" style={{ padding: '16px' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                Status
              </span>
              <Activity size={16} style={{ color: '#6b7280' }} />
            </div>
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color:
                    selectedWorkflow.status === 'active'
                      ? '#10b981'
                      : selectedWorkflow.status === 'error'
                      ? '#ef4444'
                      : '#6b7280',
                  textTransform: 'capitalize',
                }}
              >
                {selectedWorkflow.status}
              </span>
              <button
                onClick={handleToggleStatus}
                className="flex items-center justify-center transition-colors duration-200 border-0 outline-none cursor-pointer"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: selectedWorkflow.status === 'active' ? '#f59e0b' : '#10b981',
                }}
                aria-label={selectedWorkflow.status === 'active' ? 'Deactivate' : 'Activate'}
              >
                {selectedWorkflow.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </GlassCard>

          {/* Node Count Card */}
          <GlassCard variant="bordered" style={{ padding: '16px' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                Nodes
              </span>
              <GitBranch size={16} style={{ color: '#6b7280' }} />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#f0f0f5' }}>
              {selectedWorkflow.nodeCount}
            </span>
          </GlassCard>

          {/* Last Executed Card */}
          <GlassCard variant="bordered" style={{ padding: '16px' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                Last Executed
              </span>
              <Calendar size={16} style={{ color: '#6b7280' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5' }}>
              {formatDate(selectedWorkflow.lastExecuted)}
            </span>
          </GlassCard>

          {/* Schedule Card */}
          {selectedWorkflow.schedule && (
            <GlassCard variant="bordered" style={{ padding: '16px' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                  Schedule
                </span>
                <Calendar size={16} style={{ color: '#6b7280' }} />
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  fontFamily: 'monospace',
                }}
              >
                {selectedWorkflow.schedule}
              </span>
            </GlassCard>
          )}

          {/* Webhook URL Card */}
          {selectedWorkflow.webhookUrl && (
            <GlassCard variant="bordered" style={{ padding: '16px' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                  Webhook
                </span>
                <Webhook size={16} style={{ color: '#6b7280' }} />
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#00d4ff',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {selectedWorkflow.webhookUrl}
              </span>
            </GlassCard>
          )}
        </div>

        {/* Tags */}
        {selectedWorkflow.tags && selectedWorkflow.tags.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '12px' }}>
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedWorkflow.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    background: 'rgba(0, 212, 255, 0.1)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    color: '#00d4ff',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div
          className="mt-auto pt-6"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          <div className="flex justify-between">
            <span>Created: {formatDate(selectedWorkflow.createdAt)}</span>
            <span>Updated: {formatDate(selectedWorkflow.updatedAt)}</span>
          </div>
        </div>
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <NeuralModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Workflow"
        footer={
          <>
            <NeuralButton variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </NeuralButton>
            <NeuralButton variant="danger" onClick={handleDelete}>
              <Trash2 size={16} />
              Delete
            </NeuralButton>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: '#f0f0f5', marginBottom: '12px' }}>
          Are you sure you want to delete <strong>{selectedWorkflow.name}</strong>?
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          This action cannot be undone. All execution history will be lost.
        </p>
      </NeuralModal>
    </>
  );
}
