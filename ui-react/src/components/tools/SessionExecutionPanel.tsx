import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '../../types/tools';
import { COLORS } from '../../styles/colors';

interface Session {
  session_id: string;
  mcp_package: string;
  created_at: string;
  last_used_at: string;
  idle_seconds: number;
  expires_in_seconds: number;
}

interface ToolCallResult {
  session_id: string;
  tool_name: string;
  status: 'completed' | 'failed';
  result: any;
  error_message: string | null;
  duration_ms: number;
}

interface SessionExecutionPanelProps {
  tool: Tool;
  onClose: () => void;
}

/**
 * Generic session-based execution panel for MCP tools that require stateful sessions.
 * Supports any tool with requires_session=true and automatically discovers available
 * tools from the MCP server.
 */
export const SessionExecutionPanel: React.FC<SessionExecutionPanelProps> = ({
  tool,
  onClose,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ToolCallResult[]>([]);

  // Generic tool call state
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<string>('{}');

  // Puppeteer-specific state (when applicable)
  const [navigateUrl, setNavigateUrl] = useState('https://example.com');
  const [screenshotName, setScreenshotName] = useState('screenshot');
  const [screenshotEncoded, setScreenshotEncoded] = useState(true);

  // Determine MCP package from tool configuration
  const mcpPackage = tool.mcp_package || '@modelcontextprotocol/server-puppeteer';
  const isPuppeteer = mcpPackage.includes('puppeteer');

  // Create session on mount
  useEffect(() => {
    createSession();
    return () => {
      // Cleanup session on unmount
      if (session) {
        closeSession(session.session_id);
      }
    };
  }, []);

  const createSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/tools/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcp_package: mcpPackage }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create session');
      }

      const sessionData = await response.json();
      setSession(sessionData);

      // Fetch available tools for this session
      await fetchAvailableTools(sessionData.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTools = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/tools/sessions/${sessionId}/tools`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTools(data.tools || []);
        if (data.tools?.length > 0 && !selectedTool) {
          setSelectedTool(data.tools[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching available tools:', err);
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      await fetch(`/api/v1/tools/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error closing session:', err);
    }
  };

  const callTool = useCallback(async (toolName: string, params: Record<string, any>) => {
    if (!session) {return;}

    setExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/tools/sessions/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          tool_name: toolName,
          params,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Tool call failed');
      }

      const result: ToolCallResult = await response.json();
      setResults(prev => [...prev, result]);

      // Update session info
      const sessionResponse = await fetch(`/api/v1/tools/sessions/${session.session_id}`);
      if (sessionResponse.ok) {
        const updatedSession = await sessionResponse.json();
        setSession(updatedSession);
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tool call failed');
    } finally {
      setExecuting(false);
    }
  }, [session]);

  // Puppeteer-specific handlers
  const handleNavigate = () => {
    callTool('puppeteer_navigate', { url: navigateUrl });
  };

  const handleScreenshot = () => {
    callTool('puppeteer_screenshot', {
      name: screenshotName,
      encoded: screenshotEncoded
    });
  };

  const handleClick = () => {
    const selector = prompt('Enter CSS selector to click:');
    if (selector) {
      callTool('puppeteer_click', { selector });
    }
  };

  const handleFill = () => {
    const selector = prompt('Enter CSS selector for input field:');
    const value = prompt('Enter value to fill:');
    if (selector && value) {
      callTool('puppeteer_fill', { selector, value });
    }
  };

  // Generic tool call handler
  const handleGenericToolCall = () => {
    try {
      const params = JSON.parse(toolParams);
      callTool(selectedTool, params);
    } catch (err) {
      setError('Invalid JSON parameters');
    }
  };

  const handleEndSession = async () => {
    if (session) {
      await closeSession(session.session_id);
      setSession(null);
      setResults([]);
    }
    onClose();
  };

  // Render screenshot result
  const renderResultContent = (result: ToolCallResult) => {
    if (result.error_message) {
      return (
        <div style={{ ...styles.resultOutput, color: COLORS.danger }}>
          {result.error_message}
        </div>
      );
    }

    // Handle screenshot results with base64 image
    if (result.result?.data?.startsWith?.('Screenshot')) {
      return (
        <>
          <div style={styles.resultOutput}>
            {result.result.data.split('\n')[0]}
          </div>
          {result.result.data.includes('data:image') && (
            <img
              src={result.result.data.split('\n')[1]}
              alt="Screenshot"
              style={styles.screenshotPreview}
            />
          )}
        </>
      );
    }

    return (
      <div style={styles.resultOutput}>
        {typeof result.result === 'object'
          ? JSON.stringify(result.result, null, 2)
          : String(result.result)}
      </div>
    );
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    panel: {
      backgroundColor: COLORS.card,
      borderRadius: '16px',
      border: `1px solid ${COLORS.border}`,
      width: '100%',
      maxWidth: '900px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    header: {
      padding: '20px 24px',
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      color: COLORS.text,
    },
    sessionBadge: {
      padding: '6px 12px',
      borderRadius: '6px',
      backgroundColor: COLORS.success + '20',
      color: COLORS.success,
      fontSize: '12px',
      fontWeight: 600,
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: COLORS.textMuted,
      fontSize: '24px',
      cursor: 'pointer',
      padding: '4px 8px',
    },
    content: {
      padding: '24px',
      overflowY: 'auto' as const,
      flex: 1,
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '12px',
    },
    toolRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '12px',
      alignItems: 'flex-end',
    },
    inputGroup: {
      flex: 1,
    },
    label: {
      display: 'block',
      fontSize: '12px',
      color: COLORS.textMuted,
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: 'monospace',
      outline: 'none',
      boxSizing: 'border-box' as const,
      minHeight: '100px',
      resize: 'vertical' as const,
    },
    select: {
      padding: '10px 14px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      cursor: 'pointer',
    },
    button: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
    primaryButton: {
      backgroundColor: COLORS.accent,
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: COLORS.bgAlt,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
    },
    dangerButton: {
      backgroundColor: COLORS.danger,
      color: 'white',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
    },
    resultsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    resultItem: {
      backgroundColor: COLORS.bg,
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${COLORS.border}`,
    },
    resultHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    resultTool: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
    },
    resultStatus: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
    },
    resultOutput: {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: COLORS.textMuted,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
      maxHeight: '200px',
      overflowY: 'auto' as const,
    },
    screenshotPreview: {
      marginTop: '12px',
      maxWidth: '100%',
      borderRadius: '8px',
      border: `1px solid ${COLORS.border}`,
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: COLORS.textMuted,
    },
    errorMessage: {
      backgroundColor: COLORS.danger + '20',
      color: COLORS.danger,
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '16px',
    },
    footer: {
      padding: '16px 24px',
      borderTop: `1px solid ${COLORS.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionInfo: {
      fontSize: '12px',
      color: COLORS.textMuted,
    },
    mcpBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: COLORS.accent + '20',
      color: COLORS.accent,
      fontSize: '11px',
      fontWeight: 500,
      marginLeft: '8px',
    },
  };

  if (loading) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.panel} onClick={e => e.stopPropagation()}>
          <div style={styles.loadingContainer}>
            Creating session for {mcpPackage}...
          </div>
        </div>
      </div>
    );
  }

  const toolDisplayName = tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const panelTitle = isPuppeteer ? 'Puppeteer Session' : `${toolDisplayName} Session`;

  return (
    <div style={styles.overlay} onClick={handleEndSession}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={styles.title}>{panelTitle}</h2>
            {session && (
              <span style={styles.sessionBadge}>
                Session Active ({session.expires_in_seconds}s remaining)
              </span>
            )}
          </div>
          <button style={styles.closeButton} onClick={handleEndSession}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          {error && <div style={styles.errorMessage}>{error}</div>}

          {!session ? (
            <div style={styles.loadingContainer}>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={createSession}
              >
                Start New Session
              </button>
            </div>
          ) : (
            <>
              {/* Puppeteer-specific UI */}
              {isPuppeteer && (
                <>
                  {/* Navigation */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Navigate</div>
                    <div style={styles.toolRow}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>URL</label>
                        <input
                          type="text"
                          style={styles.input}
                          value={navigateUrl}
                          onChange={e => setNavigateUrl(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={handleNavigate}
                        disabled={executing}
                      >
                        Navigate
                      </button>
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Screenshot</div>
                    <div style={styles.toolRow}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Name</label>
                        <input
                          type="text"
                          style={styles.input}
                          value={screenshotName}
                          onChange={e => setScreenshotName(e.target.value)}
                          placeholder="screenshot"
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Format</label>
                        <select
                          style={styles.select}
                          value={screenshotEncoded ? 'base64' : 'file'}
                          onChange={e => setScreenshotEncoded(e.target.value === 'base64')}
                        >
                          <option value="base64">Base64</option>
                          <option value="file">File</option>
                        </select>
                      </div>
                      <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={handleScreenshot}
                        disabled={executing}
                      >
                        Take Screenshot
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Actions</div>
                    <div style={styles.actionButtons}>
                      <button
                        style={{ ...styles.button, ...styles.secondaryButton }}
                        onClick={handleClick}
                        disabled={executing}
                      >
                        Click Element
                      </button>
                      <button
                        style={{ ...styles.button, ...styles.secondaryButton }}
                        onClick={handleFill}
                        disabled={executing}
                      >
                        Fill Input
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Generic Tool Interface */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  {isPuppeteer ? 'Advanced: Call Any Tool' : 'Execute Tool'}
                  <span style={styles.mcpBadge}>{mcpPackage}</span>
                </div>
                <div style={styles.toolRow}>
                  <div style={{ minWidth: '200px' }}>
                    <label style={styles.label}>Tool Name</label>
                    <select
                      style={{ ...styles.select, width: '100%' }}
                      value={selectedTool}
                      onChange={e => setSelectedTool(e.target.value)}
                    >
                      {availableTools.length > 0 ? (
                        availableTools.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))
                      ) : (
                        <option value={tool.name}>{tool.name}</option>
                      )}
                    </select>
                  </div>
                </div>
                <div style={styles.toolRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Parameters (JSON)</label>
                    <textarea
                      style={styles.textarea}
                      value={toolParams}
                      onChange={e => setToolParams(e.target.value)}
                      placeholder='{"param": "value"}'
                    />
                  </div>
                </div>
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleGenericToolCall}
                  disabled={executing || !selectedTool}
                >
                  {executing ? 'Executing...' : 'Execute Tool'}
                </button>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Results ({results.length})</div>
                  <div style={styles.resultsList}>
                    {results.slice().toReversed().map((result, idx) => (
                      <div key={idx} style={styles.resultItem}>
                        <div style={styles.resultHeader}>
                          <span style={styles.resultTool}>{result.tool_name}</span>
                          <span style={{
                            ...styles.resultStatus,
                            backgroundColor: result.status === 'completed'
                              ? COLORS.success + '20'
                              : COLORS.danger + '20',
                            color: result.status === 'completed'
                              ? COLORS.success
                              : COLORS.danger,
                          }}>
                            {result.status} - {result.duration_ms}ms
                          </span>
                        </div>
                        {renderResultContent(result)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.sessionInfo}>
            {session && `Session: ${session.session_id.slice(0, 8)}...`}
          </div>
          <button
            style={{ ...styles.button, ...styles.dangerButton }}
            onClick={handleEndSession}
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExecutionPanel;
