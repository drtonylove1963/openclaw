/**
 * MemoryStatePanel - Right Panel for Memory/State Visualization
 * Clean, unified styling with THEME system
 *
 * Features:
 * - Context window monitoring with token breakdown
 * - Manual and auto context compression
 * - Memory block editing
 * - File browser for generated files
 */
import React, { useState, useEffect, useRef } from 'react';
import { THEME } from '../../styles/theme';
import { PanelSection, LettaButton } from './LettaLayout';

// File types for the Files tab
export interface GeneratedFile {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'directory' | 'code' | 'config' | 'doc' | 'image' | 'data' | 'other';
  extension?: string;
  size: number;
  content?: string;
  status?: 'generating' | 'complete' | 'error';
  timestamp?: Date;
  created_at?: string;
  updated_at?: string;
}

interface MemoryBlock {
  id: string;
  name: string;
  content: string;
  type: 'core' | 'archival' | 'recall';
  lastUpdated: Date;
}

interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: string;
  output?: string;
  timestamp: Date;
}

interface ContextWindowState {
  totalTokens: number;
  usedTokens: number;
  systemPromptTokens: number;
  memoryTokens: number;
  conversationTokens: number;
}

interface CompressionResult {
  original_tokens: number;
  compressed_tokens: number;
  reduction_percent: number;
  messages_removed: number;
  messages_summarized: number;
  archived_count: number;
}

interface MemoryStatePanelProps {
  contextWindow?: ContextWindowState;
  memoryBlocks?: MemoryBlock[];
  toolCalls?: ToolCall[];
  files?: GeneratedFile[];
  collapsed?: boolean;
  projectId?: string;
  conversationId?: string;
  onMemoryEdit?: (blockId: string, content: string) => void;
  onFileSelect?: (file: GeneratedFile) => void;
  onFileDownload?: (file: GeneratedFile) => void;
  onDownloadAll?: () => void;
  onContextCompressed?: (result: CompressionResult) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export function MemoryStatePanel({
  contextWindow,
  memoryBlocks = [],
  toolCalls = [],
  files = [],
  collapsed = false,
  projectId,
  conversationId,
  onMemoryEdit,
  onFileSelect,
  onFileDownload,
  onDownloadAll,
  onContextCompressed,
}: MemoryStatePanelProps) {
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeTab, setActiveTab] = useState<'context' | 'memory' | 'tools' | 'files'>('context');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<GeneratedFile | null>(null);
  const [loadingFileContent, setLoadingFileContent] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [autoCompressEnabled, setAutoCompressEnabled] = useState(true);
  const autoCompressTriggeredRef = useRef(false);

  // Auto-compression threshold (80%)
  const AUTO_COMPRESS_THRESHOLD = 0.8;

  // Auto-compress when context reaches threshold
  useEffect(() => {
    if (!autoCompressEnabled || !conversationId || !contextWindow) {return;}
    if (isCompressing || autoCompressTriggeredRef.current) {return;}

    const usageRatio = contextWindow.usedTokens / contextWindow.totalTokens;

    if (usageRatio >= AUTO_COMPRESS_THRESHOLD) {
      console.log(`[AutoCompress] Context at ${(usageRatio * 100).toFixed(1)}%, triggering compression`);
      autoCompressTriggeredRef.current = true;
      handleCompressContext();
    }
  }, [contextWindow, conversationId, autoCompressEnabled, isCompressing]);

  // Reset auto-compress flag when conversation changes
  useEffect(() => {
    autoCompressTriggeredRef.current = false;
  }, [conversationId]);

