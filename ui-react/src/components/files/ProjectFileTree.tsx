/**
 * ProjectFileTree.tsx
 * Main file tree component using react-arborist for virtualized rendering.
 * Displays project file structure with expand/collapse and selection.
 */

import React, { useRef, useCallback } from 'react';
import { Tree, NodeApi } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import { useFileTree } from './useFileTree';
import { FileTreeNode } from './FileTreeNode';
import type { TreeNode } from './fileTreeUtils';

/**
 * Theme constants matching FilesPanel.tsx dark theme.
 */
const THEME = {
  bg: {
    primary: '#0a0f1c',
    secondary: '#0d1321',
  },
  accent: {
    cyan: '#00D9FF',
  },
  text: {
    primary: '#E2E8F0',
    muted: '#64748B',
  },
};

/**
 * Props for ProjectFileTree component.
 */
export interface ProjectFileTreeProps {
  /** Project ID to fetch files for (null disables fetching) */
  projectId: string | null;
  /** Callback when a file is selected */
  onFileSelect?: (file: TreeNode) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * ProjectFileTree component.
 * Renders a virtualized file tree using react-arborist.
 */
export function ProjectFileTree({ projectId, onFileSelect, className }: ProjectFileTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width = 300, height = 400 } = useResizeObserver({ ref: containerRef });

  const { treeData, isLoading, error, totalFiles } = useFileTree(projectId);

  // Handle selection change
  const handleSelect = useCallback(
    (nodes: NodeApi<TreeNode>[]) => {
      if (nodes.length > 0 && onFileSelect) {
        const selectedNode = nodes[0];
        // Only trigger for files, not directories
        if (!selectedNode.data.data.isDirectory) {
          onFileSelect(selectedNode.data);
        }
      }
    },
    [onFileSelect]
  );

  // Container styles
  const containerStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    background: THEME.bg.secondary,
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: THEME.text.muted,
    fontSize: 13,
    gap: 8,
  };

  const emptyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 24,
    textAlign: 'center',
  };

  const errorStyle: React.CSSProperties = {
    ...emptyStyle,
    color: '#FF4757',
  };

  // Loading state
  if (isLoading) {
    return (
      <div ref={containerRef} style={containerStyle} className={className}>
        <div style={loadingStyle}>
          <span style={{ fontSize: 20 }}>*</span>
          <span>Loading files...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={containerRef} style={containerStyle} className={className}>
        <div style={errorStyle}>
          <span style={{ fontSize: 24, marginBottom: 8 }}>!</span>
          <span style={{ color: THEME.text.primary, marginBottom: 4 }}>Error loading files</span>
          <span style={{ fontSize: 11, color: THEME.text.muted }}>{error.message}</span>
        </div>
      </div>
    );
  }

  // Empty state (no project selected or no files)
  if (!projectId || treeData.length === 0) {
    return (
      <div ref={containerRef} style={containerStyle} className={className}>
        <div style={emptyStyle}>
          <span style={{ fontSize: 32, color: THEME.text.muted, marginBottom: 12 }}>[]</span>
          <span style={{ fontSize: 13, color: THEME.text.primary, marginBottom: 4 }}>
            {projectId ? 'No files found' : 'No project selected'}
          </span>
          <span style={{ fontSize: 11, color: THEME.text.muted }}>
            {projectId ? 'Project directory is empty' : 'Select a project to view files'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={containerStyle} className={className}>
      <Tree<TreeNode>
        data={treeData}
        width={width}
        height={height}
        rowHeight={28}
        indent={16}
        openByDefault={false}
        disableDrag
        disableDrop
        disableEdit
        onSelect={handleSelect}
      >
        {FileTreeNode}
      </Tree>
      {/* File count footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '6px 12px',
          fontSize: 10,
          color: THEME.text.muted,
          background: THEME.bg.primary,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {totalFiles} files
      </div>
    </div>
  );
}

export default ProjectFileTree;
