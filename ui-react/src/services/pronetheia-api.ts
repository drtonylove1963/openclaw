/**
 * Pronetheia Code Tab - API Client
 * Integrates with Universal Agent V3 + Unified Skill System
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Import Skill types from the new unified schema
import type {
  Skill,
  SkillSummary,
  SkillCreate,
  SkillUpdate,
  SkillFilters,
  SkillListResponse,
  SkillExecuteRequest,
  SkillExecuteResponse,
  SkillStats,
  SkillExecution,
  SkillExecutionHistoryResponse,
  MCPServer,
  MCPServerCreate,
  IngestionResult,
  SyncResult,
  BulkIngestResponse,
  SkillCounts,
  SkillSystemHealth,
  SkillType,
  SkillCategory,
} from '../types/skills';

// Re-export skill types for convenience
export type {
  Skill,
  SkillSummary,
  SkillCreate,
  SkillUpdate,
  SkillFilters,
  SkillListResponse,
  SkillExecuteRequest,
  SkillExecuteResponse,
  SkillStats,
  SkillExecution,
  MCPServer,
  MCPServerCreate,
  IngestionResult,
  SyncResult,
  SkillType,
  SkillCategory,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Use empty string for production (nginx proxy handles API routing)
// Only use localhost fallback in development when VITE_API_URL is truly undefined
const API_BASE = import.meta.env.VITE_API_URL ?? '';
const WS_BASE = import.meta.env.VITE_WS_URL ?? '';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Session {
  id: string;
  title: string;
  repo: string;
  status: 'pending' | 'running' | 'completed' | 'merged' | 'failed';
  diffStats?: { additions: number; deletions: number };
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  skill?: string;
  code?: string;
  files?: { path: string; additions: number; deletions: number }[];
  executionStatus?: 'running' | 'completed' | 'failed';
  timestamp: string;
}

export interface ExNihiloPhase {
  name: 'intent' | 'planning' | 'manifestation' | 'qa' | 'design' | 'delivery';
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress?: number;
}

// Note: Skill interface is now imported from '../types/skills'
// Legacy interface removed - use imported Skill type instead

export interface Repository {
  name: string;
  url: string;
  connected: boolean;
}

export interface Model {
  id: string;
  name: string;
  tier: 'free' | 'fast' | 'standard' | 'premium';
  context: number;
}

export interface ModelProvider {
  id: string;
  name: string;
  models: Model[];
}

export interface ModelsResponse {
  providers: ModelProvider[];
  legacy_tiers: Record<string, string>;
  total_providers: number;
  total_models: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
  last_login?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  users_by_role: {
    FREE: number;
    PRO: number;
    ENTERPRISE: number;
    ADMIN: number;
  };
  total_sessions: number;
  failed_logins_24h: number;
  permission_denials_24h: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
  settings: Record<string, unknown>;
}

export interface UsageStats {
  sessions_created: number;
  sessions_limit: number;
  messages_sent: number;
  tokens_used: number;
  skills_executed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ProjectStatus = 'active' | 'building' | 'completed' | 'paused' | 'archived';
export type ProjectTemplate = 'blank' | 'fastapi' | 'react' | 'fullstack' | 'cli' | 'library';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  template: ProjectTemplate;
  directory_path: string;
  github_repo: string | null;
  owner_id: string;
  is_public: boolean;
  agents_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  template: ProjectTemplate;
  github_repo?: string;
  is_public: boolean;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  github_repo?: string;
  is_public?: boolean;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  agents_count: number;
  updated_at: string;
}

export interface ProjectDirectoryInfo {
  path: string;
  exists: boolean;
  file_count: number;
  total_size_bytes: number;
  has_git: boolean;
  has_claude: boolean;
  has_pronetheia: boolean;
}

export interface ProjectFile {
  path: string;           // Relative path from project root
  name: string;           // File name
  size: number;           // Size in bytes
  is_directory: boolean;
  extension: string | null;
  modified_at: string | null;
}

export interface ProjectFilesResponse {
  project_id: string;
  directory_path: string;
  files: ProjectFile[];
  total_files: number;
  total_size: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API CLIENT CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class PronetheiaAPI {
  private baseUrl: string;
  private token: string | null = null;
  private headers: Record<string, string>;

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List all sessions for a repository
   */
  async listSessions(repo?: string): Promise<Session[]> {
    const query = repo ? `?repo=${encodeURIComponent(repo)}` : '';
    return this.fetch<Session[]>(`/api/v1/sessions${query}`);
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    return this.fetch<Session>(`/api/v1/sessions/${sessionId}`);
  }

  /**
   * Create a new session
   */
  async createSession(params: { title: string; repo: string; description?: string }): Promise<Session> {
    return this.fetch<Session>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.fetch<void>(`/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    return this.fetch<Message[]>(`/api/v1/sessions/${sessionId}/messages`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIVERSAL AGENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Send a message to Universal Agent
   */
  async sendMessage(sessionId: string, content: string, context: Record<string, unknown> = {}): Promise<Message> {
    return this.fetch<Message>(`/api/v1/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  }

  /**
   * Execute Ex Nihilo pipeline
   */
  async executeExNihilo(
    sessionId: string,
    params: { intent: string; model?: string; constraints?: Record<string, unknown> }
  ): Promise<{ pipelineId: string; status: string }> {
    return this.fetch(`/api/v1/sessions/${sessionId}/ex-nihilo`, {
      method: 'POST',
      body: JSON.stringify({
        intent: params.intent,
        model: params.model || 'claude-opus-4',
        constraints: params.constraints,
      }),
    });
  }

  /**
   * Get Ex Nihilo pipeline status
   */
  async getExNihiloStatus(pipelineId: string): Promise<{
    phases: Record<string, string>;
    currentPhase: string;
    progress: number;
  }> {
    return this.fetch(`/api/v1/ex-nihilo/${pipelineId}/status`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIFIED SKILL SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List skills with filters (paginated)
   */
  async listSkills(filters: SkillFilters = {}): Promise<SkillListResponse> {
    const params = new URLSearchParams();
    if (filters.skill_type) {params.append('skill_type', filters.skill_type);}
    if (filters.category) {params.append('category', filters.category);}
    if (filters.source_type) {params.append('source_type', filters.source_type);}
    if (filters.mcp_server_id) {params.append('mcp_server_id', filters.mcp_server_id);}
    if (filters.enabled !== undefined) {params.append('enabled', String(filters.enabled));}
    if (filters.search) {params.append('search', filters.search);}
    if (filters.page) {params.append('page', String(filters.page));}
    if (filters.page_size) {params.append('page_size', String(filters.page_size));}

    const query = params.toString();
    return this.fetch<SkillListResponse>(`/api/v1/skills${query ? `?${query}` : ''}`);
  }

  /**
   * Get skill by ID
   */
  async getSkill(skillId: string): Promise<Skill> {
    return this.fetch<Skill>(`/api/v1/skills/${skillId}`);
  }

  /**
   * Get skill by name
   */
  async getSkillByName(name: string): Promise<Skill> {
    return this.fetch<Skill>(`/api/v1/skills/name/${encodeURIComponent(name)}`);
  }

  /**
   * Create a new skill
   */
  async createSkill(skill: SkillCreate): Promise<Skill> {
    return this.fetch<Skill>('/api/v1/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  }

  /**
   * Update a skill
   */
  async updateSkill(skillId: string, updates: SkillUpdate): Promise<Skill> {
    return this.fetch<Skill>(`/api/v1/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a skill
   */
  async deleteSkill(skillId: string): Promise<void> {
    return this.fetch(`/api/v1/skills/${skillId}`, { method: 'DELETE' });
  }

  /**
   * Execute a skill
   */
  async executeSkill(skillId: string, request: SkillExecuteRequest = {}): Promise<SkillExecuteResponse> {
    return this.fetch<SkillExecuteResponse>(`/api/v1/skills/${skillId}/execute`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Execute a skill by name
   */
  async executeSkillByName(name: string, request: SkillExecuteRequest = {}): Promise<SkillExecuteResponse> {
    return this.fetch<SkillExecuteResponse>(`/api/v1/skills/execute/by-name/${encodeURIComponent(name)}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get skill execution statistics
   */
  async getSkillStats(skillId: string): Promise<SkillStats> {
    return this.fetch<SkillStats>(`/api/v1/skills/${skillId}/stats`);
  }

  /**
   * Get skill execution history
   */
  async getSkillExecutions(skillId: string, limit = 50, offset = 0): Promise<SkillExecutionHistoryResponse> {
    return this.fetch<SkillExecutionHistoryResponse>(
      `/api/v1/skills/${skillId}/executions?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Search skills by query
   */
  async searchSkills(query: string, skillType?: SkillType, limit = 20): Promise<SkillSummary[]> {
    return this.fetch<SkillSummary[]>('/api/v1/skills/search', {
      method: 'POST',
      body: JSON.stringify({ query, skill_type: skillType, limit }),
    });
  }

  /**
   * Find skills by trigger keywords
   */
  async findSkillsByTriggers(keywords: string[], skillType?: SkillType, limit = 10): Promise<SkillSummary[]> {
    const params = new URLSearchParams();
    params.append('keywords', keywords.join(','));
    if (skillType) {params.append('skill_type', skillType);}
    params.append('limit', String(limit));
    return this.fetch<SkillSummary[]>(`/api/v1/skills/match/triggers?${params.toString()}`);
  }

  /**
   * Get MCP tools only
   */
  async listMCPTools(mcpServerId?: string, enabledOnly = true): Promise<SkillSummary[]> {
    const params = new URLSearchParams();
    if (mcpServerId) {params.append('mcp_server_id', mcpServerId);}
    params.append('enabled_only', String(enabledOnly));
    return this.fetch<SkillSummary[]>(`/api/v1/skills/mcp-tools?${params.toString()}`);
  }

  /**
   * Get skill categories
   */
  async getSkillCategories(): Promise<string[]> {
    return this.fetch<string[]>('/api/v1/skills/categories');
  }

  /**
   * Get all skill tags
   */
  async getSkillTags(): Promise<string[]> {
    return this.fetch<string[]>('/api/v1/skills/tags');
  }

  /**
   * Get skill counts by type
   */
  async getSkillCounts(): Promise<SkillCounts> {
    return this.fetch<SkillCounts>('/api/v1/skills/count');
  }

  /**
   * Get skill system health
   */
  async getSkillHealth(): Promise<SkillSystemHealth> {
    return this.fetch<SkillSystemHealth>('/api/v1/skills/health');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MCP SERVER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List MCP servers
   */
  async listMCPServers(status?: string): Promise<MCPServer[]> {
    const params = status ? `?status_filter=${status}` : '';
    return this.fetch<MCPServer[]>(`/api/v1/skills/mcp-servers${params}`);
  }

  /**
   * Get MCP server by ID
   */
  async getMCPServer(serverId: string): Promise<MCPServer> {
    return this.fetch<MCPServer>(`/api/v1/skills/mcp-servers/${serverId}`);
  }

  /**
   * Create MCP server
   */
  async createMCPServer(server: MCPServerCreate): Promise<MCPServer> {
    return this.fetch<MCPServer>('/api/v1/skills/mcp-servers', {
      method: 'POST',
      body: JSON.stringify(server),
    });
  }

  /**
   * Delete MCP server
   */
  async deleteMCPServer(serverId: string): Promise<void> {
    return this.fetch(`/api/v1/skills/mcp-servers/${serverId}`, { method: 'DELETE' });
  }

  /**
   * Ingest tools from MCP server
   */
  async ingestFromMCPServer(serverId: string): Promise<IngestionResult> {
    return this.fetch<IngestionResult>(`/api/v1/skills/ingest/${serverId}`, {
      method: 'POST',
    });
  }

  /**
   * Sync skills from MCP server
   */
  async syncMCPServer(serverId: string): Promise<SyncResult> {
    return this.fetch<SyncResult>(`/api/v1/skills/sync/${serverId}`, {
      method: 'POST',
    });
  }

  /**
   * Ingest from all MCP servers
   */
  async ingestAllMCPServers(): Promise<BulkIngestResponse> {
    return this.fetch<BulkIngestResponse>('/api/v1/skills/ingest-all', {
      method: 'POST',
    });
  }

  /**
   * Get available models from all providers
   */
  async getModels(): Promise<ModelsResponse> {
    return this.fetch<ModelsResponse>('/api/v1/agents/models/available');
  }

  // Legacy methods for backward compatibility
  /**
   * @deprecated Use searchSkills instead
   */
  async findSkills(query: string, limit = 5): Promise<SkillSummary[]> {
    return this.searchSkills(query, undefined, limit);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REPOSITORY MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List connected repositories
   */
  async listRepositories(): Promise<Repository[]> {
    return this.fetch<Repository[]>('/api/v1/repositories');
  }

  /**
   * Connect a GitHub repository
   */
  async connectRepository(repoUrl: string): Promise<Repository> {
    return this.fetch<Repository>('/api/v1/repositories', {
      method: 'POST',
      body: JSON.stringify({ url: repoUrl }),
    });
  }

  /**
   * Get repository files/structure
   */
  async getRepositoryFiles(
    repo: string,
    path = '/'
  ): Promise<{ name: string; type: 'file' | 'directory'; path: string }[]> {
    return this.fetch(`/api/v1/repositories/${encodeURIComponent(repo)}/files?path=${encodeURIComponent(path)}`);
  }

  /**
   * Get file content
   */
  async getFileContent(repo: string, filePath: string): Promise<{ content: string; encoding: string }> {
    return this.fetch(`/api/v1/repositories/${encodeURIComponent(repo)}/files/${encodeURIComponent(filePath)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List all users (admin only)
   */
  async listUsers(params: { skip?: number; limit?: number; role?: string } = {}): Promise<{
    users: User[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params.skip) {query.append('skip', params.skip.toString());}
    if (params.limit) {query.append('limit', params.limit.toString());}
    if (params.role) {query.append('role', params.role);}
    return this.fetch(`/api/v1/admin/users?${query.toString()}`);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: string): Promise<User> {
    return this.fetch(`/api/v1/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    return this.fetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE' });
  }

  /**
   * Get audit logs (admin only)
   */
  async getAuditLogs(params: {
    skip?: number;
    limit?: number;
    userId?: string;
    action?: string;
  } = {}): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params.skip) {query.append('skip', params.skip.toString());}
    if (params.limit) {query.append('limit', params.limit.toString());}
    if (params.userId) {query.append('user_id', params.userId);}
    if (params.action) {query.append('action', params.action);}
    return this.fetch(`/api/v1/admin/audit-logs?${query.toString()}`);
  }

  /**
   * Get system stats (admin only)
   */
  async getSystemStats(): Promise<SystemStats> {
    return this.fetch('/api/v1/admin/stats');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // USER PROFILE ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return this.fetch('/api/v1/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: { username?: string; email?: string; full_name?: string }): Promise<UserProfile> {
    return this.fetch('/api/v1/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.fetch('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async getUsageStats(): Promise<UsageStats> {
    return this.fetch('/api/v1/profile/usage');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List projects for current user
   */
  async listProjects(params: {
    skip?: number;
    limit?: number;
    status?: ProjectStatus;
    search?: string;
  } = {}): Promise<ProjectListResponse> {
    const query = new URLSearchParams();
    if (params.skip !== undefined) {query.append('skip', params.skip.toString());}
    if (params.limit !== undefined) {query.append('limit', params.limit.toString());}
    if (params.status) {query.append('status', params.status);}
    if (params.search) {query.append('search', params.search);}
    return this.fetch(`/api/v1/projects?${query.toString()}`);
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    return this.fetch<Project>(`/api/v1/projects/${projectId}`);
  }

  /**
   * Create a new project
   */
  async createProject(data: ProjectCreate): Promise<Project> {
    return this.fetch<Project>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, data: ProjectUpdate): Promise<Project> {
    return this.fetch<Project>(`/api/v1/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, deleteFiles = false): Promise<void> {
    const query = deleteFiles ? '?delete_files=true' : '';
    return this.fetch(`/api/v1/projects/${projectId}${query}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<Project> {
    return this.fetch<Project>(`/api/v1/projects/${projectId}/status?new_status=${status}`, {
      method: 'POST',
    });
  }

  /**
   * Get recent projects for dashboard
   */
  async getRecentProjects(limit = 5): Promise<ProjectSummary[]> {
    return this.fetch<ProjectSummary[]>(`/api/v1/projects/summary/recent?limit=${limit}`);
  }

  /**
   * Get project directory info
   */
  async getProjectDirectoryInfo(projectId: string): Promise<ProjectDirectoryInfo> {
    return this.fetch<ProjectDirectoryInfo>(`/api/v1/projects/${projectId}/directory`);
  }

  /**
   * List files in a project directory
   * Uses the /api/v1/files/{projectId} endpoint and transforms response
   */
  async getProjectFiles(projectId: string, _maxDepth = 10, _maxFiles = 1000): Promise<ProjectFilesResponse> {
    // Call the new files endpoint
    interface FilesApiResponse {
      files: Array<{
        id: string;
        path: string;
        name: string;
        language: string;
        size: number;
        updated_at: string;
      }>;
      total: number;
    }

    const response = await this.fetch<FilesApiResponse>(`/api/v1/files/${projectId}`);

    // Transform to expected ProjectFilesResponse format
    const files: ProjectFile[] = response.files.map(f => ({
      path: f.path,
      name: f.name,
      size: f.size,
      is_directory: false,
      extension: f.name.includes('.') ? f.name.split('.').pop() || null : null,
      modified_at: f.updated_at,
    }));

    return {
      project_id: projectId,
      directory_path: '',
      files,
      total_files: response.total,
      total_size: files.reduce((sum, f) => sum + f.size, 0),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

type WebSocketEventType = 'connected' | 'disconnected' | 'message' | 'phaseUpdate' | 'skillExecution' | 'fileChange' | 'error' | 'hitlRequest' | 'reconnectFailed';

export class PronetheiaWebSocket {
  private baseUrl: string;
  private socket: WebSocket | null = null;
  private listeners: Map<WebSocketEventType, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(baseUrl = WS_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Connect to WebSocket server
   */
  connect(sessionId: string, token: string) {
    const url = `${this.baseUrl}/sessions/${sessionId}?token=${token}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      this.emit('connected', { sessionId });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('[WS] Failed to parse message:', e);
      }
    };

    this.socket.onerror = (error) => {
      console.error('[WS] Error:', error);
      this.emit('error', error);
    };

    this.socket.onclose = () => {
      console.log('[WS] Disconnected');
      this.emit('disconnected', {});
      this.attemptReconnect(sessionId, token);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: { type: string; payload: unknown }) {
    const { type, payload } = data;

    switch (type) {
      case 'message':
        this.emit('message', payload);
        break;

      case 'phase_update':
        this.emit('phaseUpdate', payload);
        break;

      case 'skill_execution':
        this.emit('skillExecution', payload);
        break;

      case 'file_change':
        this.emit('fileChange', payload);
        break;

      case 'error':
        this.emit('error', payload);
        break;

      case 'hitl_request':
        // Human-in-the-Loop circuit breaker
        this.emit('hitlRequest', payload);
        break;

      default:
        console.warn('[WS] Unknown message type:', type);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(sessionId: string, token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      this.emit('reconnectFailed', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(sessionId, token);
    }, delay);
  }

  /**
   * Send a message through WebSocket
   */
  send(type: string, payload: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.error('[WS] Socket not connected');
    }
  }

  /**
   * Subscribe to events
   */
  on(event: WebSocketEventType, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event to listeners
   */
  private emit(event: WebSocketEventType, data: unknown) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error(`[WS] Listener error for ${event}:`, e);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for API client
 */
export function usePronetheiaAPI(token?: string): PronetheiaAPI {
  const apiRef = useRef<PronetheiaAPI | null>(null);

  if (!apiRef.current) {
    apiRef.current = new PronetheiaAPI();
  }

  useEffect(() => {
    if (token) {
      apiRef.current?.setToken(token);
    }
  }, [token]);

  return apiRef.current;
}

/**
 * Hook for WebSocket connection
 */
export function usePronetheiaWebSocket(sessionId?: string, token?: string) {
  const wsRef = useRef<PronetheiaWebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [phases, setPhases] = useState<Record<string, string>>({});
  const [hitlRequest, setHitlRequest] = useState<unknown>(null);

  useEffect(() => {
    if (!sessionId || !token) {return;}

    wsRef.current = new PronetheiaWebSocket();

    // Set up listeners
    const unsubConnected = wsRef.current.on('connected', () => setConnected(true));
    const unsubDisconnected = wsRef.current.on('disconnected', () => setConnected(false));
    const unsubMessage = wsRef.current.on('message', (msg) => {
      setMessages((prev) => [...prev, msg as Message]);
    });
    const unsubPhase = wsRef.current.on('phaseUpdate', (update) => {
      const { phase, status } = update as { phase: string; status: string };
      setPhases((prev) => ({
        ...prev,
        [phase]: status,
      }));
    });
    const unsubHitl = wsRef.current.on('hitlRequest', setHitlRequest);

    // Connect
    wsRef.current.connect(sessionId, token);

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubMessage();
      unsubPhase();
      unsubHitl();
      wsRef.current?.disconnect();
    };
  }, [sessionId, token]);

  const sendMessage = useCallback((content: string) => {
    wsRef.current?.send('message', { content });
  }, []);

  const respondToHitl = useCallback((response: unknown) => {
    wsRef.current?.send('hitl_response', response);
    setHitlRequest(null);
  }, []);

  return {
    connected,
    messages,
    phases,
    hitlRequest,
    sendMessage,
    respondToHitl,
  };
}

/**
 * Hook for sessions management
 */
export function useSessions(api: PronetheiaAPI, repo?: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!repo) {return;}

    setLoading(true);
    setError(null);

    try {
      const data = await api.listSessions(repo);
      setSessions(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api, repo]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createSession = useCallback(
    async (title: string, description?: string) => {
      if (!repo) {throw new Error('No repository selected');}
      const session = await api.createSession({ title, repo, description });
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    [api, repo]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await api.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    },
    [api]
  );

  return {
    sessions,
    loading,
    error,
    createSession,
    deleteSession,
    refresh: loadSessions,
  };
}

/**
 * Hook for the Unified Skill System
 */
export function useSkills(api: PronetheiaAPI) {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useCallback(
    async (filters: SkillFilters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.listSkills({
          ...filters,
          page: filters.page || page,
          page_size: filters.page_size || pageSize,
        });
        setSkills(response.skills);
        setTotal(response.total);
        setPage(response.page);
        setPageSize(response.page_size);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    },
    [api, page, pageSize]
  );

  const searchSkills = useCallback(
    async (query: string, skillType?: SkillType, limit = 20) => {
      setLoading(true);
      setError(null);
      try {
        const results = await api.searchSkills(query, skillType, limit);
        return results;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const executeSkill = useCallback(
    async (skillId: string, params: Record<string, unknown> = {}, options: { sessionId?: string; agentId?: string; feature?: string } = {}) => {
      return api.executeSkill(skillId, {
        params,
        session_id: options.sessionId,
        agent_id: options.agentId,
        feature: options.feature || 'chat',
      });
    },
    [api]
  );

  const executeSkillByName = useCallback(
    async (name: string, params: Record<string, unknown> = {}, options: { sessionId?: string; agentId?: string; feature?: string } = {}) => {
      return api.executeSkillByName(name, {
        params,
        session_id: options.sessionId,
        agent_id: options.agentId,
        feature: options.feature || 'chat',
      });
    },
    [api]
  );

  const getSkillStats = useCallback(
    async (skillId: string) => {
      return api.getSkillStats(skillId);
    },
    [api]
  );

  return {
    skills,
    total,
    page,
    pageSize,
    loading,
    error,
    loadSkills,
    searchSkills,
    executeSkill,
    executeSkillByName,
    getSkillStats,
    setPage,
    setPageSize,
  };
}

/**
 * Hook for MCP server management
 */
export function useMCPServers(api: PronetheiaAPI) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServers = useCallback(
    async (status?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listMCPServers(status);
        setServers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load MCP servers');
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const createServer = useCallback(
    async (server: MCPServerCreate) => {
      const created = await api.createMCPServer(server);
      setServers((prev) => [...prev, created]);
      return created;
    },
    [api]
  );

  const deleteServer = useCallback(
    async (serverId: string) => {
      await api.deleteMCPServer(serverId);
      setServers((prev) => prev.filter((s) => s.id !== serverId));
    },
    [api]
  );

  const ingestFromServer = useCallback(
    async (serverId: string) => {
      return api.ingestFromMCPServer(serverId);
    },
    [api]
  );

  const syncServer = useCallback(
    async (serverId: string) => {
      return api.syncMCPServer(serverId);
    },
    [api]
  );

  const ingestAll = useCallback(async () => {
    return api.ingestAllMCPServers();
  }, [api]);

  return {
    servers,
    loading,
    error,
    loadServers,
    createServer,
    deleteServer,
    ingestFromServer,
    syncServer,
    ingestAll,
  };
}

/**
 * Hook for models
 */
export function useModels(api: PronetheiaAPI) {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getModels();
      setProviders(data.providers);
      // Flatten all models for easy access
      const flat = data.providers.flatMap((p) => p.models);
      setAllModels(flat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
      // Fallback to basic models if API fails
      setAllModels([
        { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', tier: 'premium', context: 200000 },
        { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', tier: 'premium', context: 200000 },
        { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', tier: 'standard', context: 200000 },
        { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', tier: 'fast', context: 200000 },
        { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'premium', context: 128000 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    providers,
    models: allModels,
    loading,
    error,
    refresh: loadModels,
  };
}

/**
 * Hook for projects management
 */
export function useProjects(api: PronetheiaAPI) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(
    async (params: { skip?: number; limit?: number; status?: ProjectStatus; search?: string } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listProjects(params);
        setProjects(data.projects);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const createProject = useCallback(
    async (data: ProjectCreate) => {
      const project = await api.createProject(data);
      setProjects((prev) => [project, ...prev]);
      setTotal((prev) => prev + 1);
      return project;
    },
    [api]
  );

  const updateProject = useCallback(
    async (projectId: string, data: ProjectUpdate) => {
      const project = await api.updateProject(projectId, data);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? project : p)));
      return project;
    },
    [api]
  );

  const deleteProject = useCallback(
    async (projectId: string, deleteFiles = false) => {
      await api.deleteProject(projectId, deleteFiles);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setTotal((prev) => prev - 1);
    },
    [api]
  );

  const updateStatus = useCallback(
    async (projectId: string, status: ProjectStatus) => {
      const project = await api.updateProjectStatus(projectId, status);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? project : p)));
      return project;
    },
    [api]
  );

  return {
    projects,
    total,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    updateStatus,
  };
}

/**
 * Hook for recent projects (dashboard)
 */
export function useRecentProjects(api: PronetheiaAPI, limit = 5) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecentProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecentProjects(limit);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent projects');
    } finally {
      setLoading(false);
    }
  }, [api, limit]);

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  return {
    projects,
    loading,
    error,
    refresh: loadRecentProjects,
  };
}

export default PronetheiaAPI;
