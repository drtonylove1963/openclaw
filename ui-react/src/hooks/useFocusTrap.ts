import { useRef, useEffect } from 'react';

/**
 * useFocusTrap - Custom hook to trap focus within an element
 * @param isActive - Whether to activate focus trap
 * @returns Ref to attach to the container element
 */
export function useFocusTrap(isActive: boolean) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !dialogRef.current) {return;}

    const dialog = dialogRef.current;
    const savedFocus = document.activeElement as HTMLElement;

    // Focus the dialog when it opens
    dialog.focus();

    const handleFocus = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) {
        event.preventDefault();
        dialog.focus();
      }
    };

    // Listen for focus events
    document.addEventListener('focus', handleFocus, true);

    return () => {
      document.removeEventListener('focus', handleFocus, true);
      // Return focus to the previously focused element
      savedFocus?.focus?.();
    };
  }, [isActive]);

  return dialogRef;
}