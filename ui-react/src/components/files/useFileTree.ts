/**
 * useFileTree.ts
 * React Query hook for fetching project files and transforming to tree structure.
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PronetheiaAPI } from '../../services/pronetheia-api';
import { buildTree, TreeNode } from './fileTreeUtils';

/**
 * Return type for useFileTree hook.
 */
export interface UseFileTreeResult {
  /** Hierarchical tree data for react-arborist */
  treeData: TreeNode[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Function to manually refresh tree data */
  refresh: () => void;
  /** Total file count from API */
  totalFiles: number;
  /** Total size in bytes */
  totalSize: number;
}

/**
 * Hook for fetching and managing project file tree data.
 *
 * Uses React Query for caching and automatic refetching.
 * Transforms flat API response to hierarchical tree using buildTree.
 *
 * @param projectId - Project ID to fetch files for (null disables fetching)
 * @returns Object with treeData, loading state, error, and refresh function
 *
 * @example
 * ```tsx
 * function FileTree({ projectId }: { projectId: string }) {
 *   const { treeData, isLoading, error, refresh } = useFileTree(projectId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <Tree data={treeData} ... />
 *   );
 * }
 * ```
 */
export function useFileTree(projectId: string | null): UseFileTreeResult {
  const queryClient = useQueryClient();

  // Fetch files from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      if (!projectId) {
        return null;
      }
      const api = new PronetheiaAPI();
      return api.getProjectFiles(projectId);
    },
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds cache
    retry: 2,
  });

  // Transform flat file list to tree structure
  // Memoized to prevent re-computation on every render
  const treeData = useMemo(() => {
    if (!data?.files) {
      return [];
    }
    return buildTree(data.files);
  }, [data?.files]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
    }
  }, [queryClient, projectId]);

  return {
    treeData,
    isLoading,
    error: error,
    refresh,
    totalFiles: data?.total_files ?? 0,
    totalSize: data?.total_size ?? 0,
  };
}

export default useFileTree;
