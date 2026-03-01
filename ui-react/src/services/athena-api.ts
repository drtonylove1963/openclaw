/**
 * Athena API Service
 *
 * Client for the Athena orchestration layer APIs.
 */

import { API_BASE_URL } from '../config/api';

const ATHENA_BASE = `${API_BASE_URL}/api/v1/athena`;

// ============================================================================
// Types
// ============================================================================

export interface Skill {
  id: string;
  version: number;
  name: string;
  slug: string;
  domain: string;
  stack: string[];
  content: string;
  description: string | null;
  triggers: {
    keywords: string[];
    task_types: string[];
    intent_patterns: string[];
  };
  capabilities: string[];
  compliance_patterns: any;
  usage_count: number;
  last_used_at: string | null;
  effectiveness_score: number;
  avg_compliance_score: number;
  avg_user_rating: number;
  total_ratings: number;
  health_status: 'healthy' | 'stale' | 'underperforming';
  is_current: boolean;
  created_at: string;
  created_by: string | null;
}

export interface Agent {
  id: string;
  version: number;
  name: string;
  slug: string;
  role: string;
  domains: string[];
  capabilities: string[];
  prompt_content: string;
  receives_skills: boolean;
  skill_affinity: string[];
  usage_count: number;
  last_used_at: string | null;
  avg_compliance_score: number;
  is_current: boolean;
  created_at: string;
  created_by: string | null;
}

export interface Gap {
  id: string;
  task_description: string;
  task_keywords: string[];
  task_type: string | null;
  best_match_skill_id: string | null;
  best_match_score: number | null;
  status: 'pending' | 'generating' | 'resolved' | 'dismissed' | 'failed';
  resolved_at: string | null;
  generated_skill_id: string | null;
  resolution_notes: string | null;
  detected_at: string;
}

export interface ParsedTask {
  original: string;
  keywords: string[];
  task_type: string | null;
  intent: string | null;
  domain_hints: string[];
  stack_hints: string[];
  complexity: string;
}

export interface MatchedSkill {
  skill_id: string;
  skill_name: string;
  skill_slug: string;
  score: number;
  match_reasons: string[];
}

export interface MatchedAgent {
  agent_id: string;
  agent_name: string;
  agent_slug: string;
  score: number;
  match_reasons: string[];
}

export interface RouteResponse {
  parsed_task: ParsedTask;
  matched_skills: MatchedSkill[];
  matched_agent: MatchedAgent | null;
  gap_detected: boolean;
  gap_id: string | null;
  context_preview: string | null;
}

export interface SystemStats {
  total_skills: number;
  healthy_skills: number;
  stale_skills: number;
  underperforming_skills: number;
  total_agents: number;
  active_agents: number;
  pending_gaps: number;
  total_ratings: number;
}

export interface GapStats {
  total: number;
  pending: number;
  generating: number;
  resolved: number;
  dismissed: number;
  failed: number;
}

export interface AthenaConfig {
  skill_score_threshold: number;
  agent_score_threshold: number;
  max_skills_per_task: number;
  enable_gap_detection: boolean;
  enable_auto_generation: boolean;
  max_context_tokens: number;
}

// ============================================================================
// API Functions
// ============================================================================

// System
export async function getSystemStats(): Promise<SystemStats> {
  const res = await fetch(`${ATHENA_BASE}/stats`);
  if (!res.ok) {throw new Error('Failed to fetch system stats');}
  return res.json();
}

export async function getHealth(): Promise<{ status: string; components: Record<string, string> }> {
  const res = await fetch(`${ATHENA_BASE}/health`);
  if (!res.ok) {throw new Error('Failed to fetch health');}
  return res.json();
}

export async function getConfig(): Promise<AthenaConfig> {
  const res = await fetch(`${ATHENA_BASE}/admin/config`);
  if (!res.ok) {throw new Error('Failed to fetch config');}
  return res.json();
}

// Skills
export async function listSkills(page = 1, pageSize = 50): Promise<{ skills: Skill[]; total: number }> {
  const res = await fetch(`${ATHENA_BASE}/skills?page=${page}&page_size=${pageSize}`);
  if (!res.ok) {throw new Error('Failed to fetch skills');}
  return res.json();
}

export async function getSkill(id: string): Promise<Skill> {
  const res = await fetch(`${ATHENA_BASE}/skills/${id}`);
  if (!res.ok) {throw new Error('Failed to fetch skill');}
  return res.json();
}

export async function getSkillBySlug(slug: string): Promise<Skill> {
  const res = await fetch(`${ATHENA_BASE}/skills/slug/${slug}`);
  if (!res.ok) {throw new Error('Failed to fetch skill');}
  return res.json();
}

// Agents
export async function listAgents(page = 1, pageSize = 50): Promise<{ agents: Agent[]; total: number }> {
  const res = await fetch(`${ATHENA_BASE}/agents?page=${page}&page_size=${pageSize}`);
  if (!res.ok) {throw new Error('Failed to fetch agents');}
  return res.json();
}

