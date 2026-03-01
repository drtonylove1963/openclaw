/**
 * WorkflowExecutionHistory - Bottom panel showing execution history
 * Features:
 * - Table of workflow executions
 * - Status indicators (running, success, failed)
 * - Auto-refresh for running executions
 * - Collapsible panel
 */

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Calendar,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { GlassCard } from '../shared/GlassCard';
import { NeuralDataTable, type Column } from '../shared/NeuralDataTable';
import type { WorkflowExecution } from '../../stores/workflowStore';

export function WorkflowExecutionHistory() {
  const { selectedWorkflow, executions, loadExecutions } = useWorkflowStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  // Auto-refresh for running executions
  useEffect(() => {
    if (!selectedWorkflow) {return;}

    const hasRunningExecutions = executions.some((e) => e.status === 'running');
    if (!hasRunningExecutions) {return;}

    const interval = setInterval(() => {
      loadExecutions(selectedWorkflow.id);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [selectedWorkflow, executions, loadExecutions]);

  // Format duration
  const formatDuration = (ms: number | null) => {
    if (ms === null) {return '-';}
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {return `${hours}h ${minutes % 60}m`;}
    if (minutes > 0) {return `${minutes}m ${seconds % 60}s`;}
    return `${seconds}s`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate running duration
  const getRunningDuration = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    return now - start;
  };

  // Table columns
  const columns: Column<WorkflowExecution>[] = [
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (execution) => {
        const icons = {
          running: <Clock size={14} className="animate-spin" style={{ color: '#00d4ff' }} />,
          success: <CheckCircle size={14} style={{ color: '#10b981' }} />,
          failed: <XCircle size={14} style={{ color: '#ef4444' }} />,
        };

        const colors = {
          running: '#00d4ff',
          success: '#10b981',
          failed: '#ef4444',
        };

        return (
          <div className="flex items-center gap-2">
            {icons[execution.status]}
            <span style={{ color: colors[execution.status], fontWeight: 600, fontSize: '13px' }}>
              {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'startedAt',
      header: 'Started',
      width: '180px',
      render: (execution) => (
        <span style={{ fontSize: '13px', color: '#f0f0f5' }}>
          {formatDate(execution.startedAt)}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      width: '100px',
      render: (execution) => {
        const duration =
          execution.status === 'running'
            ? getRunningDuration(execution.startedAt)
            : execution.duration;

        return (
          <span style={{ fontSize: '13px', color: '#f0f0f5', fontFamily: 'monospace' }}>
            {formatDuration(duration)}
          </span>
        );
      },
    },
    {
      key: 'trigger',
      header: 'Trigger',
      width: '120px',
      render: (execution) => {
        const icons = {
          manual: <Zap size={14} style={{ color: '#00d4ff' }} />,
          schedule: <Calendar size={14} style={{ color: '#8b5cf6' }} />,
          webhook: <AlertCircle size={14} style={{ color: '#f59e0b' }} />,
        };

        return (
          <div className="flex items-center gap-2">
            {icons[execution.trigger as keyof typeof icons]}
            <span style={{ fontSize: '13px', color: '#f0f0f5', textTransform: 'capitalize' }}>
              {execution.trigger}
            </span>
          </div>
        );
      },
    },
    {
      key: 'error',
      header: 'Details',
      render: (execution) => {
        if (execution.status === 'failed' && execution.error) {
          return (
            <span
              style={{
                fontSize: '12px',
                color: '#ef4444',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {execution.error}
            </span>
          );
        }
        return <span style={{ fontSize: '12px', color: '#6b7280' }}>-</span>;
      },
    },
  ];

  if (isCollapsed) {
    return (
      <GlassCard
        variant="bordered"
        className="flex items-center justify-between cursor-pointer"
        style={{ padding: '16px 20px' }}
        onClick={() => setIsCollapsed(false)}
      >
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5' }}>
            Execution History
          </span>
          {executions.length > 0 && (
            <span
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'rgba(0, 212, 255, 0.2)',
                color: '#00d4ff',
              }}
            >
              {executions.length}
            </span>
          )}
        </div>
        <ChevronUp size={16} style={{ color: '#6b7280' }} />
      </GlassCard>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: '300px',
        gap: '12px',
      }}
    >
      {/* Header */}
      <GlassCard
        variant="bordered"
        className="flex items-center justify-between cursor-pointer flex-shrink-0"
        style={{ padding: '16px 20px' }}
        onClick={() => setIsCollapsed(true)}
      >
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: '#6b7280' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5', margin: 0 }}>
            Execution History
          </h3>
          {executions.length > 0 && (
            <span
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'rgba(0, 212, 255, 0.2)',
                color: '#00d4ff',
              }}
            >
              {executions.length}
            </span>
          )}
        </div>
        <ChevronDown size={16} style={{ color: '#6b7280' }} />
      </GlassCard>

      {/* Execution Table */}
      <div className="flex-1 overflow-hidden">
        {!selectedWorkflow ? (
          <GlassCard variant="bordered" className="h-full flex items-center justify-center">
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Select a workflow to view executions
            </span>
          </GlassCard>
        ) : (
          <NeuralDataTable
            columns={columns}
            data={executions}
            rowKey={(execution) => execution.id}
            onRowClick={setSelectedExecution}
            emptyMessage="No executions yet"
            className="h-full"
          />
        )}
      </div>

      {/* Selected Execution Details (optional expansion) */}
      {selectedExecution && (
        <GlassCard variant="highlighted" glowColor="#8b5cf6" style={{ padding: '16px' }}>
          <div className="flex items-start justify-between mb-3">
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5', margin: 0 }}>
              Execution Details
            </h4>
            <button
              onClick={() => setSelectedExecution(null)}
              className="text-sm border-0 bg-transparent outline-none cursor-pointer"
              style={{ color: '#6b7280', padding: 0 }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <strong style={{ color: '#f0f0f5' }}>ID:</strong> {selectedExecution.id}
            </div>
            <div>
              <strong style={{ color: '#f0f0f5' }}>Status:</strong>{' '}
              <span
                style={{
                  color:
                    selectedExecution.status === 'success'
                      ? '#10b981'
                      : selectedExecution.status === 'failed'
                      ? '#ef4444'
                      : '#00d4ff',
                }}
              >
                {selectedExecution.status}
              </span>
            </div>
            {selectedExecution.error && (
              <div>
                <strong style={{ color: '#f0f0f5' }}>Error:</strong>{' '}
                <span style={{ color: '#ef4444' }}>{selectedExecution.error}</span>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
