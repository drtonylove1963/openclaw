import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Server, Play, Square, RotateCw } from 'lucide-react';
import { GlassCard, NeuralButton, StatusIndicator, NeuralEmptyState, NeuralDataTable } from '../shared';
import type { Column } from '../shared';
import { usePVEStore } from '../../stores/pveStore';
import type { PVEContainer } from '../../stores/pveStore';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatUptime(seconds: number): string {
  if (seconds === 0) {return '—';}
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) {parts.push(`${d}d`);}
  if (h > 0) {parts.push(`${h}h`);}
  if (m > 0 || parts.length === 0) {parts.push(`${m}m`);}
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ContainersTab() {
  const {
    containers,
    loading,
    error,
    actionLoading,
    loadContainers,
  } = usePVEStore();

  const startContainer = usePVEStore((s) => s.startContainer);
  const stopContainer = usePVEStore((s) => s.stopContainer);
  const restartContainer = usePVEStore((s) => s.restartContainer);

  const [confirmAction, setConfirmAction] = useState<{
    vmid: number;
    node: string;
    action: 'stop' | 'restart';
  } | null>(null);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  // --- Handlers ----------------------------------------------------------

  const handleStart = useCallback(async (node: string, vmid: number) => {
    try { await startContainer(node, vmid); } catch { /* store handles error */ }
  }, [startContainer]);

  const handleConfirmedAction = useCallback(async () => {
    if (!confirmAction) {return;}
    const { node, vmid, action } = confirmAction;
    setConfirmAction(null);
    try {
      if (action === 'stop') {await stopContainer(node, vmid);}
      else {await restartContainer(node, vmid);}
    } catch { /* store handles error */ }
  }, [confirmAction, stopContainer, restartContainer]);

  // --- Status mapping ----------------------------------------------------

  const statusVariant = (s: string) => {
    if (s === 'running') {return 'active' as const;}
    if (s === 'stopped') {return 'offline' as const;}
    return 'idle' as const;
  };

  // --- No-integration error detection ------------------------------------
  const isNoIntegration = error?.includes('No Proxmox integration');

  // --- Columns -----------------------------------------------------------

  const columns: Column<PVEContainer>[] = [
    { key: 'vmid', header: 'VMID', width: '70px' },
    { key: 'name', header: 'Name', width: '180px' },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (row) => (
        <StatusIndicator status={statusVariant(row.status)} text={row.status} />
      ),
    },
    {
      key: 'cpus',
      header: 'CPUs',
      width: '70px',
    },
    {
      key: 'memory',
      header: 'Memory',
      width: '140px',
      render: (row) => (
        <span style={{ fontSize: '13px' }}>
          {formatBytes(row.mem)} / {formatBytes(row.maxmem)}
        </span>
      ),
    },
    {
      key: 'disk',
      header: 'Disk',
      width: '140px',
      render: (row) => (
        <span style={{ fontSize: '13px' }}>
          {formatBytes(row.disk)} / {formatBytes(row.maxdisk)}
        </span>
      ),
    },
    {
      key: 'uptime',
      header: 'Uptime',
      width: '100px',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>
          {formatUptime(row.uptime)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (row) => {
        const key = `${row.node}/${row.vmid}`;
        const busy = actionLoading === key;

        return (
          <div className="flex items-center gap-2">
            {row.status === 'stopped' ? (
              <NeuralButton
                variant="secondary"
                onClick={() => handleStart(row.node, row.vmid)}
                disabled={busy}
              >
                <Play size={12} /> Start
              </NeuralButton>
            ) : (
              <>
                <NeuralButton
                  variant="secondary"
                  onClick={() => setConfirmAction({ vmid: row.vmid, node: row.node, action: 'restart' })}
                  disabled={busy}
                >
                  <RotateCw size={12} /> Restart
                </NeuralButton>
                <NeuralButton
                  variant="secondary"
                  onClick={() => setConfirmAction({ vmid: row.vmid, node: row.node, action: 'stop' })}
                  disabled={busy}
                >
                  <Square size={12} /> Stop
                </NeuralButton>
              </>
            )}
            {busy && (
              <div
                className="animate-spin"
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(0,212,255,0.2)',
                  borderTopColor: '#00d4ff',
                  borderRadius: '50%',
                }}
              />
            )}
          </div>
        );
      },
    },
  ];

  // --- Loading state -----------------------------------------------------

  if (loading && containers.length === 0) {
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
          Loading containers...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5' }}>
          Containers
        </h2>
        <NeuralButton
          variant="secondary"
          onClick={() => loadContainers()}
          disabled={loading}
        >
          <RefreshCw
            size={14}
            style={loading ? { animation: 'spin 1s linear infinite' } : {}}
          />
          Refresh
        </NeuralButton>
      </div>

      {/* No-integration banner */}
      {isNoIntegration && (
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
            Proxmox Integration Required
          </div>
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>
            No enabled Proxmox integration found. Go to the{' '}
            <span style={{ color: '#00d4ff', fontWeight: 500 }}>Integrations</span>{' '}
            tab to add your Proxmox VE credentials.
          </div>
        </GlassCard>
      )}

      {/* Error banner (generic) */}
      {error && !isNoIntegration && (
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

      {/* Confirm action dialog */}
      {confirmAction && (
        <GlassCard style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between">
            <div style={{ color: '#f0f0f5', fontSize: '14px' }}>
              {confirmAction.action === 'stop' ? 'Stop' : 'Restart'} container{' '}
              <strong>
                {containers.find((c) => c.vmid === confirmAction.vmid)?.name || confirmAction.vmid}
              </strong>{' '}
              (VMID {confirmAction.vmid})?
            </div>
            <div className="flex items-center gap-2">
              <NeuralButton
                variant="danger"
                onClick={handleConfirmedAction}
              >
                {confirmAction.action === 'stop' ? 'Stop' : 'Restart'}
              </NeuralButton>
              <NeuralButton
                variant="secondary"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </NeuralButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Container table */}
      {!isNoIntegration && containers.length === 0 && !loading ? (
        <NeuralEmptyState
          icon={<Server size={28} />}
          title="No containers found"
          description="No LXC containers were returned from the Proxmox host."
          action={
            <NeuralButton variant="secondary" onClick={() => loadContainers()}>
              <RefreshCw size={14} /> Retry
            </NeuralButton>
          }
        />
      ) : !isNoIntegration ? (
        <NeuralDataTable<PVEContainer>
          columns={columns}
          data={containers}
          rowKey={(row) => `${row.node}-${row.vmid}`}
          loading={false}
          emptyMessage="No containers"
        />
      ) : null}
    </div>
  );
}
