/**
 * LiveKitVoiceService - Real-time voice communication using LiveKit
 *
 * Provides WebRTC-based voice streaming for:
 * - Real-time speech-to-text with Whisper backend
 * - Low-latency text-to-speech with Kokoro
 * - Voice Activity Detection (Silero VAD)
 *
 * Inspired by: https://github.com/ShayneP/local-voice-ai
 */

import {
  Room,
  RoomEvent,
  Track,
  LocalAudioTrack,
  RemoteTrack,
  RemoteTrackPublication,
  Participant,
  ConnectionState,
  createLocalAudioTrack,
} from 'livekit-client';

export interface LiveKitConfig {
  /** Room name for voice session */
  roomName?: string;
  /** API endpoint for connection details (returns serverUrl + token) */
  connectionDetailsEndpoint?: string;
}

export interface TranscriptEvent {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp: number;
}

export interface VADEvent {
  isSpeaking: boolean;
  probability: number;
  timestamp: number;
}

export interface VoiceServiceCallbacks {
  onTranscript?: (event: TranscriptEvent) => void;
  onVAD?: (event: VADEvent) => void;
  onAgentSpeaking?: (isSpeaking: boolean) => void;
  onAgentResponse?: (text: string) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

export type VoiceServiceState = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'processing' | 'speaking';

export class LiveKitVoiceService {
  private room: Room | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private agentAudioElement: HTMLAudioElement | null = null;
  private config: LiveKitConfig;
  private callbacks: VoiceServiceCallbacks = {};
  private state: VoiceServiceState = 'disconnected';
  private isListening = false;
  private reconnectAttempts = 0;
  private connectPromise: Promise<void> | null = null;

  constructor(config: LiveKitConfig) {
    this.config = {
      roomName: config.roomName || 'athena-voice',
      connectionDetailsEndpoint: config.connectionDetailsEndpoint || '/api/v1/voice/connection-details',
    };
  }

  /**
   * Set callbacks for voice events
   */
  setCallbacks(callbacks: VoiceServiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current connection state
   */
  getState(): VoiceServiceState {
    return this.state;
  }

  /**
   * Update server configuration (useful when config changes at runtime)
   */
  updateConfig(config: Partial<LiveKitConfig>): void {
    if (config.roomName) {this.config.roomName = config.roomName;}
    if (config.connectionDetailsEndpoint) {this.config.connectionDetailsEndpoint = config.connectionDetailsEndpoint;}
  }

  /**
   * Connect to LiveKit room
   */
  async connect(): Promise<void> {
    if (this.room?.state === ConnectionState.Connected) {
      console.log('[LiveKitVoice] Already connected');
      return;
    }

    // Prevent concurrent connect calls — return existing promise if connecting
    if (this.connectPromise) {
      console.log('[LiveKitVoice] Connection already in progress, waiting...');
      return this.connectPromise;
    }

    this.connectPromise = this._doConnect();
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async _doConnect(): Promise<void> {
    // Clean up any existing room first
    if (this.room) {
      try { this.room.disconnect(); } catch { /* ignore */ }
      this.room = null;
    }

    this.setState('connecting');

    try {
      // Get connection details from backend (serverUrl + token)
      const { serverUrl, token } = await this.fetchConnectionDetails();

      // Create room with optimized settings for voice
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up event handlers
      this.setupRoomEvents();

      console.log('[LiveKitVoice] Connecting to:', serverUrl, 'room:', this.config.roomName);

      // Connect to room
      await this.room.connect(serverUrl, token);

      this.setState('connected');
      this.reconnectAttempts = 0;

      console.log('[LiveKitVoice] Connected to room:', this.config.roomName);
    } catch (error) {
      this.setState('disconnected');
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from LiveKit room
   */
  async disconnect(): Promise<void> {
    if (!this.room) {return;}

    await this.stopListening();

    // Clean up agent audio element
    if (this.agentAudioElement) {
      this.agentAudioElement.srcObject = null;
      this.agentAudioElement.remove();
      this.agentAudioElement = null;
    }

    this.room.disconnect();
    this.room = null;
    this.setState('disconnected');

    console.log('[LiveKitVoice] Disconnected');
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    if (!this.room || this.isListening) {return;}

    try {
      // Create local audio track from microphone
      this.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      // Publish track to room
      await this.room.localParticipant.publishTrack(this.localAudioTrack);

      this.isListening = true;
      this.setState('listening');

      console.log('[LiveKitVoice] Started listening');
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop listening for voice input
   */
  async stopListening(): Promise<void> {
    if (!this.localAudioTrack) {return;}

    // Unpublish and stop track
    if (this.room) {
      try {
        await this.room.localParticipant.unpublishTrack(this.localAudioTrack);
      } catch {
        // Room may have disconnected; ignore unpublish errors
      }
    }

    this.localAudioTrack.stop();
    this.localAudioTrack = null;
    this.isListening = false;
    this.setState('connected');

    console.log('[LiveKitVoice] Stopped listening');
  }

  /**
   * Toggle listening state
   */
  async toggleListening(): Promise<void> {
    if (this.isListening) {
      await this.stopListening();
    } else {
      await this.startListening();
    }
  }

  /**
   * Send text message to agent (for typed input)
   */
  async sendMessage(text: string): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: 'text', content: text }));

    await this.room.localParticipant.publishData(data, { reliable: true });

    console.log('[LiveKitVoice] Sent message:', text);
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }

  // Private methods

  private setState(state: VoiceServiceState): void {
    this.state = state;
    if (this.room) {
      this.callbacks.onConnectionStateChange?.(this.room.state);
    }
  }

  private async fetchConnectionDetails(): Promise<{ serverUrl: string; token: string }> {
    const endpoint = this.config.connectionDetailsEndpoint || '/api/v1/voice/connection-details';
    const url = `${endpoint}?room_name=${encodeURIComponent(this.config.roomName || 'athena-voice')}`;

    // Build request headers — include auth token so the backend knows the user
    // and grants publish permissions (guests get subscribe-only).
    const headers: Record<string, string> = {};
    const authToken = localStorage.getItem('pronetheia_token');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      headers,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to get connection details: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      serverUrl: data.serverUrl,
      token: data.participantToken,
    };
  }

  private setupRoomEvents(): void {
    if (!this.room) {return;}

    // Connection state changes
    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      console.log('[LiveKitVoice] Connection state:', state);
      this.callbacks.onConnectionStateChange?.(state);

      // Only handle final disconnect — LiveKit SDK handles reconnection internally.
      // ConnectionState.Reconnecting means the SDK is already trying to recover.
      if (state === ConnectionState.Disconnected) {
        this.setState('disconnected');
        this.isListening = false;
        this.localAudioTrack = null;
      }
    });

