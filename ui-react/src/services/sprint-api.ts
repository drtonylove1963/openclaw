/**
 * Sprint Board API Service
 *
 * Handles Sprint Board operations including:
 * - Board state management
 * - Story CRUD operations
 * - Planning response import
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Story {
  id: string;
  story_id: string;
  title: string;
  description: string;
  story_points: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  column: string;
  team_id?: string;
  assigned_agent?: string;
  blocked_reason?: string;
  completed_at?: string;
  current_review?: ReviewRecord;
  review_history?: ReviewRecord[];
  // Dependency fields (from collision prevention)
  blocked_by?: string[];  // Story IDs that block this story
  blocking?: string[];    // Story IDs that this story blocks
}

export interface StoryDependency {
  blocker_id: string;
  blocked_id: string;
  reason?: string;
}

export interface ReviewRecord {
  id: string;
  review_type: 'ai' | 'human';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  iteration: number;
  issues_found?: Array<{ type: string; description: string }>;
  reviewer_agent?: string;
  reviewer_human?: string;
  notes?: string;
  started_at: string;
  completed_at?: string;
}

export interface BoardState {
  sprint_id: string;
  sprint_number: number;
  sprint_status: string;
  columns: Record<string, Story[]>;
  columns_order: string[];
  total_stories: number;
  completed_stories: number;
  total_points: number;
  completed_points: number;
  blocked_stories: number;
  completion_percentage: number;
  review_metrics: {
    ai_reviews_total: number;
    human_reviews_total: number;
    ai_approval_rate: number;
    human_approval_rate: number;
    escalation_rate: number;
    avg_ai_iterations: number;
    active_reviews: number;
    pending_human_reviews: number;
  };
}

export interface StoryCreate {
  story_id: string;
  title: string;
  description?: string;
  story_points?: number;
  priority?: string;
  team_id?: string;
  assigned_agent?: string;
}

export interface SprintCreate {
  name: string;
  sprint_number?: number;
  goal?: string;
}

export interface StoryImportResult {
  story_id: string;
  title: string;
  story_points: number;
  priority: string;
  success: boolean;
  error?: string;
}

export interface PlanningImportResponse {
  success: boolean;
  sprint_id: string;
  sprint_name: string;
  stories_imported: number;
  stories_failed: number;
  total_points: number;
  results: StoryImportResult[];
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API error: ${response.status}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT BOARD API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the current state of a sprint board
 */
export async function getBoardState(sprintId: string): Promise<BoardState> {
  return fetchApi<BoardState>(`/sprint/board/${sprintId}`);
}

/**
 * Create a new sprint board
 */
export async function createBoard(sprint: SprintCreate): Promise<{ success: boolean; sprint_id: string }> {
  return fetchApi('/sprint/board', {
    method: 'POST',
    body: JSON.stringify(sprint),
  });
}

/**
 * List all sprint boards
 */
export async function listBoards(): Promise<{ boards: string[] }> {
  return fetchApi('/sprint/boards');
}

/**
 * Add a story to a sprint board
 */
export async function addStory(sprintId: string, story: StoryCreate): Promise<{ success: boolean; card: Story }> {
  return fetchApi(`/sprint/board/${sprintId}/story`, {
    method: 'POST',
    body: JSON.stringify(story),
  });
}

/**
 * Move a story to a different column
 */
export async function moveStory(
  sprintId: string,
  storyId: string,
  newColumn: string,
  blockedReason?: string
): Promise<{ success: boolean; story_id: string; new_column: string }> {
  return fetchApi(`/sprint/board/${sprintId}/story/${storyId}/move`, {
    method: 'POST',
    body: JSON.stringify({ new_column: newColumn, blocked_reason: blockedReason }),
  });
}

/**
 * Get board metrics
 */
