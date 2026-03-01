/**
 * Streaming Voice Service - WebSocket client for unified voice pipelines
 *
 * Connects to backend voice streaming endpoint for:
 * - Gemini Native Audio (full unified, ~1-2s latency)
 * - Gemini Hybrid (STT+LLM with external TTS, ~1.3s latency)
 * - Unified self-hosted (Whisper+Llama+Kokoro, ~2-3s latency)
 *
 * Features:
 * - Real-time bidirectional audio streaming
 * - Automatic reconnection with exponential backoff
 * - Transcript callbacks for both user and assistant
 * - State change notifications
 * - Barge-in (interrupt) support
 */

export type VoiceProvider = 'gemini_full' | 'gemini_hybrid' | 'unified' | 'livekit' | 'auto';

export type UserPreference = 'speed' | 'voice_variety' | 'self_hosted' | 'balanced';

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  available: boolean;
  latency_ms: number;
  voice_count: number;
  requires_cloud: boolean;
  last_check?: string;
  error?: string;
}

export type VoiceState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

export interface StreamingVoiceConfig {
  /** Voice pipeline provider (use 'auto' for intelligent selection) */
  provider: VoiceProvider;
  /** User preference for auto provider selection */
  preference?: UserPreference;
  /** Backend WebSocket URL */
  wsUrl?: string;
  /** Backend API URL (for provider selection) */
  apiUrl?: string;
  /** TTS provider for hybrid mode */
  ttsProvider?: 'elevenlabs' | 'kokoro';
  /** Voice ID for TTS */
  voiceId?: string;
  /** System prompt for LLM */
  systemPrompt?: string;
  /** ElevenLabs voice settings */
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speakerBoost?: boolean;
  };
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Max reconnection attempts */
  maxReconnectAttempts?: number;
}

export interface TranscriptEvent {
  text: string;
  speaker: 'user' | 'assistant';
  partial: boolean;
}

export interface AudioEvent {
  data: ArrayBuffer;
  format: 'pcm' | 'wav' | 'mp3';
}

export interface StreamingVoiceCallbacks {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (event: TranscriptEvent) => void;
  onAudio?: (event: AudioEvent) => void;
  onError?: (error: string) => void;
}

const DEFAULT_CONFIG: Partial<StreamingVoiceConfig> = {
  provider: 'auto',
  preference: 'balanced',
  ttsProvider: 'elevenlabs',
  autoReconnect: true,
  maxReconnectAttempts: 5,
};

/**
 * Fetch available voice providers from backend
 */
export async function fetchProviders(apiUrl?: string): Promise<ProviderInfo[]> {
  const baseUrl = apiUrl || `${window.location.protocol}//${window.location.host}`;
  const url = `${baseUrl}/api/v1/voice/stream/providers`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.providers || [];
  } catch (error) {
    console.error('[StreamingVoice] Failed to fetch providers:', error);
    return [];
  }
}

/**
 * Select best provider based on preference
 */
