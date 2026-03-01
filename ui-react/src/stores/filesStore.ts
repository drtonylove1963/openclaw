/**
 * filesStore.ts - Zustand store for managing generated files during Ex Nihilo workflows
 * Tracks file generation state, supports multiple concurrent runs, and provides WebSocket handlers.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

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

export interface FilesRun {
  runId: string;
  sessionId?: string;
  files: GeneratedFile[];
  status: 'idle' | 'generating' | 'complete' | 'error';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface FilesState {
  /** Current active run ID */
  activeRunId: string | null;
  /** All runs indexed by runId */
  runs: Record<string, FilesRun>;
  /** Currently selected file ID */
  selectedFileId: string | null;
  /** Whether the files panel is expanded */
  isPanelExpanded: boolean;

  // Actions
  startRun: (runId: string, sessionId?: string) => void;
  addFile: (runId: string, file: Omit<GeneratedFile, 'id' | 'timestamp'>) => void;
  updateFileStatus: (runId: string, fileId: string, status: GeneratedFile['status'], content?: string) => void;
  updateFileByPath: (runId: string, path: string, status: GeneratedFile['status'], content?: string) => void;
  completeRun: (runId: string) => void;
  failRun: (runId: string, error?: string) => void;
  selectFile: (fileId: string | null) => void;
  togglePanel: () => void;
  expandPanel: () => void;
  collapsePanel: () => void;
  clearRun: (runId: string) => void;
  setActiveRun: (runId: string | null) => void;
  getActiveFiles: () => GeneratedFile[];
}

/**
 * Detect file type based on extension
 */
const detectFileType = (ext: string): GeneratedFile['type'] => {
  const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'cpp', 'c', 'h', 'cs', 'rb', 'php'];
  const configExts = ['json', 'yaml', 'yml', 'toml', 'env', 'ini', 'conf', 'xml'];
  const docExts = ['md', 'txt', 'html', 'htm', 'rst', 'adoc'];
  const dataExts = ['sql', 'csv', 'tsv', 'parquet'];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'];

  const lowerExt = ext.toLowerCase();
  if (codeExts.includes(lowerExt)) {return 'code';}
  if (configExts.includes(lowerExt)) {return 'config';}
  if (docExts.includes(lowerExt)) {return 'doc';}
  if (dataExts.includes(lowerExt)) {return 'data';}
  if (imageExts.includes(lowerExt)) {return 'image';}
  return 'other';
};

/**
 * Generate a unique file ID
 */
const generateFileId = (runId: string, path: string): string => {
  const sanitizedPath = path.replace(/[^a-zA-Z0-9]/g, '-');
  return `${runId}-${sanitizedPath}-${Date.now()}`;
};

