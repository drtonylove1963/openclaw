/**
 * Missions API Service
 *
 * Client for Phase 5: Parallel Team Orchestration APIs.
 */

import { API_BASE_URL } from '../config/api';

const MISSIONS_BASE = `${API_BASE_URL}/api/v1/missions`;

// ============================================================================
// Types
// ============================================================================

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
  members: TeamMember[];
  progress: number;
  artifacts: Artifact[];
  created_at: string;
}

export interface TeamMember {
  agent_id: string;
  role: string;
  capabilities: string[];
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

export interface CreateMissionRequest {
  goal: string;
  description?: string;
  auto_plan?: boolean;
  max_teams?: number;
}

export interface AssistanceRequest {
  team_id: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  request_type: string;
  description: string;
  context?: Record<string, unknown>;
  timeout_seconds?: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get orchestration statistics
 */
export async function getMissionStats(): Promise<MissionStats> {
  const response = await fetch(`${MISSIONS_BASE}/stats`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch mission stats: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * List all missions
 */
export async function listMissions(): Promise<Mission[]> {
  const response = await fetch(`${MISSIONS_BASE}/`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch missions: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get a specific mission
 */
export async function getMission(missionId: string): Promise<Mission> {
  const response = await fetch(`${MISSIONS_BASE}/${missionId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch mission: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Create a new mission
 */
export async function createMission(request: CreateMissionRequest): Promise<Mission> {
  const response = await fetch(`${MISSIONS_BASE}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to create mission');
  }
  
  return response.json();
}

/**
 * Launch a mission
 */
export async function launchMission(missionId: string): Promise<{ mission_id: string; status: string; teams_launched: number }> {
  const response = await fetch(`${MISSIONS_BASE}/${missionId}/launch`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to launch mission: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Pause a mission
 */
export async function pauseMission(missionId: string): Promise<{ mission_id: string; status: string }> {
  const response = await fetch(`${MISSIONS_BASE}/${missionId}/pause`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to pause mission: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Resume a mission
 */
export async function resumeMission(missionId: string): Promise<{ mission_id: string; status: string }> {
  const response = await fetch(`${MISSIONS_BASE}/${missionId}/resume`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to resume mission: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Cancel a mission
 */
export async function cancelMission(missionId: string): Promise<{ mission_id: string; status: string }> {
  const response = await fetch(`${MISSIONS_BASE}/${missionId}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to cancel mission: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get team status
 */
export async function getTeamStatus(missionId: string, teamId: string): Promise<Team> {
  const response = await fetch(`${MISSIONS_BASE}/${missionId}/teams/${teamId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch team status: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get team artifacts
 */
export async function getTeamArtifacts(missionId: string, teamId: string): Promise<Artifact[]> {
  const response = await fetch(`${MISSIONS_BASE}/${missionId}/teams/${teamId}/artifacts`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch team artifacts: ${response.statusText}`);
  }
  
  return response.json();
}
