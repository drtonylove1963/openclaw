/**
 * DiffViewer - Inline diff rendering for code changes
 * Displays visual before/after comparisons with line-by-line highlighting
 */
import React, { useState, useMemo } from 'react';
import { COLORS } from '../../styles/colors';

export interface DiffViewerProps {
  /** Old/original code (for computing diff) */
  oldCode?: string;
  /** New/modified code (for computing diff) */
  newCode?: string;
  /** Pre-formatted unified diff string */
  unified?: string;
  /** Programming language for display */
  language?: string;
  /** Filename to display in header */
  filename?: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'header';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

/**
 * Parse unified diff format (starts with ---, +++, @@)
 */
function parseUnifiedDiff(diffText: string): DiffLine[] {
  const lines = diffText.split('\n');
  const result: DiffLine[] = [];
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) {
      // File header lines - skip or show as header
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('@@')) {
      // Hunk header - parse line numbers
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLineNum = parseInt(match[1], 10);
        newLineNum = parseInt(match[2], 10);
      }
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('-')) {
      result.push({
        type: 'removed',
        content: line.slice(1),
        oldLineNum: oldLineNum++,
      });
    } else if (line.startsWith('+')) {
      result.push({
        type: 'added',
        content: line.slice(1),
        newLineNum: newLineNum++,
      });
    } else if (line.startsWith(' ') || line === '') {
      result.push({
        type: 'unchanged',
        content: line.startsWith(' ') ? line.slice(1) : line,
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
      });
    }
  }

  return result;
}

/**
 * Compute simple line-by-line diff between old and new code
 * Uses a basic LCS-inspired approach for reasonable diff output
 */
function computeSimpleDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const result: DiffLine[] = [];

  // Build a set of new lines for quick lookup
  const newLinesSet = new Set(newLines);
  const oldLinesSet = new Set(oldLines);

  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  // Simple two-pointer approach
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldIdx >= oldLines.length) {
      // Remaining new lines are additions
      result.push({
        type: 'added',
        content: newLine,
        newLineNum: newLineNum++,
      });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // Remaining old lines are removals
      result.push({
        type: 'removed',
        content: oldLine,
        oldLineNum: oldLineNum++,
      });
      oldIdx++;
    } else if (oldLine === newLine) {
      // Lines match - unchanged
      result.push({
        type: 'unchanged',
        content: oldLine,
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
      });
      oldIdx++;
      newIdx++;
    } else {
      // Lines differ - check if old line exists later in new, or vice versa
      const oldExistsLaterInNew = newLines.slice(newIdx + 1).includes(oldLine);
      const newExistsLaterInOld = oldLines.slice(oldIdx + 1).includes(newLine);

      if (!oldLinesSet.has(newLine) || (!oldExistsLaterInNew && newExistsLaterInOld)) {
        // Old line was removed
        result.push({
          type: 'removed',
          content: oldLine,
          oldLineNum: oldLineNum++,
        });
        oldIdx++;
      } else if (!newLinesSet.has(oldLine) || (oldExistsLaterInNew && !newExistsLaterInOld)) {
        // New line was added
        result.push({
          type: 'added',
          content: newLine,
          newLineNum: newLineNum++,
        });
        newIdx++;
      } else {
        // Both lines are unique - show as removal then addition
        result.push({
          type: 'removed',
          content: oldLine,
          oldLineNum: oldLineNum++,
        });
        result.push({
          type: 'added',
          content: newLine,
          newLineNum: newLineNum++,
        });
        oldIdx++;
        newIdx++;
      }
    }
  }

  return result;
}

/**
 * Check if text looks like unified diff format
 */
function isUnifiedDiff(text: string): boolean {
  const firstLines = text.split('\n').slice(0, 5).join('\n');
  return (
    firstLines.includes('---') ||
    firstLines.includes('+++') ||
    firstLines.includes('@@') ||
    /^[-+]/.test(text.trim())
  );
}

