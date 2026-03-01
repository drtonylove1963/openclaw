import { useState } from 'react';
import { LayoutDashboard, Brain, GitBranch, Users, Key, Plug, Server } from 'lucide-react';
import { NeuralTabBar } from '../../components/shared';
import type { TabDef } from '../../components/shared';
import { DashboardTab, AthenaTab, GSDPipelineTab, MCPUSRTab, ServiceTokensTab, IntegrationsTab, ContainersTab } from '../../components/admin';

type TabId = 'dashboard' | 'athena' | 'gsd-pipeline' | 'mcp-usr' | 'service-tokens' | 'integrations' | 'containers';

/**
 * AdminPage - Admin Dashboard
 * Full implementation with Dashboard, Athena, GSD Pipeline, and MCP-USR tabs.
 */
export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const tabs: TabDef[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: 'athena',
      label: 'Athena',
      icon: <Brain size={16} />,
    },
    {
      id: 'gsd-pipeline',
      label: 'GSD Pipeline',
      icon: <GitBranch size={16} />,
    },
    {
      id: 'mcp-usr',
      label: 'MCP-USR',
      icon: <Users size={16} />,
    },
    {
      id: 'service-tokens',
      label: 'Service Tokens',
      icon: <Key size={16} />,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Plug size={16} />,
    },
    {
      id: 'containers',
      label: 'Containers',
      icon: <Server size={16} />,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div style={{ padding: '40px 60px 20px' }}>
        <h1
          className="ni-tricolor-text animate-neural-pulse-text"
          style={{ fontSize: '48px', fontWeight: 700, backgroundSize: '200% 100%' }}
        >
          Admin
        </h1>
        <NeuralTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />
      </div>
      <div
        className="flex-1 overflow-auto ni-scrollbar"
        style={{ padding: '0 60px 40px' }}
      >
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'athena' && <AthenaTab />}
        {activeTab === 'gsd-pipeline' && <GSDPipelineTab />}
        {activeTab === 'mcp-usr' && <MCPUSRTab />}
        {activeTab === 'service-tokens' && <ServiceTokensTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'containers' && <ContainersTab />}
      </div>
    </div>
  );
}
