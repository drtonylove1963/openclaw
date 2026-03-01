/**
 * Permission Gate Component
 * Conditionally renders children based on user role or permission
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGateProps {
  permission?: string;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGate - Conditional rendering based on permissions
 *
 * Usage:
 * <PermissionGate permission="session:unlimited">
 *   <UnlimitedSessionsFeature />
 * </PermissionGate>
 *
 * <PermissionGate role="ADMIN">
 *   <AdminPanel />
 * </PermissionGate>
 *
 * <PermissionGate permission="chat:create" fallback={<UpgradePrompt />}>
 *   <CreateChatButton />
 * </PermissionGate>
 */
export function PermissionGate({ permission, role, fallback, children }: PermissionGateProps) {
  const { hasPermission, hasRole } = useAuth();

  // Check permission if specified
  if (permission && !hasPermission(permission)) {
    return <>{fallback ?? null}</>;
  }

  // Check role if specified
  if (role && !hasRole(role)) {
    return <>{fallback ?? null}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
