/**
 * ProjectCreationWizard - Main orchestrator for enhanced project creation
 *
 * This component integrates the full BMAD/Ex Nihilo workflow in logical order:
 * 1. Intent Capture - Strategic questioning with BMAD methodology (BA Agent)
 * 2. Stack Selection - Technology choices that inform architecture
 * 3. Theme Design - Visual identity before architecture (Design Differentiation)
 * 4. Architecture - System design based on stack and theme requirements
 * 5. Backlog - Epic and user story creation (Product Owner Agent)
 * 6. Sprint Planning - Sprint setup and story selection (Scrum Master Agent)
 * 7. Execution Mode - Choose between OneShot (automated) or Arena (parallel tracks)
 * 8. Progress Panel - Real-time updates during project generation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import IntentCaptureWizard, { TaskSpec } from './IntentCaptureWizard';
import StackBuilderWizard, { StackOption } from './StackBuilderWizard';
import ThemeWizard, { ThemeConfig } from './ThemeWizard';
import ArchitectWizard, { ArchitectureSpec } from './ArchitectWizard';
import BacklogManager, { ProductBacklog } from './BacklogManager';
import SprintPlanningWizard, { SprintPlan } from './SprintPlanningWizard';
import { COLORS } from '../styles/colors';

// ============================================================================
// Types
// ============================================================================

type WizardStep = 'intent' | 'stack' | 'theme' | 'architecture' | 'backlog' | 'sprint' | 'execution' | 'progress';

type ExecutionMode = 'oneshot' | 'arena';

interface OneShotPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  artifacts?: string[];
}

interface ArenaTrack {
  id: string;
  name: string;
  status: 'spawning' | 'running' | 'completed' | 'evaluating';
  progress: number;
  agent: string;
  coach: string;
  files: string[];
  messages: string[];
}

interface ArenaEscalation {
  id: string;
  trackId: string;
  type: 'decision' | 'clarification' | 'approval';
  title: string;
  description: string;
  options?: string[];
  status: 'pending' | 'resolved';
}

interface ProjectCreationWizardProps {
  onComplete: (projectPath: string, projectId: string) => void;
  onCancel: () => void;
  initialProjectName?: string;
  initialIdea?: string;
}

// ============================================================================
// OneShot Phases Configuration
// ============================================================================

const ONESHOT_PHASES: OneShotPhase[] = [
  {
    id: 'meta',
    name: 'Meta Prompting',
    description: 'Generating optimized prompts for each component',
    status: 'pending',
    progress: 0
  },
  {
    id: 'planning',
    name: 'Architecture Planning',
    description: 'Designing system architecture and file structure',
    status: 'pending',
    progress: 0
  },
  {
    id: 'implementation',
    name: 'Code Generation',
    description: 'Implementing features with specialized agents',
    status: 'pending',
    progress: 0
  },
  {
    id: 'qa',
    name: 'Quality Assurance',
    description: 'Running tests and fixing issues',
    status: 'pending',
    progress: 0
  },
  {
    id: 'delivery',
    name: 'Final Delivery',
    description: 'Packaging and documentation',
    status: 'pending',
    progress: 0
  }
];

// ============================================================================
// Main Component
// ============================================================================

const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({
  onComplete,
  onCancel,
  initialProjectName,
  initialIdea
}) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('intent');
  const [taskSpec, setTaskSpec] = useState<TaskSpec | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedStack, setSelectedStack] = useState<StackOption | null>(null);
  const [executionMode, setExecutionMode] = useState<ExecutionMode | null>(null);
  const [projectName, setProjectName] = useState(initialProjectName || '');
  const [projectPath, setProjectPath] = useState('');

  // BMAD workflow state
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [themeSessionId, setThemeSessionId] = useState<string | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureSpec | null>(null);
  const [architectureSessionId, setArchitectureSessionId] = useState<string | null>(null);
  const [backlog, setBacklog] = useState<ProductBacklog | null>(null);
  const [backlogSessionId, setBacklogSessionId] = useState<string | null>(null);
  const [sprintPlan, setSprintPlan] = useState<SprintPlan | null>(null);
  const [sprintSessionId, setSprintSessionId] = useState<string | null>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [phases, setPhases] = useState<OneShotPhase[]>(ONESHOT_PHASES);
  const [tracks, setTracks] = useState<ArenaTrack[]>([]);
  const [escalations, setEscalations] = useState<ArenaEscalation[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ============================================================================
  // Intent Capture Handlers
  // ============================================================================

  const handleIntentComplete = useCallback((spec: TaskSpec, sid: string) => {
    setTaskSpec(spec);
    setSessionId(sid);
    // Auto-generate project name from task spec if not set
    if (!projectName && spec.title) {
      const sanitized = spec.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      setProjectName(sanitized);
    }
    // Move to stack selection (informs architecture decisions)
    setCurrentStep('stack');
  }, [projectName]);

  // ============================================================================
  // Stack Builder Handlers (Step 2 - informs Architecture)
  // ============================================================================

  const handleStackComplete = useCallback((stack: StackOption) => {
    setSelectedStack(stack);
    // Move to theme design (visual identity before architecture)
    setCurrentStep('theme');
  }, []);

  const handleStackBack = useCallback(() => {
    setCurrentStep('intent');
  }, []);

  // ============================================================================
  // Theme Design Handlers (Step 3 - Design Differentiation)
  // ============================================================================

  const handleThemeComplete = useCallback((themeConfig: ThemeConfig, sid: string) => {
    setTheme(themeConfig);
    setThemeSessionId(sid);
    // Move to architecture design (now informed by stack + theme)
    setCurrentStep('architecture');
  }, []);

  const handleThemeBack = useCallback(() => {
    setCurrentStep('stack');
  }, []);

  // ============================================================================
  // Architecture Handlers (Step 4 - informed by stack + theme)
  // ============================================================================

  const handleArchitectureComplete = useCallback((arch: ArchitectureSpec, sid: string) => {
    setArchitecture(arch);
    setArchitectureSessionId(sid);
    // Move to backlog creation
    setCurrentStep('backlog');
  }, []);

  const handleArchitectureBack = useCallback(() => {
    setCurrentStep('theme');
  }, []);

  // ============================================================================
  // Backlog Handlers (Step 5)
  // ============================================================================

  const handleBacklogComplete = useCallback((bl: ProductBacklog, sid: string) => {
    setBacklog(bl);
    setBacklogSessionId(sid);
    // Move to sprint planning
    setCurrentStep('sprint');
  }, []);

  const handleBacklogBack = useCallback(() => {
    setCurrentStep('architecture');
  }, []);

  // ============================================================================
  // Sprint Planning Handlers (Step 6)
  // ============================================================================

  const handleSprintComplete = useCallback((sprint: SprintPlan, sid: string) => {
    setSprintPlan(sprint);
    setSprintSessionId(sid);
    // Move to execution mode selection
    setCurrentStep('execution');
  }, []);

  const handleSprintBack = useCallback(() => {
    setCurrentStep('backlog');
  }, []);

  // ============================================================================
  // Execution Mode Selection
  // ============================================================================

  const handleModeSelect = useCallback((mode: ExecutionMode) => {
    setExecutionMode(mode);
  }, []);

  const handleStartExecution = useCallback(async () => {
    if (!taskSpec || !selectedStack || !executionMode || !projectName) {
      setError('Missing required configuration');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setCurrentStep('progress');
    setLogs([`Starting ${executionMode === 'oneshot' ? 'OneShot' : 'Arena'} execution...`]);

    try {
      const endpoint = executionMode === 'oneshot'
        ? '/api/v1/oneshot/start'
        : '/api/v1/arena/start';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          task_spec: taskSpec,
          stack: selectedStack,
          session_id: sessionId,
          track_count: executionMode === 'arena' ? 3 : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to start execution: ${response.statusText}`);
      }

      const data = await response.json();
      setExecutionId(data.execution_id || data.arena_id);
      setProjectPath(data.project_path || '');

      // Start SSE streaming for updates
      const streamEndpoint = executionMode === 'oneshot'
        ? `/api/v1/oneshot/${data.execution_id}/stream`
        : `/api/v1/arena/${data.arena_id}/stream`;

      const eventSource = new EventSource(streamEndpoint);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          handleExecutionUpdate(update);
        } catch (e) {
          console.error('Failed to parse SSE message:', e);
        }
      };

      eventSource.onerror = () => {
        setLogs(prev => [...prev, 'Connection to execution stream lost']);
        eventSource.close();
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start execution');
      setIsExecuting(false);
      setCurrentStep('execution');
    }
  }, [taskSpec, selectedStack, executionMode, projectName, sessionId]);

  // ============================================================================
  // Execution Update Handler
  // ============================================================================

  const handleExecutionUpdate = useCallback((update: any) => {
    switch (update.type) {
      case 'phase_start':
        setPhases(prev => prev.map(p =>
          p.id === update.phase_id
            ? { ...p, status: 'running', progress: 0 }
            : p
        ));
        setLogs(prev => [...prev, `Starting phase: ${update.phase_name}`]);
        break;

      case 'phase_progress':
        setPhases(prev => prev.map(p =>
          p.id === update.phase_id
            ? { ...p, progress: update.progress }
            : p
        ));
        break;

      case 'phase_complete':
        setPhases(prev => prev.map(p =>
          p.id === update.phase_id
            ? { ...p, status: 'completed', progress: 100, artifacts: update.artifacts }
            : p
        ));
        setLogs(prev => [...prev, `Completed phase: ${update.phase_name}`]);
        break;

      case 'phase_failed':
        setPhases(prev => prev.map(p =>
          p.id === update.phase_id
            ? { ...p, status: 'failed' }
            : p
        ));
        setLogs(prev => [...prev, `Phase failed: ${update.phase_name} - ${update.error}`]);
        break;

      case 'track_update':
        setTracks(prev => {
          const existing = prev.find(t => t.id === update.track_id);
          if (existing) {
            return prev.map(t => t.id === update.track_id ? { ...t, ...update } : t);
          }
          return [...prev, update as ArenaTrack];
        });
        break;

      case 'escalation':
        setEscalations(prev => [...prev, update.escalation as ArenaEscalation]);
        setLogs(prev => [...prev, `Escalation: ${update.escalation.title}`]);
        break;

      case 'log':
        setLogs(prev => [...prev, update.message]);
        break;

      case 'complete':
        setIsExecuting(false);
        setLogs(prev => [...prev, 'Project generation complete!']);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // Notify parent after short delay
        setTimeout(() => {
          onComplete(update.project_path || projectPath, update.project_id || executionId || '');
        }, 1500);
        break;

      case 'error':
        setError(update.message);
        setIsExecuting(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        break;
    }
  }, [projectPath, executionId, onComplete]);

  // ============================================================================
  // Escalation Handler
  // ============================================================================

  const handleEscalationResponse = useCallback(async (
    escalationId: string,
    response: string
  ) => {
    if (!executionId) {return;}

    try {
      await fetch(`/api/v1/arena/${executionId}/escalation/${escalationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });

      setEscalations(prev => prev.map(e =>
        e.id === escalationId ? { ...e, status: 'resolved' } : e
      ));
    } catch (err) {
      console.error('Failed to respond to escalation:', err);
    }
  }, [executionId]);

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderStepIndicator = () => {
    const steps = [
      { id: 'intent', label: 'Requirements', icon: '1' },
      { id: 'stack', label: 'Tech Stack', icon: '2' },
      { id: 'theme', label: 'Theme', icon: '3' },
      { id: 'architecture', label: 'Architecture', icon: '4' },
      { id: 'backlog', label: 'Backlog', icon: '5' },
      { id: 'sprint', label: 'Sprint', icon: '6' },
      { id: 'execution', label: 'Execution', icon: '7' },
      { id: 'progress', label: 'Progress', icon: '8' }
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', gap: '8px' }}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '14px',
                backgroundColor: index < currentIndex
                  ? COLORS.success
                  : index === currentIndex
                    ? COLORS.accent
                    : COLORS.bgHover,
                color: index <= currentIndex ? '#fff' : COLORS.textMuted,
              }}>
                {index < currentIndex ? '✓' : step.icon}
              </div>
              <span style={{
                fontSize: '14px',
                color: index <= currentIndex ? COLORS.text : COLORS.textMuted,
              }}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div style={{
                width: '40px',
                height: '3px',
                borderRadius: '2px',
                backgroundColor: index < currentIndex ? COLORS.success : COLORS.border,
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderExecutionModeSelection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: COLORS.text, margin: 0 }}>
          Choose Execution Mode
        </h2>
        <p style={{ color: COLORS.textMuted, marginTop: '8px' }}>
          Select how you want to generate your project
        </p>
      </div>

      {/* Project Name Input */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: COLORS.text, marginBottom: '8px' }}>
          Project Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="my-awesome-project"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            backgroundColor: COLORS.bgHover,
            color: COLORS.text,
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Mode Selection Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {/* OneShot Mode */}
        <div
          onClick={() => handleModeSelect('oneshot')}
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: `2px solid ${executionMode === 'oneshot' ? COLORS.accent : COLORS.border}`,
            backgroundColor: executionMode === 'oneshot' ? `${COLORS.accent}15` : COLORS.card,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: `${COLORS.accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              ⚡
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: COLORS.text, margin: 0 }}>
                OneShot Mode
              </h3>
              <span style={{ fontSize: '13px', color: COLORS.accent }}>
                Recommended
              </span>
            </div>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
            Automated 5-phase pipeline for rapid, consistent project generation.
            Best for standard applications with well-defined requirements.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '14px' }}>
              <span style={{ color: COLORS.success }}>✓</span> Fastest execution
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '14px' }}>
              <span style={{ color: COLORS.success }}>✓</span> Consistent results
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '14px' }}>
              <span style={{ color: COLORS.success }}>✓</span> Automatic QA
            </li>
          </ul>
        </div>

        {/* Arena Mode */}
        <div
          onClick={() => handleModeSelect('arena')}
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: `2px solid ${executionMode === 'arena' ? COLORS.purple : COLORS.border}`,
            backgroundColor: executionMode === 'arena' ? `${COLORS.purple}15` : COLORS.card,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: `${COLORS.purple}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              🏟️
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: COLORS.text, margin: 0 }}>
                Arena Mode
              </h3>
              <span style={{ fontSize: '13px', color: COLORS.purple }}>
                Advanced
              </span>
            </div>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
            Parallel development with multiple Dev+Coach tracks competing.
            Best for complex projects where you want to compare approaches.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '14px' }}>
              <span style={{ color: COLORS.purple }}>✓</span> Multiple implementations
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '14px' }}>
              <span style={{ color: COLORS.purple }}>✓</span> Choose best approach
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '14px' }}>
              <span style={{ color: COLORS.purple }}>✓</span> Human-in-the-loop
            </li>
          </ul>
        </div>
      </div>

      {/* Summary Panel */}
      {taskSpec && selectedStack && (
        <div style={{
          marginTop: '8px',
          padding: '16px',
          backgroundColor: COLORS.bgHover,
          borderRadius: '8px',
        }}>
          <h4 style={{ fontWeight: 500, color: COLORS.text, marginBottom: '12px', margin: 0 }}>
            Project Summary
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px', marginTop: '12px' }}>
            <div>
              <span style={{ color: COLORS.textMuted }}>Domain:</span>
              <span style={{ marginLeft: '8px', color: COLORS.text }}>
                {taskSpec.domain || 'General'}
              </span>
            </div>
            <div>
              <span style={{ color: COLORS.textMuted }}>Complexity:</span>
              <span style={{ marginLeft: '8px', color: COLORS.text }}>
                {taskSpec.complexity_score || 'N/A'}/10
              </span>
            </div>
            <div>
              <span style={{ color: COLORS.textMuted }}>Stack:</span>
              <span style={{ marginLeft: '8px', color: COLORS.text }}>
                {selectedStack.tier} ({selectedStack.name})
              </span>
            </div>
            <div>
              <span style={{ color: COLORS.textMuted }}>Features:</span>
              <span style={{ marginLeft: '8px', color: COLORS.text }}>
                {taskSpec.features?.length || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: `${COLORS.error}15`,
          border: `1px solid ${COLORS.error}40`,
          borderRadius: '8px',
          color: COLORS.error,
        }}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px' }}>
        <button
          onClick={() => setCurrentStep('sprint')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            border: 'none',
            color: COLORS.textMuted,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: COLORS.text,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStartExecution}
            disabled={!executionMode || !projectName}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 500,
              cursor: executionMode && projectName ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              backgroundColor: executionMode && projectName ? COLORS.accent : COLORS.bgHover,
              color: executionMode && projectName ? '#fff' : COLORS.textMuted,
              opacity: executionMode && projectName ? 1 : 0.6,
            }}
          >
            Start Generation →
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgressPanel = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {executionMode === 'oneshot' ? 'OneShot Pipeline' : 'Arena Development'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isExecuting ? 'Generating your project...' : 'Generation complete!'}
        </p>
      </div>

      {/* OneShot Phases */}
      {executionMode === 'oneshot' && (
        <div className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border
                                           border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${phase.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                      phase.status === 'running' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                      phase.status === 'failed' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-500'}
                  `}>
                    {phase.status === 'completed' ? '✓' :
                     phase.status === 'running' ? '●' :
                     phase.status === 'failed' ? '✕' : '○'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {phase.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {phase.description}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {phase.progress}%
                </span>
              </div>
              {phase.status === 'running' && (
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
              )}
              {phase.artifacts && phase.artifacts.length > 0 && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Artifacts: {phase.artifacts.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Arena Tracks */}
      {executionMode === 'arena' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tracks.map((track) => (
              <div key={track.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border
                                             border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {track.name}
                  </h4>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${track.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' :
                      track.status === 'running' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                  `}>
                    {track.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <div>Agent: {track.agent}</div>
                  <div>Coach: {track.coach}</div>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${track.progress}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Files: {track.files?.length || 0}
                </div>
              </div>
            ))}
          </div>

          {/* Escalations */}
          {escalations.filter(e => e.status === 'pending').length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border
                           border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-3">
                Action Required
              </h4>
              {escalations.filter(e => e.status === 'pending').map((esc) => (
                <div key={esc.id} className="mb-3 last:mb-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {esc.title}: {esc.description}
                  </p>
                  {esc.options && (
                    <div className="flex gap-2">
                      {esc.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleEscalationResponse(esc.id, opt)}
                          className="px-3 py-1 text-sm bg-white dark:bg-gray-800
                                     border border-gray-300 dark:border-gray-600
                                     rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs Panel */}
      <div className="p-4 bg-gray-900 rounded-lg max-h-48 overflow-y-auto">
        <div className="font-mono text-sm text-gray-300">
          {logs.map((log, idx) => (
            <div key={idx} className="py-0.5">
              <span className="text-gray-500">[{String(idx).padStart(3, '0')}]</span>{' '}
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                        rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Close Button (shown when complete) */}
      {!isExecuting && !error && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => onComplete(projectPath, executionId || '')}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white
                       rounded-lg font-medium transition-colors"
          >
            View Project →
          </button>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: COLORS.text, margin: 0 }}>
          Create New Project
        </h1>
        <p style={{ color: COLORS.textMuted, marginTop: '8px' }}>
          AI-powered project generation with CLI-parity features
        </p>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div style={{
        backgroundColor: COLORS.card,
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${COLORS.border}`,
      }}>
        {/* Step 1: Intent Capture */}
        {currentStep === 'intent' && (
          <IntentCaptureWizard
            onComplete={handleIntentComplete}
            onCancel={onCancel}
            initialIdea={initialIdea}
          />
        )}

        {/* Step 2: Stack Selection (informs Architecture) */}
        {currentStep === 'stack' && taskSpec && (
          <StackBuilderWizard
            taskSpec={taskSpec}
            onComplete={handleStackComplete}
            onBack={handleStackBack}
            onCancel={onCancel}
          />
        )}

        {/* Step 3: Theme Design (Design Differentiation) */}
        {currentStep === 'theme' && taskSpec && (
          <ThemeWizard
            intent={taskSpec.problem_statement || taskSpec.title || ''}
            projectName={projectName || taskSpec.title || 'New Project'}
            onComplete={handleThemeComplete}
            onBack={handleThemeBack}
          />
        )}

        {/* Step 4: Architecture (informed by stack + theme) */}
        {currentStep === 'architecture' && taskSpec && (
          <ArchitectWizard
            requirements={taskSpec}
            taskSpec={taskSpec}
            projectName={projectName || taskSpec.title || 'New Project'}
            stack={selectedStack}
            theme={theme}
            onComplete={handleArchitectureComplete}
            onBack={handleArchitectureBack}
          />
        )}

        {/* Step 5: Backlog */}
        {currentStep === 'backlog' && architecture && (
          <BacklogManager
            architecture={architecture}
            projectName={projectName || 'New Project'}
            onComplete={handleBacklogComplete}
            onBack={handleBacklogBack}
          />
        )}

        {/* Step 6: Sprint Planning */}
        {currentStep === 'sprint' && backlog && (
          <SprintPlanningWizard
            backlog={backlog}
            projectName={projectName || 'New Project'}
            onComplete={handleSprintComplete}
            onBack={handleSprintBack}
          />
        )}

        {/* Step 7: Execution Mode Selection */}
        {currentStep === 'execution' && renderExecutionModeSelection()}

        {/* Step 8: Progress Panel */}
        {currentStep === 'progress' && renderProgressPanel()}
      </div>
    </div>
  );
};

export default ProjectCreationWizard;