export const useFilesStore = create<FilesState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      activeRunId: null,
      runs: {},
      selectedFileId: null,
      isPanelExpanded: true,

      startRun: (runId, sessionId) =>
        set((state) => ({
          activeRunId: runId,
          isPanelExpanded: true,
          runs: {
            ...state.runs,
            [runId]: {
              runId,
              sessionId,
              files: [],
              status: 'generating',
              startedAt: new Date(),
            },
          },
        })),

      addFile: (runId, file) => {
        const fileId = generateFileId(runId, file.path);
        const ext = file.path.split('.').pop() || '';
        const newFile: GeneratedFile = {
          ...file,
          id: fileId,
          extension: ext,
          type: file.type || detectFileType(ext),
          name: file.path.split('/').pop() || file.path,
          timestamp: new Date(),
        };

        set((state) => {
          const run = state.runs[runId];
          if (!run) {return state;}

          return {
            runs: {
              ...state.runs,
              [runId]: {
                ...run,
                files: [...run.files, newFile],
              },
            },
            isPanelExpanded: true,
          };
        });
      },

      updateFileStatus: (runId, fileId, status, content) =>
        set((state) => {
          const run = state.runs[runId];
          if (!run) {return state;}

          return {
            runs: {
              ...state.runs,
              [runId]: {
                ...run,
                files: run.files.map((f) =>
                  f.id === fileId
                    ? {
                        ...f,
                        status,
                        content: content ?? f.content,
                        size: content ? new Blob([content]).size : f.size,
                      }
                    : f
                ),
              },
            },
          };
        }),

      updateFileByPath: (runId, path, status, content) =>
        set((state) => {
          const run = state.runs[runId];
          if (!run) {return state;}

          return {
            runs: {
              ...state.runs,
              [runId]: {
                ...run,
                files: run.files.map((f) =>
                  f.path === path
                    ? {
                        ...f,
                        status,
                        content: content ?? f.content,
                        size: content ? new Blob([content]).size : f.size,
                      }
                    : f
                ),
              },
            },
          };
        }),

      completeRun: (runId) =>
        set((state) => {
          const run = state.runs[runId];
          if (!run) {return state;}

          return {
            runs: {
              ...state.runs,
              [runId]: {
                ...run,
                status: 'complete',
                completedAt: new Date(),
              },
            },
          };
        }),

      failRun: (runId, error) =>
        set((state) => {
          const run = state.runs[runId];
          if (!run) {return state;}

          return {
            runs: {
              ...state.runs,
              [runId]: {
                ...run,
                status: 'error',
                completedAt: new Date(),
                error,
              },
            },
          };
        }),

      selectFile: (fileId) => set({ selectedFileId: fileId }),

      togglePanel: () => set((state) => ({ isPanelExpanded: !state.isPanelExpanded })),

      expandPanel: () => set({ isPanelExpanded: true }),

      collapsePanel: () => set({ isPanelExpanded: false }),

      clearRun: (runId) =>
        set((state) => {
          const { [runId]: removed, ...rest } = state.runs;
          return {
            runs: rest,
            activeRunId: state.activeRunId === runId ? null : state.activeRunId,
          };
        }),

      setActiveRun: (runId) => set({ activeRunId: runId }),

      getActiveFiles: () => {
        const state = get();
        if (!state.activeRunId) {return [];}
        return state.runs[state.activeRunId]?.files ?? [];
      },
    })),
    { name: 'pronetheia-files-store' }
  )
);

// Selectors
export const selectActiveFiles = (state: FilesState): GeneratedFile[] =>
  state.activeRunId ? state.runs[state.activeRunId]?.files ?? [] : [];

export const selectIsGenerating = (state: FilesState): boolean =>
  state.activeRunId ? state.runs[state.activeRunId]?.status === 'generating' : false;

export const selectActiveRunId = (state: FilesState): string | null => state.activeRunId;

export const selectActiveRun = (state: FilesState): FilesRun | null =>
  state.activeRunId ? state.runs[state.activeRunId] ?? null : null;

/**
 * WebSocket event handlers - connect these to your WebSocket service
 */
export const filesStoreWebSocketHandlers = {
  onWorkflowStart: (runId: string, sessionId?: string) => {
    useFilesStore.getState().startRun(runId, sessionId);
  },

  onFileGenerating: (runId: string, path: string, agentId?: string, agentName?: string) => {
    useFilesStore.getState().addFile(runId, {
      path,
      name: path.split('/').pop() || path,
      type: 'other',
      extension: path.split('.').pop() || '',
      size: 0,
      status: 'generating',
      agentId,
      agentName,
    });
  },

  onFileComplete: (runId: string, path: string, content: string) => {
    useFilesStore.getState().updateFileByPath(runId, path, 'complete', content);
  },

  onFileError: (runId: string, path: string, error?: string) => {
    useFilesStore.getState().updateFileByPath(runId, path, 'error');
  },

  onWorkflowComplete: (runId: string) => {
    useFilesStore.getState().completeRun(runId);
  },

  onWorkflowError: (runId: string, error?: string) => {
    useFilesStore.getState().failRun(runId, error);
  },
};

/**
 * Download a single file
 */
export const downloadFile = (file: GeneratedFile): void => {
  if (!file.content) {return;}

  const blob = new Blob([file.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Download all completed files
 */
export const downloadAllFiles = async (files: GeneratedFile[]): Promise<void> => {
  const completedFiles = files.filter((f) => f.content && f.status === 'complete');

  for (const file of completedFiles) {
    downloadFile(file);
    // Small delay between downloads to prevent browser blocking
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export default useFilesStore;
