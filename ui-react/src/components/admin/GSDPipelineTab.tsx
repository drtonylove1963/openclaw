import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Lock } from 'lucide-react';
import { GlassCard, NeuralDataTable, StatusIndicator } from '../shared';
import type { Column } from '../shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface PipelineComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  version: string;
  uptime: number;
}

interface PipelineRun {
  id: string;
  task: string;
  status: 'completed' | 'running' | 'failed';
  stages_completed: number;
  total_stages: number;
  duration: number;
  created_at: string;
}

interface CollisionLock {
  resource: string;
  holder: string;
  acquired_at: string;
}

interface PipelineData {
  components: Record<string, PipelineComponent>;
  recent_runs: PipelineRun[];
  collision_prevention: {
    active_locks: CollisionLock[];
    collision_count: number;
  };
}

const STAGES = ['Orchestrator', 'Handoff', 'Verification', 'Refinement'];

const STATUS_ICONS = {
  healthy: <CheckCircle2 size={20} color="#10b981" />,
  degraded: <Clock size={20} color="#f59e0b" />,
  offline: <XCircle size={20} color="#ef4444" />,
};

export function GSDPipelineTab() {
  const [data, setData] = useState<PipelineData>({
    components: {},
    recent_runs: [],
    collision_prevention: {
      active_locks: [],
      collision_count: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
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
      const [componentsRes, runsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/integration-tests/components`, { headers }),
        fetch(`${API_BASE}/api/v1/orchestrator/recent`, { headers }),
      ]);

      if (!componentsRes.ok || !runsRes.ok) {
        throw new Error('Failed to fetch GSD Pipeline data');
      }

      const componentsData = await componentsRes.json();
      const runsData = await runsRes.json();

      setData({
        components: componentsData.components || {},
        recent_runs: runsData.runs || [],
        collision_prevention: componentsData.collision_prevention || {
          active_locks: [],
          collision_count: 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runColumns: Column<PipelineRun>[] = [
    { key: 'task', header: 'Task', width: '35%' },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (run) => (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            background:
              run.status === 'completed'
                ? 'rgba(16, 185, 129, 0.2)'
                : run.status === 'running'
                ? 'rgba(0, 212, 255, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
            color:
              run.status === 'completed'
                ? '#10b981'
                : run.status === 'running'
                ? '#00d4ff'
                : '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {run.status}
        </span>
      ),
    },
    {
      key: 'stages_completed',
      header: 'Stages',
      width: '15%',
      render: (run) => `${run.stages_completed}/${run.total_stages}`,
    },
    {
      key: 'duration',
      header: 'Duration',
      width: '15%',
      render: (run) => `${run.duration.toFixed(2)}s`,
    },
    {
      key: 'created_at',
      header: 'Started',
      width: '20%',
      render: (run) => new Date(run.created_at).toLocaleString(),
    },
  ];

  const lockColumns: Column<CollisionLock>[] = [
    { key: 'resource', header: 'Resource', width: '40%' },
    { key: 'holder', header: 'Holder', width: '30%' },
    {
      key: 'acquired_at',
      header: 'Acquired',
      width: '30%',
      render: (lock) => new Date(lock.acquired_at).toLocaleString(),
    },
  ];

  if (loading && Object.keys(data.components).length === 0) {
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
          Loading GSD Pipeline...
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

  const components = Object.values(data.components);
  const orchestratorStatus = data.components['orchestrator']?.status || 'offline';
  const handoffStatus = data.components['handoff']?.status || 'offline';
  const verificationStatus = data.components['verification']?.status || 'offline';
  const refinementStatus = data.components['refinement']?.status || 'offline';

  return (
    <div className="space-y-8">
      {/* Pipeline Overview */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Pipeline Overview
        </h2>
        <GlassCard style={{ padding: '32px' }}>
          <div className="flex items-center justify-between">
            {STAGES.map((stage, index) => {
              const status =
                index === 0
                  ? orchestratorStatus
                  : index === 1
                  ? handoffStatus
                  : index === 2
                  ? verificationStatus
                  : refinementStatus;

              return (
                <div key={stage} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background:
                          status === 'healthy'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : status === 'degraded'
                            ? 'rgba(245, 158, 11, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                        border: `2px solid ${
                          status === 'healthy'
                            ? '#10b981'
                            : status === 'degraded'
                            ? '#f59e0b'
                            : '#ef4444'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {STATUS_ICONS[status]}
                    </div>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#f0f0f5',
                        marginTop: '12px',
                      }}
                    >
                      {stage}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {status}
                    </span>
                  </div>
                  {index < STAGES.length - 1 && (
                    <div
                      style={{
                        width: '120px',
                        height: '2px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        margin: '0 24px',
                        position: 'relative',
                        top: '-28px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Component Status */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Component Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {components.map((component) => (
            <GlassCard key={component.name} style={{ padding: '20px' }}>
              <div className="flex flex-col gap-2">
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f5' }}>
                  {component.name}
                </h3>
                <StatusIndicator
                  status={component.status === 'healthy' ? 'active' : component.status === 'degraded' ? 'idle' : 'offline'}
                  text={component.status}
                />
                <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Version:</span>
                  <span style={{ fontSize: '12px', color: '#f0f0f5' }}>{component.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Uptime:</span>
                  <span style={{ fontSize: '12px', color: '#f0f0f5' }}>
                    {Math.floor(component.uptime / 60)}h {component.uptime % 60}m
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Recent Pipeline Runs */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Recent Pipeline Runs
        </h2>
        <NeuralDataTable
          columns={runColumns}
          data={data.recent_runs}
          rowKey={(run) => run.id}
          emptyMessage="No pipeline runs yet"
        />
      </div>

      {/* Collision Prevention */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Collision Prevention
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard style={{ padding: '24px' }}>
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(0, 212, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={28} color="#00d4ff" />
              </div>
              <div>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#00d4ff' }}>
                  {data.collision_prevention.active_locks.length}
                </span>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Active Locks
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '24px' }}>
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={28} color="#ef4444" />
              </div>
              <div>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444' }}>
                  {data.collision_prevention.collision_count}
                </span>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Collisions Prevented
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {data.collision_prevention.active_locks.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f5', marginBottom: '12px' }}>
              Active Resource Locks
            </h3>
            <NeuralDataTable
              columns={lockColumns}
              data={data.collision_prevention.active_locks}
              rowKey={(lock) => `${lock.resource}-${lock.holder}`}
              emptyMessage="No active locks"
            />
          </div>
        )}
      </div>
    </div>
  );
}
