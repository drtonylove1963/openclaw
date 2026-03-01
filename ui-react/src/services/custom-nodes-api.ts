/**
 * Custom Nodes API Service
 *
 * Handles custom node operations for the workflow builder:
 * - Fetching custom node definitions from the database
 * - Creating new custom nodes (for AI-generated workflows)
 * - CRUD operations on custom nodes
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CustomNodeDefinition {
  id: string;
  node_id: string;
  type: string;
  label: string;
  description: string;
  category: string;
  subcategory?: string;
  icon: string;
  color: string;
  data: Record<string, unknown>;
  config_schema: Record<string, unknown>;
  execution_config: Record<string, unknown>;
  tags: string[];
  is_public: boolean;
  is_verified: boolean;
  source: string;
  created_at?: string;
  updated_at?: string;
}

export interface NodeDefinition {
  id: string;
  type: string;
  label: string;
  description: string;
  category: string;
  subcategory?: string;
  icon: string;
  color: string;
  data: Record<string, unknown>;
  tags: string[];
  isCustom: boolean;
  isVerified: boolean;
}

export interface CustomNodeListResponse {
  nodes: NodeDefinition[];
  total: number;
}

export interface CustomNodeCreate {
  node_id: string;
  node_type?: string;
  label: string;
  description?: string;
  category?: string;
  subcategory?: string;
  icon?: string;
  color?: string;
  default_data?: Record<string, unknown>;
  config_schema?: Record<string, unknown>;
  execution_config?: Record<string, unknown>;
  tags?: string[];
  is_public?: boolean;
  source?: string;
}

export interface CustomNodeUpdate {
  label?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  icon?: string;
  color?: string;
  default_data?: Record<string, unknown>;
  config_schema?: Record<string, unknown>;
  execution_config?: Record<string, unknown>;
  tags?: string[];
  is_public?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('pronetheia_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all custom nodes from the database
 * Returns nodes in NodeDefinition format for easy integration with node palette
 */
export async function getCustomNodes(params?: {
  category?: string;
  search?: string;
  includePrivate?: boolean;
  limit?: number;
  offset?: number;
}): Promise<CustomNodeListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) {searchParams.set('category', params.category);}
  if (params?.search) {searchParams.set('search', params.search);}
  if (params?.includePrivate) {searchParams.set('include_private', 'true');}
  if (params?.limit) {searchParams.set('limit', String(params.limit));}
  if (params?.offset) {searchParams.set('offset', String(params.offset));}

  const queryString = searchParams.toString();
  const url = `${API_BASE}/api/v1/custom-nodes${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse<CustomNodeListResponse>(response);
}

/**
 * Get a single custom node by node_id
 */
export async function getCustomNode(nodeId: string): Promise<CustomNodeDefinition> {
  const response = await fetch(`${API_BASE}/api/v1/custom-nodes/${encodeURIComponent(nodeId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse<CustomNodeDefinition>(response);
}

/**
 * Create a new custom node
 */
export async function createCustomNode(node: CustomNodeCreate): Promise<CustomNodeDefinition> {
  const response = await fetch(`${API_BASE}/api/v1/custom-nodes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(node),
  });

  return handleResponse<CustomNodeDefinition>(response);
}

/**
 * Ensure a custom node exists - creates if not exists, returns existing if it does
 * This is the main function used by the AI workflow generator
 */
export async function ensureCustomNode(node: CustomNodeCreate): Promise<CustomNodeDefinition> {
  const response = await fetch(`${API_BASE}/api/v1/custom-nodes/ensure`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(node),
  });

  return handleResponse<CustomNodeDefinition>(response);
}

/**
 * Update an existing custom node
 */
export async function updateCustomNode(
  nodeId: string,
  update: CustomNodeUpdate
): Promise<CustomNodeDefinition> {
  const response = await fetch(`${API_BASE}/api/v1/custom-nodes/${encodeURIComponent(nodeId)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(update),
  });

  return handleResponse<CustomNodeDefinition>(response);
}

/**
 * Delete a custom node (soft delete)
 */
export async function deleteCustomNode(nodeId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/custom-nodes/${encodeURIComponent(nodeId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
}

/**
 * Get list of all categories used by custom nodes
 */
export async function getCustomNodeCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/v1/custom-nodes/categories/list`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse<string[]>(response);
}

/**
 * Batch ensure multiple custom nodes
 * Useful when generating workflows with multiple new node types
 */
export async function ensureMultipleCustomNodes(
  nodes: CustomNodeCreate[]
): Promise<CustomNodeDefinition[]> {
  const results = await Promise.all(nodes.map(node => ensureCustomNode(node)));
  return results;
}
