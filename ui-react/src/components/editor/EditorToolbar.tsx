/**
 * EditorToolbar - Toolbar for code editor actions
 *
 * Provides save, format, copy, and other editor actions.
 */

import React, { memo, useCallback } from 'react';
import {
  Save,
  Copy,
  Download,
  Undo,
  Redo,
  AlignLeft,
  Check,
  Loader2,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';

export interface EditorToolbarProps {
  /** Is the editor in read-only mode */
  readOnly?: boolean;
  /** Is there unsaved content */
  isDirty?: boolean;
  /** Is save in progress */
  isSaving?: boolean;
  /** Save was successful (for feedback) */
  saveSuccess?: boolean;
  /** Current theme */
  theme?: 'dark' | 'light';
  /** Callback for save action */
  onSave?: () => void;
  /** Callback for copy action */
  onCopy?: () => void;
  /** Callback for download action */
  onDownload?: () => void;
  /** Callback for format action */
  onFormat?: () => void;
  /** Callback for undo action */
  onUndo?: () => void;
  /** Callback for redo action */
  onRedo?: () => void;
  /** Callback for theme toggle */
  onToggleTheme?: () => void;
  /** Callback for settings */
  onSettings?: () => void;
  /** Current file name */
  fileName?: string;
  /** Current language */
  language?: string;
  /** Additional CSS class */
  className?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  loading?: boolean;
  success?: boolean;
}

const ToolbarButton = memo(function ToolbarButton({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  loading = false,
  success = false,
}: ToolbarButtonProps) {
  return (
    <button
      className={`
        p-2 rounded hover:bg-gray-700 transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active ? 'bg-gray-700 text-blue-400' : 'text-gray-400'}
        ${success ? 'text-green-400' : ''}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
      aria-label={label}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : success ? (
        <Check size={16} />
      ) : (
        icon
      )}
    </button>
  );
});

const ToolbarDivider = () => (
  <div className="w-px h-6 bg-gray-700 mx-1" />
);

/**
 * EditorToolbar Component
 *
 * Provides a toolbar with common editor actions:
 * - Save (Ctrl+S)
 * - Copy to clipboard
 * - Download file
 * - Format code
 * - Undo/Redo
 * - Theme toggle
 * - Settings
 *
 * @example
 * ```tsx
 * <EditorToolbar
 *   isDirty={hasChanges}
 *   isSaving={saving}
 *   onSave={handleSave}
 *   onCopy={handleCopy}
 *   theme="dark"
 *   onToggleTheme={toggleTheme}
 * />
 * ```
 */
export const EditorToolbar = memo(function EditorToolbar({
  readOnly = false,
  isDirty = false,
  isSaving = false,
  saveSuccess = false,
  theme = 'dark',
  onSave,
  onCopy,
  onDownload,
  onFormat,
  onUndo,
  onRedo,
  onToggleTheme,
  onSettings,
  fileName,
  language,
  className = '',
}: EditorToolbarProps) {
  const handleCopy = useCallback(async () => {
    onCopy?.();
  }, [onCopy]);

  return (
    <div
      className={`
        flex items-center justify-between
        px-2 py-1 bg-gray-900 border-b border-gray-700
        ${className}
      `}
    >
      {/* Left side - Actions */}
      <div className="flex items-center gap-0.5">
        {/* Save */}
        {!readOnly && (
          <ToolbarButton
            icon={<Save size={16} />}
            label={`Save${isDirty ? ' (unsaved changes)' : ''} (Ctrl+S)`}
            onClick={onSave}
            disabled={!isDirty}
            loading={isSaving}
            success={saveSuccess}
          />
        )}

        {/* Undo/Redo */}
        {!readOnly && (
          <>
            <ToolbarButton
              icon={<Undo size={16} />}
              label="Undo (Ctrl+Z)"
              onClick={onUndo}
            />
            <ToolbarButton
              icon={<Redo size={16} />}
              label="Redo (Ctrl+Shift+Z)"
              onClick={onRedo}
            />
          </>
        )}

        <ToolbarDivider />

        {/* Copy */}
        <ToolbarButton
          icon={<Copy size={16} />}
          label="Copy to clipboard"
          onClick={handleCopy}
        />

        {/* Download */}
        <ToolbarButton
          icon={<Download size={16} />}
          label="Download file"
          onClick={onDownload}
        />

        {/* Format */}
        {!readOnly && onFormat && (
          <>
            <ToolbarDivider />
            <ToolbarButton
              icon={<AlignLeft size={16} />}
              label="Format code"
              onClick={onFormat}
            />
          </>
        )}
      </div>

      {/* Center - File info */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {fileName && (
          <span className="hidden sm:inline">
            {fileName}
            {isDirty && <span className="text-orange-400 ml-1">●</span>}
          </span>
        )}
        {language && (
          <span className="px-2 py-0.5 bg-gray-800 rounded text-xs uppercase">
            {language}
          </span>
        )}
      </div>

      {/* Right side - Settings */}
      <div className="flex items-center gap-0.5">
        {/* Theme toggle */}
        <ToolbarButton
          icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={onToggleTheme}
        />

        {/* Settings */}
        {onSettings && (
          <ToolbarButton
            icon={<Settings size={16} />}
            label="Editor settings"
            onClick={onSettings}
          />
        )}
      </div>
    </div>
  );
});

export default EditorToolbar;
