import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, MessageCircle, Database, History, Layers } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface MemoryNodeData {
  label: string;
  memoryType: 'buffer' | 'buffer_window' | 'summary' | 'vector' | 'conversation' | 'entity';
  // Memory configuration
  config?: {
    // For buffer memory
    maxMessages?: number;
    // For buffer window
    windowSize?: number;
    // For summary memory
    summaryModel?: string;
    // For vector memory
    vectorStore?: string;
    embeddingModel?: string;
    topK?: number;
    // For entity memory
    entityTypes?: string[];
    // Common
    sessionId?: string;
    persistToDb?: boolean;
  };
  // Stats
  messageCount?: number;
  tokenCount?: number;
  status?: 'idle' | 'active' | 'syncing' | 'error';
}

const memoryTypeInfo: Record<string, { label: string; description: string; color: string; Icon: any }> = {
  buffer: {
    label: 'Buffer Memory',
    description: 'Stores all messages',
    color: '#f59e0b',
    Icon: MessageCircle
  },
  buffer_window: {
    label: 'Window Buffer',
    description: 'Last N messages',
    color: '#3b82f6',
    Icon: History
  },
  summary: {
    label: 'Summary Memory',
    description: 'Summarized conversation',
    color: '#8b5cf6',
    Icon: Layers
  },
  vector: {
    label: 'Vector Memory',
    description: 'Semantic search memory',
    color: '#10b981',
    Icon: Database
  },
  conversation: {
    label: 'Conversation Memory',
    description: 'Full chat history',
    color: '#ec4899',
    Icon: MessageCircle
  },
  entity: {
    label: 'Entity Memory',
    description: 'Extracts entities',
    color: '#6366f1',
    Icon: Brain
  },
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return COLORS.success;
    case 'syncing': return COLORS.warning;
    case 'error': return COLORS.error;
    default: return COLORS.textDim;
  }
};

export const MemoryNode = memo(({ data, selected }: NodeProps<MemoryNodeData>) => {
  const memoryInfo = memoryTypeInfo[data.memoryType] || memoryTypeInfo.buffer;
  const { Icon } = memoryInfo;
  const statusColor = getStatusColor(data.status || 'idle');

  return (
    <div
      style={{
        minWidth: '220px',
        borderRadius: '10px',
        boxShadow: selected
          ? `0 0 0 2px ${memoryInfo.color}, 0 6px 20px rgba(0, 0, 0, 0.35)`
          : '0 4px 14px rgba(0, 0, 0, 0.3)',
        border: `2px solid ${selected ? memoryInfo.color : COLORS.border}`,
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${memoryInfo.color}dd, ${memoryInfo.color}99)`,
          padding: '10px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '6px',
              display: 'flex',
            }}>
              <Brain style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>
                Memory
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px' }}>
                {memoryInfo.label}
              </div>
            </div>
          </div>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: data.status === 'syncing' ? `0 0 6px ${COLORS.warning}` : 'none',
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        {/* Label */}
        <div style={{
          color: COLORS.text,
          fontWeight: 500,
          fontSize: '14px',
          marginBottom: '6px',
        }}>
          {data.label}
        </div>

        {/* Description */}
        <div style={{
          color: COLORS.textMuted,
          fontSize: '12px',
          marginBottom: '10px',
        }}>
          {memoryInfo.description}
        </div>

        {/* Memory Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
        }}>
          {/* Message Count */}
          {data.messageCount !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              backgroundColor: COLORS.bg,
              borderRadius: '5px',
            }}>
              <MessageCircle style={{ width: '12px', height: '12px', color: memoryInfo.color }} />
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
                {data.messageCount} msgs
              </span>
            </div>
          )}

          {/* Token Count */}
          {data.tokenCount !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              backgroundColor: COLORS.bg,
              borderRadius: '5px',
            }}>
              <Layers style={{ width: '12px', height: '12px', color: COLORS.info }} />
              <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
                {data.tokenCount.toLocaleString()} tokens
              </span>
            </div>
          )}
        </div>

        {/* Memory-specific configuration display */}
        {data.memoryType === 'buffer_window' && data.config?.windowSize && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: COLORS.bg,
            borderRadius: '5px',
            marginTop: '8px',
          }}>
            <History style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
            <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
              Window: {data.config.windowSize} messages
            </span>
          </div>
        )}

        {data.memoryType === 'vector' && data.config?.vectorStore && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: COLORS.bg,
            borderRadius: '5px',
            marginTop: '8px',
          }}>
            <Database style={{ width: '12px', height: '12px', color: '#10b981' }} />
            <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
              {data.config.vectorStore} (top-{data.config.topK || 5})
            </span>
          </div>
        )}

        {/* Persist Badge */}
        {data.config?.persistToDb && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderRadius: '4px',
            marginTop: '8px',
          }}>
            <Database style={{ width: '10px', height: '10px', color: '#10b981' }} />
            <span style={{ fontSize: '10px', color: '#10b981' }}>
              Persisted
            </span>
          </div>
        )}
      </div>

      {/* Output Handle - connects to AI Agent's memory input */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="memory-out"
        style={{
          width: '14px',
          height: '14px',
          backgroundColor: '#f59e0b',
          border: `2px solid ${COLORS.bgAlt}`,
        }}
        title="Connect to AI Agent"
      />
    </div>
  );
});

MemoryNode.displayName = 'MemoryNode';
