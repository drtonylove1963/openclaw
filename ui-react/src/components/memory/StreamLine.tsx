/**
 * StreamLine - Animated vertical gradient line for the timeline
 *
 * A 3px gradient line (cyan -> violet -> amber) with a flowing
 * pulse that travels top-to-bottom continuously.
 */
export function StreamLine() {
  return (
    <div
      className="absolute top-0 bottom-0 overflow-hidden"
      style={{
        left: '20px',
        width: '3px',
        background:
          'linear-gradient(180deg, rgba(0, 212, 255, 0.4) 0%, rgba(139, 92, 246, 0.4) 50%, rgba(245, 158, 11, 0.4) 100%)',
        borderRadius: '2px',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute left-0 right-0 animate-stream-flow"
        style={{
          height: '20px',
          background: 'rgba(0, 212, 255, 0.8)',
          boxShadow: '0 0 15px rgba(0, 212, 255, 0.8)',
          top: '-20px',
        }}
      />
    </div>
  );
}
