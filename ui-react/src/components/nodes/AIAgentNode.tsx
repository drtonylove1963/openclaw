import React, { memo } from 'react';
import { Handle, Position, NodeProps, useEdges } from 'reactflow';
import { Bot, Cpu, Wrench, MessageSquare, Brain, Zap, Settings2 } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface AIAgentNodeData {
  label: string;
  agentMode: 'react' | 'conversational' | 'openai_functions' | 'structured_chat' | 'xml';
  status?: 'idle' | 'running' | 'success' | 'error';
  tokensUsed?: number;
  iterationCount?: number;
  maxIterations?: number;
  // LLM Configuration (can be set directly or via connected LLM node)
  llmProvider?: string;
  llmModel?: string;
  temperature?: number;
  maxTokens?: number;
  // System prompt for the agent
  systemPrompt?: string;
  // Connected components (set by workflow execution)
  connectedLLM?: string;
  connectedTools?: string[];
  connectedMemory?: string;
  // Output parsing
  outputParser?: 'auto' | 'json' | 'text' | 'structured';
  // Human in the loop
  requireHumanApproval?: boolean;
}

const agentModeInfo: Record<string, { label: string; description: string; color: string }> = {
  react: { label: 'ReAct', description: 'Reason + Act iteratively', color: '#8b5cf6' },
  conversational: { label: 'Conversational', description: 'Chat-based agent', color: '#3b82f6' },
  openai_functions: { label: 'OpenAI Functions', description: 'Function calling mode', color: '#10b981' },
  structured_chat: { label: 'Structured Chat', description: 'Structured output chat', color: '#f59e0b' },
  xml: { label: 'XML Agent', description: 'XML-based reasoning', color: '#ef4444' },
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running': return COLORS.warning;
    case 'success': return COLORS.success;
    case 'error': return COLORS.error;
    default: return COLORS.textDim;
  }
};

const handleStyle = {
  width: '14px',
  height: '14px',
  border: `2px solid ${COLORS.bgAlt}`,
};

