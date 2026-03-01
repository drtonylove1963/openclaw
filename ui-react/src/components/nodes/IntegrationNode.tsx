import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Plug, Github, Mail, MessageSquare, Cloud, Webhook } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface IntegrationNodeData {
  label: string;
  integrationType: 'github' | 'n8n' | 'email' | 'slack' | 'webhook' | 'api';
  action?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  config?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

const integrationIcons = {
  github: Github,
  n8n: Plug,
  email: Mail,
  slack: MessageSquare,
  webhook: Webhook,
  api: Cloud,
};

const integrationColorMap: Record<string, { from: string; to: string }> = {
  github: { from: '#374151', to: '#1f2937' },
  n8n: { from: '#f97316', to: '#ef4444' },
  email: { from: '#3b82f6', to: '#2563eb' },
  slack: { from: '#a855f7', to: '#9333ea' },
  webhook: { from: '#22c55e', to: '#16a34a' },
  api: { from: '#6366f1', to: '#4f46e5' },
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running': return COLORS.warning;
    case 'success': return COLORS.success;
    case 'error': return COLORS.error;
    default: return COLORS.textDim;
  }
};

export const IntegrationNode = memo(({ data, selected }: NodeProps<IntegrationNodeData>) => {
  const Icon = integrationIcons[data.integrationType] || Plug;
  const colors = integrationColorMap[data.integrationType] || integrationColorMap.api;
  const statusColor = getStatusColor(data.status || 'idle');

  return (
    <div
      style={{
        minWidth: '180px',
        borderRadius: '8px',
        boxShadow: selected ? `0 0 0 2px ${COLORS.warning}, 0 4px 12px rgba(249, 115, 22, 0.25)` : '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '2px solid ' + (selected ? COLORS.warning : COLORS.border),
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: '12px', height: '12px', backgroundColor: COLORS.warning, border: `2px solid ${COLORS.bgAlt}` }}
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
            <span style={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>Integration</span>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor }} />
        </div>
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ color: COLORS.text, fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
          {data.label}
        </div>
        <div style={{ color: COLORS.textMuted, fontSize: '12px', textTransform: 'capitalize', marginBottom: '8px' }}>
          {data.integrationType}
        </div>
        {data.action && (
          <div style={{ fontSize: '12px', color: COLORS.textDim }}>Action: {data.action}</div>
        )}
        {data.config?.url && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
            {data.config.url}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: '12px', height: '12px', backgroundColor: COLORS.warning, border: `2px solid ${COLORS.bgAlt}` }}
      />
    </div>
  );
});

IntegrationNode.displayName = 'IntegrationNode';
