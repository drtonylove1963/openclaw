/**
 * useWorkflowApi Hook
 * Handles all API interactions for the workflow builder.
 */

import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

const API_BASE = (import.meta.env.VITE_API_URL) ?? '';

interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  isDirty?: boolean;
}

interface ExecutionResult {
  id: string;
  workflow_id: string;
  status: string;
  input_data?: any;
  output_data?: any;
  node_results: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface WorkflowListItem {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  node_count: number;
}

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export function useWorkflowApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Generic fetch wrapper
  const apiFetch = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Unknown error',
      };
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load workflow by ID
  const loadWorkflow = useCallback(async (workflowId: string): Promise<WorkflowData | null> => {
    try {
      const response = await apiFetch<{ workflow: WorkflowData }>(
        `/api/v1/workflows/${workflowId}`
      );
      return response.workflow;
    } catch (err) {
      console.error('Failed to load workflow:', err);
      return null;
    }
  }, [apiFetch]);

  // Save workflow
  const saveWorkflow = useCallback(async (workflow: WorkflowData): Promise<WorkflowData> => {
    // Convert React Flow format to backend format
    const backendFormat = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      nodes: workflow.nodes.map((node) => ({
        id: node.id,
        type: node.data?.type || node.type,
        name: node.data?.label || '',
        config: node.data?.config || {},
        position: node.position,
      })),
      connections: workflow.edges.map((edge) => ({
        source: edge.source,
        sourceOutput: parseInt(edge.sourceHandle || '0', 10),
        target: edge.target,
        targetInput: parseInt(edge.targetHandle || '0', 10),
      })),
    };

    const isNew = !workflow.id || workflow.id.startsWith('workflow-');
    const method = isNew ? 'POST' : 'PUT';
    const endpoint = isNew
      ? '/api/v1/workflows'
      : `/api/v1/workflows/${workflow.id}`;

    const response = await apiFetch<{ workflow: WorkflowData }>(endpoint, {
      method,
      body: JSON.stringify(backendFormat),
    });

    return response.workflow;
  }, [apiFetch]);

  // Execute workflow
  const executeWorkflow = useCallback(async (
    workflowId: string,
    workflowData: { nodes: Node[]; edges: Edge[] },
    inputData: any = {}
  ): Promise<ExecutionResult> => {
    // Convert to backend format for execution
    const executionRequest = {
      workflow: {
        id: workflowId,
        name: 'Execution',
        nodes: workflowData.nodes.map((node) => ({
          id: node.id,
          type: node.data?.type || node.type,
          name: node.data?.label || '',
          config: node.data?.config || {},
          position: node.position,
        })),
        connections: workflowData.edges.map((edge) => ({
          source: edge.source,
          sourceOutput: parseInt(edge.sourceHandle || '0', 10),
          target: edge.target,
          targetInput: parseInt(edge.targetHandle || '0', 10),
        })),
      },
      input_data: inputData,
    };

    const response = await apiFetch<ExecutionResult>(
      '/api/v1/workflows/execute',
      {
        method: 'POST',
        body: JSON.stringify(executionRequest),
      }
    );

    return response;
  }, [apiFetch]);

  // List workflows
  const listWorkflows = useCallback(async (
    page: number = 1,
    limit: number = 20
  ): Promise<{ workflows: WorkflowListItem[]; total: number }> => {
    const response = await apiFetch<{ workflows: WorkflowListItem[]; total: number }>(
      `/api/v1/workflows?page=${page}&limit=${limit}`
    );
    return response;
  }, [apiFetch]);

  // Delete workflow
  const deleteWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    try {
      await apiFetch(`/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      return false;
    }
  }, [apiFetch]);

  // Get execution status
  const getExecutionStatus = useCallback(async (executionId: string): Promise<ExecutionResult> => {
    const response = await apiFetch<ExecutionResult>(
      `/api/v1/workflows/executions/${executionId}`
    );
    return response;
  }, [apiFetch]);

  // List executions
  const listExecutions = useCallback(async (
    workflowId?: string,
    limit: number = 20
  ): Promise<ExecutionResult[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (workflowId) {
      params.append('workflow_id', workflowId);
    }

    const response = await apiFetch<{ executions: ExecutionResult[] }>(
      `/api/v1/workflows/executions?${params}`
    );
    return response.executions;
  }, [apiFetch]);

  // Cancel execution
  const cancelExecution = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      await apiFetch(`/api/v1/workflows/executions/${executionId}/cancel`, {
        method: 'POST',
      });
      return true;
    } catch (err) {
      return false;
    }
  }, [apiFetch]);

  // Get available node types
  const getNodeTypes = useCallback(async (): Promise<Record<string, any>> => {
    const response = await apiFetch<{ executors: Record<string, any> }>(
      '/api/v1/workflows/node-types'
    );
    return response.executors;
  }, [apiFetch]);

  // Validate workflow
  const validateWorkflow = useCallback(async (
    workflowData: { nodes: Node[]; edges: Edge[] }
  ): Promise<{ valid: boolean; errors: string[] }> => {
    const response = await apiFetch<{ valid: boolean; errors: string[] }>(
      '/api/v1/workflows/validate',
      {
        method: 'POST',
        body: JSON.stringify({
          nodes: workflowData.nodes.map((node) => ({
            id: node.id,
            type: node.data?.type || node.type,
            config: node.data?.config || {},
          })),
          connections: workflowData.edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
          })),
        }),
      }
    );
    return response;
  }, [apiFetch]);

  // Export workflow
  const exportWorkflow = useCallback(async (
    workflowId: string,
    format: 'json' | 'yaml' = 'json'
  ): Promise<string> => {
    const response = await apiFetch<{ content: string }>(
      `/api/v1/workflows/${workflowId}/export?format=${format}`
    );
    return response.content;
  }, [apiFetch]);

  // Import workflow
  const importWorkflow = useCallback(async (
    content: string,
    format: 'json' | 'yaml' = 'json'
  ): Promise<WorkflowData> => {
    const response = await apiFetch<{ workflow: WorkflowData }>(
      '/api/v1/workflows/import',
      {
        method: 'POST',
        body: JSON.stringify({ content, format }),
      }
    );
    return response.workflow;
  }, [apiFetch]);

  // Duplicate workflow
  const duplicateWorkflow = useCallback(async (workflowId: string): Promise<WorkflowData> => {
    const response = await apiFetch<{ workflow: WorkflowData }>(
      `/api/v1/workflows/${workflowId}/duplicate`,
      { method: 'POST' }
    );
    return response.workflow;
  }, [apiFetch]);

  return {
    isLoading,
    error,
    loadWorkflow,
    saveWorkflow,
    executeWorkflow,
    listWorkflows,
    deleteWorkflow,
    getExecutionStatus,
    listExecutions,
    cancelExecution,
    getNodeTypes,
    validateWorkflow,
    exportWorkflow,
    importWorkflow,
    duplicateWorkflow,
  };
}

export default useWorkflowApi;
