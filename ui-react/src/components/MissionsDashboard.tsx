/**
 * MissionsDashboard Component
 *
 * Main dashboard for Phase 5: Parallel Team Orchestration.
 * Displays missions, teams, and real-time progress.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  listMissions,
  createMission,
  launchMission,
  pauseMission,
  resumeMission,
  cancelMission,
  getMissionStats,
  type Mission,
  type MissionStats,
  type CreateMissionRequest,
} from '../services/missions-api';
import { GlassCard, NeuralEmptyState } from './shared';

// ============================================================================
// Theme constants
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
// Status Config
// ============================================================================
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  planning: { bg: 'rgba(139, 92, 246, 0.15)', text: PURPLE, icon: '📋' },
  ready: { bg: 'rgba(59, 130, 246, 0.15)', text: INFO, icon: '⏳' },
  running: { bg: WARNING_MUTED, text: WARNING, icon: '⚡' },
  paused: { bg: 'rgba(255, 255, 255, 0.06)', text: TEXT_SECONDARY, icon: '⏸️' },
  completed: { bg: SUCCESS_MUTED, text: SUCCESS, icon: '✅' },
  failed: { bg: ERROR_MUTED, text: ERROR, icon: '❌' },
  cancelled: { bg: 'rgba(255, 255, 255, 0.04)', text: TEXT_MUTED, icon: '🚫' },
};

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'lg' }> = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.planning;
  const padding = size === 'lg' ? '6px 14px' : '3px 10px';
  const fontSize = size === 'lg' ? '13px' : '11px';

  return (
    <span
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
      <span>{config.icon}</span>
      {status}
    </span>
  );
};

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
  >
    <div style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '13px', color: TEXT_MUTED }}>{label}</div>
  </div>
);

// ============================================================================
// Progress Bar
// ============================================================================
const ProgressBar: React.FC<{ progress: number; color?: string }> = ({ progress, color = CYAN }) => (
  <div
    style={{
      width: '100%',
      height: '6px',
      background: BG_MUTED,
      borderRadius: '3px',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${Math.min(100, Math.max(0, progress * 100))}%`,
        height: '100%',
        background: color,
        borderRadius: '3px',
        transition: 'width 0.3s ease',
      }}
    />
  </div>
);

// ============================================================================
// Mission Card
// ============================================================================
interface MissionCardProps {
  mission: Mission;
  onLaunch: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  loading: boolean;
}

const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  onLaunch,
  onPause,
  onResume,
  onCancel,
  loading,
}) => {
  const teamProgress =
    mission.teams.length > 0
      ? mission.teams.reduce((sum, t) => sum + t.progress, 0) / mission.teams.length
      : 0;

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '12px',
        background: BG_PANEL,
        border: `1px solid ${BORDER}`,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: TEXT, margin: 0, marginBottom: '4px' }}>
            {mission.goal}
          </h3>
          {mission.description && (
            <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: 0 }}>{mission.description}</p>
          )}
        </div>
        <StatusBadge status={mission.status} size="lg" />
      </div>

      {/* Progress */}
      {mission.status === 'running' && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: TEXT_MUTED }}>Overall Progress</span>
            <span style={{ fontSize: '12px', color: TEXT_SECONDARY }}>{Math.round(teamProgress * 100)}%</span>
          </div>
          <ProgressBar progress={teamProgress} />
        </div>
      )}

      {/* Teams */}
      {mission.teams.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: TEXT_MUTED, marginBottom: '8px' }}>
            Teams ({mission.teams.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {mission.teams.map((team) => (
              <div
                key={team.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: BG_MUTED,
                  border: `1px solid ${BORDER}`,
                  fontSize: '12px',
                }}
              >
                <span style={{ color: TEXT_SECONDARY }}>{team.name}</span>
                <span style={{ color: TEXT_MUTED, marginLeft: '8px' }}>
                  {Math.round(team.progress * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {mission.status === 'ready' && (
          <button
            onClick={() => onLaunch(mission.id)}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: CYAN,
              color: '#000',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Launch
          </button>
        )}
        {mission.status === 'running' && (
          <button
            onClick={() => onPause(mission.id)}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: WARNING_MUTED,
              color: WARNING,
              border: `1px solid ${WARNING}33`,
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            Pause
          </button>
        )}
        {mission.status === 'paused' && (
          <button
            onClick={() => onResume(mission.id)}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: SUCCESS_MUTED,
              color: SUCCESS,
              border: `1px solid ${SUCCESS}33`,
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            Resume
          </button>
        )}
        {['ready', 'running', 'paused'].includes(mission.status) && (
          <button
            onClick={() => onCancel(mission.id)}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'transparent',
              color: ERROR,
              border: `1px solid ${ERROR}33`,
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Timestamp */}
      <div style={{ fontSize: '11px', color: TEXT_DIM, marginTop: '12px' }}>
        Created {new Date(mission.created_at).toLocaleString()}
      </div>
    </div>
  );
};

// ============================================================================
// Create Mission Form
// ============================================================================
interface CreateFormProps {
  onSubmit: (request: CreateMissionRequest) => void;
  loading: boolean;
  onCancel: () => void;
}

const CreateMissionForm: React.FC<CreateFormProps> = ({ onSubmit, loading, onCancel }) => {
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [maxTeams, setMaxTeams] = useState(3);
  const [autoPlan, setAutoPlan] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onSubmit({
      goal: goal.trim(),
      description: description.trim() || undefined,
      max_teams: maxTeams,
      auto_plan: autoPlan,
    });
  };

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '12px',
        background: BG_PANEL,
        border: `1px solid ${BORDER}`,
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: TEXT, margin: 0, marginBottom: '20px' }}>
        Create New Mission
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '6px' }}>
            Goal *
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Build a REST API with authentication"
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              background: BG_MUTED,
              border: `1px solid ${BORDER_SOLID}`,
              color: TEXT,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '6px' }}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context for the mission..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              background: BG_MUTED,
              border: `1px solid ${BORDER_SOLID}`,
              color: TEXT,
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: TEXT_SECONDARY, marginBottom: '6px' }}>
              Max Teams
            </label>
            <input
              type="number"
              value={maxTeams}
              onChange={(e) => setMaxTeams(parseInt(e.target.value) || 3)}
              min={1}
              max={5}
              style={{
                width: '80px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: BG_MUTED,
                border: `1px solid ${BORDER_SOLID}`,
                color: TEXT,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoPlan}
                onChange={(e) => setAutoPlan(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '13px', color: TEXT_SECONDARY }}>Auto-generate plan</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={loading || !goal.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              background: CYAN,
              color: '#000',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading || !goal.trim() ? 0.6 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Mission'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              background: 'transparent',
              color: TEXT_SECONDARY,
              border: `1px solid ${BORDER_SOLID}`,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// Main Dashboard
// ============================================================================
export const MissionsDashboard: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [missionsData, statsData] = await Promise.all([listMissions(), getMissionStats()]);
      setMissions(missionsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds when missions are running
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCreate = async (request: CreateMissionRequest) => {
    setActionLoading('create');
    try {
      await createMission(request);
      setShowCreateForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLaunch = async (missionId: string) => {
    setActionLoading(missionId);
    try {
      await launchMission(missionId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch mission');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (missionId: string) => {
    setActionLoading(missionId);
    try {
      await pauseMission(missionId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause mission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (missionId: string) => {
    setActionLoading(missionId);
    try {
      await resumeMission(missionId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume mission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (missionId: string) => {
    if (!confirm('Are you sure you want to cancel this mission?')) return;
    setActionLoading(missionId);
    try {
      await cancelMission(missionId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel mission');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{ height: '80px', background: BG_MUTED, borderRadius: '8px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: TEXT, margin: 0 }}>Missions</h1>
          <p style={{ fontSize: '14px', color: TEXT_MUTED, margin: '4px 0 0' }}>
            Parallel Team Orchestration
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            background: CYAN,
            color: '#000',
            border: 'none',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {showCreateForm ? 'Cancel' : '+ New Mission'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: ERROR_MUTED,
            border: `1px solid ${ERROR}33`,
            color: ERROR,
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard value={stats.total_missions} label="Total Missions" color={CYAN} />
          <StatCard value={stats.active_missions} label="Active" color={WARNING} />
          <StatCard value={stats.completed_missions} label="Completed" color={SUCCESS} />
          <StatCard value={Math.round(stats.average_efficiency * 100)} label="Efficiency %" color={PURPLE} />
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div style={{ marginBottom: '24px' }}>
          <CreateMissionForm
            onSubmit={handleCreate}
            loading={actionLoading === 'create'}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Missions List */}
      {missions.length === 0 && !showCreateForm ? (
        <NeuralEmptyState
          title="No missions yet"
          description="Create your first mission to start orchestrating parallel teams"
          icon="🎯"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onLaunch={handleLaunch}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              loading={actionLoading === mission.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
