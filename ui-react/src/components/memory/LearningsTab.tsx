import { useState, useEffect } from 'react';
import { LearningCard, type Learning } from './LearningCard';
import { NeuralEmptyState } from '../shared/NeuralEmptyState';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * LearningsTab - Learning queue and history
 *
 * Features:
 * - Pending learnings queue at top (highlighted section)
 * - Each pending learning has approve/reject buttons
 * - Learning history below (chronological list)
 * - Empty state when no learnings
 */
export function LearningsTab() {
  const [pendingLearnings, setPendingLearnings] = useState<Learning[]>([]);
  const [historyLearnings, setHistoryLearnings] = useState<Learning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLearnings();
  }, []);

  const fetchLearnings = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('pronetheia_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch pending learnings
      const pendingResponse = await fetch(`${API_BASE}/api/v1/learnings?status=pending`, {
        headers,
      });
      if (!pendingResponse.ok) {throw new Error('Failed to fetch pending learnings');}
      const pendingData = await pendingResponse.json();

      // Fetch all learnings (history)
      const historyResponse = await fetch(`${API_BASE}/api/v1/learnings`, { headers });
      if (!historyResponse.ok) {throw new Error('Failed to fetch learning history');}
      const historyData = await historyResponse.json();

      setPendingLearnings(pendingData.learnings || pendingData || []);

      // Filter out pending from history
      const allLearnings = historyData.learnings || historyData || [];
      setHistoryLearnings(
        allLearnings.filter((l: Learning) => l.status !== 'pending')
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPendingLearnings([]);
      setHistoryLearnings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/learnings/${id}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {throw new Error('Failed to approve learning');}

      // Refresh learnings
      fetchLearnings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve learning');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/learnings/${id}/reject`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {throw new Error('Failed to reject learning');}

      // Refresh learnings
      fetchLearnings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject learning');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span style={{ color: '#6b7280', fontSize: '14px' }}>Loading learnings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <NeuralEmptyState
          icon={<span style={{ fontSize: '32px' }}>⚠️</span>}
          title="Error Loading Learnings"
          description={error}
        />
      </div>
    );
  }

  const hasAnyLearnings = pendingLearnings.length > 0 || historyLearnings.length > 0;

  if (!hasAnyLearnings) {
    return (
      <div className="flex-1">
        <NeuralEmptyState
          icon={<span style={{ fontSize: '32px' }}>💡</span>}
          title="No Learnings Yet"
          description="The system will accumulate learnings as it processes information. Check back later."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto ni-scrollbar">
        {/* Pending Learnings Queue */}
        {pendingLearnings.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            {/* Section Header */}
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: '16px' }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  margin: 0,
                }}
              >
                Pending Review
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '8px',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                }}
              >
                {pendingLearnings.length} pending
              </span>
            </div>

            {/* Pending List (highlighted) */}
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(251, 191, 36, 0.05)',
                border: '1px solid rgba(251, 191, 36, 0.15)',
              }}
            >
              <div className="flex flex-col gap-3">
                {pendingLearnings.map((learning) => (
                  <LearningCard
                    key={learning.id}
                    learning={learning}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Learning History */}
        {historyLearnings.length > 0 && (
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#f0f0f5',
                margin: 0,
                marginBottom: '16px',
              }}
            >
              History
            </h3>

            <div className="flex flex-col gap-3">
              {historyLearnings.map((learning) => (
                <LearningCard key={learning.id} learning={learning} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
