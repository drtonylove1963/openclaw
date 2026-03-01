/**
 * Custom Node Components for React Flow
 * Each node type has its own visual style and handles.
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { COLORS } from '../../styles/colors';

// Get icon for specific node type
const getNodeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    trigger: '▶️',
    webhook: '🔗',
    input: '📥',
    output: '📤',
    agent: '🤖',
    llm: '💬',
    skill: '⚙️',
    exnihilo: '✨',
    orchestrator: '🎭',
    if: '❓',
    switch: '🔀',
    loop: '🔁',
    foreach: '🔄',
    parallel: '⏸️',
    merge: '⏩',
    wait: '⏳',
    gate: '🚧',
    process: '⚙️',
    code: '💻',
    postgres: '🐘',
    mysql: '🐬',
    mongodb: '🍃',
    redis: '🔴',
    http: '🌐',
    slack: '💬',
    email: '📧',
    n8n: '🔧',
  };
  return icons[type] || '📦';
};

/**
 * Generic Workflow Node
 */
export const WorkflowNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const icon = getNodeIcon(data?.type);

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: selected ? '0 0 0 2px #6366f1, 0 8px 16px rgba(99, 102, 241, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '2px solid ' + (selected ? 'white' : '#6366f1'),
        minWidth: '160px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
        transition: 'all 0.2s',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: '12px', height: '12px', backgroundColor: '#6366f1', border: '2px solid white' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <div>
          <div style={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>
            {data?.label || 'Node'}
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: '12px' }}>
            {data?.type || 'workflow'}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: '12px', height: '12px', backgroundColor: '#6366f1', border: '2px solid white' }}
      />
      {(data?.type === 'if' || data?.type === 'switch') && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', border: '2px solid white', left: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', border: '2px solid white', left: '70%' }}
          />
        </>
      )}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;
