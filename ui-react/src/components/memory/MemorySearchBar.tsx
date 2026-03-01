import { useState, useRef, useCallback } from 'react';

export interface MemorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * MemorySearchBar - Full-width glassmorphic search with ripple effect
 *
 * Matches mockup-v2-03-memory.html search bar with:
 * - Glass background + backdrop blur
 * - Focus ripple-out animation
 * - Search icon left-positioned
 */
export function MemorySearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search across 1,247 memories, 384 facts, 156 entities...',
  className = '',
}: MemorySearchBarProps) {
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
      }, 400);
    },
    [onChange, onSearch]
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
        className="absolute left-6 top-1/2 -translate-y-1/2 text-[20px] z-10"
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
        aria-label="Search memory"
        className="w-full text-[16px] outline-none transition-all duration-[400ms]"
        style={{
          padding: '24px 60px',
          background: isFocused
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isFocused
            ? '2px solid rgba(0, 212, 255, 0.5)'
            : '2px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          color: '#f0f0f5',
          boxShadow: isFocused
            ? '0 0 40px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
            : 'none',
        }}
      />

      {/* Ripple effect on focus */}
      {showRipple && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ripple-out"
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid rgba(0, 212, 255, 0.4)',
            borderRadius: '24px',
          }}
        />
      )}
    </div>
  );
}
