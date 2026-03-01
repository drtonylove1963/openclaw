import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Plug } from 'lucide-react';
import { GlassCard, NeuralButton, StatusIndicator, NeuralEmptyState } from '../shared';
import { useIntegrationsStore } from '../../stores/integrationsStore';
import type { Integration } from '../../stores/integrationsStore';
import { IntegrationFormModal } from './IntegrationFormModal';

// ---------------------------------------------------------------------------
// Category filter
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'automation', label: 'Automation' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'security', label: 'Security' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function IntegrationsTab() {
  const {
    integrations,
    loading,
    error,
    testing,
    loadIntegrations,
    loadServiceTypes,
    toggleIntegration,
    testConnection,
    deleteIntegration,
  } = useIntegrationsStore();

  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Integration | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadServiceTypes();
    loadIntegrations();
  }, [loadServiceTypes, loadIntegrations]);

  // Filter by category
  const filtered = useMemo(() => {
    if (category === 'all') {return integrations;}
    return integrations.filter((i) => i.type_info?.category === category);
  }, [integrations, category]);

  // --- Handlers -----------------------------------------------------------

  const handleEdit = (integration: Integration) => {
    setEditTarget(integration);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIntegration(id);
    } catch { /* error handled by store */ }
    setConfirmDeleteId(null);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleIntegration(id, enabled);
    } catch { /* error handled by store */ }
  };

  const handleTest = async (id: string) => {
    try {
      await testConnection(id);
    } catch { /* error handled by store */ }
  };

  // --- Status helper ------------------------------------------------------
  const validityStatus = (i: Integration) => {
    if (i.is_valid) {return 'active' as const;}
    if (!i.is_valid) {return 'offline' as const;}
    return 'idle' as const;
  };

  const validityText = (i: Integration) => {
    if (!i.is_enabled) {return 'Disabled';}
    if (i.is_valid) {return 'Connected';}
    if (!i.is_valid) {return 'Failed';}
    return 'Not tested';
  };

  // --- Loading state ------------------------------------------------------
  if (loading && integrations.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '60px 0', color: '#6b7280' }}>
        <div className="flex items-center gap-3">
          <div
            className="animate-spin"
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(0,212,255,0.2)',
              borderTopColor: '#00d4ff',
              borderRadius: '50%',
            }}
          />
          Loading integrations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5' }}>
          Integrations
        </h2>
        <NeuralButton variant="primary" onClick={handleAdd}>
          <Plus size={14} /> Add Integration
        </NeuralButton>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px',
          color: '#ef4444',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid',
              transition: 'all 0.2s',
              ...(category === cat.id
                ? { background: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.4)', color: '#00d4ff' }
                : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }),
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <NeuralEmptyState
          icon={<Plug size={28} />}
          title="No integrations yet"
          description="Connect your infrastructure services to manage them from Pronetheia."
          action={
            <NeuralButton variant="primary" onClick={handleAdd}>
              <Plus size={14} /> Add Integration
            </NeuralButton>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {filtered.map((integ) => (
            <GlassCard key={integ.id} style={{ padding: '20px' }}>
              {/* Top row: name + badge */}
              <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#f0f0f5', marginBottom: '4px' }}>
                    {integ.name}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(139,92,246,0.12)',
                    color: '#8b5cf6',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    {integ.type_info?.name ?? integ.service_type}
                  </span>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(integ.id, !integ.is_enabled)}
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '11px',
                    background: integ.is_enabled ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                  title={integ.is_enabled ? 'Disable' : 'Enable'}
                >
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: integ.is_enabled ? '20px' : '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#f0f0f5',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                <StatusIndicator status={validityStatus(integ)} text={validityText(integ)} />
              </div>

              {/* Last tested */}
              {integ.last_tested_at && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                  Tested: {new Date(integ.last_tested_at).toLocaleString()}
                </div>
              )}
              {integ.test_error && ! integ.is_valid && (
                <div style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  marginBottom: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                  title={integ.test_error}
                >
                  {integ.test_error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <NeuralButton
                  variant="secondary"
                  onClick={() => handleTest(integ.id)}
                  disabled={testing === integ.id}
                >
                  <RefreshCw
                    size={13}
                    style={testing === integ.id ? { animation: 'spin 1s linear infinite' } : {}}
                  />
                  {testing === integ.id ? 'Testing' : 'Test'}
                </NeuralButton>
                <NeuralButton variant="secondary" onClick={() => handleEdit(integ)}>
                  <Pencil size={13} /> Edit
                </NeuralButton>

                {confirmDeleteId === integ.id ? (
                  <>
                    <NeuralButton variant="danger" onClick={() => handleDelete(integ.id)}>
                      Confirm
                    </NeuralButton>
                    <NeuralButton variant="secondary" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </NeuralButton>
                  </>
                ) : (
                  <NeuralButton variant="secondary" onClick={() => setConfirmDeleteId(integ.id)}>
                    <Trash2 size={13} />
                  </NeuralButton>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal */}
      <IntegrationFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        editIntegration={editTarget}
      />
    </div>
  );
}
