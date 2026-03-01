import { type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
}

export interface NeuralDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique key extractor for each row */
  rowKey: (row: T) => string;
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  className?: string;
}

/**
 * NeuralDataTable - Glassmorphic data table for lists
 *
 * Features:
 * - Glass header with subtle blur
 * - Hover-highlighted rows
 * - Column width control
 * - Custom cell renderers
 */
export function NeuralDataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}: NeuralDataTableProps<T>) {
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          padding: '60px 0',
          color: '#6b7280',
          fontSize: '14px',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="animate-spin"
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(0, 212, 255, 0.2)',
              borderTopColor: '#00d4ff',
              borderRadius: '50%',
            }}
          />
          Loading...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          padding: '60px 0',
          color: '#6b7280',
          fontSize: '14px',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`overflow-auto ni-scrollbar ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
      }}
    >
      <table className="w-full border-collapse" style={{ minWidth: '600px' }}>
        <thead>
          <tr
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left font-medium"
                style={{
                  padding: '14px 20px',
                  fontSize: '12px',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className="transition-all duration-200"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(0, 212, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '14px 20px',
                    fontSize: '14px',
                    color: '#f0f0f5',
                  }}
                >
                  {col.render
                    ? col.render(row, index)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
