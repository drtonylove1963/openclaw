/**
 * WorkflowsPage - N8N Workflow Management Interface
 *
 * Complete neural-themed workflow management with:
 * - Workflow list sidebar
 * - Workflow detail canvas
 * - Configuration panel
 * - Execution history
 *
 * Note: This is a MANAGEMENT interface, not a visual node editor.
 * For visual editing, users are directed to the N8N UI.
 */

import { useEffect } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { WorkflowNodePalette } from '../../components/workflows/WorkflowNodePalette';
import { WorkflowCanvas } from '../../components/workflows/WorkflowCanvas';
import { WorkflowNodeConfig } from '../../components/workflows/WorkflowNodeConfig';
import { WorkflowExecutionHistory } from '../../components/workflows/WorkflowExecutionHistory';

export function WorkflowsPage() {
  const { loadWorkflows, error } = useWorkflowStore();

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ padding: '40px 60px 20px' }}>
        <h1
          className="ni-tricolor-text animate-neural-pulse-text"
          style={{ fontSize: '48px', fontWeight: 700, backgroundSize: '200% 100%' }}
        >
          Workflows
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginTop: '8px' }}>
          Manage and execute N8N workflow automations
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            margin: '0 60px 20px',
            padding: '12px 20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#ef4444',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden" style={{ padding: '0 60px 40px' }}>
        {/* Left: Workflow List */}
        <WorkflowNodePalette />

        {/* Center: Workflow Detail + Execution History */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ gap: '20px' }}>
          <WorkflowCanvas />
          <WorkflowExecutionHistory />
        </div>

        {/* Right: Configuration Panel */}
        <WorkflowNodeConfig />
      </div>
    </div>
  );
}
