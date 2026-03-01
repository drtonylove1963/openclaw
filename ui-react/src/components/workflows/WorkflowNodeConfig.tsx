/**
 * WorkflowNodeConfig - Right sidebar showing workflow configuration
 * Features:
 * - Edit workflow metadata (name, description, tags)
 * - Schedule configuration
 * - Webhook URL
 * - Save changes
 * - Collapsible panel
 */

import { useState, useEffect } from 'react';
import { Save, ChevronRight, ChevronLeft, Settings } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { GlassCard } from '../shared/GlassCard';

export function WorkflowNodeConfig() {
  const { selectedWorkflow, updateWorkflow } = useWorkflowStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Local form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    schedule: '',
    webhookUrl: '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Sync form data with selected workflow
  useEffect(() => {
    if (selectedWorkflow) {
      setFormData({
        name: selectedWorkflow.name,
        description: selectedWorkflow.description,
        tags: selectedWorkflow.tags || [],
        schedule: selectedWorkflow.schedule || 'manual',
        webhookUrl: selectedWorkflow.webhookUrl || '',
      });
      setHasChanges(false);
    }
  }, [selectedWorkflow]);

  // Handle input change
  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle tag input
  const handleTagInput = (value: string) => {
    const tags = value.split(',').map((t) => t.trim()).filter(Boolean);
    handleChange('tags', tags);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedWorkflow) {return;}

    await updateWorkflow(selectedWorkflow.id, {
      name: formData.name,
      description: formData.description,
      tags: formData.tags,
      schedule: formData.schedule,
      webhookUrl: formData.webhookUrl,
    });

    setHasChanges(false);
  };

  if (isCollapsed) {
    return (
      <div
        className="flex-shrink-0 flex flex-col items-center"
        style={{
          width: '60px',
          gap: '12px',
          paddingLeft: '20px',
        }}
      >
        <GlassCard
          variant="bordered"
          className="w-full flex items-center justify-center cursor-pointer"
          style={{ padding: '12px' }}
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronLeft size={20} style={{ color: '#6b7280' }} />
        </GlassCard>
        <div className="flex-1 flex items-center justify-center">
          <Settings size={20} style={{ color: '#6b7280' }} />
        </div>
      </div>
    );
  }

  if (!selectedWorkflow) {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: '320px',
          paddingLeft: '20px',
        }}
      >
        <GlassCard variant="bordered" className="w-full" style={{ padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Select a workflow to configure
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        width: '320px',
        gap: '12px',
        paddingLeft: '20px',
      }}
    >
      {/* Header */}
      <GlassCard variant="bordered" style={{ padding: '20px' }}>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f0f0f5', margin: 0 }}>
            Configuration
          </h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center justify-center transition-colors duration-200 border-0 outline-none cursor-pointer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#6b7280',
            }}
            aria-label="Collapse panel"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </GlassCard>

      {/* Config Form */}
      <div
        className="flex-1 overflow-auto ni-scrollbar"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <GlassCard variant="bordered" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label
                htmlFor="workflow-name"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Name
              </label>
              <input
                id="workflow-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full border-0 outline-none"
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#f0f0f5',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="workflow-description"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Description
              </label>
              <textarea
                id="workflow-description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full border-0 outline-none resize-none ni-scrollbar"
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#f0f0f5',
                }}
              />
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="workflow-tags"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Tags
              </label>
              <input
                id="workflow-tags"
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full border-0 outline-none"
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#f0f0f5',
                }}
              />
              <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Separate tags with commas
              </span>
            </div>

            {/* Schedule */}
            <div>
              <label
                htmlFor="workflow-schedule"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Schedule
              </label>
              <input
                id="workflow-schedule"
                type="text"
                value={formData.schedule}
                onChange={(e) => handleChange('schedule', e.target.value)}
                placeholder="manual or cron expression"
                className="w-full border-0 outline-none"
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#f0f0f5',
                  fontFamily: 'monospace',
                }}
              />
              <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Use &apos;manual&apos; or cron syntax (e.g., &apos;0 9 * * *&apos;)
              </span>
            </div>

            {/* Webhook URL */}
            <div>
              <label
                htmlFor="workflow-webhook"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Webhook URL
              </label>
              <input
                id="workflow-webhook"
                type="text"
                value={formData.webhookUrl}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                placeholder="https://..."
                className="w-full border-0 outline-none"
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#f0f0f5',
                  fontFamily: 'monospace',
                }}
              />
              <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Optional webhook trigger URL
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <GlassCard variant="highlighted" glowColor="#10b981" style={{ padding: '16px' }}>
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 transition-all duration-200 border-0 outline-none cursor-pointer"
            style={{
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
            }}
          >
            <Save size={16} />
            Save Changes
          </button>
        </GlassCard>
      )}
    </div>
  );
}
