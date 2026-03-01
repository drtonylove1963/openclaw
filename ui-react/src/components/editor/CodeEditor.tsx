/**
 * CodeEditor - Main CodeMirror 6 Editor Component
 *
 * A full-featured code editor with syntax highlighting, autocomplete,
 * and linting support for multiple languages.
 */

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

import { getLanguageExtension } from '../../lib/codemirror/languages';
import { getTheme } from '../../lib/codemirror/themes';
import { createBaseExtensions } from '../../lib/codemirror/extensions';

export interface CodeEditorProps {
  /** Initial content of the editor */
  value: string;
  /** Programming language for syntax highlighting */
  language: string;
  /** Callback when content changes */
  onChange?: (value: string) => void;
  /** Make editor read-only */
  readOnly?: boolean;
  /** Theme: 'dark' or 'light' */
  theme?: 'dark' | 'light';
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Enable code folding */
  foldable?: boolean;
  /** Callback when Ctrl+S is pressed */
  onSave?: (value: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels (for scrolling) */
  maxHeight?: number;
}

// Compartments for reconfigurable extensions
const languageCompartment = new Compartment();
const themeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

/**
 * CodeMirror 6 Editor Component
 *
 * Features:
 * - Syntax highlighting for 15+ languages
 * - Auto-completion
 * - Bracket matching and auto-closing
 * - Code folding
 * - Search and replace (Ctrl+F)
 * - Undo/redo history
 * - Line numbers
 * - Active line highlighting
 * - Customizable themes
 *
 * @example
 * ```tsx
 * <CodeEditor
 *   value={code}
 *   language="typescript"
 *   onChange={setCode}
 *   onSave={handleSave}
 * />
 * ```
 */
export const CodeEditor = memo(function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  theme = 'dark',
  lineNumbers: showLineNumbers = true,
  foldable = true,
  onSave,
  className = '',
  placeholder,
  minHeight = 200,
  maxHeight,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Keep refs updated
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  // Create save keymap
  const saveKeymap = keymap.of([
    {
      key: 'Mod-s',
      run: (view) => {
        if (onSaveRef.current) {
          onSaveRef.current(view.state.doc.toString());
        }
        return true;
      },
    },
  ]);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) {return;}

    // Build extensions
    const extensions = [
      // Base setup
      ...createBaseExtensions(),

      // Line numbers (optional)
      ...(showLineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : []),

      // Code folding (optional)
      ...(foldable ? [foldGutter()] : []),

      // History (undo/redo)
      history(),

      // Bracket matching and auto-closing
      bracketMatching(),
      closeBrackets(),

      // Indentation
      indentOnInput(),

      // Syntax highlighting
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

      // Search
      highlightSelectionMatches(),

      // Active line
      highlightActiveLine(),

      // Linting gutter
      lintGutter(),

      // Keymaps
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      saveKeymap,

      // Reconfigurable compartments
      languageCompartment.of(getLanguageExtension(language)),
      themeCompartment.of(getTheme(theme)),
      readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),

      // Update listener
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),

      // Styling
      EditorView.theme({
        '&': {
          minHeight: `${minHeight}px`,
          ...(maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontSize: '14px',
          lineHeight: '1.5',
        },
        '.cm-content': {
          padding: '8px 0',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          border: 'none',
        },
      }),
    ];

    // Add placeholder if provided
    if (placeholder) {
      extensions.push(
        EditorView.contentAttributes.of({ 'aria-placeholder': placeholder })
      );
    }

    // Create state
    const state = EditorState.create({
      doc: value,
      extensions,
    });

    // Create view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only run once on mount

  // Handle language changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: languageCompartment.reconfigure(getLanguageExtension(language)),
      });
    }
  }, [language]);

  // Handle theme changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.reconfigure(getTheme(theme)),
      });
    }
  }, [theme]);

  // Handle readOnly changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
      });
    }
  }, [readOnly]);

  // Handle external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  // Focus method
  const focus = useCallback(() => {
    viewRef.current?.focus();
  }, []);

  // Get value method
  const getValue = useCallback(() => {
    return viewRef.current?.state.doc.toString() ?? value;
  }, [value]);

  return (
    <div
      ref={editorRef}
      className={`code-editor-container overflow-hidden rounded-md border border-gray-700 ${className}`}
      data-testid="code-editor"
    />
  );
});

// Also export focus/getValue via ref if needed
export type CodeEditorRef = {
  focus: () => void;
  getValue: () => string;
};

export default CodeEditor;
