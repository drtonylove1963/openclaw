import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { icons } from "../icons.ts";

// Mission types
export type MissionStatus = 
  | 'planning' 
  | 'ready' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type TeamStatus = 
  | 'pending' 
  | 'waiting' 
  | 'running' 
  | 'blocked' 
  | 'completed' 
  | 'failed';

export interface Team {
  id: string;
  name: string;
  mission: string;
  status: TeamStatus;
  dependencies: string[];
  progress: number;
  artifacts: Artifact[];
  created_at: string;
}

export interface Artifact {
  name: string;
  type: string;
  path: string;
  completeness: number;
  ready_at: number | null;
}

export interface Mission {
  id: string;
  goal: string;
  description: string | null;
  status: MissionStatus;
  plan: MissionPlan | null;
  teams: Team[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  success: boolean | null;
}

export interface MissionPlan {
  workstreams: Workstream[];
  critical_path: string[];
  max_parallel_teams: number;
  expected_efficiency: number;
}

export interface Workstream {
  name: string;
  description: string;
  team_composition: string[];
  estimated_duration: number;
  dependencies: string[];
}

export interface MissionStats {
  total_missions: number;
  active_missions: number;
  completed_missions: number;
  failed_missions: number;
  total_teams: number;
  active_teams: number;
  total_artifacts: number;
  average_efficiency: number;
}

export interface MissionsProps {
  missions: Mission[];
  stats: MissionStats | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreateMission: () => void;
  onLaunchMission: (id: string) => void;
  onPauseMission: (id: string) => void;
  onResumeMission: (id: string) => void;
  onCancelMission: (id: string) => void;
}

const STATUS_COLORS: Record<MissionStatus, string> = {
  planning: '#8b5cf6',
  ready: '#3b82f6',
  running: '#f59e0b',
  paused: '#6b7280',
  completed: '#22c55e',
  failed: '#ef4444',
  cancelled: '#71717a',
};

const STATUS_ICONS: Record<MissionStatus, string> = {
  planning: '📋',
  ready: '⏳',
  running: '⚡',
  paused: '⏸️',
  completed: '✅',
  failed: '❌',
  cancelled: '🚫',
};

function renderStatusBadge(status: MissionStatus) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.planning;
  const icon = STATUS_ICONS[status] || '📋';
  return html`
    <span
      class="mission-status-badge"
      style="background: ${color}22; color: ${color}; border-color: ${color}44;"
    >
      <span>${icon}</span>
      ${status}
    </span>
  `;
}

function renderProgressBar(progress: number, color = '#00d4ff') {
  return html`
    <div class="mission-progress-bar">
      <div
        class="mission-progress-fill"
        style="width: ${Math.min(100, Math.max(0, progress * 100))}%; background: ${color};"
      ></div>
    </div>
  `;
}

function renderStatCard(value: number, label: string, color: string) {
  return html`
    <div class="mission-stat-card" style="background: ${color}12; border-color: ${color}25;">
      <div class="mission-stat-value" style="color: ${color};">${value}</div>
      <div class="mission-stat-label">${label}</div>
    </div>
  `;
}

function renderMissionCard(
  mission: Mission,
  onLaunch: (id: string) => void,
  onPause: (id: string) => void,
  onResume: (id: string) => void,
  onCancel: (id: string) => void,
) {
  const teamProgress =
    mission.teams.length > 0
      ? mission.teams.reduce((sum, t) => sum + t.progress, 0) / mission.teams.length
      : 0;

  return html`
    <div class="mission-card">
      <div class="mission-card-header">
        <div class="mission-card-title">
          <h3>${mission.goal}</h3>
          ${mission.description ? html`<p>${mission.description}</p>` : nothing}
        </div>
        ${renderStatusBadge(mission.status)}
      </div>

      ${mission.status === 'running'
        ? html`
          <div class="mission-progress">
            <div class="mission-progress-header">
              <span>Overall Progress</span>
              <span>${Math.round(teamProgress * 100)}%</span>
            </div>
            ${renderProgressBar(teamProgress)}
          </div>
        `
        : nothing}

      ${mission.teams.length > 0
        ? html`
          <div class="mission-teams">
            <div class="mission-teams-label">Teams (${mission.teams.length})</div>
            <div class="mission-teams-list">
              ${mission.teams.map(
                (team) => html`
                  <div class="mission-team-chip">
                    <span>${team.name}</span>
                    <span class="mission-team-progress">${Math.round(team.progress * 100)}%</span>
                  </div>
                `,
              )}
            </div>
          </div>
        `
        : nothing}

      <div class="mission-actions">
        ${mission.status === 'ready'
          ? html`
            <button class="btn primary" @click=${() => onLaunch(mission.id)}>
              Launch
            </button>
          `
          : nothing}
        ${mission.status === 'running'
          ? html`
            <button class="btn" @click=${() => onPause(mission.id)}>
              Pause
            </button>
          `
          : nothing}
        ${mission.status === 'paused'
          ? html`
            <button class="btn" @click=${() => onResume(mission.id)}>
              Resume
            </button>
          `
          : nothing}
        ${['ready', 'running', 'paused'].includes(mission.status)
          ? html`
            <button class="btn danger" @click=${() => onCancel(mission.id)}>
              Cancel
            </button>
          `
          : nothing}
      </div>

      <div class="mission-timestamp">
        Created ${new Date(mission.created_at).toLocaleString()}
      </div>
    </div>
  `;
}