export async function getAgent(id: string): Promise<Agent> {
  const res = await fetch(`${ATHENA_BASE}/agents/${id}`);
  if (!res.ok) {throw new Error('Failed to fetch agent');}
  return res.json();
}

// Gaps
export async function listGaps(status?: string, limit = 50, offset = 0): Promise<{ gaps: Gap[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) {params.set('status', status);}
  const res = await fetch(`${ATHENA_BASE}/gaps?${params}`);
  if (!res.ok) {throw new Error('Failed to fetch gaps');}
  return res.json();
}

export async function getGapStats(): Promise<GapStats> {
  const res = await fetch(`${ATHENA_BASE}/gaps/stats/summary`);
  if (!res.ok) {throw new Error('Failed to fetch gap stats');}
  return res.json();
}

export async function resolveGap(gapId: string, skillData?: any, autoGenerate = false): Promise<Skill> {
  const res = await fetch(`${ATHENA_BASE}/gaps/${gapId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skill_data: skillData,
      auto_generate: autoGenerate,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to resolve gap');
  }
  return res.json();
}

export async function dismissGap(gapId: string, reason?: string): Promise<void> {
  const res = await fetch(`${ATHENA_BASE}/gaps/${gapId}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {throw new Error('Failed to dismiss gap');}
}

export async function createGap(taskDescription: string, keywords?: string[], taskType?: string): Promise<Gap> {
  const res = await fetch(`${ATHENA_BASE}/gaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_description: taskDescription,
      task_keywords: keywords,
      task_type: taskType,
    }),
  });
  if (!res.ok) {throw new Error('Failed to create gap');}
  return res.json();
}

// Routing
export async function routeTask(task: string, context?: any): Promise<RouteResponse> {
  const res = await fetch(`${ATHENA_BASE}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, context }),
  });
  if (!res.ok) {throw new Error('Failed to route task');}
  return res.json();
}

export async function parseTask(task: string): Promise<ParsedTask> {
  const res = await fetch(`${ATHENA_BASE}/parse?task=${encodeURIComponent(task)}`, {
    method: 'POST',
  });
  if (!res.ok) {throw new Error('Failed to parse task');}
  return res.json();
}

// ============================================================================
// Skills Import API
// ============================================================================

const IMPORT_BASE = `${API_BASE_URL}/api/v1/skills-import`;

export interface ImportJob {
  id: string;
  source_type: 'github' | 'file' | 'skills-sh' | 'clawhub';
  source_url: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_skills: number;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  errors: Array<{ skill?: string; error: string }> | null;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export interface ImportPreview {
  source_type: string;
  source_url: string | null;
  total_skills: number;
  skills: Array<{
    name: string;
    slug: string;
    description: string | null;
    source_path: string;
    domain: string;
    tags: string[];
  }>;
  existing_count: number;
}

export interface ImportSource {
  type: string;
  name: string;
  description: string;
  formats: string[];
  supports_private: boolean;
  supports_preview: boolean;
}

export interface ImportPreset {
  id: string;
  name: string;
  description: string;
  repo_url: string;
  branch: string;
  path?: string;
  estimated_count: number;
}

// Get available import sources
export async function getImportSources(): Promise<{ sources: ImportSource[] }> {
  const res = await fetch(`${IMPORT_BASE}/sources`);
  if (!res.ok) {throw new Error('Failed to fetch import sources');}
  return res.json();
}

// Get import presets
export async function getImportPresets(): Promise<{ presets: ImportPreset[] }> {
  const res = await fetch(`${IMPORT_BASE}/presets`);
  if (!res.ok) {throw new Error('Failed to fetch import presets');}
  return res.json();
}

// Preview GitHub import
export async function previewGitHubImport(
  repoUrl: string,
  branch = 'main',
  path = ''
): Promise<ImportPreview> {
  const res = await fetch(`${IMPORT_BASE}/preview/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_url: repoUrl, branch, path }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to preview GitHub import');
  }
  return res.json();
}

// Import from GitHub
export async function importFromGitHub(
  repoUrl: string,
  options: {
    branch?: string;
    path?: string;
    skip_duplicates?: boolean;
    domain?: string;
    dry_run?: boolean;
  } = {}
): Promise<void> {
  const res = await fetch(`${IMPORT_BASE}/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_url: repoUrl,
      branch: options.branch || 'main',
      path: options.path || '',
      skip_duplicates:  options.skip_duplicates,
      domain: options.domain || null,
      dry_run: options.dry_run || false,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to import from GitHub');
  }
}

// Preview file import
export async function previewFileImport(file: File): Promise<ImportPreview> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${IMPORT_BASE}/preview/file`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to preview file import');
  }
  return res.json();
}

// Import from file
export async function importFromFile(
  file: File,
  options: {
    skip_duplicates?: boolean;
    domain?: string;
    dry_run?: boolean;
  } = {}
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams();
  if (options.skip_duplicates !== undefined) {params.set('skip_duplicates', String(options.skip_duplicates));}
  if (options.domain) {params.set('domain', options.domain);}
  if (options.dry_run !== undefined) {params.set('dry_run', String(options.dry_run));}

  const res = await fetch(`${IMPORT_BASE}/file?${params}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to import from file');
  }
}

