import { useState, useEffect } from 'react';
import { MemorySearchBar } from '../../components/memory/MemorySearchBar';
import { MemoryTabBar, type MemoryTab } from '../../components/memory/MemoryTabBar';
import { TimelineStream } from '../../components/memory/TimelineStream';
import { MemoryVitalsSidebar } from '../../components/memory/MemoryVitalsSidebar';
import { MnemosyneTab } from '../../components/memory/MnemosyneTab';
import { LearningsTab } from '../../components/memory/LearningsTab';
import { useMemoryData } from '../../hooks/useMemoryData';
import { useMemoryStore } from '../../stores/memoryStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * MemoryPage - The Memory Palace
 *
 * Route: /memory
 *
 * Layout:
 *  - Header: Tricolor gradient title, full-width search bar, tab navigation
 *  - Content: Timeline stream (flex:1) + Vitals sidebar (340px)
 *
 * Data is sourced from useMemoryData hook (mock data, ready for API swap).
 * Tab state is managed via memoryStore (Zustand).
 */
export function MemoryPage() {
  const activeTab = useMemoryStore((s) => s.activeTab);
  const setActiveTab = useMemoryStore((s) => s.setActiveTab);
  const [pendingLearningsCount, setPendingLearningsCount] = useState(0);
  const isMobile = useBreakpoint('md');

  const {
    vitals,
    patterns,
    timeline,
    searchQuery,
    setSearchQuery,
    handleSearch,
  } = useMemoryData();

  // Fetch pending learnings count for badge
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem('pronetheia_token');
        const response = await fetch(`${API_BASE}/api/v1/learnings?status=pending`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          const learnings = data.learnings || data || [];
          setPendingLearningsCount(learnings.length);
        }
      } catch {
        // Silently fail
      }
    };

    fetchPendingCount();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic search placeholder from vitals
  const searchPlaceholder = `Search across ${vitals.episodicCount.toLocaleString()} memories, ${vitals.factsCount.toLocaleString()} facts, ${vitals.entitiesCount.toLocaleString()} entities...`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Section */}
      <div style={{ padding: isMobile ? '20px 20px 10px' : '40px 60px 20px' }}>
        {/* Page Title */}
        <h1
          className="ni-tricolor-text animate-neural-pulse-text mb-[30px]"
          style={{
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: 700,
            backgroundSize: '200% 100%',
          }}
        >
          Unified Memory System
        </h1>

        {/* Search Bar */}
        <MemorySearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder={searchPlaceholder}
        />

        {/* Tab Navigation */}
        <MemoryTabBar
          activeTab={activeTab}
          onTabChange={(tab: MemoryTab) => setActiveTab(tab)}
          pendingLearningsCount={pendingLearningsCount}
        />
      </div>

      {/* Content Area - stack on mobile */}
      <div
        className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col' : ''}`}
        style={{ 
          gap: isMobile ? '20px' : '30px', 
          padding: isMobile ? '0 20px 20px' : '0 60px 40px' 
        }}
      >
        {/* Main Content Area */}
        <div className={isMobile ? 'w-full' : 'flex-1'}>
          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <TimelineStream groups={timeline} />
          )}

          {/* Knowledge Graph Tab (placeholder) */}
          {activeTab === 'knowledge-graph' && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[16px]" style={{ color: '#6b7280' }}>
                Knowledge Graph visualization coming soon
              </span>
            </div>
          )}

          {/* Search Tab (placeholder) */}
          {activeTab === 'search' && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[16px]" style={{ color: '#6b7280' }}>
                Advanced search interface coming soon
              </span>
            </div>
          )}

          {/* Analytics Tab (placeholder) */}
          {activeTab === 'analytics' && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[16px]" style={{ color: '#6b7280' }}>
                Memory analytics dashboard coming soon
              </span>
            </div>
          )}

          {/* Mnemosyne Tab */}
          {activeTab === 'mnemosyne' && (
            <MnemosyneTab />
          )}

          {/* Learnings Tab */}
          {activeTab === 'learnings' && (
            <LearningsTab />
          )}
        </div>

        {/* Right Sidebar - hidden on mobile, shown in bottom sheet or modal */}
        {!isMobile && (
          <MemoryVitalsSidebar vitals={vitals} patterns={patterns} />
        )}
      </div>
    </div>
  );
}
