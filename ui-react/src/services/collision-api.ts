/**
 * Collision Prevention API Service
 * API client for the collision prevention endpoints
 */

// Use relative path for nginx proxy, or VITE_API_URL if set
const API_BASE = import.meta.env.VITE_API_URL || '';

// =============================================================================
// Types
// =============================================================================

export interface CollisionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  mode: 'database' | 'memory';
  features: {
    blocking: boolean;
    file_locking: boolean;
    ready_queue: boolean;
  };
  active_locks: number;
  error?: string;
}

export interface BlockRelation {
  blocker_id: string;
  blocked_id: string;
  block_type: 'dependency' | 'file' | 'resource';
  reason?: string;
}

export interface TaskBlockers {
  task_id: string;
  is_ready: boolean;
  blocker_count: number;
  blockers: string[];
}

export interface TaskBlocking {
  task_id: string;
  blocking_count: number;
  blocking: string[];
}

export interface FileConflict {
  file: string;
  blocking_task: string;
  blocking_agent: string;
  lock_type: string;
}

export interface FileConflictResponse {
  has_conflicts: boolean;
  conflicts: FileConflict[];
}

export interface FileLock {
  file_path: string;
  task_id: string;
  agent_type: string;
  lock_type: string;
  acquired_at: string;
}

export interface DependencyGraphEdge {
  from: string;
  to: string;
  type: string;
  reason?: string;
  active: boolean;
  blocker_status?: string;
  blocked_status?: string;
}

export interface DependencyGraph {
  nodes: string[];
  edges: DependencyGraphEdge[];
  active_blocks: number;
}

export interface BlockedTaskSummary {
  task_id: string;
  blocked_by: string[];
  reasons: string[];
  blocker_count: number;
}

export interface ReadyTask {
  task_id: string;
  description: string;
  priority: number;
  agent_type: string;
  files: string[];
}

// =============================================================================
// API Functions
// =============================================================================

export async function fetchCollisionHealth(): Promise<CollisionHealth> {
  const response = await fetch(`${API_BASE}/api/v1/collision/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch collision health: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchReadyTasks(maxCount: number = 10): Promise<{ count: number; tasks: ReadyTask[] }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/ready?max_count=${maxCount}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ready tasks: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTaskBlockers(taskId: string): Promise<TaskBlockers> {
  const response = await fetch(`${API_BASE}/api/v1/collision/blockers/${encodeURIComponent(taskId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch task blockers: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTasksBlockedBy(taskId: string): Promise<TaskBlocking> {
  const response = await fetch(`${API_BASE}/api/v1/collision/blocked-by/${encodeURIComponent(taskId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch blocked tasks: ${response.statusText}`);
  }
  return response.json();
}

export async function addBlock(
  blockerId: string,
  blockedId: string,
  blockType: string = 'dependency',
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocker_id: blockerId,
      blocked_id: blockedId,
      block_type: blockType,
      reason,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `Failed to add block: ${response.statusText}`);
  }
  return response.json();
}

export async function removeBlock(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE}/api/v1/collision/block/${encodeURIComponent(blockerId)}/${encodeURIComponent(blockedId)}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    throw new Error(`Failed to remove block: ${response.statusText}`);
  }
  return response.json();
}

export async function resolveBlocksByTask(taskId: string): Promise<{ success: boolean; task_id: string; blocks_resolved: number }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/resolve/${encodeURIComponent(taskId)}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to resolve blocks: ${response.statusText}`);
  }
  return response.json();
}

export async function checkFileConflicts(taskId: string, files: string[]): Promise<FileConflictResponse> {
  const response = await fetch(`${API_BASE}/api/v1/collision/check-conflicts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, files }),
  });
  if (!response.ok) {
    throw new Error(`Failed to check file conflicts: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchActiveLocks(): Promise<{ count: number; locks: FileLock[] }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/active-locks`);
  if (!response.ok) {
    throw new Error(`Failed to fetch active locks: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDependencyGraph(): Promise<DependencyGraph> {
  const response = await fetch(`${API_BASE}/api/v1/collision/graph`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dependency graph: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchBlockedSummary(): Promise<{ count: number; blocked_tasks: BlockedTaskSummary[] }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/blocked-summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch blocked summary: ${response.statusText}`);
  }
  return response.json();
}

export async function checkWouldCreateCycle(
  blockerId: string,
  blockedId: string
): Promise<{ would_create_cycle: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/check-cycle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocker_id: blockerId, blocked_id: blockedId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to check cycle: ${response.statusText}`);
  }
  return response.json();
}

export async function cleanupStaleLocks(maxAgeMinutes: number = 60): Promise<{ success: boolean; locks_cleaned: number }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/cleanup-stale-locks?max_age_minutes=${maxAgeMinutes}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to cleanup stale locks: ${response.statusText}`);
  }
  return response.json();
}

export async function generateTaskId(
  title: string,
  parentId?: string,
  context?: string
): Promise<{ task_id: string; title: string; parent_id?: string; context?: string }> {
  const response = await fetch(`${API_BASE}/api/v1/collision/generate-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, parent_id: parentId, context }),
  });
  if (!response.ok) {
    throw new Error(`Failed to generate task ID: ${response.statusText}`);
  }
  return response.json();
}
