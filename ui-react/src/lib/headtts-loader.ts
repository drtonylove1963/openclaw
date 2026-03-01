/**
 * HeadTTS Loader - Handles optional @met4citizen/headtts dependency
 * Falls back to null if package is not available
 */

export interface HeadTTSInstance {
  speak: (text: string, options?: { voice?: string; rate?: number; pitch?: number }) => Promise<void>;
  stop: () => void;
  getAudioContext: () => AudioContext | null;
}

export interface HeadTTSConstructor {
  new (options?: { audioContext?: AudioContext }): HeadTTSInstance;
}

/**
 * Attempt to load HeadTTS dynamically
 * Returns null if package is not installed
 */
export async function loadHeadTTS(): Promise<HeadTTSConstructor | null> {
  try {
    // Dynamic import with error handling
    const module = await import(/* @vite-ignore */ '@met4citizen/headtts');
    return module.default;
  } catch {
    console.log('[HeadTTS] Package not available, will use fallback');
    return null;
  }
}