export async function selectBestProvider(
  preference: UserPreference = 'balanced',
  exclude?: string[],
  apiUrl?: string
): Promise<{ provider: VoiceProvider | null; latency_ms?: number }> {
  const baseUrl = apiUrl || `${window.location.protocol}//${window.location.host}`;
  const params = new URLSearchParams({ preference });
  if (exclude && exclude.length > 0) {
    params.set('exclude', exclude.join(','));
  }

  const url = `${baseUrl}/api/v1/voice/stream/select?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      provider: data.selected as VoiceProvider | null,
      latency_ms: data.latency_ms,
    };
  } catch (error) {
    console.error('[StreamingVoice] Failed to select provider:', error);
    // Fallback to gemini_hybrid
    return { provider: 'gemini_hybrid' };
  }
}

export class StreamingVoiceService {
  private config: StreamingVoiceConfig;
  private callbacks: StreamingVoiceCallbacks;
  private ws: WebSocket | null = null;
  private state: VoiceState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private audioContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  /** Scheduled end-time for next queued audio chunk (gapless playback) */
  private nextPlayTime = 0;

  constructor(config: Partial<StreamingVoiceConfig> = {}, callbacks: StreamingVoiceCallbacks = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as StreamingVoiceConfig;
    this.callbacks = callbacks;
  }

  /** The actual provider being used (after auto-selection) */
  private activeProvider: VoiceProvider | null = null;

  /**
   * Connect to voice streaming backend
   */
  async connect(): Promise<void> {
    if (this.state !== 'disconnected') {
      console.warn('[StreamingVoice] Already connected or connecting');
      return;
    }

    this.setState('connecting');

    try {
      // Handle auto provider selection
      let provider = this.config.provider;
      if (provider === 'auto') {
        console.log('[StreamingVoice] Auto-selecting provider with preference:', this.config.preference);
        const result = await selectBestProvider(
          this.config.preference || 'balanced',
          undefined,
          this.config.apiUrl
        );

        if (result.provider) {
          provider = result.provider;
          console.log(`[StreamingVoice] Selected provider: ${provider} (latency: ${result.latency_ms}ms)`);
        } else {
          // Fallback to livekit if no provider available
          console.warn('[StreamingVoice] No provider available, falling back to livekit');
          provider = 'livekit';
        }
      }

      this.activeProvider = provider;

      // Build WebSocket URL with resolved provider
      const wsUrl = this.buildWsUrl(provider);
      console.log('[StreamingVoice] Connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketHandlers();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        };
      });

      // Initialize audio
      await this.initAudio();

      // Send initial voice settings to backend
      this.sendInitialConfig();

      this.reconnectAttempts = 0;
      console.log('[StreamingVoice] Connected successfully');
    } catch (error) {
      console.error('[StreamingVoice] Connection failed:', error);
      this.setState('error');
      this.callbacks.onError?.(error instanceof Error ? error.message : 'Connection failed');

      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Disconnect from voice streaming backend
   */
  disconnect(): void {
    console.log('[StreamingVoice] Disconnecting...');

    // Cancel reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop audio
    this.stopAudio();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * Send audio data to backend
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[StreamingVoice] Cannot send audio: not connected');
      return;
    }

    const base64 = this.arrayBufferToBase64(audioData);
    this.ws.send(
      JSON.stringify({
        type: 'audio',
        data: base64,
        format: 'pcm',
      })
    );
  }

  /**
   * Send text message to backend
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[StreamingVoice] Cannot send text: not connected');
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: 'text',
        text,
      })
    );
  }

  /**
   * Send interrupt signal (barge-in) and flush audio queue
   */
  interrupt(): void {
    // Reset the playback queue so buffered audio doesn't keep playing
    this.nextPlayTime = 0;
    if (this.playbackContext && this.playbackContext.state !== 'closed') {
      // Close and recreate to cancel all scheduled audio sources
      this.playbackContext.close().catch(() => {});
      this.playbackContext = null;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    console.log('[StreamingVoice] Sending interrupt signal');
    this.ws.send(JSON.stringify({ type: 'interrupt' }));
  }

  /**
   * Update voice configuration and sync to backend
   */
  updateConfig(config: Partial<StreamingVoiceConfig>): void {
    this.config = { ...this.config, ...config };

    // Send config update to backend WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const vs = config.voiceSettings || this.config.voiceSettings || {};
      this.ws.send(
        JSON.stringify({
          type: 'config',
          voice_id: config.voiceId || this.config.voiceId,
          tts_provider: config.ttsProvider || this.config.ttsProvider,
          stability: vs.stability,
          similarity_boost: vs.similarityBoost,
          style: vs.style,
          speaker_boost: vs.speakerBoost,
        })
      );
    }
  }

  /**
   * Start recording from microphone
   */
  async startRecording(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      await this.initAudio();
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    console.log('[StreamingVoice] Recording started');
  }

  /**
   * Stop recording from microphone
   */
  stopRecording(): void {
    // Audio worklet continues running, we just stop sending
    console.log('[StreamingVoice] Recording stopped');
  }

  /**
   * Get current state
   */
  getState(): VoiceState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state !== 'disconnected' && this.state !== 'error';
  }

  // Private methods

  /**
   * Get the active provider (the one actually being used after auto-selection)
   */
  getActiveProvider(): VoiceProvider | null {
    return this.activeProvider;
  }

  private sendInitialConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {return;}

    const vs = this.config.voiceSettings || {};
    this.ws.send(
      JSON.stringify({
        type: 'config',
        voice_id: this.config.voiceId,
        tts_provider: this.config.ttsProvider,
        stability: vs.stability,
        similarity_boost: vs.similarityBoost,
        style: vs.style,
        speaker_boost: vs.speakerBoost,
      })
    );
    console.log('[StreamingVoice] Sent initial voice config');
  }

  private buildWsUrl(resolvedProvider?: VoiceProvider): string {
    const baseUrl =
      this.config.wsUrl ||
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/voice/stream`;

    // Use resolved provider or config provider (skip 'auto')
    const provider = resolvedProvider || (this.config.provider !== 'auto' ? this.config.provider : 'gemini_hybrid');

    const params = new URLSearchParams({
      provider: provider,
    });

    if (this.config.ttsProvider) {
      params.set('tts_provider', this.config.ttsProvider);
    }
    if (this.config.voiceId) {
      params.set('voice_id', this.config.voiceId);
    }
    if (this.config.systemPrompt) {
      params.set('system_prompt', this.config.systemPrompt);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) {return;}

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('[StreamingVoice] Invalid message:', e);
      }
    };

    this.ws.onclose = (event) => {
      console.log('[StreamingVoice] WebSocket closed:', event.code, event.reason);
      this.setState('disconnected');

      if (this.config.autoReconnect && !event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      console.error('[StreamingVoice] WebSocket error:', event);
      this.callbacks.onError?.('WebSocket error');
    };
  }

  private handleMessage(data: Record<string, unknown>): void {
    const type = data.type as string;

    switch (type) {
      case 'state':
        this.setState(data.state as VoiceState);
        break;

      case 'transcript':
        this.callbacks.onTranscript?.({
          text: data.text as string,
          speaker: data.speaker as 'user' | 'assistant',
          partial: (data.partial as boolean) || false,
        });
        break;

      case 'audio':
        this.handleAudioResponse(data);
        break;

      case 'error':
        console.error('[StreamingVoice] Backend error:', data.message);
        this.callbacks.onError?.(data.message as string);
        break;

      default:
        console.warn('[StreamingVoice] Unknown message type:', type);
    }
  }

  private async handleAudioResponse(data: Record<string, unknown>): Promise<void> {
    const base64 = data.data as string;
    const format = (data.format as string) || 'pcm';

    const arrayBuffer = this.base64ToArrayBuffer(base64);

    // Notify callback
    this.callbacks.onAudio?.({
      data: arrayBuffer,
      format: format as 'pcm' | 'wav' | 'mp3',
    });

    // Play audio
    await this.playAudio(arrayBuffer, format);
  }

  private async initAudio(): Promise<void> {
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // Create source from microphone
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Use ScriptProcessor for audio capture (AudioWorklet would be better but more complex)
      // 2048 @ 16kHz = 128ms per chunk (was 4096 = 256ms)
      const bufferSize = 2048;
      const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      processor.onaudioprocess = (e) => {
        if (this.state === 'listening' || this.state === 'connected') {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = this.floatTo16BitPCM(inputData);
          this.sendAudio(pcmData.buffer as ArrayBuffer);
        }
      };

      this.sourceNode.connect(processor);
      processor.connect(this.audioContext.destination);

      console.log('[StreamingVoice] Audio initialized');
    } catch (error) {
      console.error('[StreamingVoice] Audio init failed:', error);
      throw error;
    }
  }

  private stopAudio(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.playbackContext) {
      this.playbackContext.close().catch(() => {});
      this.playbackContext = null;
    }
    this.nextPlayTime = 0;
  }

  private async playAudio(data: ArrayBuffer, format: string): Promise<void> {
    // Use a dedicated playback context (separate from capture context)
    if (!this.playbackContext || this.playbackContext.state === 'closed') {
      this.playbackContext = new AudioContext();
      this.nextPlayTime = 0;
    }

    try {
      let audioBuffer: AudioBuffer;

      if (format === 'pcm') {
        // Decode PCM (16-bit signed, 24kHz)
        audioBuffer = this.decodePCM(data, 24000);
      } else {
        // Decode compressed audio (wav, mp3)
        audioBuffer = await this.playbackContext.decodeAudioData(data.slice(0));
      }

      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);

      // Schedule gapless playback: queue each chunk to start right after
      // the previous one ends, avoiding overlaps and gaps.
      const now = this.playbackContext.currentTime;
      const startAt = Math.max(now, this.nextPlayTime);
      source.start(startAt);
      this.nextPlayTime = startAt + audioBuffer.duration;
    } catch (error) {
      console.error('[StreamingVoice] Audio playback error:', error);
    }
  }

  private decodePCM(data: ArrayBuffer, sampleRate: number): AudioBuffer {
    const int16Array = new Int16Array(data);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    const ctx = this.playbackContext || this.audioContext;
    const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);

    return audioBuffer;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private setState(state: VoiceState): void {
    if (this.state !== state) {
      console.log(`[StreamingVoice] State: ${this.state} -> ${state}`);
      this.state = state;
      this.callbacks.onStateChange?.(state);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.log('[StreamingVoice] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`[StreamingVoice] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/**
 * Hook for using StreamingVoiceService in React components
 */
export function useStreamingVoice(config: Partial<StreamingVoiceConfig> = {}) {
  const [state, setState] = useState<VoiceState>('disconnected');
  const [transcript, setTranscript] = useState<TranscriptEvent | null>(null);
  const [activeProvider, setActiveProvider] = useState<VoiceProvider | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const serviceRef = useRef<StreamingVoiceService | null>(null);

  useEffect(() => {
    const service = new StreamingVoiceService(config, {
      onStateChange: (newState) => {
        setState(newState);
        // Update active provider when connected
        if (newState === 'connected') {
          setActiveProvider(service.getActiveProvider());
        }
      },
      onTranscript: setTranscript,
      onError: (err) => console.error('[useStreamingVoice] Error:', err),
    });

    serviceRef.current = service;

    // Fetch available providers on mount
    fetchProviders(config.apiUrl).then(setProviders);

    return () => {
      service.disconnect();
    };
  }, []);

  const connect = useCallback(() => serviceRef.current?.connect(), []);
  const disconnect = useCallback(() => serviceRef.current?.disconnect(), []);
  const interrupt = useCallback(() => serviceRef.current?.interrupt(), []);
  const sendText = useCallback((text: string) => serviceRef.current?.sendText(text), []);
  const getActiveProvider = useCallback(() => serviceRef.current?.getActiveProvider(), []);

  // Refresh providers list
  const refreshProviders = useCallback(async () => {
    const newProviders = await fetchProviders(config.apiUrl);
    setProviders(newProviders);
    return newProviders;
  }, [config.apiUrl]);

  return {
    state,
    transcript,
    activeProvider,
    providers,
    connect,
    disconnect,
    interrupt,
    sendText,
    getActiveProvider,
    refreshProviders,
    isConnected: state !== 'disconnected' && state !== 'error',
  };
}

// Need to import React hooks for the hook
import { useState, useRef, useEffect, useCallback } from 'react';

export default StreamingVoiceService;