export function renderMissions(props: MissionsProps) {
  return html`
    <section class="card missions">
      <div class="missions-header">
        <div>
          <h2>Missions</h2>
          <p class="muted">Parallel Team Orchestration</p>
        </div>
        <div class="missions-header-actions">
          <button class="btn" @click=${props.onRefresh} ?disabled=${props.loading}>
            ${icons.refresh}
          </button>
          <button class="btn primary" @click=${props.onCreateMission}>
            + New Mission
          </button>
        </div>
      </div>

      ${props.error
        ? html`<div class="callout danger">${props.error}</div>`
        : nothing}

      ${props.stats
        ? html`
          <div class="mission-stats">
            ${renderStatCard(props.stats.total_missions, 'Total', '#00d4ff')}
            ${renderStatCard(props.stats.active_missions, 'Active', '#f59e0b')}
            ${renderStatCard(props.stats.completed_missions, 'Completed', '#22c55e')}
            ${renderStatCard(Math.round(props.stats.average_efficiency * 100), 'Efficiency %', '#8b5cf6')}
          </div>
        `
        : nothing}

      ${props.loading
        ? html`<div class="muted">Loading missions...</div>`
        : nothing}

      ${!props.loading && props.missions.length === 0
        ? html`
          <div class="missions-empty">
            ${icons.folder}
            <p>No missions yet</p>
            <p class="muted">Create your first mission to start orchestrating parallel teams</p>
          </div>
        `
        : nothing}

      <div class="missions-list">
        ${repeat(
          props.missions,
          (m) => m.id,
          (mission) =>
            renderMissionCard(
              mission,
              props.onLaunchMission,
              props.onPauseMission,
              props.onResumeMission,
              props.onCancelMission,
            ),
        )}
      </div>
    </section>

    <style>
      .missions {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .missions-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .missions-header h2 {
        margin: 0;
        font-size: 20px;
      }

      .missions-header-actions {
        display: flex;
        gap: 8px;
      }

      .mission-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .mission-stat-card {
        padding: 12px;
        border-radius: 6px;
        border: 1px solid;
      }

      .mission-stat-value {
        font-size: 24px;
        font-weight: 700;
      }

      .mission-stat-label {
        font-size: 12px;
        color: var(--text-muted, #71717a);
      }

      .mission-card {
        padding: 16px;
        border-radius: 8px;
        background: var(--card-bg, #141415);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
      }

      .mission-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .mission-card-title h3 {
        margin: 0;
        font-size: 16px;
      }

      .mission-card-title p {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--text-muted, #71717a);
      }

      .mission-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 500;
        border-radius: 9999px;
        border: 1px solid;
      }

      .mission-progress {
        margin-bottom: 16px;
      }

      .mission-progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 12px;
        color: var(--text-muted, #71717a);
      }

      .mission-progress-bar {
        width: 100%;
        height: 6px;
        background: var(--bg-muted, #18181b);
        border-radius: 3px;
        overflow: hidden;
      }

      .mission-progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .mission-teams {
        margin-bottom: 16px;
      }

      .mission-teams-label {
        font-size: 12px;
        color: var(--text-muted, #71717a);
        margin-bottom: 8px;
      }

      .mission-teams-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .mission-team-chip {
        padding: 6px 10px;
        border-radius: 4px;
        background: var(--bg-muted, #18181b);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        font-size: 12px;
      }

      .mission-team-progress {
        margin-left: 8px;
        color: var(--text-muted, #71717a);
      }

      .mission-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .mission-timestamp {
        font-size: 11px;
        color: var(--text-dim, #52525b);
        margin-top: 12px;
      }

      .missions-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--text-muted, #71717a);
      }

      .missions-empty svg {
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      .missions-empty p {
        margin: 0;
      }

      .btn.primary {
        background: #00d4ff;
        color: #000;
      }

      .btn.danger {
        background: transparent;
        color: #ef4444;
        border-color: #ef444444;
      }
    </style>
  `;
}
