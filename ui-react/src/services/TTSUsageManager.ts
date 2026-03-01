/**
 * TTSUsageManager - Monitors ElevenLabs usage and auto-switches to Kokoro
 *
 * Features:
 * - Tracks character usage for ElevenLabs free tier (10K/month)
 * - Persists usage to localStorage
 * - Auto-switches to Kokoro before hitting limit
 * - Provides usage statistics and warnings
 * - Resets monthly on billing cycle
 */

export type TTSProvider = 'elevenlabs' | 'kokoro' | 'edge' | 'webspeech';

export interface TTSUsageStats {
  provider: TTSProvider;
  charactersUsed: number;
  monthlyLimit: number;
  remainingCharacters: number;
  percentUsed: number;
  currentMonth: string;  // YYYY-MM format
  autoSwitched: boolean;
  switchedAt?: string;
}

export interface TTSUsageConfig {
  /** ElevenLabs monthly character limit (default: 10000) */
  monthlyLimit: number;
  /** Switch to fallback when this % of limit reached (default: 90) */
  switchThresholdPercent: number;
  /** Warning threshold % (default: 75) */
  warningThresholdPercent: number;
  /** Fallback provider when limit reached */
  fallbackProvider: TTSProvider;
  /** Callback when warning threshold reached */
  onWarning?: (stats: TTSUsageStats) => void;
  /** Callback when auto-switch occurs */
  onAutoSwitch?: (stats: TTSUsageStats) => void;
}

const DEFAULT_CONFIG: TTSUsageConfig = {
  monthlyLimit: 10000,  // ElevenLabs free tier
  switchThresholdPercent: 90,
  warningThresholdPercent: 75,
  fallbackProvider: 'kokoro',
};

const STORAGE_KEY = 'pronetheia-tts-usage';

interface StoredUsage {
  charactersUsed: number;
  currentMonth: string;
  autoSwitched: boolean;
  switchedAt?: string;
  history: Array<{
    month: string;
    charactersUsed: number;
    provider: TTSProvider;
  }>;
}

export class TTSUsageManager {
  private config: TTSUsageConfig;
  private usage: StoredUsage;
  private currentProvider: TTSProvider = 'elevenlabs';
  private warningShown = false;

  constructor(config: Partial<TTSUsageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.usage = this.loadUsage();
    this.checkMonthReset();
    this.checkThresholds();
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Load usage from localStorage
   */
  private loadUsage(): StoredUsage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[TTSUsageManager] Failed to load usage:', e);
    }

