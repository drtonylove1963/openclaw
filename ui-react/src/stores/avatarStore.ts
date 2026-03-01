/**
 * Avatar Store - Zustand state management for AI Avatar
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AvatarStoreState,
  AvatarState,
  AvatarEmotion,
  AvatarConfig,
  SpeechQueueItem,
} from '../types/avatar';

const DEFAULT_CONFIG: AvatarConfig = {
  enabled: true,
  model: {
    url: '/models/pronetheia-avatar.glb',
    type: 'rpm',
    scale: 1.0,
    position: [0, -0.5, 0],
  },
  voice: {
    provider: 'web',
    voiceId: 'auto',
    language: 'en',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    // ElevenLabs settings
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    speakerBoost: true,
    model: 'eleven_turbo_v2_5',
    // Voice pipeline settings (Phase 2)
    pipeline: 'auto', // Auto-select best available pipeline
    autoPreference: 'balanced', // Balance speed and voice variety
    systemPrompt: 'You are Athena, a helpful AI assistant for the Pronetheia platform.',
  },
  camera: {
    distance: 2.5,
    verticalOffset: 0.1,
    horizontalOffset: 0,
    fov: 50,
  },
  animation: {
    idleAnimation: 'idle_breathing',
    thinkingAnimation: 'thinking_pose',
    listeningAnimation: 'listening',
    speakingGestures: true,
    blinkRate: 15,
    eyeMovementRange: 0.3,
  },
  autoSpeak: true,
  showSubtitles: true,
};

const generateSpeechId = (): string => {
  return `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useAvatarStore = create<AvatarStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      isEnabled: false,
      state: 'idle' as AvatarState,
      currentEmotion: 'neutral' as AvatarEmotion,
      isMuted: false,
      isInitialized: false,
      error: null,
      config: DEFAULT_CONFIG,
      speechQueue: [],
      currentSpeech: null,

      // Actions
      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
        if (!enabled) {
          // Reset state when disabled
          set({
            state: 'idle',
            speechQueue: [],
            currentSpeech: null,
          });
        }
      },

      setState: (state: AvatarState) => {
        set({ state });
      },

      setEmotion: (emotion: AvatarEmotion) => {
        set({ currentEmotion: emotion });
      },

      setMuted: (muted: boolean) => {
        set({ isMuted: muted });
      },

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized, error: initialized ? null : get().error });
      },

      setError: (error: string | null) => {
        set({ error });
        if (error) {
          console.error('[AvatarStore] Error:', error);
        }
      },

      updateConfig: (partialConfig: Partial<AvatarConfig>) => {
        const currentConfig = get().config;
        set({
          config: {
            ...currentConfig,
            ...partialConfig,
            // Deep merge nested objects
            model: { ...currentConfig.model, ...partialConfig.model },
            voice: { ...currentConfig.voice, ...partialConfig.voice },
            camera: { ...currentConfig.camera, ...partialConfig.camera },
            animation: { ...currentConfig.animation, ...partialConfig.animation },
          },
        });
      },

      queueSpeech: (item: Omit<SpeechQueueItem, 'id'>) => {
        const speechItem: SpeechQueueItem = {
          ...item,
          id: generateSpeechId(),
        };

        set((state) => {
          // Insert based on priority
          const queue = [...state.speechQueue];
          if (item.priority === 'high') {
            // High priority goes to front (after current high priority items)
            const firstNonHigh = queue.findIndex((i) => i.priority !== 'high');
            if (firstNonHigh === -1) {
              queue.push(speechItem);
            } else {
              queue.splice(firstNonHigh, 0, speechItem);
            }
          } else if (item.priority === 'low') {
            queue.push(speechItem);
          } else {
            // Normal priority - insert before low priority items
            const firstLow = queue.findIndex((i) => i.priority === 'low');
            if (firstLow === -1) {
              queue.push(speechItem);
            } else {
              queue.splice(firstLow, 0, speechItem);
            }
          }
          return { speechQueue: queue };
        });
      },

      clearQueue: () => {
        set({ speechQueue: [], currentSpeech: null, state: 'idle' });
      },

      setCurrentSpeech: (item: SpeechQueueItem | null) => {
        set({
          currentSpeech: item,
          state: item ? 'speaking' : 'idle',
        });

        // Remove from queue if setting current
        if (item) {
          set((state) => ({
            speechQueue: state.speechQueue.filter((i) => i.id !== item.id),
          }));
        }
      },

      reset: () => {
        set({
          state: 'idle',
          currentEmotion: 'neutral',
          error: null,
          speechQueue: [],
          currentSpeech: null,
        });
      },
    }),
    {
      name: 'pronetheia-avatar-store',
      partialize: (state) => ({
        // Only persist these fields
        isEnabled: state.isEnabled,
        isMuted: state.isMuted,
        config: state.config,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const selectAvatarEnabled = (state: AvatarStoreState) => state.isEnabled;
export const selectAvatarState = (state: AvatarStoreState) => state.state;
export const selectAvatarEmotion = (state: AvatarStoreState) => state.currentEmotion;
export const selectAvatarConfig = (state: AvatarStoreState) => state.config;
export const selectIsSpeaking = (state: AvatarStoreState) => state.state === 'speaking';
export const selectHasSpeechQueued = (state: AvatarStoreState) => state.speechQueue.length > 0;
