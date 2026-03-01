import { useBuildStore } from '../../stores/buildStore';
import { NeuralTabBar } from '../../components/shared';
import { OneShotTab } from '../../components/build/OneShotTab';
import { CodeIDETab } from '../../components/build/CodeIDETab';
import { Zap, Code } from 'lucide-react';

/**
 * BuildPage - Ex Nihilo Builder
 *
 * Features:
 * - One-Shot generation tab
 * - Code IDE tab
 * - Neural interface design system
 */
export function BuildPage() {
  const { activeTab, setActiveTab } = useBuildStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ padding: '40px 60px 20px' }}>
        <h1 className="ni-tricolor-text" style={{ fontSize: '48px', fontWeight: 700, margin: 0, marginBottom: '24px' }}>
          Ex Nihilo Builder
        </h1>
        <NeuralTabBar
          tabs={[
            { id: 'oneshot', label: 'One-Shot', icon: <Zap size={16} /> },
            { id: 'code-ide', label: 'Code IDE', icon: <Code size={16} /> },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden" style={{ padding: '0 60px 40px' }}>
        {activeTab === 'oneshot' ? <OneShotTab /> : <CodeIDETab />}
      </div>
    </div>
  );
}
