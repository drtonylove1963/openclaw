import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Wrench,
  Search,
  Code,
  Calculator,
  Globe,
  FileText,
  Database,
  Terminal,
  Send,
  Webhook,
  FolderSearch
} from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface ToolNodeData {
  label: string;
  toolType: 'calculator' | 'code_interpreter' | 'web_search' | 'http_request' |
            'file_reader' | 'database_query' | 'shell_command' | 'api_call' |
            'mcp_tool' | 'custom' | 'vector_search';
  // Tool-specific configuration
  config?: {
    // For HTTP/API tools
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    // For database tools
    connectionString?: string;
    query?: string;
    // For MCP tools
    mcpServer?: string;
    mcpTool?: string;
    // For custom tools
    functionName?: string;
    parameters?: Record<string, any>;
    // Common
    description?: string;
    returnType?: string;
  };
  status?: 'idle' | 'ready' | 'running' | 'error';
}

const toolTypeInfo: Record<string, { label: string; color: string; Icon: any }> = {
  calculator: { label: 'Calculator', color: '#f59e0b', Icon: Calculator },
  code_interpreter: { label: 'Code Interpreter', color: '#8b5cf6', Icon: Code },
  web_search: { label: 'Web Search', color: '#3b82f6', Icon: Globe },
  http_request: { label: 'HTTP Request', color: '#10b981', Icon: Send },
  file_reader: { label: 'File Reader', color: '#ec4899', Icon: FileText },
  database_query: { label: 'Database Query', color: '#6366f1', Icon: Database },
  shell_command: { label: 'Shell Command', color: '#71717a', Icon: Terminal },
  api_call: { label: 'API Call', color: '#14b8a6', Icon: Webhook },
  mcp_tool: { label: 'MCP Tool', color: '#a855f7', Icon: Wrench },
  custom: { label: 'Custom Tool', color: '#64748b', Icon: Wrench },
  vector_search: { label: 'Vector Search', color: '#06b6d4', Icon: FolderSearch },
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'ready': return COLORS.success;
    case 'running': return COLORS.warning;
    case 'error': return COLORS.error;
    default: return COLORS.textDim;
  }
};

export const ToolNode = memo(({ data, selected }: NodeProps<ToolNodeData>) => {
  const toolInfo = toolTypeInfo[data.toolType] || toolTypeInfo.custom;
  const { Icon } = toolInfo;
  const statusColor = getStatusColor(data.status || 'idle');

  return (
    <div
      style={{
        minWidth: '200px',
        borderRadius: '10px',
        boxShadow: selected
          ? `0 0 0 2px ${toolInfo.color}, 0 6px 20px rgba(0, 0, 0, 0.35)`
          : '0 4px 14px rgba(0, 0, 0, 0.3)',
        border: `2px solid ${selected ? toolInfo.color : COLORS.border}`,
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${toolInfo.color}dd, ${toolInfo.color}99)`,
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
              <Icon style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>
                Tool
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px' }}>
                {toolInfo.label}
              </div>
            </div>
          </div>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        {/* Tool Label */}
        <div style={{
          color: COLORS.text,
          fontWeight: 500,
          fontSize: '14px',
          marginBottom: '6px',
        }}>
          {data.label}
        </div>

        {/* Description */}
        {data.config?.description && (
          <div style={{
            color: COLORS.textMuted,
            fontSize: '12px',
            marginBottom: '8px',
            lineHeight: 1.4,
          }}>
            {data.config.description}
          </div>
        )}

        {/* Tool-specific info */}
        {data.toolType === 'http_request' && data.config?.url && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: COLORS.bg,
            borderRadius: '5px',
            marginTop: '8px',
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: toolInfo.color,
              backgroundColor: `${toolInfo.color}20`,
              padding: '2px 6px',
              borderRadius: '3px',
            }}>
              {data.config.method || 'GET'}
            </span>
            <span style={{
              fontSize: '11px',
              color: COLORS.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {data.config.url}
            </span>
          </div>
        )}

        {data.toolType === 'mcp_tool' && data.config?.mcpServer && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: COLORS.bg,
            borderRadius: '5px',
            marginTop: '8px',
          }}>
            <Wrench style={{ width: '12px', height: '12px', color: '#a855f7' }} />
            <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
              {data.config.mcpServer} / {data.config.mcpTool}
            </span>
          </div>
        )}

        {data.toolType === 'database_query' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            backgroundColor: COLORS.bg,
            borderRadius: '5px',
            marginTop: '8px',
          }}>
            <Database style={{ width: '12px', height: '12px', color: '#6366f1' }} />
            <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
              SQL Query
            </span>
          </div>
        )}
      </div>

      {/* Output Handle - connects to AI Agent's tools input */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="tool-out"
        style={{
          width: '14px',
          height: '14px',
          backgroundColor: '#8b5cf6',
          border: `2px solid ${COLORS.bgAlt}`,
        }}
        title="Connect to AI Agent"
      />
    </div>
  );
});

ToolNode.displayName = 'ToolNode';
