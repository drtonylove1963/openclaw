/**
 * HorizontalResizeHandle component
 * Visual drag handle for vertical resizing (horizontal bar that drags up/down)
 */

import React, { useState } from 'react';

export interface HorizontalResizeHandleProps {
  /** Whether currently being dragged */
  isResizing?: boolean;
  /** Mouse/touch event handlers from useVerticalResizable hook */
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  /** Optional theme colors */
  theme?: {
    border?: string;
    hover?: string;
    active?: string;
  };
}

export const HorizontalResizeHandle: React.FC<HorizontalResizeHandleProps> = ({
  isResizing = false,
  onMouseDown,
  onTouchStart,
  theme = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    border = '#27272a',
    hover = '#3f3f46',
    active = '#10b981',
  } = theme;

  const isActive = isResizing || isHovered;

  // Touch target: 44px for Apple HIG compliance, visual handle: 6px
  const touchTargetSize = 44;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'relative',
      width: '100%',
      height: touchTargetSize,
      marginTop: -(touchTargetSize - 6) / 2,
      marginBottom: -(touchTargetSize - 6) / 2,
      cursor: 'row-resize',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Prevent browser gestures during resize
      touchAction: 'none',
      // Prevent text selection on touch
      WebkitUserSelect: 'none',
      userSelect: 'none',
    },
    line: {
      width: '100%',
      height: isActive ? 3 : 1,
      backgroundColor: isResizing ? active : isHovered ? hover : border,
      transition: 'all 0.15s ease',
      borderRadius: 1,
    },
    grip: {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 40,
      height: 4,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      opacity: isActive ? 1 : 0,
      transition: 'opacity 0.15s ease',
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: '50%',
      backgroundColor: isResizing ? active : hover,
    },
  };

  return (
    <div
      style={styles.container}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.line} />
      <div style={styles.grip}>
        <div style={styles.dot} />
        <div style={styles.dot} />
        <div style={styles.dot} />
      </div>
    </div>
  );
};

export default HorizontalResizeHandle;
