import { useState, useEffect } from 'react';
import { Power, Play, AlertTriangle } from 'lucide-react';
import { GlassCard, NeuralDataTable, StatusIndicator, NeuralButton, NeuralEmptyState } from '../shared';
import type { Column } from '../shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface Skill {
  id: string;
  name: string;
  category: string;
  status: 'enabled' | 'disabled';
  description: string;
}

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline';
  model: string;
  last_execution: string;
}

interface Gap {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
};

export function AthenaTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

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
      const [skillsRes, agentsRes, gapsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/athena/skills`, { headers }),
        fetch(`${API_BASE}/api/v1/athena/agents`, { headers }),
        fetch(`${API_BASE}/api/v1/athena/gaps`, { headers }),
      ]);

      if (!skillsRes.ok || !agentsRes.ok || !gapsRes.ok) {
        throw new Error('Failed to fetch Athena data');
      }

      const skillsData = await skillsRes.json();
      const agentsData = await agentsRes.json();
      const gapsData = await gapsRes.json();

      setSkills(skillsData.skills || []);
      setAgents(agentsData.agents || []);
      setGaps(gapsData.gaps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSkill = async (skill: Skill) => {
    const token = localStorage.getItem('pronetheia_token');
    const newStatus = skill.status === 'enabled' ? 'disabled' : 'enabled';

    try {
      const res = await fetch(`${API_BASE}/api/v1/athena/skills/${skill.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {throw new Error('Failed to update skill status');}

      setSkills(skills.map(s => s.id === skill.id ? { ...s, status: newStatus } : s));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update skill');
    }
  };

  const handleTestRouter = async () => {
    if (!testInput.trim()) {return;}

    setTesting(true);
    setTestResult(null);
    const token = localStorage.getItem('pronetheia_token');

    try {
      const res = await fetch(`${API_BASE}/api/v1/athena/router/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ input: testInput }),
      });

      if (!res.ok) {throw new Error('Router test failed');}

      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const agentColumns: Column<Agent>[] = [
    { key: 'name', header: 'Agent', width: '25%' },
    {
      key: 'status',
      header: 'Status',
      width: '20%',
      render: (agent) => <StatusIndicator status={agent.status} text={agent.status} />,
    },
    { key: 'model', header: 'Model', width: '25%' },
    {
      key: 'last_execution',
      header: 'Last Execution',
      width: '30%',
      render: (agent) => agent.last_execution ? new Date(agent.last_execution).toLocaleString() : 'Never',
    },
  ];

  const gapColumns: Column<Gap>[] = [
    { key: 'description', header: 'Description', width: '50%' },
    {
      key: 'priority',
      header: 'Priority',
      width: '20%',
      render: (gap) => (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            background: `${PRIORITY_COLORS[gap.priority]}20`,
            color: PRIORITY_COLORS[gap.priority],
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {gap.priority}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '30%',
      render: (gap) => new Date(gap.created_at).toLocaleString(),
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
          Loading Athena data...
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
      {/* Skills Management */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Skills Management
        </h2>
        {skills.length === 0 ? (
          <NeuralEmptyState
            icon={<AlertTriangle size={48} />}
            title="No skills configured"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <GlassCard key={skill.id} style={{ padding: '20px' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f5', marginBottom: '4px' }}>
                      {skill.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      {skill.category}
                    </p>
                    <p style={{ fontSize: '14px', color: '#f0f0f5', opacity: 0.7 }}>
                      {skill.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSkill(skill)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      background: skill.status === 'enabled' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      border: `1px solid ${skill.status === 'enabled' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (skill.status === 'enabled') {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                      } else {
                        e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (skill.status === 'enabled') {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                      } else {
                        e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                      }
                    }}
                    title={skill.status === 'enabled' ? 'Disable skill' : 'Enable skill'}
                  >
                    <Power size={18} color={skill.status === 'enabled' ? '#10b981' : '#6b7280'} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Agent Management */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Agent Management
        </h2>
        <NeuralDataTable
          columns={agentColumns}
          data={agents}
          rowKey={(agent) => agent.id}
          emptyMessage="No agents available"
        />
      </div>

      {/* Gaps Queue */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Capability Gaps
        </h2>
        <NeuralDataTable
          columns={gapColumns}
          data={gaps}
          rowKey={(gap) => gap.id}
          emptyMessage="No unresolved gaps"
        />
      </div>

      {/* Task Router Tester */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Task Router Tester
        </h2>
        <GlassCard style={{ padding: '24px' }}>
          <div className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Test Input:
              </label>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Enter task description..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  color: '#f0f0f5',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !testing) {
                    handleTestRouter();
                  }
                }}
              />
            </div>
            <NeuralButton
              variant="primary"
              onClick={handleTestRouter}
              disabled={!testInput.trim() || testing}
              className="w-full"
            >
              <Play size={16} />
              {testing ? 'Testing...' : 'Test Router'}
            </NeuralButton>
            {testResult && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Result:
                </label>
                <pre
                  style={{
                    padding: '16px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    color: '#f0f0f5',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: '300px',
                  }}
                >
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
