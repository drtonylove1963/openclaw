/**
 * useTTSUsage - React hook for TTS usage monitoring
 *
 * Tracks ElevenLabs usage and provides auto-switch to Kokoro
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getTTSUsageManager,
  TTSUsageStats,
  TTSUsageConfig,
  TTSProvider,
} from '../services/TTSUsageManager';

interface UseTTSUsageOptions extends Partial<TTSUsageConfig> {
  /** Show browser notification on warning */
  notifyOnWarning?: boolean;
  /** Show browser notification on auto-switch */
  notifyOnSwitch?: boolean;
}

interface UseTTSUsageReturn {
  /** Current usage statistics */
  stats: TTSUsageStats;
  /** Current TTS provider being used */
  provider: TTSProvider;
  /** Whether ElevenLabs is still available */
  isElevenLabsAvailable: boolean;
  /** Whether we're in warning zone (75%+) */
  isWarning: boolean;
  /** Whether auto-switched to fallback */
  isAutoSwitched: boolean;
  /** Record usage for text */
  recordUsage: (text: string) => void;
  /** Force switch to a provider */
  forceProvider: (provider: TTSProvider) => void;
  /** Reset usage (start of month or manual) */
  resetUsage: () => void;
  /** Estimated remaining messages */
  estimatedMessagesRemaining: number;
  /** Get provider to use for a given text */
  getProviderForText: (text: string) => TTSProvider;
}

export function useTTSUsage(options: UseTTSUsageOptions = {}): UseTTSUsageReturn {
  const {
    notifyOnWarning = true,
    notifyOnSwitch = true,
    ...config
  } = options;

  const [stats, setStats] = useState<TTSUsageStats>(() => {
    const manager = getTTSUsageManager(config);
    return manager.getStats();
  });

  // Initialize manager with callbacks
  useEffect(() => {
    const manager = getTTSUsageManager({
      ...config,
      onWarning: (newStats) => {
        setStats(newStats);
        if (notifyOnWarning && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Athena Voice Usage Warning', {
              body: `${newStats.percentUsed.toFixed(0)}% of ElevenLabs limit used. ${newStats.remainingCharacters} characters remaining.`,
              icon: '/icon-192.png',
            });
          }
        }
        console.warn(`[useTTSUsage] Warning: ${newStats.percentUsed.toFixed(1)}% used`);
      },
      onAutoSwitch: (newStats) => {
        setStats(newStats);
        if (notifyOnSwitch && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Athena Voice Switched', {
              body: `Switched to Kokoro TTS to preserve ElevenLabs quota. Will reset next month.`,
              icon: '/icon-192.png',
            });
          }
        }
        console.log(`[useTTSUsage] Auto-switched to Kokoro`);
      },
    });

    // Update stats periodically
    const interval = setInterval(() => {
      setStats(manager.getStats());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [notifyOnWarning, notifyOnSwitch]);

  const recordUsage = useCallback((text: string) => {
    const manager = getTTSUsageManager();
    manager.recordUsage(text, 'elevenlabs');
    setStats(manager.getStats());
  }, []);

  const forceProvider = useCallback((provider: TTSProvider) => {
    const manager = getTTSUsageManager();
    manager.forceProvider(provider);
    setStats(manager.getStats());
  }, []);

  const resetUsage = useCallback(() => {
    const manager = getTTSUsageManager();
    manager.resetUsage();
    setStats(manager.getStats());
  }, []);

  const getProviderForText = useCallback((text: string): TTSProvider => {
    const manager = getTTSUsageManager();
    const currentStats = manager.getStats();

    // If already switched, use fallback
    if (currentStats.autoSwitched) {
      return 'kokoro';
    }

    // Check if this text would push us over the threshold
    const projectedUsage = currentStats.charactersUsed + text.length;
    const projectedPercent = (projectedUsage / currentStats.monthlyLimit) * 100;

    if (projectedPercent >= 90) {
      // This message would push us over - switch now
      return 'kokoro';
    }

    return 'elevenlabs';
  }, []);

  const estimatedMessagesRemaining = getTTSUsageManager().estimateRemainingMessages(200);

  return {
    stats,
    provider: stats.provider,
    isElevenLabsAvailable: !stats.autoSwitched,
    isWarning: stats.percentUsed >= 75,
    isAutoSwitched: stats.autoSwitched,
    recordUsage,
    forceProvider,
    resetUsage,
    estimatedMessagesRemaining,
    getProviderForText,
  };
}

export default useTTSUsage;
