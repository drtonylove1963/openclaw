/**
 * SaveAgentModal - Modal for saving current agent configuration
 */
import React, { useState, useEffect } from 'react';
import { THEME } from '../../styles/theme';
import { LettaButton, LettaInput } from './LettaLayout';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface AgentConfig {
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
}

export interface CustomAgent extends AgentConfig {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface SaveAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: CustomAgent) => void;
  currentConfig: AgentConfig;
  editingAgent?: CustomAgent | null;
}

// Icon options
const ICON_OPTIONS = [
  { id: 'robot', label: 'Robot', emoji: '🤖' },
  { id: 'brain', label: 'Brain', emoji: '🧠' },
  { id: 'code', label: 'Code', emoji: '💻' },
  { id: 'search', label: 'Search', emoji: '🔍' },
  { id: 'bug', label: 'Bug', emoji: '🐛' },
  { id: 'rocket', label: 'Rocket', emoji: '🚀' },
  { id: 'shield', label: 'Shield', emoji: '🛡️' },
  { id: 'chart', label: 'Chart', emoji: '📊' },
  { id: 'document', label: 'Document', emoji: '📄' },
  { id: 'database', label: 'Database', emoji: '🗄️' },
  { id: 'lightning', label: 'Lightning', emoji: '⚡' },
  { id: 'star', label: 'Star', emoji: '⭐' },
];

// Color options
const COLOR_OPTIONS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export function SaveAgentModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  editingAgent,
}: SaveAgentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('robot');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingAgent) {
        setName(editingAgent.name);
        setDescription(editingAgent.description);
        setSelectedIcon(editingAgent.icon);
        setSelectedColor(editingAgent.color);
      } else {
        setName('');
        setDescription('');
        setSelectedIcon('robot');
        setSelectedColor('#8B5CF6');
      }
      setError(null);
    }
  }, [isOpen, editingAgent]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const agentData = {
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor,
        phase: currentConfig.phase,
        tools: currentConfig.tools,
        systemPrompt: currentConfig.systemPrompt,
        temperature: currentConfig.temperature,
        maxTokens: currentConfig.maxTokens,
        model: currentConfig.model,
      };

      const url = editingAgent
        ? `${API_BASE}/api/v1/custom-agents/${editingAgent.id}?user_id=default`
        : `${API_BASE}/api/v1/custom-agents?user_id=default`;

      const response = await fetch(url, {
        method: editingAgent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        const savedAgent = await response.json();
        onSave(savedAgent);
        onClose();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to save agent');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error saving agent:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {return null;}

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: THEME.bgElevated,
          borderRadius: THEME.radius.xl,
          border: `1px solid ${THEME.border}`,
          width: '90%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${THEME.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: THEME.text, margin: 0 }}>
              {editingAgent ? 'Edit Agent' : 'Save Agent'}
            </h2>
            <p style={{ fontSize: '13px', color: THEME.textMuted, margin: '4px 0 0 0' }}>
              {editingAgent ? 'Update your custom agent configuration' : 'Save current configuration as a reusable agent'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.textMuted,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: THEME.errorMuted,
                border: `1px solid ${THEME.error}`,
                borderRadius: THEME.radius.md,
                marginBottom: '16px',
                fontSize: '13px',
                color: THEME.error,
              }}
            >
              {error}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <LettaInput
              label="Agent Name"
              value={name}
              onChange={setName}
              placeholder="e.g., My Code Reviewer"
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: THEME.textSecondary,
                marginBottom: '6px',
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              style={{
                width: '100%',
                minHeight: '60px',
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
          </div>

          {/* Icon Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: THEME.textSecondary,
                marginBottom: '8px',
              }}
            >
              Icon
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => setSelectedIcon(icon.id)}
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    backgroundColor: selectedIcon === icon.id ? THEME.primaryMuted : THEME.bgMuted,
                    border: `2px solid ${selectedIcon === icon.id ? THEME.primary : 'transparent'}`,
                    borderRadius: THEME.radius.md,
                    cursor: 'pointer',
                    transition: `all ${THEME.transition.fast}`,
                  }}
                  title={icon.label}
                >
                  {icon.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: THEME.textSecondary,
                marginBottom: '8px',
              }}
            >
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: color,
                    border: `3px solid ${selectedColor === color ? '#fff' : 'transparent'}`,
                    borderRadius: THEME.radius.md,
                    cursor: 'pointer',
                    boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : 'none',
                    transition: `all ${THEME.transition.fast}`,
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Current Config Summary */}
          <div
            style={{
              padding: '12px',
              backgroundColor: THEME.bgMuted,
              borderRadius: THEME.radius.md,
              border: `1px solid ${THEME.border}`,
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: THEME.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>
              Configuration Preview
            </div>
            <div style={{ fontSize: '12px', color: THEME.textSecondary }}>
              <div><strong>Phase:</strong> {currentConfig.phase}</div>
              <div><strong>Tools:</strong> {currentConfig.tools.join(', ') || 'None'}</div>
              <div><strong>Temperature:</strong> {currentConfig.temperature}</div>
              {currentConfig.model && <div><strong>Model:</strong> {currentConfig.model}</div>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${THEME.border}`,
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <LettaButton variant="ghost" onClick={onClose}>
            Cancel
          </LettaButton>
          <LettaButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingAgent ? 'Update Agent' : 'Save Agent'}
          </LettaButton>
        </div>
      </div>
    </div>
  );
}

export default SaveAgentModal;
