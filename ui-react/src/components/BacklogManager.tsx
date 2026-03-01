import React, { useState, useEffect, useCallback } from 'react';
import { COLORS } from '../styles/colors';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';

// Types
interface Epic {
  id: string;
  title: string;
  description: string;
  bounded_context: string;
  priority: string;
  business_value: string;
  stories: string[];
  status: string;
}

interface UserStory {
  id: string;
  epic_id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  story_points: number;
  priority: 'must' | 'should' | 'could' | 'wont';
  story_type: 'feature' | 'bug' | 'tech_debt' | 'spike' | 'enabler';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  dependencies: string[];
  bounded_context: string;
  assignee: string | null;
  labels: string[];
}

interface INVESTValidation {
  is_valid: boolean;
  criteria: Record<string, boolean>;
  issues: string[];
  suggestions: string[];
}

export interface ProductBacklog {
  id: string;
  project_name: string;
  epics: Epic[];
  stories: UserStory[];
  total_points: number;
  invest_valid_count: number;
  invest_invalid_count: number;
  created_at: string;
}

interface BacklogManagerProps {
  architecture: Record<string, any>;
  projectName: string;
  onComplete: (backlog: ProductBacklog, sessionId: string) => void;
  onBack: () => void;
}

// API
const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function createBacklog(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>,
  request: {
    architecture_id: string;
    architecture: Record<string, any>;
    bounded_contexts: string[];
    requirements?: Record<string, any>;
  }
) {
  const response = await authenticatedFetch(`${API_BASE}/api/v1/backlog/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create backlog: ${response.status}`);
  }

  return response.json();
}

async function validateStory(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>,
  sessionId: string,
  storyId: string,
  autoFix: boolean = true
) {
  const response = await authenticatedFetch(`${API_BASE}/api/v1/backlog/${sessionId}/stories/${storyId}/validate?auto_fix=${autoFix}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to validate story: ${response.status}`);
  }

  return response.json();
}

async function prioritizeBacklog(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>,
  sessionId: string,
  method: string = 'wsjf'
) {
  const response = await authenticatedFetch(`${API_BASE}/api/v1/backlog/${sessionId}/prioritize?method=${method}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to prioritize: ${response.status}`);
  }

  return response.json();
}

