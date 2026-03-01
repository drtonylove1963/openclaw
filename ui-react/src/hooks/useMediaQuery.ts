import { useState, useEffect } from 'react';

/**
 * useMediaQuery - Custom hook to track CSS media query state
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @param defaultState - Default state for SSR
 * @returns Boolean indicating if media query matches
 */
export function useMediaQuery(query: string, defaultState: boolean = false): boolean {
  const [matches, setMatches] = useState<boolean>(defaultState);

  useEffect(() => {
    // Check if window is defined (SSR check)
    if (typeof window === 'undefined') {
      return;
    }

    // Create media query matcher
    const mediaQuery = window.matchMedia(query);
    
    // Set initial state
    setMatches(mediaQuery.matches);

    // Define listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', listener);

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}