export async function getBoardMetrics(sprintId: string): Promise<{
  sprint_id: string;
  progress: {
    total_stories: number;
    completed_stories: number;
    total_points: number;
    completed_points: number;
    completion_percentage: number;
    blocked_stories: number;
  };
  review_metrics: BoardState['review_metrics'];
  column_counts: Record<string, number>;
}> {
  return fetchApi(`/sprint/board/${sprintId}/metrics`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLANNING IMPORT API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Import stories from a planning response text
 *
 * This parses the AI-generated planning output and creates stories
 * in the Sprint Board automatically.
 */
export async function importFromPlanningResponse(
  planningResponse: string,
  options?: {
    sprintName?: string;
    projectId?: string;
    projectName?: string;
  }
): Promise<PlanningImportResponse> {
  return fetchApi('/sprint/board/import-from-planning', {
    method: 'POST',
    body: JSON.stringify({
      planning_response: planningResponse,
      sprint_name: options?.sprintName,
      project_id: options?.projectId,
      project_name: options?.projectName,
    }),
  });
}

/**
 * Import stories to an existing sprint
 */
export async function importStoriesToSprint(
  sprintId: string,
  planningResponse: string
): Promise<{
  success: boolean;
  sprint_id: string;
  stories_imported: number;
  stories_failed: number;
  total_points: number;
}> {
  return fetchApi(`/sprint/board/${sprintId}/import-stories`, {
    method: 'POST',
    body: JSON.stringify({ planning_response: planningResponse }),
  });
}

/**
 * Check if a response contains sprint completion markers
 */
export function checkForSprintCompletion(responseText: string): boolean {
  const completionMarkers = [
    'sprint board ready',
    'proceeding to implementation',
    'ready for implementation',
    'sprint plan complete',
    'sprint planning complete',
  ];

  const textLower = responseText.toLowerCase();
  return completionMarkers.some(marker => textLower.includes(marker));
}

/**
 * Seed demo stories for testing
 */
export async function seedDemoStories(sprintId: string): Promise<{
  success: boolean;
  sprint_id: string;
  stories_created: number;
  message: string;
}> {
  return fetchApi(`/sprint/board/${sprintId}/seed-demo`, {
    method: 'POST',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI/HUMAN REVIEW API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Start AI review for a story
 */
export async function startAIReview(
  sprintId: string,
  storyId: string,
  reviewerAgent: string = 'qa_engineer'
): Promise<{ success: boolean; story_id: string; review: ReviewRecord; message: string }> {
  return fetchApi(`/sprint/board/${sprintId}/story/${storyId}/ai-review/start`, {
    method: 'POST',
    body: JSON.stringify({ reviewer_agent: reviewerAgent }),
  });
}

/**
 * Record AI review result
 */
export async function recordAIReviewResult(
  sprintId: string,
  storyId: string,
  approved: boolean,
  issues: Array<{ type: string; description: string }> = [],
  criteriaResults: Record<string, boolean> = {}
): Promise<{
  success: boolean;
  story_id: string;
  approved: boolean;
  new_column: string;
  escalated_to_human: boolean;
}> {
  return fetchApi(`/sprint/board/${sprintId}/story/${storyId}/ai-review/result`, {
    method: 'POST',
    body: JSON.stringify({ approved, issues, criteria_results: criteriaResults }),
  });
}

/**
 * Start human review for a story
 */
export async function startHumanReview(
  sprintId: string,
  storyId: string,
  reviewerName?: string,
  reason: string = 'manual_request'
): Promise<{ success: boolean; story_id: string; review: ReviewRecord; message: string }> {
  return fetchApi(`/sprint/board/${sprintId}/story/${storyId}/human-review/start`, {
    method: 'POST',
    body: JSON.stringify({ reviewer_name: reviewerName, reason }),
  });
}

/**
 * Complete human review for a story
 */
export async function completeHumanReview(
  sprintId: string,
  storyId: string,
  approved: boolean,
  notes: string = '',
  returnToDev: boolean = false
): Promise<{ success: boolean; story_id: string; approved: boolean; new_column: string }> {
  return fetchApi(`/sprint/board/${sprintId}/story/${storyId}/human-review/complete`, {
    method: 'POST',
    body: JSON.stringify({ approved, notes, return_to_dev: returnToDev }),
  });
}

/**
 * Get pending human reviews
 */
export async function getPendingHumanReviews(sprintId: string): Promise<{
  sprint_id: string;
  pending_count: number;
  stories: Story[];
}> {
  return fetchApi(`/sprint/board/${sprintId}/human-reviews/pending`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORY DEPENDENCY API (uses Collision Prevention service)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add a dependency: blockerStoryId must complete before blockedStoryId can start
 */
export async function addStoryDependency(
  blockerStoryId: string,
  blockedStoryId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi('/collision/block', {
    method: 'POST',
    body: JSON.stringify({
      blocker_id: blockerStoryId,
      blocked_id: blockedStoryId,
      block_type: 'dependency',
      reason: reason || `Story ${blockerStoryId} must complete first`,
    }),
  });
}

/**
 * Remove a dependency between two stories
 */
export async function removeStoryDependency(
  blockerStoryId: string,
  blockedStoryId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE}/api/v1/collision/block/${encodeURIComponent(blockerStoryId)}/${encodeURIComponent(blockedStoryId)}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    throw new Error(`Failed to remove dependency: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get all stories that block this story
 */
export async function getStoryBlockers(storyId: string): Promise<{
  task_id: string;
  is_ready: boolean;
  blocker_count: number;
  blockers: string[];
}> {
  return fetchApi(`/collision/blockers/${encodeURIComponent(storyId)}`);
}

/**
 * Get all stories that this story blocks
 */
export async function getStoriesBlockedBy(storyId: string): Promise<{
  task_id: string;
  blocking_count: number;
  blocking: string[];
}> {
  return fetchApi(`/collision/blocked-by/${encodeURIComponent(storyId)}`);
}

/**
 * Get full dependency info for a story (both directions)
 */
export async function getStoryDependencies(storyId: string): Promise<{
  story_id: string;
  blocked_by: string[];
  blocking: string[];
  is_ready: boolean;
}> {
  const [blockers, blocking] = await Promise.all([
    getStoryBlockers(storyId),
    getStoriesBlockedBy(storyId),
  ]);

  return {
    story_id: storyId,
    blocked_by: blockers.blockers,
    blocking: blocking.blocking,
    is_ready: blockers.is_ready,
  };
}

/**
 * Check if adding a dependency would create a cycle
 */
export async function wouldCreateCycle(
  blockerStoryId: string,
  blockedStoryId: string
): Promise<{ would_create_cycle: boolean; message: string }> {
  return fetchApi('/collision/check-cycle', {
    method: 'POST',
    body: JSON.stringify({
      blocker_id: blockerStoryId,
      blocked_id: blockedStoryId,
    }),
  });
}

/**
 * Resolve all blocks by a story (call when story is completed)
 */
export async function resolveStoryBlocks(storyId: string): Promise<{
  success: boolean;
  task_id: string;
  blocks_resolved: number;
}> {
  return fetchApi(`/collision/resolve/${encodeURIComponent(storyId)}`, {
    method: 'POST',
  });
}

/**
 * Get all blocked stories summary (for board overview)
 */
export async function getBlockedStoriesSummary(): Promise<{
  count: number;
  blocked_tasks: Array<{
    task_id: string;
    blocked_by: string[];
    reasons: string[];
    blocker_count: number;
  }>;
}> {
  return fetchApi('/collision/blocked-summary');
}
