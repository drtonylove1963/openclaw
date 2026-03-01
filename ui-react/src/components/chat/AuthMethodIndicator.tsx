/**
 * AuthMethodIndicator - Shows which authentication method will be used for the selected model
 * Displays: Subscription (green), OpenRouter (blue), API Key (gray), or No Auth (red)
 */
import React, { useState, useEffect } from 'react';
import { COLORS } from '../../styles/colors';

interface AuthMethodIndicatorProps {
  modelId: string;
}

interface AuthResolution {
  model_id: string;
  provider: string | null;
  auth_method: 'subscription' | 'openrouter' | 'api_key' | 'none';
  subscription_tier?: string;
  message: string;
}

const AUTH_CONFIG = {
  subscription: {
    label: 'Subscription',
    icon: '◇',
    color: COLORS.success,
    bgColor: '#1a3a2a',
  },
  openrouter: {
    label: 'OpenRouter',
    icon: '◈',
    color: '#60a5fa',
    bgColor: '#1e3a5f',
  },
  api_key: {
    label: 'API Key',
    icon: '△',
    color: COLORS.textMuted,
    bgColor: COLORS.bgAlt,
  },
  none: {
    label: 'No Auth',
    icon: '⚠',
    color: COLORS.danger,
    bgColor: '#3b1f1f',
  },
};

// Backend API base URL
const API_BASE = import.meta.env.VITE_API_URL || '';

export function AuthMethodIndicator({ modelId }: AuthMethodIndicatorProps) {
  const [authInfo, setAuthInfo] = useState<AuthResolution | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAuthMethod = async () => {
      if (!modelId) {return;}

      setLoading(true);
      try {
        // Extract just the model name if it has a provider prefix
        const cleanModelId = modelId.includes('/') ? modelId.split('/').pop() : modelId;
        const response = await fetch(`${API_BASE}/api/v1/providers/resolve/${cleanModelId}`);
        if (response.ok) {
          const data = await response.json();
          setAuthInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch auth method:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthMethod();
  }, [modelId]);

  if (loading || !authInfo) {
    return null;
  }

  const config = AUTH_CONFIG[authInfo.auth_method] || AUTH_CONFIG.none;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '6px',
      backgroundColor: config.bgColor,
      color: config.color,
      fontSize: '11px',
      fontWeight: 500,
      cursor: 'help',
      transition: 'all 0.2s',
    },
    icon: {
      fontSize: '10px',
    },
    tier: {
      textTransform: 'uppercase',
      fontSize: '10px',
      opacity: 0.8,
      marginLeft: '2px',
    },
  };

  return (
    <div
      style={styles.container}
      title={authInfo.message}
    >
      <span style={styles.icon}>{config.icon}</span>
      <span>{config.label}</span>
      {authInfo.subscription_tier && (
        <span style={styles.tier}>({authInfo.subscription_tier})</span>
      )}
    </div>
  );
}

export default AuthMethodIndicator;
