import { useState, useCallback } from 'react';
import type { TimelineDateGroup } from '../components/memory';
import type { MemoryVitals, Pattern } from '../components/memory/MemoryVitalsSidebar';

// ---- Mock Data (swap with real API calls when backend is available) ----

const MOCK_VITALS: MemoryVitals = {
  episodicCount: 1247,
  factsCount: 384,
  entitiesCount: 156,
  relationsCount: 423,
  consolidationActive: true,
};

const MOCK_PATTERNS: Pattern[] = [
  { text: 'User prefers RESTful API conventions with clear endpoint naming', confidence: 0.92 },
  { text: 'Consistent use of PostgreSQL with SQLAlchemy ORM across projects', confidence: 0.85 },
  { text: 'Multi-agent orchestration preferred for complex tasks', confidence: 0.79 },
  { text: 'Testing required before deployment to Proxmox servers', confidence: 0.74 },
];

const MOCK_TIMELINE: TimelineDateGroup[] = [
  {
    date: 'Today - February 11, 2026',
    episodes: [
      {
        id: 'ep-1',
        agent: 'Perception Layer',
        icon: '\u{1F3AF}',
        eventType: 'User Intent',
        content:
          'User requested API build for task management system with real-time notifications. Detected preference for RESTful conventions and PostgreSQL stack.',
        time: '2 hours ago',
        salience: 0.8,
        accentColor: '#00d4ff',
      },
      {
        id: 'ep-2',
        agent: 'Orchestrator',
        icon: '\u{1F9E0}',
        eventType: 'Agent Coordination',
        content:
          'Deployed multi-agent team: Backend Architect, Database Designer, Developer, Security Engineer, QA Tester, and DevOps. Parallel execution strategy approved.',
        time: '2 hours ago',
        salience: 0.85,
        accentColor: '#8b5cf6',
      },
      {
        id: 'ep-3',
        agent: 'Consolidation Engine',
        icon: '\u{1F4BE}',
        eventType: 'Memory Update',
        content:
          'Nightly consolidation completed. Extracted 47 new facts, updated 12 entity relationships, discovered 3 behavioral patterns. Knowledge graph expanded.',
        time: '5 hours ago',
        salience: 0.75,
        accentColor: '#f59e0b',
      },
    ],
  },
  {
    date: 'Yesterday - February 10, 2026',
    episodes: [
      {
        id: 'ep-4',
        agent: 'QA Tester',
        icon: '\u2713',
        eventType: 'Test Execution',
        content:
          'Backend test suite executed: 322 of 323 tests passed. One failing test in UMS knowledge graph relationship validation. Issue logged for refinement.',
        time: '1 day ago',
        salience: 0.7,
        accentColor: '#10b981',
      },
      {
        id: 'ep-5',
        agent: 'Developer Agent',
        icon: '\u{1F527}',
        eventType: 'Code Generation',
        content:
          'Implemented JWT authentication middleware for FastAPI. Added token refresh endpoints, blacklist support, and role-based access control decorators.',
        time: '1 day ago',
        salience: 0.65,
        accentColor: '#00d4ff',
      },
      {
        id: 'ep-6',
        agent: 'Integrity Monitor',
        icon: '\u{1F50D}',
        eventType: 'Validation',
        content:
          'Weekly memory integrity check completed. 1,247 episodic memories validated, 384 facts verified, 156 entities confirmed. Zero orphaned relationships detected.',
        time: '1 day ago',
        salience: 0.6,
        accentColor: '#c084fc',
      },
    ],
  },
];

// ---- Hook ----

interface UseMemoryDataResult {
  vitals: MemoryVitals;
  patterns: Pattern[];
  timeline: TimelineDateGroup[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearch: (q: string) => void;
  isSearching: boolean;
}

/**
 * useMemoryData - Data hook for the Memory page
 *
 * Currently returns mock data matching the mockup. Structured so that
 * swapping to real API calls (TanStack Query against GET /api/v1/memory/search)
 * requires only changing this hook's internals.
 */
export function useMemoryData(): UseMemoryDataResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // TODO: Replace with useQuery against /api/v1/memory/search
  // const { data } = useQuery({
  //   queryKey: ['memory-search', searchQuery],
  //   queryFn: () => fetch(`/api/v1/memory/search?q=${searchQuery}&limit=20`).then(r => r.json()),
  //   enabled: searchQuery.length >= 2,
  // });

  const handleSearch = useCallback((q: string) => {
    setIsSearching(true);
    // Simulate brief search delay
    setTimeout(() => setIsSearching(false), 300);
  }, []);

  return {
    vitals: MOCK_VITALS,
    patterns: MOCK_PATTERNS,
    timeline: MOCK_TIMELINE,
    searchQuery,
    setSearchQuery,
    handleSearch,
    isSearching,
  };
}
