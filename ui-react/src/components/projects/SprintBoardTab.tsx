import { useEffect, useMemo } from 'react';
import { FolderKanban } from 'lucide-react';
import {
  useSprintStore,
  type SprintColumn as ColumnType,
} from '../../stores/sprintStore';
import { useProjectsStore } from '../../stores/projectsStore';
import { NeuralEmptyState } from '../shared';
import { SprintColumn } from './SprintColumn';

const columns: Array<{ id: ColumnType; title: string }> = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'ready', title: 'Ready' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'qa', title: 'QA' },
  { id: 'done', title: 'Done' },
];

/**
 * SprintBoardTab - Kanban sprint board view
 *
 * Displays 6 columns: Backlog, Ready, In Progress, Review, QA, Done.
 * Supports drag-and-drop for moving stories between columns.
 * Requires a project to be selected.
 */
export function SprintBoardTab() {
  const { projects, selectedProject, selectProject } = useProjectsStore();
  const {
    stories,
    activeProjectId,
    loading,
    loadStories,
    moveStory,
    setDraggedStory,
    draggedStory,
  } = useSprintStore();

  // Load stories when project changes
  useEffect(() => {
    if (selectedProject?.id && selectedProject.id !== activeProjectId) {
      loadStories(selectedProject.id);
    }
  }, [selectedProject, activeProjectId, loadStories]);

  // Group stories by column
  const storiesByColumn = useMemo(() => {
    const grouped: Record<ColumnType, typeof stories> = {
      backlog: [],
      ready: [],
      in_progress: [],
      review: [],
      qa: [],
      done: [],
    };

    stories.forEach((story) => {
      grouped[story.column].push(story);
    });

    return grouped;
  }, [stories]);

  const handleDrop = async (toColumn: ColumnType) => {
    if (!draggedStory) {return;}

    const fromColumn = draggedStory.column;
    if (fromColumn === toColumn) {return;}

    await moveStory(draggedStory.id, fromColumn, toColumn);
    setDraggedStory(null);
  };

  // If no project selected, show empty state
  if (!selectedProject) {
    return (
      <NeuralEmptyState
        icon={<FolderKanban size={32} />}
        title="No project selected"
        description="Select a project from the dropdown to view its sprint board"
        action={
          projects.length > 0 ? (
            <div className="flex flex-col gap-3">
              <span className="text-[13px]" style={{ color: '#6b7280' }}>
                Quick select:
              </span>
              <div className="flex gap-2 flex-wrap justify-center">
                {projects.slice(0, 3).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => selectProject(project)}
                    className="text-[13px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: 'rgba(0, 212, 255, 0.15)',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      color: '#00d4ff',
                    }}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project Selector Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium" style={{ color: '#f0f0f5' }}>
            Project:
          </span>
          <select
            value={selectedProject.id}
            onChange={(e) => {
              const project = projects.find((p) => p.id === e.target.value);
              selectProject(project || null);
            }}
            className="text-[14px] font-medium outline-none cursor-pointer transition-all duration-200"
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f0f0f5',
            }}
          >
            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
                style={{ background: '#0f0f19', color: '#f0f0f5' }}
              >
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Story Count */}
        <div className="text-[13px]" style={{ color: '#6b7280' }}>
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </div>
      </div>

      {/* Sprint Board */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[14px]" style={{ color: '#6b7280' }}>
              Loading sprint board...
            </span>
          </div>
        ) : (
          <div className="flex gap-4 h-full overflow-x-auto overflow-y-hidden ni-scrollbar pb-4">
            {columns.map((col) => (
              <SprintColumn
                key={col.id}
                column={col.id}
                title={col.title}
                stories={storiesByColumn[col.id]}
                onDrop={handleDrop}
                onDragStart={setDraggedStory}
                onDragEnd={() => setDraggedStory(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
