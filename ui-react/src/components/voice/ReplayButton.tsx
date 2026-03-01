export interface ReplayButtonProps {
  /** Whether the button is visible */
  visible: boolean;
  /** Click handler */
  onClick: () => void;
  /** CSS class */
  className?: string;
}

/**
 * ReplayButton - Button to replay the assistant's last voice response.
 *
 * Appears after SPEAKING -> COMPLETE transition.
 * Hover: background brightens, text and border turn cyan.
 */
export function ReplayButton({ visible, onClick, className = '' }: ReplayButtonProps) {
  return (
    <button
      className={`
        mt-3 inline-flex items-center gap-1.5 cursor-pointer
        transition-all duration-300
        hover:text-[#00f0ff] hover:border-[#00f0ff]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]/40
        ${className}
      `}
      style={{
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '13px',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, background 0.3s ease, color 0.3s ease, border-color 0.3s ease',
      }}
      onClick={onClick}
      aria-label="Replay Athena's response"
      tabIndex={visible ? 0 : -1}
    >
      <span aria-hidden="true">&#9654;</span>
      Replay
    </button>
  );
}
