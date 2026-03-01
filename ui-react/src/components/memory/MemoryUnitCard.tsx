import { GlassCard } from '../shared/GlassCard';

export type MemoryStratum = 'episodic' | 'semantic' | 'procedural' | 'meta-cognitive';
export type MemoryScope = 'local' | 'project' | 'global';

export interface MemoryUnit {
  id: string;
  content: string;
  stratum: MemoryStratum;
  scope: MemoryScope;
  confidence: number;
  tags: string[];
  timestamp: string;
}

export interface MemoryUnitCardProps {
  unit: MemoryUnit;
  className?: string;
}

const STRATUM_COLORS: Record<MemoryStratum, string> = {
  episodic: '#00d4ff',
  semantic: '#8b5cf6',
  procedural: '#10b981',
  'meta-cognitive': '#f59e0b',
};

/**
 * MemoryUnitCard - Displays a single memory unit
 *
 * Shows content preview, stratum badge, scope badge, confidence bar, tags, and timestamp.
 * Used in the Mnemosyne tab memory grid.
 */
export function MemoryUnitCard({ unit, className = '' }: MemoryUnitCardProps) {
  const stratumColor = STRATUM_COLORS[unit.stratum];
  const confidencePercent = Math.min(Math.max(unit.confidence, 0), 100);

  // Truncate content to 3 lines (approx 150 chars)
  const truncatedContent =
    unit.content.length > 150
      ? unit.content.substring(0, 147) + '...'
      : unit.content;

  // Format timestamp
  const formattedTime = new Date(unit.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <GlassCard variant="bordered" className={className} style={{ padding: '16px' }}>
      {/* Content Preview */}
      <p
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#f0f0f5',
          marginBottom: '12px',
          minHeight: '67px', // Approximately 3 lines
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {truncatedContent}
      </p>

      {/* Badges Row */}
      <div className="flex gap-2 mb-3">
        {/* Stratum Badge */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: `${stratumColor}20`,
            border: `1px solid ${stratumColor}40`,
            color: stratumColor,
          }}
        >
          {unit.stratum}
        </span>

        {/* Scope Badge */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#6b7280',
          }}
        >
          {unit.scope}
        </span>
      </div>

      {/* Confidence Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${confidencePercent}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${stratumColor}60 0%, ${stratumColor} 100%)`,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Tags Row */}
      {unit.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {unit.tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#6b7280',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div
        style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: 'auto',
        }}
      >
        {formattedTime}
      </div>
    </GlassCard>
  );
}
