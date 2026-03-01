/**
 * AIAvatar - Pulsating Logo Avatar with Voice Sync & Barge-In Support
 *
 * Renders a pulsating logo that syncs with AI voice responses.
 * Supports real-time voice with LiveKit and barge-in interruption.
 *
 * Features:
 * - HeadTTS/Kokoro for text-to-speech
 * - LiveKit WebRTC for real-time voice
 * - Real-time VAD for <50ms barge-in latency
 * - Barge-in: interrupt Athena by speaking (immediate response)
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAvatarStore, selectAvatarEnabled, selectAvatarState, selectAvatarConfig } from '../../stores/avatarStore';
import { AvatarControls } from './AvatarControls';
import { AvatarStatus } from './AvatarStatus';
import { useLiveKitVoice } from '../../hooks/useLiveKitVoice';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { useRealtimeVAD } from '../../hooks/useRealtimeVAD';
import type { AvatarEmotion, SpeechQueueItem } from '../../types/avatar';
import { COLORS } from '../../styles/colors';

interface AIAvatarProps {
  className?: string;
  style?: React.CSSProperties;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onUserTranscript?: (text: string) => void;
  logoSrc?: string;
  /** Enable LiveKit real-time voice (requires voice services) */
  enableLiveKit?: boolean;
  /** Enable barge-in (interrupt by speaking) */
  enableBargeIn?: boolean;
}

// TTS options interface
interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  // ElevenLabs-specific
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
  model?: string;
}

