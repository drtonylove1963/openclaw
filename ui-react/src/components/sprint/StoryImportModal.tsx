/**
 * Story Import Modal - Preview and confirm stories from Requirements Studio
 *
 * Shows parsed stories with:
 * - Editable story details (title, points, priority, agent)
 * - Warnings and suggestions from the parser
 * - Confirm/cancel actions
 */

import React, { useState, useEffect } from 'react';
import { THEME } from '../../styles/theme';

interface ParsedStory {
  story_id: string;
  title: string;
  description?: string;
  story_points: number;
  priority: string;
  labels: string[];
  suggested_agent?: string;
  acceptance_criteria?: string[];
  estimated_hours?: number;
}

interface ImportPreview {
  epic_title: string;
  total_points: number;
  estimated_sprints: number;
  source_type: string;
  warnings: string[];
  suggestions: string[];
  stories: ParsedStory[];
}

interface StoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importContext: {
    conversationId?: string;
    projectId?: string;
    projectName?: string;
    messages: any[];
  } | null;
  onImportComplete?: (sprintId: string) => void;
}

// Priority options with colors
const PRIORITIES = [
  { value: 'critical', label: 'Critical', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'low', label: 'Low', color: '#6b7280' },
];

// Agent options (subset of available agents)
const AGENTS = [
  { value: 'developer-agent', label: 'Developer Agent' },
  { value: 'frontend-developer', label: 'Frontend Developer' },
  { value: 'backend-architect', label: 'Backend Architect' },
  { value: 'database-architect', label: 'Database Architect' },
  { value: 'test-engineer', label: 'Test Engineer' },
  { value: 'security-engineer', label: 'Security Engineer' },
  { value: 'devops-engineer', label: 'DevOps Engineer' },
  { value: 'ui-ux-designer', label: 'UI/UX Designer' },
];

