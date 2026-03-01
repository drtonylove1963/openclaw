import { GlassCard } from '../shared';
import type { Tool } from '../../stores/toolsStore';

interface ToolCardNeuralProps {
  tool: Tool;
  onClick: (tool: Tool) => void;
}

const sourceColors: Record<string, string> = {
  mcp: '#00d4ff',
  builtin: '#8b5cf6',
  custom: '#f59e0b',
};

const sourceLabels: Record<string, string> = {
  mcp: 'MCP',
  builtin: 'Built-in',
  custom: 'Custom',
};

/**
 * ToolCardNeural - Display a tool in the MCP Tools grid (Neural Interface design)
 *
 * Features:
 * - Glass card with hover effect
 * - Color-coded source badge
 * - Truncated description (2 lines)
 * - Click to open execution modal
 */
export function ToolCardNeural({ tool, onClick }: ToolCardNeuralProps) {
  const sourceColor = sourceColors[tool.source] || '#6b7280';
  const sourceLabel = sourceLabels[tool.source] || tool.source;

  return (
    <GlassCard
      variant="bordered"
      hoverable
      onClick={() => onClick(tool)}
      style={{
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header with icon and source badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          ⚙️
        </div>

        <div
          style={{
            padding: '4px 10px',
            borderRadius: '8px',
            background: `${sourceColor}20`,
            border: `1px solid ${sourceColor}40`,
            fontSize: '11px',
            fontWeight: 600,
            color: sourceColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {sourceLabel}
        </div>
      </div>

      {/* Tool name */}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#f0f0f5',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {tool.name}
      </h3>

      {/* Description (max 2 lines) */}
      <p
        style={{
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: 1.5,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '39px',
        }}
      >
        {tool.description}
      </p>

      {/* Category (if available) */}
      {tool.category && (
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            marginTop: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {tool.category}
        </div>
      )}
    </GlassCard>
  );
}
