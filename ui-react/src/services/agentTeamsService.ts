/**
 * Agent Teams API Service
 * Handles all communication with /api/v1/agent-teams endpoints.
 */
import { API_BASE_URL } from '../config/api';
import type {
  Workflow,
  WorkflowTask,
  TeamPlan,
  TeamMessage,
  WorkflowStatus,
  TeamMetrics,
  CreateWorkflowRequest,
  CreateWorkflowResponse,
  ClaimTaskRequest,
  CompleteTaskRequest,
  FailTaskRequest,
  ComposeRequest,
  SendMessageRequest,
  SavedTeam,
  ProjectSession,
  CrossTeamMessage,
  CrossTeamDependency,
  TeamRegistration,
  CreateProjectRequest,
  RegisterTeamRequest,
  CrossTeamMessageRequest,
  AddDependencyRequest,
} from '../types/agentTeams';

const BASE = `${API_BASE_URL}/api/v1/agent-teams`;
const TOKEN_KEY = 'pronetheia_token';
const SAVED_TEAMS_KEY = 'pronetheia-agent-teams';

class AgentTeamsService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }
    return response.json();
  }

  // ============================================================================
  // COMPOSE (Natural Language -> Team Plan)
  // ============================================================================

  async compose(intent: string): Promise<TeamPlan> {
    return this.request<TeamPlan>(`${BASE}/compose`, {
      method: 'POST',
      body: JSON.stringify({ intent } as ComposeRequest),
    });
  }

  // ============================================================================
  // WORKFLOWS
  // ============================================================================

  async createWorkflow(data: CreateWorkflowRequest): Promise<CreateWorkflowResponse> {
    return this.request<CreateWorkflowResponse>(`${BASE}/workflows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    return this.request<Workflow>(`${BASE}/workflows/${workflowId}`);
  }

  async listWorkflows(sessionId?: string): Promise<Workflow[]> {
    const params = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
    const result = await this.request<{ workflows: Workflow[] }>(`${BASE}/workflows${params}`);
    return result.workflows;
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    await this.request(`${BASE}/workflows/${workflowId}`, { method: 'DELETE' });
  }

  async getWorkflowPlan(workflowId: string): Promise<string> {
    const result = await this.request<{ plan: string }>(`${BASE}/workflows/${workflowId}/plan`);
    return result.plan;
  }

  // ============================================================================
  // TASKS
  // ============================================================================

  async getReadyTasks(workflowId: string, agentType?: string): Promise<WorkflowTask[]> {
    const params = agentType ? `?agent_type=${encodeURIComponent(agentType)}` : '';
    const result = await this.request<{ tasks: WorkflowTask[] }>(
      `${BASE}/workflows/${workflowId}/tasks/ready${params}`
    );
    return result.tasks;
  }

  async claimTask(workflowId: string, data: ClaimTaskRequest): Promise<WorkflowTask> {
    return this.request<WorkflowTask>(`${BASE}/workflows/${workflowId}/tasks/claim`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startTask(taskId: string): Promise<void> {
    await this.request(`${BASE}/tasks/${taskId}/start`, { method: 'POST' });
  }

  async completeTask(taskId: string, data: CompleteTaskRequest): Promise<{ unblocked: string[] }> {
    return this.request(`${BASE}/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async failTask(taskId: string, data: FailTaskRequest): Promise<void> {
    await this.request(`${BASE}/tasks/${taskId}/fail`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTask(taskId: string): Promise<WorkflowTask> {
    return this.request<WorkflowTask>(`${BASE}/tasks/${taskId}`);
  }

  // ============================================================================
  // MESSAGING
  // ============================================================================

  async sendMessage(data: SendMessageRequest): Promise<TeamMessage> {
    return this.request<TeamMessage>(`${BASE}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInbox(
    workflowId: string,
    agentId?: string,
    agentType?: string,
    unreadOnly = false,
    limit = 50
  ): Promise<TeamMessage[]> {
    const params = new URLSearchParams({ workflow_id: workflowId, limit: String(limit) });
    if (agentId) {params.set('agent_id', agentId);}
    if (agentType) {params.set('agent_type', agentType);}
    if (unreadOnly) {params.set('unread_only', 'true');}
    const result = await this.request<{ messages: TeamMessage[] }>(`${BASE}/messages/inbox?${params}`);
    return result.messages;
  }

  async getThread(messageId: string): Promise<TeamMessage[]> {
    const result = await this.request<{ messages: TeamMessage[] }>(`${BASE}/messages/${messageId}/thread`);
    return result.messages;
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    return this.request<WorkflowStatus>(`${BASE}/dashboard/status/${workflowId}`);
  }

  async getMetrics(): Promise<TeamMetrics> {
    return this.request<TeamMetrics>(`${BASE}/metrics`);
  }

  /**
   * Subscribe to real-time workflow events via SSE.
   * Returns an EventSource that emits dashboard events.
   */
  subscribeToWorkflow(workflowId: string, onEvent: (event: MessageEvent) => void): EventSource {
    const source = new EventSource(`${BASE}/dashboard/stream/${workflowId}`);

    // Listen for all event types
    const eventTypes = [
      'task_created', 'task_claimed', 'task_started',
      'task_completed', 'task_failed', 'task_blocked',
      'peer_message', 'escalation',
      'workflow_completed', 'workflow_cancelled',
      'heartbeat',
    ];

    for (const type of eventTypes) {
      source.addEventListener(type, onEvent);
    }

    // Also catch generic messages
    source.onmessage = onEvent;

    return source;
  }

  // ============================================================================
  // MULTI-TEAM ORCHESTRATION (Projects)
  // ============================================================================

  async createProject(data: CreateProjectRequest): Promise<ProjectSession> {
    return this.request<ProjectSession>(`${BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listProjects(): Promise<ProjectSession[]> {
    const result = await this.request<{ projects: ProjectSession[] }>(`${BASE}/projects`);
    return result.projects;
  }

  async getProject(projectId: string): Promise<ProjectSession> {
    return this.request<ProjectSession>(`${BASE}/projects/${projectId}`);
  }

  async registerTeam(projectId: string, data: RegisterTeamRequest): Promise<TeamRegistration> {
    return this.request<TeamRegistration>(`${BASE}/projects/${projectId}/teams`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendCrossTeamMessage(projectId: string, data: CrossTeamMessageRequest): Promise<CrossTeamMessage> {
    const result = await this.request<CrossTeamMessage>(`${BASE}/projects/${projectId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  }

  async broadcastToTeams(
    projectId: string,
    sourceTeamId: string,
    senderAgent: string,
    senderType: string,
    subject: string,
    body: string,
    payload?: Record<string, unknown>,
  ): Promise<{ messages_sent: number }> {
    return this.request(`${BASE}/projects/${projectId}/broadcast`, {
      method: 'POST',
      body: JSON.stringify({
        source_team_id: sourceTeamId,
        sender_agent: senderAgent,
        sender_type: senderType,
        subject,
        body,
        payload,
      }),
    });
  }

  async getCrossTeamMessages(
    projectId: string,
    teamId?: string,
    limit = 50,
  ): Promise<CrossTeamMessage[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (teamId) {params.set('team_id', teamId);}
    const result = await this.request<{ messages: CrossTeamMessage[] }>(
      `${BASE}/projects/${projectId}/messages?${params}`,
    );
    return result.messages;
  }

  async addDependency(projectId: string, data: AddDependencyRequest): Promise<CrossTeamDependency> {
    return this.request<CrossTeamDependency>(`${BASE}/projects/${projectId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDependencies(projectId: string, teamId?: string): Promise<CrossTeamDependency[]> {
    const params = teamId ? `?team_id=${encodeURIComponent(teamId)}` : '';
    const result = await this.request<{ dependencies: CrossTeamDependency[] }>(
      `${BASE}/projects/${projectId}/dependencies${params}`,
    );
    return result.dependencies;
  }

  async satisfyDependency(projectId: string, dependencyId: string): Promise<{ status: string; satisfied_at: string }> {
    return this.request(`${BASE}/projects/${projectId}/dependencies/${dependencyId}/satisfy`, {
      method: 'POST',
    });
  }

  async completeTeam(projectId: string, teamId: string): Promise<void> {
    await this.request(`${BASE}/projects/${projectId}/teams/${teamId}/complete`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // SAVED TEAMS (localStorage)
  // ============================================================================

  getSavedTeams(): SavedTeam[] {
    try {
      const stored = localStorage.getItem(SAVED_TEAMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveTeam(team: SavedTeam): void {
    const teams = this.getSavedTeams();
    const idx = teams.findIndex((t) => t.id === team.id);
    if (idx >= 0) {
      teams[idx] = team;
    } else {
      teams.push(team);
    }
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
  }

  deleteTeam(teamId: string): void {
    const teams = this.getSavedTeams().filter((t) => t.id !== teamId);
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
  }

  // ==========================================================================
  // Agent Team Skills Integration
  // ==========================================================================

  /**
   * Get skills assigned to an agent for team mode.
   */
  async getAgentTeamSkills(agentSlug: string): Promise<{
    agent_slug: string;
    agent_name: string;
    skill_ids: string[];
    skill_count: number;
    has_skills: boolean;
  }> {
    const response = await fetch(`${BASE}/agents/${agentSlug}/team-skills`);
    if (!response.ok) {throw new Error('Failed to get agent team skills');}
    return response.json();
  }

  /**
   * Execute agent skills for a team task.
   * Called after a task is claimed to auto-run the agent's assigned skills.
   */
  async executeTaskSkills(
    taskId: string,
    agentSlug: string,
    taskDescription: string = '',
    autoExecuteAll: boolean = true,
    skillIds: string[] = [],
  ): Promise<{
    task_id: string;
    agent_slug: string;
    skills_executed: number;
    successful: number;
    failed: number;
    results: Array<{
      skill_id: string;
      success: boolean;
      duration_ms: number;
      result?: unknown;
      error?: string;
    }>;
    message: string;
  }> {
    const response = await fetch(`${BASE}/tasks/${taskId}/execute-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_slug: agentSlug,
        task_id: taskId,
        task_description: taskDescription,
        auto_execute_all: autoExecuteAll,
        skill_ids: skillIds,
      }),
    });
    if (!response.ok) {throw new Error('Failed to execute task skills');}
    return response.json();
  }
}

export const agentTeamsService = new AgentTeamsService();
export default agentTeamsService;
