/**
 * useADAVoice - Real-time voice communication with ADA backend
 *
 * Uses Socket.IO for bidirectional audio streaming with Gemini Native Audio.
 * Provides streaming transcription for both user and AI speech.
 *
 * Features:
 * - Web Audio API for microphone capture
 * - Base64 PCM audio streaming
 * - Streaming transcription display
 * - Tool call handling
 * - Automatic reconnection
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
export interface ADAVoiceMessage {
  sender: 'User' | 'Athena' | 'System';
  text: string;
  timestamp: Date;
}

export interface ADAVoiceState {
  isConnected: boolean;
  isActive: boolean;
  isPaused: boolean;
  state: 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface UseADAVoiceOptions {
  /** Backend Socket.IO URL */
  serverUrl?: string;
  /** Custom system prompt */
  systemPrompt?: string;
  /** Called when transcription received */
  onTranscription?: (message: ADAVoiceMessage) => void;
  /** Called when tool execution requested */
  onToolCall?: (tool: ToolCall) => void;
  /** Called when state changes */
  onStateChange?: (state: string) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Sample rate for audio capture */
  sampleRate?: number;
}

export interface UseADAVoiceReturn {
  /** Current voice state */
  voiceState: ADAVoiceState;
  /** Chat messages (transcriptions) */
  messages: ADAVoiceMessage[];
  /** Start voice session */
  start: () => Promise<void>;
  /** Stop voice session */
  stop: () => void;
  /** Pause/resume microphone */
  togglePause: () => void;
  /** Send text message */
  sendText: (text: string) => void;
  /** Clear messages */
  clearMessages: () => void;
  /** Current audio level (0-1) */
  audioLevel: number;
}

const DEFAULT_SERVER_URL = ''; // Uses current origin via nginx proxy
const SAMPLE_RATE = 16000;
const CHUNK_SIZE = 4096;

