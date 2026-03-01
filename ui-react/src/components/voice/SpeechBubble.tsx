import { useEffect, useState, useRef } from 'react';

export interface SpeechBubbleProps {
  /** 'user' or 'assistant' */
  role: 'user' | 'assistant';
  /** Text content to display */
  text: string;
  /** Whether the bubble is visible */
  visible: boolean;
  /** Whether to animate typing effect */
  typing?: boolean;
  /** Typing speed in ms per character (default: 60 for user, 40 for assistant) */
  typingSpeed?: number;
  /** Callback when typing animation completes */
  onTypingComplete?: () => void;
  /** Children (e.g., ReplayButton) */
  children?: React.ReactNode;
  /** CSS class */
  className?: string;
}

/**
 * SpeechBubble - Glassmorphic transcript/response bubble below the orb.
 *
 * Features:
 * - User bubble: cyan left border, types at 60ms/char
 * - Assistant bubble: violet left border, types at 40ms/char
 * - Slide-up + fade-in entrance animation
 * - Typing cursor follows text
 *
 * From VOICE-INTERACTION-SPEC.md Section 6.
 */
export function SpeechBubble({
  role,
  text,
  visible,
  typing = false,
  typingSpeed,
  onTypingComplete,
  children,
  className = '',
}: SpeechBubbleProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const speed = typingSpeed ?? (role === 'user' ? 60 : 40);
  const borderColor = role === 'user' ? '#00f0ff' : '#7b61ff';
  const cursorColor = role === 'user' ? '#00f0ff' : '#7b61ff';

  useEffect(() => {
    if (!typing || !text) {
      setDisplayText(text);
      setIsTyping(false);
      return;
    }

    // Start typing animation
    setIsTyping(true);
    setDisplayText('');
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current <= text.length) {
        setDisplayText(text.slice(0, indexRef.current));
      } else {
        clearInterval(intervalRef.current);
        setIsTyping(false);
        onTypingComplete?.();
      }
    }, speed);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [text, typing, speed, onTypingComplete]);

  return (
    <div
      className={`relative transition-all duration-500 ${className}`}
      style={{
        maxWidth: '700px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '20px 24px',
        borderLeft: `3px solid ${borderColor}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      role="log"
      aria-label={role === 'user' ? 'Your message' : "Athena's response"}
    >
      <p
        style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: 'rgba(255, 255, 255, 0.9)',
          margin: 0,
        }}
      >
        {displayText}
        {isTyping && (
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '16px',
              background: cursorColor,
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        )}
      </p>
      {children}
    </div>
  );
}