// HeadTTS instance type
interface HeadTTSInstance {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  getAudioContext: () => AudioContext | null;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  className,
  style,
  onSpeechStart,
  onSpeechEnd,
  onUserTranscript,
  logoSrc = '/icon-512.png',
  enableLiveKit = false,
  enableBargeIn = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ttsRef = useRef<HeadTTSInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechQueueRef = useRef<SpeechQueueItem[]>([]);
  const isSpeakingRef = useRef(false);
  const speakingStartedAtRef = useRef<number>(0); // Track when TTS started for echo guard
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); // Track current audio for immediate stop

  const isEnabled = useAvatarStore(selectAvatarEnabled);
  const avatarState = useAvatarStore(selectAvatarState);
  const config = useAvatarStore(selectAvatarConfig);

  const {
    setState,
    setEmotion,
    setInitialized,
    setError,
    setCurrentSpeech,
    speechQueue,
    currentSpeech,
    isMuted,
  } = useAvatarStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);
  const [pulseOpacity, setPulseOpacity] = useState(0.3);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');

  // Voice command execution
  const { executeCommand, isExecuting: isCommandExecuting } = useVoiceCommands();

  // =========================================================================
  // IMMEDIATE BARGE-IN: Interrupt Athena when user starts speaking (<50ms)
  // =========================================================================
  const handleImmediateBargeIn = useCallback(() => {
    if (!enableBargeIn) {return;}

    // IMMEDIATELY stop audio - no cooldown, no checks, just stop
    const wasPlaying = isSpeakingRef.current || avatarState === 'speaking';

    // Echo guard: suppress barge-in for the entire TTS duration.
    // The mic picks up speaker output and the RMS-based VAD can't distinguish
    // it from actual user speech. Browser echoCancellation is insufficient.
    // User can still stop speech via the mute/avatar button.
    if (wasPlaying && speakingStartedAtRef.current > 0) {
      return; // Suppress echo-triggered barge-in during TTS playback
    }

    if (wasPlaying) {
      console.log('[AIAvatar] IMMEDIATE barge-in! Stopping audio NOW');
      const startTime = performance.now();

      // 1. Stop current HTML audio element immediately (if ElevenLabs/Kokoro)
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
        currentAudioRef.current = null;
      }

      // 2. Stop TTS via ref
      if (ttsRef.current) {
        ttsRef.current.stop();
      }

      // 3. Clear speech queue
      useAvatarStore.getState().clearQueue();
      speechQueueRef.current = [];

      // 4. Update state
      isSpeakingRef.current = false;
      speakingStartedAtRef.current = 0;
      setCurrentSpeech(null);
      setState('listening');

      const elapsed = performance.now() - startTime;
      console.log(`[AIAvatar] Barge-in completed in ${elapsed.toFixed(2)}ms`);

      // 5. Notify backend (non-blocking) - don't await
      fetch('/api/voice/interrupt', { method: 'POST' }).catch(() => {
        // Ignore errors - backend notification is best-effort
      });
    }
  }, [enableBargeIn, avatarState, setState, setCurrentSpeech]);

  // Real-time VAD for immediate barge-in detection
  const realtimeVAD = useRealtimeVAD({
    threshold: 0.015, // Tune based on testing
    autoCalibrate: true,
    speechStartDelay: 30, // Very short - we want fast response
    silenceEndDelay: 300,
    onSpeechStart: () => {
      console.log('[AIAvatar] User started speaking (realtime VAD)');
      setIsUserSpeaking(true);
    },
    onSpeechEnd: () => {
      console.log('[AIAvatar] User stopped speaking (realtime VAD)');
      setIsUserSpeaking(false);
    },
    onBargeIn: handleImmediateBargeIn, // IMMEDIATE callback - no delay!
    onRMSUpdate: (rms) => {
      // Optional: use for visualization
      // console.log('[AIAvatar] RMS:', rms.toFixed(4));
    },
  });

  // Handle VAD (Voice Activity Detection) events from LiveKit (fallback)
  const handleVAD = useCallback((isSpeaking: boolean) => {
    setIsUserSpeaking(isSpeaking);

    // LiveKit VAD is slower (~500ms), but use it as backup
    if (isSpeaking && !realtimeVAD.isListening) {
      handleImmediateBargeIn();
    }
  }, [handleImmediateBargeIn, realtimeVAD.isListening]);

  // Handle transcript from LiveKit/Whisper
  const handleTranscript = useCallback(async (text: string, isFinal: boolean) => {
    if (isFinal && text.trim()) {
      setUserTranscript(text);
      onUserTranscript?.(text);

      // Execute the voice command
      console.log('[AIAvatar] Executing voice command:', text);

      try {
        setState('processing');
        const result = await executeCommand(text);

        // Update state based on result
        if (result.success) {
          setState('idle');
        } else {
          setState('idle');
          console.warn('[AIAvatar] Command execution failed:', result.error);
        }

        // Clear transcript after processing
        setTimeout(() => {
          setUserTranscript('');
        }, 3000);

      } catch (err) {
        console.error('[AIAvatar] Voice command execution error:', err);
        setState('idle');
      }
    }
  }, [onUserTranscript, executeCommand, setState]);

  // LiveKit voice hook (only if enabled)
  const liveKit = useLiveKitVoice(enableLiveKit ? {
    autoConnect: true,
    onTranscript: handleTranscript,
    onVAD: handleVAD,
    onAgentSpeaking: (speaking) => {
      if (speaking) {
        setState('speaking');
      }
    },
    onError: (err) => {
      console.error('[AIAvatar] LiveKit error:', err);
    },
  } : {});

  // Initialize HeadTTS
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const initTTS = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create audio context for amplitude analysis
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;

        // Select TTS provider based on config
        const provider = config.voice.provider;
        console.log('[AIAvatar] Using TTS provider:', provider);

        if (provider === 'elevenlabs') {
          // Use ElevenLabs TTS with audio ref for immediate barge-in
          ttsRef.current = createElevenLabsTTS(audioContextRef.current, currentAudioRef);
          console.log('[AIAvatar] ElevenLabs TTS initialized with barge-in support');
        } else if (provider === 'headtts') {
          // Try to load HeadTTS
          try {
            const { loadHeadTTS } = await import('../../lib/headtts-loader');
            const HeadTTS = await loadHeadTTS();
            if (HeadTTS) {
              ttsRef.current = new HeadTTS({
                audioContext: audioContextRef.current,
              });
              console.log('[AIAvatar] HeadTTS initialized');
            } else {
              throw new Error('HeadTTS not available');
            }
          } catch {
            console.log('[AIAvatar] HeadTTS not available, falling back to Web Speech API');
            ttsRef.current = createWebSpeechTTS(audioContextRef.current);
          }
        } else {
          // Default to Web Speech API
          ttsRef.current = createWebSpeechTTS(audioContextRef.current);
          console.log('[AIAvatar] Web Speech API initialized');
        }

        setInitialized(true);
        setIsLoading(false);
        setState('idle');

        console.log('[AIAvatar] Pulsating logo avatar initialized');

        // Start realtime VAD for immediate barge-in (if barge-in enabled)
        if (enableBargeIn) {
          console.log('[AIAvatar] Starting realtime VAD for immediate barge-in...');
          realtimeVAD.start().catch((err) => {
            console.warn('[AIAvatar] Realtime VAD failed to start:', err);
            // Not critical - LiveKit VAD will still work as fallback
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize avatar';
        setError(message);
        setIsLoading(false);
        console.error('[AIAvatar] Initialization error:', err);
      }
    };

    initTTS();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // Stop realtime VAD
      realtimeVAD.stop();
      setInitialized(false);
    };
  }, [isEnabled, config.voice.provider, enableBargeIn]);

  // Amplitude-based pulsation animation
  const updatePulse = useCallback(() => {
    if (!analyserRef.current || !isSpeakingRef.current) {
      // Idle state - gentle breathing animation
      const time = Date.now() / 1000;
      const breathe = Math.sin(time * 1.5) * 0.03 + 1;
      setPulseScale(breathe);
      setPulseOpacity(0.3);
      animationFrameRef.current = requestAnimationFrame(updatePulse);
      return;
    }

    // Speaking state - sync with audio amplitude
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const normalizedAmplitude = average / 255;

    // Map amplitude to scale (1.0 to 1.4) and opacity (0.3 to 0.8)
    const targetScale = 1 + normalizedAmplitude * 0.4;
    const targetOpacity = 0.3 + normalizedAmplitude * 0.5;

    setPulseScale(targetScale);
    setPulseOpacity(targetOpacity);

    animationFrameRef.current = requestAnimationFrame(updatePulse);
  }, []);

  // Start animation loop
  useEffect(() => {
    if (isEnabled && !isLoading) {
      animationFrameRef.current = requestAnimationFrame(updatePulse);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEnabled, isLoading, updatePulse]);

  // Process speech queue
  const processNextSpeech = useCallback(async () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) {
      return;
    }

    // Don't dequeue if TTS isn't initialized yet - retry shortly
    if (!ttsRef.current) {
      setTimeout(processNextSpeech, 200);
      return;
    }

    const nextItem = speechQueueRef.current.shift();
    if (!nextItem) {
      return;
    }

    isSpeakingRef.current = true;
    speakingStartedAtRef.current = performance.now();
    setCurrentSpeech(nextItem);
    setState('speaking');

    try {
      if (nextItem.emotion) {
        setEmotion(nextItem.emotion);
      }

      nextItem.onStart?.();
      onSpeechStart?.();

      if (!isMuted) {
        await ttsRef.current.speak(nextItem.text, {
          voice: config.voice.voiceId,
          rate: config.voice.rate,
          pitch: config.voice.pitch,
          // ElevenLabs-specific settings
          stability: config.voice.stability,
          similarityBoost: config.voice.similarityBoost,
          style: config.voice.style,
          speakerBoost: config.voice.speakerBoost,
          model: config.voice.model,
        });
      }

      nextItem.onEnd?.();
      onSpeechEnd?.();
    } catch (err) {
      console.error('[AIAvatar] Speech error:', err);
    } finally {
      isSpeakingRef.current = false;
      speakingStartedAtRef.current = 0;
      setCurrentSpeech(null);

      // Check for more items in queue
      if (speechQueueRef.current.length > 0) {
        // Minimal delay for fluid streaming - just enough to prevent overlap
        setTimeout(processNextSpeech, 50);
      } else {
        // Only go idle when queue is empty
        setState('idle');
      }
    }
  }, [config.voice, isMuted, onSpeechStart, onSpeechEnd, setCurrentSpeech, setEmotion, setState]);

  // Sync speech queue from store
  useEffect(() => {
    speechQueueRef.current = [...speechQueue];
    if (!isSpeakingRef.current && speechQueue.length > 0) {
      processNextSpeech();
    }
  }, [speechQueue, processNextSpeech]);

  // Expose global API for chat integration
  useEffect(() => {
    const speak = async (text: string, emotion?: AvatarEmotion): Promise<void> => {
      return new Promise((resolve) => {
        useAvatarStore.getState().queueSpeech({
          text,
          emotion,
          priority: 'normal',
          onEnd: () => resolve(),
        });
      });
    };

    const stop = () => {
      if (ttsRef.current) {
        ttsRef.current.stop();
      }
      useAvatarStore.getState().clearQueue();
      isSpeakingRef.current = false;
      setState('idle');
    };

    const setEmotionFn = (emotion: AvatarEmotion) => {
      setEmotion(emotion);
    };

    const getState = () => useAvatarStore.getState().state;
    const isReady = () => ttsRef.current !== null;

    // Extended API with barge-in and voice control
    window.pronetheliaAvatar = {
      speak,
      stop,
      setEmotion: setEmotionFn,
      getState,
      isReady,
      // Immediate barge-in (<50ms)
      bargeIn: handleImmediateBargeIn,
      // Realtime VAD control
      startRealtimeVAD: realtimeVAD.start,
      stopRealtimeVAD: realtimeVAD.stop,
      isRealtimeVADActive: () => realtimeVAD.isListening,
      getVADThreshold: () => realtimeVAD.currentThreshold,
      setVADThreshold: realtimeVAD.setThreshold,
      calibrateVAD: realtimeVAD.calibrate,
      // Voice control (if LiveKit enabled)
      startListening: enableLiveKit ? liveKit.startListening : undefined,
      stopListening: enableLiveKit ? liveKit.stopListening : undefined,
      isListening: enableLiveKit ? () => liveKit.isListening : undefined,
      isVoiceConnected: enableLiveKit ? () => liveKit.isConnected : undefined,
    };

    return () => {
      delete window.pronetheliaAvatar;
    };
  }, [setEmotion, setState, handleImmediateBargeIn, enableLiveKit, liveKit, realtimeVAD]);

  if (!isEnabled) {
    return null;
  }

  // Get color based on state
  const getStateColor = () => {
    switch (avatarState) {
      case 'speaking': return '#10b981'; // Green
      case 'listening': return '#3b82f6'; // Blue
      case 'thinking': return '#f59e0b'; // Amber
      case 'processing': return '#8b5cf6'; // Purple
      default: return '#6b7280'; // Gray
    }
  };

  return (
    <div ref={containerRef} style={{ ...styles.container, ...style }} className={className}>
      {/* Pulsating Logo */}
      <div style={styles.logoWrapper}>
        {isLoading ? (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <span style={styles.loadingText}>Initializing...</span>
          </div>
        ) : (
          <>
            {/* Outer pulse ring */}
            <div
              style={{
                ...styles.pulseRing,
                transform: `scale(${pulseScale * 1.2})`,
                opacity: pulseOpacity * 0.5,
                borderColor: getStateColor(),
              }}
            />
            {/* Inner pulse ring */}
            <div
              style={{
                ...styles.pulseRing,
                transform: `scale(${pulseScale})`,
                opacity: pulseOpacity,
                borderColor: getStateColor(),
              }}
            />
            {/* Logo container with glow */}
            <div
              style={{
                ...styles.logoContainer,
                transform: `scale(${pulseScale})`,
                boxShadow: `0 0 ${30 * pulseScale}px ${10 * pulseScale}px ${getStateColor()}40`,
              }}
            >
              <img
                src={logoSrc}
                alt="AI Avatar"
                style={styles.logo}
                onError={(e) => {
                  // Fallback to text if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Fallback icon if image fails */}
              <div style={styles.fallbackIcon}>
                <AthenaIcon color={getStateColor()} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Speaking Indicator (Barge-In Active) */}
      {isUserSpeaking && (
        <div style={styles.userSpeakingIndicator}>
          <MicrophoneIcon active />
          <span>Listening to you...</span>
        </div>
      )}

      {/* Realtime VAD Status (dev mode indicator) */}
      {enableBargeIn && realtimeVAD.isListening && (
        <div style={{
          ...styles.vadIndicator,
          backgroundColor: realtimeVAD.isSpeaking ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.7)',
        }}>
          <div style={{
            ...styles.vadBar,
            width: `${Math.min(realtimeVAD.currentRMS * 500, 100)}%`,
          }} />
          <span style={styles.vadLabel}>
            {realtimeVAD.isSpeaking ? 'Speaking' : 'VAD Active'}
          </span>
        </div>
      )}

      {/* Status Indicator */}
      <AvatarStatus
        state={avatarState}
        currentText={currentSpeech?.text}
        showSubtitles={config.showSubtitles}
      />

      {/* User Transcript (what you said) */}
      {userTranscript && avatarState === 'listening' && (
        <div style={styles.userTranscript}>
          <span style={styles.userTranscriptLabel}>You:</span> {userTranscript}
        </div>
      )}

      {/* Microphone Button (Push-to-Talk or Toggle) */}
      {enableLiveKit && (
        <button
          style={{
            ...styles.micButton,
            backgroundColor: liveKit.isListening ? '#ef4444' : 'rgba(0, 0, 0, 0.5)',
            borderColor: liveKit.isListening ? '#ef4444' : 'transparent',
          }}
          onClick={() => liveKit.toggleListening()}
          onMouseDown={() => {
            // Push-to-talk: start on mouse down
            if (!liveKit.isListening) {
              liveKit.startListening();
            }
          }}
          onMouseUp={() => {
            // Push-to-talk: stop on mouse up (optional - comment out for toggle mode)
            // liveKit.stopListening();
          }}
          title={liveKit.isListening ? 'Stop listening' : 'Start listening (or hold to talk)'}
        >
          <MicrophoneIcon active={liveKit.isListening} />
        </button>
      )}

      {/* LiveKit Connection Status */}
      {enableLiveKit && (
        <div style={{
          ...styles.connectionStatus,
          color: liveKit.isConnected ? '#10b981' : '#ef4444',
        }}>
          <span style={{
            ...styles.connectionDot,
            backgroundColor: liveKit.isConnected ? '#10b981' : '#ef4444',
          }} />
          {liveKit.isConnected ? 'Voice Connected' : 'Voice Disconnected'}
        </div>
      )}

      {/* Controls Toggle */}
      <button
        style={styles.controlsToggle}
        onClick={() => setShowControls(!showControls)}
        title="Avatar Settings"
      >
        <SettingsIcon />
      </button>

      {/* Controls Panel */}
      {showControls && (
        <AvatarControls onClose={() => setShowControls(false)} />
      )}
    </div>
  );
};

// ElevenLabs TTS implementation
// Note: currentAudioRef is passed in for immediate barge-in support
function createElevenLabsTTS(
  audioContext: AudioContext,
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>
): HeadTTSInstance {
  let currentAudio: HTMLAudioElement | null = null;

  // Get API key from environment or localStorage
  const getApiKey = (): string | null => {
    // Try environment variable first
    const envKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (envKey) {return envKey;}

    // Fall back to localStorage (for user-configured keys)
    return localStorage.getItem('elevenlabs_api_key');
  };

  // Default voice IDs for ElevenLabs
  const DEFAULT_VOICES = {
    rachel: '21m00Tcm4TlvDq8ikWAM', // Rachel - calm, professional
    domi: 'AZnzlk1XvdvUeBnXmlld',   // Domi - strong, confident
    bella: 'EXAVITQu4vr4xnSDxMaL',  // Bella - soft, gentle
    elli: 'MF3mGyEYCl7XYWbV9V6O',   // Elli - young, friendly
    josh: 'TxGEqnHWrfWFTfGW9XjX',   // Josh - deep, narrative
    arnold: 'VR6AewLTigWG4xSOukaG', // Arnold - crisp, articulate
    charlotte: 'XB0fDUnXU5powFXDhCwa', // Charlotte - warm, British
    matilda: 'XrExE9yKIg1WjnnlVkGX', // Matilda - friendly, warm
  };

  return {
    speak: async (text: string, options?: TTSOptions) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        // No local API key - try backend TTS endpoint (uses DB-stored key)
        console.log('[ElevenLabsTTS] No local API key, trying backend /api/v1/voice/synthesize');
        try {
          const backendResp = await fetch('/api/v1/voice/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voice_id: options?.voice || '',
              stability: options?.stability ?? 0.5,
              similarity_boost: options?.similarityBoost ?? 0.75,
              style: options?.style ?? 0.0,
              speaker_boost: options?.speakerBoost ?? true,
              model: options?.model || 'eleven_turbo_v2_5',
            }),
          });
          if (backendResp.ok) {
            const data = await backendResp.json();
            if (data.audio_base64) {
              const audioData = atob(data.audio_base64);
              const audioArray = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
              }
              const blob = new Blob([audioArray], { type: `audio/${data.format || 'wav'}` });
              const audioUrl = URL.createObjectURL(blob);
              return new Promise<void>((resolve, reject) => {
                currentAudio = new Audio(audioUrl);
                if (audioRef) {audioRef.current = currentAudio;}
                currentAudio.volume = 1.0;
                currentAudio.onended = () => { URL.revokeObjectURL(audioUrl); if (audioRef) {audioRef.current = null;} currentAudio = null; resolve(); };
                currentAudio.onerror = () => { URL.revokeObjectURL(audioUrl); if (audioRef) {audioRef.current = null;} currentAudio = null; reject(new Error('Backend audio playback failed')); };
                currentAudio.play().catch(reject);
              });
            }
          }
        } catch (backendErr) {
          console.warn('[ElevenLabsTTS] Backend TTS failed:', backendErr);
        }

        // Final fallback: Web Speech API
        console.warn('[ElevenLabsTTS] Falling back to Web Speech API');
        if (window.speechSynthesis) {
          return new Promise<void>((resolve) => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = options?.rate || 1.0;
            utterance.pitch = options?.pitch || 1.0;
            utterance.volume = 1.0;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
          });
        }
        throw new Error('No TTS available');
      }

      // Stop any current audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
      }

      // Resume AudioContext if suspended (required after user interaction)
      if (audioContext.state === 'suspended') {
        console.log('[ElevenLabsTTS] Resuming suspended AudioContext');
        await audioContext.resume();
      }

      // Get voice ID - use provided or default to Rachel
      let voiceId = DEFAULT_VOICES.rachel;
      if (options?.voice) {
        // Check if it's a known voice name
        const voiceName = options.voice.toLowerCase();
        if (voiceName in DEFAULT_VOICES) {
          voiceId = DEFAULT_VOICES[voiceName as keyof typeof DEFAULT_VOICES];
        } else if (options.voice.length > 10) {
          // Assume it's a voice ID
          voiceId = options.voice;
        }
      }

      // Voice settings from options or defaults
      const stability = options?.stability ?? 0.5;
      const similarityBoost = options?.similarityBoost ?? 0.75;
      const style = options?.style ?? 0.0;
      const speakerBoost = options?.speakerBoost ?? true;
      const modelId = options?.model || 'eleven_multilingual_v2';

      try {
        console.log('[ElevenLabsTTS] Generating speech with voice:', voiceId);
        console.log('[ElevenLabsTTS] Settings:', { stability, similarityBoost, style, speakerBoost, modelId });

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
              style,
              use_speaker_boost: speakerBoost,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ElevenLabsTTS] API error:', response.status, errorText);
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        console.log('[ElevenLabsTTS] Received audio blob:', audioBlob.size, 'bytes');

        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise<void>((resolve, reject) => {
          currentAudio = new Audio();

          // Track in external ref for immediate barge-in stop
          if (audioRef) {
            audioRef.current = currentAudio;
          }

          // Set volume explicitly
          currentAudio.volume = 1.0;

          // Apply rate if different from 1.0
          if (options?.rate && options.rate !== 1.0) {
            currentAudio.playbackRate = options.rate;
          }

          currentAudio.oncanplaythrough = () => {
            console.log('[ElevenLabsTTS] Audio ready to play');
          };

          currentAudio.onended = () => {
            console.log('[ElevenLabsTTS] Audio playback ended');
            URL.revokeObjectURL(audioUrl);
            if (audioRef) {audioRef.current = null;}
            currentAudio = null;
            resolve();
          };

          currentAudio.onerror = (e) => {
            console.error('[ElevenLabsTTS] Audio playback error:', e);
            URL.revokeObjectURL(audioUrl);
            if (audioRef) {audioRef.current = null;}
            currentAudio = null;
            reject(new Error('Audio playback failed'));
          };

          currentAudio.onplay = () => {
            console.log('[ElevenLabsTTS] Audio playback started');
          };

          // Set src and play
          currentAudio.src = audioUrl;
          currentAudio.play()
            .then(() => {
              console.log('[ElevenLabsTTS] play() promise resolved');
            })
            .catch((err) => {
              console.error('[ElevenLabsTTS] play() failed:', err);
              URL.revokeObjectURL(audioUrl);
              if (audioRef) {audioRef.current = null;}
              currentAudio = null;
              reject(err);
            });
        });
      } catch (error) {
        console.error('[ElevenLabsTTS] Error:', error);
        throw error;
      }
    },
    stop: () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
      }
      if (audioRef) {audioRef.current = null;}
    },
    getAudioContext: () => audioContext,
  };
}

