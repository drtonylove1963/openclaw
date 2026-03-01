/**
 * Role Badge Component
 * Displays user role with color coding
 */

import React from 'react';

const ROLE_COLORS = {
  FREE: '#6b7280',
  PRO: '#3b82f6',
  ENTERPRISE: '#8b5cf6',
  ADMIN: '#ef4444',
};

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
}

/**
 * RoleBadge - Visual indicator of user role
 *
 * Usage:
 * <RoleBadge role="PRO" />
 * <RoleBadge role="ADMIN" size="sm" />
 */
export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const color = ROLE_COLORS[role as keyof typeof ROLE_COLORS] || ROLE_COLORS.FREE;
  const fontSize = size === 'sm' ? 10 : 11;
  const padding = size === 'sm' ? '1px 6px' : '2px 8px';

  return (
    <span
      style={{
        padding,
        borderRadius: 4,
        fontSize,
        fontWeight: 600,
        background: color,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'inline-block',
      }}
    >
      {role}
    </span>
  );
}

export default RoleBadge;
