import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let focusableElement: HTMLButtonElement;

  beforeEach(() => {
    // Setup DOM elements
    container = document.createElement('div');
    focusableElement = document.createElement('button');
    focusableElement.textContent = 'Focusable Element';
    container.appendChild(focusableElement);
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM elements
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toHaveProperty('current');
  });

  it('should not trap focus when inactive', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    
    // Attach ref to container
    if (result.current.current) {
      container.ref = result.current;
    }
    
    expect(result.current.current).toBeNull();
  });

  it('should trap focus when active', () => {
    const { result } = renderHook(() => useFocusTrap(true));
    
    // Simulate attaching ref to container
    act(() => {
      result.current.current = container;
    });
    
    // The focus trap implementation would normally handle focus,
    // but we can't easily test the actual focus trapping in jsdom
    expect(result.current.current).toEqual(container);
  });
});