/**
 * FilesPanel.tsx
 * Collapsible right panel displaying project files and generated files.
 * Fetches files from the server API when a projectId is provided.
 * Also shows streaming files generated during Ex Nihilo workflows.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PronetheiaAPI, ProjectFile } from '../services/pronetheia-api';
import { ResizeHandle } from './ResizeHandle';
import { ProjectFileTree } from './files/ProjectFileTree';
import type { TreeNode } from './files/fileTreeUtils';

export interface GeneratedFile {
  id: string;
  path: string;
  name: string;
  type: 'code' | 'config' | 'doc' | 'image' | 'data' | 'other';
  extension: string;
  size: number;
  content?: string;
  status: 'generating' | 'complete' | 'error';
  timestamp: Date;
  agentId?: string;
  agentName?: string;
}

export interface FilesPanelProps {
  files?: GeneratedFile[];  // Streaming files from WebSocket
  isExpanded: boolean;
  onToggle: () => void;
  onFileSelect?: (file: GeneratedFile) => void;
  onFileDownload?: (file: GeneratedFile) => void;
  onFileDelete?: (file: GeneratedFile) => void;
  onFileCreate?: (path: string) => void;
  onDownloadAll?: () => void;
  selectedFileId?: string;
  isGenerating?: boolean;
  runId?: string;
  projectId?: string;  // Project ID to fetch files from
  authToken?: string;  // Auth token for API calls
  // Resizable props
  width?: number;
  isResizing?: boolean;
  resizeHandleProps?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
}

const THEME = {
  bg: {
    primary: '#0a0f1c',
    secondary: '#0d1321',
    tertiary: '#111827',
    hover: 'rgba(0, 217, 255, 0.08)',
    selected: 'rgba(0, 217, 255, 0.15)',
  },
  border: '#1e293b',
  accent: {
    cyan: '#00D9FF',
    purple: '#A855F7',
    green: '#7CFF6B',
    orange: '#FF6B35',
    red: '#FF4757',
    yellow: '#FFD93D',
  },
  text: {
    primary: '#E2E8F0',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
};

const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  tsx: { icon: 'code', color: THEME.accent.cyan },
  ts: { icon: 'code', color: THEME.accent.cyan },
  jsx: { icon: 'code', color: THEME.accent.yellow },
  js: { icon: 'code', color: THEME.accent.yellow },
  py: { icon: 'code', color: THEME.accent.green },
  json: { icon: 'json', color: THEME.accent.yellow },
  yaml: { icon: 'settings', color: THEME.accent.purple },
  yml: { icon: 'settings', color: THEME.accent.purple },
  md: { icon: 'text', color: THEME.text.secondary },
  sql: { icon: 'database', color: THEME.accent.purple },
  png: { icon: 'image', color: THEME.accent.purple },
  svg: { icon: 'image', color: THEME.accent.orange },
  default: { icon: 'text', color: THEME.text.muted },
};

const getFileConfig = (ext: string) => FILE_TYPE_CONFIG[ext.toLowerCase()] || FILE_TYPE_CONFIG.default;

const getFileIcon = (iconType: string) => {
  switch (iconType) {
    case 'code': return '</>';
    case 'json': return '{}';
    case 'settings': return 'S';
    case 'text': return 'T';
    case 'database': return 'D';
    case 'image': return 'I';
    default: return 'F';
  }
};

// Helper to convert API ProjectFile to GeneratedFile
const convertToGeneratedFile = (file: ProjectFile): GeneratedFile => {
  const getFileType = (ext: string | null): GeneratedFile['type'] => {
    if (!ext) {return 'other';}
    const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h', 'cs', 'rb', 'php'];
    const configExts = ['json', 'yaml', 'yml', 'toml', 'ini', 'env', 'xml'];
    const docExts = ['md', 'txt', 'rst', 'html', 'css', 'scss'];
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'];
    const dataExts = ['csv', 'sql', 'db', 'sqlite'];

    if (codeExts.includes(ext.toLowerCase())) {return 'code';}
    if (configExts.includes(ext.toLowerCase())) {return 'config';}
    if (docExts.includes(ext.toLowerCase())) {return 'doc';}
    if (imageExts.includes(ext.toLowerCase())) {return 'image';}
    if (dataExts.includes(ext.toLowerCase())) {return 'data';}
    return 'other';
  };

  return {
    id: file.path,
    path: file.path,
    name: file.name,
    type: file.is_directory ? 'other' : getFileType(file.extension),
    extension: file.extension || '',
    size: file.size,
    status: 'complete',
    timestamp: file.modified_at ? new Date(file.modified_at) : new Date(),
  };
};

interface FileTreeItemProps {
  file: GeneratedFile;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onDelete?: () => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ file, isSelected, onSelect, onDownload, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const config = getFileConfig(file.extension);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.content) {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {return `${bytes}B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)}KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      cursor: 'pointer',
      background: isSelected ? THEME.bg.selected : 'transparent',
      borderLeft: isSelected ? `2px solid ${THEME.accent.cyan}` : '2px solid transparent',
      transition: 'all 0.15s ease',
    },
    icon: {
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 600,
      fontFamily: 'monospace',
      color: config.color,
      animation: file.status === 'generating' ? 'spin 1s linear infinite' : undefined,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 13,
      color: THEME.text.primary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    meta: {
      fontSize: 10,
      color: THEME.text.muted,
      marginTop: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    actions: {
      display: 'flex',
      gap: 4,
    },
    actionBtn: {
      background: 'transparent',
      border: 'none',
      padding: 4,
      cursor: 'pointer',
      fontSize: 12,
      color: THEME.text.muted,
    },
  };

  return (
    <div style={styles.container} onClick={onSelect}>
      <div style={styles.icon}>
        {file.status === 'generating' ? '...' : file.status === 'error' ? 'X' : getFileIcon(config.icon)}
      </div>
      <div style={styles.content}>
        <div style={styles.name}>{file.name}</div>
        <div style={styles.meta}>
          <span>{formatSize(file.size)}</span>
          {file.agentName && (
            <>
              <span>.</span>
              <span style={{ color: THEME.accent.purple }}>{file.agentName}</span>
            </>
          )}
        </div>
      </div>
      <div style={styles.actions}>
        {file.content && (
          <button
            onClick={handleCopy}
            style={{ ...styles.actionBtn, color: copied ? THEME.accent.green : THEME.text.muted }}
            title="Copy content"
          >
            {copied ? 'OK' : 'CP'}
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDownload(); }} style={styles.actionBtn} title="Download">
          ↓
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete ${file.name}?`)) {
                onDelete();
              }
            }}
            style={{ ...styles.actionBtn, color: THEME.accent.red }}
            title="Delete file"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export const FilesPanel: React.FC<FilesPanelProps> = ({
  files: streamingFiles = [],
  isExpanded,
  onToggle,
  onFileSelect,
  onFileDownload,
  onFileDelete,
  onFileCreate,
  onDownloadAll,
  selectedFileId,
  isGenerating = false,
  runId,
  projectId,
  authToken,
  width = 320,
  isResizing = false,
  resizeHandleProps,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'generated'>('project');
  const [apiFiles, setApiFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  // Handle file selection from ProjectFileTree
  const handleProjectFileSelect = useCallback((node: TreeNode) => {
    if (onFileSelect) {
      // Convert TreeNode to GeneratedFile format for compatibility
      const generatedFile: GeneratedFile = {
        id: node.data.path,
        path: node.data.path,
        name: node.name,
        type: 'other',
        extension: node.data.extension || '',
        size: node.data.size || 0,
        status: 'complete',
        timestamp: new Date(),
      };
      onFileSelect(generatedFile);
    }
  }, [onFileSelect]);

  // Handle creating a new file
  const handleCreateFile = useCallback(() => {
    if (newFilePath.trim() && onFileCreate) {
      onFileCreate(newFilePath.trim());
      setNewFilePath('');
      setShowNewFileInput(false);
    }
  }, [newFilePath, onFileCreate]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  // Toggle all folders open/closed
  const toggleAllFolders = useCallback(() => {
    setExpandedFolders(prev => {
      // If most folders are open, close all. Otherwise open all.
      const allFolders = new Set<string>();
      apiFiles.forEach(file => {
        const parts = file.path.split('/');
        if (parts.length > 1) {
          allFolders.add(parts.slice(0, -1).join('/'));
        } else {
          allFolders.add('');
        }
      });

      const openCount = [...allFolders].filter(f => prev.has(f)).length;
      if (openCount > allFolders.size / 2) {
        // More than half are open, close all
        return new Set<string>();
      } else {
        // Open all
        return allFolders;
      }
    });
  }, [apiFiles]);

  // Expand all folders when files change
  useEffect(() => {
    if (apiFiles.length > 0) {
      const folders = new Set<string>();
      apiFiles.forEach(file => {
        const parts = file.path.split('/');
        if (parts.length > 1) {
          folders.add(parts.slice(0, -1).join('/'));
        } else {
          folders.add(''); // Root folder
        }
      });
      setExpandedFolders(folders);
    }
  }, [apiFiles]);

  // Fetch files from API when projectId changes
  const fetchFiles = useCallback(async () => {
    if (!projectId) {
      setApiFiles([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const api = new PronetheiaAPI();
      if (authToken) {
        api.setToken(authToken);
      }
      const response = await api.getProjectFiles(projectId);

      // Convert API files to GeneratedFile format, excluding directories
      const converted = response.files
        .filter(f => !f.is_directory)
        .map(convertToGeneratedFile);

      setApiFiles(converted);
    } catch (err) {
      console.error('Failed to fetch project files:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, authToken]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Combine API files with streaming files (streaming files take precedence)
  const files = React.useMemo(() => {
    const streamingPaths = new Set(streamingFiles.map(f => f.path));
    const uniqueApiFiles = apiFiles.filter(f => !streamingPaths.has(f.path));
    return [...streamingFiles, ...uniqueApiFiles];
  }, [apiFiles, streamingFiles]);

  const groupedFiles = React.useMemo(() => {
    const groups: Record<string, GeneratedFile[]> = {};
    files.forEach((file) => {
      const parts = file.path.split('/');
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      if (!groups[dir]) {groups[dir] = [];}
      groups[dir].push(file);
    });
    return groups;
  }, [files]);

  const completedCount = files.filter((f) => f.status === 'complete').length;

  const styles: Record<string, React.CSSProperties> = {
    collapsed: {
      width: 48,
      height: '100%',
      background: THEME.bg.secondary,
      borderLeft: `1px solid ${THEME.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      cursor: 'pointer',
    },
    collapsedText: {
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)',
      fontSize: 12,
      color: THEME.text.secondary,
    },
    badge: {
      marginTop: 12,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: isGenerating
        ? `linear-gradient(135deg, ${THEME.accent.cyan}, ${THEME.accent.purple})`
        : THEME.accent.green,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 600,
      color: '#000',
    },
    expanded: {
      position: 'relative',
      width: width,
      minWidth: 280,
      maxWidth: 600,
      height: '100%',
      background: THEME.bg.secondary,
      borderLeft: `1px solid ${THEME.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: isResizing ? 'none' : 'width 0.2s ease',
      overflow: 'visible',  // Allow resize handle to extend outside
    },
    header: {
      padding: '12px 16px',
      borderBottom: `1px solid ${THEME.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    headerIcon: {
      fontSize: 14,
      color: THEME.accent.cyan,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: 600,
      color: THEME.text.primary,
    },
    toggleBtn: {
      background: 'transparent',
      border: 'none',
      padding: 4,
      cursor: 'pointer',
      color: THEME.text.muted,
      fontSize: 14,
    },
    statusBar: {
      padding: '10px 16px',
      borderBottom: `1px solid ${THEME.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: THEME.bg.tertiary,
    },
    statusLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    generating: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      color: THEME.accent.cyan,
    },
    fileCount: {
      fontSize: 11,
      color: THEME.text.muted,
    },
    runIdLabel: {
      fontSize: 10,
      color: THEME.text.muted,
      fontFamily: 'monospace',
    },
    content: {
      flex: 1,
      overflow: 'auto',
    },
    empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: 32,
      textAlign: 'center',
    },
    emptyIcon: {
      fontSize: 40,
      color: THEME.text.muted,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 13,
      color: THEME.text.secondary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 11,
      color: THEME.text.muted,
    },
    group: {},
    groupHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      color: THEME.text.secondary,
      fontSize: 11,
      textTransform: 'uppercase',
    },
    folderIcon: {
      color: THEME.accent.yellow,
    },
    footer: {
      padding: '12px 16px',
      borderTop: `1px solid ${THEME.border}`,
    },
    downloadAllBtn: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '10px 16px',
      background: `linear-gradient(135deg, ${THEME.accent.cyan}, #0066FF)`,
      border: 'none',
      borderRadius: 6,
      color: '#fff',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    },
    tabsContainer: {
      display: 'flex',
      borderBottom: `1px solid ${THEME.border}`,
    },
    tab: {
      flex: 1,
      padding: '10px 12px',
      fontSize: 12,
      fontWeight: 500,
      background: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      color: THEME.text.muted,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    tabActive: {
      color: THEME.accent.cyan,
      borderBottom: `2px solid ${THEME.accent.cyan}`,
      background: THEME.bg.tertiary,
    },
    treeContainer: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
    },
  };

  if (!isExpanded) {
    return (
      <div style={styles.collapsed} onClick={onToggle}>
        <span style={{ color: THEME.text.muted, marginBottom: 12 }}>&lt;</span>
        <div style={styles.collapsedText}>Files</div>
        {files.length > 0 && <div style={styles.badge}>{files.length}</div>}
      </div>
    );
  }

  return (
    <div style={styles.expanded}>
      {/* Resize Handle */}
      {resizeHandleProps && (
        <ResizeHandle
          position="left"
          isResizing={isResizing}
          onMouseDown={resizeHandleProps.onMouseDown}
          onTouchStart={resizeHandleProps.onTouchStart}
          theme={{
            border: THEME.border,
            hover: '#3f3f46',
            active: THEME.accent.cyan,
          }}
        />
      )}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>F</span>
          <span style={styles.headerTitle}>Files</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {activeTab === 'generated' && projectId && onFileCreate && (
            <button
              onClick={() => setShowNewFileInput(!showNewFileInput)}
              style={{
                ...styles.toggleBtn,
                color: showNewFileInput ? THEME.accent.cyan : THEME.text.muted,
              }}
              title="New file"
            >
              +
            </button>
          )}
          {activeTab === 'generated' && projectId && apiFiles.length > 0 && (
            <button
              onClick={toggleAllFolders}
              style={styles.toggleBtn}
              title="Expand/Collapse all folders"
            >
              {expandedFolders.size > 0 ? '⊟' : '⊞'}
            </button>
          )}
          {activeTab === 'generated' && projectId && (
            <button
              onClick={() => fetchFiles()}
              disabled={isLoading}
              style={{
                ...styles.toggleBtn,
                opacity: isLoading ? 0.5 : 1,
              }}
              title="Refresh files"
            >
              {isLoading ? '...' : '↻'}
            </button>
          )}
          <button onClick={onToggle} style={styles.toggleBtn}>&gt;</button>
        </div>
      </div>

      {/* Tab Navigation */}
      {projectId && (
        <div style={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab('project')}
            style={{
              ...styles.tab,
              ...(activeTab === 'project' ? styles.tabActive : {}),
            }}
          >
            Project Files
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            style={{
              ...styles.tab,
              ...(activeTab === 'generated' ? styles.tabActive : {}),
            }}
          >
            Generated Files
          </button>
        </div>
      )}

      {/* New File Input */}
      {showNewFileInput && (
        <div style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          gap: 8,
        }}>
          <input
            type="text"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {handleCreateFile();}
              if (e.key === 'Escape') {
                setShowNewFileInput(false);
                setNewFilePath('');
              }
            }}
            placeholder="path/to/file.ext"
            autoFocus
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: 12,
              background: THEME.bg.tertiary,
              border: `1px solid ${THEME.border}`,
              borderRadius: 4,
              color: THEME.text.primary,
              outline: 'none',
            }}
          />
          <button
            onClick={handleCreateFile}
            disabled={!newFilePath.trim()}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: newFilePath.trim() ? THEME.accent.cyan : THEME.bg.tertiary,
              border: 'none',
              borderRadius: 4,
              color: newFilePath.trim() ? '#000' : THEME.text.muted,
              cursor: newFilePath.trim() ? 'pointer' : 'default',
            }}
          >
            Create
          </button>
        </div>
      )}

      {/* Project Files Tab Content */}
      {activeTab === 'project' && projectId && (
        <div style={styles.treeContainer}>
          <ProjectFileTree
            projectId={projectId}
            onFileSelect={handleProjectFileSelect}
          />
        </div>
      )}

      {/* Generated Files Tab Content (or default when no projectId) */}
      {(activeTab === 'generated' || !projectId) && (
        <>
          {(isGenerating || isLoading || files.length > 0) && (
            <div style={styles.statusBar}>
              <div style={styles.statusLeft}>
                {isGenerating && (
                  <div style={styles.generating}>
                    <span>*</span>
                    <span>Generating...</span>
                  </div>
                )}
                {isLoading && (
                  <div style={styles.generating}>
                    <span>*</span>
                    <span>Loading...</span>
                  </div>
                )}
                <span style={styles.fileCount}>{completedCount} files</span>
              </div>
              {runId && <span style={styles.runIdLabel}>{runId.slice(0, 8)}</span>}
            </div>
          )}

          <div style={styles.content}>
            {error ? (
              <div style={styles.empty}>
                <div style={{ ...styles.emptyIcon, color: THEME.accent.red }}>!</div>
                <div style={styles.emptyTitle}>Error loading files</div>
                <div style={styles.emptySubtitle}>{error}</div>
                <button
                  onClick={() => fetchFiles()}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    background: THEME.accent.cyan,
                    border: 'none',
                    borderRadius: 4,
                    color: '#000',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : files.length === 0 && !isLoading ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>[]</div>
                <div style={styles.emptyTitle}>{projectId ? 'No files found' : 'No files yet'}</div>
                <div style={styles.emptySubtitle}>
                  {projectId ? 'Project directory is empty' : 'Files appear here when generated'}
                </div>
              </div>
            ) : files.length === 0 && isLoading ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>*</div>
                <div style={styles.emptyTitle}>Loading files...</div>
              </div>
            ) : (
              Object.entries(groupedFiles).map(([path, groupFiles]) => {
                const isFolderExpanded = expandedFolders.has(path);
                return (
                  <div key={path} style={styles.group}>
                    <div
                      style={{
                        ...styles.groupHeader,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => toggleFolder(path)}
                    >
                      <span style={{
                        ...styles.folderIcon,
                        transition: 'transform 0.15s ease',
                        transform: isFolderExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}>▶</span>
                      <span style={styles.folderIcon}>{isFolderExpanded ? '📂' : '📁'}</span>
                      <span>{path || 'Root'}</span>
                      <span style={{ color: THEME.text.muted }}>({groupFiles.length})</span>
                    </div>
                    {isFolderExpanded && groupFiles.map((file) => (
                      <FileTreeItem
                        key={file.id}
                        file={file}
                        isSelected={selectedFileId === file.id}
                        onSelect={() => onFileSelect?.(file)}
                        onDownload={() => onFileDownload?.(file)}
                        onDelete={onFileDelete ? () => onFileDelete(file) : undefined}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {files.length > 0 && (
            <div style={styles.footer}>
              <button onClick={onDownloadAll} style={styles.downloadAllBtn}>
                DL Download All
              </button>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FilesPanel;
