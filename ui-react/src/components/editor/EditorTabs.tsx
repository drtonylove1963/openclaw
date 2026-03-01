/**
 * EditorTabs - Multi-file tab bar for code editor
 *
 * Displays open files as tabs with close buttons,
 * dirty indicators, and file type icons.
 */

import React, { memo, useCallback } from 'react';
import {
  X,
  FileCode,
  FileJson,
  FileText,
  File,
  Database,
  Braces,
  Hash,
  FileType,
} from 'lucide-react';

export interface EditorFile {
  /** Unique file identifier */
  id: string;
  /** File name */
  name: string;
  /** File path */
  path: string;
  /** Programming language */
  language: string;
  /** Has unsaved changes */
  isDirty?: boolean;
  /** Is currently active */
  isActive?: boolean;
}

export interface EditorTabsProps {
  /** List of open files */
  files: EditorFile[];
  /** Currently active file ID */
  activeFileId: string;
  /** Callback when a tab is clicked */
  onTabClick: (fileId: string) => void;
  /** Callback when a tab's close button is clicked */
  onTabClose: (fileId: string) => void;
  /** Additional CSS class */
  className?: string;
}

// Get icon for file type
function getFileIcon(language: string): React.ReactNode {
  const iconProps = { size: 14, className: 'flex-shrink-0' };

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'typescript':
    case 'jsx':
    case 'tsx':
      return <FileCode {...iconProps} className="text-yellow-400" />;
    case 'json':
      return <FileJson {...iconProps} className="text-yellow-500" />;
    case 'python':
      return <FileCode {...iconProps} className="text-blue-400" />;
    case 'sql':
      return <Database {...iconProps} className="text-orange-400" />;
    case 'css':
    case 'scss':
    case 'less':
      return <Braces {...iconProps} className="text-purple-400" />;
    case 'html':
      return <FileCode {...iconProps} className="text-orange-500" />;
    case 'markdown':
    case 'md':
      return <FileText {...iconProps} className="text-gray-400" />;
    case 'yaml':
    case 'yml':
      return <Hash {...iconProps} className="text-red-400" />;
    case 'rust':
      return <FileType {...iconProps} className="text-orange-600" />;
    default:
      return <File {...iconProps} className="text-gray-400" />;
  }
}

/**
 * Tab component for a single file
 */
const Tab = memo(function Tab({
  file,
  isActive,
  onClick,
  onClose,
}: {
  file: EditorFile;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2 cursor-pointer
        border-r border-gray-700 min-w-[100px] max-w-[200px]
        transition-colors duration-150
        ${
          isActive
            ? 'bg-gray-800 text-white border-b-2 border-b-blue-500'
            : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }
      `}
      onClick={onClick}
      title={file.path}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* File icon */}
      {getFileIcon(file.language)}

      {/* File name with dirty indicator */}
      <span className="truncate text-sm flex-1">
        {file.isDirty && <span className="text-orange-400 mr-1">●</span>}
        {file.name}
      </span>

      {/* Close button */}
      <button
        className={`
          p-0.5 rounded hover:bg-gray-700
          opacity-0 group-hover:opacity-100
          ${isActive ? 'opacity-100' : ''}
          transition-opacity duration-150
        `}
        onClick={onClose}
        title="Close file"
        aria-label={`Close ${file.name}`}
      >
        <X size={14} />
      </button>
    </div>
  );
});

/**
 * EditorTabs Component
 *
 * Displays a horizontal tab bar for open files with:
 * - File type icons
 * - Dirty (unsaved) indicators
 * - Close buttons
 * - Active tab highlighting
 * - Overflow scrolling
 *
 * @example
 * ```tsx
 * <EditorTabs
 *   files={openFiles}
 *   activeFileId={currentFile.id}
 *   onTabClick={setActiveFile}
 *   onTabClose={closeFile}
 * />
 * ```
 */
export const EditorTabs = memo(function EditorTabs({
  files,
  activeFileId,
  onTabClick,
  onTabClose,
  className = '',
}: EditorTabsProps) {
  const handleTabClick = useCallback(
    (fileId: string) => {
      onTabClick(fileId);
    },
    [onTabClick]
  );

  const handleTabClose = useCallback(
    (e: React.MouseEvent, fileId: string) => {
      e.stopPropagation();
      onTabClose(fileId);
    },
    [onTabClose]
  );

  if (files.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        flex items-stretch overflow-x-auto
        bg-gray-900 border-b border-gray-700
        scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900
        ${className}
      `}
      role="tablist"
      aria-label="Open files"
    >
      {files.map((file) => (
        <Tab
          key={file.id}
          file={file}
          isActive={file.id === activeFileId}
          onClick={() => handleTabClick(file.id)}
          onClose={(e) => handleTabClose(e, file.id)}
        />
      ))}
    </div>
  );
});

export default EditorTabs;
