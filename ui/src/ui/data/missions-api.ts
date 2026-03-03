/**
 * Missions API Service
 *
 * Client for Phase 5: Parallel Team Orchestration APIs.
 * Uses HTTPS endpoint through Caddy proxy.
 */

import type { Mission, MissionStats } from "../views/missions.ts";

// API base URL - Use HTTPS endpoint through Caddy proxy
const API_BASE = "https://api.pronetheia.com/api/v1";

// Gateway secret for authentication
const GATEWAY_SECRET = "01c1b66797fa9f84e794ed313bb5d1aa4b0add96e216723725b8c88b8e6c57eb";

// Common headers for all API calls
const getHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  "X-Gateway-Secret": GATEWAY_SECRET,
});

// Template summary type
export interface TemplateSummary {
  id: string;
  name: string;
  category: string;
  team_count: number;
  estimated_hours: number;
}

export interface CreateMissionRequest {
  goal: string;
  description?: string;
  auto_plan?: boolean;
  max_teams?: number;
  template_id?: string;
  variables?: Record<string, string>;
}

/**
 * Get orchestration statistics
 */
export async function getMissionStats(): Promise<MissionStats> {
  const response = await fetch(`${API_BASE}/missions/stats`, {
    headers: getHeaders(),
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
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch missions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.missions || [];
}

/**
 * Get a specific mission
 */
export async function getMission(missionId: string): Promise<Mission> {
  const response = await fetch(`${API_BASE}/missions/${missionId}`, {
    headers: getHeaders(),
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
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to create mission");
  }

  return response.json();
}

/**
 * Launch a mission
 */
export async function launchMission(
  missionId: string,
): Promise<{ mission_id: string; status: string; teams_launched: number }> {
  const response = await fetch(`${API_BASE}/missions/${missionId}/launch`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to launch mission: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Pause a mission
 */
export async function pauseMission(
  missionId: string,
): Promise<{ mission_id: string; status: string }> {
  const response = await fetch(`${API_BASE}/missions/${missionId}/pause`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to pause mission: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Resume a mission
 */
export async function resumeMission(
  missionId: string,
): Promise<{ mission_id: string; status: string }> {
  const response = await fetch(`${API_BASE}/missions/${missionId}/resume`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to resume mission: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel a mission
 */
export async function cancelMission(
  missionId: string,
): Promise<{ mission_id: string; status: string }> {
  const response = await fetch(`${API_BASE}/missions/${missionId}/cancel`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel mission: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List mission templates
 */
export async function listTemplates(): Promise<TemplateSummary[]> {
  const response = await fetch(`${API_BASE}/missions/templates/`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific template
 */
export async function getTemplate(templateId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/missions/templates/${templateId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${response.statusText}`);
  }

  return response.json();
}
