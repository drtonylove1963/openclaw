import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { GlassCard, NeuralDataTable, NeuralButton, NeuralEmptyState } from '../shared';
import type { Column } from '../shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface Approval {
  id: string;
  request_type: string;
  description: string;
  requester: string;
  created_at: string;
}

interface Analytics {
  request_count: number;
  approval_rate: number;
  average_response_time: number;
}

interface Tier {
  id: string;
  name: string;
  max_tokens: number;
  features: string[];
}

interface SearchResult {
  id: string;
  content: string;
  relevance: number;
  source: string;
}

export function MCPUSRTab() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    request_count: 0,
    approval_rate: 0,
    average_response_time: 0,
  });
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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
      const [approvalsRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/mcp-usr/pending`, { headers }),
        fetch(`${API_BASE}/api/v1/mcp-usr/analytics`, { headers }),
      ]);

      if (!approvalsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch MCP-USR data');
      }

      const approvalsData = await approvalsRes.json();
      const analyticsData = await analyticsRes.json();

      setApprovals(approvalsData.approvals || []);
      setAnalytics(analyticsData);
      setTiers(analyticsData.tiers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('pronetheia_token');
    try {
      const res = await fetch(`${API_BASE}/api/v1/mcp-usr/approve/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {throw new Error('Failed to approve request');}

      setApprovals(approvals.filter(a => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    const token = localStorage.getItem('pronetheia_token');
    try {
      const res = await fetch(`${API_BASE}/api/v1/mcp-usr/reject/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {throw new Error('Failed to reject request');}

      setApprovals(approvals.filter(a => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {return;}

    setSearching(true);
    const token = localStorage.getItem('pronetheia_token');

    try {
      const res = await fetch(`${API_BASE}/api/v1/mcp-usr/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {throw new Error('Search failed');}

      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const approvalColumns: Column<Approval>[] = [
    { key: 'request_type', header: 'Type', width: '15%' },
    { key: 'description', header: 'Description', width: '40%' },
    { key: 'requester', header: 'Requester', width: '15%' },
    {
      key: 'created_at',
      header: 'Created',
      width: '15%',
      render: (approval) => new Date(approval.created_at).toLocaleString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '15%',
      render: (approval) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApprove(approval.id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: '#10b981',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
            }}
          >
            <CheckCircle size={14} />
            Approve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReject(approval.id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ef4444',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
          >
            <XCircle size={14} />
            Reject
          </button>
        </div>
      ),
    },
  ];

  const searchColumns: Column<SearchResult>[] = [
    { key: 'content', header: 'Content', width: '50%' },
    {
      key: 'relevance',
      header: 'Relevance',
      width: '15%',
      render: (result) => `${(result.relevance * 100).toFixed(1)}%`,
    },
    { key: 'source', header: 'Source', width: '35%' },
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
          Loading MCP-USR data...
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
      {/* Analytics */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <TrendingUp size={28} color="#00d4ff" />
              </div>
              <div>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#00d4ff' }}>
                  {analytics.request_count}
                </span>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Total Requests
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
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={28} color="#10b981" />
              </div>
              <div>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
                  {(analytics.approval_rate * 100).toFixed(1)}%
                </span>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Approval Rate
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
                  background: 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp size={28} color="#8b5cf6" />
              </div>
              <div>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#8b5cf6' }}>
                  {analytics.average_response_time.toFixed(1)}s
                </span>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Avg Response Time
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* HITL Approval Panel */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Pending Approvals
        </h2>
        {approvals.length === 0 ? (
          <NeuralEmptyState
            icon={<CheckCircle size={48} />}
            title="No pending approvals"
          />
        ) : (
          <NeuralDataTable
            columns={approvalColumns}
            data={approvals}
            rowKey={(approval) => approval.id}
            emptyMessage="No pending approvals"
          />
        )}
      </div>

      {/* Semantic Search */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Semantic Search
        </h2>
        <GlassCard style={{ padding: '24px' }}>
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge base..."
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  color: '#f0f0f5',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !searching) {
                    handleSearch();
                  }
                }}
              />
              <NeuralButton
                variant="primary"
                onClick={handleSearch}
                disabled={!searchQuery.trim() || searching}
                className="min-w-[120px]"
              >
                <Search size={16} />
                {searching ? 'Searching...' : 'Search'}
              </NeuralButton>
            </div>

            {searchResults.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <NeuralDataTable
                  columns={searchColumns}
                  data={searchResults}
                  rowKey={(result) => result.id}
                  emptyMessage="No results found"
                />
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Tier Configuration */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          Tier Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <GlassCard key={tier.id} style={{ padding: '24px' }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f0f0f5' }}>
                    {tier.name}
                  </h3>
                  <button
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(0, 212, 255, 0.1)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#00d4ff',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
                    }}
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Max Tokens:</span>
                  <span style={{ fontSize: '14px', color: '#f0f0f5', marginLeft: '8px' }}>
                    {tier.max_tokens.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                    Features:
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tier.features.map((feature, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: '13px',
                          color: '#f0f0f5',
                          padding: '4px 0',
                          paddingLeft: '16px',
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            color: '#00d4ff',
                          }}
                        >
                          •
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
