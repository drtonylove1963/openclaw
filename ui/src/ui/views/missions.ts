import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { icons } from "../icons.ts";

// API config for templates
const API_BASE = 'https://api.pronetheia.com';
const GATEWAY_SECRET = '01c1b66797fa9f84e794ed313bb5d1aa4b0add96e216723725b8c88b8e6c57eb';

// Template summary type
interface TemplateSummary {
  id: string;
  name: string;
  category: string;
  team_count: number;
  estimated_hours: number;
}

// Mission types
export type MissionStatus =
  | "draft"
  | "planning"
  | "ready"
  | "active"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type TeamStatus =
  | "pending"
  | "waiting"
  | "working"
  | "running"
  | "blocked"
  | "completed"
  | "failed";

export interface Team {
  id: string;
  name: string;
  role: string;
  mission: string;
  status: TeamStatus;
  capabilities: string[];
  dependencies: string[];
  progress: number;
  artifacts: Artifact[];
  current_task?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Artifact {
  id: string;
  name: string;
  type: string;
  path: string;
  size_bytes: number;
  created_at: string;
}

export interface Mission {
  id: string;
  name: string;
  goal: string;
  objective: string;
  description: string | null;
  status: MissionStatus;
  plan: MissionPlan | null;
  teams: Team[];
  progress: number;
  created_at: string;
  started_at: string | null;
  launched_at?: string;
  completed_at: string | null;
  success: boolean | null;
  config?: MissionConfig;
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

export interface MissionConfig {
  max_duration_minutes?: number;
  assistance_timeout_seconds?: number;
  max_teams?: number;
}

export interface MissionStats {
  launcher: {
    active_missions: number;
    active_teams: number;
    message_bus: {
      total_sent: number;
      total_blocked: number;
      active_subscribers: number;
    };
    artifact_streamer: {
      total_published: number;
      active_artifacts: number;
    };
    assistance_protocol: {
      total_requests: number;
      pending_requests: number;
      response_rate: number;
    };
  };
  total_missions?: number;
  completed_missions?: number;
  average_efficiency?: number;
}

export interface AssistanceRequest {
  id: string;
  team_id: string;
  mission_id: string;
  type: "decision" | "clarification" | "blocker" | "approval" | "review";
  priority: "low" | "medium" | "high" | "critical";
  question: string;
  context?: string;
  options?: { value: string; pros?: string[]; cons?: string[] }[];
  status: "pending" | "responded" | "timeout";
  created_at: string;
  expires_at: string;
}

export interface MissionsProps {
  missions: Mission[];
  stats: MissionStats | null;
  assistanceRequests: AssistanceRequest[];
  loading: boolean;
  error: string | null;
  showCreateForm: boolean;
  templates?: TemplateSummary[];
  selectedTemplateId?: string;
  onRefresh: () => void;
  onCreateMission: () => void;
  onCancelCreate: () => void;
  onSubmitMission: (mission: Partial<Mission> & { template_id?: string; auto_plan?: boolean }) => void;
  onLaunchMission: (id: string) => void;
  onPauseMission: (id: string) => void;
  onResumeMission: (id: string) => void;
  onCancelMission: (id: string) => void;
  onViewMission: (id: string) => void;
  onRespondToAssistance: (requestId: string, response: string) => void;
  onSelectTemplate?: (templateId: string) => void;
}

const STATUS_COLORS: Record<MissionStatus, string> = {
  draft: "#6b7280",
  planning: "#8b5cf6",
  ready: "#3b82f6",
  active: "#f59e0b",
  running: "#f59e0b",
  paused: "#eab308",
  completed: "#22c55e",
  failed: "#ef4444",
  cancelled: "#71717a",
};

const STATUS_ICONS: Record<MissionStatus, string> = {
  draft: "📝",
  planning: "📋",
  ready: "⏳",
  active: "⚡",
  running: "⚡",
  paused: "⏸️",
  completed: "✅",
  failed: "❌",
  cancelled: "🚫",
};

const TEAM_STATUS_COLORS: Record<TeamStatus, string> = {
  pending: "#6b7280",
  waiting: "#eab308",
  working: "#3b82f6",
  running: "#3b82f6",
  blocked: "#ef4444",
  completed: "#22c55e",
  failed: "#ef4444",
};

function renderStatusBadge(status: MissionStatus) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.draft;
  const icon = STATUS_ICONS[status] || "📋";
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

function renderProgressBar(progress: number, color = "#00d4ff") {
  return html`
    <div class="mission-progress-bar">
      <div
        class="mission-progress-fill"
        style="width: ${Math.min(100, Math.max(0, progress * 100))}%; background: ${color};"
      ></div>
    </div>
  `;
}

function renderStatCard(value: number | string, label: string, color: string, icon?: string) {
  return html`
    <div class="mission-stat-card" style="background: ${color}12; border-color: ${color}25;">
      ${icon ? html`<div class="mission-stat-icon">${icon}</div>` : nothing}
      <div class="mission-stat-value" style="color: ${color};">${value}</div>
      <div class="mission-stat-label">${label}</div>
    </div>
  `;
}

function renderTeamStatusDot(status: TeamStatus) {
  const color = TEAM_STATUS_COLORS[status] || TEAM_STATUS_COLORS.pending;
  return html`
    <span class="team-status-dot" style="background: ${color};" title=${status}></span>
  `;
}

function renderAssistanceRequest(
  request: AssistanceRequest,
  onRespond: (requestId: string, response: string) => void,
) {
  const priorityColors = {
    low: "#6b7280",
    medium: "#eab308",
    high: "#f97316",
    critical: "#ef4444",
  };

  const color = priorityColors[request.priority] || priorityColors.medium;

  return html`
    <div class="assistance-request-card">
      <div class="assistance-header">
        <span class="assistance-priority" style="background: ${color}22; color: ${color};">
          ${request.priority.toUpperCase()}
        </span>
        <span class="assistance-type">${request.type}</span>
        <span class="assistance-time">${new Date(request.created_at).toLocaleTimeString()}</span>
      </div>
      <div class="assistance-question">${request.question}</div>
      ${
        request.options && request.options.length > 0
          ? html`
          <div class="assistance-options">
            ${request.options.map(
              (opt) => html`
              <button 
                class="assistance-option-btn"
                @click=${() => onRespond(request.id, opt.value)}
              >
                ${opt.value}
              </button>
            `,
            )}
          </div>
        `
          : html`
          <div class="assistance-input">
            <input type="text" placeholder="Type your response..." id="response-${request.id}" />
            <button 
              class="btn primary small"
              @click=${() => {
                const input = document.getElementById(`response-${request.id}`) as HTMLInputElement;
                if (input?.value) {
                  onRespond(request.id, input.value);
                }
              }}
            >
              Send
            </button>
          </div>
        `
      }
    </div>
  `;
}

function renderCreateMissionForm(props: MissionsProps) {
  const templates = props.templates || [];
  const selectedTemplate = props.selectedTemplateId 
    ? templates.find(t => t.id === props.selectedTemplateId) 
    : null;

  return html`
    <div class="create-mission-overlay">
      <div class="create-mission-modal">
        <div class="modal-header">
          <h3>Create New Mission</h3>
          <button class="btn icon" @click=${props.onCancelCreate}>✕</button>
        </div>
        <form id="create-mission-form" @submit=${(e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const templateId = formData.get("template_id") as string;
          const autoPlan = formData.get("auto_plan") === "on";
          
          props.onSubmitMission({
            name: formData.get("name") as string,
            goal: formData.get("objective") as string,
            objective: formData.get("objective") as string,
            description: formData.get("description") as string,
            template_id: templateId || undefined,
            auto_plan: autoPlan || !templateId, // Auto-plan if no template or explicitly requested
            config: {
              max_duration_minutes: parseInt(formData.get("max_duration") as string) || 60,
              assistance_timeout_seconds:
                parseInt(formData.get("assistance_timeout") as string) || 300,
            },
          });
        }}>
          <div class="form-group">
            <label for="template_id">Template (optional)</label>
            <select id="template_id" name="template_id" @change=${(e: Event) => {
              const select = e.target as HTMLSelectElement;
              if (props.onSelectTemplate) {
                props.onSelectTemplate(select.value);
              }
            }}>
              <option value="">-- No Template (Auto-Plan) --</option>
              ${templates.map(t => html`
                <option value=${t.id} ?selected=${props.selectedTemplateId === t.id}>
                  ${t.name} (${t.team_count} teams, ~${t.estimated_hours}h)
                </option>
              `)}
            </select>
            ${selectedTemplate ? html`
              <div class="template-info">
                <span class="template-category">${selectedTemplate.category}</span>
                <span class="template-teams">${selectedTemplate.team_count} teams</span>
                <span class="template-hours">~${selectedTemplate.estimated_hours}h</span>
              </div>
            ` : nothing}
          </div>
          <div class="form-group">
            <label for="name">Mission Name</label>
            <input type="text" id="name" name="name" required placeholder="e.g., Build Authentication Feature" />
          </div>
          <div class="form-group">
            <label for="objective">Objective</label>
            <textarea id="objective" name="objective" required placeholder="Describe what needs to be accomplished..." rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="description">Description (optional)</label>
            <textarea id="description" name="description" placeholder="Additional context or requirements..." rows="2"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="max_duration">Max Duration (minutes)</label>
              <input type="number" id="max_duration" name="max_duration" value="60" min="5" max="480" />
            </div>
            <div class="form-group">
              <label for="assistance_timeout">Assistance Timeout (seconds)</label>
              <input type="number" id="assistance_timeout" name="assistance_timeout" value="300" min="30" max="900" />
            </div>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="auto_plan" name="auto_plan" ?checked=${!props.selectedTemplateId} />
              <span>Enable Auto-Planning (adds teams automatically based on goal)</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn" @click=${props.onCancelCreate}>Cancel</button>
            <button type="submit" class="btn primary">Create Mission</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderMissionCard(
  mission: Mission,
  onLaunch: (id: string) => void,
  onPause: (id: string) => void,
  onResume: (id: string) => void,
  onCancel: (id: string) => void,
  onView: (id: string) => void,
) {
  // Handle both full mission objects and list summaries (which have team_count instead of teams)
  const teams = mission.teams || [];
  const teamCount = (mission as unknown as { team_count?: number }).team_count ?? teams.length;

  const teamProgress =
    mission.progress ||
    (teams.length > 0 ? teams.reduce((sum, t) => sum + t.progress, 0) / teams.length : 0);

  const activeTeams = teams.filter((t) => t.status === "working" || t.status === "running").length;
  const completedTeams = teams.filter((t) => t.status === "completed").length;

  return html`
    <div class="mission-card" @click=${() => onView(mission.id)}>
      <div class="mission-card-header">
        <div class="mission-card-title">
          <h3>${mission.name || mission.goal}</h3>
          ${mission.description ? html`<p>${mission.description}</p>` : nothing}
        </div>
        ${renderStatusBadge(mission.status)}
      </div>

      ${
        ["active", "running"].includes(mission.status)
          ? html`
          <div class="mission-progress">
            <div class="mission-progress-header">
              <span>Progress</span>
              <span>${Math.round(teamProgress * 100)}%</span>
            </div>
            ${renderProgressBar(teamProgress)}
          </div>
        `
          : nothing
      }

      <div class="mission-meta">
        <div class="mission-meta-item">
          <span class="meta-label">Teams:</span>
          <span class="meta-value">${completedTeams}/${teamCount} complete</span>
        </div>
        ${
          activeTeams > 0
            ? html`
            <div class="mission-meta-item">
              <span class="meta-label">Active:</span>
              <span class="meta-value">${activeTeams}</span>
            </div>
          `
            : nothing
        }
        ${
          mission.config?.max_duration_minutes
            ? html`
            <div class="mission-meta-item">
              <span class="meta-label">Max Time:</span>
              <span class="meta-value">${mission.config.max_duration_minutes}m</span>
            </div>
          `
            : nothing
        }
      </div>

      ${
        teams.length > 0
          ? html`
          <div class="mission-teams">
            <div class="mission-teams-label">Teams</div>
            <div class="mission-teams-list">
              ${teams.slice(0, 5).map(
                (team) => html`
                  <div class="mission-team-chip" title="${team.name}: ${team.status}">
                    ${renderTeamStatusDot(team.status)}
                    <span>${team.name}</span>
                    ${
                      team.progress > 0
                        ? html`<span class="mission-team-progress">${Math.round(team.progress * 100)}%</span>`
                        : nothing
                    }
                  </div>
                `,
              )}
              ${
                teams.length > 5
                  ? html`<span class="more-teams">+${teams.length - 5} more</span>`
                  : nothing
              }
            </div>
          </div>
        `
          : nothing
      }

      <div class="mission-actions" @click=${(e: Event) => e.stopPropagation()}>
        ${
          ["draft", "planning", "ready"].includes(mission.status)
            ? html`
            <button class="btn primary" @click=${() => onLaunch(mission.id)}>
              ⚡ Launch
            </button>
          `
            : nothing
        }
        ${
          ["active", "running"].includes(mission.status)
            ? html`
            <button class="btn" @click=${() => onPause(mission.id)}>
              ⏸️ Pause
            </button>
          `
            : nothing
        }
        ${
          mission.status === "paused"
            ? html`
            <button class="btn primary" @click=${() => onResume(mission.id)}>
              ▶️ Resume
            </button>
          `
            : nothing
        }
        ${
          ["draft", "planning", "ready", "active", "running", "paused"].includes(mission.status)
            ? html`
            <button class="btn danger" @click=${() => onCancel(mission.id)}>
              ✕ Cancel
            </button>
          `
            : nothing
        }
      </div>

      ${
        mission.created_at
          ? html`
          <div class="mission-timestamp">
            Created ${new Date(mission.created_at).toLocaleString()}
            ${
              mission.launched_at
                ? html` • Launched ${new Date(mission.launched_at).toLocaleString()}`
                : nothing
            }
          </div>
        `
          : nothing
      }
    </div>
  `;
}

export function renderMissions(props: MissionsProps) {
  const launcherStats = props.stats?.launcher;

  return html`
    <section class="card missions">
      <div class="missions-header">
        <div>
          <h2>🚀 Missions</h2>
          <p class="muted">Parallel Team Orchestration</p>
        </div>
        <div class="missions-header-actions">
          <button class="btn" @click=${props.onRefresh} ?disabled=${props.loading} title="Refresh">
            ${icons.refresh}
          </button>
          <button class="btn primary" @click=${props.onCreateMission}>
            + New Mission
          </button>
        </div>
      </div>

      ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}

