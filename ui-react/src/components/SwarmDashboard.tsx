/**
 * SwarmDashboard Component
 *
 * Main dashboard for agent swarm orchestration.
 * Displays swarm status, real-time events, and execution results.
 * Styled to match the dark neural theme used throughout the app.
 */

import React, { useState, useEffect } from 'react';
import { useSwarm } from '../hooks/useSwarm';
import { GlassCard, NeuralEmptyState } from './shared';
import type { SwarmTask } from '../services/swarm-api';

// ============================================================================
// Theme constants matching the neural interface design system
// ============================================================================
const CYAN = '#00d4ff';
const TEXT = '#fafafa';
const TEXT_SECONDARY = '#a1a1aa';
const TEXT_MUTED = '#71717a';
const TEXT_DIM = '#52525b';
const BG_PANEL = '#141415';
const BG_MUTED = '#18181b';
const BG_HOVER = '#1f1f23';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const BORDER_SOLID = '#27272a';
const SUCCESS = '#22c55e';
const SUCCESS_MUTED = '#14532d';
const WARNING = '#f59e0b';
const WARNING_MUTED = '#451a03';
const ERROR = '#ef4444';
const ERROR_MUTED = '#450a0a';
const INFO = '#3b82f6';
const PURPLE = '#8b5cf6';

