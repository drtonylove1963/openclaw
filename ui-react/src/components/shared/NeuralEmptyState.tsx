import { type ReactNode } from 'react';

export interface NeuralEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * NeuralEmptyState - Reusable empty state placeholder
 *
 * Centered display with icon, title, description, and optional action button.
 */
export function NeuralEmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: NeuralEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
      style={{ padding: '60px 40px' }}
    >
      {icon && (
        <div
          className="flex items-center justify-center mb-5"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#6b7280',
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#f0f0f5',
          marginBottom: description ? '8px' : '0',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            maxWidth: '400px',
            lineHeight: 1.6,
            marginBottom: action ? '24px' : '0',
          }}
        >
          {description}
        </p>
      )}

      {action}
    </div>
  );
}
