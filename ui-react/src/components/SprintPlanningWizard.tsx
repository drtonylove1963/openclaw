import React, { useState, useEffect } from 'react';
import { COLORS } from '../styles/colors';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';

// Types
interface TeamMember {
  id: string;
  name: string;
  role: string;
  capacity_hours: number;
  skills: string[];
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  velocity: number;
  total_capacity: number;
}

interface SprintGoal {
  description: string;
  success_criteria: string[];
  key_deliverables: string[];
}

interface SprintStory {
  id: string;
  title: string;
  story_points: number;
  priority: string;
  status: string;
  assignee: string | null;
  epic_id: string;
}

export interface SprintPlan {
  id: string;
  name: string;
  number: number;
  status: string;
  goal: SprintGoal;
  stories: SprintStory[];
  committed_points: number;
  completed_points: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  team_id: string;
  created_at: string;
}

interface SprintPlanningWizardProps {
  backlog: Record<string, any>;
  projectName: string;
  onComplete: (sprint: SprintPlan, sessionId: string) => void;
  onBack: () => void;
}

// API
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// API helper functions - now use authenticated fetch

async function createSprintPlan(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>,
  request: {
    backlog_id: string;
    backlog: Record<string, any>;
    team?: Team;
    sprint_duration_days?: number;
    velocity?: number;
    sprint_goal?: string;
  }
) {
  const response = await authenticatedFetch(`${API_BASE}/api/v1/sprint/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create sprint plan: ${response.status}`);
  }

  return response.json();
}

