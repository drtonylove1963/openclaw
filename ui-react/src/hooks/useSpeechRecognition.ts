/**
 * useSpeechRecognition - Hook for push-to-talk voice input
 *
 * Uses the Web Speech API for speech recognition with push-to-talk control.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  /** Language for recognition (default: 'en-US') */
  language?: string;
  /** Continuous mode - keep listening after results (default: false for PTT) */
  continuous?: boolean;
  /** Interim results - show partial results (default: true) */
  interimResults?: boolean;
  /** Callback when final transcript is ready */
  onResult?: (transcript: string) => void;
  /** Callback for interim (partial) results */
  onInterimResult?: (transcript: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  /** Whether speech recognition is supported */
  isSupported: boolean;
  /** Whether currently listening */
  isListening: boolean;
  /** Current transcript (interim or final) */
  transcript: string;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Toggle listening state */
  toggleListening: () => void;
  /** Error message if any */
  error: string | null;
}

// Check for browser support
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    onResult,
    onInterimResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported = !!SpeechRecognition;

  // Use refs for callbacks to avoid recreating recognition instance
  const onResultRef = useRef(onResult);
  const onInterimResultRef = useRef(onInterimResult);
  const onErrorRef = useRef(onError);

  // Keep refs up to date
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onInterimResultRef.current = onInterimResult;
  }, [onInterimResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize recognition instance - only recreate when config changes, not callbacks
  useEffect(() => {
    if (!isSupported) {return;}

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        onResultRef.current?.(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
        onInterimResultRef.current?.(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          // Don't show error for intentional aborts
          setIsListening(false);
          return;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
      onErrorRef.current?.(errorMessage);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [language, continuous, interimResults, isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) {return;}

    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Already started - ignore
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) {return;}

    try {
      recognitionRef.current.stop();
    } catch (err) {
      // Already stopped
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    error,
  };
}

export default useSpeechRecognition;
