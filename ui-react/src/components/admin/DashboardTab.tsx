import { useState, useEffect } from 'react';
import { Edit2, Power, UserX, UserCheck } from 'lucide-react';
import { GlassCard, ArcGauge, NeuralDataTable, StatusIndicator, NeuralModal, NeuralButton } from '../shared';
import type { Column } from '../shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'ENTERPRISE' | 'PRO' | 'FREE';
  status: 'active' | 'disabled';
  created_at: string;
}

interface Stats {
  total_users: number;
  active_sessions: number;
  api_calls_today: number;
  system_health: number;
}

interface ServiceHealth {
  name: string;
  status: 'active' | 'idle' | 'offline';
  url: string;
}

const ROLE_COLORS: Record<User['role'], string> = {
  ADMIN: '#ef4444',
  ENTERPRISE: '#8b5cf6',
  PRO: '#00d4ff',
  FREE: '#6b7280',
};

export function DashboardTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    active_sessions: 0,
    api_calls_today: 0,
    system_health: 0,
  });
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<User['role']>('FREE');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('pronetheia_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const [usersRes, statsRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/admin/users`, { headers }),
        fetch(`${API_BASE}/api/v1/admin/stats`, { headers }),
        fetch(`${API_BASE}/api/v1/health/mesh`, { headers }),
      ]);

      if (!usersRes.ok || !statsRes.ok || !healthRes.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const healthData = await healthRes.json();

      setUsers(usersData.users || []);
      setStats({
        total_users: statsData.total_users ?? 0,
        active_sessions: statsData.active_sessions ?? statsData.total_sessions ?? 0,
        api_calls_today: statsData.api_calls_today ?? 0,
        system_health: statsData.system_health ?? 100,
      });

      // Transform health data to service list — services are nested under healthData.services
      const svcMap = healthData.services || healthData;
      const serviceList: ServiceHealth[] = Object.entries(svcMap).map(([name, data]: [string, any]) => ({
        name,
        status: data.status === 'healthy' ? 'active' : data.status === 'degraded' ? 'idle' : 'offline',
        url: data.url || '',
      }));
      setServices(serviceList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) {return;}

    const token = localStorage.getItem('pronetheia_token');
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${editingUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!res.ok) {throw new Error('Failed to update role');}

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: selectedRole } : u));
      setEditingUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const token = localStorage.getItem('pronetheia_token');
    const newStatus = user.status === 'active' ? 'disabled' : 'active';

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {throw new Error('Failed to update status');}

      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const columns: Column<User>[] = [
    { key: 'username', header: 'Username', width: '20%' },
    { key: 'email', header: 'Email', width: '25%' },
    {
      key: 'role',
      header: 'Role',
      width: '15%',
      render: (user) => (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            background: `${ROLE_COLORS[user.role]}20`,
            color: ROLE_COLORS[user.role],
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (user) => (
        <span style={{ color: user.status === 'active' ? '#10b981' : '#6b7280', textTransform: 'capitalize' }}>
          {user.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '15%',
      render: (user) => new Date(user.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '10%',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditRole(user);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
            }}
            title="Edit role"
          >
            <Edit2 size={16} color="#00d4ff" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(user);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: user.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${user.status === 'active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (user.status === 'active') {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              } else {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (user.status === 'active') {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              } else {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
              }
            }}
            title={user.status === 'active' ? 'Disable user' : 'Enable user'}
          >
            {user.status === 'active' ? <UserX size={16} color="#ef4444" /> : <UserCheck size={16} color="#10b981" />}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '60px 0', color: '#6b7280' }}>
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
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '60px 0', color: '#ef4444' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard style={{ padding: '24px' }}>
          <div className="flex flex-col items-center">
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#00d4ff' }}>
              {stats.total_users}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Total Users
            </span>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '24px' }}>
          <div className="flex flex-col items-center">
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#8b5cf6' }}>
              {stats.active_sessions}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Active Sessions
            </span>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '24px' }}>
          <div className="flex flex-col items-center">
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#10b981' }}>
              {stats.api_calls_today.toLocaleString()}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              API Calls Today
            </span>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '24px' }}>
          <div className="flex flex-col items-center">
            <ArcGauge
              value={stats.system_health}
              label="Health"
              gradient={['#10b981', '#00d4ff']}
              size={80}
            />
          </div>
        </GlassCard>
      </div>

      {/* User Management */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          User Management
        </h2>
        <NeuralDataTable
          columns={columns}
          data={users}
          rowKey={(user) => user.id}
          emptyMessage="No users found"
        />
      </div>

      {/* System Health */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          System Health
        </h2>
        <GlassCard style={{ padding: '24px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service.name}>
                <StatusIndicator
                  status={service.status}
                  text={service.name}
                />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <NeuralModal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title="Edit User Role"
        >
          <div className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                User: {editingUser.username}
              </label>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Select Role:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as User['role'])}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  color: '#f0f0f5',
                  fontSize: '14px',
                }}
              >
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <NeuralButton variant="secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </NeuralButton>
              <NeuralButton variant="primary" onClick={handleSaveRole}>
                Save
              </NeuralButton>
            </div>
          </div>
        </NeuralModal>
      )}
    </div>
  );
}
