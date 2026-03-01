import { ConfidenceGauge } from './ConfidenceGauge';

export interface PatternChipProps {
  text: string;
  confidence: number;
  className?: string;
}

/**
 * PatternChip - Behavioral pattern item with confidence gauge
 *
 * Purple-accented chip showing a detected pattern and its confidence
 * score via a circular gauge. Hover shifts right.
 */
export function PatternChip({ text, confidence, className = '' }: PatternChipProps) {
  return (
    <div
      className={`flex items-center justify-between cursor-pointer transition-all duration-300 ${className}`}
      style={{
        padding: '12px 16px',
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '12px',
        marginBottom: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
        e.currentTarget.style.transform = 'translateX(5px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <span className="text-[12px] flex-1 mr-3" style={{ color: '#f0f0f5' }}>
        {text}
      </span>
      <ConfidenceGauge value={confidence} />
    </div>
  );
}