      ${
        props.stats
          ? html`
          <div class="mission-stats">
            ${renderStatCard(launcherStats?.active_missions || 0, "Active", "#f59e0b", "⚡")}
            ${renderStatCard(launcherStats?.active_teams || 0, "Teams", "#3b82f6", "👥")}
            ${renderStatCard(launcherStats?.artifact_streamer?.total_published || 0, "Artifacts", "#8b5cf6", "📦")}
            ${renderStatCard(
              launcherStats?.assistance_protocol?.pending_requests || 0,
              "Assistance",
              launcherStats?.assistance_protocol?.pending_requests > 0 ? "#ef4444" : "#22c55e",
              "❓",
            )}
          </div>
        `
          : nothing
      }

      ${
        props.assistanceRequests.length > 0
          ? html`
          <div class="assistance-section">
            <h3>⚠️ Assistance Requests (${props.assistanceRequests.length})</h3>
            <div class="assistance-list">
              ${props.assistanceRequests.map((req) =>
                renderAssistanceRequest(req, props.onRespondToAssistance),
              )}
            </div>
          </div>
        `
          : nothing
      }

      ${
        props.loading
          ? html`
              <div class="loading-indicator"><span class="spinner"></span> Loading missions...</div>
            `
          : nothing
      }

      ${
        !props.loading && props.missions.length === 0
          ? html`
          <div class="missions-empty">
            <div class="empty-icon">${icons.folder}</div>
            <p>No missions yet</p>
            <p class="muted">Create your first mission to start orchestrating parallel teams</p>
            <button class="btn primary" @click=${props.onCreateMission}>
              + Create Mission
            </button>
          </div>
        `
          : nothing
      }

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
              props.onViewMission,
            ),
        )}
      </div>

      ${props.showCreateForm ? renderCreateMissionForm(props) : nothing}
    </section>

    <style>
      .missions {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .missions-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .missions-header h2 {
        margin: 0;
        font-size: 24px;
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
        padding: 16px;
        border-radius: 8px;
        border: 1px solid;
        text-align: center;
      }

      .mission-stat-icon {
        font-size: 20px;
        margin-bottom: 8px;
      }

      .mission-stat-value {
        font-size: 28px;
        font-weight: 700;
      }

      .mission-stat-label {
        font-size: 12px;
        color: var(--text-muted, #71717a);
        margin-top: 4px;
      }

      .assistance-section {
        background: var(--card-bg, #141415);
        border: 1px solid #f9731644;
        border-radius: 8px;
        padding: 16px;
      }

      .assistance-section h3 {
        margin: 0 0 12px;
        font-size: 14px;
      }

      .assistance-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .assistance-request-card {
        background: var(--bg-muted, #18181b);
        border-radius: 6px;
        padding: 12px;
      }

      .assistance-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .assistance-priority {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
      }

      .assistance-type {
        font-size: 12px;
        color: var(--text-muted, #71717a);
      }

      .assistance-time {
        margin-left: auto;
        font-size: 11px;
        color: var(--text-dim, #52525b);
      }

      .assistance-question {
        font-size: 14px;
        margin-bottom: 12px;
      }

      .assistance-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .assistance-option-btn {
        padding: 8px 16px;
        background: var(--bg, #0a0a0b);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        border-radius: 4px;
        color: inherit;
        cursor: pointer;
        font-size: 13px;
      }

      .assistance-option-btn:hover {
        background: var(--bg-hover, #141415);
        border-color: #00d4ff44;
      }

      .assistance-input {
        display: flex;
        gap: 8px;
      }

      .assistance-input input {
        flex: 1;
        padding: 8px 12px;
        background: var(--bg, #0a0a0b);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        border-radius: 4px;
        color: inherit;
        font-size: 13px;
      }

      .mission-card {
        padding: 20px;
        border-radius: 8px;
        background: var(--card-bg, #141415);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        cursor: pointer;
        transition: border-color 0.2s, transform 0.1s;
      }

      .mission-card:hover {
        border-color: #00d4ff44;
        transform: translateY(-1px);
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
        text-transform: uppercase;
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
        height: 8px;
        background: var(--bg-muted, #18181b);
        border-radius: 4px;
        overflow: hidden;
      }

      .mission-progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .mission-meta {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
        font-size: 12px;
      }

      .mission-meta-item {
        display: flex;
        gap: 4px;
      }

      .meta-label {
        color: var(--text-muted, #71717a);
      }

      .meta-value {
        font-weight: 500;
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
        align-items: center;
      }

      .mission-team-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 4px;
        background: var(--bg-muted, #18181b);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        font-size: 12px;
      }

      .team-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .mission-team-progress {
        color: var(--text-muted, #71717a);
        font-size: 11px;
      }

      .more-teams {
        font-size: 12px;
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
        padding: 60px;
        color: var(--text-muted, #71717a);
        text-align: center;
      }

      .empty-icon {
        opacity: 0.5;
        margin-bottom: 16px;
      }

      .empty-icon svg {
        width: 64px;
        height: 64px;
      }

      .missions-empty p {
        margin: 0 0 8px;
      }

      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 20px;
        color: var(--text-muted, #71717a);
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--border, rgba(255, 255, 255, 0.1));
        border-top-color: #00d4ff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Create Mission Modal */
      .create-mission-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .create-mission-modal {
        background: var(--card-bg, #141415);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        border-radius: 12px;
        padding: 24px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 18px;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        font-size: 13px;
        color: var(--text-muted, #71717a);
        margin-bottom: 6px;
      }

      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        background: var(--bg, #0a0a0b);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        border-radius: 6px;
        color: inherit;
        font-size: 14px;
        font-family: inherit;
      }

      .form-group input:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #00d4ff;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .template-info {
        display: flex;
        gap: 12px;
        margin-top: 8px;
        font-size: 12px;
      }

      .template-info span {
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--bg-muted, #27272a);
      }

      .template-category {
        color: var(--accent, #ff5c5c);
      }

      .checkbox-group {
        margin-top: 8px;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
      }

      .checkbox-label input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin: 0;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
      }

      .btn {
        padding: 8px 16px;
        border-radius: 6px;
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        background: var(--bg, #0a0a0b);
        color: inherit;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
      }

      .btn:hover {
        background: var(--bg-hover, #141415);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn.primary {
        background: #00d4ff;
        color: #000;
        border-color: #00d4ff;
      }

      .btn.primary:hover {
        background: #00b8e6;
      }

      .btn.danger {
        color: #ef4444;
        border-color: #ef444444;
      }

      .btn.danger:hover {
        background: #ef444422;
      }

      .btn.icon {
        padding: 8px;
        line-height: 1;
      }

      .btn.small {
        padding: 6px 12px;
        font-size: 12px;
      }

      @media (max-width: 768px) {
        .mission-stats {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
}