// Component
export const BacklogManager: React.FC<BacklogManagerProps> = ({
  architecture,
  projectName,
  onComplete,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backlog, setBacklog] = useState<ProductBacklog | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<Record<string, any> | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [storyValidation, setStoryValidation] = useState<Record<string, INVESTValidation>>({});

  // Use authenticated fetch hook (no more localStorage token access)
  const authenticatedFetch = useAuthenticatedFetch();

  // Generate backlog on mount
  useEffect(() => {
    const generateBacklog = async () => {
      try {
        setLoading(true);
        setError(null);

        const boundedContexts = architecture.bounded_contexts?.map((ctx: any) => ctx.name) || [];

        const result = await createBacklog(authenticatedFetch, {
          architecture_id: architecture.id,
          architecture,
          bounded_contexts: boundedContexts,
        });

        setBacklog(result.backlog);
        setSessionId(result.session_id);
        setValidationSummary(result.validation_summary);

        if (result.backlog.epics.length > 0) {
          setSelectedEpic(result.backlog.epics[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate backlog');
      } finally {
        setLoading(false);
      }
    };

    generateBacklog();
  }, [architecture, authenticatedFetch]);

  const handleValidateStory = async (storyId: string) => {
    if (!sessionId) {return;}

    try {
      const result = await validateStory(authenticatedFetch, sessionId, storyId);
      setStoryValidation((prev) => ({
        ...prev,
        [storyId]: result.validation,
      }));

      // Update story if auto-fixed
      if (result.auto_fixed && result.updated_story && backlog) {
        setBacklog({
          ...backlog,
          stories: backlog.stories.map((s) =>
            s.id === storyId ? result.updated_story : s
          ),
        });
      }
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  const handlePrioritize = async (method: string) => {
    if (!sessionId) {return;}

    try {
      const result = await prioritizeBacklog(authenticatedFetch, sessionId, method);
      if (backlog) {
        setBacklog({
          ...backlog,
          stories: result.stories,
        });
      }
    } catch (err) {
      console.error('Prioritization failed:', err);
    }
  };

  const handleContinue = () => {
    if (backlog && sessionId) {
      onComplete(backlog, sessionId);
    }
  };

  const filteredStories = backlog?.stories.filter(
    (s) => !selectedEpic || s.epic_id === selectedEpic
  ) || [];

  // Styles
  const styles = {
    container: {
      backgroundColor: COLORS.bgAlt,
      borderRadius: '12px',
      padding: '24px',
      minHeight: '500px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      color: COLORS.text,
    },
    subtitle: {
      fontSize: '14px',
      color: COLORS.textMuted,
      marginTop: '4px',
    },
    stats: {
      display: 'flex',
      gap: '16px',
    },
    stat: {
      padding: '8px 16px',
      borderRadius: '8px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
    },
    statValue: {
      fontSize: '20px',
      fontWeight: 600,
      color: COLORS.text,
    },
    statLabel: {
      fontSize: '12px',
      color: COLORS.textDim,
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gap: '24px',
      minHeight: '400px',
    },
    sidebar: {
      borderRight: `1px solid ${COLORS.border}`,
      paddingRight: '24px',
    },
    sidebarTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.textDim,
      marginBottom: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    epicItem: (selected: boolean) => ({
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'pointer',
      backgroundColor: selected ? COLORS.info + '20' : COLORS.bg,
      border: `1px solid ${selected ? COLORS.info : COLORS.border}`,
      transition: 'all 0.2s',
    }),
    epicTitle: {
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.text,
      marginBottom: '4px',
    },
    epicMeta: {
      fontSize: '12px',
      color: COLORS.textDim,
    },
    main: {
      overflow: 'auto',
    },
    toolbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    priorityButtons: {
      display: 'flex',
      gap: '8px',
    },
    priorityButton: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: `1px solid ${COLORS.border}`,
      backgroundColor: 'transparent',
      color: COLORS.textMuted,
      fontSize: '12px',
      cursor: 'pointer',
    },
    storyCard: {
      backgroundColor: COLORS.bg,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      border: `1px solid ${COLORS.border}`,
    },
    storyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px',
    },
    storyTitle: {
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.text,
    },
    storyPoints: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: COLORS.info + '20',
      color: COLORS.info,
      fontSize: '12px',
      fontWeight: 600,
    },
    storyDescription: {
      fontSize: '13px',
      color: COLORS.textMuted,
      marginBottom: '12px',
      lineHeight: 1.5,
    },
    storyMeta: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
    },
    tag: (color: string) => ({
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      backgroundColor: color + '20',
      color: color,
    }),
    validation: (valid: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      color: valid ? COLORS.success : COLORS.warning,
    }),
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: `1px solid ${COLORS.border}`,
    },
    button: (primary: boolean = false) => ({
      padding: '12px 24px',
      borderRadius: '8px',
      border: primary ? 'none' : `1px solid ${COLORS.border}`,
      backgroundColor: primary ? COLORS.info : 'transparent',
      color: primary ? '#fff' : COLORS.textMuted,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    }),
    loading: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      gap: '16px',
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: `4px solid ${COLORS.border}`,
      borderTop: `4px solid ${COLORS.success}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    error: {
      backgroundColor: COLORS.error + '10',
      color: COLORS.error,
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px',
    },
  };

  const priorityColors: Record<string, string> = {
    must: COLORS.error,
    should: COLORS.warning,
    could: COLORS.info,
    wont: COLORS.textDim,
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <div style={{ color: COLORS.textMuted }}>
            Creating product backlog with Product Owner Agent...
          </div>
          <div style={{ fontSize: '12px', color: COLORS.textDim }}>
            Generating epics, user stories, and acceptance criteria
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button style={styles.button()} onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  if (!backlog) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>No backlog generated</div>
        <button style={styles.button()} onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Product Backlog</div>
          <div style={styles.subtitle}>
            Phase 3: User stories and epics for {projectName}
          </div>
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{backlog.total_points}</div>
            <div style={styles.statLabel}>Total Points</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{backlog.stories.length}</div>
            <div style={styles.statLabel}>Stories</div>
          </div>
          <div style={styles.stat}>
            <div style={{ ...styles.statValue, color: COLORS.success }}>
              {validationSummary?.pass_rate || 0}%
            </div>
            <div style={styles.statLabel}>INVEST Valid</div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={styles.layout}>
        {/* Sidebar - Epics */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Epics</div>
          <div
            style={styles.epicItem(!selectedEpic)}
            onClick={() => setSelectedEpic(null)}
          >
            <div style={styles.epicTitle}>All Stories</div>
            <div style={styles.epicMeta}>{backlog.stories.length} stories</div>
          </div>
          {backlog.epics.map((epic) => (
            <div
              key={epic.id}
              style={styles.epicItem(selectedEpic === epic.id)}
              onClick={() => setSelectedEpic(epic.id)}
            >
              <div style={styles.epicTitle}>{epic.title}</div>
              <div style={styles.epicMeta}>
                {epic.stories.length} stories | {epic.priority}
              </div>
            </div>
          ))}
        </div>

        {/* Main - Stories */}
        <div style={styles.main}>
          <div style={styles.toolbar}>
            <div style={{ fontSize: '14px', color: COLORS.textDim }}>
              Showing {filteredStories.length} stories
            </div>
            <div style={styles.priorityButtons}>
              <button
                style={styles.priorityButton}
                onClick={() => handlePrioritize('wsjf')}
              >
                WSJF Sort
              </button>
              <button
                style={styles.priorityButton}
                onClick={() => handlePrioritize('moscow')}
              >
                MoSCoW Sort
              </button>
            </div>
          </div>

          {filteredStories.map((story) => {
            const validation = storyValidation[story.id];
            return (
              <div key={story.id} style={styles.storyCard}>
                <div style={styles.storyHeader}>
                  <div style={styles.storyTitle}>
                    [{story.id}] {story.title}
                  </div>
                  <div style={styles.storyPoints}>{story.story_points}</div>
                </div>
                <div style={styles.storyDescription}>{story.description}</div>
                <div style={styles.storyMeta}>
                  <span style={styles.tag(priorityColors[story.priority])}>
                    {story.priority.toUpperCase()}
                  </span>
                  <span style={styles.tag(COLORS.purple)}>
                    {story.story_type}
                  </span>
                  {validation ? (
                    <span style={styles.validation(validation.is_valid)}>
                      {validation.is_valid ? 'INVEST Valid' : `${validation.issues.length} issues`}
                    </span>
                  ) : (
                    <button
                      style={{ ...styles.priorityButton, padding: '2px 8px' }}
                      onClick={() => handleValidateStory(story.id)}
                    >
                      Validate
                    </button>
                  )}
                </div>
                {story.acceptance_criteria.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textDim, marginBottom: '8px' }}>
                      Acceptance Criteria:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {story.acceptance_criteria.slice(0, 3).map((ac, i) => (
                        <li key={i} style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px' }}>
                          {ac}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.button()} onClick={onBack}>
          Back to Architecture
        </button>
        <button style={styles.button(true)} onClick={handleContinue}>
          Continue to Sprint Planning
        </button>
      </div>
    </div>
  );
};

export default BacklogManager;
