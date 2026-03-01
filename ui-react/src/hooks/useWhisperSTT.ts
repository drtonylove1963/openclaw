/**
 * useWhisperSTT - React hook for speech-to-text using Whisper
 *
 * Records audio from the microphone and sends it to the Whisper STT
 * service for transcription. Provides a similar API to useSpeechRecognition
 * but uses the self-hosted Whisper backend instead of browser's Web Speech API.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getWhisperSTTService, WhisperConfig } from '../services/WhisperSTTService';

interface UseWhisperSTTOptions {
  /** Language for recognition (default: 'en') */
  language?: string;
  /** Voice Agent API URL (optional, uses env var by default) */
  apiUrl?: string;
  /** Callback when final transcript is ready */
  onResult?: (transcript: string) => void;
  /** Callback for interim results (simulated during recording) */
  onInterimResult?: (transcript: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Minimum recording duration in ms before allowing stop (default: 500) */
  minRecordingDuration?: number;
  /** Maximum recording duration in ms (default: 60000 = 1 minute) */
  maxRecordingDuration?: number;
}

interface UseWhisperSTTReturn {
  /** Whether Whisper service is available */
  isSupported: boolean;
  /** Whether the service has been health-checked */
  isReady: boolean;
  /** Whether currently recording/listening */
  isListening: boolean;
  /** Whether transcription is in progress */
  isTranscribing: boolean;
  /** Current transcript text */
  transcript: string;
  /** Start recording */
  startListening: () => Promise<void>;
  /** Stop recording and transcribe */
  stopListening: () => Promise<void>;
  /** Toggle recording state */
  toggleListening: () => Promise<void>;
  /** Error message if any */
  error: string | null;
}

// Check for MediaRecorder support
const isMediaRecorderSupported = typeof window !== 'undefined' && 'MediaRecorder' in window;

// Preferred MIME types in order of preference
const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

function getSupportedMimeType(): string {
  if (!isMediaRecorderSupported) {return '';}

  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

export function useWhisperSTT(options: UseWhisperSTTOptions = {}): UseWhisperSTTReturn {
  const {
    language = 'en',
    apiUrl,
    onResult,
    onInterimResult,
    onError,
    minRecordingDuration = 500,
    maxRecordingDuration = 60000,
  } = options;

  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported = isMediaRecorderSupported && getSupportedMimeType() !== '';

  // Use refs for callbacks to avoid recreating effects
  const onResultRef = useRef(onResult);
  const onInterimResultRef = useRef(onInterimResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onInterimResultRef.current = onInterimResult;
  }, [onInterimResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize service and check health on mount
  useEffect(() => {
    if (!isSupported) {return;}

    const config: WhisperConfig = { language };
    if (apiUrl) {config.apiUrl = apiUrl;}

    const service = getWhisperSTTService(config);

    // Check health
    service.healthCheck().then((healthy) => {
      setIsReady(healthy);
      if (!healthy) {
        console.warn('[WhisperSTT] Service health check failed');
      } else {
        console.log('[WhisperSTT] Service ready at:', service.getApiUrl());
      }
    });

    // Cleanup on unmount
    return () => {
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
    };
  }, [apiUrl, language, isSupported]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recording not supported in this browser');
      return;
    }

    if (isListening) {return;}

    setError(null);
    setTranscript('');
    audioChunksRef.current = [];

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create MediaRecorder with supported MIME type
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('[WhisperSTT] Recording started');
        recordingStartTimeRef.current = Date.now();
        setIsListening(true);

        // Show interim "Recording..." feedback
        onInterimResultRef.current?.('Recording...');
      };

      mediaRecorder.onstop = async () => {
        console.log('[WhisperSTT] Recording stopped');
        setIsListening(false);

        // Clear max duration timeout
        if (maxDurationTimeoutRef.current) {
          clearTimeout(maxDurationTimeoutRef.current);
          maxDurationTimeoutRef.current = null;
        }

        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // Check minimum recording duration
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        if (recordingDuration < minRecordingDuration) {
          console.log('[WhisperSTT] Recording too short, skipping transcription');
          setTranscript('');
          return;
        }

        // Transcribe the recorded audio
        if (audioChunksRef.current.length > 0) {
          setIsTranscribing(true);
          onInterimResultRef.current?.('Transcribing...');

          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            console.log('[WhisperSTT] Sending audio for transcription:', {
              size: audioBlob.size,
              type: mimeType,
              duration: recordingDuration,
            });

            const service = getWhisperSTTService();
            const result = await service.transcribe(audioBlob, language);

            setTranscript(result.text);
            setIsTranscribing(false);

            if (result.text.trim()) {
              onResultRef.current?.(result.text.trim());
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Transcription failed';
            console.error('[WhisperSTT] Transcription error:', message);
            setError(message);
            setIsTranscribing(false);
            onErrorRef.current?.(message);
          }
        }

        audioChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        const errorMessage = 'Recording error occurred';
        console.error('[WhisperSTT] MediaRecorder error:', event);
        setError(errorMessage);
        setIsListening(false);
        onErrorRef.current?.(errorMessage);
      };

      mediaRecorderRef.current = mediaRecorder;

      // Start recording with timeslice for progressive data collection
      mediaRecorder.start(1000); // Collect data every second

      // Set max duration timeout
      maxDurationTimeoutRef.current = setTimeout(() => {
        console.log('[WhisperSTT] Max recording duration reached');
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, maxRecordingDuration);
    } catch (err) {
      let errorMessage = 'Failed to start recording';

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please check your settings.';
        } else {
          errorMessage = err.message;
        }
      }

      console.error('[WhisperSTT] Start recording error:', errorMessage);
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    }
  }, [isSupported, isListening, language, minRecordingDuration, maxRecordingDuration]);

  const stopListening = useCallback(async () => {
    if (!mediaRecorderRef.current || !isListening) {return;}

    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error('[WhisperSTT] Stop recording error:', err);
    }
  }, [isListening]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isReady,
    isListening,
    isTranscribing,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    error,
  };
}

export default useWhisperSTT;