export const AIAgentNode = memo(({ id, data, selected }: NodeProps<AIAgentNodeData>) => {
  const edges = useEdges();
  const modeInfo = agentModeInfo[data.agentMode] || agentModeInfo.react;
  const statusColor = getStatusColor(data.status || 'idle');

  // Check what's connected
  const hasLLMConnection = edges.some(e => e.target === id && e.targetHandle === 'llm');
  const hasToolsConnection = edges.some(e => e.target === id && e.targetHandle === 'tools');
  const hasMemoryConnection = edges.some(e => e.target === id && e.targetHandle === 'memory');

  // Count connected tools
  const toolConnectionCount = edges.filter(e => e.target === id && e.targetHandle === 'tools').length;

  return (
    <div
      style={{
        minWidth: '280px',
        borderRadius: '12px',
        boxShadow: selected
          ? `0 0 0 3px ${modeInfo.color}, 0 8px 24px rgba(139, 92, 246, 0.3)`
          : '0 4px 16px rgba(0, 0, 0, 0.4)',
        border: `2px solid ${selected ? modeInfo.color : COLORS.border}`,
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      {/* Top Handles for LLM, Memory, Tools */}
      <div style={{ position: 'relative', height: '0px' }}>
        {/* LLM Handle - Left */}
        <Handle
          type="target"
          position={Position.Top}
          id="llm"
          style={{
            ...handleStyle,
            left: '25%',
            backgroundColor: hasLLMConnection ? '#10b981' : COLORS.bgActive,
          }}
          title="Connect LLM"
        />
        {/* Memory Handle - Center */}
        <Handle
          type="target"
          position={Position.Top}
          id="memory"
          style={{
            ...handleStyle,
            left: '50%',
            backgroundColor: hasMemoryConnection ? '#f59e0b' : COLORS.bgActive,
          }}
          title="Connect Memory"
        />
        {/* Tools Handle - Right */}
        <Handle
          type="target"
          position={Position.Top}
          id="tools"
          style={{
            ...handleStyle,
            left: '75%',
            backgroundColor: hasToolsConnection ? '#8b5cf6' : COLORS.bgActive,
          }}
          title="Connect Tools"
        />
      </div>

      {/* Handle Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 12px 0',
        fontSize: '10px',
        color: COLORS.textDim,
        textTransform: 'uppercase',
      }}>
        <span style={{ color: hasLLMConnection ? '#10b981' : COLORS.textDim }}>LLM</span>
        <span style={{ color: hasMemoryConnection ? '#f59e0b' : COLORS.textDim }}>Memory</span>
        <span style={{ color: hasToolsConnection ? '#8b5cf6' : COLORS.textDim }}>Tools</span>
      </div>

      {/* Input Handle - Left */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          ...handleStyle,
          backgroundColor: COLORS.info,
          top: '50%',
        }}
        title="Input"
      />

      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${modeInfo.color}, ${modeInfo.color}cc)`,
          padding: '12px 16px',
          marginTop: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
            }}>
              <Bot style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>
                AI Agent
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
                {modeInfo.label}
              </div>
            </div>
          </div>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: data.status === 'running' ? `0 0 8px ${COLORS.warning}` : 'none',
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
        {/* Label */}
        <div style={{
          color: COLORS.text,
          fontWeight: 600,
          fontSize: '14px',
          marginBottom: '8px',
        }}>
          {data.label}
        </div>

        {/* Connection Status */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '12px',
        }}>
          {/* LLM Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: hasLLMConnection ? 'rgba(16, 185, 129, 0.15)' : COLORS.bg,
            borderRadius: '6px',
            border: `1px solid ${hasLLMConnection ? '#10b981' : COLORS.border}`,
          }}>
            <Cpu style={{ width: '12px', height: '12px', color: hasLLMConnection ? '#10b981' : COLORS.textDim }} />
            <span style={{ fontSize: '11px', color: hasLLMConnection ? '#10b981' : COLORS.textDim }}>
              {hasLLMConnection ? 'LLM' : 'No LLM'}
            </span>
          </div>

          {/* Memory Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: hasMemoryConnection ? 'rgba(245, 158, 11, 0.15)' : COLORS.bg,
            borderRadius: '6px',
            border: `1px solid ${hasMemoryConnection ? '#f59e0b' : COLORS.border}`,
          }}>
            <Brain style={{ width: '12px', height: '12px', color: hasMemoryConnection ? '#f59e0b' : COLORS.textDim }} />
            <span style={{ fontSize: '11px', color: hasMemoryConnection ? '#f59e0b' : COLORS.textDim }}>
              {hasMemoryConnection ? 'Memory' : 'None'}
            </span>
          </div>

          {/* Tools Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: hasToolsConnection ? 'rgba(139, 92, 246, 0.15)' : COLORS.bg,
            borderRadius: '6px',
            border: `1px solid ${hasToolsConnection ? '#8b5cf6' : COLORS.border}`,
          }}>
            <Wrench style={{ width: '12px', height: '12px', color: hasToolsConnection ? '#8b5cf6' : COLORS.textDim }} />
            <span style={{ fontSize: '11px', color: hasToolsConnection ? '#8b5cf6' : COLORS.textDim }}>
              {toolConnectionCount > 0 ? `${toolConnectionCount} Tool${toolConnectionCount > 1 ? 's' : ''}` : 'No Tools'}
            </span>
          </div>
        </div>

        {/* LLM Info (if configured directly) */}
        {data.llmModel && !hasLLMConnection && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px',
            backgroundColor: COLORS.bg,
            borderRadius: '6px',
            marginBottom: '8px',
          }}>
            <Cpu style={{ width: '14px', height: '14px', color: COLORS.info }} />
            <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
              {data.llmModel}
            </span>
            {data.temperature !== undefined && (
              <span style={{ fontSize: '11px', color: COLORS.textDim, marginLeft: 'auto' }}>
                T: {data.temperature}
              </span>
            )}
          </div>
        )}

        {/* Iteration Info (during execution) */}
        {data.status === 'running' && data.iterationCount !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderRadius: '6px',
            marginBottom: '8px',
          }}>
            <Zap style={{ width: '14px', height: '14px', color: COLORS.warning }} />
            <span style={{ fontSize: '12px', color: COLORS.warning }}>
              Iteration {data.iterationCount}/{data.maxIterations || 10}
            </span>
          </div>
        )}

        {/* Token Usage */}
        {data.tokensUsed !== undefined && data.tokensUsed > 0 && (
          <div style={{
            fontSize: '11px',
            color: COLORS.textDim,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <MessageSquare style={{ width: '12px', height: '12px' }} />
            {data.tokensUsed.toLocaleString()} tokens
          </div>
        )}

        {/* Human Approval Badge */}
        {data.requireHumanApproval && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderRadius: '4px',
            marginTop: '8px',
          }}>
            <Settings2 style={{ width: '12px', height: '12px', color: '#ef4444' }} />
            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 500 }}>
              Human Approval Required
            </span>
          </div>
        )}
      </div>

      {/* Output Handle - Right */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          ...handleStyle,
          backgroundColor: COLORS.success,
          top: '50%',
        }}
        title="Output"
      />
    </div>
  );
});

AIAgentNode.displayName = 'AIAgentNode';
