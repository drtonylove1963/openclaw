import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, Clock, Webhook, Calendar } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface TriggerNodeData {
  label: string;
  triggerType: 'manual' | 'webhook' | 'schedule' | 'event';
  config?: {
    schedule?: string;
    webhookUrl?: string;
    eventType?: string;
  };
}

const triggerIcons = {
  manual: Zap,
  webhook: Webhook,
  schedule: Clock,
  event: Calendar,
};

const triggerColorMap: Record<string, { from: string; to: string }> = {
  manual: { from: '#22c55e', to: '#059669' },
  webhook: { from: '#3b82f6', to: '#0891b2' },
  schedule: { from: '#a855f7', to: '#7c3aed' },
  event: { from: '#f97316', to: '#d97706' },
};

export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  const Icon = triggerIcons[data.triggerType] || Zap;
  const colors = triggerColorMap[data.triggerType] || triggerColorMap.manual;

  return (
    <div
      style={{
        minWidth: '180px',
        borderRadius: '8px',
        boxShadow: selected ? '0 0 0 2px #22c55e, 0 4px 12px rgba(34, 197, 94, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '2px solid ' + (selected ? COLORS.success : COLORS.border),
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(to right, ' + colors.from + ', ' + colors.to + ')',
          padding: '8px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon style={{ width: '16px', height: '16px', color: 'white' }} />
          <span style={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>Trigger</span>
        </div>
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ color: COLORS.text, fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
          {data.label}
        </div>
        <div style={{ color: COLORS.textMuted, fontSize: '12px', textTransform: 'capitalize' }}>
          {data.triggerType}
        </div>
        {data.config?.schedule && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: COLORS.textDim, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock style={{ width: '12px', height: '12px' }} />
            {data.config.schedule}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: '12px', height: '12px', backgroundColor: COLORS.success, border: `2px solid ${COLORS.bgAlt}` }}
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
