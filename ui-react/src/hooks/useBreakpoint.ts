import { useMediaQuery } from './useMediaQuery';

// Tailwind CSS breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * useBreakpoint - Custom hook to track Tailwind CSS breakpoints
 * @param breakpoint - Tailwind breakpoint name (sm, md, lg, xl)
 * @param defaultState - Default state for SSR
 * @returns Boolean indicating if screen is smaller than breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint, defaultState: boolean = false): boolean {
  const breakpointValue = BREAKPOINTS[breakpoint];
  return useMediaQuery(`(max-width: ${breakpointValue - 1}px)`, defaultState);
}