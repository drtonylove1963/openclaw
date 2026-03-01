/**
 * useLiveKitVoice - React hook for LiveKit-based voice interaction
 *
 * Provides real-time voice capabilities using LiveKit WebRTC:
 * - Push-to-talk or continuous listening
 * - Real-time transcription with Whisper
 * - Voice activity detection
 * - Low-latency audio streaming
 *
 * Inspired by: https://github.com/ShayneP/local-voice-ai
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  LiveKitVoiceService,
  getLiveKitVoiceService,
  TranscriptEvent,
  VADEvent,
  VoiceServiceState,
  LiveKitConfig,
} from '../services/LiveKitVoiceService';
import { ConnectionState } from 'livekit-client';

interface UseLiveKitVoiceOptions {
  /** Room name for voice session */
  roomName?: string;
  /** Connection details endpoint URL */
  connectionDetailsEndpoint?: string;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Callback when transcript is received */
  onTranscript?: (text: string, isFinal: boolean) => void;
  /** Callback when VAD detects speech */
  onVAD?: (isSpeaking: boolean) => void;
  /** Callback when agent is speaking */
  onAgentSpeaking?: (isSpeaking: boolean) => void;
  /** Callback when agent response text is received */
  onAgentResponse?: (text: string) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

interface UseLiveKitVoiceReturn {
  /** Whether LiveKit is connected */
  isConnected: boolean;
  /** Whether currently listening */
  isListening: boolean;
  /** Whether agent is speaking */
  isAgentSpeaking: boolean;
  /** Current transcription text */
  transcript: string;
  /** Agent response text */
  agentResponseText: string;
  /** Voice service state */
  state: VoiceServiceState;
  /** Connection state */
  connectionState: ConnectionState | null;
  /** Error message if any */
  error: string | null;
  /** Connect to LiveKit room */
  connect: () => Promise<void>;
  /** Disconnect from room */
  disconnect: () => Promise<void>;
  /** Start listening for voice input */
  startListening: () => Promise<void>;
  /** Stop listening */
  stopListening: () => Promise<void>;
  /** Toggle listening state */
  toggleListening: () => Promise<void>;
  /** Send text message to agent */
  sendMessage: (text: string) => Promise<void>;
}

const DEFAULT_CONFIG: LiveKitConfig = {
  roomName: 'athena-voice',
  connectionDetailsEndpoint: '/api/v1/voice/connection-details',
};

export function useLiveKitVoice(options: UseLiveKitVoiceOptions = {}): UseLiveKitVoiceReturn {
  const {
    roomName = DEFAULT_CONFIG.roomName,
    connectionDetailsEndpoint = DEFAULT_CONFIG.connectionDetailsEndpoint,
    autoConnect = false,
    onTranscript,
    onVAD,
    onAgentSpeaking,
    onAgentResponse,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentResponseText, setAgentResponseText] = useState('');
  const [state, setState] = useState<VoiceServiceState>('disconnected');
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<LiveKitVoiceService | null>(null);

  // Initialize service
  useEffect(() => {
    const config: LiveKitConfig = {
      roomName,
      connectionDetailsEndpoint,
    };

    serviceRef.current = getLiveKitVoiceService(config);

    // Set up callbacks
    serviceRef.current.setCallbacks({
      onTranscript: (event: TranscriptEvent) => {
        setTranscript(event.text);
        onTranscript?.(event.text, event.isFinal);
      },
      onVAD: (event: VADEvent) => {
        onVAD?.(event.isSpeaking);
      },
      onAgentSpeaking: (speaking: boolean) => {
        setIsAgentSpeaking(speaking);
        onAgentSpeaking?.(speaking);
      },
      onAgentResponse: (text: string) => {
        setAgentResponseText(text);
        onAgentResponse?.(text);
      },
      onConnectionStateChange: (connState: ConnectionState) => {
        setConnectionState(connState);
        setIsConnected(connState === ConnectionState.Connected);

        // Sync VoiceServiceState from the service
        if (serviceRef.current) {
          setState(serviceRef.current.getState());
        }

        if (connState === ConnectionState.Disconnected) {
          setIsListening(false);
          setState('disconnected');
        }
      },
      onError: (err: Error) => {
        setError(err.message);
        onError?.(err);
      },
    });

    // Auto-connect if enabled
    if (autoConnect) {
      serviceRef.current?.connect().catch((err) => {
        setError(err.message);
        onError?.(err);
      });
    }

    return () => {
      // Don't disconnect on unmount - service is shared
    };
  }, [roomName, connectionDetailsEndpoint, autoConnect]);

  // State is updated via callbacks in the effect above.
  // No polling needed — onConnectionStateChange, onTranscript, etc. handle all updates.

  const connect = useCallback(async () => {
    if (!serviceRef.current) {return;}

    setError(null);
    setState('connecting');
    try {
      await serviceRef.current.connect();
      setState(serviceRef.current.getState());
      setIsConnected(serviceRef.current.isConnected());
    } catch (err) {
      setState('disconnected');
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!serviceRef.current) {return;}

    await serviceRef.current.disconnect();
  }, []);

  const startListening = useCallback(async () => {
    if (!serviceRef.current) {return;}

    setError(null);
    try {
      await serviceRef.current.startListening();
      setIsListening(true);
      setState(serviceRef.current.getState());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start listening';
      setError(message);
      throw err;
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!serviceRef.current) {return;}

    await serviceRef.current.stopListening();
    setIsListening(false);
    setState(serviceRef.current.getState());
  }, []);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  const sendMessage = useCallback(async (text: string) => {
    if (!serviceRef.current) {return;}

    try {
      await serviceRef.current.sendMessage(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      throw err;
    }
  }, []);

  return {
    isConnected,
    isListening,
    isAgentSpeaking,
    transcript,
    agentResponseText,
    state,
    connectionState,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    toggleListening,
    sendMessage,
  };
}

export default useLiveKitVoice;
