import { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, Trash2, Check } from 'lucide-react';
import { GlassCard, NeuralButton, StatusIndicator } from '../shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface OpenClawStatus {
  configured: boolean;
  token_masked: string | null;
  tokenized_url: string | null;
}

export function ServiceTokensTab() {
  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('pronetheia_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/settings/service-tokens/openclaw`, {
        headers: getHeaders(),
      });
      if (!res.ok) {throw new Error('Failed to fetch OpenClaw token status');}
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRevealToken = async () => {
    if (showToken && revealedToken) {
      setShowToken(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/settings/service-tokens/openclaw/reveal`, {
        headers: getHeaders(),
      });
      if (!res.ok) {throw new Error('Failed to reveal token');}
      const data = await res.json();
      setRevealedToken(data.token);
      setShowToken(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reveal token');
    }
  };

  const handleSetToken = async () => {
    if (!tokenInput.trim()) {return;}
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/settings/service-tokens/openclaw`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      if (!res.ok) {throw new Error('Failed to save token');}
      setTokenInput('');
      setRevealedToken(null);
      setShowToken(false);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save token');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToken = async () => {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/settings/service-tokens/openclaw/reset`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) {throw new Error('Failed to reset token');}
      setRevealedToken(null);
      setShowToken(false);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset token');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteToken = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/settings/service-tokens/openclaw`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {throw new Error('Failed to delete token');}
      setRevealedToken(null);
      setShowToken(false);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete token');
    }
  };

  const handleCopyUrl = async () => {
    if (!status?.tokenized_url) {return;}
    try {
      await navigator.clipboard.writeText(status.tokenized_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '60px 0', color: '#6b7280' }}>
        <div className="flex items-center gap-3">
          <div
            className="animate-spin"
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(0, 212, 255, 0.2)',
              borderTopColor: '#00d4ff',
              borderRadius: '50%',
            }}
          />
          Loading service tokens...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#ef4444',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* OpenClaw Gateway Token */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
          OpenClaw Gateway
        </h2>
        <GlassCard style={{ padding: '24px' }}>
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-4">
              <StatusIndicator
                status={status?.configured ? 'active' : 'offline'}
                text={status?.configured ? 'Token configured' : 'Not configured'}
              />
            </div>

            {/* Current token display */}
            {status?.configured && (
              <div className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                    Token
                  </label>
                  <div className="flex items-center gap-2">
                    <code
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        color: '#f0f0f5',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {showToken && revealedToken ? revealedToken : status.token_masked}
                    </code>
                    <button
                      onClick={handleRevealToken}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        background: 'rgba(0, 212, 255, 0.1)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title={showToken ? 'Hide token' : 'Reveal token'}
                    >
                      {showToken ? <EyeOff size={16} color="#00d4ff" /> : <Eye size={16} color="#00d4ff" />}
                    </button>
                  </div>
                </div>

                {/* Tokenized URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                    Tokenized URL
                  </label>
                  <div className="flex items-center gap-2">
                    <code
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        color: '#8b5cf6',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {status.tokenized_url}
                    </code>
                    <button
                      onClick={handleCopyUrl}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 212, 255, 0.1)',
                        border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 212, 255, 0.2)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                      title="Copy tokenized URL"
                    >
                      {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#00d4ff" />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3" style={{ paddingTop: '8px' }}>
                  <NeuralButton
                    variant="secondary"
                    onClick={handleResetToken}
                    disabled={resetting}
                  >
                    <RefreshCw size={14} style={{ marginRight: '6px', ...(resetting ? { animation: 'spin 1s linear infinite' } : {}) }} />
                    {resetting ? 'Resetting...' : 'Reset Token'}
                  </NeuralButton>
                  <NeuralButton
                    variant="secondary"
                    onClick={handleDeleteToken}
                  >
                    <Trash2 size={14} style={{ marginRight: '6px' }} />
                    Delete
                  </NeuralButton>
                </div>
              </div>
            )}

            {/* Set / Update token input */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                {status?.configured ? 'Update Token' : 'Set Token'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste OpenClaw gateway token..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    color: '#f0f0f5',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                />
                <NeuralButton
                  variant="primary"
                  onClick={handleSetToken}
                  disabled={!tokenInput.trim() || saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </NeuralButton>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
