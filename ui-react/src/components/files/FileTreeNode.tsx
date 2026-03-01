/**
 * FileTreeNode.tsx
 * Custom tree node renderer for react-arborist file tree.
 * Displays files and folders with appropriate icons and styling.
 */

import React from 'react';
import type { NodeRendererProps } from 'react-arborist';
import type { LucideIcon } from 'lucide-react';
import { Folder, FolderOpen, File, FileText, FileCode, ChevronRight, ChevronDown } from 'lucide-react';
import type { TreeNode } from './fileTreeUtils';

/**
 * Theme constants matching FilesPanel.tsx dark theme.
 */
const THEME = {
  bg: {
    selected: 'rgba(0, 217, 255, 0.15)',
    hover: 'rgba(0, 217, 255, 0.08)',
  },
  accent: {
    cyan: '#00D9FF',
    yellow: '#FFD93D',
  },
  text: {
    primary: '#E2E8F0',
    muted: '#64748B',
  },
};

/**
 * File extensions that should use FileCode icon.
 */
const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'cs', 'rb', 'php',
  'c', 'cpp', 'h', 'json', 'yaml', 'yml', 'toml', 'xml', 'sql', 'html', 'css', 'scss',
]);

/**
 * File extensions that should use FileText icon.
 */
const TEXT_EXTENSIONS = new Set(['md', 'txt', 'rst', 'log']);

/**
 * Get the appropriate icon component for a file based on its extension.
 */
function getFileIconComponent(extension: string | undefined): LucideIcon {
  if (!extension) {return File;}
  const ext = extension.toLowerCase();
  if (CODE_EXTENSIONS.has(ext)) {return FileCode;}
  if (TEXT_EXTENSIONS.has(ext)) {return FileText;}
  return File;
}

/**
 * FileTreeNode component for react-arborist.
 * Renders individual tree nodes with appropriate icons, styling, and interaction.
 */
export function FileTreeNode({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const isDirectory = node.data.data.isDirectory;
  const isOpen = node.isOpen;
  const isSelected = node.isSelected;

  // Click handler - toggle for directories, select for files
  const handleClick = () => {
    if (isDirectory) {
      node.toggle();
    } else {
      node.select();
    }
  };

  // Double-click to open file (triggers select)
  const handleDoubleClick = () => {
    if (!isDirectory) {
      node.select();
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    ...style,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingRight: 8,
    cursor: 'pointer',
    background: isSelected ? THEME.bg.selected : 'transparent',
    borderLeft: isSelected ? `2px solid ${THEME.accent.cyan}` : '2px solid transparent',
    transition: 'background 0.1s ease',
  };

  const iconContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    flexShrink: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 13,
    color: THEME.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  };

  // Get icon component for files
  const FileIcon = getFileIconComponent(node.data.data.extension);

  return (
    <div
      ref={dragHandle}
      style={containerStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = THEME.bg.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {/* Expand/collapse indicator for directories */}
      {isDirectory && (
        <div style={iconContainerStyle}>
          {isOpen ? (
            <ChevronDown size={14} color={THEME.text.muted} />
          ) : (
            <ChevronRight size={14} color={THEME.text.muted} />
          )}
        </div>
      )}

      {/* Folder or file icon */}
      <div style={iconContainerStyle}>
        {isDirectory ? (
          isOpen ? (
            <FolderOpen size={16} color={THEME.accent.yellow} />
          ) : (
            <Folder size={16} color={THEME.accent.yellow} />
          )
        ) : (
          <FileIcon size={16} color={THEME.text.muted} />
        )}
      </div>

      {/* File/folder name */}
      <span style={nameStyle}>{node.data.name}</span>
    </div>
  );
}

export default FileTreeNode;
