/**
 * WhisperSTTService - Speech-to-Text using Whisper backend
 *
 * Provides transcription via the Voice Agent API (CTX 124)
 * which proxies to Whisper STT (CTX 129).
 *
 * Supports both direct file upload and recorded audio blob transcription.
 */

export interface WhisperConfig {
  /** Voice Agent API URL (default: from env or http://192.168.1.124:8890) */
  apiUrl?: string;
  /** Language for transcription (default: 'en') */
  language?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration_ms?: number;
}

export interface TranscriptionError {
  message: string;
  code?: string;
}

const DEFAULT_CONFIG: WhisperConfig = {
  apiUrl: import.meta.env.VITE_VOICE_AGENT_URL || '',
  language: 'en',
  timeout: 30000,
};

export class WhisperSTTService {
  private config: Required<WhisperConfig>;

  constructor(config: WhisperConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || DEFAULT_CONFIG.apiUrl,
      language: config.language || DEFAULT_CONFIG.language,
      timeout: config.timeout || DEFAULT_CONFIG.timeout,
    };
  }

  /**
   * Transcribe an audio blob (recorded from microphone)
   */
  async transcribe(audioBlob: Blob, language?: string): Promise<TranscriptionResult> {
    const formData = new FormData();

    // Determine file extension based on MIME type
    const mimeType = audioBlob.type || 'audio/webm';
    const extension = this.getExtensionFromMimeType(mimeType);
    const filename = `recording.${extension}`;

    formData.append('file', audioBlob, filename);
    formData.append('language', language || this.config.language);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      console.log('[WhisperSTT] Transcribing audio:', {
        size: audioBlob.size,
        type: mimeType,
        language: language || this.config.language,
      });

      const response = await fetch(`${this.config.apiUrl}/api/v1/voice/transcribe/file`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Transcription failed: ${response.status} - ${error}`);
      }

      const data = await response.json();

      console.log('[WhisperSTT] Transcription result:', data);

      return {
        text: data.text || '',
        confidence: data.confidence || 1.0,
        language: data.language || this.config.language,
        duration_ms: data.duration_ms,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Transcription request timed out', { cause: error });
      }

      throw error;
    }
  }

  /**
   * Check if the Whisper service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.overall === true && data.whisper === true;
    } catch {
      return false;
    }
  }

  /**
   * Get the API URL being used
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<WhisperConfig>): void {
    if (config.apiUrl) {this.config.apiUrl = config.apiUrl;}
    if (config.language) {this.config.language = config.language;}
    if (config.timeout) {this.config.timeout = config.timeout;}
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/ogg;codecs=opus': 'ogg',
      'audio/flac': 'flac',
    };

    return mimeToExt[mimeType] || 'webm';
  }
}

// Singleton instance
let _instance: WhisperSTTService | null = null;

export function getWhisperSTTService(config?: WhisperConfig): WhisperSTTService {
  if (!_instance) {
    _instance = new WhisperSTTService(config);
  } else if (config) {
    _instance.setConfig(config);
  }
  return _instance;
}

export default WhisperSTTService;
