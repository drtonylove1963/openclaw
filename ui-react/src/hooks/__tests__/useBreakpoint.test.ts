import { renderHook } from '@testing-library/react';
import { useBreakpoint } from '../useBreakpoint';

// Mock useMediaQuery
jest.mock('../useMediaQuery', () => ({
  useMediaQuery: jest.fn(),
}));

describe('useBreakpoint', () => {
  const mockUseMediaQuery = jest.requireMock('../useMediaQuery').useMediaQuery;

  beforeEach(() => {
    // Clear mock before each test
    mockUseMediaQuery.mockClear();
  });

  it('should return correct value for sm breakpoint', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useBreakpoint('sm'));
    expect(result.current).toBe(true);
    expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width: 639px)', false);
  });

  it('should return correct value for md breakpoint', () => {
    mockUseMediaQuery.mockReturnValue(false);
    
    const { result } = renderHook(() => useBreakpoint('md'));
    expect(result.current).toBe(false);
    expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width: 767px)', false);
  });

  it('should return correct value for lg breakpoint', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useBreakpoint('lg'));
    expect(result.current).toBe(true);
    expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width: 1023px)', false);
  });

  it('should return correct value for xl breakpoint', () => {
    mockUseMediaQuery.mockReturnValue(false);
    
    const { result } = renderHook(() => useBreakpoint('xl'));
    expect(result.current).toBe(false);
    expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width: 1279px)', false);
  });

  it('should pass default state to useMediaQuery', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { result } = renderHook(() => useBreakpoint('md', true));
    expect(result.current).toBe(true);
    expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width: 767px)', true);
  });
});