// Web Speech API fallback TTS wrapper with improved voice selection
function createWebSpeechTTS(audioContext: AudioContext): HeadTTSInstance {
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let cachedVoice: SpeechSynthesisVoice | null = null;

  // Get the best available voice (prioritize natural-sounding voices)
  const getBestVoice = (): SpeechSynthesisVoice | null => {
    if (cachedVoice) {return cachedVoice;}

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {return null;}

    // Priority list: most natural-sounding voices first
    const priorityPatterns = [
      // Microsoft Edge voices (most natural)
      /Microsoft.*Online.*Natural/i,
      /Microsoft.*Natural/i,
      // Google voices (good quality)
      /Google.*UK.*Female/i,
      /Google.*US.*Female/i,
      /Google.*Female/i,
      /Google/i,
      // Apple voices
      /Samantha/i,
      /Karen/i,
      /Moira/i,
      /Tessa/i,
      // Other good voices
      /Zira/i,
      /Hazel/i,
      /Susan/i,
    ];

    for (const pattern of priorityPatterns) {
      const match = voices.find(v => pattern.test(v.name) && v.lang.startsWith('en'));
      if (match) {
        cachedVoice = match;
        console.log('[WebSpeechTTS] Selected voice:', match.name);
        return match;
      }
    }

    // Fallback: any English female voice, then any English voice
    const englishFemale = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male'))
    );
    if (englishFemale) {
      cachedVoice = englishFemale;
      console.log('[WebSpeechTTS] Fallback voice:', englishFemale.name);
      return englishFemale;
    }

    const anyEnglish = voices.find(v => v.lang.startsWith('en'));
    if (anyEnglish) {
      cachedVoice = anyEnglish;
      console.log('[WebSpeechTTS] Fallback to:', anyEnglish.name);
      return anyEnglish;
    }

    return voices[0] || null;
  };

  // Pre-load voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoice = null; // Reset cache when voices change
      getBestVoice();
    };
  }

  return {
    speak: async (text: string, options?: TTSOptions) => {
      return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
          reject(new Error('Speech synthesis not supported'));
          return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        currentUtterance = new SpeechSynthesisUtterance(text);

        // Use slightly slower rate and natural pitch for better quality
        currentUtterance.rate = options?.rate || 1.0;
        currentUtterance.pitch = options?.pitch || 1.0;
        currentUtterance.volume = 1.0;

        // Get the voice - use specified or auto-select best
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice: SpeechSynthesisVoice | null = null;

        if (options?.voice && options.voice !== 'auto') {
          // User specified a voice
          selectedVoice = voices.find(v => v.name === options.voice) || null;
        }

        if (!selectedVoice) {
          // Auto-select best voice
          selectedVoice = getBestVoice();
        }

        if (selectedVoice) {
          currentUtterance.voice = selectedVoice;
        }

        currentUtterance.onend = () => resolve();
        currentUtterance.onerror = (e) => {
          // Don't reject on 'interrupted' errors (normal when stopping)
          if (e.error === 'interrupted' || e.error === 'canceled') {
            resolve();
          } else {
            reject(e);
          }
        };

        window.speechSynthesis.speak(currentUtterance);
      });
    },
    stop: () => {
      window.speechSynthesis?.cancel();
      currentUtterance = null;
    },
    getAudioContext: () => audioContext,
  };
}

