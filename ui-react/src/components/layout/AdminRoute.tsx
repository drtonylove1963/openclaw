import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';

/**
 * AdminRoute - Route guard that restricts access to admin users only.
 *
 * Wraps child routes/elements. If the user is not admin:
 * - If not authenticated: redirects to /login
 * - If authenticated but not admin: shows access denied
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: '#6b7280', fontSize: '14px' }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ padding: '40px 60px' }}>
        <div
          className="flex items-center justify-center mb-6"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
          }}
        >
          <Shield size={28} />
        </div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#f0f0f5',
            marginBottom: '8px',
          }}
        >
          Access Denied
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          This area requires administrator privileges.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
