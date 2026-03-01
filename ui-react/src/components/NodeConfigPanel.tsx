import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { COLORS } from '../styles/colors';
import { ChevronDown, ChevronRight, Info, Database, Key, ExternalLink } from 'lucide-react';

interface Credential {
  id: string;
  name: string;
  credential_type: string;
  project_id: string | null;
  is_valid: boolean | null;
}

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (data: any) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  projectId?: string | null;
}

export function NodeConfigPanel({ node, onUpdate, onClose, onDelete, projectId }: NodeConfigPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'config']));
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  // Load credentials when component mounts or project changes
  useEffect(() => {
    loadCredentials();
  }, [projectId]);

  const loadCredentials = async () => {
    setIsLoadingCredentials(true);
    try {
      const params = new URLSearchParams();
      if (projectId) {params.append('project_id', projectId);}
      params.append('include_global', 'true');

      const response = await fetch(`/api/v1/credentials?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || []);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  // Get credentials filtered by type for the current database
  const getCredentialsForDbType = (dbType: string) => {
    const typeMapping: Record<string, string[]> = {
      postgresql: ['postgresql'],
      mysql: ['mysql'],
      mariadb: ['mysql', 'mariadb'],
      mongodb: ['mongodb'],
      redis: ['redis'],
      mssql: ['mssql'],
      pinecone: ['pinecone', 'api_key'],
      chromadb: ['chromadb', 'api_key'],
      qdrant: ['qdrant', 'api_key'],
      weaviate: ['weaviate', 'api_key'],
    };
    const allowedTypes = typeMapping[dbType] || [dbType];
    return credentials.filter(c => allowedTypes.includes(c.credential_type));
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: COLORS.sidebar,
      color: COLORS.text,
    },
    header: {
      padding: '16px',
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '16px',
      fontWeight: 600,
      margin: 0,
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      color: COLORS.textMuted,
      cursor: 'pointer',
      fontSize: '20px',
      padding: '4px',
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: '16px',
    },
    field: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 500,
      color: COLORS.textMuted,
      marginBottom: '6px',
      textTransform: 'uppercase' as const,
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      color: COLORS.text,
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      color: COLORS.text,
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box' as const,
      cursor: 'pointer',
      appearance: 'auto' as const,
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '6px',
      color: COLORS.text,
      fontSize: '14px',
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical' as const,
      fontFamily: 'monospace',
      boxSizing: 'border-box' as const,
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 600,
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    nodeId: {
      fontSize: '12px',
      color: COLORS.textDim,
      fontFamily: 'monospace',
      backgroundColor: COLORS.bg,
      padding: '4px 8px',
      borderRadius: '4px',
    },
    deleteBtn: {
      width: '100%',
      padding: '12px',
      backgroundColor: COLORS.danger,
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      marginTop: '16px',
    },
    collapsibleHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      backgroundColor: COLORS.bgHover,
      borderRadius: '6px',
      cursor: 'pointer',
      marginBottom: '8px',
    },
    collapsibleTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 500,
      fontSize: '13px',
    },
    slider: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      backgroundColor: COLORS.bg,
      appearance: 'none' as const,
      cursor: 'pointer',
    },
    sliderValue: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '11px',
      color: COLORS.textDim,
      marginTop: '4px',
    },
    infoBox: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '10px 12px',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderRadius: '6px',
      marginBottom: '12px',
      border: `1px solid rgba(59, 130, 246, 0.2)`,
    },
    infoText: {
      fontSize: '12px',
      color: COLORS.textMuted,
      lineHeight: 1.4,
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      backgroundColor: COLORS.bg,
      borderRadius: '6px',
      cursor: 'pointer',
    },
  };

  const renderAgentConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Agent Type</label>
        <select
          style={styles.select}
          value={node.data.agentType || 'developer'}
          onChange={(e) => onUpdate({ agentType: e.target.value })}
        >
          <option value="developer">Developer</option>
          <option value="architect">Architect</option>
          <option value="qa">QA Engineer</option>
          <option value="business_analyst">Business Analyst</option>
          <option value="devops">DevOps</option>
          <option value="uiux">UI/UX Designer</option>
          <option value="security">Security</option>
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Model</label>
        <select
          style={styles.select}
          value={node.data.model || 'claude-sonnet-4-20250514'}
          onChange={(e) => onUpdate({ model: e.target.value })}
        >
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
          <option value="claude-opus-4-20250514">Claude Opus 4</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>System Prompt</label>
        <textarea
          style={styles.textarea}
          value={node.data.systemPrompt || ''}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
          placeholder="Optional custom system prompt..."
        />
      </div>
    </>
  );

  const renderTriggerConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Trigger Type</label>
        <select
          style={styles.select}
          value={node.data.triggerType || 'manual'}
          onChange={(e) => onUpdate({ triggerType: e.target.value })}
        >
          <option value="manual">Manual</option>
          <option value="webhook">Webhook</option>
          <option value="schedule">Schedule</option>
          <option value="event">Event</option>
        </select>
      </div>
      {node.data.triggerType === 'schedule' && (
        <div style={styles.field}>
          <label style={styles.label}>Cron Expression</label>
          <input
            style={styles.input}
            type="text"
            value={node.data.schedule || ''}
            onChange={(e) => onUpdate({ schedule: e.target.value })}
            placeholder="0 * * * *"
          />
        </div>
      )}
      {node.data.triggerType === 'webhook' && (
        <div style={styles.field}>
          <label style={styles.label}>Webhook Path</label>
          <input
            style={styles.input}
            type="text"
            value={node.data.webhookPath || ''}
            onChange={(e) => onUpdate({ webhookPath: e.target.value })}
            placeholder="/webhook/my-trigger"
          />
        </div>
      )}
    </>
  );

  const renderDatabaseConfig = () => {
    const dbType = node.data.database || 'postgresql';
    const defaultPorts: Record<string, number> = {
      postgresql: 5432,
      mysql: 3306,
      mariadb: 3306,
      mssql: 1433,
      mongodb: 27017,
      redis: 6379,
      chromadb: 8000,
      sqlite: 0,
    };

    return (
      <>
        {/* Database Type */}
        <div style={styles.field}>
          <label style={styles.label}>Database Type</label>
          <select
            style={styles.select}
            value={dbType}
            onChange={(e) => onUpdate({
              database: e.target.value,
              port: defaultPorts[e.target.value] || 5432
            })}
          >
            <optgroup label="SQL Databases">
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mariadb">MariaDB</option>
              <option value="mssql">Microsoft SQL Server</option>
              <option value="sqlite">SQLite</option>
            </optgroup>
            <optgroup label="NoSQL Databases">
              <option value="mongodb">MongoDB</option>
              <option value="redis">Redis</option>
            </optgroup>
            <optgroup label="Vector Databases">
              <option value="chromadb">ChromaDB</option>
              <option value="pinecone">Pinecone</option>
              <option value="qdrant">Qdrant</option>
              <option value="weaviate">Weaviate</option>
            </optgroup>
          </select>
        </div>

        {/* Connection Method */}
        <div style={styles.field}>
          <label style={styles.label}>Connection Method</label>
          <select
            style={styles.select}
            value={node.data.connectionMethod || 'credentials'}
            onChange={(e) => {
              console.log('[DB Config] Connection method changed to:', e.target.value);
              onUpdate({ connectionMethod: e.target.value, credentialId: undefined });
            }}
          >
            <option value="credentials">Individual Fields</option>
            <option value="savedCredential">Use Saved Credential</option>
            <option value="connectionString">Connection String</option>
            <option value="environment">Environment Variable</option>
          </select>
        </div>

        {/* Saved Credential Selector */}
        {node.data.connectionMethod === 'savedCredential' && (
          <div style={styles.field}>
            <label style={styles.label}>Select Credential</label>
            {isLoadingCredentials ? (
              <div style={{ padding: '10px', color: COLORS.textMuted, fontSize: '13px' }}>Loading credentials...</div>
            ) : (
              <>
                <select
                  style={styles.select}
                  value={node.data.credentialId || ''}
                  onChange={(e) => onUpdate({ credentialId: e.target.value || undefined })}
                >
                  <option value="">-- Select a credential --</option>
                  {getCredentialsForDbType(dbType).length > 0 ? (
                    getCredentialsForDbType(dbType).map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.name} {cred.project_id ? '' : '(Global)'} {cred.is_valid ? '✓' : ! cred.is_valid ? '✗' : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>No {dbType} credentials found</option>
                  )}
                </select>
                {node.data.credentialId && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#22c55e'
                  }}>
                    <Key size={14} />
                    Credential linked: {credentials.find(c => c.id === node.data.credentialId)?.name}
                  </div>
                )}
                {getCredentialsForDbType(dbType).length === 0 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: COLORS.textMuted
                  }}>
                    <Info size={12} style={{ marginRight: '6px', display: 'inline' }} />
                    No {dbType} credentials saved. Create one in the Credentials panel.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Connection String */}
        {node.data.connectionMethod === 'connectionString' && (
          <div style={styles.field}>
            <label style={styles.label}>Connection String</label>
            <input
              style={styles.input}
              type="password"
              value={node.data.connectionString || ''}
              onChange={(e) => onUpdate({ connectionString: e.target.value })}
              placeholder={dbType === 'postgresql'
                ? 'postgresql://user:pass@host:5432/dbname'
                : dbType === 'mongodb'
                ? 'mongodb://user:pass@host:27017/dbname'
                : 'Enter connection string...'
              }
            />
          </div>
        )}

        {/* Environment Variable */}
        {node.data.connectionMethod === 'environment' && (
          <div style={styles.field}>
            <label style={styles.label}>Environment Variable Name</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.envVariable || ''}
              onChange={(e) => onUpdate({ envVariable: e.target.value })}
              placeholder={dbType === 'postgresql' ? 'DATABASE_URL' : `${dbType.toUpperCase()}_URL`}
            />
          </div>
        )}

        {/* Individual Credentials */}
        {node.data.connectionMethod !== 'connectionString' && node.data.connectionMethod !== 'environment' && node.data.connectionMethod !== 'savedCredential' && (
          <>
            {/* SQLite File Path */}
            {dbType === 'sqlite' && (
              <div style={styles.field}>
                <label style={styles.label}>Database File Path</label>
                <input
                  style={styles.input}
                  type="text"
                  value={node.data.filePath || ''}
                  onChange={(e) => onUpdate({ filePath: e.target.value })}
                  placeholder="/path/to/database.sqlite"
                />
              </div>
            )}

            {/* Host/Port for network databases */}
            {dbType !== 'sqlite' && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Host</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={node.data.host || ''}
                    onChange={(e) => onUpdate({ host: e.target.value })}
                    placeholder={dbType === 'redis' ? '192.168.1.122' : 'localhost'}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Port</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={node.data.port || defaultPorts[dbType] || 5432}
                    onChange={(e) => onUpdate({ port: parseInt(e.target.value) })}
                  />
                </div>
              </>
            )}

            {/* Database Name (not for Redis/SQLite) */}
            {!['redis', 'sqlite'].includes(dbType) && (
              <div style={styles.field}>
                <label style={styles.label}>
                  {dbType === 'mongodb' ? 'Database' : 'Database Name'}
                </label>
                <input
                  style={styles.input}
                  type="text"
                  value={node.data.dbName || ''}
                  onChange={(e) => onUpdate({ dbName: e.target.value })}
                  placeholder={dbType === 'postgresql' ? 'pronetheia' : 'mydb'}
                />
              </div>
            )}

            {/* Username (not for SQLite/Redis without auth) */}
            {!['sqlite'].includes(dbType) && (
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  style={styles.input}
                  type="text"
                  value={node.data.username || ''}
                  onChange={(e) => onUpdate({ username: e.target.value })}
                  placeholder={dbType === 'redis' ? '(optional)' : 'postgres'}
                />
              </div>
            )}

            {/* Password */}
            {!['sqlite'].includes(dbType) && (
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  value={node.data.password || ''}
                  onChange={(e) => onUpdate({ password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* PostgreSQL-specific: Schema */}
            {dbType === 'postgresql' && (
              <div style={styles.field}>
                <label style={styles.label}>Schema</label>
                <input
                  style={styles.input}
                  type="text"
                  value={node.data.schema || 'public'}
                  onChange={(e) => onUpdate({ schema: e.target.value })}
                  placeholder="public"
                />
              </div>
            )}

            {/* MongoDB-specific: Auth Database */}
            {dbType === 'mongodb' && (
              <div style={styles.field}>
                <label style={styles.label}>Auth Database</label>
                <input
                  style={styles.input}
                  type="text"
                  value={node.data.authDatabase || 'admin'}
                  onChange={(e) => onUpdate({ authDatabase: e.target.value })}
                  placeholder="admin"
                />
              </div>
            )}

            {/* Redis-specific: Database Number */}
            {dbType === 'redis' && (
              <div style={styles.field}>
                <label style={styles.label}>Database Number</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  max="15"
                  value={node.data.redisDb || 0}
                  onChange={(e) => onUpdate({ redisDb: parseInt(e.target.value) })}
                />
              </div>
            )}

            {/* Vector DB-specific: API Key */}
            {['pinecone', 'qdrant', 'weaviate'].includes(dbType) && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>API Key</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={node.data.apiKey || ''}
                    onChange={(e) => onUpdate({ apiKey: e.target.value })}
                    placeholder="Your API key"
                  />
                </div>
                {dbType === 'pinecone' && (
                  <div style={styles.field}>
                    <label style={styles.label}>Environment</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={node.data.environment || ''}
                      onChange={(e) => onUpdate({ environment: e.target.value })}
                      placeholder="us-east-1-aws"
                    />
                  </div>
                )}
                <div style={styles.field}>
                  <label style={styles.label}>Index / Collection Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={node.data.indexName || ''}
                    onChange={(e) => onUpdate({ indexName: e.target.value })}
                    placeholder="my-index"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* SSL Options (for SQL databases) */}
        {['postgresql', 'mysql', 'mariadb', 'mssql', 'mongodb'].includes(dbType) && (
          <div>
            <div
              style={styles.collapsibleHeader}
              onClick={() => toggleSection('ssl')}
            >
              <span style={styles.collapsibleTitle}>
                {expandedSections.has('ssl') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                SSL / TLS Options
              </span>
            </div>
            {expandedSections.has('ssl') && (
              <div style={{ paddingLeft: '12px' }}>
                <div style={styles.field}>
                  <label style={styles.label}>SSL Mode</label>
                  <select
                    style={styles.select}
                    value={node.data.sslMode || 'prefer'}
                    onChange={(e) => onUpdate({ sslMode: e.target.value })}
                  >
                    <option value="disable">Disable</option>
                    <option value="allow">Allow</option>
                    <option value="prefer">Prefer</option>
                    <option value="require">Require</option>
                    <option value="verify-ca">Verify CA</option>
                    <option value="verify-full">Verify Full</option>
                  </select>
                </div>
                {['verify-ca', 'verify-full'].includes(node.data.sslMode || '') && (
                  <>
                    <div style={styles.field}>
                      <label style={styles.label}>CA Certificate</label>
                      <textarea
                        style={{ ...styles.textarea, fontFamily: 'monospace', fontSize: '11px' }}
                        value={node.data.sslCa || ''}
                        onChange={(e) => onUpdate({ sslCa: e.target.value })}
                        placeholder="-----BEGIN CERTIFICATE-----"
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Client Certificate</label>
                      <textarea
                        style={{ ...styles.textarea, fontFamily: 'monospace', fontSize: '11px' }}
                        value={node.data.sslCert || ''}
                        onChange={(e) => onUpdate({ sslCert: e.target.value })}
                        placeholder="-----BEGIN CERTIFICATE-----"
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Client Key</label>
                      <textarea
                        style={{ ...styles.textarea, fontFamily: 'monospace', fontSize: '11px' }}
                        value={node.data.sslKey || ''}
                        onChange={(e) => onUpdate({ sslKey: e.target.value })}
                        placeholder="-----BEGIN RSA PRIVATE KEY-----"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Operation */}
        <div style={styles.field}>
          <label style={styles.label}>Operation</label>
          <select
            style={styles.select}
            value={node.data.operation || 'query'}
            onChange={(e) => onUpdate({ operation: e.target.value })}
          >
            {/* SQL Operations */}
            {['postgresql', 'mysql', 'mariadb', 'mssql', 'sqlite'].includes(dbType) && (
              <>
                <option value="query">Execute Query</option>
                <option value="insert">Insert</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="upsert">Upsert</option>
              </>
            )}
            {/* MongoDB Operations */}
            {dbType === 'mongodb' && (
              <>
                <option value="find">Find</option>
                <option value="findOne">Find One</option>
                <option value="insertOne">Insert One</option>
                <option value="insertMany">Insert Many</option>
                <option value="updateOne">Update One</option>
                <option value="updateMany">Update Many</option>
                <option value="deleteOne">Delete One</option>
                <option value="deleteMany">Delete Many</option>
                <option value="aggregate">Aggregate</option>
              </>
            )}
            {/* Redis Operations */}
            {dbType === 'redis' && (
              <>
                <option value="get">GET</option>
                <option value="set">SET</option>
                <option value="del">DEL</option>
                <option value="hget">HGET</option>
                <option value="hset">HSET</option>
                <option value="hgetall">HGETALL</option>
                <option value="lpush">LPUSH</option>
                <option value="rpush">RPUSH</option>
                <option value="lpop">LPOP</option>
                <option value="rpop">RPOP</option>
                <option value="lrange">LRANGE</option>
                <option value="publish">PUBLISH</option>
                <option value="subscribe">SUBSCRIBE</option>
              </>
            )}
            {/* Vector DB Operations */}
            {['chromadb', 'pinecone', 'qdrant', 'weaviate'].includes(dbType) && (
              <>
                <option value="query">Query (Similarity Search)</option>
                <option value="insert">Insert Vectors</option>
                <option value="update">Update Vectors</option>
                <option value="delete">Delete Vectors</option>
                <option value="upsert">Upsert Vectors</option>
              </>
            )}
          </select>
        </div>

        {/* Collection/Table Name for MongoDB */}
        {dbType === 'mongodb' && (
          <div style={styles.field}>
            <label style={styles.label}>Collection</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.collection || ''}
              onChange={(e) => onUpdate({ collection: e.target.value })}
              placeholder="users"
            />
          </div>
        )}

        {/* Table Name for SQL */}
        {['postgresql', 'mysql', 'mariadb', 'mssql', 'sqlite'].includes(dbType) &&
         ['insert', 'update', 'delete', 'upsert'].includes(node.data.operation || '') && (
          <div style={styles.field}>
            <label style={styles.label}>Table</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.table || ''}
              onChange={(e) => onUpdate({ table: e.target.value })}
              placeholder="users"
            />
          </div>
        )}

        {/* Key for Redis GET/SET */}
        {dbType === 'redis' && ['get', 'set', 'del'].includes(node.data.operation || '') && (
          <div style={styles.field}>
            <label style={styles.label}>Key</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.redisKey || ''}
              onChange={(e) => onUpdate({ redisKey: e.target.value })}
              placeholder="my:key:name"
            />
          </div>
        )}

        {/* Value for Redis SET */}
        {dbType === 'redis' && node.data.operation === 'set' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Value</label>
              <textarea
                style={styles.textarea}
                value={node.data.redisValue || ''}
                onChange={(e) => onUpdate({ redisValue: e.target.value })}
                placeholder="{{$json.data}} or static value"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>TTL (seconds, 0 = no expiry)</label>
              <input
                style={styles.input}
                type="number"
                min="0"
                value={node.data.redisTtl || 0}
                onChange={(e) => onUpdate({ redisTtl: parseInt(e.target.value) })}
              />
            </div>
          </>
        )}

        {/* Query / Command for SQL */}
        {['postgresql', 'mysql', 'mariadb', 'mssql', 'sqlite'].includes(dbType) &&
         (node.data.operation === 'query' || !node.data.operation) && (
          <div style={styles.field}>
            <label style={styles.label}>SQL Query</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '100px', fontFamily: 'monospace', fontSize: '12px' }}
              value={node.data.query || ''}
              onChange={(e) => onUpdate({ query: e.target.value })}
              placeholder="SELECT * FROM users WHERE id = $1"
            />
          </div>
        )}

        {/* Query Document for MongoDB */}
        {dbType === 'mongodb' && ['find', 'findOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(node.data.operation || '') && (
          <div style={styles.field}>
            <label style={styles.label}>Query Filter (JSON)</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '80px', fontFamily: 'monospace', fontSize: '12px' }}
              value={node.data.mongoQuery || ''}
              onChange={(e) => onUpdate({ mongoQuery: e.target.value })}
              placeholder='{"status": "active"}'
            />
          </div>
        )}

        {/* Update Document for MongoDB */}
        {dbType === 'mongodb' && ['updateOne', 'updateMany'].includes(node.data.operation || '') && (
          <div style={styles.field}>
            <label style={styles.label}>Update Document (JSON)</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '80px', fontFamily: 'monospace', fontSize: '12px' }}
              value={node.data.mongoUpdate || ''}
              onChange={(e) => onUpdate({ mongoUpdate: e.target.value })}
              placeholder='{"$set": {"status": "inactive"}}'
            />
          </div>
        )}

        {/* Insert Document for MongoDB */}
        {dbType === 'mongodb' && ['insertOne', 'insertMany'].includes(node.data.operation || '') && (
          <div style={styles.field}>
            <label style={styles.label}>
              {node.data.operation === 'insertMany' ? 'Documents (JSON Array)' : 'Document (JSON)'}
            </label>
            <textarea
              style={{ ...styles.textarea, minHeight: '100px', fontFamily: 'monospace', fontSize: '12px' }}
              value={node.data.mongoDocument || ''}
              onChange={(e) => onUpdate({ mongoDocument: e.target.value })}
              placeholder={node.data.operation === 'insertMany'
                ? '[{"name": "John"}, {"name": "Jane"}]'
                : '{"name": "John", "email": "john@example.com"}'
              }
            />
          </div>
        )}

        {/* Aggregation Pipeline for MongoDB */}
        {dbType === 'mongodb' && node.data.operation === 'aggregate' && (
          <div style={styles.field}>
            <label style={styles.label}>Aggregation Pipeline (JSON Array)</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '120px', fontFamily: 'monospace', fontSize: '12px' }}
              value={node.data.mongoPipeline || ''}
              onChange={(e) => onUpdate({ mongoPipeline: e.target.value })}
              placeholder='[{"$match": {"status": "active"}}, {"$group": {"_id": "$category"}}]'
            />
          </div>
        )}

        {/* Vector Search Query */}
        {['chromadb', 'pinecone', 'qdrant', 'weaviate'].includes(dbType) && node.data.operation === 'query' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Query Text (or Vector)</label>
              <textarea
                style={styles.textarea}
                value={node.data.vectorQuery || ''}
                onChange={(e) => onUpdate({ vectorQuery: e.target.value })}
                placeholder="What is machine learning?"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Top K Results</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="100"
                value={node.data.topK || 5}
                onChange={(e) => onUpdate({ topK: parseInt(e.target.value) })}
              />
            </div>
          </>
        )}

        {/* Advanced Options */}
        <div>
          <div
            style={styles.collapsibleHeader}
            onClick={() => toggleSection('dbAdvanced')}
          >
            <span style={styles.collapsibleTitle}>
              {expandedSections.has('dbAdvanced') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Advanced Options
            </span>
          </div>
          {expandedSections.has('dbAdvanced') && (
            <div style={{ paddingLeft: '12px' }}>
              <div style={styles.field}>
                <label style={styles.label}>Connection Timeout (ms)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1000"
                  max="60000"
                  value={node.data.connectionTimeout || 10000}
                  onChange={(e) => onUpdate({ connectionTimeout: parseInt(e.target.value) })}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Query Timeout (ms)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1000"
                  max="300000"
                  value={node.data.queryTimeout || 30000}
                  onChange={(e) => onUpdate({ queryTimeout: parseInt(e.target.value) })}
                />
              </div>
              {['postgresql', 'mysql', 'mariadb'].includes(dbType) && (
                <div style={styles.field}>
                  <label style={styles.label}>Max Connections (Pool)</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    max="100"
                    value={node.data.maxConnections || 10}
                    onChange={(e) => onUpdate({ maxConnections: parseInt(e.target.value) })}
                  />
                </div>
              )}
              <div style={styles.field}>
                <label
                  style={styles.checkboxLabel}
                  onClick={() => onUpdate({ alwaysOutputData: !node.data.alwaysOutputData })}
                >
                  <input
                    type="checkbox"
                    checked={node.data.alwaysOutputData || false}
                    onChange={(e) => onUpdate({ alwaysOutputData: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span style={{ fontSize: '13px', color: COLORS.text }}>
                    Always Output Data (even if empty)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Test Connection Button */}
        <div style={{ marginTop: '16px' }}>
          <button
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onClick={async () => {
              // Test connection based on connection method
              if (node.data.connectionMethod === 'savedCredential' && node.data.credentialId) {
                try {
                  const response = await fetch(`/api/v1/credentials/${node.data.credentialId}/test`, {
                    method: 'POST',
                  });
                  const result = await response.json();
                  if (result.success) {
                    alert(`✓ Connection successful!\n\n${result.details?.version || 'Connected to database'}`);
                  } else {
                    alert(`✗ Connection failed!\n\n${result.message}`);
                  }
                } catch (error) {
                  alert('Failed to test connection. Please try again.');
                }
              } else if (node.data.connectionMethod === 'savedCredential') {
                alert('Please select a saved credential first.');
              } else {
                // For inline credentials, test directly
                const testData = {
                  host: node.data.host || 'localhost',
                  port: parseInt(node.data.port) || 5432,
                  database: node.data.database || '',
                  username: node.data.username || '',
                  password: node.data.password || '',
                };
                try {
                  const response = await fetch('/api/v1/credentials/test-inline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      credential_type: node.data.database || 'postgresql',
                      data: testData,
                    }),
                  });
                  const result = await response.json();
                  if (result.success) {
                    alert(`✓ Connection successful!\n\n${result.details?.version || 'Connected to database'}`);
                  } else {
                    alert(`✗ Connection failed!\n\n${result.message}`);
                  }
                } catch (error) {
                  alert('Failed to test connection. Please try again.');
                }
              }
            }}
          >
            <Database size={16} />
            Test Connection
          </button>
        </div>
      </>
    );
  };

  const renderIntegrationConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Integration Type</label>
        <select
          style={styles.select}
          value={node.data.integrationType || 'api'}
          onChange={(e) => onUpdate({ integrationType: e.target.value })}
        >
          <option value="api">HTTP Request</option>
          <option value="github">GitHub</option>
          <option value="slack">Slack</option>
          <option value="email">Email</option>
          <option value="n8n">n8n</option>
          <option value="webhook">Webhook</option>
        </select>
      </div>

      {/* Slack Config */}
      {node.data.integrationType === 'slack' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Channel</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.channel || ''}
              onChange={(e) => onUpdate({ channel: e.target.value })}
              placeholder="#general or @username"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Message Template</label>
            <textarea
              style={styles.textarea}
              value={node.data.messageTemplate || ''}
              onChange={(e) => onUpdate({ messageTemplate: e.target.value })}
              placeholder="New notification: {{$json.message}}"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Bot Token (or use env)</label>
            <input
              style={styles.input}
              type="password"
              value={node.data.slackToken || ''}
              onChange={(e) => onUpdate({ slackToken: e.target.value })}
              placeholder="xoxb-... or leave empty to use SLACK_BOT_TOKEN"
            />
          </div>
        </>
      )}

      {/* Email Config */}
      {node.data.integrationType === 'email' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>To</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.emailTo || ''}
              onChange={(e) => onUpdate({ emailTo: e.target.value })}
              placeholder="recipient@example.com"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.emailSubject || ''}
              onChange={(e) => onUpdate({ emailSubject: e.target.value })}
              placeholder="Workflow Notification: {{$json.title}}"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Body Template</label>
            <textarea
              style={styles.textarea}
              value={node.data.emailBody || ''}
              onChange={(e) => onUpdate({ emailBody: e.target.value })}
              placeholder="Hello,\n\n{{$json.content}}\n\nBest regards"
            />
          </div>
        </>
      )}

      {/* GitHub Config */}
      {node.data.integrationType === 'github' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Action</label>
            <select
              style={styles.select}
              value={node.data.githubAction || 'create_issue'}
              onChange={(e) => onUpdate({ githubAction: e.target.value })}
            >
              <option value="create_issue">Create Issue</option>
              <option value="create_comment">Create Comment</option>
              <option value="create_pr">Create Pull Request</option>
              <option value="merge_pr">Merge Pull Request</option>
              <option value="get_repo">Get Repository Info</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Repository</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.githubRepo || ''}
              onChange={(e) => onUpdate({ githubRepo: e.target.value })}
              placeholder="owner/repo"
            />
          </div>
          {(node.data.githubAction === 'create_issue' || node.data.githubAction === 'create_comment') && (
            <div style={styles.field}>
              <label style={styles.label}>Content Template</label>
              <textarea
                style={styles.textarea}
                value={node.data.githubContent || ''}
                onChange={(e) => onUpdate({ githubContent: e.target.value })}
                placeholder="Issue/comment content..."
              />
            </div>
          )}
        </>
      )}

      {/* N8N Config */}
      {node.data.integrationType === 'n8n' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Workflow ID</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.n8nWorkflowId || ''}
              onChange={(e) => onUpdate({ n8nWorkflowId: e.target.value })}
              placeholder="workflow-id-123"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Input Data (JSON)</label>
            <textarea
              style={{ ...styles.textarea, fontFamily: 'monospace' }}
              value={node.data.n8nInputData || ''}
              onChange={(e) => onUpdate({ n8nInputData: e.target.value })}
              placeholder='{"key": "{{$json.value}}"}'
            />
          </div>
        </>
      )}

      {/* Webhook Config */}
      {node.data.integrationType === 'webhook' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Webhook URL</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.webhookUrl || ''}
              onChange={(e) => onUpdate({ webhookUrl: e.target.value })}
              placeholder="https://webhook.site/..."
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Method</label>
            <select
              style={styles.select}
              value={node.data.webhookMethod || 'POST'}
              onChange={(e) => onUpdate({ webhookMethod: e.target.value })}
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Payload Template (JSON)</label>
            <textarea
              style={{ ...styles.textarea, fontFamily: 'monospace' }}
              value={node.data.webhookPayload || ''}
              onChange={(e) => onUpdate({ webhookPayload: e.target.value })}
              placeholder='{"data": {{$json}}}'
            />
          </div>
        </>
      )}

      {/* Google Sheets Config */}
      {node.data.integrationType === 'google-sheets' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Operation</label>
            <select
              style={styles.select}
              value={node.data.operation || 'read'}
              onChange={(e) => onUpdate({ operation: e.target.value })}
            >
              <option value="read">Read Rows</option>
              <option value="append">Append Row</option>
              <option value="update">Update Row</option>
              <option value="delete">Delete Row</option>
              <option value="lookup">Lookup Row</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Spreadsheet ID or URL</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.spreadsheetId || ''}
              onChange={(e) => {
                // Extract ID from URL if pasted
                let value = e.target.value;
                const urlMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                if (urlMatch) {
                  value = urlMatch[1];
                }
                onUpdate({ spreadsheetId: value });
              }}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            />
            <small style={{ color: COLORS.textMuted, fontSize: '11px' }}>
              Paste the spreadsheet URL or ID from Google Sheets
            </small>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Sheet Name</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.sheetName || ''}
              onChange={(e) => onUpdate({ sheetName: e.target.value })}
              placeholder="Sheet1"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Range (optional)</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.range || ''}
              onChange={(e) => onUpdate({ range: e.target.value })}
              placeholder="A1:D100 or leave empty for all data"
            />
          </div>
          {(node.data.operation === 'append' || node.data.operation === 'update') && (
            <div style={styles.field}>
              <label style={styles.label}>Data Mapping</label>
              <textarea
                style={{ ...styles.textarea, fontFamily: 'monospace' }}
                value={node.data.dataMapping || ''}
                onChange={(e) => onUpdate({ dataMapping: e.target.value })}
                placeholder='{"Column A": "{{$json.name}}", "Column B": "{{$json.email}}"}'
              />
              <small style={{ color: COLORS.textMuted, fontSize: '11px' }}>
                Map input data to spreadsheet columns
              </small>
            </div>
          )}
          {node.data.operation === 'lookup' && (
            <div style={styles.field}>
              <label style={styles.label}>Lookup Column</label>
              <input
                style={styles.input}
                type="text"
                value={node.data.lookupColumn || ''}
                onChange={(e) => onUpdate({ lookupColumn: e.target.value })}
                placeholder="A"
              />
            </div>
          )}
          {node.data.operation === 'lookup' && (
            <div style={styles.field}>
              <label style={styles.label}>Lookup Value</label>
              <input
                style={styles.input}
                type="text"
                value={node.data.lookupValue || ''}
                onChange={(e) => onUpdate({ lookupValue: e.target.value })}
                placeholder="{{$json.searchTerm}}"
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Credential</label>
            <select
              style={styles.select}
              value={node.data.credentialId || ''}
              onChange={(e) => onUpdate({ credentialId: e.target.value })}
            >
              <option value="">Select a Google credential...</option>
              {credentials
                .filter(c => c.credential_type === 'google' || c.credential_type === 'google_sheets' || c.credential_type === 'oauth2')
                .map(cred => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name} ({cred.credential_type})
                  </option>
                ))}
            </select>
            <small style={{ color: COLORS.textMuted, fontSize: '11px' }}>
              Add Google credentials in the Credentials tab
            </small>
          </div>
        </>
      )}

      {/* HTTP API Config */}
      {node.data.integrationType === 'api' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>URL</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Method</label>
            <select
              style={styles.select}
              value={node.data.method || 'GET'}
              onChange={(e) => onUpdate({ method: e.target.value })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Headers (JSON)</label>
            <textarea
              style={{ ...styles.textarea, fontFamily: 'monospace', minHeight: '60px' }}
              value={node.data.headers || ''}
              onChange={(e) => onUpdate({ headers: e.target.value })}
              placeholder='{"Authorization": "Bearer {{$env.API_KEY}}"}'
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Body (JSON)</label>
            <textarea
              style={{ ...styles.textarea, fontFamily: 'monospace' }}
              value={node.data.body || ''}
              onChange={(e) => onUpdate({ body: e.target.value })}
              placeholder='{"data": {{$json}}}'
            />
          </div>
        </>
      )}
    </>
  );

  // AI Agent Node Configuration
  const renderAIAgentConfig = () => (
    <>
      {/* Info Box */}
      <div style={styles.infoBox}>
        <Info style={{ width: '16px', height: '16px', color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
        <span style={styles.infoText}>
          Connect an LLM, Memory, and Tools to this agent using the top handles.
          The agent will use these components during execution.
        </span>
      </div>

      {/* Agent Mode */}
      <div style={styles.field}>
        <label style={styles.label}>Agent Mode</label>
        <select
          style={styles.select}
          value={node.data.agentMode || 'react'}
          onChange={(e) => onUpdate({ agentMode: e.target.value })}
        >
          <option value="react">ReAct (Reason + Act)</option>
          <option value="conversational">Conversational</option>
          <option value="openai_functions">OpenAI Functions</option>
          <option value="structured_chat">Structured Chat</option>
          <option value="xml">XML Agent</option>
        </select>
      </div>

      {/* Collapsible LLM Settings (for direct config without LLM node) */}
      <div>
        <div
          style={styles.collapsibleHeader}
          onClick={() => toggleSection('llm')}
        >
          <span style={styles.collapsibleTitle}>
            {expandedSections.has('llm') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            LLM Settings (Optional)
          </span>
        </div>
        {expandedSections.has('llm') && (
          <div style={{ paddingLeft: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>Provider</label>
              <select
                style={styles.select}
                value={node.data.llmProvider || 'anthropic'}
                onChange={(e) => onUpdate({ llmProvider: e.target.value })}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="ollama">Ollama</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Model</label>
              <select
                style={styles.select}
                value={node.data.llmModel || 'claude-sonnet-4-20250514'}
                onChange={(e) => onUpdate({ llmModel: e.target.value })}
              >
                <optgroup label="Anthropic">
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                  <option value="claude-opus-4-20250514">Claude Opus 4</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </optgroup>
                <optgroup label="Groq">
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                </optgroup>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Temperature: {node.data.temperature ?? 0.7}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={node.data.temperature ?? 0.7}
                onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
                style={styles.slider}
              />
              <div style={styles.sliderValue}>
                <span>Precise (0)</span>
                <span>Creative (2)</span>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Max Tokens</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="100000"
                value={node.data.maxTokens || 4096}
                onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      {/* System Prompt */}
      <div style={styles.field}>
        <label style={styles.label}>System Prompt</label>
        <textarea
          style={{ ...styles.textarea, minHeight: '120px' }}
          value={node.data.systemPrompt || ''}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant that..."
        />
      </div>

      {/* Collapsible Memory Settings */}
      <div>
        <div
          style={styles.collapsibleHeader}
          onClick={() => toggleSection('memory')}
        >
          <span style={styles.collapsibleTitle}>
            {expandedSections.has('memory') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Memory Settings
          </span>
          {node.data.hasMemory && (
            <span style={{ fontSize: 10, color: '#22c55e', marginLeft: 8 }}>● Connected</span>
          )}
        </div>
        {expandedSections.has('memory') && (
          <div style={{ paddingLeft: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>Memory Type</label>
              <select
                style={styles.select}
                value={node.data.memoryType || 'buffer'}
                onChange={(e) => onUpdate({ memoryType: e.target.value })}
              >
                <option value="buffer">Buffer Memory</option>
                <option value="buffer_window">Buffer Window Memory</option>
                <option value="token_buffer">Token Buffer Memory</option>
                <option value="summary">Summary Memory</option>
                <option value="vector">Vector Store Memory</option>
                <option value="conversation">Conversation Memory</option>
              </select>
            </div>
            {(node.data.memoryType === 'buffer_window' || node.data.memoryType === 'token_buffer') && (
              <div style={styles.field}>
                <label style={styles.label}>
                  {node.data.memoryType === 'token_buffer' ? 'Max Tokens' : 'Window Size (messages)'}
                </label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max={node.data.memoryType === 'token_buffer' ? 100000 : 100}
                  value={node.data.memorySize || (node.data.memoryType === 'token_buffer' ? 4096 : 10)}
                  onChange={(e) => onUpdate({ memorySize: parseInt(e.target.value) })}
                />
              </div>
            )}
            {node.data.memoryType === 'vector' && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Vector Store</label>
                  <select
                    style={styles.select}
                    value={node.data.vectorStore || 'pinecone'}
                    onChange={(e) => onUpdate({ vectorStore: e.target.value })}
                  >
                    <option value="pinecone">Pinecone</option>
                    <option value="chroma">Chroma</option>
                    <option value="qdrant">Qdrant</option>
                    <option value="weaviate">Weaviate</option>
                    <option value="supabase">Supabase</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Top K Results</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    max="100"
                    value={node.data.topK || 5}
                    onChange={(e) => onUpdate({ topK: parseInt(e.target.value) })}
                  />
                </div>
              </>
            )}
            <div style={styles.field}>
              <label
                style={styles.checkboxLabel}
                onClick={() => onUpdate({ returnSourceDocuments: !node.data.returnSourceDocuments })}
              >
                <input
                  type="checkbox"
                  checked={node.data.returnSourceDocuments || false}
                  onChange={(e) => onUpdate({ returnSourceDocuments: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={{ fontSize: '13px', color: COLORS.text }}>
                  Return Source Documents
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Tool Settings */}
      <div>
        <div
          style={styles.collapsibleHeader}
          onClick={() => toggleSection('tools')}
        >
          <span style={styles.collapsibleTitle}>
            {expandedSections.has('tools') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Tool Settings
          </span>
          {node.data.hasTool && (
            <span style={{ fontSize: 10, color: '#22c55e', marginLeft: 8 }}>● Connected</span>
          )}
        </div>
        {expandedSections.has('tools') && (
          <div style={{ paddingLeft: '12px' }}>
            <div style={styles.infoBox}>
              <Info style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
              <span style={styles.infoText}>
                Tools extend the agent's capabilities. Connect Tool nodes to the Tool diamond to add them.
              </span>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tool Calling Strategy</label>
              <select
                style={styles.select}
                value={node.data.toolStrategy || 'auto'}
                onChange={(e) => onUpdate({ toolStrategy: e.target.value })}
              >
                <option value="auto">Automatic (Let LLM decide)</option>
                <option value="required">Required (Force tool use)</option>
                <option value="none">None (Disable tools)</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Max Tool Calls Per Turn</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="20"
                value={node.data.maxToolCalls || 5}
                onChange={(e) => onUpdate({ maxToolCalls: parseInt(e.target.value) })}
              />
            </div>
            <div style={styles.field}>
              <label
                style={styles.checkboxLabel}
                onClick={() => onUpdate({ parallelToolCalls: !node.data.parallelToolCalls })}
              >
                <input
                  type="checkbox"
                  checked={node.data.parallelToolCalls ?? true}
                  onChange={(e) => onUpdate({ parallelToolCalls: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={{ fontSize: '13px', color: COLORS.text }}>
                  Allow Parallel Tool Calls
                </span>
              </label>
            </div>
            {node.data.connectedTools && (node.data.connectedTools as string[]).length > 0 && (
              <div style={styles.field}>
                <label style={styles.label}>Connected Tools</label>
                <div style={{
                  padding: '8px',
                  backgroundColor: COLORS.bg,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: COLORS.textMuted
                }}>
                  {(node.data.connectedTools as string[]).map((toolId, i) => (
                    <div key={i} style={{ padding: '4px 0' }}>• {toolId}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Advanced Settings */}
      <div>
        <div
          style={styles.collapsibleHeader}
          onClick={() => toggleSection('advanced')}
        >
          <span style={styles.collapsibleTitle}>
            {expandedSections.has('advanced') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Advanced Settings
          </span>
        </div>
        {expandedSections.has('advanced') && (
          <div style={{ paddingLeft: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>Max Iterations</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="50"
                value={node.data.maxIterations || 10}
                onChange={(e) => onUpdate({ maxIterations: parseInt(e.target.value) })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Output Parser</label>
              <select
                style={styles.select}
                value={node.data.outputParser || 'auto'}
                onChange={(e) => onUpdate({ outputParser: e.target.value })}
              >
                <option value="auto">Auto Detect</option>
                <option value="json">JSON</option>
                <option value="text">Plain Text</option>
                <option value="structured">Structured Output</option>
              </select>
            </div>
            <div style={styles.field}>
              <label
                style={styles.checkboxLabel}
                onClick={() => onUpdate({ requireHumanApproval: !node.data.requireHumanApproval })}
              >
                <input
                  type="checkbox"
                  checked={node.data.requireHumanApproval || false}
                  onChange={(e) => onUpdate({ requireHumanApproval: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={{ fontSize: '13px', color: COLORS.text }}>
                  Require Human Approval
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // LLM Node Configuration
  const renderLLMConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Provider</label>
        <select
          style={styles.select}
          value={node.data.provider || 'anthropic'}
          onChange={(e) => onUpdate({ provider: e.target.value })}
        >
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
          <option value="groq">Groq</option>
          <option value="ollama">Ollama (Local)</option>
          <option value="openrouter">OpenRouter</option>
          <option value="azure">Azure OpenAI</option>
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Model</label>
        <select
          style={styles.select}
          value={node.data.model || 'claude-sonnet-4-20250514'}
          onChange={(e) => onUpdate({ model: e.target.value })}
        >
          {node.data.provider === 'anthropic' && (
            <>
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
              <option value="claude-opus-4-20250514">Claude Opus 4</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            </>
          )}
          {node.data.provider === 'openai' && (
            <>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </>
          )}
          {node.data.provider === 'groq' && (
            <>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              <option value="gemma2-9b-it">Gemma 2 9B</option>
            </>
          )}
          {node.data.provider === 'ollama' && (
            <>
              <option value="llama3.2">Llama 3.2</option>
              <option value="mistral">Mistral</option>
              <option value="codellama">Code Llama</option>
              <option value="phi3">Phi-3</option>
            </>
          )}
          {node.data.provider === 'openrouter' && (
            <>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="openai/gpt-4o">GPT-4o</option>
              <option value="meta-llama/llama-3.1-405b-instruct">Llama 3.1 405B</option>
            </>
          )}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Temperature: {node.data.temperature ?? 0.7}</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={node.data.temperature ?? 0.7}
          onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
          style={styles.slider}
        />
        <div style={styles.sliderValue}>
          <span>Precise (0)</span>
          <span>Creative (2)</span>
        </div>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Max Tokens</label>
        <input
          style={styles.input}
          type="number"
          min="1"
          max="100000"
          value={node.data.maxTokens || 4096}
          onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) })}
        />
      </div>

      {/* Advanced LLM Options */}
      <div>
        <div
          style={styles.collapsibleHeader}
          onClick={() => toggleSection('llmAdvanced')}
        >
          <span style={styles.collapsibleTitle}>
            {expandedSections.has('llmAdvanced') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Advanced Options
          </span>
        </div>
        {expandedSections.has('llmAdvanced') && (
          <div style={{ paddingLeft: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>Top P: {node.data.topP ?? 1.0}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={node.data.topP ?? 1.0}
                onChange={(e) => onUpdate({ topP: parseFloat(e.target.value) })}
                style={styles.slider}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Frequency Penalty: {node.data.frequencyPenalty ?? 0}</label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={node.data.frequencyPenalty ?? 0}
                onChange={(e) => onUpdate({ frequencyPenalty: parseFloat(e.target.value) })}
                style={styles.slider}
              />
            </div>
            <div style={styles.field}>
              <label
                style={styles.checkboxLabel}
                onClick={() => onUpdate({ streaming: !node.data.streaming })}
              >
                <input
                  type="checkbox"
                  checked={node.data.streaming ?? true}
                  onChange={(e) => onUpdate({ streaming: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={{ fontSize: '13px', color: COLORS.text }}>
                  Enable Streaming
                </span>
              </label>
            </div>
            {(node.data.provider === 'ollama' || node.data.provider === 'azure') && (
              <div style={styles.field}>
                <label style={styles.label}>Base URL</label>
                <input
                  style={styles.input}
                  type="text"
                  value={node.data.baseUrl || ''}
                  onChange={(e) => onUpdate({ baseUrl: e.target.value })}
                  placeholder={node.data.provider === 'ollama' ? 'http://localhost:11434' : 'https://your-resource.openai.azure.com'}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  // Tool Node Configuration
  const renderToolConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Tool Type</label>
        <select
          style={styles.select}
          value={node.data.toolType || 'custom'}
          onChange={(e) => onUpdate({ toolType: e.target.value })}
        >
          <option value="calculator">Calculator</option>
          <option value="code_interpreter">Code Interpreter</option>
          <option value="web_search">Web Search</option>
          <option value="http_request">HTTP Request</option>
          <option value="file_reader">File Reader</option>
          <option value="database_query">Database Query</option>
          <option value="shell_command">Shell Command</option>
          <option value="vector_search">Vector Search</option>
          <option value="mcp_tool">MCP Tool</option>
          <option value="custom">Custom Tool</option>
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <textarea
          style={styles.textarea}
          value={node.data.config?.description || ''}
          onChange={(e) => onUpdate({ config: { ...node.data.config, description: e.target.value } })}
          placeholder="Describe what this tool does..."
        />
      </div>

      {/* HTTP Request Config */}
      {node.data.toolType === 'http_request' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>URL</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.config?.url || ''}
              onChange={(e) => onUpdate({ config: { ...node.data.config, url: e.target.value } })}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Method</label>
            <select
              style={styles.select}
              value={node.data.config?.method || 'GET'}
              onChange={(e) => onUpdate({ config: { ...node.data.config, method: e.target.value } })}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
        </>
      )}

      {/* Database Query Config */}
      {node.data.toolType === 'database_query' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Connection String</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.config?.connectionString || ''}
              onChange={(e) => onUpdate({ config: { ...node.data.config, connectionString: e.target.value } })}
              placeholder="postgresql://user:pass@host:5432/db"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Query Template</label>
            <textarea
              style={styles.textarea}
              value={node.data.config?.query || ''}
              onChange={(e) => onUpdate({ config: { ...node.data.config, query: e.target.value } })}
              placeholder="SELECT * FROM users WHERE id = {{userId}}"
            />
          </div>
        </>
      )}

      {/* MCP Tool Config */}
      {node.data.toolType === 'mcp_tool' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>MCP Server</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.config?.mcpServer || ''}
              onChange={(e) => onUpdate({ config: { ...node.data.config, mcpServer: e.target.value } })}
              placeholder="filesystem"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Tool Name</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.config?.mcpTool || ''}
              onChange={(e) => onUpdate({ config: { ...node.data.config, mcpTool: e.target.value } })}
              placeholder="read_file"
            />
          </div>
        </>
      )}

      {/* Custom Tool Config */}
      {node.data.toolType === 'custom' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Function Name</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.config?.functionName || ''}
              onChange={(e) => onUpdate({ config: { ...node.data.config, functionName: e.target.value } })}
              placeholder="my_custom_function"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Parameters (JSON Schema)</label>
            <textarea
              style={{ ...styles.textarea, fontFamily: 'monospace' }}
              value={node.data.config?.parameters ? JSON.stringify(node.data.config.parameters, null, 2) : ''}
              onChange={(e) => {
                try {
                  const params = JSON.parse(e.target.value);
                  onUpdate({ config: { ...node.data.config, parameters: params } });
                } catch {
                  // Allow invalid JSON while typing
                }
              }}
              placeholder='{"type": "object", "properties": {...}}'
            />
          </div>
        </>
      )}
    </>
  );

  // Memory Node Configuration
  const renderMemoryConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Memory Type</label>
        <select
          style={styles.select}
          value={node.data.memoryType || 'buffer'}
          onChange={(e) => onUpdate({ memoryType: e.target.value })}
        >
          <option value="buffer">Buffer Memory (All Messages)</option>
          <option value="buffer_window">Window Buffer (Last N)</option>
          <option value="summary">Summary Memory</option>
          <option value="vector">Vector Memory (Semantic)</option>
          <option value="conversation">Conversation Memory</option>
          <option value="entity">Entity Memory</option>
        </select>
      </div>

      {/* Buffer Window Config */}
      {node.data.memoryType === 'buffer_window' && (
        <div style={styles.field}>
          <label style={styles.label}>Window Size (messages)</label>
          <input
            style={styles.input}
            type="number"
            min="1"
            max="100"
            value={node.data.config?.windowSize || 10}
            onChange={(e) => onUpdate({ config: { ...node.data.config, windowSize: parseInt(e.target.value) } })}
          />
        </div>
      )}

      {/* Summary Memory Config */}
      {node.data.memoryType === 'summary' && (
        <div style={styles.field}>
          <label style={styles.label}>Summary Model</label>
          <select
            style={styles.select}
            value={node.data.config?.summaryModel || 'gpt-3.5-turbo'}
            onChange={(e) => onUpdate({ config: { ...node.data.config, summaryModel: e.target.value } })}
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
          </select>
        </div>
      )}

      {/* Vector Memory Config */}
      {node.data.memoryType === 'vector' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Vector Store</label>
            <select
              style={styles.select}
              value={node.data.config?.vectorStore || 'chromadb'}
              onChange={(e) => onUpdate({ config: { ...node.data.config, vectorStore: e.target.value } })}
            >
              <option value="chromadb">ChromaDB</option>
              <option value="pinecone">Pinecone</option>
              <option value="qdrant">Qdrant</option>
              <option value="weaviate">Weaviate</option>
              <option value="pgvector">PGVector</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Embedding Model</label>
            <select
              style={styles.select}
              value={node.data.config?.embeddingModel || 'text-embedding-3-small'}
              onChange={(e) => onUpdate({ config: { ...node.data.config, embeddingModel: e.target.value } })}
            >
              <option value="text-embedding-3-small">OpenAI text-embedding-3-small</option>
              <option value="text-embedding-3-large">OpenAI text-embedding-3-large</option>
              <option value="voyage-large-2">Voyage Large 2</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Top K Results</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              max="20"
              value={node.data.config?.topK || 5}
              onChange={(e) => onUpdate({ config: { ...node.data.config, topK: parseInt(e.target.value) } })}
            />
          </div>
        </>
      )}

      {/* Common Options */}
      <div style={{ marginTop: '16px' }}>
        <div style={styles.field}>
          <label style={styles.label}>Session ID (Optional)</label>
          <input
            style={styles.input}
            type="text"
            value={node.data.config?.sessionId || ''}
            onChange={(e) => onUpdate({ config: { ...node.data.config, sessionId: e.target.value } })}
            placeholder="Leave empty for auto-generated"
          />
        </div>
        <div style={styles.field}>
          <label
            style={styles.checkboxLabel}
            onClick={() => onUpdate({ config: { ...node.data.config, persistToDb: !node.data.config?.persistToDb } })}
          >
            <input
              type="checkbox"
              checked={node.data.config?.persistToDb || false}
              onChange={(e) => onUpdate({ config: { ...node.data.config, persistToDb: e.target.checked } })}
              style={styles.checkbox}
            />
            <span style={{ fontSize: '13px', color: COLORS.text }}>
              Persist to Database
            </span>
          </label>
        </div>
      </div>
    </>
  );

  // Pronetheia Agent Node Configuration
  const renderPronetheiaAgentConfig = () => (
    <>
      {/* Agent Info */}
      <div style={styles.infoBox}>
        <Info style={{ width: '16px', height: '16px', color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }} />
        <span style={styles.infoText}>
          Pronetheia specialized agent with pre-configured expertise.
          Select the model and customize the system prompt if needed.
        </span>
      </div>

      {/* Agent ID (read-only) */}
      <div style={styles.field}>
        <label style={styles.label}>Agent ID</label>
        <div style={styles.nodeId}>{node.data.agentId || 'Not set'}</div>
      </div>

      {/* Model Selection */}
      <div style={styles.field}>
        <label style={styles.label}>Model</label>
        <select
          style={styles.select}
          value={node.data.model || 'sonnet'}
          onChange={(e) => onUpdate({ model: e.target.value })}
        >
          <optgroup label="Anthropic">
            <option value="sonnet">Claude Sonnet 4 (Recommended)</option>
            <option value="opus">Claude Opus 4</option>
            <option value="haiku">Claude Haiku (Fast)</option>
          </optgroup>
          <optgroup label="OpenAI">
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </optgroup>
          <optgroup label="Groq (Fast)">
            <option value="llama-3.3-70b">Llama 3.3 70B</option>
            <option value="mixtral-8x7b">Mixtral 8x7B</option>
          </optgroup>
        </select>
      </div>

      {/* Temperature */}
      <div style={styles.field}>
        <label style={styles.label}>Temperature: {node.data.temperature ?? 0.7}</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={node.data.temperature ?? 0.7}
          onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
          style={styles.slider}
        />
        <div style={styles.sliderValue}>
          <span>Precise (0)</span>
          <span>Creative (2)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div style={styles.field}>
        <label style={styles.label}>Max Tokens</label>
        <input
          style={styles.input}
          type="number"
          min="100"
          max="100000"
          value={node.data.maxTokens || 4096}
          onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) })}
        />
      </div>

      {/* Custom System Prompt */}
      <div style={styles.field}>
        <label style={styles.label}>Custom System Prompt (Optional)</label>
        <textarea
          style={{ ...styles.textarea, minHeight: '100px' }}
          value={node.data.systemPrompt || ''}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
          placeholder="Override or extend the agent's default prompt..."
        />
      </div>

      {/* Advanced Settings */}
      <div>
        <div
          style={styles.collapsibleHeader}
          onClick={() => toggleSection('pronetheiaAdvanced')}
        >
          <span style={styles.collapsibleTitle}>
            {expandedSections.has('pronetheiaAdvanced') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Advanced Settings
          </span>
        </div>
        {expandedSections.has('pronetheiaAdvanced') && (
          <div style={{ paddingLeft: '12px' }}>
            <div style={styles.field}>
              <label style={styles.label}>Max Iterations</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="50"
                value={node.data.maxIterations || 10}
                onChange={(e) => onUpdate({ maxIterations: parseInt(e.target.value) })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Timeout (seconds)</label>
              <input
                style={styles.input}
                type="number"
                min="10"
                max="600"
                value={node.data.timeout || 120}
                onChange={(e) => onUpdate({ timeout: parseInt(e.target.value) })}
              />
            </div>
            <div style={styles.field}>
              <label
                style={styles.checkboxLabel}
                onClick={() => onUpdate({ returnIntermediateSteps: !node.data.returnIntermediateSteps })}
              >
                <input
                  type="checkbox"
                  checked={node.data.returnIntermediateSteps || false}
                  onChange={(e) => onUpdate({ returnIntermediateSteps: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={{ fontSize: '13px', color: COLORS.text }}>
                  Return Intermediate Steps
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Flow Control Node Configuration
  const renderWorkflowConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Workflow Type</label>
        <select
          style={styles.select}
          value={node.data.workflowType || 'condition'}
          onChange={(e) => onUpdate({ workflowType: e.target.value })}
        >
          <option value="condition">Condition (If/Else)</option>
          <option value="switch">Switch (Multi-way)</option>
          <option value="loop">Loop (Repeat)</option>
          <option value="parallel">Parallel (Split)</option>
          <option value="merge">Merge (Join)</option>
          <option value="wait">Wait (Delay)</option>
        </select>
      </div>

      {/* Condition Config */}
      {(node.data.workflowType === 'condition' || !node.data.workflowType) && (
        <div style={styles.field}>
          <label style={styles.label}>Condition Expression</label>
          <textarea
            style={styles.textarea}
            value={node.data.condition || ''}
            onChange={(e) => onUpdate({ condition: e.target.value })}
            placeholder="{{$json.status}} === 'success'"
          />
        </div>
      )}

      {/* Switch Config */}
      {node.data.workflowType === 'switch' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Switch Value</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.switchValue || ''}
              onChange={(e) => onUpdate({ switchValue: e.target.value })}
              placeholder="{{$json.type}}"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Cases (comma-separated)</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.cases || ''}
              onChange={(e) => onUpdate({ cases: e.target.value })}
              placeholder="success, error, pending"
            />
          </div>
        </>
      )}

      {/* Loop Config */}
      {node.data.workflowType === 'loop' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Loop Type</label>
            <select
              style={styles.select}
              value={node.data.loopType || 'items'}
              onChange={(e) => onUpdate({ loopType: e.target.value })}
            >
              <option value="items">Loop Over Items</option>
              <option value="count">Loop N Times</option>
              <option value="while">While Condition</option>
            </select>
          </div>
          {node.data.loopType === 'count' && (
            <div style={styles.field}>
              <label style={styles.label}>Iterations</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="1000"
                value={node.data.iterations || 10}
                onChange={(e) => onUpdate({ iterations: parseInt(e.target.value) })}
              />
            </div>
          )}
        </>
      )}

      {/* Wait Config */}
      {node.data.workflowType === 'wait' && (
        <div style={styles.field}>
          <label style={styles.label}>Wait Time (seconds)</label>
          <input
            style={styles.input}
            type="number"
            min="1"
            max="3600"
            value={node.data.waitTime || 5}
            onChange={(e) => onUpdate({ waitTime: parseInt(e.target.value) })}
          />
        </div>
      )}
    </>
  );

  // Data Transformation Node Configuration
  const renderDataConfig = () => (
    <>
      <div style={styles.field}>
        <label style={styles.label}>Operation</label>
        <select
          style={styles.select}
          value={node.data.dataType || 'set'}
          onChange={(e) => onUpdate({ dataType: e.target.value })}
        >
          <option value="set">Set Field</option>
          <option value="filter">Filter Items</option>
          <option value="sort">Sort Items</option>
          <option value="aggregate">Aggregate</option>
          <option value="code">Custom Code</option>
        </select>
      </div>

      {/* Set Field Config */}
      {node.data.dataType === 'set' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Field Name</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.fieldName || ''}
              onChange={(e) => onUpdate({ fieldName: e.target.value })}
              placeholder="newField"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Value Expression</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.fieldValue || ''}
              onChange={(e) => onUpdate({ fieldValue: e.target.value })}
              placeholder="{{$json.existingField}} + ' modified'"
            />
          </div>
        </>
      )}

      {/* Filter Config */}
      {node.data.dataType === 'filter' && (
        <div style={styles.field}>
          <label style={styles.label}>Filter Condition</label>
          <textarea
            style={styles.textarea}
            value={node.data.filterCondition || ''}
            onChange={(e) => onUpdate({ filterCondition: e.target.value })}
            placeholder="{{$json.status}} === 'active'"
          />
        </div>
      )}

      {/* Sort Config */}
      {node.data.dataType === 'sort' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Sort Field</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.sortField || ''}
              onChange={(e) => onUpdate({ sortField: e.target.value })}
              placeholder="createdAt"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Sort Order</label>
            <select
              style={styles.select}
              value={node.data.sortOrder || 'asc'}
              onChange={(e) => onUpdate({ sortOrder: e.target.value })}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </>
      )}

      {/* Aggregate Config */}
      {node.data.dataType === 'aggregate' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Aggregation Type</label>
            <select
              style={styles.select}
              value={node.data.aggregationType || 'count'}
              onChange={(e) => onUpdate({ aggregationType: e.target.value })}
            >
              <option value="count">Count</option>
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Field (for sum/avg/min/max)</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.aggregateField || ''}
              onChange={(e) => onUpdate({ aggregateField: e.target.value })}
              placeholder="amount"
            />
          </div>
        </>
      )}

      {/* Code Config */}
      {node.data.dataType === 'code' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Language</label>
            <select
              style={styles.select}
              value={node.data.codeLanguage || 'javascript'}
              onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Code</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '150px', fontFamily: 'monospace' }}
              value={node.data.code || ''}
              onChange={(e) => onUpdate({ code: e.target.value })}
              placeholder={node.data.codeLanguage === 'python'
                ? '# Input is available as $input\nreturn {"result": $input["value"] * 2}'
                : '// Input is available as $input\nreturn { result: $input.value * 2 };'
              }
            />
          </div>
        </>
      )}
    </>
  );

  const renderConfigByType = () => {
    switch (node.type) {
      case 'agent':
        return renderAgentConfig();
      case 'aiAgent':
        return renderAIAgentConfig();
      case 'pronetheiaAgent':
        return renderPronetheiaAgentConfig();
      case 'llm':
        return renderLLMConfig();
      case 'tool':
        return renderToolConfig();
      case 'memory':
        return renderMemoryConfig();
      case 'trigger':
        return renderTriggerConfig();
      case 'database':
        return renderDatabaseConfig();
      case 'integration':
        return renderIntegrationConfig();
      case 'workflow':
        return renderWorkflowConfig();
      case 'data':
        return renderDataConfig();
      default:
        return (
          <div style={styles.field}>
            <label style={styles.label}>Label</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Configure Node</h3>
        <button style={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>

      <div style={styles.content}>
        {/* Node Info */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Node Info</div>
          <div style={styles.field}>
            <label style={styles.label}>ID</label>
            <div style={styles.nodeId}>{node.id}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Label</label>
            <input
              style={styles.input}
              type="text"
              value={node.data.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>
        </div>

        {/* Type-specific Config */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Configuration</div>
          {renderConfigByType()}
        </div>

        {/* Delete Button */}
        <button
          style={styles.deleteBtn}
          onClick={() => {
            if (confirm('Delete this node?')) {
              onDelete(node.id);
              onClose();
            }
          }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