export function DiffViewer({
  oldCode,
  newCode,
  unified,
  language,
  filename,
}: DiffViewerProps) {
  const [showFull, setShowFull] = useState(false);
  const MAX_LINES_COLLAPSED = 50;

  // Parse or compute diff
  const diffLines = useMemo(() => {
    if (unified) {
      return parseUnifiedDiff(unified);
    }
    if (oldCode !== undefined && newCode !== undefined) {
      return computeSimpleDiff(oldCode, newCode);
    }
    return [];
  }, [oldCode, newCode, unified]);

  // Determine if we need a "Show full" toggle
  const needsToggle = diffLines.length > MAX_LINES_COLLAPSED;
  const displayLines = needsToggle && !showFull
    ? diffLines.slice(0, MAX_LINES_COLLAPSED)
    : diffLines;

  // Count additions and removals
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.type === 'added') {added++;}
      if (line.type === 'removed') {removed++;}
    }
    return { added, removed };
  }, [diffLines]);

  if (diffLines.length === 0) {
    return null;
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      marginTop: '8px',
      marginBottom: '8px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${COLORS.border}`,
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      fontSize: '13px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: COLORS.codeBg,
      borderBottom: `1px solid ${COLORS.border}`,
    },
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      background: COLORS.accent + '20',
      color: COLORS.accent,
      fontSize: '11px',
      fontWeight: 500,
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    filename: {
      fontSize: '12px',
      color: COLORS.text,
    },
    stats: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '12px',
    },
    statAdded: {
      color: '#22863a',
    },
    statRemoved: {
      color: '#cb2431',
    },
    content: {
      overflowX: 'auto',
      background: COLORS.codeBg,
    },
    line: {
      display: 'flex',
      minHeight: '20px',
      lineHeight: '20px',
    },
    lineNumber: {
      display: 'inline-block',
      width: '40px',
      padding: '0 8px',
      textAlign: 'right',
      color: COLORS.textMuted,
      background: 'rgba(0, 0, 0, 0.1)',
      userSelect: 'none',
      flexShrink: 0,
      fontSize: '12px',
    },
    lineContent: {
      flex: 1,
      padding: '0 12px',
      whiteSpace: 'pre',
    },
    lineAdded: {
      background: 'rgba(46, 160, 67, 0.15)',
      borderLeft: '3px solid #22863a',
    },
    lineRemoved: {
      background: 'rgba(248, 81, 73, 0.15)',
      borderLeft: '3px solid #cb2431',
    },
    lineUnchanged: {
      background: 'transparent',
      borderLeft: '3px solid transparent',
    },
    lineHeader: {
      background: 'rgba(54, 130, 219, 0.1)',
      borderLeft: '3px solid #3682db',
      color: COLORS.textMuted,
      fontStyle: 'italic',
    },
    textAdded: {
      color: '#22863a',
    },
    textRemoved: {
      color: '#cb2431',
    },
    textUnchanged: {
      color: COLORS.text,
    },
    textHeader: {
      color: COLORS.textMuted,
    },
    toggleContainer: {
      padding: '8px 12px',
      background: COLORS.codeBg,
      borderTop: `1px solid ${COLORS.border}`,
      textAlign: 'center',
    },
    toggleButton: {
      background: 'transparent',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '4px',
      padding: '4px 12px',
      color: COLORS.textMuted,
      fontSize: '12px',
      cursor: 'pointer',
    },
  };

  const getLineStyles = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return { line: styles.lineAdded, text: styles.textAdded };
      case 'removed':
        return { line: styles.lineRemoved, text: styles.textRemoved };
      case 'header':
        return { line: styles.lineHeader, text: styles.textHeader };
      default:
        return { line: styles.lineUnchanged, text: styles.textUnchanged };
    }
  };

  const getPrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      default:
        return ' ';
    }
  };

  return (
    <div style={styles.container} data-testid="diff-viewer">
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <span style={styles.badge}>DIFF</span>
          {language && <span style={styles.badge}>{language}</span>}
          {filename && <span style={styles.filename}>{filename}</span>}
        </div>
        <div style={styles.stats} data-testid="diff-stats">
          <span style={styles.statAdded} data-testid="diff-added-count">+{stats.added}</span>
          <span style={styles.statRemoved} data-testid="diff-removed-count">-{stats.removed}</span>
        </div>
      </div>
      <div style={styles.content}>
        {displayLines.map((line, idx) => {
          const lineStyles = getLineStyles(line.type);
          return (
            <div key={idx} style={{ ...styles.line, ...lineStyles.line }}>
              <span style={styles.lineNumber}>
                {line.oldLineNum ?? ''}
              </span>
              <span style={styles.lineNumber}>
                {line.newLineNum ?? ''}
              </span>
              <span style={{ ...styles.lineContent, ...lineStyles.text }}>
                {line.type !== 'header' && getPrefix(line.type)}
                {line.content}
              </span>
            </div>
          );
        })}
      </div>
      {needsToggle && (
        <div style={styles.toggleContainer}>
          <button
            style={styles.toggleButton}
            onClick={() => setShowFull(!showFull)}
            data-testid="diff-toggle"
            onMouseOver={(e) => {
              e.currentTarget.style.color = COLORS.text;
              e.currentTarget.style.borderColor = COLORS.textMuted;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = COLORS.textMuted;
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            {showFull
              ? 'Show less'
              : `Show ${diffLines.length - MAX_LINES_COLLAPSED} more lines`}
          </button>
        </div>
      )}
    </div>
  );
}

export default DiffViewer;
