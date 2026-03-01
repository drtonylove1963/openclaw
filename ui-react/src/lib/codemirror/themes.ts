/**
 * CodeMirror 6 Theme Configuration
 *
 * Provides theme extensions for the editor.
 * Includes dark (One Dark) and light themes.
 */

import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * Available themes
 */
export type ThemeName = 'dark' | 'light';

/**
 * Light theme colors (similar to GitHub light)
 */
const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#ffffff',
      color: '#24292f',
    },
    '.cm-content': {
      caretColor: '#24292f',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#24292f',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: '#b4d5fe',
      },
    '.cm-panels': {
      backgroundColor: '#f6f8fa',
      color: '#24292f',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid #d0d7de',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '1px solid #d0d7de',
    },
    '.cm-searchMatch': {
      backgroundColor: '#fffbdd',
      outline: '1px solid #d4a72c',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#fff8c5',
    },
    '.cm-activeLine': {
      backgroundColor: '#f6f8fa',
    },
    '.cm-selectionMatch': {
      backgroundColor: '#d7ffe0',
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: '#e8e8e8',
    },
    '.cm-gutters': {
      backgroundColor: '#ffffff',
      color: '#8c959f',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#f6f8fa',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#e8e8e8',
      border: 'none',
      color: '#656d76',
    },
    '.cm-tooltip': {
      border: '1px solid #d0d7de',
      backgroundColor: '#ffffff',
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: '#d0d7de',
      borderBottomColor: '#d0d7de',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: '#ffffff',
      borderBottomColor: '#ffffff',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#ddf4ff',
        color: '#24292f',
      },
    },
  },
  { dark: false }
);

/**
 * Light theme syntax highlighting
 */
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#cf222e' },
  { tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: '#24292f' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#8250df' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#0550ae' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#24292f' },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#0550ae' },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: '#24292f' },
  { tag: [tags.meta, tags.comment], color: '#6e7781' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#0550ae', textDecoration: 'underline' },
  { tag: tags.heading, fontWeight: 'bold', color: '#0550ae' },
  { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#0550ae' },
  { tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#0a3069' },
  { tag: tags.invalid, color: '#cf222e' },
]);

/**
 * Theme configurations
 */
export const themes: Record<ThemeName, Extension[]> = {
  dark: [oneDark],
  light: [lightTheme, syntaxHighlighting(lightHighlightStyle)],
};

/**
 * Get theme extension for CodeMirror
 *
 * @param theme - Theme name ('dark' or 'light')
 * @returns CodeMirror theme extension
 */
export function getTheme(theme: ThemeName): Extension {
  return themes[theme] || themes.dark;
}

/**
 * Get all available theme names
 */
export function getAvailableThemes(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}

/**
 * Custom Pronetheia theme (based on One Dark with purple accents)
 * Can be added later for branding
 */
export const pronetheiaTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#1a1b26',
      color: '#a9b1d6',
    },
    '.cm-content': {
      caretColor: '#7aa2f7',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#7aa2f7',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: '#3d59a1',
      },
    '.cm-activeLine': {
      backgroundColor: '#24283b',
    },
    '.cm-gutters': {
      backgroundColor: '#1a1b26',
      color: '#565f89',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#24283b',
    },
  },
  { dark: true }
);
