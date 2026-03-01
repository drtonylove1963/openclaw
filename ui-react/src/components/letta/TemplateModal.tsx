/**
 * TemplateModal - Agent Template Selection Modal
 * Displays available agent templates organized by category
 */
import React, { useState, useEffect } from 'react';
import { THEME } from '../../styles/theme';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  phase: string;
  tools: string[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number | null;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: AgentTemplate) => void;
}

// Icon mapping
const ICON_MAP: Record<string, string> = {
  'magnifying-glass': '🔍',
  'bug': '🐛',
  'layers': '📚',
  'server': '🖥️',
  'database': '🗄️',
  'check-circle': '✅',
  'shield': '🛡️',
  'rocket': '🚀',
  'document': '📄',
  'chart': '📊',
  'lightning': '⚡',
};

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/agent-templates/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
        setCategories(data.categories);
        if (data.categories.length > 0 && !selectedCategory) {
          setSelectedCategory(data.categories[0]);
        }
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {return null;}

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

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
          maxWidth: '800px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
              Load Agent Template
            </h2>
            <p style={{ fontSize: '13px', color: THEME.textMuted, margin: '4px 0 0 0' }}>
              Select a preconfigured agent template to get started quickly
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

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '12px 24px',
            borderBottom: `1px solid ${THEME.border}`,
            backgroundColor: THEME.bgMuted,
            overflowX: 'auto',
          }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: selectedCategory === category ? THEME.text : THEME.textMuted,
                backgroundColor: selectedCategory === category ? THEME.bgElevated : 'transparent',
                border: selectedCategory === category ? `1px solid ${THEME.border}` : '1px solid transparent',
                borderRadius: THEME.radius.md,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: `all ${THEME.transition.fast}`,
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: THEME.textMuted }}>
              Loading templates...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: THEME.error }}>
              {error}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: AgentTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const [hovered, setHovered] = useState(false);

  const icon = ICON_MAP[template.icon] || '🤖';

  // Phase label mapping
  const phaseLabels: Record<string, string> = {
    auto: 'Auto',
    discovery: 'Discovery',
    planning: 'Planning',
    implementation: 'Implementation',
    validation: 'Validation',
    refinement: 'Refinement',
    delivery: 'Delivery',
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px',
        backgroundColor: hovered ? THEME.bgHover : THEME.bgMuted,
        borderRadius: THEME.radius.lg,
        border: `1px solid ${hovered ? template.color : THEME.border}`,
        cursor: 'pointer',
        transition: `all ${THEME.transition.fast}`,
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Icon and Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: THEME.radius.md,
            backgroundColor: `${template.color}20`,
            border: `1px solid ${template.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.text }}>
            {template.name}
          </div>
          <div style={{ fontSize: '11px', color: template.color, fontWeight: 500 }}>
            {phaseLabels[template.phase] || template.phase}
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '12px',
          color: THEME.textSecondary,
          lineHeight: 1.5,
          margin: '0 0 12px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {template.description}
      </p>

      {/* Tools */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {template.tools.slice(0, 3).map((tool) => (
          <span
            key={tool}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              color: THEME.textMuted,
              backgroundColor: THEME.bg,
              borderRadius: THEME.radius.sm,
              textTransform: 'capitalize',
            }}
          >
            {tool.replace('_', ' ')}
          </span>
        ))}
        {template.tools.length > 3 && (
          <span
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              color: THEME.textMuted,
              backgroundColor: THEME.bg,
              borderRadius: THEME.radius.sm,
            }}
          >
            +{template.tools.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

export default TemplateModal;
