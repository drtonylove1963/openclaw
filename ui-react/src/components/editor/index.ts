/**
 * Code Editor Components
 *
 * Export all editor-related components for easy importing.
 *
 * @example
 * import { CodeEditor, EditorTabs, EditorToolbar } from '@/components/editor';
 */

export { CodeEditor } from './CodeEditor';
export type { CodeEditorProps, CodeEditorRef } from './CodeEditor';

export { EditorTabs } from './EditorTabs';
export type { EditorTabsProps, EditorFile } from './EditorTabs';

export { EditorToolbar } from './EditorToolbar';
export type { EditorToolbarProps } from './EditorToolbar';

// Re-export language and theme utilities
export { getLanguageExtension, getSupportedLanguages, detectLanguage } from '../../lib/codemirror/languages';
export { getTheme, themes } from '../../lib/codemirror/themes';
