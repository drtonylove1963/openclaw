/**
 * Upgrade Banner Component
 * Prompts free users to upgrade to PRO
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Theme matching CodeTab
const THEME = {
  bg: {
    primary: '#1a1a1a',
    secondary: '#242424',
  },
  accent: {
    primary: '#e07a5f',
    warning: '#f4d35e',
  },
  text: {
    primary: '#e5e5e5',
    secondary: '#a3a3a3',
  },
};

/**
 * UpgradeBanner - Encourages free users to upgrade
 *
 * Usage:
 * <UpgradeBanner />
 *
 * Displays only for FREE users, auto-hides for PRO/ENTERPRISE/ADMIN
 */
export function UpgradeBanner() {
  const { user, isPro } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Don't show for PRO+ users or if dismissed
  if (isPro || dismissed || !user) {return null;}

  const handleUpgrade = () => {
    // In production, open Stripe checkout or pricing modal
    window.open('https://pronetheia.ai/pricing', '_blank');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 20px',
        background: `linear-gradient(135deg, ${THEME.accent.warning}22, ${THEME.accent.primary}22)`,
        border: `1px solid ${THEME.accent.warning}44`,
        borderRadius: 10,
        margin: '12px 16px',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: THEME.text.primary,
            marginBottom: 2,
          }}
        >
          You're on the FREE plan
        </div>
        <div style={{ fontSize: 11, color: THEME.text.secondary }}>
          Upgrade to PRO for unlimited sessions, priority support, and advanced features
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleUpgrade}
          style={{
            padding: '8px 16px',
            background: THEME.accent.primary,
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Upgrade to PRO
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: THEME.text.secondary,
            fontSize: 16,
            cursor: 'pointer',
            lineHeight: 1,
          }}
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default UpgradeBanner;