  // Handle context compression
  const handleCompressContext = async () => {
    console.log('[Compress] Button clicked, conversationId:', conversationId);
    if (!conversationId) {
      console.warn('[Compress] No conversation ID available for compression');
      return;
    }
    console.log('[Compress] Starting compression request...');

    setIsCompressing(true);
    setCompressionResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          strategy: 'hybrid',
          target_reduction: 0.4,
        }),
      });

      if (!response.ok) {
        throw new Error(`Compression failed: ${response.statusText}`);
      }

      const result: CompressionResult = await response.json();
      console.log('[Compress] Result received:', result);
      setCompressionResult(result);
      console.log('[Compress] State updated, result should display now');
      onContextCompressed?.(result);

      // Clear result after 30 seconds
      setTimeout(() => setCompressionResult(null), 30000);
    } catch (error) {
      console.error('Context compression failed:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  // Fetch file content when a file is selected
  const handleFileClick = async (file: GeneratedFile) => {
    setSelectedFileId(file.id);
    onFileSelect?.(file);

    // If file already has content, show it directly
    if (file.content) {
      setViewingFile(file);
      return;
    }

    // Need to fetch content from API
    if (!projectId) {
      console.error('No projectId available for fetching file content');
      setViewingFile(file); // Show anyway without content
      return;
    }

    setLoadingFileContent(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/files/${encodeURIComponent(file.path)}`);
      if (response.ok) {
        const fileWithContent = await response.json();
        setViewingFile({
          ...file,
          content: fileWithContent.content || '',
        });
      } else {
        console.error('Failed to fetch file content:', response.statusText);
        setViewingFile(file);
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
      setViewingFile(file);
    } finally {
      setLoadingFileContent(false);
    }
  };

  const usagePercent = contextWindow
    ? (contextWindow.usedTokens / contextWindow.totalTokens) * 100
    : 0;

  const startEditing = (block: MemoryBlock) => {
    setEditingBlock(block.id);
    setEditContent(block.content);
  };

  const saveEditing = () => {
    if (editingBlock && onMemoryEdit) {
      onMemoryEdit(editingBlock, editContent);
    }
    setEditingBlock(null);
    setEditContent('');
  };

  // Collapsed state
  if (collapsed) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 8px',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: THEME.radius.md,
            backgroundColor: THEME.purpleMuted,
            border: `1px solid ${THEME.purple}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: THEME.purple,
          }}
        >
          ◉
        </div>
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            color: THEME.textMuted,
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '1px',
          }}
        >
          STATE
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Panel Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: THEME.radius.md,
            backgroundColor: THEME.purpleMuted,
            border: `1px solid ${THEME.purple}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: THEME.purple,
          }}
        >
          ◉
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.text }}>Agent State</div>
          <div style={{ fontSize: '11px', color: THEME.textMuted }}>Memory & Context</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          padding: '0 14px',
          borderBottom: `1px solid ${THEME.border}`,
          backgroundColor: THEME.bgMuted,
        }}
      >
        {(['context', 'memory', 'tools', 'files'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 8px',
              fontSize: '12px',
              fontWeight: 500,
              color: activeTab === tab ? THEME.primary : THEME.textMuted,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? THEME.primary : 'transparent'}`,
              cursor: 'pointer',
              transition: `all ${THEME.transition.fast}`,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Context Window Tab */}
        {activeTab === 'context' && (
          <>
            {contextWindow ? (
              <>
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: THEME.textSecondary }}>Context Usage</span>
                    <span style={{ fontSize: '12px', color: THEME.text, fontFamily: THEME.fontMono }}>
                      {contextWindow.usedTokens.toLocaleString()} / {contextWindow.totalTokens.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: THEME.bgMuted,
                      borderRadius: THEME.radius.sm,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${usagePercent}%`,
                        backgroundColor: usagePercent > 80 ? THEME.warning : THEME.primary,
                        borderRadius: THEME.radius.sm,
                        transition: `width ${THEME.transition.slow}`,
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '11px', color: THEME.textDim, marginTop: '6px' }}>
                    {usagePercent.toFixed(1)}% used
                  </div>
                </div>

                <PanelSection title="Token Breakdown" collapsible={false}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <TokenBreakdownItem
                      label="System Prompt"
                      value={contextWindow.systemPromptTokens}
                      total={contextWindow.usedTokens}
                      color={THEME.purple}
                    />
                    <TokenBreakdownItem
                      label="Memory"
                      value={contextWindow.memoryTokens}
                      total={contextWindow.usedTokens}
                      color={THEME.info}
                    />
                    <TokenBreakdownItem
                      label="Conversation"
                      value={contextWindow.conversationTokens}
                      total={contextWindow.usedTokens}
                      color={THEME.primary}
                    />
                  </div>
                </PanelSection>

                <div style={{ padding: '14px' }}>
                  <LettaButton
                    variant="secondary"
                    fullWidth
                    onClick={handleCompressContext}
                    disabled={isCompressing || !conversationId}
                  >
                    {isCompressing ? 'Compressing...' : 'Compress Context'}
                  </LettaButton>

                  {/* Compression Result */}
                  {compressionResult && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: THEME.success + '15',
                      border: `1px solid ${THEME.success}40`,
                      borderRadius: THEME.radius.md,
                      fontSize: '11px',
                    }}>
                      <div style={{ fontWeight: 600, color: THEME.success, marginBottom: '8px' }}>
                        Compression Complete
                      </div>
                      <div style={{ color: THEME.text, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>Reduced by <strong>{compressionResult.reduction_percent}%</strong></div>
                        <div style={{ color: THEME.textMuted }}>
                          {compressionResult.original_tokens.toLocaleString()} → {compressionResult.compressed_tokens.toLocaleString()} tokens
                        </div>
                        {compressionResult.messages_removed > 0 && (
                          <div style={{ color: THEME.textDim }}>{compressionResult.messages_removed} messages removed</div>
                        )}
                        {compressionResult.messages_summarized > 0 && (
                          <div style={{ color: THEME.textDim }}>{compressionResult.messages_summarized} messages summarized</div>
                        )}
                        {compressionResult.archived_count > 0 && (
                          <div style={{ color: THEME.textDim }}>{compressionResult.archived_count} messages archived</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warning when context is high */}
                  {contextWindow && contextWindow.usedTokens / contextWindow.totalTokens >= 0.8 && !compressionResult && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px',
                      backgroundColor: THEME.warning + '15',
                      border: `1px solid ${THEME.warning}40`,
                      borderRadius: THEME.radius.md,
                      fontSize: '11px',
                      color: THEME.warning,
                    }}>
                      ⚠️ Context at {Math.round((contextWindow.usedTokens / contextWindow.totalTokens) * 100)}% capacity. Consider compressing.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: THEME.textDim, fontSize: '12px' }}>
                No context data available
              </div>
            )}
          </>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <>
            <PanelSection title="Core Memory" collapsible={false}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {memoryBlocks.filter(b => b.type === 'core').map((block) => (
                  <MemoryBlockCard
                    key={block.id}
                    block={block}
                    isEditing={editingBlock === block.id}
                    editContent={editContent}
                    onEdit={() => startEditing(block)}
                    onEditChange={setEditContent}
                    onSave={saveEditing}
                    onCancel={() => setEditingBlock(null)}
                  />
                ))}
              </div>
            </PanelSection>

            <PanelSection title="Archival Memory" defaultCollapsed>
              <div style={{ padding: '16px', textAlign: 'center', color: THEME.textDim, fontSize: '12px' }}>
                No archival memories yet
              </div>
            </PanelSection>
          </>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <PanelSection title="Recent Tool Calls" collapsible={false}>
            {toolCalls.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {toolCalls.map((call) => (
                  <ToolCallCard key={call.id} call={call} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: THEME.textDim, fontSize: '12px' }}>
                No tool calls yet
              </div>
            )}
          </PanelSection>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <>
            <PanelSection title="Project Files" collapsible={false}>
              {files.length > 0 ? (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <FileTree
                    files={files}
                    selectedFileId={selectedFileId}
                    onFileSelect={handleFileClick}
                    onFileDownload={(file) => onFileDownload?.(file)}
                  />
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: THEME.textDim, fontSize: '12px' }}>
                  No project files found
                </div>
              )}
            </PanelSection>

            {files.length > 0 && onDownloadAll && (
              <div style={{ padding: '14px' }}>
                <LettaButton variant="primary" fullWidth onClick={onDownloadAll}>
                  Download All Files
                </LettaButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading indicator for file content */}
      {loadingFileContent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
          }}
        >
          <div style={{ color: THEME.text, fontSize: '14px' }}>Loading file...</div>
        </div>
      )}

      {/* File Viewer Modal */}
      {viewingFile && !loadingFileContent && (
        <FileViewerModal
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onDownload={() => onFileDownload?.(viewingFile)}
        />
      )}
    </div>
  );
}

// Token Breakdown Item
function TokenBreakdownItem({ label, value, total, color }: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = (value / total) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: THEME.textSecondary }}>{label}</span>
        <span style={{ fontSize: '12px', color: THEME.text, fontFamily: THEME.fontMono }}>
          {value.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          height: '4px',
          backgroundColor: THEME.bgMuted,
          borderRadius: THEME.radius.sm,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: color,
            borderRadius: THEME.radius.sm,
          }}
        />
      </div>
    </div>
  );
}

// Memory Block Card
function MemoryBlockCard({
  block,
  isEditing,
  editContent,
  onEdit,
  onEditChange,
  onSave,
  onCancel,
}: {
  block: MemoryBlock;
  isEditing: boolean;
  editContent: string;
  onEdit: () => void;
  onEditChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        padding: '10px 12px',
        backgroundColor: THEME.bgMuted,
        borderRadius: THEME.radius.md,
        border: `1px solid ${THEME.border}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: THEME.primary,
            fontFamily: THEME.fontMono,
          }}
        >
          {block.name}
        </span>
        {!isEditing && hovered && (
          <button
            onClick={onEdit}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              color: THEME.textMuted,
              backgroundColor: THEME.bgHover,
              border: 'none',
              borderRadius: THEME.radius.sm,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <>
          <textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              fontSize: '12px',
              color: THEME.text,
              backgroundColor: THEME.bg,
              border: `1px solid ${THEME.borderFocus}`,
              borderRadius: THEME.radius.sm,
              outline: 'none',
              resize: 'vertical',
              fontFamily: THEME.fontFamily,
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <LettaButton variant="primary" size="sm" onClick={onSave}>Save</LettaButton>
            <LettaButton variant="ghost" size="sm" onClick={onCancel}>Cancel</LettaButton>
          </div>
        </>
      ) : (
        <div style={{ fontSize: '12px', color: THEME.textSecondary, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {block.content}
        </div>
      )}
    </div>
  );
}

// Tool Call Card
function ToolCallCard({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    pending: THEME.textDim,
    running: THEME.info,
    success: THEME.success,
    error: THEME.error,
  };

  const statusIcons = { pending: '○', running: '◐', success: '●', error: '✕' };

  return (
    <div
      style={{
        padding: '10px 12px',
        backgroundColor: THEME.bgMuted,
        borderRadius: THEME.radius.md,
        border: `1px solid ${THEME.border}`,
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: statusColors[call.status] }}>{statusIcons[call.status]}</span>
        <span style={{ fontSize: '12px', fontWeight: 500, color: THEME.text, fontFamily: THEME.fontMono, flex: 1 }}>
          {call.name}
        </span>
        <span style={{ fontSize: '10px', color: THEME.textDim }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (call.input || call.output) && (
        <div style={{ marginTop: '10px' }}>
          {call.input && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: THEME.textMuted, marginBottom: '4px', textTransform: 'uppercase' }}>
                Input
              </div>
              <pre
                style={{
                  fontSize: '11px',
                  color: THEME.text,
                  backgroundColor: THEME.bg,
                  padding: '8px',
                  borderRadius: THEME.radius.sm,
                  overflow: 'auto',
                  margin: 0,
                  fontFamily: THEME.fontMono,
                }}
              >
                {call.input}
              </pre>
            </div>
          )}
          {call.output && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: THEME.textMuted, marginBottom: '4px', textTransform: 'uppercase' }}>
                Output
              </div>
              <pre
                style={{
                  fontSize: '11px',
                  color: THEME.text,
                  backgroundColor: THEME.bg,
                  padding: '8px',
                  borderRadius: THEME.radius.sm,
                  overflow: 'auto',
                  margin: 0,
                  fontFamily: THEME.fontMono,
                }}
              >
                {call.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE TREE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  file?: GeneratedFile;
  children: TreeNode[];
}

function buildFileTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  // Helper to check if file is a directory
  const isDirectory = (file: GeneratedFile) => {
    // Check explicit type first
    if (file.type === 'directory') {return true;}
    // Fallback: size 0 and no extension (but allow dotfiles like .gitignore)
    const hasExtension = file.name.includes('.') && !file.name.startsWith('.');
    return file.size === 0 && !hasExtension;
  };

  // Sort files: folders first, then alphabetically
  const sortedFiles = [...files].toSorted((a, b) => {
    const aIsDir = isDirectory(a);
    const bIsDir = isDirectory(b);
    if (aIsDir && !bIsDir) {return -1;}
    if (!aIsDir && bIsDir) {return 1;}
    return a.path.localeCompare(b.path);
  });

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let existing = currentLevel.find(node => node.name === part);

      if (!existing) {
        const isFolder = !isLast || isDirectory(file);
        existing = {
          name: part,
          path: currentPath,
          type: isFolder ? 'folder' : 'file',
          file: isLast ? file : undefined,
          children: [],
        };
        currentLevel.push(existing);
      }

      if (isLast && !isDirectory(file)) {
        existing.file = file;
        existing.type = 'file';
      }

      currentLevel = existing.children;
    }
  }

  return root;
}

