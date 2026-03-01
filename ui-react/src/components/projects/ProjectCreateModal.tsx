import { useState } from 'react';
import { NeuralModal, NeuralButton } from '../shared';
import { useProjectsStore } from '../../stores/projectsStore';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProjectCreateModal - Modal for creating new projects
 *
 * Form fields: name, description, tech stack, git repo URL.
 * Calls POST /api/v1/projects on submit.
 */
export function ProjectCreateModal({ isOpen, onClose }: ProjectCreateModalProps) {
  const createProject = useProjectsStore((state) => state.createProject);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tech_stack: '',
    git_repo_url: '',
    status: 'active' as const,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Parse tech stack (comma-separated)
      const tech_stack = formData.tech_stack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        tech_stack,
        git_repo_url: formData.git_repo_url.trim() || undefined,
        status: formData.status,
      });

      // Reset form and close
      setFormData({
        name: '',
        description: '',
        tech_stack: '',
        git_repo_url: '',
        status: 'active',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        name: '',
        description: '',
        tech_stack: '',
        git_repo_url: '',
        status: 'active',
      });
      setError(null);
      onClose();
    }
  };

  return (
    <NeuralModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      maxWidth="600px"
      footer={
        <>
          <NeuralButton variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </NeuralButton>
          <NeuralButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Project'}
          </NeuralButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Error Display */}
        {error && (
          <div
            className="text-[14px]"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        {/* Project Name */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="project-name"
            className="text-[14px] font-medium"
            style={{ color: '#f0f0f5' }}
          >
            Project Name *
          </label>
          <input
            id="project-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., My Awesome App"
            className="w-full text-[14px] outline-none transition-all duration-200"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f0f0f5',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="project-desc"
            className="text-[14px] font-medium"
            style={{ color: '#f0f0f5' }}
          >
            Description
          </label>
          <textarea
            id="project-desc"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief project description..."
            rows={3}
            className="w-full text-[14px] outline-none transition-all duration-200 resize-none ni-scrollbar"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f0f0f5',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          />
        </div>

        {/* Tech Stack */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="project-tech"
            className="text-[14px] font-medium"
            style={{ color: '#f0f0f5' }}
          >
            Tech Stack
          </label>
          <input
            id="project-tech"
            type="text"
            value={formData.tech_stack}
            onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
            placeholder="React, Node.js, PostgreSQL (comma-separated)"
            className="w-full text-[14px] outline-none transition-all duration-200"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f0f0f5',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          />
          <span className="text-[12px]" style={{ color: '#6b7280' }}>
            Enter technologies separated by commas
          </span>
        </div>

        {/* Git Repo URL */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="project-git"
            className="text-[14px] font-medium"
            style={{ color: '#f0f0f5' }}
          >
            Git Repository URL (Optional)
          </label>
          <input
            id="project-git"
            type="url"
            value={formData.git_repo_url}
            onChange={(e) => setFormData({ ...formData, git_repo_url: e.target.value })}
            placeholder="https://github.com/username/repo"
            className="w-full text-[14px] outline-none transition-all duration-200"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f0f0f5',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          />
        </div>
      </div>
    </NeuralModal>
  );
}