// ============================================================================
// Status Badge
// ============================================================================
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  initializing: { bg: 'rgba(255, 255, 255, 0.06)', text: TEXT_SECONDARY, icon: '\u2699\uFE0F' },
  running: { bg: WARNING_MUTED, text: WARNING, icon: '\u23F3' },
  voting: { bg: 'rgba(59, 130, 246, 0.15)', text: INFO, icon: '\uD83D\uDDF3\uFE0F' },
  completed: { bg: SUCCESS_MUTED, text: SUCCESS, icon: '\u2705' },
  failed: { bg: ERROR_MUTED, text: ERROR, icon: '\u274C' },
};

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'lg' }> = ({
  status,
  size = 'sm',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.initializing;
  const padding = size === 'lg' ? '6px 14px' : '3px 10px';
  const fontSize = size === 'lg' ? '13px' : '11px';

  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: '9999px',
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.text}33`,
      }}
    >
      <span aria-hidden="true">{config.icon}</span>
      {status}
    </span>
  );
};

// ============================================================================
// Skeleton Card
// ============================================================================
const SkeletonCard: React.FC = () => (
  <div
    style={{
      padding: '16px',
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: `1px solid ${BORDER}`,
    }}
    className="animate-pulse"
  >
    <div style={{ height: '16px', width: '40%', background: BG_HOVER, borderRadius: '4px', marginBottom: '12px' }} />
    <div style={{ height: '40px', background: BG_MUTED, borderRadius: '4px', marginBottom: '8px' }} />
    <div style={{ height: '40px', background: BG_MUTED, borderRadius: '4px' }} />
  </div>
);

// ============================================================================
// Stat Card
// ============================================================================
const StatCard: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
  <div
    style={{
      padding: '16px',
      borderRadius: '8px',
      background: `${color}12`,
      border: `1px solid ${color}25`,
    }}
    aria-label={label}
  >
    <div style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '4px' }}>
      {value}
    </div>
    <div style={{ fontSize: '13px', color: TEXT_MUTED }}>{label}</div>
  </div>
);

// ============================================================================
// Main Dashboard
// ============================================================================
export const SwarmDashboard: React.FC = () => {
  const {
    swarms,
    activeSwarm,
    result,
    events,
    stats,
    isLoading,
    isExecuting,
    error,
    isConnected,
    createNewSwarm,
    loadSwarms,
    selectSwarm,
    execute,
    loadStats,
    connect,
    disconnect,
    clearError,
  } = useSwarm({ autoConnect: false });

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [complexity, setComplexity] = useState(5);
  const [strategy, setStrategy] = useState('democratic');
  const [capabilities, setCapabilities] = useState<string[]>(['backend', 'security']);

  // U-07: Form validation state
  const [validationError, setValidationError] = useState('');

  // U-08: Success notification state
  const [successMessage, setSuccessMessage] = useState('');

  // U-11: Execution progress state
  const [executionProgress, setExecutionProgress] = useState(0);

  // UX-009: Confirm-before-execute state
  const [confirmExecute, setConfirmExecute] = useState(false);

  // UX-007: Maximum description length
  const MAX_DESCRIPTION_LENGTH = 500;

  // Load initial data
  useEffect(() => {
    loadSwarms();
    loadStats();
  }, [loadSwarms, loadStats]);

  // Handle swarm creation
  const handleCreateSwarm = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationError('');
    if (!taskDescription.trim()) {
      setValidationError('Task description is required');
      return;
    }
    if (taskDescription.trim().length < 10) {
      setValidationError('Task description must be at least 10 characters');
      return;
    }

    const task: SwarmTask = {
      task_id: `task-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)}`,
      description: taskDescription,
      complexity,
      required_capabilities: capabilities,
      min_agents: 2,
      max_agents: 5,
      requires_consensus: strategy === 'democratic',
    };

    try {
      const swarm = await createNewSwarm(task, strategy);
      setShowCreateForm(false);
      setTaskDescription('');
      setSuccessMessage('Swarm created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      connect(swarm.swarm_id);
    } catch (err) {
      console.error('Failed to create swarm:', err);
    }
  };

  // CR-019: Track progress interval in ref for proper cleanup on unmount
  const progressIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const handleExecute = async () => {
    if (!activeSwarm) {return;}

    setConfirmExecute(false);

    try {
      setExecutionProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setExecutionProgress((prev) => {
          if (prev >= 90) {
            if (progressIntervalRef.current) {clearInterval(progressIntervalRef.current);}
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      await execute(activeSwarm.swarm_id);

      if (progressIntervalRef.current) {clearInterval(progressIntervalRef.current);}
      progressIntervalRef.current = null;
      setExecutionProgress(100);
      setTimeout(() => setExecutionProgress(0), 1000);
    } catch (err) {
      console.error('Failed to execute swarm:', err);
      if (progressIntervalRef.current) {clearInterval(progressIntervalRef.current);}
      progressIntervalRef.current = null;
      setExecutionProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const latestEvent = events[events.length - 1];
    if (latestEvent?.data?.progress) {
      setExecutionProgress(latestEvent.data.progress);
    }
  }, [events]);

  useEffect(() => {
    setConfirmExecute(false);
  }, [activeSwarm?.swarm_id]);

  // ============================================================================
  // Shared button styles
  // ============================================================================
  const btnPrimary: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    background: CYAN,
    color: '#000',
    transition: 'opacity 0.15s',
  };

  const btnGhost: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    background: 'transparent',
    color: TEXT_SECONDARY,
    border: `1px solid ${BORDER_SOLID}`,
    transition: 'background 0.15s',
  };

  const btnSuccess: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    background: SUCCESS,
    color: '#000',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: TEXT }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', color: TEXT }}>
          Agent Swarm Orchestration
        </h1>
        <p style={{ fontSize: '14px', color: TEXT_MUTED }}>
          Decentralized multi-agent coordination with democratic decision-making
        </p>

        {/* WebSocket Connection Status */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }} role="status" aria-live="polite">
          {isConnected ? (
            <>
              <div
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: SUCCESS, boxShadow: `0 0 6px ${SUCCESS}` }}
                role="img"
                aria-label="Connected indicator"
              />
              <span style={{ fontSize: '12px', color: SUCCESS }}>
                Live &mdash; Connected to real-time updates
              </span>
            </>
          ) : (
            <>
              <div
                style={{ width: '8px', height: '8px', borderRadius: '50%', border: `2px solid ${TEXT_DIM}`, background: 'transparent' }}
                role="img"
                aria-label="Disconnected indicator"
              />
              <span style={{ fontSize: '12px', color: TEXT_DIM }}>
                Offline &mdash; Disconnected
              </span>
            </>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: SUCCESS_MUTED,
            border: `1px solid ${SUCCESS}33`,
            color: SUCCESS,
            fontSize: '14px',
          }}
        >
          &#x2713; {successMessage}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '14px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: ERROR_MUTED,
            border: `1px solid ${ERROR}33`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: ERROR, marginBottom: '4px', fontSize: '14px' }}>Error</div>
              <div style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '6px' }}>{error}</div>
              <div style={{ color: TEXT_DIM, fontSize: '12px' }}>
                {error.includes('connect') && 'Try refreshing the page or check your network connection.'}
                {error.includes('execute') && 'Make sure the swarm is in the correct state and all agents are available.'}
                {error.includes('create') && 'Verify that the task description is valid and all required fields are filled.'}
              </div>
            </div>
            <button
              onClick={clearError}
              aria-label="Dismiss error"
              style={{ background: 'none', border: 'none', color: ERROR, cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
            >
              &#x2715;
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div
          role="region"
          aria-label="Swarm statistics"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}
        >
          <StatCard value={stats.coordinator.total_agents} label="Total Agents" color={INFO} />
          <StatCard value={stats.active_swarms} label="Active Swarms" color={SUCCESS} />
          <StatCard value={stats.communication_bus.total_messages} label="Messages" color={PURPLE} />
          <StatCard value={stats.completed_swarms} label="Completed" color={WARNING} />
        </div>
      )}

      {/* Main grid - responsive: 1 col on mobile, 3 on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '20px' }}>

        {/* ================================================================ */}
        {/* Left Column - Swarms List */}
        {/* ================================================================ */}
        <GlassCard variant="bordered" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: TEXT }} id="swarms-heading">
              Swarms
            </h2>
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setValidationError(''); }}
              aria-label="Create new swarm"
              aria-expanded={showCreateForm}
              style={{ ...btnPrimary, padding: '6px 14px' }}
            >
              + New
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateSwarm}
              aria-label="Create swarm form"
              style={{
                marginBottom: '16px',
                padding: '16px',
                borderRadius: '8px',
                background: BG_MUTED,
                border: `1px solid ${BORDER}`,
              }}
            >
              {validationError && (
                <div
                  id="validation-error"
                  role="alert"
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: ERROR_MUTED,
                    border: `1px solid ${ERROR}33`,
                    color: '#fca5a5',
                    fontSize: '13px',
                  }}
                >
                  {validationError}
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="task-description" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '6px' }}>
                  Task Description * <span style={{ fontWeight: 400, color: TEXT_DIM }}>(minimum 10 characters)</span>
                </label>
                <textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => { setTaskDescription(e.target.value); if (validationError) {setValidationError('');} }}
                  rows={3}
                  required
                  placeholder="Describe the task (min 10 characters)..."
                  aria-describedby={validationError ? 'validation-error' : undefined}
                  aria-invalid={!!validationError}
                  minLength={10}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: BG_PANEL,
                    border: `1px solid ${validationError ? ERROR + '55' : BORDER_SOLID}`,
                    color: TEXT,
                    fontSize: '13px',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ marginTop: '4px', fontSize: '11px', color: TEXT_DIM }}>
                  {taskDescription.length}/{MAX_DESCRIPTION_LENGTH}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="complexity-slider" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '6px' }}>
                  Complexity: {complexity}/10
                </label>
                <input
                  id="complexity-slider"
                  type="range"
                  min="1"
                  max="10"
                  value={complexity}
                  onChange={(e) => setComplexity(Number(e.target.value))}
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={complexity}
                  aria-label={`Task complexity: ${complexity} out of 10`}
                  style={{ width: '100%', accentColor: CYAN }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="strategy-select" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: TEXT_SECONDARY, marginBottom: '6px' }}>
                  Strategy
                </label>
                <select
                  id="strategy-select"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  aria-label="Select swarm strategy"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: BG_PANEL,
                    border: `1px solid ${BORDER_SOLID}`,
                    color: TEXT,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="democratic">Democratic (Voting)</option>
                  <option value="competitive">Competitive</option>
                  <option value="collaborative">Collaborative</option>
                  <option value="hierarchical">Hierarchical</option>
                  <option value="stigmergic" disabled>Stigmergic (coming soon)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label="Create swarm"
                  style={{
                    ...btnSuccess,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? <><span className="animate-spin">&#x23F3;</span> Creating...</> : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setValidationError(''); }}
                  aria-label="Cancel swarm creation"
                  style={btnGhost}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Swarms List */}
          {isLoading && swarms.length === 0 ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading swarms">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }} aria-labelledby="swarms-heading">
              {swarms.length === 0 && (
                <li>
                  <NeuralEmptyState
                    title="No Swarms Yet"
                    description="Create a new swarm to get started with multi-agent orchestration."
                  />
                </li>
              )}

              {swarms.map((swarm) => {
                const isActive = activeSwarm?.swarm_id === swarm.swarm_id;
                return (
                  <li key={swarm.swarm_id}>
                    <button
                      onClick={() => selectSwarm(swarm.swarm_id)}
                      aria-label={`Select swarm: ${swarm.task_description}`}
                      aria-pressed={isActive}
                      title={swarm.task_description}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${isActive ? CYAN + '55' : BORDER}`,
                        background: isActive ? `${CYAN}10` : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        color: TEXT,
                      }}
                      onMouseEnter={(e) => { if (!isActive) {e.currentTarget.style.background = BG_HOVER;} }}
                      onMouseLeave={(e) => { if (!isActive) {e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';} }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', color: isActive ? TEXT : TEXT_SECONDARY }}>
                          {swarm.task_description}
                        </span>
                        <StatusBadge status={swarm.status} />
                      </div>
                      <div style={{ fontSize: '12px', color: TEXT_DIM }}>
                        {swarm.agents.length} agents &bull; {swarm.strategy}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        {/* ================================================================ */}
        {/* Middle Column - Active Swarm Details */}
        {/* ================================================================ */}
        <GlassCard variant="bordered" style={{ padding: '20px' }}>
          {activeSwarm ? (
            <div role="region" aria-label="Active swarm details">
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '16px' }} id="active-swarm-heading">
                Swarm: <span style={{ color: CYAN }}>{activeSwarm.swarm_id.substring(0, 12)}</span>
              </h2>

              {/* Execution Progress Bar */}
              {executionProgress > 0 && executionProgress < 100 && (
                <div style={{ marginBottom: '16px' }} role="progressbar" aria-valuenow={executionProgress} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: CYAN }}>Executing...</span>
                    <span style={{ fontSize: '12px', color: TEXT_MUTED }}>{executionProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: BG_HOVER }}>
                    <div
                      style={{
                        width: `${executionProgress}%`,
                        height: '6px',
                        borderRadius: '3px',
                        background: CYAN,
                        transition: 'width 0.3s',
                        boxShadow: `0 0 8px ${CYAN}66`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Task Info */}
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: BG_MUTED, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task</div>
                <div style={{ fontSize: '13px', color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                  {activeSwarm.task_description}
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusBadge status={activeSwarm.status} size="lg" />
                  {isConnected && (
                    <span style={{ fontSize: '12px', color: SUCCESS }}>&#x25CF; Live</span>
                  )}
                </div>
              </div>

              {/* Agents */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Agents ({activeSwarm.agents.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {activeSwarm.agents.map((agentId) => (
                    <div
                      key={agentId}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        background: `${PURPLE}15`,
                        border: `1px solid ${PURPLE}33`,
                        color: PURPLE,
                      }}
                    >
                      {agentId}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT_MUTED, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Strategy</div>
                <div style={{
                  fontSize: '13px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  background: `${INFO}12`,
                  border: `1px solid ${INFO}25`,
                  color: INFO,
                  fontWeight: 500,
                }}>
                  {activeSwarm.strategy.charAt(0).toUpperCase() + activeSwarm.strategy.slice(1)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} role="group" aria-label="Swarm actions">
                {activeSwarm.status === 'initializing' && (
                  <>
                    {confirmExecute ? (
                      <div
                        role="alertdialog"
                        aria-label="Confirm swarm execution"
                        aria-describedby="execute-confirm-hint"
                        style={{
                          flex: 1,
                          padding: '14px',
                          borderRadius: '8px',
                          background: WARNING_MUTED,
                          border: `1px solid ${WARNING}33`,
                        }}
                      >
                        <p style={{ fontSize: '13px', fontWeight: 600, color: WARNING, marginBottom: '6px' }}>
                          Execute this swarm? This action cannot be undone.
                        </p>
                        <p id="execute-confirm-hint" style={{ fontSize: '12px', color: TEXT_MUTED, marginBottom: '12px' }}>
                          Once started, the swarm will run autonomously to completion.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={handleExecute}
                            disabled={isExecuting}
                            aria-label="Confirm and execute swarm"
                            aria-busy={isExecuting}
                            style={{
                              ...btnSuccess,
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              opacity: isExecuting ? 0.5 : 1,
                              cursor: isExecuting ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isExecuting ? <><span className="animate-spin">&#x23F3;</span> Executing...</> : 'Confirm Execute'}
                          </button>
                          <button
                            onClick={() => setConfirmExecute(false)}
                            aria-label="Cancel execution"
                            style={{ ...btnGhost, borderColor: `${WARNING}55` }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmExecute(true)}
                        disabled={isExecuting}
                        aria-label="Execute swarm"
                        style={{
                          ...btnSuccess,
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: isExecuting ? 0.5 : 1,
                        }}
                      >
                        &#x25B6; Execute
                      </button>
                    )}
                    {!isConnected && (
                      <button
                        onClick={() => connect(activeSwarm.swarm_id)}
                        aria-label="Connect to real-time updates"
                        style={btnGhost}
                      >
                        &#x1F4E1; Connect
                      </button>
                    )}
                  </>
                )}

                {activeSwarm.status === 'running' && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '6px',
                      background: WARNING_MUTED,
                      border: `1px solid ${WARNING}33`,
                      textAlign: 'center',
                      color: WARNING,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span className="animate-pulse">&#x23F3;</span>
                    Executing...
                  </div>
                )}

                {activeSwarm.status === 'completed' && result && (
                  <button
                    onClick={() => {
                      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label="View swarm execution results"
                    style={{ ...btnPrimary, flex: 1 }}
                  >
                    View Results
                  </button>
                )}

                {isConnected && (
                  <button
                    onClick={disconnect}
                    aria-label="Disconnect from real-time updates"
                    style={btnGhost}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ) : (
            <NeuralEmptyState
              title="No Swarm Selected"
              description="Select a swarm from the list to view details"
            />
          )}
        </GlassCard>

        {/* ================================================================ */}
        {/* Right Column - Events & Results */}
        {/* ================================================================ */}
        <GlassCard variant="bordered" style={{ padding: '20px' }}>
          <div role="region" aria-label="Activity feed">
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, marginBottom: '16px' }} id="activity-feed-heading">
              Activity Feed
            </h2>

            {/* Events */}
            <div
              role="log"
              aria-labelledby="activity-feed-heading"
              aria-live="polite"
              className="ni-scrollbar"
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}
            >
              {events.length === 0 && (
                <div role="status" style={{ textAlign: 'center', padding: '40px 20px', color: TEXT_DIM, fontSize: '13px' }}>
                  No events yet. Execute a swarm to see real-time activity.
                </div>
              )}

              {events
                .slice(-50)
                .toReversed()
                .map((event) => (
                  <div
                    key={`${event.swarm_id}-${event.event_type}-${event.timestamp}`}
                    role="article"
                    aria-label={`Event: ${event.event_type}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${BORDER}`,
                      fontSize: '12px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = BG_HOVER; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: CYAN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.event_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '10px', color: TEXT_DIM, flexShrink: 0, marginLeft: '8px' }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.data.agent_id && (
                      <div style={{ color: TEXT_MUTED, marginBottom: '2px' }}>
                        Agent: {event.data.agent_id}
                      </div>
                    )}
                    <div style={{ color: TEXT_SECONDARY, wordBreak: 'break-word' }}>
                      {event.data.message ||
                        event.data.status ||
                        JSON.stringify(event.data).substring(0, 100)}
                      {JSON.stringify(event.data).length > 100 && '...'}
                    </div>
                  </div>
                ))}

              {events.length > 50 && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: TEXT_DIM, padding: '8px 0' }}>
                  Showing last 50 of {events.length} events
                </div>
              )}
            </div>

            {/* Results */}
            {result && (
              <div
                id="results-section"
                role="region"
                aria-label="Execution results"
                style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${BORDER}` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>Result</div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                      setSuccessMessage('Result copied to clipboard!');
                      setTimeout(() => setSuccessMessage(''), 2000);
                    }}
                    aria-label="Copy result to clipboard"
                    title="Copy full result to clipboard"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: 'transparent',
                      border: `1px solid ${BORDER_SOLID}`,
                      color: TEXT_MUTED,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: SUCCESS_MUTED,
                    border: `1px solid ${SUCCESS}33`,
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: SUCCESS, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>&#x2713;</span> Winner: {result.winning_solution.solution_id}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <ResultRow label="Agent" value={result.winning_solution.agent_id} />
                    <ResultRow label="Approach" value={result.winning_solution.approach} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <ResultRow label="Quality" value={`${(result.winning_solution.estimated_quality * 100).toFixed(1)}%`} valueColor={SUCCESS} />
                      <ResultRow label="Confidence" value={`${(result.decision.confidence * 100).toFixed(1)}%`} valueColor={INFO} />
                    </div>

                    <ResultRow label="Total Proposals" value={String(result.all_proposals.length)} />

                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: BG_PANEL, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: TEXT_MUTED }}>Consensus:</span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontWeight: 500,
                          background: result.decision.consensus ? SUCCESS_MUTED : WARNING_MUTED,
                          color: result.decision.consensus ? SUCCESS : WARNING,
                          border: `1px solid ${result.decision.consensus ? SUCCESS : WARNING}33`,
                        }}
                      >
                        {result.decision.consensus ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// ============================================================================
// Result Row Helper
// ============================================================================
const ResultRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
  <div style={{ padding: '8px 12px', borderRadius: '6px', background: BG_PANEL, fontSize: '12px' }}>
    <span style={{ fontWeight: 500, color: TEXT_MUTED }}>{label}:</span>{' '}
    <span style={{ color: valueColor || TEXT_SECONDARY, fontWeight: valueColor ? 700 : 400 }}>{value}</span>
  </div>
);

export default SwarmDashboard;
