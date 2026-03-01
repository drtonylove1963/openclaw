/**
 * TTSUsageIndicator - Visual display of ElevenLabs usage
 *
 * Shows:
 * - Usage bar with color coding (green → yellow → red)
 * - Characters used / remaining
 * - Current provider indicator
 * - Auto-switch status
 */

import React from 'react';
import { useTTSUsage } from '../../hooks/useTTSUsage';
import { COLORS } from '../../styles/colors';

interface TTSUsageIndicatorProps {
  /** Show detailed stats */
  showDetails?: boolean;
  /** Compact mode (just the bar) */
  compact?: boolean;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Class name */
  className?: string;
}

export const TTSUsageIndicator: React.FC<TTSUsageIndicatorProps> = ({
  showDetails = true,
  compact = false,
  style,
  className,
}) => {
  const {
    stats,
    provider,
    isWarning,
    isAutoSwitched,
    estimatedMessagesRemaining,
    forceProvider,
  } = useTTSUsage();

  // Color based on usage percentage
  const getBarColor = () => {
    if (stats.percentUsed >= 90) {return '#ef4444';} // Red
    if (stats.percentUsed >= 75) {return '#f59e0b';} // Amber
    if (stats.percentUsed >= 50) {return '#eab308';} // Yellow
    return '#10b981'; // Green
  };

  // Provider icon
  const getProviderIcon = () => {
    switch (provider) {
      case 'elevenlabs':
        return '🎙️';
      case 'kokoro':
        return '🔊';
      default:
        return '🔈';
    }
  };

  // Provider label
  const getProviderLabel = () => {
    switch (provider) {
      case 'elevenlabs':
        return 'ElevenLabs';
      case 'kokoro':
        return 'Kokoro (Local)';
      case 'edge':
        return 'Edge TTS';
      default:
        return 'Web Speech';
    }
  };

  if (compact) {
    return (
      <div style={{ ...styles.compactContainer, ...style }} className={className}>
        <div style={styles.compactBar}>
          <div
            style={{
              ...styles.compactBarFill,
              width: `${Math.min(100, stats.percentUsed)}%`,
              backgroundColor: getBarColor(),
            }}
          />
        </div>
        <span style={styles.compactText}>
          {getProviderIcon()} {stats.percentUsed.toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...style }} className={className}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Voice Usage</span>
        <span style={styles.provider}>
          {getProviderIcon()} {getProviderLabel()}
        </span>
      </div>

      {/* Usage Bar */}
      <div style={styles.barContainer}>
        <div style={styles.barBackground}>
          <div
            style={{
              ...styles.barFill,
              width: `${Math.min(100, stats.percentUsed)}%`,
              backgroundColor: getBarColor(),
            }}
          />
          {/* Threshold markers */}
          <div style={{ ...styles.thresholdMarker, left: '75%' }} title="Warning (75%)" />
          <div style={{ ...styles.thresholdMarker, left: '90%' }} title="Auto-switch (90%)" />
        </div>
        <span style={styles.percentText}>{stats.percentUsed.toFixed(1)}%</span>
      </div>

      {/* Stats */}
      {showDetails && (
        <div style={styles.statsContainer}>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Used:</span>
            <span style={styles.statValue}>
              {stats.charactersUsed.toLocaleString()} / {stats.monthlyLimit.toLocaleString()} chars
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Remaining:</span>
            <span style={styles.statValue}>
              {stats.remainingCharacters.toLocaleString()} chars (~{estimatedMessagesRemaining} messages)
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Resets:</span>
            <span style={styles.statValue}>
              {getNextResetDate()}
            </span>
          </div>
        </div>
      )}

      {/* Auto-switch notice */}
      {isAutoSwitched && (
        <div style={styles.switchNotice}>
          <span style={styles.switchIcon}>⚡</span>
          <span>
            Auto-switched to Kokoro to preserve quota.
            {stats.switchedAt && (
              <span style={styles.switchTime}>
                {' '}({new Date(stats.switchedAt).toLocaleDateString()})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Warning notice */}
      {isWarning && !isAutoSwitched && (
        <div style={styles.warningNotice}>
          <span style={styles.warningIcon}>⚠️</span>
          <span>Approaching limit. Will auto-switch at 90%.</span>
        </div>
      )}

      {/* Manual override buttons */}
      {showDetails && (
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.button,
              backgroundColor: provider === 'elevenlabs' ? '#10b981' : 'transparent',
              color: provider === 'elevenlabs' ? '#fff' : COLORS.textMuted,
            }}
            onClick={() => forceProvider('elevenlabs')}
            disabled={stats.percentUsed >= 100}
            title="Use ElevenLabs (premium quality)"
          >
            🎙️ ElevenLabs
          </button>
          <button
            style={{
              ...styles.button,
              backgroundColor: provider === 'kokoro' ? '#10b981' : 'transparent',
              color: provider === 'kokoro' ? '#fff' : COLORS.textMuted,
            }}
            onClick={() => forceProvider('kokoro')}
            title="Use Kokoro (local, unlimited)"
          >
            🔊 Kokoro
          </button>
        </div>
      )}
    </div>
  );
};

// Helper to get next reset date (1st of next month)
function getNextResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntil = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return `${nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${daysUntil} days)`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: COLORS.bgAlt || '#1a1a1b',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '13px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontWeight: 600,
    color: COLORS.text || '#e4e4e7',
  },
  provider: {
    fontSize: '12px',
    color: COLORS.textMuted || '#a1a1aa',
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  barBackground: {
    flex: 1,
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  percentText: {
    minWidth: '45px',
    textAlign: 'right',
    color: COLORS.textMuted || '#a1a1aa',
    fontSize: '12px',
  },
  statsContainer: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  statLabel: {
    color: COLORS.textMuted || '#a1a1aa',
  },
  statValue: {
    color: COLORS.text || '#e4e4e7',
  },
  switchNotice: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#10b981',
  },
  switchIcon: {
    fontSize: '14px',
  },
  switchTime: {
    opacity: 0.7,
  },
  warningNotice: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#f59e0b',
  },
  warningIcon: {
    fontSize: '14px',
  },
  buttonRow: {
    marginTop: '10px',
    display: 'flex',
    gap: '8px',
  },
  button: {
    flex: 1,
    padding: '6px 10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  // Compact styles
  compactContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  compactBar: {
    width: '40px',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  compactBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  compactText: {
    fontSize: '11px',
    color: COLORS.textMuted || '#a1a1aa',
  },
};

export default TTSUsageIndicator;
