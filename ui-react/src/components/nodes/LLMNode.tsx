import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Cpu, Thermometer, Hash, Sparkles } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface LLMNodeData {
  label: string;
  provider: 'anthropic' | 'openai' | 'groq' | 'ollama' | 'openrouter' | 'azure';
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  status?: 'idle' | 'connected' | 'error';
  // Streaming support
  streaming?: boolean;
  // API configuration
  apiKey?: string;
  baseUrl?: string;
}

const providerInfo: Record<string, { label: string; color: string; icon: string }> = {
  anthropic: { label: 'Anthropic', color: '#d4a574', icon: '🤖' },
  openai: { label: 'OpenAI', color: '#10a37f', icon: '💚' },
  groq: { label: 'Groq', color: '#f55036', icon: '⚡' },
  ollama: { label: 'Ollama', color: '#ffffff', icon: '🦙' },
  openrouter: { label: 'OpenRouter', color: '#6366f1', icon: '🔀' },
  azure: { label: 'Azure OpenAI', color: '#0078d4', icon: '☁️' },
};

const modelShortNames: Record<string, string> = {
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-opus-4-20250514': 'Claude Opus 4',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'gpt-4o': 'GPT-4o',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4': 'GPT-4',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  'llama-3.1-8b-instant': 'Llama 3.1 8B',
  'mixtral-8x7b-32768': 'Mixtral 8x7B',
};

export const LLMNode = memo(({ data, selected }: NodeProps<LLMNodeData>) => {
  const provider = providerInfo[data.provider] || providerInfo.anthropic;
  const modelName = modelShortNames[data.model] || data.model;

  return (
    <div
      style={{
        minWidth: '220px',
        borderRadius: '10px',
        boxShadow: selected
          ? `0 0 0 2px ${provider.color}, 0 6px 20px rgba(0, 0, 0, 0.35)`
          : '0 4px 14px rgba(0, 0, 0, 0.3)',
        border: `2px solid ${selected ? provider.color : COLORS.border}`,
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${provider.color}dd, ${provider.color}99)`,
          padding: '10px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '16px',
          }}>
            {provider.icon}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
              {provider.label}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px' }}>
              Language Model
            </div>
          </div>
          <Cpu style={{ width: '16px', height: '16px', color: 'white', marginLeft: 'auto' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        {/* Model Name */}
        <div style={{
          color: COLORS.text,
          fontWeight: 500,
          fontSize: '13px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <Sparkles style={{ width: '14px', height: '14px', color: provider.color }} />
          {modelName}
        </div>

        {/* Parameters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
        }}>
          {/* Temperature */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            backgroundColor: COLORS.bg,
            borderRadius: '5px',
          }}>
            <Thermometer style={{ width: '12px', height: '12px', color: '#f59e0b' }} />
            <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
              Temp: {data.temperature ?? 0.7}
            </span>
          </div>

          {/* Max Tokens */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            backgroundColor: COLORS.bg,
            borderRadius: '5px',
          }}>
            <Hash style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
            <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
              Max: {data.maxTokens ?? 4096}
            </span>
          </div>
        </div>

        {/* Streaming Badge */}
        {data.streaming && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderRadius: '4px',
            marginTop: '8px',
          }}>
            <span style={{ fontSize: '10px', color: '#10b981' }}>
              Streaming Enabled
            </span>
          </div>
        )}
      </div>

      {/* Output Handle - connects to AI Agent's LLM input */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="llm-out"
        style={{
          width: '14px',
          height: '14px',
          backgroundColor: '#10b981',
          border: `2px solid ${COLORS.bgAlt}`,
        }}
        title="Connect to AI Agent"
      />
    </div>
  );
});

LLMNode.displayName = 'LLMNode';