// Import from preset
export async function importFromPreset(presetId: string): Promise<void> {
  const res = await fetch(`${IMPORT_BASE}/preset/${presetId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to import from preset');
  }
}

// Get import job status
export async function getImportStatus(jobId: string): Promise<ImportJob> {
  const res = await fetch(`${IMPORT_BASE}/status/${jobId}`);
  if (!res.ok) {throw new Error('Failed to fetch import status');}
  return res.json();
}

// List import jobs
export async function listImportJobs(limit = 20, status?: string): Promise<ImportJob[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) {params.set('status', status);}
  const res = await fetch(`${IMPORT_BASE}/jobs?${params}`);
  if (!res.ok) {throw new Error('Failed to fetch import jobs');}
  return res.json();
}

// ============================================================================
// Skills.sh Import API
// ============================================================================

export interface SkillsShSkill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
  description?: string | null;
  category?: string;
  keywords?: string[];
}

export interface SkillsShSearchResult {
  query: string | null;
  category: string | null;
  total: number;
  skills: SkillsShSkill[];
}

// Search skills.sh
export async function searchSkillsSh(
  query?: string,
  category?: string,
  limit = 50
): Promise<SkillsShSearchResult> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) {params.set('q', query);}
  if (category) {params.set('category', category);}
  const res = await fetch(`${IMPORT_BASE}/skills-sh/search?${params}`);
  if (!res.ok) {throw new Error('Failed to search skills.sh');}
  return res.json();
}

// Import from skills.sh
export async function importFromSkillsSh(options: {
  skill_ids?: string[];
  category?: string;
  skip_duplicates?: boolean;
  dry_run?: boolean;
} = {}): Promise<void> {
  const res = await fetch(`${IMPORT_BASE}/skills-sh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      skill_ids: options.skill_ids || null,
      category: options.category || null,
      skip_duplicates:  options.skip_duplicates,
      dry_run: options.dry_run || false,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to import from skills.sh');
  }
}

// ============================================================================
// ClawHub (clawhub.ai) Import API
// ============================================================================

export interface ClawHubSkill {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  source?: string;
  url?: string;
  version?: string;
  downloads?: number;
}

export interface ClawHubSearchResult {
  query: string | null;
  category: string | null;
  total: number;
  skills: ClawHubSkill[];
}

// Search ClawHub skills
export async function searchClawHub(
  query?: string,
  category?: string,
  limit = 50
): Promise<ClawHubSearchResult> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) {params.set('q', query);}
  if (category) {params.set('category', category);}
  const res = await fetch(`${IMPORT_BASE}/clawhub/search?${params}`);
  if (!res.ok) {throw new Error('Failed to search ClawHub');}
  return res.json();
}

// Import from ClawHub
export async function importFromClawHub(options: {
  query?: string;
  category?: string;
  skill_slugs?: string[];
  skip_duplicates?: boolean;
  dry_run?: boolean;
} = {}): Promise<void> {
  const res = await fetch(`${IMPORT_BASE}/clawhub`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: options.query || null,
      category: options.category || null,
      skill_slugs: options.skill_slugs || null,
      skip_duplicates:  options.skip_duplicates,
      dry_run: options.dry_run || false,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to import from ClawHub');
  }
}

// ============================================================================
// Security Scan API
// =============================================================================

export interface SecurityFinding {
  rule_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  evidence: string;
  line_number?: number;
  recommendation: string;
}

export interface SecurityScanResult {
  is_safe: boolean;
  score: number;
  blocked_reason?: string;
  findings: SecurityFinding[];
  warnings: string[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    total: number;
  };
}

export interface SecurityRule {
  id: string;
  category: string;
  severity: string;
  name: string;
  description: string;
  patterns: string[];
}

// Scan skill content
export async function scanSkillContent(content: string, name = 'Unknown'): Promise<SecurityScanResult> {
  const res = await fetch(`${IMPORT_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, name }),
  });
  if (!res.ok) {throw new Error('Failed to scan skill');}
  return res.json();
}

// Scan batch of skills
export async function scanSkillBatch(skills: Array<{ [key: string]: any }>): Promise<{
  total: number;
  safe: number;
  blocked: number;
  skills: Array<{
    name: string;
    slug: string;
    safe: boolean;
    score: number;
    findings_count: number;
    blocked_reason?: string;
  }>;
}> {
  const res = await fetch(`${IMPORT_BASE}/scan/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  });
  if (!res.ok) {throw new Error('Failed to scan batch');}
  return res.json();
}

// Get security rules info
export async function getSecurityRules(): Promise<{ rules: SecurityRule[] }> {
  const res = await fetch(`${IMPORT_BASE}/security/rules`);
  if (!res.ok) {throw new Error('Failed to fetch security rules');}
  return res.json();
}