    // Data received from agent
    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant) => {
      this.handleDataReceived(payload, participant);
    });

    // Agent audio track subscribed
    this.room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, publication: RemoteTrackPublication, participant: Participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity.startsWith('agent')) {
          this.handleAgentAudio(track);
        }
      }
    );

    // Transcription events from LiveKit Agents SDK
    // Both user speech transcripts and agent response text arrive here
    this.room.on(
      RoomEvent.TranscriptionReceived,
      (segments: any[], participant?: Participant) => {
        for (const segment of segments) {
          if (!segment.text) {continue;}

          const isAgent = participant?.identity?.startsWith('agent') ?? false;

          if (isAgent) {
            this.callbacks.onAgentResponse?.(segment.text);
          } else {
            this.callbacks.onTranscript?.({
              text: segment.text,
              isFinal: segment.final ?? true,
              confidence: 1.0,
              timestamp: Date.now(),
            });
          }
        }
      }
    );

    // Agent started/stopped speaking
    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
      const agentSpeaking = speakers.some((s) => s.identity.startsWith('agent'));
      this.callbacks.onAgentSpeaking?.(agentSpeaking);

      if (agentSpeaking) {
        this.setState('speaking');
      } else if (this.isListening) {
        this.setState('listening');
      } else {
        this.setState('connected');
      }
    });
  }

  private handleDataReceived(payload: Uint8Array, participant?: Participant): void {
    try {
      const decoder = new TextDecoder();
      const message = JSON.parse(decoder.decode(payload));

      switch (message.type) {
        case 'transcript':
          this.callbacks.onTranscript?.({
            text: message.text,
            isFinal: message.isFinal ?? true,
            confidence: message.confidence,
            timestamp: Date.now(),
          });
          break;

        case 'vad':
          this.callbacks.onVAD?.({
            isSpeaking: message.isSpeaking,
            probability: message.probability,
            timestamp: Date.now(),
          });
          break;

        case 'processing':
          this.setState('processing');
          break;

        default:
          console.log('[LiveKitVoice] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[LiveKitVoice] Failed to parse data:', error);
    }
  }

  private handleAgentAudio(track: RemoteTrack): void {
    // Clean up previous audio element
    if (this.agentAudioElement) {
      this.agentAudioElement.srcObject = null;
      this.agentAudioElement.remove();
    }

    // Attach track to audio element for playback
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    track.attach(audioElement);
    this.agentAudioElement = audioElement;

    console.log('[LiveKitVoice] Agent audio track attached');
  }

  /**
   * Attempt to reconnect after a disconnect.
   * Called explicitly by user action, not automatically — LiveKit SDK handles
   * its own internal reconnection. This is for when the SDK gives up.
   */
  async reconnect(): Promise<void> {
    console.log('[LiveKitVoice] Manual reconnect requested');
    this.reconnectAttempts = 0;
    await this.connect();
  }
}

// Singleton instance
let _instance: LiveKitVoiceService | null = null;

export function getLiveKitVoiceService(config?: LiveKitConfig): LiveKitVoiceService {
  if (!_instance && config) {
    _instance = new LiveKitVoiceService(config);
  } else if (_instance && config) {
    // Update config if instance already exists (e.g., different page with different room)
    _instance.updateConfig(config);
  }
  if (!_instance) {
    // Auto-initialize with defaults
    _instance = new LiveKitVoiceService({});
  }
  return _instance;
}

export default LiveKitVoiceService;
