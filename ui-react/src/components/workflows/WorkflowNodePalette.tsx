/**
 * WorkflowNodePalette - Left sidebar with workflow list
 * Features:
 * - Search filter
 * - New workflow button
 * - Workflow list with status indicators
 * - Collapsible panel
 */

import { useState } from 'react';
import { Plus, Search, GitBranch, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { GlassCard } from '../shared/GlassCard';

export function WorkflowNodePalette() {
  const { workflows, selectedWorkflow, selectWorkflow, createWorkflow } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter workflows by search
  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) {return 'Never';}
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {return 'Just now';}
    if (diffMins < 60) {return `${diffMins}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    if (diffDays < 7) {return `${diffDays}d ago`;}
    return date.toLocaleDateString();
  };

  // Handle new workflow
  const handleNewWorkflow = async () => {
    await createWorkflow({
      name: 'New Workflow',
      description: 'Enter workflow description',
    });
  };

  if (isCollapsed) {
    return (
      <div
        className="flex-shrink-0 flex flex-col items-center"
        style={{
          width: '60px',
          gap: '12px',
          paddingRight: '20px',
        }}
      >
        <GlassCard
          variant="bordered"
          className="w-full flex items-center justify-center cursor-pointer"
          style={{ padding: '12px' }}
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight size={20} style={{ color: '#6b7280' }} />
        </GlassCard>
        <GlassCard
          variant="bordered"
          className="w-full flex items-center justify-center cursor-pointer hover:border-cyan-500/40"
          style={{ padding: '12px' }}
          onClick={handleNewWorkflow}
        >
          <Plus size={20} style={{ color: '#00d4ff' }} />
        </GlassCard>
        <div className="flex-1 flex items-center justify-center">
          <GitBranch size={20} style={{ color: '#6b7280' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        width: '280px',
        gap: '12px',
        paddingRight: '20px',
      }}
    >
      {/* Header */}
      <GlassCard variant="bordered" style={{ padding: '20px' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f0f0f5', margin: 0 }}>
            Workflows
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewWorkflow}
              className="flex items-center justify-center transition-colors duration-200 border-0 outline-none cursor-pointer"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 212, 255, 0.2)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                color: '#00d4ff',
              }}
              aria-label="New workflow"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="flex items-center justify-center transition-colors duration-200 border-0 outline-none cursor-pointer"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#6b7280',
              }}
              aria-label="Collapse panel"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
            }}
          />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-0 outline-none"
            style={{
              padding: '10px 12px 10px 36px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              color: '#f0f0f5',
            }}
          />
        </div>
      </GlassCard>

      {/* Workflow List */}
      <div
        className="flex-1 overflow-auto ni-scrollbar"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        {filteredWorkflows.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            {searchQuery ? 'No workflows found' : 'No workflows yet'}
          </div>
        ) : (
          filteredWorkflows.map((workflow) => {
            const isSelected = selectedWorkflow?.id === workflow.id;

            return (
              <GlassCard
                key={workflow.id}
                variant={isSelected ? 'highlighted' : 'bordered'}
                glowColor={isSelected ? '#00d4ff' : undefined}
                hoverable={!isSelected}
                onClick={() => selectWorkflow(workflow.id)}
                className="cursor-pointer"
                style={{ padding: '14px 16px' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#f0f0f5',
                      margin: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {workflow.name}
                  </h3>
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{
                      width: '8px',
                      height: '8px',
                      marginLeft: '8px',
                      marginTop: '4px',
                      backgroundColor:
                        workflow.status === 'active'
                          ? '#10b981'
                          : workflow.status === 'error'
                          ? '#ef4444'
                          : '#6b7280',
                      boxShadow:
                        workflow.status === 'active'
                          ? '0 0 8px #10b981'
                          : workflow.status === 'error'
                          ? '0 0 8px #ef4444'
                          : 'none',
                    }}
                  />
                </div>

                <div
                  className="flex items-center justify-between"
                  style={{ fontSize: '12px', color: '#6b7280' }}
                >
                  <span>{workflow.nodeCount} nodes</span>
                  <span>{formatDate(workflow.lastExecuted)}</span>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
