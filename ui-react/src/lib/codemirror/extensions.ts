/**
 * CodeMirror 6 Extensions Configuration
 *
 * Provides base extensions and utilities for the editor.
 */

import { Extension } from '@codemirror/state';
import { EditorView, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightSpecialChars } from '@codemirror/view';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';

/**
 * Create base extensions that should be included in every editor
 *
 * These are the fundamental extensions that provide:
 * - Selection rendering
 * - Drop cursor for drag/drop
 * - Special character highlighting
 * - Autocompletion
 */
export function createBaseExtensions(): Extension[] {
  return [
    // Visual enhancements
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),

    // Autocompletion
    autocompletion({
      activateOnTyping: true,
      maxRenderedOptions: 50,
    }),
    keymap.of(completionKeymap),

    // Allow horizontal scrolling
    EditorView.lineWrapping,

    // Custom DOM event handlers
    EditorView.domEventHandlers({
      // Prevent default drop behavior to handle file drops
      drop(event) {
        // Let the editor handle text drops, but could extend for file drops
        return false;
      },
    }),
  ];
}

/**
 * Create read-only extensions
 *
 * Extensions for read-only mode (viewing code without editing)
 */
export function createReadOnlyExtensions(): Extension[] {
  return [
    EditorView.editable.of(false),
    EditorView.contentAttributes.of({ tabindex: '0' }),
  ];
}

/**
 * Create diff extensions
 *
 * Extensions for showing diffs between two versions
 * (placeholder - can be implemented with @codemirror/merge)
 */
export function createDiffExtensions(): Extension[] {
  // Placeholder for future diff view implementation
  return [];
}

/**
 * Line wrapping configuration
 */
export const lineWrapping = EditorView.lineWrapping;

/**
 * Tab size configuration
 *
 * @param size - Number of spaces per tab
 */
export function tabSize(size: number): Extension {
  return EditorView.theme({
    '.cm-content': {
      tabSize: size.toString(),
    },
  });
}

/**
 * Font size configuration
 *
 * @param size - Font size in pixels
 */
export function fontSize(size: number): Extension {
  return EditorView.theme({
    '.cm-scroller': {
      fontSize: `${size}px`,
    },
  });
}

/**
 * Font family configuration
 *
 * @param family - CSS font-family value
 */
export function fontFamily(family: string): Extension {
  return EditorView.theme({
    '.cm-scroller': {
      fontFamily: family,
    },
  });
}

/**
 * Create placeholder extension
 *
 * @param text - Placeholder text to show when editor is empty
 */
export function placeholder(text: string): Extension {
  return EditorView.contentAttributes.of({
    'aria-placeholder': text,
    'data-placeholder': text,
  });
}

/**
 * Height configuration
 *
 * @param min - Minimum height in pixels
 * @param max - Maximum height in pixels (optional)
 */
export function height(min: number, max?: number): Extension {
  return EditorView.theme({
    '&': {
      minHeight: `${min}px`,
      ...(max ? { maxHeight: `${max}px` } : {}),
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
  });
}

/**
 * Common editor configurations as presets
 */
export const presets = {
  /**
   * Minimal editor with just syntax highlighting
   */
  minimal: (): Extension[] => createBaseExtensions(),

  /**
   * Standard editor with all common features
   */
  standard: (): Extension[] => [
    ...createBaseExtensions(),
    lineWrapping,
    tabSize(2),
    fontSize(14),
  ],

  /**
   * Large file editor optimized for performance
   */
  largeFile: (): Extension[] => [
    ...createBaseExtensions(),
    // Disable some features for better performance
    EditorView.theme({
      '.cm-scroller': {
        overflow: 'auto',
      },
    }),
  ],

  /**
   * Mobile-optimized editor
   */
  mobile: (): Extension[] => [
    ...createBaseExtensions(),
    lineWrapping,
    fontSize(16), // Larger text for touch
    EditorView.theme({
      '.cm-content': {
        padding: '16px 8px',
      },
    }),
  ],
};
