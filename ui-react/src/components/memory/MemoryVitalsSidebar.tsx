import { GlassCard } from '../shared';
import { BrainOrbitViz, type BrainStat } from './BrainOrbitViz';
import { ConsolidationStatus } from './ConsolidationStatus';
import { ConstellationPreview } from './ConstellationPreview';
import { PatternChip } from './PatternChip';

export interface MemoryVitals {
  episodicCount: number;
  factsCount: number;
  entitiesCount: number;
  relationsCount: number;
  consolidationActive: boolean;
}

export interface Pattern {
  text: string;
  confidence: number;
}

export interface MemoryVitalsSidebarProps {
  vitals: MemoryVitals;
  patterns: Pattern[];
  className?: string;
}

/**
 * MemoryVitalsSidebar - Right sidebar with Memory Vitals, Knowledge Constellation, and Top Patterns
 *
 * Width: 340px. Contains 3 stacked vitals cards.
 */
export function MemoryVitalsSidebar({
  vitals,
  patterns,
  className = '',
}: MemoryVitalsSidebarProps) {
  const brainStats: BrainStat[] = [
    { label: 'Episodic', value: vitals.episodicCount.toLocaleString() },
    { label: 'Facts', value: vitals.factsCount.toLocaleString() },
    { label: 'Entities', value: vitals.entitiesCount.toLocaleString() },
    { label: 'Relations', value: vitals.relationsCount.toLocaleString() },
  ];

  return (
    <aside
      className={`flex flex-col gap-[25px] overflow-y-auto ni-scrollbar ${className}`}
      style={{ width: '340px' }}
    >
      {/* Memory Vitals */}
      <GlassCard variant="bordered" style={{ padding: '25px' }}>
        <h3
          className="text-[13px] font-semibold uppercase mb-5"
          style={{ color: '#6b7280', letterSpacing: '1px' }}
        >
          Memory Vitals
        </h3>
        <BrainOrbitViz stats={brainStats} />
        <ConsolidationStatus active={vitals.consolidationActive} />
      </GlassCard>

      {/* Knowledge Constellation */}
      <GlassCard variant="bordered" style={{ padding: '25px' }}>
        <h3
          className="text-[13px] font-semibold uppercase mb-5"
          style={{ color: '#6b7280', letterSpacing: '1px' }}
        >
          Knowledge Constellation
        </h3>
        <ConstellationPreview />
        <button
          className="flex items-center justify-center gap-2 w-full text-[13px] font-semibold cursor-pointer transition-all duration-300"
          style={{
            padding: '12px',
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: '12px',
            color: '#00d4ff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>Explore Graph</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </GlassCard>

      {/* Top Patterns */}
      <GlassCard variant="bordered" style={{ padding: '25px' }}>
        <h3
          className="text-[13px] font-semibold uppercase mb-5"
          style={{ color: '#6b7280', letterSpacing: '1px' }}
        >
          Top Patterns
        </h3>
        {patterns.map((pattern, i) => (
          <PatternChip key={i} text={pattern.text} confidence={pattern.confidence} />
        ))}
      </GlassCard>
    </aside>
  );
}
