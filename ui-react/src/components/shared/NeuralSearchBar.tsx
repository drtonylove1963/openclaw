import { useState, useRef, useCallback, type ReactNode } from 'react';

export interface NeuralSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional right-side actions (e.g. filter buttons) */
  actions?: ReactNode;
  /** Debounce delay in ms (default: 400) */
  debounceMs?: number;
}

/**
 * NeuralSearchBar - Reusable glassmorphic search input
 *
 * Full-width search bar with glass background, ripple focus effect,
 * debounced search callback, and optional action slot.
 */
export function NeuralSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className = '',
  actions,
  debounceMs = 400,
}: NeuralSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val);
      if (debounceRef.current) {clearTimeout(debounceRef.current);}
      debounceRef.current = setTimeout(() => {
        if (val.trim().length >= 2) {onSearch(val.trim());}
      }, debounceMs);
    },
    [onChange, onSearch, debounceMs]
  );

  const handleFocus = () => {
    setIsFocused(true);
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <div className={`relative mb-[30px] ${className}`}>
      {/* Search icon */}
      <span
        className="absolute left-6 top-1/2 -translate-y-1/2 text-[18px] z-10 pointer-events-none"
        style={{ color: '#6b7280' }}
        aria-hidden="true"
      >
        &#x1F50D;
      </span>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full text-[15px] outline-none transition-all duration-[400ms]"
        style={{
          padding: '20px 60px',
          paddingRight: actions ? '140px' : '60px',
          background: isFocused
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isFocused
            ? '2px solid rgba(0, 212, 255, 0.5)'
            : '2px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          color: '#f0f0f5',
          boxShadow: isFocused
            ? '0 0 40px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
            : 'none',
        }}
      />

      {/* Optional action slot */}
      {actions && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {actions}
        </div>
      )}

      {/* Ripple effect on focus */}
      {showRipple && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ripple-out"
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid rgba(0, 212, 255, 0.4)',
            borderRadius: '20px',
          }}
        />
      )}
    </div>
  );
}
