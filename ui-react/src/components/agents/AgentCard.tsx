import { GlassCard, StatusIndicator } from '../shared';
import { Sparkles } from 'lucide-react';
import type { Agent } from '../../stores/agentsStore';

export interface AgentCardProps {
  agent: Agent;
  onSelect: (agentId: string) => void;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  development: '#00d4ff',
  testing: '#10b981',
  security: '#ef4444',
  devops: '#f59e0b',
  design: '#8b5cf6',
  planning: '#06b6d4',
  documentation: '#6366f1',
  debugging: '#ec4899',
  orchestration: '#a855f7',
  backend: '#3b82f6',
  frontend: '#14b8a6',
  database: '#84cc16',
  infrastructure: '#f97316',
  default: '#6b7280',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
}

/**
 * AgentCard - Displays an individual agent with status and category
 *
 * Features:
 * - Glass card with hover effect
 * - Category badge with color coding
 * - Status indicator
 * - Model badge
 * - Truncated description (2 lines)
 * - Click to select
 */
export function AgentCard({ agent, onSelect }: AgentCardProps) {
  const categoryColor = getCategoryColor(agent.category);

  return (
    <GlassCard
      variant="bordered"
      hoverable
      onClick={() => onSelect(agent.id)}
      style={{
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header - Icon/Avatar + Name */}
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `${categoryColor}15`,
            border: `1px solid ${categoryColor}40`,
          }}
        >
          {agent.icon ? (
            <span style={{ fontSize: '24px' }}>{agent.icon}</span>
          ) : (
            <Sparkles size={24} style={{ color: categoryColor }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#f0f0f5',
              margin: '0 0 4px 0',
              lineHeight: 1.3,
            }}
          >
            {agent.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className="inline-block"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: '6px',
                background: `${categoryColor}20`,
                color: categoryColor,
                border: `1px solid ${categoryColor}40`,
              }}
            >
              {agent.category}
            </span>
          </div>
        </div>
      </div>

      {/* Description - 2 line truncate */}
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.5,
          color: '#9ca3af',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {agent.description}
      </p>

      {/* Footer - Status + Model */}
      <div className="flex items-center justify-between gap-3">
        <StatusIndicator
          status={agent.status}
          text={agent.status}
          className="flex-shrink-0"
        />

        <div
          className="flex-shrink-0"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#6b7280',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {agent.model}
        </div>
      </div>
    </GlassCard>
  );
}
