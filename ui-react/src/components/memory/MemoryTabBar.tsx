export type MemoryTab = 'timeline' | 'knowledge-graph' | 'search' | 'analytics' | 'mnemosyne' | 'learnings';

export interface MemoryTabBarProps {
  activeTab: MemoryTab;
  onTabChange: (tab: MemoryTab) => void;
  className?: string;
  pendingLearningsCount?: number;
}

const TABS: { id: MemoryTab; label: string; icon: string }[] = [
  { id: 'timeline', label: 'Timeline', icon: '\u301C' },
  { id: 'knowledge-graph', label: 'Knowledge Graph', icon: '\u2726' },
  { id: 'search', label: 'Search', icon: '\u{1F50D}' },
  { id: 'analytics', label: 'Analytics', icon: '\u{1F4CA}' },
  { id: 'mnemosyne', label: 'Mnemosyne', icon: '\u{1F9EC}' },
  { id: 'learnings', label: 'Learnings', icon: '\u{1F4A1}' },
];

/**
 * MemoryTabBar - Tab navigation for Memory page
 *
 * 6 tabs: Timeline, Knowledge Graph, Search, Analytics, Mnemosyne, Learnings
 * Active tab has cyan accent background with glow.
 * Learnings tab shows pending count badge.
 */
export function MemoryTabBar({ activeTab, onTabChange, pendingLearningsCount = 0, className = '' }: MemoryTabBarProps) {
  return (
    <div className={`flex gap-[15px] ${className}`} role="tablist" aria-label="Memory sections">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const showBadge = tab.id === 'learnings' && pendingLearningsCount > 0;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-2 text-[14px] font-medium transition-all duration-300 cursor-pointer relative"
            style={{
              padding: '12px 24px',
              background: isActive
                ? 'rgba(0, 212, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              border: isActive
                ? '1px solid rgba(0, 212, 255, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              color: isActive ? '#f0f0f5' : '#6b7280',
              boxShadow: isActive ? '0 0 20px rgba(0, 212, 255, 0.2)' : 'none',
            }}
          >
            <span className="text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>

            {/* Badge for pending learnings count */}
            {showBadge && (
              <span
                className="flex items-center justify-center"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  borderRadius: '10px',
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.6)',
                }}
              >
                {pendingLearningsCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
