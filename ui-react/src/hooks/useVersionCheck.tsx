/**
 * Version Check Hook
 * 
 * Automatically checks for new deployments and prompts user to refresh.
 * Solves the issue of cached stale builds on mobile devices.
 */

import { useEffect, useState, useCallback } from 'react';

interface VersionInfo {
  version: string;
  buildTime: string;
  environment: string;
}

interface UseVersionCheckOptions {
  /** How often to check for updates (ms). Default: 5 minutes */
  checkInterval?: number;
  /** Whether to auto-refresh without prompting. Default: false */
  autoRefresh?: boolean;
  /** Whether to check on window focus. Default: true */
  checkOnFocus?: boolean;
}

interface UseVersionCheckResult {
  /** Current deployed version info */
  currentVersion: VersionInfo | null;
  /** Whether a newer version is available */
  updateAvailable: boolean;
  /** Time when the update was detected */
  updateDetectedAt: Date | null;
  /** Manually trigger a version check */
  checkForUpdate: () => Promise<void>;
  /** Force refresh the page */
  refreshPage: () => void;
}

const VERSION_URL = '/version.json';
const LOCAL_VERSION_KEY = 'pronetheia_build_version';
const CHECK_INTERVAL_DEFAULT = 5 * 60 * 1000; // 5 minutes

export function useVersionCheck(options: UseVersionCheckOptions = {}): UseVersionCheckResult {
  const {
    checkInterval = CHECK_INTERVAL_DEFAULT,
    autoRefresh = false,
    checkOnFocus = true,
  } = options;

  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDetectedAt, setUpdateDetectedAt] = useState<Date | null>(null);

  const refreshPage = useCallback(() => {
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    // Hard refresh
    window.location.reload();
  }, []);

  const checkForUpdate = useCallback(async () => {
    try {
      // Add cache-busting query param
      const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        console.warn('[VersionCheck] Failed to fetch version info');
        return;
      }

      const serverVersion: VersionInfo = await response.json();
      setCurrentVersion(serverVersion);

      // Get the version we loaded with
      const loadedVersion = localStorage.getItem(LOCAL_VERSION_KEY);
      const currentBuildTime = document.querySelector('meta[name="build-time"]')?.getAttribute('content');

      // First load - store the current version
      if (!loadedVersion) {
        localStorage.setItem(LOCAL_VERSION_KEY, serverVersion.buildTime);
        return;
      }

      // Check if server has a newer build
      const loadedTime = new Date(loadedVersion).getTime();
      const serverTime = new Date(serverVersion.buildTime).getTime();

      if (serverTime > loadedTime) {
        console.log('[VersionCheck] Update available!', {
          loaded: loadedVersion,
          server: serverVersion.buildTime,
        });
        
        setUpdateAvailable(true);
        setUpdateDetectedAt(new Date());

        if (autoRefresh) {
          console.log('[VersionCheck] Auto-refreshing...');
          refreshPage();
        }
      }
    } catch (error) {
      console.error('[VersionCheck] Error checking version:', error);
    }
  }, [autoRefresh, refreshPage]);

  // Check on mount
  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  // Periodic checks
  useEffect(() => {
    if (checkInterval <= 0) {return;}

    const interval = setInterval(checkForUpdate, checkInterval);
    return () => clearInterval(interval);
  }, [checkForUpdate, checkInterval]);

  // Check on window focus (user returns to tab)
  useEffect(() => {
    if (!checkOnFocus) {return;}

    const handleFocus = () => {
      checkForUpdate();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkForUpdate, checkOnFocus]);

  // Check on visibility change (user returns to tab on mobile)
  useEffect(() => {
    if (!checkOnFocus) {return;}

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkForUpdate, checkOnFocus]);

  return {
    currentVersion,
    updateAvailable,
    updateDetectedAt,
    checkForUpdate,
    refreshPage,
  };
}

/**
 * Update Banner Component
 * Shows a banner when a new version is available
 */
export function UpdateBanner() {
  const { updateAvailable, refreshPage } = useVersionCheck();

  if (!updateAvailable) {return null;}

  const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: 'white',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 10000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'white',
    color: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s',
  };

  return (
    <div style={bannerStyle}>
      <span style={{ fontSize: '14px', fontWeight: 500 }}>
        🚀 A new version is available!
      </span>
      <button onClick={refreshPage} style={buttonStyle}>
        Update Now
      </button>
    </div>
  );
}

export default useVersionCheck;