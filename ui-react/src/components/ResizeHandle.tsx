/**
 * ResizeHandle component
 * Visual drag handle for resizable panels
 */

import React, { useState } from 'react';

export interface ResizeHandleProps {
  /** Direction the handle is positioned (which side of the panel) */
  position: 'left' | 'right';
  /** Whether currently being dragged */
  isResizing?: boolean;
  /** Mouse/touch event handlers from useResizable hook */
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  /** Optional theme colors */
  theme?: {
    border?: string;
    hover?: string;
    active?: string;
  };
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  position,
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
  const visualHandleWidth = 6;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      [position]: -(touchTargetSize / 2),
      width: touchTargetSize,
      cursor: 'col-resize',
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
      width: isActive ? 3 : 1,
      height: '100%',
      backgroundColor: isResizing ? active : isHovered ? hover : border,
      transition: 'all 0.15s ease',
      borderRadius: 1,
    },
    grip: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: 40,
      display: 'flex',
      flexDirection: 'column',
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

export default ResizeHandle;
