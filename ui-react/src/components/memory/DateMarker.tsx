export interface DateMarkerProps {
  date: string;
}

/**
 * DateMarker - Date separator in timeline with pulsing gradient node
 */
export function DateMarker({ date }: DateMarkerProps) {
  return (
    <div className="relative" style={{ margin: '30px 0 20px' }}>
      {/* Pulsing date node */}
      <div
        className="absolute animate-date-pulse"
        style={{
          left: '-28px',
          top: '50%',
          width: '16px',
          height: '16px',
          background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
          zIndex: 2,
        }}
        aria-hidden="true"
      />
      <span
        className="text-[14px] font-semibold uppercase"
        style={{ color: '#6b7280', letterSpacing: '1px' }}
      >
        {date}
      </span>
    </div>
  );
}
