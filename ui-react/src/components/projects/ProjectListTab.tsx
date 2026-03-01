import { useEffect, useMemo, useState } from 'react';
import { FolderPlus, FolderOpen } from 'lucide-react';
import { useProjectsStore, type ProjectStatus } from '../../stores/projectsStore';
import { NeuralEmptyState } from '../shared';
import { ProjectCard } from './ProjectCard';
import { ProjectCreateModal } from './ProjectCreateModal';

const statusFilters: Array<{ id: ProjectStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All Projects' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'complete', label: 'Complete' },
];

/**
 * ProjectListTab - Projects list view with filtering
 *
 * Shows grid of ProjectCards with status filter chips.
 * Includes Create Project button and empty state.
 */
export function ProjectListTab() {
  const { projects, filter, loading, loadProjects, selectProject, setFilter } =
    useProjectsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter projects based on status and search
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status filter
      if (filter.status !== 'all' && project.status !== filter.status) {
        return false;
      }

      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          project.name.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.tech_stack.some((tech) => tech.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [projects, filter]);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Filter Chips + Create Button */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-shrink-0">
          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((statusFilter) => {
              const isActive = filter.status === statusFilter.id;
              return (
                <button
                  key={statusFilter.id}
                  onClick={() => setFilter({ status: statusFilter.id })}
                  className="text-[13px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: isActive
                      ? 'rgba(0, 212, 255, 0.2)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isActive
                      ? '1px solid rgba(0, 212, 255, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#00d4ff' : '#6b7280',
                  }}
                >
                  {statusFilter.label}
                </button>
              );
            })}
          </div>

          {/* Create Project Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 text-[14px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none flex-shrink-0"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'rgba(0, 212, 255, 0.2)',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              color: '#00d4ff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.25)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FolderPlus size={16} />
            <span>New Project</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto ni-scrollbar">
          {loading && projects.length === 0 ? (
            // Loading state
            <div className="flex items-center justify-center h-full">
              <span className="text-[14px]" style={{ color: '#6b7280' }}>
                Loading projects...
              </span>
            </div>
          ) : filteredProjects.length === 0 ? (
            // Empty state
            <NeuralEmptyState
              icon={<FolderOpen size={32} />}
              title={
                projects.length === 0
                  ? 'No projects yet'
                  : 'No projects match your filters'
              }
              description={
                projects.length === 0
                  ? 'Get started by creating your first project'
                  : 'Try adjusting your filters or search query'
              }
              action={
                projects.length === 0 ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 text-[14px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'rgba(0, 212, 255, 0.2)',
                      border: '1px solid rgba(0, 212, 255, 0.4)',
                      color: '#00d4ff',
                    }}
                  >
                    <FolderPlus size={16} />
                    <span>Create Project</span>
                  </button>
                ) : undefined
              }
            />
          ) : (
            // Projects Grid
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              }}
            >
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => selectProject(project)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <ProjectCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
