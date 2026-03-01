import React, { useState, useEffect } from 'react';
import type { AgentFull } from '../../types/agent';
import { COLORS } from '../../styles/colors';

interface AgentEditFormProps {
  agent: AgentFull;
  onSave: (updatedAgent: AgentFull) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'development',
  'architecture',
  'testing',
  'devops',
  'security',
  'documentation',
  'data',
  'ui-ux',
  'ai-ml',
  'business',
  'specialized',
];

interface ModelInfo {
  id: string;
  name: string;
  tier: string;
  context: number;
}

interface ProviderInfo {
  id: string;
  name: string;
  models: ModelInfo[];
}

interface ModelsData {
  providers: ProviderInfo[];
  legacy_tiers: Record<string, string>;
  total_providers: number;
  total_models: number;
}

interface AvailableTools {
  claude_tools: Array<{ name: string; description: string; source: string; category: string }>;
  mcp_tools: Array<{ name: string; description: string; source: string; server_id?: string; category: string }>;
}

export const AgentEditForm: React.FC<AgentEditFormProps> = ({ agent, onSave, onCancel }) => {
  const [model, setModel] = useState(agent.model);
  const [category, setCategory] = useState(agent.category);
  const [tools, setTools] = useState<string[]>(agent.tools);
  const [description, setDescription] = useState(agent.description);
  const [fullPrompt, setFullPrompt] = useState(agent.full_prompt || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableTools, setAvailableTools] = useState<AvailableTools | null>(null);
  const [modelsData, setModelsData] = useState<ModelsData | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Load available tools and models
  useEffect(() => {
    const loadData = async () => {
      try {
        const [toolsRes, modelsRes] = await Promise.all([
          fetch('/api/v1/agents/tools/available'),
          fetch('/api/v1/agents/models/available'),
        ]);

        if (toolsRes.ok) {
          const toolsData = await toolsRes.json();
          setAvailableTools(toolsData);
        }

        if (modelsRes.ok) {
          const models = await modelsRes.json();
          setModelsData(models);

          // Detect current provider from model
          if (agent.model) {
            const currentModel = agent.model.toLowerCase();
            for (const provider of models.providers) {
              if (provider.models.some((m: ModelInfo) => m.id.toLowerCase() === currentModel)) {
                setSelectedProvider(provider.id);
                break;
              }
            }
            // Check legacy tiers
            if (!selectedProvider && models.legacy_tiers[currentModel]) {
              setSelectedProvider('anthropic');
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, [agent.model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/v1/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          category,
          tools,
          description,
          full_prompt: fullPrompt,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save agent');
      }

      const updatedAgent = await response.json();
      setSuccess(true);
      setTimeout(() => {
        onSave(updatedAgent);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (toolName: string) => {
    setTools((prev) =>
      prev.includes(toolName) ? prev.filter((t) => t !== toolName) : [...prev, toolName]
    );
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'premium': return COLORS.premium;
      case 'standard': return COLORS.standard;
      case 'fast': return COLORS.fast;
      case 'free': return COLORS.free;
      default: return COLORS.textMuted;
    }
  };

  const styles = {
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    input: {
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '10px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    select: {
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '10px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      outline: 'none',
      cursor: 'pointer',
    },
    textarea: {
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '10px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: '100px',
    },
    promptTextarea: {
      padding: '16px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '10px',
      color: COLORS.text,
      fontSize: '13px',
      fontFamily: "'Fira Code', 'Courier New', monospace",
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: '200px',
      lineHeight: 1.6,
    },
    modelRow: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap' as const,
    },
    providerSelect: {
      flex: '1',
      minWidth: '150px',
    },
    modelSelect: {
      flex: '2',
      minWidth: '250px',
    },
    modelOption: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tierBadge: {
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
    },
    toolsGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      maxHeight: '200px',
      overflowY: 'auto' as const,
      padding: '12px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '10px',
      border: `1px solid ${COLORS.border}`,
    },
    toolChip: {
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '1px solid',
    },
    toolChipSelected: {
      backgroundColor: `${COLORS.accent}20`,
      borderColor: COLORS.accent,
      color: COLORS.accent,
    },
    toolChipUnselected: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.border,
      color: COLORS.textMuted,
    },
    sectionTitle: {
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.accent,
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '16px',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      border: 'none',
    },
    saveButton: {
      backgroundColor: COLORS.accent,
      color: '#fff',
    },
    cancelButton: {
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      color: COLORS.text,
    },
    message: {
      padding: '12px 16px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 500,
    },
    errorMessage: {
      backgroundColor: `${COLORS.danger}15`,
      border: `1px solid ${COLORS.danger}40`,
      color: COLORS.danger,
    },
    successMessage: {
      backgroundColor: `${COLORS.success}15`,
      border: `1px solid ${COLORS.success}40`,
      color: COLORS.success,
    },
    currentModel: {
      fontSize: '12px',
      color: COLORS.textMuted,
      marginTop: '4px',
    },
  };

  // Get all models flattened with provider info
  const allModels = modelsData?.providers.flatMap((provider) =>
    provider.models.map((m) => ({
      ...m,
      providerId: provider.id,
      providerName: provider.name,
    }))
  ) || [];

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && (
        <div style={{ ...styles.message, ...styles.errorMessage }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ ...styles.message, ...styles.successMessage }}>
          Agent saved successfully!
        </div>
      )}

      {/* Model Selection - Single dropdown with all models grouped by provider */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Model ({modelsData?.total_models || 0} available)</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ ...styles.select, width: '100%' }}
        >
          {modelsData?.providers.map((provider) => (
            <optgroup key={provider.id} label={`${provider.name} (${provider.models.length})`}>
              {provider.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} [{m.tier}] ({Math.round(m.context / 1000)}K context)
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div style={styles.currentModel}>
          Current: <strong>{model}</strong>
        </div>
      </div>

      {/* Category Selection */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.select}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Skills Multi-Select */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Skills ({tools.length} selected)
        </label>
        <div style={styles.toolsGrid}>
          {/* Claude Skills */}
          <div style={{ width: '100%' }}>
            <div style={styles.sectionTitle}>Claude Skills</div>
          </div>
          {(availableTools?.claude_tools || []).map((tool) => (
            <div
              key={tool.name}
              onClick={() => toggleTool(tool.name)}
              style={{
                ...styles.toolChip,
                ...(tools.includes(tool.name)
                  ? styles.toolChipSelected
                  : styles.toolChipUnselected),
              }}
              title={tool.description}
            >
              {tool.name}
            </div>
          ))}

          {/* MCP Skills */}
          {availableTools?.mcp_tools && availableTools.mcp_tools.length > 0 && (
            <>
              <div style={{ width: '100%', marginTop: '12px' }}>
                <div style={styles.sectionTitle}>MCP Skills</div>
              </div>
              {availableTools.mcp_tools.map((tool) => (
                <div
                  key={tool.name}
                  onClick={() => toggleTool(tool.name)}
                  style={{
                    ...styles.toolChip,
                    ...(tools.includes(tool.name)
                      ? styles.toolChipSelected
                      : styles.toolChipUnselected),
                  }}
                  title={tool.description}
                >
                  {tool.name.replace('mcp__', '').replace('__', ':')}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
          placeholder="Agent description..."
        />
      </div>

      {/* System Prompt */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>System Prompt</label>
        <textarea
          value={fullPrompt}
          onChange={(e) => setFullPrompt(e.target.value)}
          style={styles.promptTextarea}
          placeholder="Agent system prompt instructions..."
        />
      </div>

      {/* Buttons */}
      <div style={styles.buttonRow}>
        <button
          type="button"
          onClick={onCancel}
          style={{ ...styles.button, ...styles.cancelButton }}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ ...styles.button, ...styles.saveButton }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default AgentEditForm;