// FileTree Component with expandable folders
function FileTree({
  files,
  selectedFileId,
  onFileSelect,
  onFileDownload,
}: {
  files: GeneratedFile[];
  selectedFileId: string | null;
  onFileSelect: (file: GeneratedFile) => void;
  onFileDownload: (file: GeneratedFile) => void;
}) {
  const tree = React.useMemo(() => buildFileTree(files), [files]);
  // Global expand/collapse trigger - increment to force all nodes to update
  const [expandAllTrigger, setExpandAllTrigger] = useState<{ value: boolean; key: number } | null>(null);

  const handleExpandAll = () => {
    setExpandAllTrigger({ value: true, key: Date.now() });
  };

  const handleCollapseAll = () => {
    setExpandAllTrigger({ value: false, key: Date.now() });
  };

  // Count folders for showing in the header
  const countFolders = (nodes: TreeNode[]): number => {
    return nodes.reduce((acc, node) => {
      if (node.type === 'folder') {
        return acc + 1 + countFolders(node.children);
      }
      return acc;
    }, 0);
  };
  const folderCount = countFolders(tree);

  return (
    <div style={{ fontSize: '12px' }}>
      {/* Expand/Collapse All buttons */}
      {folderCount > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 8px 12px 8px',
          borderBottom: `1px solid ${THEME.border}`,
          marginBottom: '4px',
        }}>
          <button
            onClick={handleExpandAll}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 500,
              color: THEME.textSecondary,
              backgroundColor: THEME.bgHover,
              border: `1px solid ${THEME.border}`,
              borderRadius: THEME.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: `all ${THEME.transition.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgMuted;
              e.currentTarget.style.color = THEME.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgHover;
              e.currentTarget.style.color = THEME.textSecondary;
            }}
            title="Expand all folders"
          >
            <span style={{ fontSize: '10px' }}>▼</span>
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 500,
              color: THEME.textSecondary,
              backgroundColor: THEME.bgHover,
              border: `1px solid ${THEME.border}`,
              borderRadius: THEME.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: `all ${THEME.transition.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgMuted;
              e.currentTarget.style.color = THEME.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = THEME.bgHover;
              e.currentTarget.style.color = THEME.textSecondary;
            }}
            title="Collapse all folders"
          >
            <span style={{ fontSize: '10px' }}>▶</span>
            Collapse All
          </button>
        </div>
      )}
      {tree.map(node => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedFileId={selectedFileId}
          onFileSelect={onFileSelect}
          onFileDownload={onFileDownload}
          expandAllTrigger={expandAllTrigger}
        />
      ))}
    </div>
  );
}

