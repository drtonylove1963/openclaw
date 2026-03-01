import { Clock, GitBranch } from 'lucide-react';
import { type Project, type ProjectStatus } from '../../stores/projectsStore';
import { GlassCard } from '../shared';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: 'Active',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  paused: {
    label: 'Paused',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  complete: {
    label: 'Complete',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
  },
};

/**
 * ProjectCard - Individual project card in the Projects list
 *
 * Displays project info: name, description, status, tech stack, progress.
 * Click to select/view project.
 */
export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const statusStyle = statusConfig[project.status];

  // Format last modified date
  const lastModified = new Date(project.last_modified).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <GlassCard
      variant="bordered"
      hoverable
      onClick={onClick}
      className="flex flex-col h-full cursor-pointer"
      style={{ padding: '24px' }}
    >
      {/* Header: Name + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3
          className="flex-1 m-0 line-clamp-1"
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#f0f0f5',
          }}
        >
          {project.name}
        </h3>
        <span
          className="flex-shrink-0 text-[12px] font-medium"
          style={{
            padding: '4px 10px',
            borderRadius: '8px',
            background: statusStyle.bg,
            color: statusStyle.color,
            border: `1px solid ${statusStyle.color}40`,
          }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Description */}
      <p
        className="m-0 mb-4 line-clamp-2"
        style={{
          fontSize: '14px',
          color: '#6b7280',
          lineHeight: 1.5,
          minHeight: '42px',
        }}
      >
        {project.description || 'No description'}
      </p>

      {/* Tech Stack Tags */}
      {project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech_stack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-[11px] font-medium"
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(0, 212, 255, 0.1)',
                color: '#00d4ff',
                border: '1px solid rgba(0, 212, 255, 0.2)',
              }}
            >
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 4 && (
            <span
              className="text-[11px] font-medium"
              style={{
                padding: '3px 8px',
                color: '#6b7280',
              }}
            >
              +{project.tech_stack.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Git Repo (if available) */}
      {project.git_repo_url && (
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={14} style={{ color: '#6b7280' }} />
          <span
            className="text-[12px] truncate"
            style={{ color: '#6b7280' }}
          >
            {project.git_repo_url}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div
          className="relative w-full"
          style={{
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            className="absolute left-0 top-0 h-full transition-all duration-300"
            style={{
              width: `${project.progress}%`,
              background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
              borderRadius: '3px',
            }}
          />
        </div>
        <span
          className="text-[11px] mt-1 inline-block"
          style={{ color: '#6b7280' }}
        >
          {project.progress}% complete
        </span>
      </div>

      {/* Footer: Last Modified */}
      <div
        className="flex items-center gap-2 mt-auto pt-3"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <Clock size={12} style={{ color: '#6b7280' }} />
        <span className="text-[12px]" style={{ color: '#6b7280' }}>
          Updated {lastModified}
        </span>
      </div>
    </GlassCard>
  );
}
