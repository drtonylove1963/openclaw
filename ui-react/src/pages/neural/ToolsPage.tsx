import { useState } from 'react';
import { Wrench, Globe, Code } from 'lucide-react';
import { NeuralTabBar } from '../../components/shared';
import { MCPToolsTab } from '../../components/tools/MCPToolsTab';
import { WebScraperTab } from '../../components/tools/WebScraperTab';
import { EditorTab } from '../../components/tools/EditorTab';

type TabId = 'mcp-tools' | 'web-scraper' | 'editor';

/**
 * ToolsPage - MCP Tools + Web Scraper + Editor
 * Phase 6 implementation with Neural Interface design.
 */
export function ToolsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('mcp-tools');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ padding: '40px 60px 20px' }}>
        <h1
          className="ni-tricolor-text animate-neural-pulse-text"
          style={{ fontSize: '48px', fontWeight: 700, backgroundSize: '200% 100%' }}
        >
          Tools
        </h1>
        <NeuralTabBar
          tabs={[
            { id: 'mcp-tools', label: 'MCP Tools', icon: <Wrench size={16} /> },
            { id: 'web-scraper', label: 'Web Scraper', icon: <Globe size={16} /> },
            { id: 'editor', label: 'Editor', icon: <Code size={16} /> },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mt-6"
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex overflow-hidden" style={{ padding: '0 60px 40px' }}>
        {activeTab === 'mcp-tools' && <MCPToolsTab />}
        {activeTab === 'web-scraper' && <WebScraperTab />}
        {activeTab === 'editor' && <EditorTab />}
      </div>
    </div>
  );
}
