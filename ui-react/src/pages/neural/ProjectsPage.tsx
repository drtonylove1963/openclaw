import { FolderKanban, Columns } from 'lucide-react';
import { useProjectsStore } from '../../stores/projectsStore';
import { NeuralTabBar } from '../../components/shared';
import { ProjectListTab } from '../../components/projects/ProjectListTab';
import { SprintBoardTab } from '../../components/projects/SprintBoardTab';

/**
 * ProjectsPage - Projects + Sprint Board
 *
 * Two tabs:
 * 1. Projects - Grid view of all projects with filtering
 * 2. Sprint Board - Kanban board for selected project
 */
export function ProjectsPage() {
  const { activeTab, setActiveTab } = useProjectsStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div style={{ padding: '40px 60px 20px' }}>
        <h1
          className="ni-tricolor-text animate-neural-pulse-text"
          style={{ fontSize: '48px', fontWeight: 700, backgroundSize: '200% 100%' }}
        >
          Projects
        </h1>

        {/* Tab Navigation */}
        <div style={{ marginTop: '24px' }}>
          <NeuralTabBar
            tabs={[
              {
                id: 'projects',
                label: 'Projects',
                icon: <FolderKanban size={16} />,
              },
              {
                id: 'sprint-board',
                label: 'Sprint Board',
                icon: <Columns size={16} />,
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex overflow-hidden" style={{ padding: '0 60px 40px' }}>
        {activeTab === 'projects' ? <ProjectListTab /> : <SprintBoardTab />}
      </div>
    </div>
  );
}
