import { useState, useEffect } from 'react';

/**
 * Hook to detect device orientation (portrait/landscape)
 * Useful for adjusting layouts on mobile devices
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  useEffect(() => {
    const handleOrientationChange = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };
    
    // Initial detection
    handleOrientationChange();
    
    // Listen for resize events (orientation changes trigger resize)
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);
  
  return orientation;
}