/**
 * useWakeWord - Hook for wake word detection and hands-free voice interaction
 *
 * Listens for a wake word (e.g., "Hey Athena") and then captures the user's
 * full request until they stop speaking.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseWakeWordOptions {
  /** Wake word phrase to listen for (default: 'hey athena') */
  wakeWord?: string;
  /** Alternative wake words */
  alternativeWakeWords?: string[];
  /** Skip wake word — start recording on any speech (always-listening mode) */
  skipWakeWord?: boolean;
  /** Language for recognition (default: 'en-US') */
  language?: string;
  /** Silence timeout in ms before considering speech ended (default: 1500) */
  silenceTimeout?: number;
  /** Maximum recording time in ms (default: 30000) */
  maxRecordingTime?: number;
  /** Callback when wake word is detected */
  onWakeWordDetected?: () => void;
  /** Callback when full request is captured */
  onRequestCaptured?: (transcript: string) => void;
  /** Callback for status changes */
  onStatusChange?: (status: WakeWordStatus) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

export type WakeWordStatus =
  | 'idle'           // Not listening
  | 'listening'      // Listening for wake word
  | 'wake_detected'  // Wake word detected, ready for request
  | 'recording'      // Recording user request
  | 'processing';    // Processing/sending request

interface UseWakeWordReturn {
  /** Whether wake word detection is supported */
  isSupported: boolean;
  /** Current status */
  status: WakeWordStatus;
  /** Whether hands-free mode is enabled */
  isEnabled: boolean;
  /** Current transcript (during recording) */
  transcript: string;
  /** Enable hands-free mode */
  enable: () => void;
  /** Disable hands-free mode */
  disable: () => void;
  /** Toggle hands-free mode */
  toggle: () => void;
  /** Error message if any */
  error: string | null;
}

