/**
 * Avatar Types for Pronetheia AI Avatar System
 */

// Viseme data for lip sync (Oculus standard)
export interface Viseme {
  time: number;       // Timestamp in milliseconds
  duration: number;   // Duration in milliseconds
  value: VisemeType;  // Viseme identifier
  weight: number;     // Blend weight (0-1)
}

// Oculus viseme types
export type VisemeType =
  | 'sil'   // Silence
  | 'PP'    // p, b, m
  | 'FF'    // f, v
  | 'TH'    // th
  | 'DD'    // t, d
  | 'kk'    // k, g
  | 'CH'    // ch, j, sh
  | 'SS'    // s, z
  | 'nn'    // n, l
  | 'RR'    // r
  | 'aa'    // a
  | 'E'     // e
  | 'I'     // i
  | 'O'     // o
  | 'U';    // u

// Avatar emotional states
export type AvatarEmotion =
  | 'neutral'
  | 'happy'
  | 'thinking'
  | 'concerned'
  | 'excited'
  | 'surprised'
  | 'focused';

// Avatar speaking state
export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'processing';

// TTS Provider options
export type TTSProvider = 'web' | 'headtts' | 'elevenlabs' | 'edge' | 'azure';

// Voice Pipeline Provider (unified streaming options)
export type VoicePipelineProvider =
  | 'auto'           // Auto-select best available pipeline
  | 'livekit'        // Current: LiveKit + Whisper + Kokoro (4-12s latency)
  | 'gemini_full'    // Gemini Native Audio unified (1-2s, 1 voice)
  | 'gemini_hybrid'  // Gemini STT+LLM + External TTS (1.3s, 50+ voices)
  | 'unified';       // Self-hosted Whisper+Llama+Kokoro (2-3s)

// Auto selection preference for pipeline
export type AutoSelectionPreference =
  | 'balanced'       // Best balance of speed and features
  | 'speed'          // Prioritize lowest latency
  | 'voice_variety'  // Prioritize voice selection options
  | 'self_hosted';   // Prioritize privacy (no cloud)

// Voice configuration
export interface VoiceConfig {
  provider: TTSProvider;
  voiceId: string;
  language: string;
  rate: number;      // Speech rate (0.5 - 2.0)
  pitch: number;     // Voice pitch (0.5 - 2.0)
  volume: number;    // Volume (0 - 1)
  // ElevenLabs-specific settings
  stability: number;        // Voice stability (0 - 1), default 0.5
  similarityBoost: number;  // Similarity boost (0 - 1), default 0.75
  style: number;            // Style exaggeration (0 - 1), default 0
  speakerBoost: boolean;    // Use speaker boost, default true
  model: string;            // Model ID for ElevenLabs
  // Unified voice pipeline settings
  pipeline: VoicePipelineProvider;  // Which voice pipeline to use
  autoPreference?: AutoSelectionPreference; // Preference for auto pipeline selection
  systemPrompt?: string;            // System prompt for Gemini/LLM
}

// Avatar model configuration
export interface AvatarModelConfig {
  url: string;                    // GLB/VRM model URL
  type: 'rpm' | 'vrm' | 'custom'; // Ready Player Me, VRM, or custom
  scale: number;                  // Model scale
  position: [number, number, number];
}

// Camera configuration
export interface CameraConfig {
  distance: number;
  verticalOffset: number;
  horizontalOffset: number;
  fov: number;
}

// Animation configuration
export interface AnimationConfig {
  idleAnimation: string;
  thinkingAnimation: string;
  listeningAnimation: string;
  speakingGestures: boolean;
  blinkRate: number;        // Blinks per minute
  eyeMovementRange: number; // How much eyes move
}

// Full avatar configuration
export interface AvatarConfig {
  enabled: boolean;
  model: AvatarModelConfig;
  voice: VoiceConfig;
  camera: CameraConfig;
  animation: AnimationConfig;
  autoSpeak: boolean;       // Automatically speak agent responses
  showSubtitles: boolean;   // Show text while speaking
}

// TTS synthesis result
export interface TTSSynthesisResult {
  audio: AudioBuffer | Blob;
  visemes: Viseme[];
  duration: number;         // Total duration in ms
  wordTimings?: WordTiming[];
}

// Word timing for subtitle sync
export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

// Speech queue item
export interface SpeechQueueItem {
  id: string;
  text: string;
  emotion?: AvatarEmotion;
  priority: 'high' | 'normal' | 'low';
  onStart?: () => void;
  onEnd?: () => void;
}

// Avatar store state
export interface AvatarStoreState {
  // State
  isEnabled: boolean;
  state: AvatarState;
  currentEmotion: AvatarEmotion;
  isMuted: boolean;
  isInitialized: boolean;
  error: string | null;

  // Configuration
  config: AvatarConfig;

  // Speech queue
  speechQueue: SpeechQueueItem[];
  currentSpeech: SpeechQueueItem | null;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setState: (state: AvatarState) => void;
  setEmotion: (emotion: AvatarEmotion) => void;
  setMuted: (muted: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  updateConfig: (config: Partial<AvatarConfig>) => void;
  queueSpeech: (item: Omit<SpeechQueueItem, 'id'>) => void;
  clearQueue: () => void;
  setCurrentSpeech: (item: SpeechQueueItem | null) => void;
  reset: () => void;
}

// Global window interface extension
declare global {
  interface Window {
    pronetheliaAvatar?: {
      // Core TTS control
      speak: (text: string, emotion?: AvatarEmotion) => Promise<void>;
      stop: () => void;
      setEmotion: (emotion: AvatarEmotion) => void;
      getState: () => AvatarState;
      isReady: () => boolean;
      // Immediate barge-in (<50ms latency)
      bargeIn: () => void;
      // Realtime VAD control for immediate barge-in
      startRealtimeVAD?: () => Promise<void>;
      stopRealtimeVAD?: () => void;
      isRealtimeVADActive?: () => boolean;
      getVADThreshold?: () => number;
      setVADThreshold?: (threshold: number) => void;
      calibrateVAD?: () => Promise<number>;
      // Voice control (when LiveKit enabled)
      startListening?: () => Promise<void>;
      stopListening?: () => Promise<void>;
      isListening?: () => boolean;
      isVoiceConnected?: () => boolean;
    };
  }
}


