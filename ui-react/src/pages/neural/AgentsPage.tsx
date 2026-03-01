import { useEffect, useState, useMemo } from 'react';
import { NeuralSearchBar, NeuralTabBar, NeuralEmptyState } from '../../components/shared';
import { AgentCard } from '../../components/agents/AgentCard';
import { AgentDetailPanel } from '../../components/agents/AgentDetailPanel';
import { AgentSkillsTab } from '../../components/agents/AgentSkillsTab';
import { AgentTeamsTab } from '../../components/agents/AgentTeamsTab';
import { TeamWorkflowsTab } from '../../components/agents/TeamWorkflowsTab';
import { AgentAnalyticsTab } from '../../components/agents/AgentAnalyticsTab';
import { SkillsImportPanel } from '../../components/agents/SkillsImportPanel';
import { useAgentsStore } from '../../stores/agentsStore';
import { Sparkles, Loader, Wrench } from 'lucide-react';
import type { TabDef } from '../../components/shared';

/**
 * AgentsPage - Agent Orchestra
 *
 * Features:
 * - Catalog tab: Grid of agent cards with search and filter
 * - Skills tab: Assign/unassign skills to agents (split layout)
 * - Teams tab: Manage agent teams with roles
 * - Workflows tab: Multi-team project orchestration
 * - Analytics tab: Agent statistics and insights
 * - Agent detail panel: Slide-out panel with full agent details
 */
export function AgentsPage() {
  const {
    agents,
    selectedAgent,
    filter,
    loading,
    error,
    loadAgents,
    loadTeams,
    loadCategories,
    selectAgent,
    setFilter,
  } = useAgentsStore();

  const [activeTab, setActiveTab] = useState('catalog');
  const [searchValue, setSearchValue] = useState('');
  const [skillsAgentId, setSkillsAgentId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadAgents();
    loadTeams();
    loadCategories();
  }, [loadAgents, loadTeams, loadCategories]);

  // Filter agents based on search and category
  const filteredAgents = useMemo(() => {
    let filtered = [...agents];

    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower) ||
          agent.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (filter.category) {
      filtered = filtered.filter(
        (agent) => agent.category.toLowerCase() === filter.category?.toLowerCase()
      );
    }

    return filtered;
  }, [agents, filter]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilter({ search: value });
  };

  const handleAgentSelect = (agentId: string) => {
    selectAgent(agentId);
  };

  const handleCloseDetail = () => {
    selectAgent(null);
  };

  const skillsSelectedAgent = useMemo(() => {
    return agents.find((a) => a.id === skillsAgentId) || null;
  }, [agents, skillsAgentId]);

  const tabs: TabDef[] = [
    { id: 'catalog', label: 'Catalog' },
    { id: 'skills', label: 'Skills' },
    { id: 'import', label: 'Import' },
    { id: 'teams', label: 'Teams' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ padding: '40px 60px 20px' }}>
        <h1
          className="ni-tricolor-text"
          style={{
            fontSize: '48px',
            fontWeight: 700,
            margin: '0 0 24px 0',
            lineHeight: 1.2,
          }}
        >
          Agent Orchestra
        </h1>

        <div style={{ marginBottom: '24px' }}>
          <NeuralSearchBar
            value={searchValue}
            onChange={handleSearch}
            onSearch={handleSearch}
            placeholder="Search agents by name, description, or category..."
          />
        </div>

        <NeuralTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 flex overflow-hidden"
        style={{ padding: '0 60px 40px' }}
      >
        {/* Catalog Tab */}
        {activeTab === 'catalog' && (
          <div className="flex-1 overflow-auto ni-scrollbar">
            {loading && (
              <div
                className="flex items-center justify-center"
                style={{ height: '400px' }}
              >
                <div className="flex items-center gap-3">
                  <Loader
                    size={24}
                    style={{ color: '#00d4ff' }}
                    className="animate-spin"
                  />
                  <span
                    style={{
                      fontSize: '16px',
                      color: '#6b7280',
                    }}
                  >
                    Loading agents...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div
                className="flex items-center justify-center"
                style={{ height: '400px' }}
              >
                <div
                  style={{
                    padding: '20px 28px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '14px',
                  }}
                >
                  Error: {error}
                </div>
              </div>
            )}

            {!loading && !error && filteredAgents.length === 0 && (
              <div
                className="flex items-center justify-center"
                style={{ height: '400px' }}
              >
                <NeuralEmptyState
                  icon={<Sparkles size={32} />}
                  title={filter.search || filter.category ? 'No Agents Found' : 'No Agents Available'}
                  description={
                    filter.search || filter.category
                      ? 'Try adjusting your search or filters.'
                      : 'Agent catalog is currently empty.'
                  }
                />
              </div>
            )}

            {!loading && !error && filteredAgents.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px',
                  alignContent: 'start',
                }}
              >
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onSelect={handleAgentSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skills Tab - Split Layout */}
        {activeTab === 'skills' && (
          <div className="flex-1 flex overflow-hidden" style={{ gap: '24px' }}>
            {/* Agent List (left) */}
            <div
              className="overflow-auto ni-scrollbar"
              style={{
                width: '320px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Select Agent ({filteredAgents.length})
              </div>
              {filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSkillsAgentId(agent.id)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: skillsAgentId === agent.id
                      ? 'rgba(0, 212, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: skillsAgentId === agent.id
                      ? '1px solid rgba(0, 212, 255, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f5' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {agent.category}
                  </div>
                </button>
              ))}
            </div>

            {/* Skills Panel (right) */}
            <div className="flex-1 overflow-auto ni-scrollbar">
              {skillsSelectedAgent ? (
                <AgentSkillsTab agent={skillsSelectedAgent} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <NeuralEmptyState
                    icon={<Wrench size={32} />}
                    title="Select an Agent"
                    description="Choose an agent from the list to manage its skills."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-auto ni-scrollbar">
            <SkillsImportPanel />
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="flex-1 overflow-hidden">
            <AgentTeamsTab />
          </div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="flex-1 overflow-hidden">
            <TeamWorkflowsTab />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-hidden">
            <AgentAnalyticsTab />
          </div>
        )}
      </div>

      {/* Agent Detail Panel */}
      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