// Check for browser support
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const {
    wakeWord = 'hey athena',
    alternativeWakeWords = ['athena', 'hey athina', 'hey arena'],
    skipWakeWord = false,
    language = 'en-US',
    silenceTimeout = 1500,
    maxRecordingTime = 30000,
    onWakeWordDetected,
    onRequestCaptured,
    onStatusChange,
    onError,
  } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState<WakeWordStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Store all options in refs to avoid useEffect re-runs
  const optionsRef = useRef({
    wakeWord,
    alternativeWakeWords,
    skipWakeWord,
    language,
    silenceTimeout,
    maxRecordingTime,
  });
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);
  const onRequestCapturedRef = useRef(onRequestCaptured);
  const onStatusChangeRef = useRef(onStatusChange);
  const onErrorRef = useRef(onError);

  // Update refs when options change
  useEffect(() => {
    optionsRef.current = {
      wakeWord,
      alternativeWakeWords,
      skipWakeWord,
      language,
      silenceTimeout,
      maxRecordingTime,
    };
  }, [wakeWord, alternativeWakeWords, skipWakeWord, language, silenceTimeout, maxRecordingTime]);

  useEffect(() => { onWakeWordDetectedRef.current = onWakeWordDetected; }, [onWakeWordDetected]);
  useEffect(() => { onRequestCapturedRef.current = onRequestCaptured; }, [onRequestCaptured]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRequestRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const isEnabledRef = useRef(false);

  const isSupported = !!SpeechRecognition;

  // Helper to update status
  const updateStatus = useCallback((newStatus: WakeWordStatus) => {
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus);
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimeTimerRef.current) {
      clearTimeout(maxTimeTimerRef.current);
      maxTimeTimerRef.current = null;
    }
  }, []);

  // Check if text contains wake word
  const containsWakeWord = useCallback((text: string): boolean => {
    const normalizedText = text.toLowerCase().trim();
    const opts = optionsRef.current;
    const allWakeWords = [opts.wakeWord, ...opts.alternativeWakeWords];

    return allWakeWords.some(word => {
      const normalizedWord = word.toLowerCase();
      return normalizedText.includes(normalizedWord);
    });
  }, []);

  // Extract request after wake word
  const extractRequestAfterWakeWord = useCallback((text: string): string => {
    const normalizedText = text.toLowerCase();
    const opts = optionsRef.current;
    const allWakeWords = [opts.wakeWord, ...opts.alternativeWakeWords];

    let requestText = text;
    for (const word of allWakeWords) {
      const normalizedWord = word.toLowerCase();
      const index = normalizedText.indexOf(normalizedWord);
      if (index !== -1) {
        requestText = text.slice(index + word.length).trim();
        break;
      }
    }

    return requestText;
  }, []);

  // Initialize and manage recognition
  useEffect(() => {
    if (!isSupported || !isEnabled) {
      // Cleanup when disabled
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
        recognitionRef.current = null;
      }
      clearTimers();
      isRecordingRequestRef.current = false;
      accumulatedTranscriptRef.current = '';
      if (!isEnabled) {
        updateStatus('idle');
      }
      return;
    }

    isEnabledRef.current = true;
    console.log('[WakeWord] Creating new SpeechRecognition instance');

    const recognition = new SpeechRecognition();
    recognition.lang = optionsRef.current.language;
    recognition.continuous = true;
    recognition.interimResults = true;

    let isRunning = false;

    const startRecognition = () => {
      if (isRunning || !isEnabledRef.current) {return;}
      try {
        console.log('[WakeWord] Starting recognition...');
        recognition.start();
      } catch (e) {
        console.log('[WakeWord] Start error:', e);
        // Try again after a short delay
        setTimeout(() => {
          if (isEnabledRef.current && !isRunning) {
            try {
              recognition.start();
            } catch {
              // Ignore
            }
          }
        }, 500);
      }
    };

    recognition.onstart = () => {
      isRunning = true;
      setError(null);
      console.log('[WakeWord] Recognition started, listening for wake word...');
      if (!isRecordingRequestRef.current) {
        updateStatus('listening');
      }
    };

    recognition.onend = () => {
      isRunning = false;
      console.log('[WakeWord] Recognition ended, isEnabled:', isEnabledRef.current);

      // Auto-restart if still enabled
      if (isEnabledRef.current && !isRecordingRequestRef.current) {
        console.log('[WakeWord] Scheduling restart...');
        setTimeout(() => {
          startRecognition();
        }, 300);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      console.log('[WakeWord] Heard:', currentText);

      // If not recording request, check for wake word (or auto-trigger in skipWakeWord mode)
      if (!isRecordingRequestRef.current) {
        const shouldActivate = optionsRef.current.skipWakeWord
          ? currentText.trim().length > 0
          : containsWakeWord(currentText);
        console.log('[WakeWord] Activation check:', { currentText, shouldActivate, skipWakeWord: optionsRef.current.skipWakeWord });

        if (shouldActivate) {
          console.log(optionsRef.current.skipWakeWord ? '[WakeWord] SPEECH DETECTED (always-listen)' : '[WakeWord] WAKE WORD DETECTED!');
          isRecordingRequestRef.current = true;
          updateStatus('wake_detected');
          onWakeWordDetectedRef.current?.();

          // In skipWakeWord mode, the current text IS the request start
          // In wake word mode, extract text after the wake word
          const initialText = optionsRef.current.skipWakeWord
            ? currentText.trim()
            : extractRequestAfterWakeWord(currentText);
          if (initialText) {
            accumulatedTranscriptRef.current = initialText;
            setTranscript(initialText);
          }

          // Start recording mode
          setTimeout(() => {
            updateStatus('recording');

            // Reset silence timer
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            silenceTimerRef.current = setTimeout(() => {
              if (isRecordingRequestRef.current && accumulatedTranscriptRef.current.trim()) {
                // Finalize request
                const finalText = accumulatedTranscriptRef.current.trim();
                console.log('[WakeWord] Finalizing request:', finalText);
                onRequestCapturedRef.current?.(finalText);

                // Reset for next interaction
                isRecordingRequestRef.current = false;
                accumulatedTranscriptRef.current = '';
                setTranscript('');
                updateStatus('listening');
              }
            }, optionsRef.current.silenceTimeout);

            // Set max recording timeout
            maxTimeTimerRef.current = setTimeout(() => {
              if (isRecordingRequestRef.current) {
                const finalText = accumulatedTranscriptRef.current.trim();
                if (finalText) {
                  onRequestCapturedRef.current?.(finalText);
                }
                isRecordingRequestRef.current = false;
                accumulatedTranscriptRef.current = '';
                setTranscript('');
                updateStatus('listening');
              }
            }, optionsRef.current.maxRecordingTime);
          }, 300);
        }
      } else {
        // Recording request - accumulate transcript
        if (finalTranscript) {
          accumulatedTranscriptRef.current += ' ' + finalTranscript;
          setTranscript(accumulatedTranscriptRef.current.trim());
        } else if (interimTranscript) {
          setTranscript((accumulatedTranscriptRef.current + ' ' + interimTranscript).trim());
        }

        // Reset silence timer on new speech
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          if (isRecordingRequestRef.current && accumulatedTranscriptRef.current.trim()) {
            const finalText = accumulatedTranscriptRef.current.trim();
            console.log('[WakeWord] Finalizing request after silence:', finalText);
            onRequestCapturedRef.current?.(finalText);

            isRecordingRequestRef.current = false;
            accumulatedTranscriptRef.current = '';
            setTranscript('');
            updateStatus('listening');
          }
        }, optionsRef.current.silenceTimeout);
      }
    };

    recognition.onerror = (event: any) => {
      console.log('[WakeWord] Error:', event.error);

      switch (event.error) {
        case 'no-speech':
          // Normal, just keep listening
          return;
        case 'audio-capture':
          setError('No microphone found. Please check your settings.');
          onErrorRef.current?.('No microphone found');
          setIsEnabled(false);
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access.');
          onErrorRef.current?.('Microphone access denied');
          setIsEnabled(false);
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          onErrorRef.current?.('Network error');
          break;
        case 'aborted':
          // Normal when stopping
          return;
        default:
          console.log('[WakeWord] Unknown error:', event.error);
      }
    };

    recognitionRef.current = recognition;
    startRecognition();

    return () => {
      console.log('[WakeWord] Cleanup - stopping recognition');
      isEnabledRef.current = false;
      isRunning = false;
      clearTimers();
      try {
        recognition.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    };
  }, [isSupported, isEnabled, updateStatus, clearTimers, containsWakeWord, extractRequestAfterWakeWord]);

  const enable = useCallback(() => {
    console.log('[WakeWord] Enable called, isSupported:', isSupported);
    if (!isSupported) {return;}
    setIsEnabled(true);
    setError(null);
  }, [isSupported]);

  const disable = useCallback(() => {
    console.log('[WakeWord] Disable called');
    isEnabledRef.current = false;
    setIsEnabled(false);
    clearTimers();
    isRecordingRequestRef.current = false;
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    updateStatus('idle');
  }, [clearTimers, updateStatus]);

  const toggle = useCallback(() => {
    if (isEnabled) {
      disable();
    } else {
      enable();
    }
  }, [isEnabled, enable, disable]);

  return {
    isSupported,
    status,
    isEnabled,
    transcript,
    enable,
    disable,
    toggle,
    error,
  };
}

export default useWakeWord;
