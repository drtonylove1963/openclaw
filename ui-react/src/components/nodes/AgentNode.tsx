import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Code, FileSearch, Shield, Palette, TestTube } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface AgentNodeData {
  label: string;
  agentType: 'developer' | 'architect' | 'qa' | 'business_analyst' | 'devops' | 'uiux' | 'security';
  model?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  tokensUsed?: number;
  config?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

const agentIcons = {
  developer: Code,
  architect: FileSearch,
  qa: TestTube,
  business_analyst: Bot,
  devops: Shield,
  uiux: Palette,
  security: Shield,
};

const agentColorMap: Record<string, { from: string; to: string }> = {
  developer: { from: '#3b82f6', to: '#4f46e5' },
  architect: { from: '#a855f7', to: '#7c3aed' },
  qa: { from: '#22c55e', to: '#14b8a6' },
  business_analyst: { from: '#f59e0b', to: '#ea580c' },
  devops: { from: '#6b7280', to: '#475569' },
  uiux: { from: '#ec4899', to: '#f43f5e' },
  security: { from: '#ef4444', to: '#f43f5e' },
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running': return COLORS.warning;
    case 'success': return COLORS.success;
    case 'error': return COLORS.error;
    default: return COLORS.textDim;
  }
};

export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  const Icon = agentIcons[data.agentType] || Bot;
  const colors = agentColorMap[data.agentType] || agentColorMap.developer;
  const statusColor = getStatusColor(data.status || 'idle');

  return (
    <div
      style={{
        minWidth: '200px',
        borderRadius: '8px',
        boxShadow: selected ? `0 0 0 2px ${COLORS.info}, 0 4px 12px rgba(59, 130, 246, 0.25)` : '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '2px solid ' + (selected ? COLORS.info : COLORS.border),
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: '12px', height: '12px', backgroundColor: COLORS.info, border: `2px solid ${COLORS.bgAlt}` }}
      />
      <div
        style={{
          background: 'linear-gradient(to right, ' + colors.from + ', ' + colors.to + ')',
          padding: '8px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon style={{ width: '16px', height: '16px', color: 'white' }} />
            <span style={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>Agent</span>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor }} />
        </div>
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ color: COLORS.text, fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
          {data.label}
        </div>
        <div style={{ color: COLORS.textMuted, fontSize: '12px', textTransform: 'capitalize', marginBottom: '8px' }}>
          {data.agentType.replace('_', ' ')}
        </div>
        {data.model && (
          <div style={{ fontSize: '12px', color: COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Model: {data.model}
          </div>
        )}
        {data.tokensUsed !== undefined && data.tokensUsed > 0 && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: COLORS.textDim }}>
            Tokens: {data.tokensUsed.toLocaleString()}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: '12px', height: '12px', backgroundColor: COLORS.info, border: `2px solid ${COLORS.bgAlt}` }}
      />
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
