/**
 * Load Workflow Modal
 * Modal for browsing and loading saved workflows
 */

import React, { useState, useEffect } from 'react';
import { COLORS } from '../styles/colors';

interface WorkflowNode {
  id: string;
  type: string;
  name?: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
}

interface WorkflowConnection {
  source: string;
  target: string;
  sourceOutput?: number;
  targetInput?: number;
}

interface WorkflowSummary {
  id: string;
  name: string;
  version: string;
  metadata: {
    template?: string;
    [key: string]: unknown;
  };
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

interface LoadWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (workflow: WorkflowSummary) => void;
}

export function LoadWorkflowModal({ isOpen, onClose, onLoad }: LoadWorkflowModalProps) {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch workflows when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkflows();
    }
  }, [isOpen]);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/workflows');
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }
      const data = await response.json();
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflows');

      // Try loading from localStorage as fallback
      try {
        const savedWorkflows = JSON.parse(localStorage.getItem('pronetheia-workflows') || '{}');
        const localWorkflows = Object.values(savedWorkflows);
        if (localWorkflows.length > 0) {
          setWorkflows(localWorkflows);
          setError(null);
        }
      } catch (localErr) {
        console.error('Failed to load from localStorage:', localErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    if (!selectedId) {return;}

    const workflow = workflows.find((w) => w.id === selectedId);
    if (workflow) {
      onLoad(workflow);
      onClose();
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
        if (selectedId === workflowId) {
          setSelectedId(null);
        }
      } else {
        throw new Error('Failed to delete workflow');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      // Try deleting from localStorage
      try {
        const savedWorkflows = JSON.parse(localStorage.getItem('pronetheia-workflows') || '{}');
        delete savedWorkflows[workflowId];
        localStorage.setItem('pronetheia-workflows', JSON.stringify(savedWorkflows));
        setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
        if (selectedId === workflowId) {
          setSelectedId(null);
        }
      } catch (localErr) {
        setError('Failed to delete workflow');
      }
    }
  };

  if (!isOpen) {return null;}

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.bgAlt,
          borderRadius: 16,
          padding: 24,
          width: 600,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ color: COLORS.text, margin: 0, fontSize: 20 }}>Load Workflow</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textMuted,
              fontSize: 24,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: `${COLORS.error}20`,
              border: `1px solid ${COLORS.error}50`,
              borderRadius: 8,
              color: COLORS.error,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: COLORS.textMuted,
            }}
          >
            Loading workflows...
          </div>
        ) : workflows.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: COLORS.textMuted,
            }}
          >
            No saved workflows found.
            <br />
            <span style={{ fontSize: 13 }}>Create a workflow and save it to see it here.</span>
          </div>
        ) : (
          /* Workflow List */
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => setSelectedId(workflow.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: 'pointer',
                  background: selectedId === workflow.id ? COLORS.accentMuted : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== workflow.id) {
                    e.currentTarget.style.background = COLORS.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== workflow.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div>
                  <div
                    style={{
                      color: COLORS.text,
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  >
                    {workflow.name}
                  </div>
                  <div
                    style={{
                      color: COLORS.textMuted,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    v{workflow.version} • {workflow.nodes?.length || 0} nodes •{' '}
                    {workflow.connections?.length || 0} connections
                    {workflow.metadata?.template && ` • From template: ${workflow.metadata.template}`}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(workflow.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.error,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                  title="Delete workflow"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              color: COLORS.text,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLoad}
            disabled={!selectedId}
            style={{
              padding: '10px 20px',
              background: selectedId ? COLORS.accent : COLORS.bgHover,
              border: 'none',
              borderRadius: 8,
              color: selectedId ? 'white' : COLORS.textMuted,
              cursor: selectedId ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Load Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoadWorkflowModal;
