/**
 * Shared TypeScript types for the Agents feature
 * Centralized type definitions to ensure type consistency across components
 */

/**
 * Base Agent interface - minimal agent information
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  tools: string[];
  category: string;
  color?: string;
  tags?: string[];
  skill_ids?: string[];
}

/**
 * Extended agent with full details
 */
export interface AgentFull extends Agent {
  full_prompt: string;
  file_path: string;
  last_modified?: string;
}

/**
 * Agent execution status
 */
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Agent execution record
 */
export interface Execution {
  id: string;
  agent_id: string;
  agent_name?: string;
  task: string;
  status: ExecutionStatus;
  input_data?: Record<string, any>;
  output_data?: any;
  error_message?: string;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  duration_ms: number;
  cost_usd: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Category with count
 */
export interface Category {
  id: string;
  name: string;
  count: number;
}

/**
 * Analytics summary data
 */
export interface AnalyticsSummary {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  total_tokens_used: number;
  total_cost_usd: number;
  average_duration_ms: number;
  unique_agents_used: number;
  most_used_agents: Array<{
    agent_id: string;
    agent_name?: string;
    count: number;
  }>;
}

/**
 * Usage data point for analytics charts
 */
export interface UsageDataPoint {
  date: string;
  count: number;
  tokens?: number;
  cost?: number;
}

/**
 * Top agent statistics
 */
export interface TopAgent {
  agent_id: string;
  agent_name: string;
  executions: number;
  success_rate: number;
  total_tokens: number;
  total_cost: number;
}

/**
 * Cost breakdown analytics
 */
export interface CostBreakdown {
  total_cost: number;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    cost: number;
  }>;
  by_model: Array<{
    model: string;
    cost: number;
  }>;
}
