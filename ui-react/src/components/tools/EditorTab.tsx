import { useEffect, useState } from 'react';
import { Code, Folder, File, ChevronRight, ChevronDown, Loader2, Save } from 'lucide-react';
import { useToolsStore } from '../../stores/toolsStore';
import { GlassCard, NeuralEmptyState, NeuralButton } from '../shared';
import type { EditorFile, EditorProject } from '../../stores/toolsStore';

export function EditorTab() {
  const {
    editorProjects,
    selectedProject,
    editorFiles,
    selectedFile,
    editorLoading,
    editorError,
    loadEditorProjects,
    selectProject,
    selectFile,
    saveFile,
  } = useToolsStore();

  const [fileContent, setFileContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEditorProjects();
  }, [loadEditorProjects]);

  useEffect(() => {
    if (selectedFile?.content !== undefined) {
      setFileContent(selectedFile.content);
    }
  }, [selectedFile]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedFile) {
      await saveFile(selectedFile.id, fileContent);
    }
  };

  const renderFileTree = (files: EditorFile[], depth = 0) => {
    return files.map(file => {
      const isExpanded = expandedFolders.has(file.id);
      const isSelected = selectedFile?.id === file.id;

      return (
        <div key={file.id}>
          <div
            onClick={() => {
              if (file.type === 'folder') {
                toggleFolder(file.id);
              } else {
                selectFile(file);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              paddingLeft: `${12 + depth * 20}px`,
              cursor: 'pointer',
              background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
              borderRadius: '8px',
              transition: 'all 150ms',
              fontSize: '13px',
              color: isSelected ? '#00d4ff' : '#f0f0f5',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            {file.type === 'folder' ? (
              <>
                {isExpanded ? (
                  <ChevronDown size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                )}
                <Folder size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
              </>
            ) : (
              <>
                <div style={{ width: '14px', flexShrink: 0 }} />
                <File size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
              </>
            )}
          </div>
          {file.type === 'folder' && isExpanded && file.children && (
            <div>
              {renderFileTree(file.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <div
        style={{
          width: '260px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Project Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Project
          </label>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = editorProjects.find(p => p.id === e.target.value);
              selectProject(project || null);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f0f0f5',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Select a project</option>
            {editorProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Tree */}
        {selectedProject && (
          <GlassCard
            variant="bordered"
            className="ni-scrollbar"
            style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
            }}
          >
            {editorLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Loader2 size={24} style={{ color: '#00d4ff', animation: 'spin 1s linear infinite' }} />
              </div>
            )}

            {!editorLoading && editorFiles.length === 0 && (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                No files found
              </p>
            )}

            {!editorLoading && editorFiles.length > 0 && (
              <div>{renderFileTree(editorFiles)}</div>
            )}
          </GlassCard>
        )}
      </div>

      {/* Center: Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
        {!selectedProject && (
          <NeuralEmptyState
            icon={<Code size={32} />}
            title="No project selected"
            description="Select a project from the dropdown to browse files."
          />
        )}

        {selectedProject && !selectedFile && (
          <NeuralEmptyState
            icon={<File size={32} />}
            title="No file selected"
            description="Select a file from the tree to view and edit its contents."
          />
        )}

        {selectedFile && (
          <>
            {/* File Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <File size={18} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5' }}>
                  {selectedFile.name}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={editorLoading || selectedFile.content === fileContent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0, 212, 255, 0.2)',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  color: '#00d4ff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: editorLoading || selectedFile.content === fileContent ? 'not-allowed' : 'pointer',
                  opacity: editorLoading || selectedFile.content === fileContent ? 0.5 : 1,
                  transition: 'all 200ms',
                }}
              >
                {editorLoading ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save
                  </>
                )}
              </button>
            </div>

            {/* Editor Area */}
            <GlassCard
              variant="bordered"
              className="ni-scrollbar"
              style={{
                flex: 1,
                padding: '20px',
                overflow: 'auto',
              }}
            >
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '400px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#f0f0f5',
                  tabSize: 2,
                }}
              />
            </GlassCard>

            {/* Error Display */}
            {editorError && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '13px',
                }}
              >
                {editorError}
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
