import React, { useState, useEffect, useCallback } from 'react';
import { COLORS } from '../styles/colors';
import { useAuth } from '../contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface GitStatus {
  is_repo: boolean;
  branch: string;
  remote_url: string;
  has_remote: boolean;
  is_clean: boolean;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
}

interface GitCommit {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  author_email: string;
  date: string;
}

interface GitOperationResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

interface GitPanelProps {
  projectId: string;
  projectName: string;
  githubRepo: string | null;
  onUpdate?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function getGitStatus(token: string, projectId: string): Promise<GitStatus> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {throw new Error('Failed to get git status');}
  return response.json();
}

async function getGitLog(token: string, projectId: string, limit = 5): Promise<GitCommit[]> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/log?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {return [];}
  return response.json();
}

async function initGitRepo(token: string, projectId: string): Promise<GitOperationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/init`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ default_branch: 'main' }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to initialize repository');
  }
  return response.json();
}

async function cloneRepo(
  token: string,
  projectId: string,
  repoUrl: string,
  branch?: string
): Promise<GitOperationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/clone`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo_url: repoUrl, branch }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to clone repository');
  }
  return response.json();
}

async function linkGitHub(
  token: string,
  projectId: string,
  repoUrl: string,
  cloneExisting: boolean
): Promise<GitOperationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/link-github`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo_url: repoUrl, clone_existing: cloneExisting }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to link GitHub repository');
  }
  return response.json();
}

async function commitChanges(
  token: string,
  projectId: string,
  message: string,
  addAll = true
): Promise<GitOperationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/commit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, add_all: addAll }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to commit changes');
  }
  return response.json();
}

async function pushChanges(
  token: string,
  projectId: string,
  setUpstream = false
): Promise<GitOperationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ set_upstream: setUpstream }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to push changes');
  }
  return response.json();
}

async function pullChanges(token: string, projectId: string): Promise<GitOperationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/pull`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to pull changes');
  }
  return response.json();
}

