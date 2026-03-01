/**
 * Missions API Service
 *
 * Client for Phase 5: Parallel Team Orchestration APIs.
 * Connects to Pronetheia backend at 192.168.1.120:8000
 */

import type { Mission, MissionStats } from '../views/missions.ts';

// API base URL - Pronetheia backend
const API_BASE = 'http://192.168.1.120:8000/api/v1';

export interface CreateMissionRequest {
  goal: string;
  description?: string;
  auto_plan?: boolean;
  max_teams?: number;
}

/**
 * Get orchestration statistics
 */
export async function getMissionStats(): Promise<MissionStats> {
  const response = await fetch(`${API_BASE}/missions/stats`, {
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
  const response = await fetch(`${API_BASE}/missions/`, {
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
  const response = await fetch(`${API_BASE}/missions/${missionId}`, {
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
  const response = await fetch(`${API_BASE}/missions/`, {
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
  const response = await fetch(`${API_BASE}/missions/${missionId}/launch`, {
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
  const response = await fetch(`${API_BASE}/missions/${missionId}/pause`, {
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
  const response = await fetch(`${API_BASE}/missions/${missionId}/resume`, {
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
  const response = await fetch(`${API_BASE}/missions/${missionId}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to cancel mission: ${response.statusText}`);
  }
  
  return response.json();
}
