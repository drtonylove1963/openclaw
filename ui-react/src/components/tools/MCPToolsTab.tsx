import { useEffect, useState, useMemo } from 'react';
import { Wrench, Loader2, Play } from 'lucide-react';
import { useToolsStore } from '../../stores/toolsStore';
import { ToolCardNeural } from './ToolCardNeural';
import { NeuralSearchBar, NeuralEmptyState, NeuralModal, NeuralButton } from '../shared';
import type { Tool } from '../../stores/toolsStore';

export function MCPToolsTab() {
  const {
    tools,
    toolsLoading,
    toolsError,
    selectedTool,
    searchQuery,
    executionResult,
    executionLoading,
    executionError,
    loadTools,
    selectTool,
    executeTool,
    setSearchQuery,
  } = useToolsStore();

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [toolParams, setToolParams] = useState<Record<string, unknown>>({});

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const filteredTools = useMemo(() => {
    let filtered = tools;

    if (selectedSource) {
      filtered = filtered.filter(t => t.source === selectedSource);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tools, selectedSource, searchQuery]);

  const sources = useMemo(() => {
    const sourceSet = new Set(tools.map(t => t.source));
    return Array.from(sourceSet);
  }, [tools]);

  const handleToolSelect = (tool: Tool) => {
    selectTool(tool);
    setToolParams({});
  };

  const handleExecute = async () => {
    if (!selectedTool) {return;}
    await executeTool(selectedTool.id, toolParams);
  };

  const handleParamChange = (paramName: string, value: unknown) => {
    setToolParams(prev => ({ ...prev, [paramName]: value }));
  };

  const handleModalClose = () => {
    selectTool(null);
    setToolParams({});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search and Filters */}
      <div style={{ flexShrink: 0 }}>
        <NeuralSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={setSearchQuery}
          placeholder="Search tools..."
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              {sources.map(source => {
                const isActive = selectedSource === source;
                const sourceColors: Record<string, string> = {
                  mcp: '#00d4ff',
                  builtin: '#8b5cf6',
                  custom: '#f59e0b',
                };
                const color = sourceColors[source] || '#6b7280';

                return (
                  <button
                    key={source}
                    onClick={() => setSelectedSource(isActive ? null : source)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: isActive ? `${color}20` : 'rgba(255, 255, 255, 0.04)',
                      border: isActive ? `1px solid ${color}40` : '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isActive ? color : '#6b7280',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {source}
                  </button>
                );
              })}
            </div>
          }
        />
      </div>

      {/* Tools Grid */}
      <div
        className="ni-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {toolsLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
            <Loader2 size={40} style={{ color: '#00d4ff', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {toolsError && (
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '14px',
            }}
          >
            Error loading tools: {toolsError}
          </div>
        )}

        {!toolsLoading && !toolsError && filteredTools.length === 0 && (
          <NeuralEmptyState
            icon={<Wrench size={32} />}
            title="No tools found"
            description="Try adjusting your search or filters."
          />
        )}

        {!toolsLoading && !toolsError && filteredTools.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredTools.map(tool => (
              <ToolCardNeural
                key={tool.id}
                tool={tool}
                onClick={handleToolSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tool Execution Modal */}
      {selectedTool && (
        <NeuralModal
          isOpen={true}
          onClose={handleModalClose}
          title={selectedTool.name}
          maxWidth="640px"
          footer={
            <>
              <NeuralButton variant="secondary" onClick={handleModalClose}>
                Cancel
              </NeuralButton>
              <NeuralButton
                variant="primary"
                onClick={handleExecute}
                disabled={executionLoading}
              >
                {executionLoading ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Execute
                  </>
                )}
              </NeuralButton>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tool Description */}
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
              {selectedTool.description}
            </p>

            {/* Input Fields */}
            {(Object.keys(selectedTool.schema?.properties ?? {}).length > 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5', margin: 0 }}>
                  Parameters
                </h4>
                {Object.entries(selectedTool.schema.properties).map(([paramName, paramDef]) => {
                  const isRequired = selectedTool.schema.required?.includes(paramName);
                  return (
                    <div key={paramName} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#f0f0f5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {paramName}
                        {isRequired && (
                          <span style={{ color: '#ef4444', fontSize: '12px' }}>*</span>
                        )}
                      </label>
                      {paramDef.description && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                          {String(paramDef.description)}
                        </p>
                      )}
                      <input
                        type={paramDef.type === 'number' ? 'number' : 'text'}
                        value={String(toolParams[paramName] ?? '')}
                        onChange={(e) => handleParamChange(paramName, e.target.value)}
                        placeholder={`Enter ${paramName}`}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#f0f0f5',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 200ms',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(0, 212, 255, 0.5)';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                This tool requires no parameters.
              </p>
            )}

            {/* Execution Error */}
            {executionError && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '13px',
                }}
              >
                {executionError}
              </div>
            )}

            {/* Execution Result */}
            {executionResult != null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5', margin: 0 }}>
                  Result
                </h4>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '13px',
                    color: '#f0f0f5',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                  className="ni-scrollbar"
                >
                  {JSON.stringify(executionResult, null, 2)}
                </div>
              </div>
            )}
          </div>
        </NeuralModal>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