// Single tree node (folder or file)
function FileTreeNode({
  node,
  depth,
  selectedFileId,
  onFileSelect,
  onFileDownload,
  expandAllTrigger,
}: {
  node: TreeNode;
  depth: number;
  selectedFileId: string | null;
  onFileSelect: (file: GeneratedFile) => void;
  onFileDownload: (file: GeneratedFile) => void;
  expandAllTrigger: { value: boolean; key: number } | null;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels

  // Respond to global expand/collapse triggers
  React.useEffect(() => {
    if (expandAllTrigger !== null) {
      setIsExpanded(expandAllTrigger.value);
    }
  }, [expandAllTrigger]);
  const isFolder = node.type === 'folder';
  const isSelected = node.file?.id === selectedFileId;
  const indent = depth * 16;

  if (isFolder) {
    return (
      <div>
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            paddingLeft: `${8 + indent}px`,
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span style={{
            color: THEME.warning,
            fontSize: '10px',
            width: '14px',
            textAlign: 'center',
          }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span style={{ color: THEME.warning, fontSize: '14px' }}>📁</span>
          <span style={{ color: THEME.text, fontWeight: 500 }}>{node.name}</span>
          <span style={{ color: THEME.textDim, fontSize: '10px', marginLeft: '4px' }}>
            ({node.children.length})
          </span>
        </div>
        {isExpanded && (
          <div>
            {node.children.map(child => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFileId={selectedFileId}
                onFileSelect={onFileSelect}
                onFileDownload={onFileDownload}
                expandAllTrigger={expandAllTrigger}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const ext = node.name.split('.').pop()?.toLowerCase() || '';
  const config = FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;

  return (
    <div
      onClick={() => node.file && onFileSelect(node.file)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        paddingLeft: `${8 + indent + 20}px`, // Extra indent for files
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: isSelected ? THEME.primaryMuted : 'transparent',
        border: isSelected ? `1px solid ${THEME.primary}40` : '1px solid transparent',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {e.currentTarget.style.backgroundColor = THEME.bgHover;}
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {e.currentTarget.style.backgroundColor = 'transparent';}
      }}
    >
      <span
        style={{
          fontSize: '9px',
          fontWeight: 600,
          color: config.color,
          fontFamily: THEME.fontMono,
          width: '20px',
          textAlign: 'center',
        }}
      >
        {config.icon}
      </span>
      <span style={{
        color: THEME.text,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {node.name}
      </span>
      {node.file && (
        <span style={{ color: THEME.textDim, fontSize: '10px' }}>
          {formatFileSize(node.file.size)}
        </span>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes}B`;}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)}KB`;}
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// File type configuration
const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  tsx: { icon: '</>', color: '#00D9FF' },
  ts: { icon: '</>', color: '#00D9FF' },
  jsx: { icon: '</>', color: '#FFD93D' },
  js: { icon: '</>', color: '#FFD93D' },
  py: { icon: 'PY', color: '#7CFF6B' },
  json: { icon: '{}', color: '#FFD93D' },
  yaml: { icon: 'YM', color: '#A855F7' },
  yml: { icon: 'YM', color: '#A855F7' },
  md: { icon: 'MD', color: '#94A3B8' },
  sql: { icon: 'DB', color: '#A855F7' },
  css: { icon: 'CS', color: '#00D9FF' },
  html: { icon: '<>', color: '#FF6B35' },
  default: { icon: 'F', color: '#64748B' },
};

// File Card Component
function FileCard({ file, isSelected, onSelect, onDownload }: {
  file: GeneratedFile;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const ext = file.extension?.toLowerCase() || file.name.split('.').pop()?.toLowerCase() || '';
  const config = FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;

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

  const statusColors = {
    generating: THEME.info,
    complete: THEME.success,
    error: THEME.error,
  };

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 12px',
        backgroundColor: isSelected ? THEME.primaryMuted : THEME.bgMuted,
        borderRadius: THEME.radius.md,
        border: `1px solid ${isSelected ? THEME.primary + '40' : THEME.border}`,
        cursor: 'pointer',
        transition: `all ${THEME.transition.fast}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* File Icon */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: THEME.radius.sm,
            backgroundColor: `${config.color}15`,
            border: `1px solid ${config.color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 600,
            color: config.color,
            fontFamily: THEME.fontMono,
          }}
        >
          {file.status === 'generating' ? '...' : config.icon}
        </div>

        {/* File Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: THEME.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {file.name}
          </div>
          <div style={{ fontSize: '10px', color: THEME.textDim, marginTop: '2px' }}>
            {file.path !== file.name && <span>{file.path.replace(file.name, '')} · </span>}
            {formatSize(file.size)}
            {file.status && (
              <span
                style={{
                  marginLeft: '8px',
                  color: statusColors[file.status],
                }}
              >
                {file.status === 'generating' ? '●' : file.status === 'complete' ? '✓' : '✕'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {file.content && (
            <button
              onClick={handleCopy}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 500,
                color: copied ? THEME.success : THEME.textMuted,
                backgroundColor: THEME.bgHover,
                border: 'none',
                borderRadius: THEME.radius.sm,
                cursor: 'pointer',
              }}
              title="Copy content"
            >
              {copied ? '✓' : 'CP'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 500,
              color: THEME.textMuted,
              backgroundColor: THEME.bgHover,
              border: 'none',
              borderRadius: THEME.radius.sm,
              cursor: 'pointer',
            }}
            title="Download"
          >
            DL
          </button>
        </div>
      </div>
    </div>
  );
}

// File Viewer Modal Component
function FileViewerModal({ file, onClose, onDownload }: {
  file: GeneratedFile;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const ext = file.extension?.toLowerCase() || file.name.split('.').pop()?.toLowerCase() || '';
  const config = FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG.default;

  const handleCopy = async () => {
    if (file.content) {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    onDownload();
  };

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Get line count for line numbers
  const lines = file.content?.split('\n') || [];
  const lineCount = lines.length;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '40px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: 'calc(100vh - 80px)',
          backgroundColor: THEME.bg,
          borderRadius: THEME.radius.lg,
          border: `1px solid ${THEME.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${THEME.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: THEME.bgMuted,
          }}
        >
          {/* File Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: THEME.radius.md,
              backgroundColor: `${config.color}15`,
              border: `1px solid ${config.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: config.color,
              fontFamily: THEME.fontMono,
            }}
          >
            {config.icon}
          </div>

          {/* File Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.text }}>
              {file.name}
            </div>
            <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '2px' }}>
              {file.path} · {lineCount} lines
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: copied ? THEME.success : THEME.text,
                backgroundColor: THEME.bgHover,
                border: `1px solid ${THEME.border}`,
                borderRadius: THEME.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: `all ${THEME.transition.fast}`,
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: THEME.text,
                backgroundColor: THEME.primary,
                border: 'none',
                borderRadius: THEME.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Download
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 12px',
                fontSize: '16px',
                color: THEME.textMuted,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: THEME.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close (Esc)"
            >
              ×
            </button>
          </div>
        </div>

        {/* File Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#0d1117',
          }}
        >
          {file.content ? (
            <div style={{ display: 'flex', minHeight: '100%' }}>
              {/* Line Numbers */}
              <div
                style={{
                  padding: '16px 0',
                  borderRight: `1px solid ${THEME.border}`,
                  backgroundColor: THEME.bgMuted,
                  userSelect: 'none',
                  position: 'sticky',
                  left: 0,
                }}
              >
                {lines.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0 12px',
                      fontSize: '12px',
                      fontFamily: THEME.fontMono,
                      color: THEME.textDim,
                      textAlign: 'right',
                      lineHeight: '20px',
                      minWidth: '40px',
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Content */}
              <pre
                style={{
                  margin: 0,
                  padding: '16px',
                  fontSize: '12px',
                  fontFamily: THEME.fontMono,
                  color: THEME.text,
                  lineHeight: '20px',
                  whiteSpace: 'pre',
                  flex: 1,
                  overflow: 'visible',
                }}
              >
                {file.content}
              </pre>
            </div>
          ) : (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: THEME.textDim,
                fontSize: '14px',
              }}
            >
              No content available for this file
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemoryStatePanel;
