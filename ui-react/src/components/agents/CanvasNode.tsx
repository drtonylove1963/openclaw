/**
 * CanvasNode - Generic styled node for workflow canvas
 *
 * Works for agents, teams, skills, and other workflow items.
 * Neural-themed dark card with colored header, status indicator, and connection handles.
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Edit2, Trash2, Circle } from 'lucide-react';
import { COLORS } from '../../styles/colors';

export interface CanvasNodeData {
  label: string;
  subtitle?: string;
  icon?: string;  // emoji or lucide icon name
  color?: string;  // hex color for the header bar
  status?: 'idle' | 'active' | 'success' | 'error';
  badges?: string[];  // small badges shown below subtitle
  // For editing
  onEdit?: () => void;
  onDelete?: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return COLORS.warning;
    case 'success': return COLORS.success;
    case 'error': return COLORS.error;
    default: return COLORS.textDim;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return 'Running';
    case 'success': return 'Complete';
    case 'error': return 'Failed';
    default: return 'Idle';
  }
};

export const CanvasNode = memo(({ data, selected }: NodeProps<CanvasNodeData>) => {
  const statusColor = getStatusColor(data.status || 'idle');
  const headerColor = data.color || COLORS.info;

  return (
    <div
      style={{
        minWidth: '180px',
        maxWidth: '220px',
        borderRadius: '8px',
        boxShadow: selected
          ? `0 0 0 2px ${headerColor}, 0 4px 16px ${headerColor}40`
          : '0 4px 12px rgba(0, 0, 0, 0.4)',
        border: '1px solid ' + (selected ? headerColor : COLORS.border),
        backgroundColor: COLORS.bgAlt,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: headerColor,
          border: `2px solid ${COLORS.bgAlt}`,
          left: '-5px',
        }}
      />

      {/* Header with colored border */}
      <div
        style={{
          borderTop: `3px solid ${headerColor}`,
          padding: '10px 12px',
          backgroundColor: COLORS.bgPanel,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {data.icon && (
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{data.icon}</span>
            )}
            <span
              style={{
                color: COLORS.text,
                fontWeight: 600,
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {data.label}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
            }}
            title={getStatusLabel(data.status || 'idle')}
          >
            <Circle
              style={{
                width: '8px',
                height: '8px',
                fill: statusColor,
                stroke: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {data.subtitle && (
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: '12px',
              marginBottom: data.badges?.length ? '8px' : '0',
              lineHeight: '1.4',
            }}
          >
            {data.subtitle}
          </div>
        )}

        {data.badges && data.badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {data.badges.map((badge, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: COLORS.bgHover,
                  color: COLORS.textMuted,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {(data.onEdit || data.onDelete) && (
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px solid ${COLORS.border}`,
          }}>
            {data.onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onEdit?.();
                }}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: COLORS.bgHover,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px',
                  color: COLORS.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgActive;
                  e.currentTarget.style.color = COLORS.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgHover;
                  e.currentTarget.style.color = COLORS.textMuted;
                }}
              >
                <Edit2 style={{ width: '12px', height: '12px' }} />
                Edit
              </button>
            )}
            {data.onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDelete?.();
                }}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: COLORS.bgHover,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px',
                  color: COLORS.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.dangerBg;
                  e.currentTarget.style.color = COLORS.danger;
                  e.currentTarget.style.borderColor = COLORS.danger;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bgHover;
                  e.currentTarget.style.color = COLORS.textMuted;
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                <Trash2 style={{ width: '12px', height: '12px' }} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: headerColor,
          border: `2px solid ${COLORS.bgAlt}`,
          right: '-5px',
        }}
      />
    </div>
  );
});

CanvasNode.displayName = 'CanvasNode';
