/**
 * TypeScript types for the Unified Skill System
 * Matches backend schemas in src/skills/models.py
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Types of skills in the system
 */
export type SkillType = 'mcp_tool' | 'knowledge' | 'workflow' | 'composite' | 'prompt';

/**
 * Source of the skill
 */
export type SkillSourceType = 'mcp_server' | 'manual' | 'imported' | 'legacy' | 'system';

/**
 * Skill categories for classification
 */
export type SkillCategory =
  | 'filesystem'
  | 'database'
  | 'git'
  | 'shell'
  | 'docker'
  | 'network'
  | 'api'
  | 'search'
  | 'browser'
  | 'memory'
  | 'design_pattern'
  | 'ddd'
  | 'code_quality'
  | 'validation'
  | 'workflow'
  | 'custom';

/**
 * Skill execution status (renamed to avoid conflict with agent.ts)
 */
export type SkillExecutionStatus = 'pending' | 'running' | 'success' | 'error' | 'timeout' | 'cancelled';

// =============================================================================
// SKILL SCHEMAS
// =============================================================================

/**
 * Full skill schema with all fields
 */
export interface Skill {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  summary: string;
  skill_type: SkillType;
  category: SkillCategory;
  source_type: SkillSourceType;
  source_id?: string;
  source_tool_name?: string;
  input_schema: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  mcp_server_id?: string;
  mcp_transport?: string;
  mcp_command?: string;
  mcp_args?: string[];
  mcp_env?: Record<string, string>;
  instructions?: string;
  examples?: Record<string, string>;
  version: string;
  tags?: string[];
  triggers?: string[];
  priority: number;
  metadata?: Record<string, unknown>;
  enabled: boolean;
  validated: boolean;
  last_validated_at?: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
  avg_execution_ms?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Lightweight skill summary for listings
 */
export interface SkillSummary {
  id: string;
  name: string;
  display_name?: string;
  summary: string;
  skill_type: SkillType;
  category: SkillCategory;
  enabled: boolean;
  execution_count: number;
  success_rate: number;
}

/**
 * Schema for creating a skill
 */
export interface SkillCreate {
  name: string;
  display_name?: string;
  description?: string;
  summary?: string;
  skill_type?: SkillType;
  category?: SkillCategory;
  source_type?: SkillSourceType;
  source_id?: string;
  source_tool_name?: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  mcp_server_id?: string;
  mcp_transport?: string;
  mcp_command?: string;
  mcp_args?: string[];
  mcp_env?: Record<string, string>;
  instructions?: string;
  examples?: Record<string, string>;
  version?: string;
  tags?: string[];
  triggers?: string[];
  priority?: number;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}

/**
 * Schema for updating a skill
 */
export interface SkillUpdate {
  display_name?: string;
  description?: string;
  summary?: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  instructions?: string;
  examples?: Record<string, string>;
  version?: string;
  tags?: string[];
  triggers?: string[];
  priority?: number;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
  validated?: boolean;
}

/**
 * Filters for querying skills
 */
export interface SkillFilters {
  skill_type?: SkillType;
  category?: SkillCategory;
  source_type?: SkillSourceType;
  mcp_server_id?: string;
  enabled?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// =============================================================================
// EXECUTION SCHEMAS
// =============================================================================

/**
 * Skill execution record
 */
export interface SkillExecution {
  id: string;
  skill_id: string;
  session_id?: string;
  agent_id?: string;
  feature: string;
  input_params: Record<string, unknown>;
  output_result?: Record<string, unknown>;
  status: SkillExecutionStatus;
  error_message?: string;
  error_code?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  tokens_used: number;
  created_at: string;
}

/**
 * Request to execute a skill
 */
export interface SkillExecuteRequest {
  params?: Record<string, unknown>;
  session_id?: string;
  agent_id?: string;
  feature?: string;
  timeout_ms?: number;
}

/**
 * Response from skill execution
 */
export interface SkillExecuteResponse {
  execution_id: string;
  success: boolean;
  result?: unknown;
  error?: string;
  error_code?: string;
  duration_ms: number;
}

/**
 * Statistics for a skill
 */
export interface SkillStats {
  skill_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_duration_ms: number;
  total_tokens: number;
  last_executed_at?: string;
  executions_by_feature: Record<string, number>;
  executions_by_agent: Record<string, number>;
}

// =============================================================================
// MCP SERVER SCHEMAS
// =============================================================================

/**
 * MCP server configuration
 */
export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  transport: string;
  command?: string;
  args: string[];
  env: Record<string, string>;
  url?: string;
  status: string;
  last_connected_at?: string;
  last_error?: string;
  auto_sync_skills: boolean;
  last_synced_at?: string;
  skill_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Schema for creating an MCP server
 */
export interface MCPServerCreate {
  id: string;
  name: string;
  description?: string;
  transport?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  auto_sync_skills?: boolean;
}

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

/**
 * Response for skill listing (paginated)
 */
export interface SkillListResponse {
  skills: SkillSummary[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Response from skill search
 */
export interface SkillSearchRequest {
  query: string;
  skill_type?: SkillType;
  category?: SkillCategory;
  limit?: number;
}

/**
 * Result of MCP server skill ingestion
 */
export interface IngestionResult {
  server_id: string;
  server_name: string;
  tools_discovered: number;
  skills_created: number;
  skills_updated: number;
  skills_skipped: number;
  errors: string[];
  duration_ms: number;
}

/**
 * Result of skill sync operation
 */
export interface SyncResult {
  server_id: string;
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
  errors: string[];
}

/**
 * Response from bulk ingestion
 */
export interface BulkIngestResponse {
  results: Record<string, IngestionResult>;
  total_skills_created: number;
  total_skills_updated: number;
  total_errors: number;
}

/**
 * Skill count by type
 */
export interface SkillCounts {
  mcp_tool: number;
  knowledge: number;
  workflow: number;
  composite: number;
  prompt: number;
  total: number;
  enabled: number;
}

/**
 * Skill system health check
 */
export interface SkillSystemHealth {
  status: 'healthy' | 'unhealthy';
  total_skills: number;
  enabled_skills: number;
  mcp_servers_count: number;
  mcp_servers_connected: number;
  error?: string;
}

/**
 * Skill execution history response
 */
export interface SkillExecutionHistoryResponse {
  executions: SkillExecution[];
  skill_id: string;
  skill_name: string;
}