    return {
      charactersUsed: 0,
      currentMonth: this.getCurrentMonth(),
      autoSwitched: false,
      history: [],
    };
  }

  /**
   * Save usage to localStorage
   */
  private saveUsage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.usage));
    } catch (e) {
      console.warn('[TTSUsageManager] Failed to save usage:', e);
    }
  }

  /**
   * Check if we need to reset for a new month
   */
  private checkMonthReset(): void {
    const currentMonth = this.getCurrentMonth();

    if (this.usage.currentMonth !== currentMonth) {
      // Archive previous month
      if (this.usage.charactersUsed > 0) {
        this.usage.history.push({
          month: this.usage.currentMonth,
          charactersUsed: this.usage.charactersUsed,
          provider: this.currentProvider,
        });

        // Keep only last 12 months
        if (this.usage.history.length > 12) {
          this.usage.history = this.usage.history.slice(-12);
        }
      }

      // Reset for new month
      console.log(`[TTSUsageManager] New month detected (${currentMonth}), resetting usage`);
      this.usage.charactersUsed = 0;
      this.usage.currentMonth = currentMonth;
      this.usage.autoSwitched = false;
      this.usage.switchedAt = undefined;
      this.currentProvider = 'elevenlabs';
      this.warningShown = false;
      this.saveUsage();
    }
  }

  /**
   * Check if we've hit warning or switch thresholds
   */
  private checkThresholds(): void {
    const percentUsed = (this.usage.charactersUsed / this.config.monthlyLimit) * 100;

    // Check for auto-switch threshold
    if (percentUsed >= this.config.switchThresholdPercent && !this.usage.autoSwitched) {
      this.autoSwitch();
    }
    // Check for warning threshold
    else if (percentUsed >= this.config.warningThresholdPercent && !this.warningShown) {
      this.warningShown = true;
      const stats = this.getStats();
      console.warn(`[TTSUsageManager] WARNING: ${percentUsed.toFixed(1)}% of ElevenLabs limit used`);
      this.config.onWarning?.(stats);
    }
  }

  /**
   * Auto-switch to fallback provider
   */
  private autoSwitch(): void {
    this.usage.autoSwitched = true;
    this.usage.switchedAt = new Date().toISOString();
    this.currentProvider = this.config.fallbackProvider;
    this.saveUsage();

    const stats = this.getStats();
    console.log(`[TTSUsageManager] Auto-switched to ${this.config.fallbackProvider} (${stats.percentUsed.toFixed(1)}% used)`);
    this.config.onAutoSwitch?.(stats);
  }

  /**
   * Record character usage for a TTS request
   */
  recordUsage(text: string, provider: TTSProvider = 'elevenlabs'): void {
    // Only count ElevenLabs usage
    if (provider !== 'elevenlabs') {
      return;
    }

    const characters = text.length;
    this.usage.charactersUsed += characters;
    this.saveUsage();
    this.checkThresholds();

    console.log(`[TTSUsageManager] +${characters} chars (${this.usage.charactersUsed}/${this.config.monthlyLimit})`);
  }

  /**
   * Get current provider (may be auto-switched)
   */
  getCurrentProvider(): TTSProvider {
    this.checkMonthReset();
    return this.usage.autoSwitched ? this.config.fallbackProvider : 'elevenlabs';
  }

  /**
   * Check if we should use ElevenLabs or fallback
   */
  shouldUseElevenLabs(): boolean {
    this.checkMonthReset();
    return !this.usage.autoSwitched;
  }

  /**
   * Get usage statistics
   */
  getStats(): TTSUsageStats {
    this.checkMonthReset();

    const remaining = Math.max(0, this.config.monthlyLimit - this.usage.charactersUsed);
    const percentUsed = (this.usage.charactersUsed / this.config.monthlyLimit) * 100;

    return {
      provider: this.getCurrentProvider(),
      charactersUsed: this.usage.charactersUsed,
      monthlyLimit: this.config.monthlyLimit,
      remainingCharacters: remaining,
      percentUsed: Math.min(100, percentUsed),
      currentMonth: this.usage.currentMonth,
      autoSwitched: this.usage.autoSwitched,
      switchedAt: this.usage.switchedAt,
    };
  }

  /**
   * Get usage history
   */
  getHistory(): StoredUsage['history'] {
    return [...this.usage.history];
  }

  /**
   * Estimate how many more messages can be sent
   */
  estimateRemainingMessages(avgCharsPerMessage: number = 200): number {
    const stats = this.getStats();
    return Math.floor(stats.remainingCharacters / avgCharsPerMessage);
  }

  /**
   * Force switch to a specific provider
   */
  forceProvider(provider: TTSProvider): void {
    this.currentProvider = provider;
    if (provider !== 'elevenlabs') {
      this.usage.autoSwitched = true;
      this.usage.switchedAt = new Date().toISOString();
    } else {
      this.usage.autoSwitched = false;
      this.usage.switchedAt = undefined;
    }
    this.saveUsage();
  }

  /**
   * Reset usage (for testing or manual override)
   */
  resetUsage(): void {
    this.usage = {
      charactersUsed: 0,
      currentMonth: this.getCurrentMonth(),
      autoSwitched: false,
      history: this.usage.history,
    };
    this.currentProvider = 'elevenlabs';
    this.warningShown = false;
    this.saveUsage();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TTSUsageConfig>): void {
    this.config = { ...this.config, ...config };
    this.checkThresholds();
  }
}

// Singleton instance
let _instance: TTSUsageManager | null = null;

export function getTTSUsageManager(config?: Partial<TTSUsageConfig>): TTSUsageManager {
  if (!_instance) {
    _instance = new TTSUsageManager(config);
  } else if (config) {
    _instance.updateConfig(config);
  }
  return _instance;
}

export default TTSUsageManager;
