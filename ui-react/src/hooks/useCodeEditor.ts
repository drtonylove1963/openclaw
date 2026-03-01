/**
 * useCodeEditor Hook
 *
 * Custom hook for managing code editor state, including:
 * - File content management
 * - Dirty state tracking
 * - Save functionality with debounce
 * - Multi-file support
 * - Theme persistence
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';

import type { EditorFile } from '../components/editor/EditorTabs';
import type { ThemeName } from '../lib/codemirror/themes';

/**
 * API response types
 */
interface FileContent {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
  updatedAt: string;
}

interface SaveResult {
  success: boolean;
  file: FileContent;
}

/**
 * Hook options
 */
interface UseCodeEditorOptions {
  /** Project ID for file operations */
  projectId?: string;
  /** Initial file to open */
  initialFileId?: string;
  /** Auto-save delay in milliseconds (0 to disable) */
  autoSaveDelay?: number;
  /** Callback when save succeeds */
  onSaveSuccess?: (file: FileContent) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

/**
 * Hook return type
 */
interface UseCodeEditorReturn {
  // File management
  openFiles: EditorFile[];
  activeFile: EditorFile | null;
  activeFileId: string | null;
  activeContent: string;

  // Actions
  openFile: (file: EditorFile, content?: string) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateContent: (content: string) => void;
  saveFile: () => Promise<void>;
  saveAllFiles: () => Promise<void>;

  // State
  isDirty: boolean;
  isSaving: boolean;
  saveError: Error | null;
  saveSuccess: boolean;

  // Theme
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;

  // Undo/Redo (placeholder for editor integration)
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * File content store (in-memory)
 */
const fileContents = new Map<string, string>();
const originalContents = new Map<string, string>();

/**
 * Custom hook for code editor state management
 */
export function useCodeEditor(options: UseCodeEditorOptions = {}): UseCodeEditorReturn {
  const {
    projectId,
    initialFileId,
    autoSaveDelay = 2000,
    onSaveSuccess,
    onSaveError,
  } = options;

  const queryClient = useQueryClient();

  // State
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialFileId || null);
  const [isDirtyMap, setIsDirtyMap] = useState<Map<string, boolean>>(new Map());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Load theme from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editor-theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return 'dark';
  });

  // Refs for debounce
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Computed values
  const activeFile = useMemo(
    () => openFiles.find((f) => f.id === activeFileId) || null,
    [openFiles, activeFileId]
  );

  const activeContent = useMemo(
    () => (activeFileId ? fileContents.get(activeFileId) || '' : ''),
    [activeFileId]
  );

  const isDirty = useMemo(
    () => activeFileId ? isDirtyMap.get(activeFileId) || false : false,
    [activeFileId, isDirtyMap]
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: string; content: string }) => {
      if (!projectId) {
        throw new Error('Project ID is required for saving');
      }

      const file = openFiles.find((f) => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const response = await fetch(`/api/v1/files/${projectId}/${encodeURIComponent(file.path)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      return response.json() as Promise<SaveResult>;
    },
    onSuccess: (data, variables) => {
      // Update original content
      originalContents.set(variables.fileId, variables.content);

      // Mark as not dirty
      setIsDirtyMap((prev) => {
        const next = new Map(prev);
        next.set(variables.fileId, false);
        return next;
      });

      // Update file in list
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.id === variables.fileId ? { ...f, isDirty: false } : f
        )
      );

      // Show success feedback
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });

      onSaveSuccess?.(data.file);
    },
    onError: (error: Error) => {
      onSaveError?.(error);
    },
  });

  // Open a file
  const openFile = useCallback((file: EditorFile, content?: string) => {
    setOpenFiles((prev) => {
      // Check if already open
      if (prev.some((f) => f.id === file.id)) {
        return prev;
      }
      return [...prev, { ...file, isDirty: false }];
    });

    // Store content
    if (content !== undefined) {
      fileContents.set(file.id, content);
      originalContents.set(file.id, content);
    }

    // Make active
    setActiveFileId(file.id);
  }, []);

  // Close a file
  const closeFile = useCallback((fileId: string) => {
    setOpenFiles((prev) => {
      const index = prev.findIndex((f) => f.id === fileId);
      if (index === -1) {return prev;}

      const newFiles = prev.filter((f) => f.id !== fileId);

      // If closing active file, switch to adjacent file
      if (fileId === activeFileId && newFiles.length > 0) {
        const newIndex = Math.min(index, newFiles.length - 1);
        setActiveFileId(newFiles[newIndex].id);
      } else if (newFiles.length === 0) {
        setActiveFileId(null);
      }

      return newFiles;
    });

    // Clean up content
    fileContents.delete(fileId);
    originalContents.delete(fileId);
    setIsDirtyMap((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, [activeFileId]);

  // Set active file
  const setActiveFile = useCallback((fileId: string) => {
    if (openFiles.some((f) => f.id === fileId)) {
      setActiveFileId(fileId);
    }
  }, [openFiles]);

  // Update content
  const updateContent = useCallback((content: string) => {
    if (!activeFileId) {return;}

    // Store new content
    fileContents.set(activeFileId, content);

    // Check if dirty
    const original = originalContents.get(activeFileId) || '';
    const dirty = content !== original;

    setIsDirtyMap((prev) => {
      const next = new Map(prev);
      next.set(activeFileId, dirty);
      return next;
    });

    setOpenFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId ? { ...f, isDirty: dirty } : f
      )
    );

    // Auto-save if enabled
    if (autoSaveDelay > 0 && dirty) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate({ fileId: activeFileId, content });
      }, autoSaveDelay);
    }
  }, [activeFileId, autoSaveDelay, saveMutation]);

  // Save current file
  const saveFile = useCallback(async () => {
    if (!activeFileId) {return;}

    const content = fileContents.get(activeFileId);
    if (content === undefined) {return;}

    // Cancel auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    await saveMutation.mutateAsync({ fileId: activeFileId, content });
  }, [activeFileId, saveMutation]);

  // Save all dirty files
  const saveAllFiles = useCallback(async () => {
    const dirtyFiles = openFiles.filter((f) => isDirtyMap.get(f.id));

    await Promise.all(
      dirtyFiles.map((file) => {
        const content = fileContents.get(file.id);
        if (content !== undefined) {
          return saveMutation.mutateAsync({ fileId: file.id, content });
        }
      })
    );
  }, [openFiles, isDirtyMap, saveMutation]);

  // Theme management
  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('editor-theme', newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // File management
    openFiles,
    activeFile,
    activeFileId,
    activeContent,

    // Actions
    openFile,
    closeFile,
    setActiveFile,
    updateContent,
    saveFile,
    saveAllFiles,

    // State
    isDirty,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    saveSuccess,

    // Theme
    theme,
    setTheme,
    toggleTheme,

    // Undo/Redo (placeholder)
    canUndo: false,
    canRedo: false,
  };
}

export default useCodeEditor;
