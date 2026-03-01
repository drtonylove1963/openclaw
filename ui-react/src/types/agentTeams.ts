/**
 * TypeScript types for Agent Teams v2
 * Covers team configuration, workflows, tasks, messaging, and dashboard events.
 */

// ============================================================================
// TEAM CONFIGURATION
// ============================================================================

export interface AgentTeamMember {
  agent_type: string;
  agent_name?: string;
  role?: string;
}

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  members: AgentTeamMember[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TASK & WORKFLOW TYPES
// ============================================================================

export type TaskStatus = 'pending' | 'ready' | 'claimed' | 'in_progress' | 'completed' | 'failed' | 'blocked' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TaskDefinition {
  title: string;
  agent_type: string;
  action: string;
  depends_on: number[];
  priority?: TaskPriority;
  input_data?: Record<string, unknown>;
  max_retries?: number;
}

export interface WorkflowTask {
  id: string;
  workflow_id: string;
  title: string;
  description?: string;
  agent_type: string;
  action: string;
  status: TaskStatus;
  priority: TaskPriority;
  claimed_by?: string;
  claimed_at?: string;
  depends_on: string[];
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  tokens_used: number;
  execution_time: number;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  session_id: string;
  workflow_type: string;
  original_intent?: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  total_tokens: number;
  total_time: number;
  tasks: WorkflowTask[];
  created_at: string;
  updated_at: string;
  progress_pct: number;
  is_complete: boolean;
}

// ============================================================================
// COMPOSE (NL -> TEAM PLAN)
// ============================================================================

export interface TeamPlan {
  workflow_type: string;
  original_intent: string;
  tasks: TaskDefinition[];
  parallel_groups: number[][];
  reasoning: string;
  confidence: number;
  task_count: number;
}

// ============================================================================
// MESSAGING
// ============================================================================

export type MessageType = 'query' | 'response' | 'clarification' | 'escalation' | 'status_update' | 'handoff';
export type MessagePriority = 'urgent' | 'normal' | 'low';

export interface TeamMessage {
  id: string;
  workflow_id: string;
  sender_agent: string;
  sender_type: string;
  target_agent?: string;
  target_type?: string;
  message_type: MessageType;
  subject?: string;
  body: string;
  priority: MessagePriority;
  read: boolean;
  read_at?: string;
  reply_to?: string;
  related_task_id?: string;
  created_at: string;
}

// ============================================================================
// DASHBOARD SSE EVENTS
// ============================================================================

export interface TeamDashboardEvent {
  type: string;
  data: Record<string, unknown>;
  id: string;
  timestamp: string;
}

export interface AgentState {
  agent_id: string;
  agent_type: string;
  status: 'idle' | 'working' | 'error';
  current_task?: string;
  tasks_completed: number;
  tokens_used: number;
  last_update: string;
}

export interface WorkflowStatus {
  workflow_id: string;
  agents: Record<string, AgentState>;
  recent_events: TeamDashboardEvent[];
}

export interface TeamMetrics {
  tasks: {
    workflows_created: number;
    tasks_completed: number;
    tasks_failed: number;
    db_errors: number;
  };
  messaging: {
    messages_sent: number;
    broadcasts: number;
    escalations: number;
  };
  dashboard: {
    events_pushed: number;
    events_dropped: number;
    active_subscribers: number;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateWorkflowRequest {
  session_id: string;
  workflow_type: string;
  original_intent?: string;
  tasks: TaskDefinition[];
}

export interface CreateWorkflowResponse {
  workflow_id: string;
  task_count: number;
}

export interface ClaimTaskRequest {
  agent_type: string;
  agent_id: string;
}

export interface CompleteTaskRequest {
  output_data?: Record<string, unknown>;
  tokens_used?: number;
  execution_time?: number;
}

export interface FailTaskRequest {
  error_message: string;
  retry?: boolean;
}

export interface ComposeRequest {
  intent: string;
}

export interface SendMessageRequest {
  workflow_id: string;
  sender_agent: string;
  sender_type: string;
  body: string;
  target_agent?: string;
  target_type?: string;
  message_type?: MessageType;
  subject?: string;
  priority?: MessagePriority;
}

// ============================================================================
// TEAM WORKFLOW EXECUTION (Chat Integration)
// ============================================================================

export type TeamStreamEventType =
  | 'team_workflow_started'
  | 'team_task_claimed'
  | 'team_task_started'
  | 'team_task_completed'
  | 'team_task_failed'
  | 'team_message'
  | 'team_escalation'
  | 'team_workflow_completed'
  | 'team_workflow_failed'
  | 'team_progress_update';

export interface TeamStreamEvent {
  type: TeamStreamEventType;
  workflow_id: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// SAVED TEAMS (localStorage)
// ============================================================================

export interface SavedTeam {
  id: string;
  name: string;
  description: string;
  members: AgentTeamMember[];
  created_at: string;
}

// ============================================================================
// MULTI-TEAM ORCHESTRATION
// ============================================================================

export type TeamRole = 'backend' | 'frontend' | 'database' | 'testing' | 'devops' | 'design' | 'custom';

export interface TeamRegistration {
  team_id: string;
  team_name: string;
  role: TeamRole;
  agent_types: string[];
  workflow_id: string;
  status: 'active' | 'completed' | 'failed';
}

export interface ProjectSession {
  project_id: string;
  name: string;
  description: string;
  session_id: string;
  status: 'active' | 'completed';
  team_count: number;
  active_teams: number;
  teams: TeamRegistration[];
  dependencies: {
    total: number;
    satisfied: number;
    pending: number;
  };
  cross_team_messages: number;
  created_at: string;
  updated_at: string;
}

export interface CrossTeamMessage {
  id: string;
  source_team_id: string;
  source_team_name: string;
  target_team_id: string;
  target_team_name: string;
  sender_agent: string;
  sender_type: string;
  subject: string;
  body: string;
  message_type: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface CrossTeamDependency {
  id: string;
  source_team_id: string;
  target_team_id: string;
  source_task_pattern: string;
  target_task_pattern: string;
  status: 'pending' | 'satisfied' | 'failed';
  satisfied_at?: string;
}

// Multi-team API request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  session_id?: string;
}

export interface RegisterTeamRequest {
  team_name: string;
  role: TeamRole;
  agent_types: string[];
  workflow_id: string;
}

export interface CrossTeamMessageRequest {
  source_team_id: string;
  target_team_id: string;
  sender_agent: string;
  sender_type: string;
  subject: string;
  body: string;
  message_type?: string;
  target_type?: string;
  priority?: string;
  payload?: Record<string, unknown>;
}

export interface AddDependencyRequest {
  source_team_id: string;
  source_task_pattern: string;
  target_team_id: string;
  target_task_pattern: string;
}
