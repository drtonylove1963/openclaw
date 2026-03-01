/**
 * ThreeColumnLayout.tsx
 * Reusable 3-column layout wrapper for Pronetheia pages.
 * Left panel: Sessions/navigation (collapsible, resizable)
 * Center: Main content (expandable)
 * Right panel: Files panel (contextual, auto-expands during generation, resizable)
 */

import React, { useState, useEffect } from 'react';
import { FilesPanel, GeneratedFile } from './FilesPanel';
import { useResizable } from '../hooks/useResizable';
import { ResizeHandle } from './ResizeHandle';

export interface ThreeColumnLayoutProps {
  /** Left panel content (e.g., sidebar with sessions) */
  leftPanel: React.ReactNode;
  /** Title for the left panel header */
  leftPanelTitle?: string;
  /** Width of left panel when expanded (default: 280) */
  leftPanelWidth?: number;
  /** Start with left panel collapsed (default: false) */
  leftPanelCollapsedDefault?: boolean;
  /** Main center content */
  children: React.ReactNode;
  /** Generated files to display in right panel */
  files?: GeneratedFile[];
  /** Whether file generation is in progress */
  isGenerating?: boolean;
  /** Current workflow run ID */
  runId?: string;
  /** Callback when a file is selected */
  onFileSelect?: (file: GeneratedFile) => void;
  /** Callback when a file should be downloaded */
  onFileDownload?: (file: GeneratedFile) => void;
  /** Callback when "Download All" is clicked */
  onDownloadAll?: () => void;
  /** Currently selected file ID */
  selectedFileId?: string;
  /** Auto-expand right panel when files are added (default: true) */
  autoExpandOnFiles?: boolean;
  /** Callback when layout panels change state */
  onLayoutChange?: (layout: { left: boolean; right: boolean }) => void;
}

const THEME = {
  bg: {
    primary: '#0a0f1c',
    secondary: '#0d1321',
    tertiary: '#111827',
  },
  border: '#1e293b',
  text: {
    primary: '#E2E8F0',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
};

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftPanel,
  leftPanelTitle = 'Sessions',
  leftPanelWidth: initialLeftWidth = 280,
  leftPanelCollapsedDefault = false,
  children,
  files = [],
  isGenerating = false,
  runId,
  onFileSelect,
  onFileDownload,
  onDownloadAll,
  selectedFileId,
  autoExpandOnFiles = true,
  onLayoutChange,
}) => {
  const [leftCollapsed, setLeftCollapsed] = useState(leftPanelCollapsedDefault);
  const [rightExpanded, setRightExpanded] = useState(false);
  const [previousFileCount, setPreviousFileCount] = useState(0);

  // Resizable left panel
  const {
    width: leftPanelWidth,
    isResizing: isLeftResizing,
    handleProps: leftHandleProps,
  } = useResizable({
    initialWidth: initialLeftWidth,
    minWidth: 200,
    maxWidth: 500,
    direction: 'right',
    storageKey: 'pronetheia-left-panel-width',
  });

  // Resizable right panel
  const {
    width: rightPanelWidth,
    isResizing: isRightResizing,
    handleProps: rightHandleProps,
  } = useResizable({
    initialWidth: 320,
    minWidth: 280,
    maxWidth: 600,
    direction: 'left',
    storageKey: 'pronetheia-right-panel-width',
  });

  // Auto-expand right panel when files are added
  useEffect(() => {
    if (autoExpandOnFiles && files.length > previousFileCount && files.length > 0) {
      setRightExpanded(true);
    }
    setPreviousFileCount(files.length);
  }, [files.length, previousFileCount, autoExpandOnFiles]);

  // Auto-expand when generation starts
  useEffect(() => {
    if (autoExpandOnFiles && isGenerating && !rightExpanded) {
      setRightExpanded(true);
    }
  }, [isGenerating, autoExpandOnFiles, rightExpanded]);

  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.({ left: !leftCollapsed, right: rightExpanded });
  }, [leftCollapsed, rightExpanded, onLayoutChange]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      height: '100%',
      width: '100%',
      background: THEME.bg.primary,
      overflow: 'hidden',
    },
    leftPanel: {
      position: 'relative',
      width: leftCollapsed ? 48 : leftPanelWidth,
      minWidth: leftCollapsed ? 48 : leftPanelWidth,
      height: '100%',
      background: THEME.bg.secondary,
      borderRight: `1px solid ${THEME.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: isLeftResizing ? 'none' : 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
    },
    leftCollapsed: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      cursor: 'pointer',
      height: '100%',
    },
    leftCollapsedText: {
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)',
      fontSize: 12,
      color: THEME.text.secondary,
    },
    leftHeader: {
      padding: '12px 16px',
      borderBottom: `1px solid ${THEME.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftTitle: {
      fontSize: 14,
      fontWeight: 600,
      color: THEME.text.primary,
    },
    collapseBtn: {
      background: 'transparent',
      border: 'none',
      padding: 4,
      cursor: 'pointer',
      color: THEME.text.muted,
      fontSize: 14,
    },
    leftContent: {
      flex: 1,
      overflow: 'auto',
    },
    center: {
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
    },
  };

  return (
    <div style={styles.container}>
      {/* LEFT PANEL */}
      <div style={styles.leftPanel}>
        {leftCollapsed ? (
          <div style={styles.leftCollapsed} onClick={() => setLeftCollapsed(false)}>
            <span style={{ color: THEME.text.muted, marginBottom: 12 }}>&gt;</span>
            <div style={styles.leftCollapsedText}>{leftPanelTitle}</div>
          </div>
        ) : (
          <>
            <div style={styles.leftHeader}>
              <span style={styles.leftTitle}>{leftPanelTitle}</span>
              <button
                onClick={() => setLeftCollapsed(true)}
                style={styles.collapseBtn}
                title="Collapse sidebar"
              >
                &lt;
              </button>
            </div>
            <div style={styles.leftContent}>{leftPanel}</div>
            {/* Resize Handle */}
            <ResizeHandle
              position="right"
              isResizing={isLeftResizing}
              onMouseDown={leftHandleProps.onMouseDown}
              onTouchStart={leftHandleProps.onTouchStart}
              theme={{
                border: THEME.border,
                hover: '#3f3f46',
                active: '#10b981',
              }}
            />
          </>
        )}
      </div>

      {/* CENTER CONTENT */}
      <div style={styles.center}>{children}</div>

      {/* RIGHT PANEL - Files */}
      <FilesPanel
        files={files}
        isExpanded={rightExpanded}
        onToggle={() => setRightExpanded(!rightExpanded)}
        onFileSelect={onFileSelect}
        onFileDownload={onFileDownload}
        onDownloadAll={onDownloadAll}
        selectedFileId={selectedFileId}
        isGenerating={isGenerating}
        runId={runId}
        width={rightPanelWidth}
        isResizing={isRightResizing}
        resizeHandleProps={rightHandleProps}
      />
    </div>
  );
};

export default ThreeColumnLayout;
