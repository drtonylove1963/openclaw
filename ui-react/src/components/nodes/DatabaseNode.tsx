import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Search, Plus, Trash2, RefreshCw } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface DatabaseNodeData {
  label: string;
  operation: 'query' | 'insert' | 'update' | 'delete' | 'upsert';
  database?: 'postgresql' | 'redis' | 'chromadb';
  table?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  config?: {
    query?: string;
    collection?: string;
    embedding?: boolean;
  };
}

const operationIcons = {
  query: Search,
  insert: Plus,
  update: RefreshCw,
  delete: Trash2,
  upsert: RefreshCw,
};

const databaseColorMap: Record<string, { from: string; to: string }> = {
  postgresql: { from: '#2563eb', to: '#1d4ed8' },
  redis: { from: '#ef4444', to: '#dc2626' },
  chromadb: { from: '#a855f7', to: '#9333ea' },
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running': return COLORS.warning;
    case 'success': return COLORS.success;
    case 'error': return COLORS.error;
    default: return COLORS.textDim;
  }
};

export const DatabaseNode = memo(({ data, selected }: NodeProps<DatabaseNodeData>) => {
  const OpIcon = operationIcons[data.operation] || Search;
  const colors = databaseColorMap[data.database || 'postgresql'] || databaseColorMap.postgresql;
  const statusColor = getStatusColor(data.status || 'idle');

  return (
    <div
      style={{
        minWidth: '180px',
        borderRadius: '8px',
        boxShadow: selected ? '0 0 0 2px #06b6d4, 0 4px 12px rgba(6, 182, 212, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '2px solid ' + (selected ? '#06b6d4' : COLORS.border),
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: '12px', height: '12px', backgroundColor: '#06b6d4', border: `2px solid ${COLORS.bgAlt}` }}
      />
      <div
        style={{
          background: 'linear-gradient(to right, ' + colors.from + ', ' + colors.to + ')',
          padding: '8px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database style={{ width: '16px', height: '16px', color: 'white' }} />
            <span style={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>Database</span>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor }} />
        </div>
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ color: COLORS.text, fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
          {data.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '12px', marginBottom: '8px' }}>
          <OpIcon style={{ width: '12px', height: '12px' }} />
          <span style={{ textTransform: 'capitalize' }}>{data.operation}</span>
        </div>
        {data.database && (
          <div style={{ fontSize: '12px', color: COLORS.textDim }}>
            {data.database}{data.table && ' -> ' + data.table}
          </div>
        )}
        {data.config?.embedding && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: COLORS.purple }}>+ Vector Embedding</div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: '12px', height: '12px', backgroundColor: '#06b6d4', border: `2px solid ${COLORS.bgAlt}` }}
      />
    </div>
  );
});

DatabaseNode.displayName = 'DatabaseNode';