export function StoryImportModal({
  isOpen,
  onClose,
  importContext,
  onImportComplete,
}: StoryImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [editedStories, setEditedStories] = useState<ParsedStory[]>([]);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [sprintName, setSprintName] = useState('');
  const [importing, setImporting] = useState(false);

  // Fetch preview when modal opens
  useEffect(() => {
    if (isOpen && importContext) {
      fetchPreview();
    }
  }, [isOpen, importContext]);

  const fetchPreview = async () => {
    if (!importContext) {return;}

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/sprint/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: importContext.conversationId,
          messages: importContext.messages,
          project_name: importContext.projectName,
          project_id: importContext.projectId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Preview failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.preview) {
        setPreview(data.preview);
        setEditedStories(data.preview.stories);
        setSelectedStories(new Set(data.preview.stories.map((s: ParsedStory) => s.story_id)));
        setSprintName(importContext.projectName || data.preview.epic_title || 'Sprint 1');
      } else {
        setError('No stories found in conversation. Try generating USER-STORIES.md first.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview stories');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryChange = (storyId: string, field: string, value: any) => {
    setEditedStories(stories =>
      stories.map(s =>
        s.story_id === storyId ? { ...s, [field]: value } : s
      )
    );
  };

  const toggleStorySelection = (storyId: string) => {
    setSelectedStories(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedStories(new Set(editedStories.map(s => s.story_id)));
  };

  const selectNone = () => {
    setSelectedStories(new Set());
  };

  const handleImport = async () => {
    const storiesToImport = editedStories.filter(s => selectedStories.has(s.story_id));
    if (storiesToImport.length === 0) {
      setError('No stories selected for import');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/sprint/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stories: storiesToImport,
          sprint_name: sprintName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        onImportComplete?.(data.sprint_id);
        onClose();
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import stories');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) {return null;}

  const selectedCount = selectedStories.size;
  const totalSelectedPoints = editedStories
    .filter(s => selectedStories.has(s.story_id))
    .reduce((sum, s) => sum + s.story_points, 0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: THEME.bgElevated,
          borderRadius: THEME.radius.lg,
          border: `1px solid ${THEME.border}`,
          width: '90%',
          maxWidth: '900px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${THEME.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: THEME.text }}>
                Import Stories to Sprint Board
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: THEME.textMuted }}>
                Review and confirm stories from Requirements Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: THEME.radius.sm,
              cursor: 'pointer',
              color: THEME.textMuted,
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: THEME.textMuted }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
              Analyzing conversation for stories...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: THEME.radius.md,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {!loading && preview && (
            <>
              {/* Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <SummaryCard label="Epic" value={preview.epic_title} />
                <SummaryCard label="Stories" value={String(preview.stories.length)} />
                <SummaryCard label="Total Points" value={String(preview.total_points)} />
                <SummaryCard label="Est. Sprints" value={String(preview.estimated_sprints)} />
              </div>

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: THEME.radius.md,
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ color: '#f59e0b', fontWeight: 500, marginBottom: '8px' }}>
                    ⚠️ Warnings
                  </div>
                  {preview.warnings.map((w, i) => (
                    <div key={i} style={{ color: THEME.textMuted, fontSize: '13px' }}>
                      • {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {preview.suggestions.length > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: THEME.radius.md,
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ color: '#3b82f6', fontWeight: 500, marginBottom: '8px' }}>
                    💡 Suggestions
                  </div>
                  {preview.suggestions.map((s, i) => (
                    <div key={i} style={{ color: THEME.textMuted, fontSize: '13px' }}>
                      • {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Sprint Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: THEME.textMuted, marginBottom: '6px' }}>
                  Sprint Name
                </label>
                <input
                  type="text"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: THEME.bgMuted,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: THEME.radius.md,
                    color: THEME.text,
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Selection Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: THEME.text }}>
                    Stories ({selectedCount} selected, {totalSelectedPoints} pts)
                  </span>
                  <button
                    onClick={selectAll}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: THEME.primary,
                      backgroundColor: 'transparent',
                      border: `1px solid ${THEME.primary}`,
                      borderRadius: THEME.radius.sm,
                      cursor: 'pointer',
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={selectNone}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: THEME.textMuted,
                      backgroundColor: 'transparent',
                      border: `1px solid ${THEME.border}`,
                      borderRadius: THEME.radius.sm,
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Stories List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editedStories.map((story) => (
                  <StoryRow
                    key={story.story_id}
                    story={story}
                    selected={selectedStories.has(story.story_id)}
                    onToggle={() => toggleStorySelection(story.story_id)}
                    onChange={(field, value) => handleStoryChange(story.story_id, field, value)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${THEME.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '13px', color: THEME.textMuted }}>
            {selectedCount > 0
              ? `${selectedCount} stories (${totalSelectedPoints} points) will be imported`
              : 'Select stories to import'}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: THEME.textSecondary,
                backgroundColor: 'transparent',
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.radius.md,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0 || importing}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: selectedCount === 0 ? THEME.borderFocus : '#10b981',
                border: 'none',
                borderRadius: THEME.radius.md,
                cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                opacity: importing ? 0.7 : 1,
              }}
            >
              {importing ? 'Importing...' : `Import ${selectedCount} Stories`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: THEME.bgMuted,
        borderRadius: THEME.radius.md,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <div style={{ fontSize: '11px', color: THEME.textMuted, marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: THEME.text }}>
        {value}
      </div>
    </div>
  );
}

// Story Row Component
function StoryRow({
  story,
  selected,
  onToggle,
  onChange,
}: {
  story: ParsedStory;
  selected: boolean;
  onToggle: () => void;
  onChange: (field: string, value: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const priorityColor = PRIORITIES.find(p => p.value === story.priority)?.color || THEME.textMuted;

  return (
    <div
      style={{
        backgroundColor: selected ? 'rgba(16, 185, 129, 0.05)' : THEME.bgMuted,
        border: `1px solid ${selected ? 'rgba(16, 185, 129, 0.3)' : THEME.border}`,
        borderRadius: THEME.radius.md,
        overflow: 'hidden',
      }}
    >
      {/* Main Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
        }}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />

        {/* Story ID */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: THEME.primary,
            fontFamily: 'monospace',
            minWidth: '80px',
          }}
        >
          {story.story_id}
        </span>

        {/* Title */}
        <input
          type="text"
          value={story.title}
          onChange={(e) => onChange('title', e.target.value)}
          style={{
            flex: 1,
            padding: '6px 8px',
            backgroundColor: 'transparent',
            border: `1px solid ${THEME.border}`,
            borderRadius: THEME.radius.sm,
            color: THEME.text,
            fontSize: '13px',
          }}
        />

        {/* Points */}
        <select
          value={story.story_points}
          onChange={(e) => onChange('story_points', parseInt(e.target.value))}
          style={{
            padding: '6px 8px',
            backgroundColor: THEME.bgHover,
            border: `1px solid ${THEME.border}`,
            borderRadius: THEME.radius.sm,
            color: THEME.text,
            fontSize: '12px',
            minWidth: '60px',
          }}
        >
          {[1, 2, 3, 5, 8, 13, 21].map(p => (
            <option key={p} value={p}>{p} pts</option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={story.priority}
          onChange={(e) => onChange('priority', e.target.value)}
          style={{
            padding: '6px 8px',
            backgroundColor: `${priorityColor}15`,
            border: `1px solid ${priorityColor}40`,
            borderRadius: THEME.radius.sm,
            color: priorityColor,
            fontSize: '12px',
            fontWeight: 500,
            minWidth: '80px',
          }}
        >
          {PRIORITIES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: THEME.textMuted,
            fontSize: '16px',
          }}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${THEME.border}`,
            backgroundColor: THEME.bg,
          }}
        >
          {/* Agent */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: THEME.textMuted, marginBottom: '4px' }}>
              Suggested Agent
            </label>
            <select
              value={story.suggested_agent || 'developer-agent'}
              onChange={(e) => onChange('suggested_agent', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: THEME.bgMuted,
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.radius.sm,
                color: THEME.text,
                fontSize: '13px',
              }}
            >
              {AGENTS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: THEME.textMuted, marginBottom: '4px' }}>
              Labels
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {story.labels.map((label, i) => (
                <span
                  key={i}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    backgroundColor: THEME.primaryMuted,
                    color: THEME.primary,
                    borderRadius: THEME.radius.sm,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          {story.description && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: THEME.textMuted, marginBottom: '4px' }}>
                Description
              </label>
              <div style={{ fontSize: '13px', color: THEME.textSecondary }}>
                {story.description}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StoryImportModal;