export function useADAVoice(options: UseADAVoiceOptions = {}): UseADAVoiceReturn {
  const {
    serverUrl = DEFAULT_SERVER_URL,
    systemPrompt,
    onTranscription,
    onToolCall,
    onStateChange,
    onError,
    sampleRate = SAMPLE_RATE,
  } = options;

  // State
  const [voiceState, setVoiceState] = useState<ADAVoiceState>({
    isConnected: false,
    isActive: false,
    isPaused: true,
    state: 'disconnected',
  });
  const [messages, setMessages] = useState<ADAVoiceMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(true); // Ref for audio processor closure

  // Callback refs to avoid stale closures
  const onTranscriptionRef = useRef(onTranscription);
  const onToolCallRef = useRef(onToolCall);
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
    onToolCallRef.current = onToolCall;
    onStateChangeRef.current = onStateChange;
    onErrorRef.current = onError;
  }, [onTranscription, onToolCall, onStateChange, onError]);

  // Keep isPausedRef in sync with voiceState.isPaused for audio processor closure
  useEffect(() => {
    isPausedRef.current = voiceState.isPaused;
  }, [voiceState.isPaused]);

  /**
   * Initialize Socket.IO connection
   */
  const initSocket = useCallback(() => {
    if (socketRef.current?.connected) {return;}

    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[ADA] Socket connected');
      setVoiceState((prev) => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      console.log('[ADA] Socket disconnected');
      setVoiceState((prev) => ({
        ...prev,
        isConnected: false,
        isActive: false,
        state: 'disconnected',
      }));
    });

    socket.on('status', (data: { msg: string }) => {
      console.log('[ADA] Status:', data.msg);
      if (data.msg === 'Athena Started') {
        setVoiceState((prev) => ({ ...prev, isActive: true, state: 'connected' }));
      } else if (data.msg === 'Athena Stopped') {
        setVoiceState((prev) => ({ ...prev, isActive: false, state: 'connected' }));
      }
    });

    socket.on('state', (data: { old: string; new: string }) => {
      console.log('[ADA] State change:', data);
      setVoiceState((prev) => ({ ...prev, state: data.new as ADAVoiceState['state'] }));
      onStateChangeRef.current?.(data.new);
    });

    socket.on('transcription', (data: { sender: string; text: string }) => {
      const message: ADAVoiceMessage = {
        sender: data.sender as 'User' | 'Athena',
        text: data.text,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        // Append to last message if same sender (streaming)
        if (last && last.sender === message.sender) {
          return [
            ...prev.slice(0, -1),
            { ...last, text: last.text + message.text },
          ];
        }
        return [...prev, message];
      });

      onTranscriptionRef.current?.(message);
    });

    socket.on('audio_data', (data: { data: string; sample_rate: number }) => {
      // Decode base64 audio and queue for playback
      const audioData = base64ToArrayBuffer(data.data);
      audioQueueRef.current.push(audioData);
      playAudioQueue();
    });

    socket.on('tool_call', (data: { name: string; args: Record<string, unknown> }) => {
      console.log('[ADA] Tool call:', data);
      onToolCallRef.current?.(data);

      // Handle navigation tools automatically
      if (data.name === 'navigate_to_page' && data.args.page) {
        const page = data.args.page as string;
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page } }));
      }
    });

    socket.on('error', (data: { msg: string }) => {
      console.error('[ADA] Error:', data.msg);
      onErrorRef.current?.(data.msg);
    });

    socketRef.current = socket;
  }, [serverUrl]);

  /**
   * Convert base64 to ArrayBuffer
   */
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  /**
   * Convert ArrayBuffer to base64
   */
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  /**
   * Play queued audio chunks
   */
  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {return;}

    isPlayingRef.current = true;

    try {
      const audioContext = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      while (audioQueueRef.current.length > 0) {
        const chunk = audioQueueRef.current.shift();
        if (!chunk) {continue;}

        // Convert PCM to AudioBuffer
        const pcmData = new Int16Array(chunk);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768;
        }

        const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
        audioBuffer.copyToChannel(floatData, 0);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      }
    } catch (e) {
      console.error('[ADA] Audio playback error:', e);
    } finally {
      isPlayingRef.current = false;
    }
  };

  /**
   * Start microphone capture
   */
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Create ScriptProcessor for audio capture (simpler than AudioWorklet)
      const processor = audioContext.createScriptProcessor(CHUNK_SIZE, 1, 1);

      processor.onaudioprocess = (e) => {
        // Use ref to avoid stale closure with React state
        if (isPausedRef.current) {return;}

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(rms);

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        // Send to server
        if (socketRef.current?.connected) {
          const base64Data = arrayBufferToBase64(pcmData.buffer);
          socketRef.current.emit('audio_data', { data: base64Data });
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('[ADA] Microphone started');
    } catch (e) {
      console.error('[ADA] Microphone error:', e);
      onErrorRef.current?.('Failed to access microphone');
      throw e;
    }
  };

  /**
   * Stop microphone capture
   */
  const stopMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
    console.log('[ADA] Microphone stopped');
  };

  /**
   * Start voice session
   */
  const start = useCallback(async () => {
    if (voiceState.isActive) {
      console.log('[ADA] Already active');
      return;
    }

    initSocket();

    // Wait for socket connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);

      if (socketRef.current?.connected) {
        clearTimeout(timeout);
        resolve();
        return;
      }

      socketRef.current?.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Start microphone first
    await startMicrophone();

    // Tell server to start
    socketRef.current?.emit('start_audio', {
      system_prompt: systemPrompt,
      muted: false,
    });

    setVoiceState((prev) => ({ ...prev, isPaused: false }));
  }, [voiceState.isActive, initSocket, systemPrompt]);

  /**
   * Stop voice session
   */
  const stop = useCallback(() => {
    socketRef.current?.emit('stop_audio');
    stopMicrophone();

    audioQueueRef.current = [];
    isPlayingRef.current = false;

    setVoiceState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: true,
      state: 'connected',
    }));
  }, []);

  /**
   * Toggle pause/resume
   */
  const togglePause = useCallback(() => {
    const newPaused = !voiceState.isPaused;
    setVoiceState((prev) => ({ ...prev, isPaused: newPaused }));

    if (newPaused) {
      socketRef.current?.emit('pause_audio');
    } else {
      socketRef.current?.emit('resume_audio');
    }
  }, [voiceState.isPaused]);

  /**
   * Send text message
   */
  const sendText = useCallback((text: string) => {
    if (!socketRef.current?.connected) {
      onErrorRef.current?.('Not connected');
      return;
    }

    // Add user message to display
    setMessages((prev) => [
      ...prev,
      {
        sender: 'User',
        text,
        timestamp: new Date(),
      },
    ]);

    socketRef.current.emit('user_input', { text });
  }, []);

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      socketRef.current?.disconnect();
    };
  }, [stop]);

  return {
    voiceState,
    messages,
    start,
    stop,
    togglePause,
    sendText,
    clearMessages,
    audioLevel,
  };
}

export default useADAVoice;
