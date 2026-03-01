import { create } from 'zustand';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'complete' | 'error';

interface VoiceState {
  // State machine
  orbState: OrbState;
  previousOrbState: OrbState | null;

  // Connection
  isConnected: boolean;
  isConnecting: boolean;

  // Transcript
  partialTranscript: string;
  userTranscript: string;
  assistantResponse: string;

  // Audio
  audioLevel: number;
  isMuted: boolean;

  // Settings
  wakeWordEnabled: boolean;
  wakeWordSensitivity: 'low' | 'medium' | 'high';
  isAlwaysListening: boolean;
  autoClose: boolean;
  autoCloseDelay: number;
  audioFeedback: boolean;

  // Overlay
  isOverlayOpen: boolean;

  // Error
  lastError: string | null;
}

interface VoiceActions {
  startListening: () => void;
  stopListening: () => void;
  setOrbState: (state: OrbState) => void;
  setUserTranscript: (text: string) => void;
  setPartialTranscript: (text: string) => void;
  setAssistantResponse: (text: string) => void;
  setAudioLevel: (level: number) => void;
  replay: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  setWakeWordEnabled: (enabled: boolean) => void;
  setWakeWordSensitivity: (sensitivity: 'low' | 'medium' | 'high') => void;
  setAlwaysListening: (enabled: boolean) => void;
  setAutoClose: (enabled: boolean) => void;
  setAutoCloseDelay: (delay: number) => void;
  setAudioFeedback: (enabled: boolean) => void;
  openOverlay: () => void;
  closeOverlay: () => void;
  toggleOverlay: () => void;
  setError: (error: string | null) => void;
  cancelInteraction: () => void;
}

export const useVoiceStore = create<VoiceState & VoiceActions>()((set, get) => ({
  // State machine
  orbState: 'idle',
  previousOrbState: null,

  // Connection
  isConnected: false,
  isConnecting: false,

  // Transcript
  partialTranscript: '',
  userTranscript: '',
  assistantResponse: '',

  // Audio
  audioLevel: 0,
  isMuted: false,

  // Settings
  wakeWordEnabled: false,
  wakeWordSensitivity: 'medium',
  isAlwaysListening: false,
  autoClose: true,
  autoCloseDelay: 10000,
  audioFeedback: true,

  // Overlay
  isOverlayOpen: false,

  // Error
  lastError: null,

  // Actions
  startListening: () => set(state => ({
    orbState: 'listening',
    previousOrbState: state.orbState,
    userTranscript: '',
    partialTranscript: '',
    lastError: null,
  })),

  stopListening: () => set(state => ({
    orbState: 'idle',
    previousOrbState: state.orbState,
    audioLevel: 0,
  })),

  setOrbState: (orbState) => set(state => ({
    orbState,
    previousOrbState: state.orbState,
  })),

  setUserTranscript: (text) => set({ userTranscript: text }),
  setPartialTranscript: (text) => set({ partialTranscript: text }),
  setAssistantResponse: (text) => set({ assistantResponse: text }),
  setAudioLevel: (level) => set({ audioLevel: Math.max(0, Math.min(1, level)) }),

  replay: () => {
    const { assistantResponse } = get();
    if (!assistantResponse) {return;}
    set(state => ({
      orbState: 'speaking',
      previousOrbState: state.orbState,
    }));
    // Real implementation will send text to Kokoro TTS for re-synthesis
  },

  // Connection is managed by useLiveKitVoice hook, not the store.
  // These actions only update UI state flags for components that read them.
  connect: async () => {
    set({ isConnecting: true, orbState: 'connecting', lastError: null });
  },

  disconnect: () => {
    set({
      isConnected: false,
      isConnecting: false,
      orbState: 'idle',
      previousOrbState: null,
      audioLevel: 0,
    });
  },

  toggleMute: () => set(state => ({ isMuted: !state.isMuted })),

  setWakeWordEnabled: (enabled) => set({ wakeWordEnabled: enabled }),
  setWakeWordSensitivity: (sensitivity) => set({ wakeWordSensitivity: sensitivity }),
  setAlwaysListening: (enabled) => set({ isAlwaysListening: enabled }),
  setAutoClose: (enabled) => set({ autoClose: enabled }),
  setAutoCloseDelay: (delay) => set({ autoCloseDelay: delay }),
  setAudioFeedback: (enabled) => set({ audioFeedback: enabled }),

  openOverlay: () => set({ isOverlayOpen: true }),
  closeOverlay: () => set({
    isOverlayOpen: false,
    orbState: 'idle',
    audioLevel: 0,
  }),
  toggleOverlay: () => set(state => {
    if (state.isOverlayOpen) {
      return { isOverlayOpen: false, orbState: 'idle', audioLevel: 0 };
    }
    return { isOverlayOpen: true };
  }),

  setError: (error) => set(state => ({
    lastError: error,
    orbState: error ? 'error' : state.orbState,
  })),

  cancelInteraction: () => set({
    orbState: 'idle',
    previousOrbState: null,
    userTranscript: '',
    assistantResponse: '',
    partialTranscript: '',
    audioLevel: 0,
    lastError: null,
  }),
}));
