import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  const dialogRef = useFocusTrap(isOpen);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: ( eventData ) => {
      if (eventData.deltaX < -50) { // Minimum swipe distance
        onClose();
      }
      setIsSwiping(false);
      setSwipeOffset(0);
    },
    onSwiping: ( eventData ) => {
      if (eventData.deltaX < 0) { // Only track left swipes
        setIsSwiping(true);
        setSwipeOffset(Math.max(eventData.deltaX, -280)); // Limit swipe distance
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  if (!isOpen && !isSwiping) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      {...swipeHandlers}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black transition-opacity duration-300 ease-in-out"
        style={{ 
          opacity: isOpen && !isSwiping ? 0.5 : Math.max(0, 0.5 * (1 - Math.abs(swipeOffset) / 280)),
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={dialogRef}
        className="fixed left-0 top-0 h-full w-64 md:w-72 bg-gray-900 shadow-xl transform transition-none flex flex-col"
        style={{ 
          transform: `translateX(${isSwiping ? swipeOffset : (isOpen ? 0 : -100)}%)`,
          maxWidth: 'min(280px, 100vw)',
          transition: isSwiping ? 'none' : 'transform 0.3s ease-in-out',
        }}
        tabIndex={-1}
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}