async function startSprint(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>,
  sessionId: string
) {
  const response = await authenticatedFetch(`${API_BASE}/api/v1/sprint/plan/${sessionId}/start`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to start sprint: ${response.status}`);
  }

  return response.json();
}

// Component
export const SprintPlanningWizard: React.FC<SprintPlanningWizardProps> = ({
  backlog,
  projectName,
  onComplete,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sprint, setSprint] = useState<SprintPlan | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [starting, setStarting] = useState(false);

  // Use authenticated fetch hook (no more localStorage token access)
  const authenticatedFetch = useAuthenticatedFetch();

  // Generate sprint plan on mount
  useEffect(() => {
    const generateSprintPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await createSprintPlan(authenticatedFetch, {
          backlog_id: backlog.id,
          backlog: backlog,
          sprint_duration_days: 14,
        });

        setSprint(result.sprint);
        setTeam(result.team);
        setSessionId(result.session_id);
        setRecommendations(result.recommendations || []);
        setRisks(result.risks || []);
        setIsReady(result.is_ready);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create sprint plan');
      } finally {
        setLoading(false);
      }
    };

    generateSprintPlan();
  }, [backlog, authenticatedFetch]);

  const handleStartSprint = async () => {
    if (!sessionId) {return;}

    try {
      setStarting(true);
      const result = await startSprint(authenticatedFetch, sessionId);
      if (sprint) {
        onComplete({ ...sprint, status: 'active' }, result.sprint_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sprint');
    } finally {
      setStarting(false);
    }
  };

  // Calculate sprint metrics
  const mustStories = sprint?.stories.filter((s) => s.priority === 'must') || [];
  const shouldStories = sprint?.stories.filter((s) => s.priority === 'should') || [];
  const couldStories = sprint?.stories.filter((s) => s.priority === 'could') || [];

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
    readyBadge: (ready: boolean) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 500,
      backgroundColor: ready ? COLORS.success + '20' : COLORS.warning + '20',
      color: ready ? COLORS.success : COLORS.warning,
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px',
    },
    card: {
      backgroundColor: COLORS.bg,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${COLORS.border}`,
      marginBottom: '16px',
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    goalBox: {
      backgroundColor: COLORS.info + '10',
      borderRadius: '8px',
      padding: '16px',
      borderLeft: `4px solid ${COLORS.info}`,
    },
    goalText: {
      fontSize: '16px',
      fontWeight: 500,
      color: COLORS.text,
      marginBottom: '12px',
    },
    deliverables: {
      listStyle: 'none' as const,
      padding: 0,
      margin: 0,
    },
    deliverable: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: COLORS.textMuted,
      marginBottom: '8px',
    },
    checkIcon: {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: COLORS.success + '20',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.success,
      fontSize: '10px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    },
    stat: {
      textAlign: 'center' as const,
      padding: '12px',
      backgroundColor: COLORS.bgPanel,
      borderRadius: '8px',
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 600,
      color: COLORS.text,
    },
    statLabel: {
      fontSize: '12px',
      color: COLORS.textDim,
      marginTop: '4px',
    },
    storyList: {
      maxHeight: '250px',
      overflow: 'auto',
    },
    storyItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      borderRadius: '6px',
      marginBottom: '8px',
      backgroundColor: COLORS.bgPanel,
    },
    storyTitle: {
      fontSize: '13px',
      color: COLORS.text,
      flex: 1,
    },
    storyPoints: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: COLORS.info + '20',
      color: COLORS.info,
      fontSize: '11px',
      fontWeight: 600,
      marginLeft: '8px',
    },
    priorityTag: (priority: string) => {
      const colors: Record<string, string> = {
        must: COLORS.error,
        should: COLORS.warning,
        could: COLORS.info,
      };
      return {
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 600,
        backgroundColor: (colors[priority] || COLORS.textDim) + '20',
        color: colors[priority] || COLORS.textDim,
        marginLeft: '8px',
      };
    },
    teamSection: {
      marginBottom: '16px',
    },
    memberList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    member: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 12px',
      borderRadius: '8px',
      backgroundColor: COLORS.bgPanel,
    },
    memberAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: COLORS.purple + '20',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.purple,
      fontWeight: 600,
      fontSize: '12px',
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: '13px',
      fontWeight: 500,
      color: COLORS.text,
    },
    memberRole: {
      fontSize: '11px',
      color: COLORS.textDim,
    },
    alertBox: (type: 'warning' | 'info') => ({
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      backgroundColor: type === 'warning' ? COLORS.warning + '10' : COLORS.info + '10',
      borderLeft: `4px solid ${type === 'warning' ? COLORS.warning : COLORS.info}`,
      fontSize: '13px',
      color: type === 'warning' ? COLORS.warning : COLORS.info,
    }),
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: `1px solid ${COLORS.border}`,
    },
    button: (primary: boolean = false, disabled: boolean = false) => ({
      padding: '12px 24px',
      borderRadius: '8px',
      border: primary ? 'none' : `1px solid ${COLORS.border}`,
      backgroundColor: primary ? (disabled ? COLORS.textDim : COLORS.success) : 'transparent',
      color: primary ? '#fff' : COLORS.textMuted,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      opacity: disabled ? 0.6 : 1,
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
      borderTop: `4px solid ${COLORS.purple}`,
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

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <div style={{ color: COLORS.textMuted }}>
            Planning sprint with Scrum Master Agent...
          </div>
          <div style={{ fontSize: '12px', color: COLORS.textDim }}>
            Calculating team velocity and selecting stories
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

  if (!sprint || !team) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>No sprint plan generated</div>
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
          <div style={styles.title}>{sprint.name}</div>
          <div style={styles.subtitle}>
            Phase 4: Sprint planning for {projectName}
          </div>
        </div>
        <div style={styles.readyBadge(isReady)}>
          {isReady ? 'Ready to Start' : 'Needs Review'}
        </div>
      </div>

      {/* Content Grid */}
      <div style={styles.grid}>
        {/* Left Column - Sprint Details */}
        <div>
          {/* Sprint Goal */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Sprint Goal</div>
            <div style={styles.goalBox}>
              <div style={styles.goalText}>{sprint.goal.description}</div>
              <ul style={styles.deliverables}>
                {sprint.goal.key_deliverables.map((deliverable, i) => (
                  <li key={i} style={styles.deliverable}>
                    <span style={styles.checkIcon}>*</span>
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sprint Stories */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              Sprint Backlog
              <span style={{ fontSize: '12px', color: COLORS.textDim, fontWeight: 400, marginLeft: '8px' }}>
                {sprint.stories.length} stories | {sprint.committed_points} points
              </span>
            </div>
            <div style={styles.storyList}>
              {sprint.stories.map((story) => (
                <div key={story.id} style={styles.storyItem}>
                  <span style={styles.storyTitle}>
                    [{story.id}] {story.title}
                  </span>
                  <span style={styles.priorityTag(story.priority)}>
                    {story.priority.toUpperCase()}
                  </span>
                  <span style={styles.storyPoints}>{story.story_points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations & Risks */}
          {(recommendations.length > 0 || risks.length > 0) && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Insights</div>
              {risks.map((risk, i) => (
                <div key={`risk-${i}`} style={styles.alertBox('warning')}>
                  {risk}
                </div>
              ))}
              {recommendations.map((rec, i) => (
                <div key={`rec-${i}`} style={styles.alertBox('info')}>
                  {rec}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Team & Stats */}
        <div>
          {/* Stats */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Sprint Metrics</div>
            <div style={styles.statsGrid}>
              <div style={styles.stat}>
                <div style={styles.statValue}>{sprint.committed_points}</div>
                <div style={styles.statLabel}>Points</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statValue}>{sprint.duration_days}</div>
                <div style={styles.statLabel}>Days</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statValue}>{team.velocity}</div>
                <div style={styles.statLabel}>Velocity</div>
              </div>
            </div>
            <div style={styles.statsGrid}>
              <div style={styles.stat}>
                <div style={{ ...styles.statValue, color: COLORS.error }}>{mustStories.length}</div>
                <div style={styles.statLabel}>Must Have</div>
              </div>
              <div style={styles.stat}>
                <div style={{ ...styles.statValue, color: COLORS.warning }}>{shouldStories.length}</div>
                <div style={styles.statLabel}>Should Have</div>
              </div>
              <div style={styles.stat}>
                <div style={{ ...styles.statValue, color: COLORS.info }}>{couldStories.length}</div>
                <div style={styles.statLabel}>Could Have</div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>{team.name}</div>
            <div style={styles.memberList}>
              {team.members.map((member) => (
                <div key={member.id} style={styles.member}>
                  <div style={styles.memberAvatar}>
                    {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={styles.memberInfo}>
                    <div style={styles.memberName}>{member.name}</div>
                    <div style={styles.memberRole}>{member.role} | {member.capacity_hours}h</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: COLORS.textDim }}>
              Total Capacity: {team.total_capacity} hours
            </div>
          </div>

          {/* Success Criteria */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Success Criteria</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {sprint.goal.success_criteria.map((criteria, i) => (
                <li key={i} style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '8px' }}>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.button()} onClick={onBack}>
          Back to Backlog
        </button>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: COLORS.textDim }}>
            {sprint.start_date.split('T')[0]} - {sprint.end_date.split('T')[0]}
          </span>
          <button
            style={styles.button(true, starting)}
            onClick={handleStartSprint}
            disabled={starting}
          >
            {starting ? 'Starting...' : 'Start Sprint'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SprintPlanningWizard;
