import React, { useState, useEffect } from 'react';
import { COLORS } from '../../styles/colors';

interface AvailableServer {
  name: string;
  package: string;
  description: string;
  command: string;
  category: string;
  requires_env?: string[];
}

interface InstalledServer {
  id: string;
  name: string;
  package: string;
  command: string;
  args: string[];
  tools_count: number;
  installed_at: string;
}

interface MCPTool {
  name: string;
  description: string;
  input_schema: Record<string, any>;
}

interface InstallResult {
  success: boolean;
  server_id: string;
  server_name: string;
  package_name: string;
  status: string;
  tools_count: number;
  tools?: MCPTool[];
  tools_registered: number;
  error?: string;
  logs?: string;
}

interface MCPServerInstallerProps {
  onClose: () => void;
  onInstallComplete: () => void;
}

export const MCPServerInstaller: React.FC<MCPServerInstallerProps> = ({
  onClose,
  onInstallComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'available' | 'installed'>('install');
  const [inputMode, setInputMode] = useState<'command' | 'json'>('command');
  const [command, setCommand] = useState('');
  const [jsonConfig, setJsonConfig] = useState('{\n  "servers": {\n    "server-name": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-name"]\n    }\n  }\n}');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<InstallResult | null>(null);
  const [availableServers, setAvailableServers] = useState<AvailableServer[]>([]);
  const [installedServers, setInstalledServers] = useState<InstalledServer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [installLogs, setInstallLogs] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [serverTools, setServerTools] = useState<Record<string, MCPTool[]>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableServers();
    fetchInstalledServers();
  }, []);

  const fetchAvailableServers = async () => {
    try {
      const response = await fetch('/api/v1/mcp/available');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch available servers');
      }
      const data = await response.json();
      setAvailableServers(data.servers || []);
    } catch (err) {
      console.error('Failed to fetch available servers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch available servers');
    }
  };

  const fetchInstalledServers = async () => {
    try {
      const response = await fetch('/api/v1/mcp/installed');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch installed servers');
      }
      const data = await response.json();
      setInstalledServers(data || []);
    } catch (err) {
      console.error('Failed to fetch installed servers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch installed servers');
    }
  };

  const validateJsonConfig = (config: string): { valid: boolean; error?: string; parsed?: any } => {
    try {
      const parsed = JSON.parse(config);
      // Support both "servers" and "mcpServers" (Claude Desktop format)
      const servers = parsed.servers || parsed.mcpServers;
      if (!servers || typeof servers !== 'object') {
        return { valid: false, error: 'JSON must contain a "servers" or "mcpServers" object' };
      }
      const serverNames = Object.keys(servers);
      if (serverNames.length === 0) {
        return { valid: false, error: 'At least one server must be defined' };
      }
      for (const name of serverNames) {
        const server = servers[name];
        if (!server.command) {
          return { valid: false, error: `Server "${name}" must have a "command" field` };
        }
        if (!server.args || !Array.isArray(server.args)) {
          return { valid: false, error: `Server "${name}" must have an "args" array` };
        }
      }
      return { valid: true, parsed };
    } catch (e) {
      return { valid: false, error: `Invalid JSON: ${(e as Error).message}` };
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonConfig(value);
    const validation = validateJsonConfig(value);
    setJsonError(validation.valid ? null : validation.error || null);
  };

  const handleInstall = async () => {
    // Validate input based on mode
    if (inputMode === 'command') {
      if (!command.trim()) {
        setError('Please enter an NPX command');
        return;
      }
    } else {
      const validation = validateJsonConfig(jsonConfig);
      if (!validation.valid) {
        setError(validation.error || 'Invalid JSON configuration');
        return;
      }
    }

    setInstalling(true);
    setError(null);
    setInstallResult(null);
    setInstallLogs('Starting installation...\n');

    try {
      // Build request body based on input mode
      let requestBody: any = {
        env: envVars,
        auto_register_tools: true,
        timeout: 120,
      };

      if (inputMode === 'command') {
        requestBody.command = command.trim();
      } else {
        const parsed = JSON.parse(jsonConfig);
        // Support both "servers" and "mcpServers" (Claude Desktop format)
        if (parsed.servers) {
          requestBody.servers = parsed.servers;
        }
        if (parsed.mcpServers) {
          requestBody.mcpServers = parsed.mcpServers;
        }
      }

      const response = await fetch('/api/v1/mcp/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.error || 'Installation failed';
        const fullError = data.logs
          ? `${errorMessage}\n\nLogs:\n${data.logs}`
          : errorMessage;
        setInstallLogs(prev => prev + `\nError: ${errorMessage}\n`);
        throw new Error(fullError);
      }

      setInstallResult(data);
      if (data.logs) {
        setInstallLogs(prev => prev + data.logs + '\n');
      }
      setInstallLogs(prev => prev + 'Installation completed successfully!\n');

      if (data.success) {
        // Store tools for this server
        if (data.tools && data.tools.length > 0) {
          setServerTools(prev => ({
            ...prev,
            [data.server_name]: data.tools || []
          }));
        }
        await fetchInstalledServers();
        onInstallComplete();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Installation failed';
      setError(errorMessage);
      setInstallLogs(prev => prev + `\nFailed: ${errorMessage}\n`);
    } finally {
      setInstalling(false);
    }
  };

  const handleQuickInstall = (server: AvailableServer) => {
    setCommand(server.command);
    if (server.requires_env) {
      const newEnv: Record<string, string> = {};
      server.requires_env.forEach((key) => {
        newEnv[key] = '';
      });
      setEnvVars(newEnv);
    }
    setActiveTab('install');
  };

  const handleAddEnvVar = () => {
    if (newEnvKey.trim()) {
      setEnvVars({ ...envVars, [newEnvKey.trim()]: newEnvValue });
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const handleRemoveEnvVar = (key: string) => {
    const { [key]: _, ...rest } = envVars;
    setEnvVars(rest);
  };

  const handleUninstall = async (serverName: string) => {
    if (!confirm(`Are you sure you want to remove ${serverName}?`)) {return;}

    try {
      const response = await fetch(`/api/v1/mcp/installed/${serverName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to uninstall server');
      }

      // Remove from serverTools cache
      setServerTools(prev => {
        const updated = { ...prev };
        delete updated[serverName];
        return updated;
      });

      await fetchInstalledServers();
    } catch (err) {
      console.error('Failed to uninstall server:', err);
      setError(err instanceof Error ? err.message : 'Failed to uninstall server');
    }
  };

  const handleTestConnection = async (serverName: string) => {
    setTestingConnection(serverName);
    setError(null);

    try {
      // Call the install endpoint with test mode (if API supports it)
      // Or use a dedicated test endpoint if available
      const response = await fetch(`/api/v1/mcp/test/${serverName}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Connection test failed');
      }

      const data = await response.json();
      alert(`Connection test successful!\nServer: ${serverName}\nStatus: ${data.status || 'OK'}`);
    } catch (err) {
      // If test endpoint doesn't exist, show a simple message
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      if (errorMessage.includes('404')) {
        alert(`Server ${serverName} is installed. Test endpoint not available.`);
      } else {
        setError(errorMessage);
        alert(`Connection test failed: ${errorMessage}`);
      }
    } finally {
      setTestingConnection(null);
    }
  };

  const toggleServerExpansion = (serverId: string) => {
    setExpandedServer(expandedServer === serverId ? null : serverId);
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
    },
    modal: {
      backgroundColor: COLORS.card,
      borderRadius: '16px',
      border: `1px solid ${COLORS.border}`,
      width: '90%',
      maxWidth: '700px',
      maxHeight: '85vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      padding: '24px',
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '20px',
      fontWeight: 600,
      color: COLORS.text,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: COLORS.textMuted,
      fontSize: '24px',
      cursor: 'pointer',
      padding: '4px',
    },
    tabs: {
      display: 'flex',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    tab: {
      flex: 1,
      padding: '14px 20px',
      fontSize: '14px',
      fontWeight: 500,
      color: COLORS.textMuted,
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    tabActive: {
      color: COLORS.accent,
      borderBottomColor: COLORS.accent,
    },
    content: {
      padding: '24px',
      overflowY: 'auto' as const,
      flex: 1,
    },
    inputGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 500,
      color: COLORS.textMuted,
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: 'monospace',
      outline: 'none',
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: 'monospace',
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: '80px',
    },
    envVarRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '8px',
      alignItems: 'center',
    },
    envVarInput: {
      flex: 1,
      padding: '10px 12px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      color: COLORS.text,
      fontSize: '13px',
      fontFamily: 'monospace',
      outline: 'none',
    },
    addButton: {
      padding: '10px 16px',
      backgroundColor: COLORS.accent,
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
    },
    removeButton: {
      padding: '8px 12px',
      backgroundColor: `${COLORS.danger}20`,
      color: COLORS.danger,
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    installButton: {
      width: '100%',
      padding: '14px 24px',
      backgroundColor: COLORS.accent,
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '8px',
    },
    serverCard: {
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    serverName: {
      fontSize: '15px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '4px',
    },
    serverPackage: {
      fontSize: '12px',
      color: COLORS.accent,
      fontFamily: 'monospace',
      marginBottom: '8px',
    },
    serverDescription: {
      fontSize: '13px',
      color: COLORS.textMuted,
      lineHeight: 1.5,
    },
    serverMeta: {
      display: 'flex',
      gap: '12px',
      marginTop: '12px',
      alignItems: 'center',
    },
    badge: {
      padding: '4px 10px',
      backgroundColor: `${COLORS.accent}20`,
      color: COLORS.accent,
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
    },
    resultContainer: {
      padding: '16px',
      borderRadius: '10px',
      marginTop: '16px',
    },
    resultSuccess: {
      backgroundColor: `${COLORS.success}15`,
      border: `1px solid ${COLORS.success}40`,
    },
    resultError: {
      backgroundColor: `${COLORS.danger}15`,
      border: `1px solid ${COLORS.danger}40`,
    },
    resultTitle: {
      fontSize: '15px',
      fontWeight: 600,
      marginBottom: '8px',
    },
    resultText: {
      fontSize: '13px',
      color: COLORS.textMuted,
    },
    spinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid white',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '8px',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: COLORS.textMuted,
    },
    logsContainer: {
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      padding: '12px',
      marginTop: '12px',
      maxHeight: '200px',
      overflowY: 'auto' as const,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: COLORS.textMuted,
      whiteSpace: 'pre-wrap' as const,
    },
    progressBar: {
      width: '100%',
      height: '4px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '12px',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: COLORS.accent,
      animation: 'progress 1.5s ease-in-out infinite',
    },
    toolsList: {
      marginTop: '12px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      padding: '12px',
      maxHeight: '300px',
      overflowY: 'auto' as const,
    },
    toolItem: {
      padding: '10px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      marginBottom: '8px',
    },
    toolName: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.accent,
      fontFamily: 'monospace',
      marginBottom: '4px',
    },
    toolDescription: {
      fontSize: '12px',
      color: COLORS.textMuted,
      lineHeight: 1.4,
    },
    actionButton: {
      padding: '8px 14px',
      backgroundColor: `${COLORS.accent}20`,
      color: COLORS.accent,
      border: `1px solid ${COLORS.accent}40`,
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      marginRight: '8px',
      transition: 'all 0.2s ease',
    },
    expandButton: {
      padding: '6px 12px',
      backgroundColor: 'transparent',
      color: COLORS.textMuted,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    modeToggle: {
      display: 'flex',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '8px',
      padding: '4px',
      marginBottom: '16px',
    },
    modeButton: {
      flex: 1,
      padding: '10px 16px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      color: COLORS.textMuted,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    modeButtonActive: {
      backgroundColor: COLORS.accent,
      color: 'white',
    },
    jsonValidation: {
      fontSize: '12px',
      marginTop: '6px',
      padding: '8px 12px',
      borderRadius: '6px',
    },
    jsonValid: {
      color: COLORS.success,
      backgroundColor: `${COLORS.success}15`,
    },
    jsonInvalid: {
      color: COLORS.danger,
      backgroundColor: `${COLORS.danger}15`,
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}
        </style>

        <div style={styles.header}>
          <h2 style={styles.title}>Install MCP Server</h2>
          <button style={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'install' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('install')}
          >
            Install
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'available' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('available')}
          >
            Available Servers
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'installed' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('installed')}
          >
            Installed ({installedServers.length})
          </button>
        </div>

        <div style={styles.content}>
          {activeTab === 'install' && (
            <>
              {/* Mode Toggle */}
              <div style={styles.modeToggle}>
                <button
                  style={{
                    ...styles.modeButton,
                    ...(inputMode === 'command' ? styles.modeButtonActive : {}),
                  }}
                  onClick={() => setInputMode('command')}
                >
                  NPX Command
                </button>
                <button
                  style={{
                    ...styles.modeButton,
                    ...(inputMode === 'json' ? styles.modeButtonActive : {}),
                  }}
                  onClick={() => setInputMode('json')}
                >
                  JSON Config
                </button>
              </div>

              {/* NPX Command Input */}
              {inputMode === 'command' && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>NPX Command</label>
                  <textarea
                    style={styles.textarea}
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="npx -y @modelcontextprotocol/server-filesystem /path/to/dir"
                  />
                  <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '8px' }}>
                    Enter the NPX command to install an MCP server. Examples:
                    <br />
                    <code style={{ color: COLORS.accent }}>
                      npx -y @modelcontextprotocol/server-filesystem /home/user
                    </code>
                    <br />
                    <code style={{ color: COLORS.accent }}>
                      npx -y @modelcontextprotocol/server-memory
                    </code>
                  </p>
                </div>
              )}

              {/* JSON Config Input */}
              {inputMode === 'json' && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>JSON Configuration</label>
                  <textarea
                    style={{ ...styles.textarea, minHeight: '180px' }}
                    value={jsonConfig}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder='{"servers": {"name": {"command": "npx", "args": ["-y", "@package/name"]}}}'
                  />
                  {jsonError ? (
                    <div style={{ ...styles.jsonValidation, ...styles.jsonInvalid }}>
                      ✗ {jsonError}
                    </div>
                  ) : jsonConfig.trim() && (
                    <div style={{ ...styles.jsonValidation, ...styles.jsonValid }}>
                      ✓ Valid JSON configuration
                    </div>
                  )}
                  <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '8px' }}>
                    Standard MCP server configuration format. Example:
                    <br />
                    <code style={{ color: COLORS.accent, display: 'block', marginTop: '4px', whiteSpace: 'pre' }}>
{`{
  "servers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"]
    }
  }
}`}
                    </code>
                  </p>
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Environment Variables (Optional)</label>
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} style={styles.envVarRow}>
                    <input
                      style={styles.envVarInput}
                      value={key}
                      disabled
                      placeholder="KEY"
                    />
                    <input
                      style={{ ...styles.envVarInput, flex: 2 }}
                      value={value}
                      onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })}
                      placeholder="value"
                      type={key.includes('KEY') || key.includes('TOKEN') ? 'password' : 'text'}
                    />
                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemoveEnvVar(key)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div style={styles.envVarRow}>
                  <input
                    style={styles.envVarInput}
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    placeholder="KEY"
                  />
                  <input
                    style={{ ...styles.envVarInput, flex: 2 }}
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    placeholder="value"
                  />
                  <button style={styles.addButton} onClick={handleAddEnvVar}>
                    Add
                  </button>
                </div>
              </div>

              {installing && (
                <>
                  <div style={styles.progressBar}>
                    <div style={styles.progressBarFill} />
                  </div>
                  {installLogs && (
                    <div style={styles.logsContainer}>
                      {installLogs}
                    </div>
                  )}
                </>
              )}

              {error && !installing && (
                <div style={{ ...styles.resultContainer, ...styles.resultError }}>
                  <div style={{ ...styles.resultTitle, color: COLORS.danger }}>
                    Installation Failed
                  </div>
                  <div style={styles.resultText}>{error}</div>
                </div>
              )}

              {installResult && !installing && (
                <div
                  style={{
                    ...styles.resultContainer,
                    ...(installResult.success ? styles.resultSuccess : styles.resultError),
                  }}
                >
                  <div
                    style={{
                      ...styles.resultTitle,
                      color: installResult.success ? COLORS.success : COLORS.danger,
                    }}
                  >
                    {installResult.success ? 'Installation Complete' : 'Installation Failed'}
                  </div>
                  <div style={styles.resultText}>
                    {installResult.success ? (
                      <>
                        <strong>{installResult.server_name}</strong> installed successfully.
                        <br />
                        {installResult.tools_count} tools extracted, {installResult.tools_registered}{' '}
                        registered.
                      </>
                    ) : (
                      installResult.error
                    )}
                  </div>

                  {installResult.success && installResult.tools && installResult.tools.length > 0 && (
                    <div style={styles.toolsList}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text, marginBottom: '10px' }}>
                        Extracted Tools ({installResult.tools.length}):
                      </div>
                      {installResult.tools.map((tool, idx) => (
                        <div key={idx} style={styles.toolItem}>
                          <div style={styles.toolName}>{tool.name}</div>
                          <div style={styles.toolDescription}>{tool.description || 'No description'}</div>
                          {tool.input_schema && Object.keys(tool.input_schema).length > 0 && (
                            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>
                              Parameters: {Object.keys(tool.input_schema.properties || {}).join(', ') || 'none'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                style={{
                  ...styles.installButton,
                  opacity: installing ? 0.7 : 1,
                  cursor: installing ? 'not-allowed' : 'pointer',
                }}
                onClick={handleInstall}
                disabled={installing}
              >
                {installing && <span style={styles.spinner} />}
                {installing ? 'Installing...' : 'Install & Extract Tools'}
              </button>
            </>
          )}

          {activeTab === 'available' && (
            <>
              {availableServers.map((server) => (
                <div
                  key={server.name}
                  style={styles.serverCard}
                  onClick={() => handleQuickInstall(server)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = COLORS.accent;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                  }}
                >
                  <div style={styles.serverName}>{server.name}</div>
                  <div style={styles.serverPackage}>{server.package}</div>
                  <div style={styles.serverDescription}>{server.description}</div>
                  <div style={styles.serverMeta}>
                    <span style={styles.badge}>{server.category}</span>
                    {server.requires_env && (
                      <span style={{ fontSize: '11px', color: COLORS.warning }}>
                        Requires: {server.requires_env.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'installed' && (
            <>
              {installedServers.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>+</div>
                  <div>No MCP servers installed yet</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>
                    Install a server to get started
                  </div>
                </div>
              ) : (
                installedServers.map((server) => (
                  <div key={server.id} style={styles.serverCard}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={styles.serverName}>{server.name}</div>
                        <div style={styles.serverPackage}>{server.package}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={{
                            ...styles.actionButton,
                            opacity: testingConnection === server.name ? 0.6 : 1,
                          }}
                          onClick={() => handleTestConnection(server.name)}
                          disabled={testingConnection === server.name}
                        >
                          {testingConnection === server.name ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          style={styles.removeButton}
                          onClick={() => handleUninstall(server.name)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={styles.serverMeta}>
                      <span style={styles.badge}>{server.tools_count} tools</span>
                      <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
                        Installed {new Date(server.installed_at).toLocaleDateString()}
                      </span>
                      {server.tools_count > 0 && (
                        <button
                          style={styles.expandButton}
                          onClick={() => toggleServerExpansion(server.id)}
                        >
                          {expandedServer === server.id ? 'Hide Tools' : 'View Tools'}
                        </button>
                      )}
                    </div>

                    {expandedServer === server.id && serverTools[server.name] && (
                      <div style={styles.toolsList}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text, marginBottom: '10px' }}>
                          Available Tools:
                        </div>
                        {serverTools[server.name].map((tool, idx) => (
                          <div key={idx} style={styles.toolItem}>
                            <div style={styles.toolName}>{tool.name}</div>
                            <div style={styles.toolDescription}>{tool.description || 'No description'}</div>
                            {tool.input_schema && Object.keys(tool.input_schema).length > 0 && (
                              <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>
                                Parameters: {Object.keys(tool.input_schema.properties || {}).join(', ') || 'none'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {expandedServer === server.id && !serverTools[server.name] && (
                      <div style={{ ...styles.logsContainer, marginTop: '12px', textAlign: 'center' as const }}>
                        Tool details not available. They were registered during installation.
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCPServerInstaller;