// Athena icon (fallback)
const AthenaIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
    {/* Stylized "A" for Athena */}
    <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="2" fill="none" opacity="0.3" />
    <path
      d="M50 20 L75 80 M50 20 L25 80 M35 60 L65 60"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Owl eyes (wisdom symbol) */}
    <circle cx="40" cy="45" r="8" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="60" cy="45" r="8" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="40" cy="45" r="3" fill={color} />
    <circle cx="60" cy="45" r="3" fill={color} />
  </svg>
);

// Settings icon component
const SettingsIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2m0 18v2m11-11h-2M3 12H1m17.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.73 0l-1.41-1.41M6.34 6.34L4.93 4.93" />
  </svg>
);

// Microphone icon component
const MicrophoneIcon: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#ffffff' : 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
    {active && (
      <>
        {/* Sound waves when active */}
        <circle cx="12" cy="8" r="1" fill="#ffffff" opacity="0.8">
          <animate attributeName="r" values="1;3;1" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="0.8s" repeatCount="indefinite" />
        </circle>
      </>
    )}
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: COLORS.bgAlt || '#141415',
    borderRadius: '12px',
    padding: '12px',
    position: 'relative',
    minWidth: '280px',
    maxWidth: '400px',
  },
  logoWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'visible',
    backgroundColor: '#0a0a0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    border: '2px solid',
    transition: 'transform 0.05s ease-out, opacity 0.05s ease-out',
    pointerEvents: 'none',
  },
  logoContainer: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.05s ease-out, box-shadow 0.1s ease-out',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    width: '80%',
    height: '80%',
    objectFit: 'contain',
    position: 'absolute',
  },
  fallbackIcon: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 11, 0.9)',
    gap: '12px',
    borderRadius: '8px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: COLORS.accent || '#10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: COLORS.textMuted || '#a1a1aa',
    fontSize: '14px',
  },
  controlsToggle: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    borderRadius: '6px',
    color: COLORS.textMuted || '#a1a1aa',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
  // Microphone button for push-to-talk
  micButton: {
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid transparent',
    borderRadius: '50%',
    color: COLORS.textMuted || '#a1a1aa',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },
  // User speaking indicator (barge-in active)
  userSpeakingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    animation: 'pulse 1.5s ease-in-out infinite',
    zIndex: 20,
  },
  // User transcript display
  userTranscript: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '8px',
    borderLeft: '3px solid #3b82f6',
    fontSize: '13px',
    color: COLORS.text || '#e4e4e7',
  },
  userTranscriptLabel: {
    color: '#3b82f6',
    fontWeight: 600,
    marginRight: '4px',
  },
  // Connection status indicator
  connectionStatus: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 8px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '4px',
  },
  connectionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  // Realtime VAD indicator
  vadIndicator: {
    position: 'absolute',
    bottom: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 500,
    color: '#ffffff',
    minWidth: '80px',
    overflow: 'hidden',
  },
  vadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transition: 'width 0.05s ease-out',
  },
  vadLabel: {
    position: 'relative',
    zIndex: 1,
  },
};

// Add keyframes for animations
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('avatar-keyframes');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'avatar-keyframes';
    styleSheet.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
      }
      @keyframes mic-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default AIAvatar;
