/**
 * Swarm API Service
 *
 * Client for the agent swarm orchestration APIs.
 */

import { API_BASE_URL } from '../config/api';

const SWARM_BASE = `${API_BASE_URL}/api/v1/swarm`;

// ============================================================================
// Types
// ============================================================================

export interface SwarmAgent {
  agent_id: string;
  agent_type: string;
  capabilities: string[];
  capacity: number;
  current_tasks: string[];
  completed_tasks: number;
  success_rate: number;
}

export interface SwarmTask {
  task_id: string;
  description: string;
  complexity: number; // 1-10
  required_capabilities: string[];
  min_agents: number;
  max_agents: number;
  requires_consensus: boolean;
}

export interface Swarm {
  swarm_id: string;
  status: 'initializing' | 'running' | 'voting' | 'completed' | 'failed';
  strategy: 'democratic' | 'competitive' | 'collaborative' | 'hierarchical' | 'stigmergic';
  task_description: string;
  agents: string[];
  decisions_made: number;
}

export interface SwarmProposal {
  solution_id: string;
  agent_id: string;
  agent_type: string;
  approach: string;
  estimated_quality: number;
  estimated_time: number;
}

export interface SwarmDecision {
  question: string;
  votes: Record<string, string>; // agent_id -> vote
  result: string;
  consensus: boolean;
  confidence: number;
}

export interface SwarmResult {
  swarm_id: string;
  task: string;
  strategy: string;
  winning_solution: SwarmProposal;
  decision: SwarmDecision;
  all_proposals: SwarmProposal[];
  agents_involved: string[];
}

// S-24: Add proper TypeScript types for SwarmEvent.data field
export interface SwarmEventData {
  agent_id?: string;
  message?: string;
  status?: string;
  progress?: number;
  solution_id?: string;
  quality?: number;
  [key: string]: any; // Allow additional properties
}

export interface SwarmEvent {
  event_type: string;
  swarm_id: string;
  timestamp: string;
  data: SwarmEventData; // S-24: Replaced 'any' with proper type
}

export interface SwarmStats {
  coordinator: {
    total_agents: number;
    active_swarms: number;
    agents: SwarmAgent[];
  };
  communication_bus: {
    total_messages: number;
    active_subscribers: number;
    subscribers: string[];
  };
  active_swarms: number;
  completed_swarms: number;
  websocket_connections: Record<string, number>;
}

// ============================================================================
// Auth Helper
// ============================================================================

/**
 * Get the current auth token from storage.
 */
export function getAuthToken(): string | null {
  return (
    localStorage.getItem('pronetheia_token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    null
  );
}

/**
 * Build headers with auth token for API requests.
 */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Register a new agent with the swarm coordinator.
 */
export async function registerAgent(agent: {
  agent_id: string;
  agent_type: string;
  capabilities: string[];
  capacity?: number;
}): Promise<SwarmAgent> {
  const response = await fetch(`${SWARM_BASE}/agents/register`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(agent),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to register agent');
  }

  return response.json();
}

/**
 * List all registered agents.
 */
export async function listAgents(): Promise<SwarmAgent[]> {
  const response = await fetch(`${SWARM_BASE}/agents`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }

  return response.json();
}

/**
 * Get specific agent details.
 */
export async function getAgent(agentId: string): Promise<SwarmAgent> {
  const response = await fetch(`${SWARM_BASE}/agents/${agentId}`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch agent ${agentId}`);
  }

  return response.json();
}

/**
 * Create a new agent swarm.
 */
export async function createSwarm(request: {
  task: SwarmTask;
  strategy?: string;
  auto_recruit?: boolean;
}): Promise<Swarm> {
  const response = await fetch(`${SWARM_BASE}/create`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({
      task: request.task,
      strategy: request.strategy || 'democratic',
      auto_recruit:  request.auto_recruit,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create swarm');
  }

  return response.json();
}

/**
 * List all active swarms.
 */
export async function listSwarms(): Promise<Swarm[]> {
  const response = await fetch(`${SWARM_BASE}/list`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch swarms');
  }

  return response.json();
}

/**
 * Get swarm status.
 */
export async function getSwarmStatus(swarmId: string): Promise<Swarm> {
  const response = await fetch(`${SWARM_BASE}/${swarmId}/status`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch swarm ${swarmId}`);
  }

  return response.json();
}

/**
 * Execute a swarm (synchronous - returns when complete).
 */
export async function executeSwarm(swarmId: string): Promise<SwarmResult> {
  const response = await fetch(`${SWARM_BASE}/${swarmId}/execute`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to execute swarm');
  }

  return response.json();
}

/**
 * Get swarm result (after execution completes).
 */
export async function getSwarmResult(swarmId: string): Promise<SwarmResult> {
  const response = await fetch(`${SWARM_BASE}/${swarmId}/result`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch result for swarm ${swarmId}`);
  }

  return response.json();
}

/**
 * Get swarm system statistics.
 */
export async function getSwarmStats(): Promise<SwarmStats> {
  const response = await fetch(`${SWARM_BASE}/stats`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch swarm stats');
  }

  return response.json();
}

/**
 * Health check for swarm service.
 */
export async function swarmHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  const response = await fetch(`${SWARM_BASE}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Swarm health check failed');
  }

  return response.json();
}

// ============================================================================
// WebSocket Connection
// ============================================================================

/**
 * Create a WebSocket connection to stream swarm events.
 * S-08: Sends JWT token as query parameter since browser WebSocket API
 * cannot send Authorization headers.
 */
export function createSwarmEventStream(
  swarmId: string,
  onEvent: (event: SwarmEvent) => void,
  onError?: (error: Event) => void,
  onClose?: () => void,
  token?: string,
  onOpen?: () => void  // NEW-06: Add onOpen callback for connection timing
): WebSocket {
  // S-08: Get auth token
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error('Authentication token required for WebSocket connection');
  }

  // S-01/S-08: Pass token as query parameter
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = API_BASE_URL.replace(/^https?:\/\//, '');
  const wsUrl = `${wsProtocol}//${wsHost}/api/v1/swarm/ws/${swarmId}?token=${encodeURIComponent(authToken)}`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log(`[SwarmWS] Connected to swarm ${swarmId}`);

    // NEW-06: Call onOpen callback when connection is established
    if (onOpen) {
      onOpen();
    }

    // Start keepalive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // 30 seconds

    // Store interval ID for cleanup
    (ws as any)._pingInterval = pingInterval;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (error) {
      console.error('[SwarmWS] Failed to parse message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('[SwarmWS] WebSocket error:', error);
    if (onError) {onError(error);}
  };

  ws.onclose = () => {
    console.log(`[SwarmWS] Disconnected from swarm ${swarmId}`);

    // Clear keepalive
    const pingInterval = (ws as any)._pingInterval;
    if (pingInterval) {
      clearInterval(pingInterval);
    }

    if (onClose) {onClose();}
  };

  return ws;
}
