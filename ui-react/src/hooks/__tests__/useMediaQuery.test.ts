import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';

describe('useMediaQuery', () => {
  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should return default state for SSR', () => {
    // Mock window as undefined for SSR simulation
    const originalWindow = global.window;
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)', true));
    expect(result.current).toBe(true);

    // Restore window
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
    });
  });

  it('should return correct value for matching query', () => {
    mockMatchMedia(true);
    
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should update on window resize', () => {
    let listeners: ((event: MediaQueryListEvent) => void)[] = [];
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((_, listener) => {
          listeners.push(listener);
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      listeners.forEach(listener => {
        listener({ matches: true } as unknown as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listeners', () => {
    const removeEventListener = jest.fn();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener,
        dispatchEvent: jest.fn(),
      })),
    });

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    unmount();
    
    expect(removeEventListener).toHaveBeenCalled();
  });
});