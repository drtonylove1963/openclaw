/**
 * fileTreeUtils.ts
 * Utilities for transforming flat file lists to hierarchical tree structure
 * for use with react-arborist.
 */

import type { ProjectFile } from '../../services/pronetheia-api';

/**
 * TreeNode interface matching react-arborist requirements.
 * Each node has an id, name, optional children, and data payload.
 */
export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  data: {
    path: string;
    isDirectory: boolean;
    size?: number;
    extension?: string;
  };
}

/**
 * File type configuration for icons and colors.
 * Maps file extensions to icon types.
 */
const FILE_TYPE_ICONS: Record<string, string> = {
  // Code files
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  go: 'go',
  rs: 'rust',
  java: 'java',
  cs: 'csharp',
  rb: 'ruby',
  php: 'php',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  // Config files
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  env: 'env',
  // Documentation
  md: 'markdown',
  txt: 'text',
  rst: 'text',
  // Styles
  css: 'css',
  scss: 'css',
  sass: 'css',
  less: 'css',
  // Data
  sql: 'database',
  csv: 'data',
  // Images
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  svg: 'image',
  ico: 'image',
  webp: 'image',
  // Web
  html: 'html',
  htm: 'html',
};

/**
 * Get icon type for a file extension.
 * @param extension - File extension without dot
 * @returns Icon type string
 */
export function getFileIcon(extension: string | null | undefined): string {
  if (!extension) {return 'file';}
  return FILE_TYPE_ICONS[extension.toLowerCase()] || 'file';
}

/**
 * Transform flat file list from API to hierarchical tree structure.
 *
 * Algorithm:
 * 1. Sort files by path to ensure parents are created before children
 * 2. For each file, split path into parts and traverse/create nodes
 * 3. Use lookup objects for O(n) performance
 *
 * @param files - Flat array of ProjectFile from API
 * @returns TreeNode[] for react-arborist
 */
export function buildTree(files: ProjectFile[]): TreeNode[] {
  if (!files || files.length === 0) {
    return [];
  }

  const result: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Sort files by path to ensure parents before children
  const sorted = [...files].toSorted((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      // Check if node already exists
      if (nodeMap.has(currentPath)) {
        continue;
      }

      // Determine if this is a directory
      // - If not the last part, it's always a directory (intermediate path)
      // - If last part, use the file's is_directory flag
      const isDirectory = !isLast || file.is_directory;

      // Create the node
      const node: TreeNode = {
        id: currentPath,
        name: part,
        children: isDirectory ? [] : undefined,
        data: {
          path: currentPath,
          isDirectory,
          size: isLast && !isDirectory ? file.size : undefined,
          extension: isLast && !isDirectory ? file.extension || undefined : undefined,
        },
      };

      nodeMap.set(currentPath, node);

      // Add to parent or root
      if (parentPath && nodeMap.has(parentPath)) {
        const parent = nodeMap.get(parentPath);
        if (parent.children) {
          parent.children.push(node);
        }
      } else if (!parentPath) {
        result.push(node);
      }
    }
  }

  // Sort children: directories first, then alphabetically
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      // Directories first
      if (a.data.isDirectory && !b.data.isDirectory) {return -1;}
      if (!a.data.isDirectory && b.data.isDirectory) {return 1;}
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
    // Recursively sort children
    for (const node of nodes) {
      if (node.children) {
        sortChildren(node.children);
      }
    }
  };

  sortChildren(result);

  return result;
}

/**
 * Find a node by path in the tree.
 * @param nodes - Tree nodes to search
 * @param path - Path to find
 * @returns TreeNode or undefined
 */
export function findNodeByPath(nodes: TreeNode[], path: string): TreeNode | undefined {
  const parts = path.split('/').filter(Boolean);
  let current: TreeNode[] | undefined = nodes;
  let found: TreeNode | undefined;

  for (const part of parts) {
    if (!current) {return undefined;}
    found = current.find(n => n.name === part);
    if (!found) {return undefined;}
    current = found.children;
  }

  return found;
}

/**
 * Get all file paths from a tree (flattened).
 * @param nodes - Tree nodes
 * @returns Array of file paths (non-directories only)
 */
export function getFilePaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];

  const traverse = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      if (!node.data.isDirectory) {
        paths.push(node.data.path);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  };

  traverse(nodes);
  return paths;
}

/**
 * Count total files and directories in tree.
 * @param nodes - Tree nodes
 * @returns Object with fileCount and directoryCount
 */
export function countNodes(nodes: TreeNode[]): { fileCount: number; directoryCount: number } {
  let fileCount = 0;
  let directoryCount = 0;

  const traverse = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      if (node.data.isDirectory) {
        directoryCount++;
      } else {
        fileCount++;
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  };

  traverse(nodes);
  return { fileCount, directoryCount };
}
