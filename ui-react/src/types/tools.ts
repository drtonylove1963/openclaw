/**
 * TypeScript types for MCP Tools management
 * Defines interfaces for tools, executions, and assignments
 */

/**
 * Tool status
 */
export type ToolStatus = 'active' | 'inactive' | 'deprecated' | 'error';

/**
 * Tool execution status
 */
export type ToolExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Tool category
 */
export type ToolCategory =
  | 'filesystem'
  | 'database'
  | 'api'
  | 'utility'
  | 'communication'
  | 'data-processing'
  | 'ml-ai'
  | 'testing'
  | 'monitoring'
  | 'other';

/**
 * Base Tool interface
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  source: string; // e.g., "mcp-server-filesystem", "custom"
  category: ToolCategory;
  status: ToolStatus;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  last_used_at?: string;
  usage_count?: number;
  version?: string;
  author?: string;
  documentation_url?: string;
  tags?: string[];
  // MCP server info
  mcp_server?: string; // MCP server name (e.g., "context7-mcp", "puppeteer")
  mcp_package?: string; // MCP package name (e.g., "@upstash/context7-mcp")
  // Session-based execution fields
  requires_session: boolean; // Whether tool needs session-based execution
  mcp_command?: string; // MCP command to start server (default: npx)
  mcp_args?: string[]; // MCP server arguments
}

/**
 * Tool creation payload
 */
export interface ToolCreate {
  name: string;
  description: string;
  source: string;
  category: ToolCategory;
  status?: ToolStatus;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  version?: string;
  author?: string;
  documentation_url?: string;
  tags?: string[];
  // Session-based execution fields
  requires_session?: boolean;
  mcp_package?: string;
  mcp_command?: string;
  mcp_args?: string[];
}

/**
 * Tool update payload
 */
export interface ToolUpdate {
  name?: string;
  description?: string;
  source?: string;
  category?: ToolCategory;
  status?: ToolStatus;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  version?: string;
  author?: string;
  documentation_url?: string;
  tags?: string[];
  // Session-based execution fields
  requires_session?: boolean;
  mcp_package?: string;
  mcp_command?: string;
  mcp_args?: string[];
}

/**
 * Tool execution result
 */
export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration_ms: number;
  timestamp: string;
}

/**
 * Tool execution record
 */
export interface ToolExecution {
  id: string;
  tool_id: string;
  tool_name?: string;
  agent_id?: string;
  agent_name?: string;
  status: ToolExecutionStatus;
  input_params: Record<string, any>;
  result?: ExecutionResult;
  error_message?: string;
  duration_ms: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Agent-Tool assignment
 */
export interface AgentToolAssignment {
  id: string;
  agent_id: string;
  agent_name: string;
  tool_id: string;
  tool_name: string;
  assigned_at: string;
  assigned_by?: string;
  is_required: boolean;
  priority?: number;
}

/**
 * Tool assignment creation payload
 */
export interface AssignmentCreate {
  agent_id: string;
  tool_id: string;
  is_required?: boolean;
  priority?: number;
}

/**
 * Tool statistics
 */
export interface ToolStats {
  total_tools: number;
  active_tools: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration_ms: number;
  most_used_tools: Array<{
    tool_id: string;
    tool_name: string;
    count: number;
  }>;
}

/**
 * Tool execution history filters
 */
export interface ExecutionFilters {
  tool_id?: string;
  agent_id?: string;
  status?: ToolExecutionStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Category with count
 */
export interface CategoryCount {
  category: ToolCategory;
  count: number;
}
