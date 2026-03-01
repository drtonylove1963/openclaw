/**
 * AgentConfigPanel - Left Panel for Agent Configuration
 * Clean, unified styling with THEME system
 * Now uses dynamic models from the API (same as Settings/Agents pages)
 * Tools are now fetched from /api/v1/tools (same as Skills page)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { THEME } from '../../styles/theme';
import { PanelSection, LettaSelect, LettaToggle, LettaButton, LettaInput } from './LettaLayout';
import { PronetheiaAPI, useModels, ModelProvider } from '../../services/pronetheia-api';
import type { TaskPhase } from '../../types/chat';
import type { Tool, ToolCategory } from '../../types/tools';

// Phase options for Agent Mode
const PHASES: { value: TaskPhase; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'Agent decides based on your message' },
  { value: 'discovery', label: 'Discovery', description: 'Requirements gathering with Ex Nihilo' },
  { value: 'planning', label: 'Planning', description: 'Architecture and system design' },
  { value: 'implementation', label: 'Implementation', description: 'Code generation and development' },
  { value: 'validation', label: 'Validation', description: 'Testing and security checks' },
  { value: 'refinement', label: 'Refinement', description: 'Bug fixes and improvements' },
  { value: 'delivery', label: 'Delivery', description: 'Packaging and deployment' },
];

// Create API instance for fetching models
const api = new PronetheiaAPI();

// Provider connection from API (subscriptions)
interface ProviderConnection {
  provider: string;
  provider_name: string;
  connected: boolean;
  subscription_tier: string | null;
  is_active: boolean;
  has_token: boolean;
}

// API key from BYOK system
interface ApiKeyInfo {
  id: string;
  provider: string;
  key_hint: string | null;
  is_valid: boolean;
}

// Map backend provider IDs to model API provider names
// These MUST match the provider names returned by /api/v1/agents/models/available
const PROVIDER_TO_MODEL_PROVIDER: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI (Grok)',
  zai: 'Z.ai (Zhipu)',
  mistral: 'Mistral AI',
  groq: 'Groq (Fast Inference)',
  cerebras: 'Cerebras',  // Not in API yet but keep for future
  replicate: 'Replicate',
};

// Providers that OpenRouter API key gives access to
// These MUST match the provider names returned by /api/v1/agents/models/available
const OPENROUTER_ACCESSIBLE_PROVIDERS = [
  'Anthropic', 'OpenAI', 'Google', 'Mistral AI', 'Meta (Llama)', 'DeepSeek', 'Qwen (Alibaba)',
  'Cohere', 'Perplexity', 'xAI (Grok)', 'Replicate', 'Moonshot (Kimi)',
];

// Category icons for visual display
const CATEGORY_ICONS: Record<ToolCategory, string> = {
  filesystem: '📁',
  database: '🗄️',
  api: '🔌',
  utility: '🔧',
  communication: '💬',
  'data-processing': '⚙️',
  'ml-ai': '🤖',
  testing: '🧪',
  monitoring: '📊',
  other: '📦',
};

// Model capability display configuration
const CAPABILITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  thinking: { label: 'Thinking', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  vision: { label: 'Vision', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  imageGen: { label: 'Image Gen', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  longContext: { label: '100K+', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)' },
  code: { label: 'Code', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  realtime: { label: 'Fast', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  streaming: { label: 'Streaming', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  tools: { label: 'Tools', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  agents: { label: 'Agents', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
};

// Model capabilities mapping (maps model ID patterns to capabilities)
const MODEL_CAPABILITIES: Record<string, string[]> = {
  // Claude models (all support streaming)
  'claude-opus-4': ['thinking', 'vision', 'longContext', 'code', 'tools', 'agents', 'streaming'],
  'claude-sonnet-4': ['thinking', 'vision', 'longContext', 'code', 'tools', 'agents', 'streaming'],
  'claude-3-5-sonnet': ['vision', 'longContext', 'code', 'tools', 'agents', 'streaming'],
  'claude-3-5-haiku': ['vision', 'longContext', 'tools', 'streaming'],
  'claude-3-opus': ['vision', 'longContext', 'tools', 'code', 'streaming'],
  'claude-3-sonnet': ['vision', 'longContext', 'tools', 'streaming'],
  'claude-3-haiku': ['vision', 'longContext', 'tools', 'streaming'],
  // OpenAI models (all support streaming)
  'gpt-4o': ['vision', 'imageGen', 'longContext', 'tools', 'agents', 'streaming'],
  'gpt-4-turbo': ['vision', 'longContext', 'tools', 'streaming'],
  'gpt-4': ['tools', 'streaming'],
  'gpt-3.5': ['tools', 'streaming'],
  'o1': ['thinking', 'code'],  // o1 does NOT support streaming
  // Google models (all support streaming)
  'gemini-2': ['vision', 'longContext', 'tools', 'realtime', 'streaming'],
  'gemini-1.5-pro': ['vision', 'longContext', 'tools', 'code', 'streaming'],
  'gemini-1.5-flash': ['vision', 'longContext', 'tools', 'realtime', 'streaming'],
  'gemini-pro': ['vision', 'tools', 'streaming'],
  // Fast inference (all support streaming)
  'groq': ['realtime', 'longContext', 'streaming'],
  'cerebras': ['realtime', 'streaming'],
  // DeepSeek (supports streaming)
  'deepseek-v3': ['thinking', 'longContext', 'code', 'tools', 'streaming'],
  'deepseek-coder': ['code', 'longContext', 'streaming'],
  // Qwen (supports streaming)
  'qwq': ['thinking', 'longContext', 'code', 'streaming'],
  'qwen-2.5-coder': ['code', 'longContext', 'streaming'],
  'qwen': ['longContext', 'tools', 'streaming'],
  // Mistral (supports streaming)
  'codestral': ['code', 'longContext', 'streaming'],
  'mistral-large': ['longContext', 'tools', 'code', 'streaming'],
  'mixtral': ['longContext', 'streaming'],
  // Meta (supports streaming via most providers)
  'llama-3.3': ['longContext', 'tools', 'code', 'streaming'],
  'llama-3.1-405b': ['longContext', 'tools', 'code', 'streaming'],
  'llama-3.1': ['longContext', 'tools', 'streaming'],
  'llama-3': ['tools', 'streaming'],
  // xAI (supports streaming)
  'grok-2': ['vision', 'longContext', 'tools', 'streaming'],
  'grok': ['longContext', 'streaming'],
  // Kimi (supports streaming)
  'kimi-k2-thinking': ['thinking', 'longContext', 'agents', 'streaming'],
  'kimi-k2': ['longContext', 'agents', 'tools', 'streaming'],
  // GLM (supports streaming)
  'glm-4': ['vision', 'longContext', 'tools', 'code', 'streaming'],
  // Local LLM (llama.cpp)
  'local/mistral': ['streaming'],
  'local/minimax': ['thinking', 'streaming'],
};

// Get capabilities for a model ID by matching patterns
function getModelCapabilities(modelId: string): string[] {
  if (!modelId) {return [];}
  const lowerModelId = modelId.toLowerCase();

  // Try to match against patterns (longer patterns first for specificity)
  const patterns = Object.keys(MODEL_CAPABILITIES).toSorted((a, b) => b.length - a.length);
  for (const pattern of patterns) {
    if (lowerModelId.includes(pattern.toLowerCase())) {
      return MODEL_CAPABILITIES[pattern];
    }
  }
  return [];
}

export interface CustomAgent {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  phase: string;
  tools: string[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentConfigPanelProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  agentMode: boolean;
  onAgentModeChange: (enabled: boolean) => void;
  selectedPhase?: TaskPhase;
  onPhaseChange?: (phase: TaskPhase) => void;
  collapsed?: boolean;
  onLoadTemplate?: () => void;
  onNewAgent?: () => void;
  onSaveAgent?: () => void;
  customAgents?: CustomAgent[];
  onLoadCustomAgent?: (agent: CustomAgent) => void;
  onDeleteCustomAgent?: (agentId: string) => void;
  currentAgentId?: string | null;
  // Tool selection
  enabledTools?: string[];
  onToolsChange?: (tools: string[]) => void;
  // Requirements Studio mode restrictions
  allowedPhases?: TaskPhase[];  // If set, only these phases will be shown
  restrictedToolCategories?: string[];  // If set, only tools in these categories are allowed
  workspaceMode?: 'requirements_studio' | 'implementation_hub';  // Current workspace mode
}

export function AgentConfigPanel({
  selectedModel,
  onModelChange,
  agentMode,
  onAgentModeChange,
  selectedPhase = 'auto',
  onPhaseChange,
  collapsed = false,
  onLoadTemplate,
  onNewAgent,
  onSaveAgent,
  customAgents = [],
  onLoadCustomAgent,
  onDeleteCustomAgent,
  currentAgentId,
  enabledTools: externalEnabledTools,
  onToolsChange,
  allowedPhases,
  restrictedToolCategories,
  workspaceMode = 'implementation_hub',
}: AgentConfigPanelProps) {
  // Use external state if provided, otherwise use local state
  const [localEnabledTools, setLocalEnabledTools] = useState<string[]>([]);
  const enabledTools = externalEnabledTools ?? localEnabledTools;
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('4096');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [providerConnections, setProviderConnections] = useState<ProviderConnection[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // Tools from API (same source as Skills page)
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [toolSearch, setToolSearch] = useState('');

  // Fetch models from API (same source as Settings/Agents pages)
  const { providers, models, loading: modelsLoading } = useModels(api);

  // Fetch provider connections (subscriptions) AND API keys on mount
  useEffect(() => {
    async function fetchAccess() {
      try {
        // Fetch both subscriptions and API keys in parallel
        const [connectionsRes, keysRes] = await Promise.all([
          fetch('/api/v1/providers/connections'),
          fetch('/api/v1/keys/'),
        ]);

        if (connectionsRes.ok) {
          const data = await connectionsRes.json();
          setProviderConnections(data.connections || []);
        }

        if (keysRes.ok) {
          const keysData = await keysRes.json();
          // Filter to only valid keys
          setApiKeys((keysData || []).filter((k: ApiKeyInfo) =>  k.is_valid));
        }
      } catch (error) {
        console.error('Failed to fetch provider access:', error);
      } finally {
        setLoadingConnections(false);
      }
    }
    fetchAccess();
  }, []);

  // Fetch tools from API (same source as Skills page)
  useEffect(() => {
    async function fetchTools() {
      try {
        const response = await fetch('/api/v1/tools');
        if (response.ok) {
          const data = await response.json();
          // Only show active tools
          const activeTools = (data.tools || []).filter((t: Tool) => t.status === 'active');
          setTools(activeTools);
        }
      } catch (error) {
        console.error('Failed to fetch tools:', error);
      } finally {
        setLoadingTools(false);
      }
    }
    fetchTools();
  }, []);

  // Filter tools by category and search
  const filteredTools = useMemo(() => {
    let filtered = tools;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search
    if (toolSearch.trim()) {
      const search = toolSearch.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [tools, selectedCategory, toolSearch]);

  // Get category counts for filter pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length };
    tools.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [tools]);

  // Get unique categories from tools
  const availableCategories = useMemo(() => {
    const cats = new Set(tools.map(t => t.category));
    return Array.from(cats).toSorted();
  }, [tools]);

  // Get provider names from subscriptions
  const subscriptionProviderNames = useMemo(() => {
    return providerConnections
      .filter(c => c.connected && c.is_active && c.has_token)
      .map(c => PROVIDER_TO_MODEL_PROVIDER[c.provider])
      .filter(Boolean);
  }, [providerConnections]);

  // Get provider names from API keys
  const apiKeyProviderNames = useMemo(() => {
    const providers: string[] = [];

    for (const key of apiKeys) {
      // OpenRouter key gives access to many providers
      if (key.provider === 'openrouter') {
        providers.push(...OPENROUTER_ACCESSIBLE_PROVIDERS);
      } else {
        // Direct API key for a specific provider
        const modelProvider = PROVIDER_TO_MODEL_PROVIDER[key.provider];
        if (modelProvider) {
          providers.push(modelProvider);
        }
      }
    }

    return [...new Set(providers)]; // Remove duplicates
  }, [apiKeys]);

  // Combine subscription providers + API key providers
  const activeProviderNames = useMemo(() => {
    const combined = [...subscriptionProviderNames, ...apiKeyProviderNames];
    return [...new Set(combined)]; // Remove duplicates
  }, [subscriptionProviderNames, apiKeyProviderNames]);

  // Get active subscriptions for display
  const activeSubscriptions = useMemo(() => {
    return providerConnections
      .filter(c => c.connected && c.is_active)
      .map(c => ({
        name: c.provider_name,
        tier: c.subscription_tier,
      }));
  }, [providerConnections]);

  // Get active API keys for display
  const activeApiKeys = useMemo(() => {
    const providerNames: Record<string, string> = {
      openrouter: 'OpenRouter',
      anthropic: 'Anthropic',
      openai: 'OpenAI',
      google: 'Google',
      groq: 'Groq',
      cerebras: 'Cerebras',
      xai: 'xAI',
      replicate: 'Replicate',
    };

    return apiKeys.map(k => ({
      name: providerNames[k.provider] || k.provider,
      hint: k.key_hint,
    }));
  }, [apiKeys]);

  // Transform models into grouped options for select (like Settings page)
  // Filter by active subscriptions if any are connected
  const modelGroups = useMemo(() => {
    if (!providers || providers.length === 0) {
      // Fallback to basic models while loading
      return [{
        label: 'Anthropic (3)',
        options: [
          { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
          { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        ]
      }];
    }

    // If we have active subscriptions, filter to only those providers
    // BUT always include Local provider (free llama.cpp inference)
    const filteredProviders = activeProviderNames.length > 0
      ? providers.filter((provider: ModelProvider) =>
          activeProviderNames.includes(provider.name) || provider.name === 'Local (llama.cpp)'
        )
      : providers;

    // Group models by provider with count in label
    return filteredProviders.map((provider: ModelProvider) => ({
      label: `${provider.name} (${provider.models.length})`,
      options: provider.models.map((model) => ({
        value: model.id,
        label: `${model.name} [${model.tier}] (${Math.round(model.context / 1000)}K)`,
      }))
    }));
  }, [providers, activeProviderNames]);

  // Count total filtered models
  const filteredModelCount = useMemo(() => {
    return modelGroups.reduce((total, group) => total + group.options.length, 0);
  }, [modelGroups]);

  // Find current model's provider for display
  const currentModelProvider = useMemo(() => {
    for (const provider of providers) {
      const model = provider.models.find(m => m.id === selectedModel);
      if (model) {return provider.name;}
    }
    return 'Select a model';
  }, [providers, selectedModel]);

  // Filter phases based on allowedPhases prop (for Requirements Studio mode)
  const displayedPhases = useMemo(() => {
    if (!allowedPhases || allowedPhases.length === 0) {
      return PHASES;
    }
    return PHASES.filter(phase => allowedPhases.includes(phase.value));
  }, [allowedPhases]);

  // Filter tools based on restrictedToolCategories (for Requirements Studio mode)
  const workspaceFilteredTools = useMemo(() => {
    if (!restrictedToolCategories || restrictedToolCategories.length === 0) {
      return filteredTools;
    }
    return filteredTools.filter(tool => restrictedToolCategories.includes(tool.category));
  }, [filteredTools, restrictedToolCategories]);

  // Workspace mode label
  const workspaceModeLabel = workspaceMode === 'requirements_studio'
    ? 'Requirements Studio'
    : 'Implementation Hub';

  const toggleTool = (toolId: string) => {
    const newTools = enabledTools.includes(toolId)
      ? enabledTools.filter(id => id !== toolId)
      : [...enabledTools, toolId];

    // Call external handler if provided, otherwise update local state
    if (onToolsChange) {
      onToolsChange(newTools);
    } else {
      setLocalEnabledTools(newTools);
    }
  };

  // Collapsed state
  if (collapsed) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 8px',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: THEME.radius.md,
            backgroundColor: THEME.primaryMuted,
            border: `1px solid ${THEME.primary}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: THEME.primary,
          }}
        >
          ⚙
        </div>
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            color: THEME.textMuted,
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '1px',
          }}
        >
          CONFIG
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Panel Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: THEME.radius.md,
            backgroundColor: workspaceMode === 'requirements_studio' ? 'rgba(59, 130, 246, 0.15)' : THEME.primaryMuted,
            border: `1px solid ${workspaceMode === 'requirements_studio' ? '#3b82f6' : THEME.primary}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: workspaceMode === 'requirements_studio' ? '#3b82f6' : THEME.primary,
          }}
        >
          {workspaceMode === 'requirements_studio' ? '📝' : '⚙'}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.text }}>
            {workspaceMode === 'requirements_studio' ? 'Requirements Studio' : 'Agent Configuration'}
          </div>
          <div style={{ fontSize: '11px', color: THEME.textMuted }}>
            {workspaceMode === 'requirements_studio'
              ? 'Documentation & planning only'
              : 'Customize your agent'}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Agent Mode Toggle */}
        <PanelSection title="Mode" collapsible={false}>
          <LettaToggle
            label={agentMode ? 'Agent Mode' : 'LLM Mode'}
            checked={agentMode}
            onChange={onAgentModeChange}
          />
          <div style={{ fontSize: '11px', color: THEME.textDim, marginTop: '8px' }}>
            {agentMode ? 'Multi-step reasoning with tool use' : 'Direct LLM responses'}
          </div>

          {/* Phase Selector - only visible when Agent Mode is enabled */}
          {agentMode && onPhaseChange && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: THEME.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Current Agent Phase
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {displayedPhases.map(phase => {
                  const isSelected = phase.value === selectedPhase;
                  return (
                    <div
                      key={phase.value}
                      onClick={() => onPhaseChange(phase.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: THEME.radius.md,
                        backgroundColor: isSelected ? THEME.primaryMuted : THEME.bgMuted,
                        border: `1px solid ${isSelected ? THEME.primary + '40' : 'transparent'}`,
                        cursor: 'pointer',
                        transition: `all ${THEME.transition.fast}`,
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: THEME.radius.sm,
                          backgroundColor: isSelected ? THEME.primary : THEME.bgHover,
                          color: isSelected ? '#000' : THEME.textMuted,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {phase.label.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: THEME.text }}>
                          {phase.label}
                        </div>
                        <div style={{ fontSize: '10px', color: THEME.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {phase.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </PanelSection>

        {/* Model Selection */}
        <PanelSection title="Model">
          {/* Subscription and API key badges */}
          {!loadingConnections && (activeSubscriptions.length > 0 || activeApiKeys.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {/* Subscription badges */}
              {activeSubscriptions.map((sub, i) => (
                <span key={`sub-${i}`} style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: THEME.primaryMuted,
                  color: THEME.primary,
                  textTransform: 'uppercase',
                  border: `1px solid ${THEME.primary}40`,
                }}>
                  {sub.name}{sub.tier ? ` (${sub.tier})` : ''}
                </span>
              ))}
              {/* API key badges */}
              {activeApiKeys.map((key, i) => (
                <span key={`key-${i}`} style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}>
                  {key.name} 🔑
                </span>
              ))}
            </div>
          )}
          <LettaSelect
            value={selectedModel}
            onChange={onModelChange}
            groups={modelGroups}
          />
          {/* Model Capability Tags */}
          {getModelCapabilities(selectedModel).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
              {getModelCapabilities(selectedModel).map((cap) => {
                const config = CAPABILITY_CONFIG[cap];
                if (!config) {return null;}
                return (
                  <span key={cap} style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: config.bg,
                    color: config.color,
                  }}>
                    {config.label}
                  </span>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: '11px', color: THEME.textDim, marginTop: '8px' }}>
            {modelsLoading || loadingConnections ? 'Loading...' : currentModelProvider}
            {!modelsLoading && !loadingConnections && (
              <span style={{ marginLeft: '8px', color: THEME.textMuted }}>
                ({filteredModelCount} available)
              </span>
            )}
          </div>
        </PanelSection>

        {/* Tools - Dynamic from API */}
        <PanelSection title={`Skills (${enabledTools.length}/${tools.length})`}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search skills..."
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '12px',
              color: THEME.text,
              backgroundColor: THEME.bgMuted,
              border: `1px solid ${THEME.border}`,
              borderRadius: THEME.radius.md,
              outline: 'none',
              marginBottom: '10px',
            }}
          />

          {/* Category filter dropdown */}
          {availableCategories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ToolCategory | 'all')}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: THEME.text,
                backgroundColor: THEME.bgMuted,
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.radius.md,
                outline: 'none',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              <option value="all">All ({categoryCounts.all || 0})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_ICONS[cat] || '📦'} {cat} ({categoryCounts[cat] || 0})
                </option>
              ))}
            </select>
          )}

          {/* Loading state */}
          {loadingTools && (
            <div style={{ padding: '20px', textAlign: 'center', color: THEME.textMuted, fontSize: '12px' }}>
              Loading skills...
            </div>
          )}

          {/* Empty state */}
          {!loadingTools && tools.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: THEME.textMuted, fontSize: '12px' }}>
              No skills available. Add skills on the Skills page.
            </div>
          )}

          {/* No results */}
          {!loadingTools && tools.length > 0 && workspaceFilteredTools.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: THEME.textMuted, fontSize: '12px' }}>
              {workspaceMode === 'requirements_studio'
                ? 'No documentation tools available for Requirements Studio mode.'
                : 'No skills match your filter.'}
            </div>
          )}

          {/* Tools list */}
          {!loadingTools && workspaceFilteredTools.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              {workspaceFilteredTools.map(tool => {
                // Use tool.name for comparison since enabledTools stores names, not UUIDs
                const isEnabled = enabledTools.includes(tool.name);
                const isHovered = hoveredTool === tool.name;

                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.name)}
                    onMouseEnter={() => setHoveredTool(tool.name)}
                    onMouseLeave={() => setHoveredTool(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: THEME.radius.md,
                      backgroundColor: isEnabled ? THEME.primaryMuted : isHovered ? THEME.bgHover : THEME.bgMuted,
                      border: `1px solid ${isEnabled ? THEME.primary + '40' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: `all ${THEME.transition.fast}`,
                    }}
                  >
                    {/* Category icon */}
                    <div style={{
                      fontSize: '14px',
                      flexShrink: 0,
                      width: '20px',
                      textAlign: 'center',
                    }}>
                      {CATEGORY_ICONS[tool.category] || '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: THEME.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {tool.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: THEME.textDim,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {tool.description}
                      </div>
                    </div>
                    {/* Source badge */}
                    {tool.source && (
                      <div style={{
                        fontSize: '8px',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        backgroundColor: THEME.bgHover,
                        color: THEME.textMuted,
                        flexShrink: 0,
                        maxWidth: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {tool.source}
                      </div>
                    )}
                    {/* Checkbox */}
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: THEME.radius.sm,
                        backgroundColor: isEnabled ? THEME.primary : 'transparent',
                        border: `2px solid ${isEnabled ? THEME.primary : THEME.borderFocus}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isEnabled && '✓'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PanelSection>

        {/* Parameters */}
        <PanelSection title="Parameters" defaultCollapsed>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: THEME.textSecondary }}>Temperature</label>
                <span style={{ fontSize: '12px', color: THEME.primary, fontFamily: THEME.fontMono }}>
                  {temperature}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                style={{
                  width: '100%',
                  accentColor: THEME.primary,
                  height: '4px',
                }}
              />
            </div>
            <LettaInput
              label="Max Tokens"
              value={maxTokens}
              onChange={setMaxTokens}
              type="number"
            />
          </div>
        </PanelSection>

        {/* System Prompt */}
        <PanelSection title="System Prompt" defaultCollapsed>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter custom system instructions..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '10px 12px',
              fontSize: '13px',
              color: THEME.text,
              backgroundColor: THEME.bgMuted,
              border: `1px solid ${THEME.border}`,
              borderRadius: THEME.radius.md,
              outline: 'none',
              resize: 'vertical',
              fontFamily: THEME.fontFamily,
            }}
          />
        </PanelSection>

        {/* My Agents */}
        {customAgents.length > 0 && (
          <PanelSection title={`My Agents (${customAgents.length})`} defaultCollapsed>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {customAgents.map((agent) => (
                <CustomAgentCard
                  key={agent.id}
                  agent={agent}
                  isActive={currentAgentId === agent.id}
                  onLoad={() => onLoadCustomAgent?.(agent)}
                  onDelete={() => onDeleteCustomAgent?.(agent.id)}
                />
              ))}
            </div>
          </PanelSection>
        )}
      </div>

      {/* Panel Footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: `1px solid ${THEME.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <LettaButton variant="primary" fullWidth onClick={onNewAgent}>
            New Agent
          </LettaButton>
          <LettaButton variant="secondary" fullWidth onClick={onSaveAgent}>
            Save Agent
          </LettaButton>
        </div>
        <LettaButton variant="ghost" fullWidth onClick={onLoadTemplate}>
          Load Template
        </LettaButton>
      </div>
    </div>
  );
}

// Icon mapping for custom agents
const AGENT_ICON_MAP: Record<string, string> = {
  robot: '🤖',
  brain: '🧠',
  code: '💻',
  search: '🔍',
  bug: '🐛',
  rocket: '🚀',
  shield: '🛡️',
  chart: '📊',
  document: '📄',
  database: '🗄️',
  lightning: '⚡',
  star: '⭐',
};

// Custom Agent Card Component
function CustomAgentCard({
  agent,
  isActive,
  onLoad,
  onDelete,
}: {
  agent: CustomAgent;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const icon = AGENT_ICON_MAP[agent.icon] || '🤖';

  return (
    <div
      onClick={onLoad}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        backgroundColor: isActive ? THEME.primaryMuted : hovered ? THEME.bgHover : THEME.bgMuted,
        borderRadius: THEME.radius.md,
        border: `1px solid ${isActive ? THEME.primary + '40' : 'transparent'}`,
        cursor: 'pointer',
        transition: `all ${THEME.transition.fast}`,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: THEME.radius.sm,
          backgroundColor: `${agent.color}20`,
          border: `1px solid ${agent.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: THEME.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {agent.name}
        </div>
        <div style={{ fontSize: '11px', color: agent.color, fontWeight: 500 }}>
          {agent.phase}
        </div>
      </div>

      {/* Delete Button */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${agent.name}"?`)) {
              onDelete();
            }
          }}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            color: THEME.error,
            backgroundColor: THEME.errorMuted,
            border: 'none',
            borderRadius: THEME.radius.sm,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default AgentConfigPanel;