async function pushToNewRepo(
  token: string,
  projectId: string,
  repoFullName: string
): Promise<GitOperationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/projects/${projectId}/git/push-to-new-repo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ github_repo_full_name: repoFullName }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to push to new repository');
  }
  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const Icons = {
  Git: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 3v6m0 6v6"/>
      <circle cx="6" cy="6" r="2"/>
      <circle cx="18" cy="18" r="2"/>
      <path d="M6 8v4c0 1.1.9 2 2 2h2M18 16v-4c0-1.1-.9-2-2-2h-2"/>
    </svg>
  ),
  GitHub: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  Branch: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v12"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  ),
  Commit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4"/>
      <path d="M1.05 12H7m10 0h5.95"/>
    </svg>
  ),
  Push: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19V5m-7 7l7-7 7 7"/>
    </svg>
  ),
  Pull: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14m7-7l-7 7-7-7"/>
    </svg>
  ),
  Clone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  Warning: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4m0 4h.01"/>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    </svg>
  ),
  Sync: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
    </svg>
  ),
  Link: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14m-7-7h14"/>
    </svg>
  ),
  Folder: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: COLORS.bgPanel || '#141415',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: 600,
  },
  headerIcon: {
    color: '#F05032',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    background: COLORS.bgMuted || '#18181b',
    borderRadius: '6px',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  cleanBadge: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
  },
  dirtyBadge: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
  },
  syncBadge: {
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3B82F6',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: COLORS.bgMuted || '#18181b',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    color: COLORS.text,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  primaryButton: {
    background: COLORS.accent || '#10b981',
    borderColor: COLORS.accent || '#10b981',
    color: '#111827',
  },
  dangerButton: {
    background: 'transparent',
    borderColor: '#EF4444',
    color: '#EF4444',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    background: COLORS.bgMuted || '#18181b',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    color: COLORS.text,
    fontSize: '13px',
    outline: 'none',
    minWidth: '200px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  section: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: '12px',
  },
  commitList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  commitItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '8px',
    background: COLORS.bgMuted || '#18181b',
    borderRadius: '6px',
    fontSize: '13px',
  },
  commitHash: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: '12px',
  },
  commitMessage: {
    color: COLORS.text,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  commitMeta: {
    color: COLORS.textSecondary,
    fontSize: '11px',
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    maxHeight: '150px',
    overflowY: 'auto' as const,
    padding: '8px',
    background: COLORS.bgMuted || '#18181b',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  fileStaged: {
    color: '#10B981',
  },
  fileModified: {
    color: '#F59E0B',
  },
  fileUntracked: {
    color: COLORS.textSecondary,
  },
  message: {
    padding: '12px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  successMessage: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10B981',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  noRepo: {
    textAlign: 'center' as const,
    padding: '24px',
    color: COLORS.textSecondary,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: COLORS.textSecondary,
    cursor: 'pointer',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const GitPanel: React.FC<GitPanelProps> = ({
  projectId,
  projectName,
  githubRepo,
  onUpdate,
}) => {
  const { token } = useAuth();
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [commitMessage, setCommitMessage] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [cloneExisting, setCloneExisting] = useState(false);
  const [showCommitForm, setShowCommitForm] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!token) {return;}
    try {
      const [gitStatus, gitLog] = await Promise.all([
        getGitStatus(token, projectId),
        getGitLog(token, projectId),
      ]);
      setStatus(gitStatus);
      setCommits(gitLog);
    } catch {
      // Status might fail if not a git repo, that's ok
      setStatus({
        is_repo: false,
        branch: '',
        remote_url: '',
        has_remote: false,
        is_clean: true,
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
      });
    }
  }, [token, projectId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleOperation = async (
    operation: () => Promise<GitOperationResponse>,
    successMsg?: string
  ) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await operation();
      setSuccessMessage(successMsg || result.message);
      await loadStatus();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInit = () => {
    if (!token) {return;}
    handleOperation(
      () => initGitRepo(token, projectId),
      'Git repository initialized'
    );
  };

  const handleLink = () => {
    if (!token || !linkUrl) {return;}
    handleOperation(
      () => linkGitHub(token, projectId, linkUrl, cloneExisting),
      cloneExisting ? 'Repository cloned' : 'GitHub linked'
    );
    setShowLinkForm(false);
    setLinkUrl('');
  };

  const handleCommit = () => {
    if (!token || !commitMessage.trim()) {return;}
    handleOperation(
      () => commitChanges(token, projectId, commitMessage),
      'Changes committed'
    );
    setCommitMessage('');
    setShowCommitForm(false);
  };

  const handlePush = () => {
    if (!token) {return;}
    const needsUpstream = status ? !status.remote_url : false;
    handleOperation(
      () => pushChanges(token, projectId, needsUpstream),
      'Changes pushed'
    );
  };

  const handlePull = () => {
    if (!token) {return;}
    handleOperation(
      () => pullChanges(token, projectId),
      'Changes pulled'
    );
  };

  const hasChanges = status && (
    (status.staged?.length || 0) > 0 ||
    (status.modified?.length || 0) > 0 ||
    (status.untracked?.length || 0) > 0
  );

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.headerIcon}><Icons.Git /></span>
        Git Integration
      </div>

      {/* Messages */}
      {error && (
        <div style={{ ...styles.message, ...styles.errorMessage }}>
          {error}
        </div>
      )}
      {successMessage && (
        <div style={{ ...styles.message, ...styles.successMessage }}>
          {successMessage}
        </div>
      )}

      {/* Not a git repo yet */}
      {status && !status.is_repo && (
        <div style={styles.noRepo}>
          <p style={{ marginBottom: '16px' }}>This project is not a git repository yet.</p>
          <div style={styles.buttonRow}>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleInit}
              disabled={loading}
            >
              <Icons.Plus /> Initialize Git
            </button>
            <button
              style={styles.button}
              onClick={() => setShowLinkForm(true)}
              disabled={loading}
            >
              <Icons.GitHub /> Link GitHub Repo
            </button>
          </div>

          {showLinkForm && (
            <div style={{ marginTop: '16px', textAlign: 'left' }}>
              <div style={styles.inputRow}>
                <input
                  type="text"
                  placeholder="https://github.com/user/repo"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  style={styles.input}
                />
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleLink}
                  disabled={loading || !linkUrl}
                >
                  {cloneExisting ? 'Clone' : 'Link'}
                </button>
              </div>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={cloneExisting}
                  onChange={(e) => setCloneExisting(e.target.checked)}
                />
                Clone repository contents (will overwrite project files)
              </label>
            </div>
          )}
        </div>
      )}

      {/* Git repo exists */}
      {status && status.is_repo && (
        <>
          {/* Status Bar */}
          <div style={styles.statusBar}>
            <div style={styles.statusItem}>
              <Icons.Branch />
              <strong>{status.branch || 'main'}</strong>
            </div>

            {status.has_remote && (
              <div style={styles.statusItem}>
                <Icons.GitHub />
                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {status.remote_url.replace('https://github.com/', '').replace('.git', '')}
                </span>
              </div>
            )}

            <div style={{
              ...styles.statusBadge,
              ...(status.is_clean ? styles.cleanBadge : styles.dirtyBadge),
            }}>
              {status.is_clean ? (
                <><Icons.Check /> Clean</>
              ) : (
                <><Icons.Warning /> {(status.modified?.length || 0) + (status.staged?.length || 0) + (status.untracked?.length || 0)} changes</>
              )}
            </div>

            {status.has_remote && (status.ahead > 0 || status.behind > 0) && (
              <div style={{ ...styles.statusBadge, ...styles.syncBadge }}>
                <Icons.Sync />
                {status.ahead > 0 && `${status.ahead} ahead`}
                {status.ahead > 0 && status.behind > 0 && ', '}
                {status.behind > 0 && `${status.behind} behind`}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={styles.buttonRow}>
            {!status.has_remote && (
              <button
                style={styles.button}
                onClick={() => setShowLinkForm(!showLinkForm)}
                disabled={loading}
              >
                <Icons.Link /> Link Remote
              </button>
            )}

            {hasChanges && (
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={() => setShowCommitForm(!showCommitForm)}
                disabled={loading}
              >
                <Icons.Commit /> Commit
              </button>
            )}

            {status.has_remote && status.ahead > 0 && (
              <button
                style={styles.button}
                onClick={handlePush}
                disabled={loading}
              >
                <Icons.Push /> Push
              </button>
            )}

            {status.has_remote && (
              <button
                style={styles.button}
                onClick={handlePull}
                disabled={loading}
              >
                <Icons.Pull /> Pull
              </button>
            )}
          </div>

          {/* Link Remote Form */}
          {showLinkForm && !status.has_remote && (
            <div style={{ marginTop: '12px' }}>
              <div style={styles.inputRow}>
                <input
                  type="text"
                  placeholder="https://github.com/user/repo"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  style={styles.input}
                />
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleLink}
                  disabled={loading || !linkUrl}
                >
                  Add Remote
                </button>
              </div>
            </div>
          )}

          {/* Commit Form */}
          {showCommitForm && hasChanges && (
            <div style={{ marginTop: '12px' }}>
              {/* Changed Files */}
              <div style={styles.fileList}>
                {(status.staged || []).map((f) => (
                  <div key={f} style={{ ...styles.fileItem, ...styles.fileStaged }}>
                    <Icons.Check /> {f}
                  </div>
                ))}
                {(status.modified || []).map((f) => (
                  <div key={f} style={{ ...styles.fileItem, ...styles.fileModified }}>
                    M {f}
                  </div>
                ))}
                {(status.untracked || []).map((f) => (
                  <div key={f} style={{ ...styles.fileItem, ...styles.fileUntracked }}>
                    ? {f}
                  </div>
                ))}
              </div>

              <div style={styles.inputRow}>
                <input
                  type="text"
                  placeholder="Commit message..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  style={styles.input}
                  onKeyPress={(e) => e.key === 'Enter' && handleCommit()}
                />
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleCommit}
                  disabled={loading || !commitMessage.trim()}
                >
                  Commit All
                </button>
              </div>
            </div>
          )}

          {/* Recent Commits */}
          {commits.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Recent Commits</div>
              <div style={styles.commitList}>
                {commits.slice(0, 5).map((commit) => (
                  <div key={commit.hash} style={styles.commitItem}>
                    <span style={styles.commitHash}>{commit.short_hash}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.commitMessage}>{commit.message}</div>
                      <div style={styles.commitMeta}>
                        {commit.author} - {new Date(commit.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '12px', color: COLORS.textSecondary }}>
          Processing...
        </div>
      )}
    </div>
  );
};

export default GitPanel;
