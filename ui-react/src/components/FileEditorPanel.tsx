/**
 * FileEditorPanel.tsx
 *
 * Combines FilesPanel with CodeEditor to provide a full file editing experience.
 * Fetches file content from the API and allows editing/saving.
 */

import React, { useState, useCallback } from 'react';
import { CodeEditor } from './editor';
import { GeneratedFile } from './FilesPanel';

const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.1.120:8000';

interface FileContent {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
  updated_at: string;
}

export interface FileEditorPanelProps {
  /** Project ID (slug) for API calls */
  projectId: string;
  /** Currently selected file from FilesPanel */
  selectedFile: GeneratedFile | null;
  /** Auth token for API calls */
  authToken?: string;
  /** Callback when file is saved */
  onFileSaved?: (file: FileContent) => void;
  /** Height of the editor panel */
  height?: string | number;
}

const THEME = {
  bg: {
    primary: '#0a0f1c',
    secondary: '#0d1321',
    tertiary: '#111827',
  },
  border: '#1e293b',
  accent: {
    cyan: '#00D9FF',
    green: '#7CFF6B',
    red: '#FF4757',
  },
  text: {
    primary: '#E2E8F0',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
};

export const FileEditorPanel: React.FC<FileEditorPanelProps> = ({
  projectId,
  selectedFile,
  authToken,
  onFileSaved,
  height = '100%',
}) => {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch file content when selectedFile changes
  React.useEffect(() => {
    if (!selectedFile || !projectId) {
      setFileContent(null);
      setEditedContent('');
      setHasChanges(false);
      return;
    }

    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `${API_BASE}/api/v1/files/${projectId}/${selectedFile.path}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }

        const data: FileContent = await response.json();
        setFileContent(data);
        setEditedContent(data.content);
        setHasChanges(false);
      } catch (err) {
        console.error('Failed to fetch file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [selectedFile, projectId, authToken]);

  // Handle content changes
  const handleChange = useCallback((value: string) => {
    setEditedContent(value);
    setHasChanges(value !== fileContent?.content);
  }, [fileContent?.content]);

  // Save file
  const handleSave = useCallback(async (content?: string) => {
    if (!fileContent || !projectId) {return;}

    const contentToSave = content ?? editedContent;
    setIsSaving(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(
        `${API_BASE}/api/v1/files/${projectId}/${fileContent.path}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ content: contentToSave }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }

      const data = await response.json();
      setFileContent(data.file);
      setHasChanges(false);
      onFileSaved?.(data.file);
    } catch (err) {
      console.error('Failed to save file:', err);
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  }, [fileContent, projectId, editedContent, authToken, onFileSaved]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: height,
      background: THEME.bg.primary,
      borderLeft: `1px solid ${THEME.border}`,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: THEME.bg.secondary,
      borderBottom: `1px solid ${THEME.border}`,
      minHeight: 40,
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      overflow: 'hidden',
    },
    fileName: {
      fontSize: 13,
      fontWeight: 500,
      color: THEME.text.primary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    filePath: {
      fontSize: 11,
      color: THEME.text.muted,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      fontSize: 10,
      padding: '2px 6px',
      borderRadius: 4,
      background: hasChanges ? THEME.accent.cyan : 'transparent',
      color: hasChanges ? '#000' : THEME.text.muted,
    },
    saveBtn: {
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 500,
      border: 'none',
      borderRadius: 4,
      cursor: hasChanges ? 'pointer' : 'default',
      background: hasChanges ? THEME.accent.cyan : THEME.bg.tertiary,
      color: hasChanges ? '#000' : THEME.text.muted,
      opacity: isSaving ? 0.7 : 1,
    },
    content: {
      flex: 1,
      overflow: 'hidden',
    },
    empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: THEME.text.muted,
      fontSize: 13,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
      opacity: 0.5,
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: THEME.text.secondary,
      fontSize: 13,
    },
    error: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: THEME.accent.red,
      fontSize: 13,
      padding: 20,
      textAlign: 'center',
    },
  };

  // No file selected
  if (!selectedFile) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={{ color: THEME.text.muted, fontSize: 13 }}>Code Editor</span>
        </div>
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>&lt;/&gt;</div>
          <div>Select a file to edit</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.fileName}>{selectedFile.name}</span>
        </div>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.fileName}>{selectedFile.name}</span>
        </div>
        <div style={styles.error}>
          <div style={{ marginBottom: 8 }}>Error</div>
          <div style={{ color: THEME.text.muted }}>{error}</div>
        </div>
      </div>
    );
  }

  // File loaded
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.fileName}>{fileContent?.name || selectedFile.name}</span>
          <span style={styles.filePath}>{fileContent?.path}</span>
        </div>
        <div style={styles.headerRight}>
          {hasChanges && <span style={styles.badge}>Modified</span>}
          <button
            style={styles.saveBtn}
            onClick={() => handleSave()}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div style={styles.content}>
        <CodeEditor
          value={editedContent}
          language={fileContent?.language || 'text'}
          onChange={handleChange}
          onSave={handleSave}
          theme="dark"
          lineNumbers={true}
          foldable={true}
          minHeight={400}
        />
      </div>
    </div>
  );
};

export default FileEditorPanel;
