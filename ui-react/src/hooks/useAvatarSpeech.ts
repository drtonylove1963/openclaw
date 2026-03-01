/**
 * useAvatarSpeech - Hook for integrating avatar speech with chat
 *
 * This hook provides methods to make the avatar speak in response to
 * agent messages, with automatic sentence buffering for streaming responses.
 *
 * Features:
 * - Auto-tracks ElevenLabs usage (10K chars/month free tier)
 * - Auto-switches to Kokoro when approaching limit
 * - Sentence buffering for streaming responses
 */
import { useCallback, useRef, useEffect } from 'react';
import { useAvatarStore, selectAvatarEnabled, selectAvatarConfig } from '../stores/avatarStore';
import { getTTSUsageManager, TTSProvider } from '../services/TTSUsageManager';
import type { AvatarEmotion } from '../types/avatar';

interface UseAvatarSpeechOptions {
  /** Automatically speak agent responses */
  autoSpeak?: boolean;
  /** Buffer sentences before speaking (for streaming) */
  bufferSentences?: boolean;
  /** Minimum characters to buffer before speaking */
  minBufferLength?: number;
  /** Summarize long responses for voice (speak summary, show full text) */
  summarizeLongResponses?: boolean;
  /** Word threshold for summarization (default: 40) */
  summaryWordThreshold?: number;
  /** Callback when speech starts */
  onSpeechStart?: () => void;
  /** Callback when speech ends */
  onSpeechEnd?: () => void;
  /** Callback when provider switches (e.g., ElevenLabs → Kokoro) */
  onProviderSwitch?: (from: TTSProvider, to: TTSProvider) => void;
}

interface UseAvatarSpeechReturn {
  /** Queue text to be spoken by the avatar */
  speak: (text: string, emotion?: AvatarEmotion) => Promise<void>;
  /** Add a chunk of streaming text (will buffer sentences) */
  addStreamChunk: (chunk: string) => void;
  /** Flush any buffered text and speak it */
  flushBuffer: () => void;
  /** Stop current speech and clear queue */
  stop: () => void;
  /** Check if avatar is currently speaking */
  isSpeaking: boolean;
  /** Check if avatar is enabled */
  isEnabled: boolean;
  /** Check if avatar is ready to speak */
  isReady: boolean;
  /** Current TTS provider being used */
  currentProvider: TTSProvider;
  /** Whether ElevenLabs is still available (not over quota) */
  isElevenLabsAvailable: boolean;
}

// Sentence-ending punctuation
const SENTENCE_ENDINGS = /[.!?]\s*$/;
const SENTENCE_BOUNDARY = /(?<=[.!?])\s+/;

// Configuration for real-time streaming speech
const STREAMING_CONFIG = {
  /** Speak first sentence immediately for fast perceived response */
  speakFirstSentenceImmediately: true,
  /** Max sentences to speak during streaming before summarizing remainder */
  maxStreamingSentences: 3,
  /** Min chars for a sentence to be spoken (avoid fragments) */
  minSentenceLength: 20,
  /** Words threshold where we switch to summary mode for remainder */
  summaryThresholdWords: 60,
};

/**
 * Count words in text
 */
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

/**
 * Clean text for natural speech output
 * Removes special characters, code, and formats for spoken language
 */
const cleanForSpeech = (text: string): string => {
  return text
    // Remove code blocks entirely
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet points and list markers
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove special characters that shouldn't be spoken
    .replace(/[<>{}[\]|\\^~`@#$%&*_=+]/g, '')
    // Replace technical punctuation with natural pauses
    .replace(/\s*[;:]\s*/g, ', ')
    .replace(/\s*\/\s*/g, ' or ')
    .replace(/\s*-\s*/g, ' ')
    // Remove parenthetical asides for cleaner speech
    .replace(/\([^)]*\)/g, '')
    // Clean up URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Normalize whitespace
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Detect the type/intent of the response for natural voice framing
 */
type ResponseType = 'completion' | 'explanation' | 'error' | 'list' | 'question' | 'confirmation' | 'general';

const detectResponseType = (text: string): ResponseType => {
  const lower = text.toLowerCase();

  // Task completion
  if (lower.includes("i've completed") || lower.includes("done") || lower.includes("finished") ||
      lower.includes("successfully") || lower.includes("all set") || lower.includes("ready")) {
    return 'completion';
  }

  // Error/problem
  if (lower.includes("error") || lower.includes("failed") || lower.includes("issue") ||
      lower.includes("problem") || lower.includes("couldn't") || lower.includes("unable")) {
    return 'error';
  }

  // List of items
  if ((text.match(/^\s*[-•*]\s/gm) || []).length >= 2 ||
      (text.match(/^\s*\d+\.\s/gm) || []).length >= 2) {
    return 'list';
  }

  // Question response
  if (lower.includes("the answer") || lower.includes("this means") ||
      lower.includes("basically") || lower.includes("in short")) {
    return 'explanation';
  }

  // Confirmation
  if (lower.includes("sure") || lower.includes("of course") || lower.includes("absolutely") ||
      lower.includes("yes,") || lower.includes("no problem")) {
    return 'confirmation';
  }

  return 'general';
};

/**
 * Extract the core essence/main point from text
 */
const extractEssence = (text: string): string => {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) {return text;}

  // Look for sentences with key indicators of main points
  const mainPointIndicators = [
    'the main', 'essentially', 'in short', 'basically', 'the key',
    'most important', 'bottom line', 'in summary', 'the answer is'
  ];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (mainPointIndicators.some(ind => lower.includes(ind))) {
      return sentence.trim();
    }
  }

  // Otherwise, first sentence often has the main point
  return sentences[0].trim();
};

/**
 * Simplify technical or complex phrases for spoken language
 */
const simplifyForSpeech = (text: string): string => {
  return text
    // Technical to conversational
    .replace(/\bimplemented\b/gi, 'added')
    .replace(/\bexecuted\b/gi, 'ran')
    .replace(/\binitialized\b/gi, 'set up')
    .replace(/\bconfigured\b/gi, 'set up')
    .replace(/\bdeployed\b/gi, 'put in place')
    .replace(/\bfunctionality\b/gi, 'feature')
    .replace(/\butilize\b/gi, 'use')
    .replace(/\bleverage\b/gi, 'use')
    .replace(/\bfacilitate\b/gi, 'help with')
    .replace(/\bsubsequently\b/gi, 'then')
    .replace(/\badditionally\b/gi, 'also')
    .replace(/\bfurthermore\b/gi, 'plus')
    .replace(/\bhowever\b/gi, 'but')
    .replace(/\btherefore\b/gi, 'so')
    .replace(/\bconsequently\b/gi, 'so')
    .replace(/\bnevertheless\b/gi, 'still')
    .replace(/\bnotwithstanding\b/gi, 'despite that')
    // Contractions for natural speech
    .replace(/\bI am\b/g, "I'm")
    .replace(/\bI have\b/g, "I've")
    .replace(/\bI will\b/g, "I'll")
    .replace(/\bIt is\b/g, "It's")
    .replace(/\bThat is\b/g, "That's")
    .replace(/\bThere is\b/g, "There's")
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bdoes not\b/gi, "doesn't")
    .replace(/\bcannot\b/gi, "can't")
    .replace(/\bwill not\b/gi, "won't")
    .replace(/\bshould not\b/gi, "shouldn't")
    .replace(/\bwould not\b/gi, "wouldn't")
    .replace(/\bcould not\b/gi, "couldn't");
};

/**
 * Create conversational voice intro based on response type
 */
const getVoiceIntro = (type: ResponseType): string => {
  const intros: Record<ResponseType, string[]> = {
    completion: [
      "All done!",
      "Got it done.",
      "That's taken care of.",
      "Finished up.",
    ],
    explanation: [
      "So here's the thing.",
      "Let me break this down.",
      "In simple terms,",
      "Here's what you need to know.",
    ],
    error: [
      "Ran into a snag.",
      "There's an issue here.",
      "Something went wrong.",
      "We've got a problem.",
    ],
    list: [
      "Here's a quick rundown.",
      "A few key points.",
      "The highlights are:",
      "Main things to note:",
    ],
    question: [
      "Good question.",
      "To answer that,",
      "Here's the answer.",
      "",
    ],
    confirmation: [
      "",
      "Absolutely.",
      "Sure thing.",
      "",
    ],
    general: [
      "",
      "Here's the situation.",
      "Quick update:",
      "",
    ],
  };

  const options = intros[type];
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Create a natural, conversational voice summary
 * Paraphrases content for spoken delivery, doesn't just extract sentences
 */
const createVoiceSummary = (text: string, maxWords: number = 40): string => {
  // Clean and simplify the text
  let cleaned = cleanForSpeech(text);
  if (!cleaned) {return '';}

  cleaned = simplifyForSpeech(cleaned);

  // Detect response type for appropriate framing
  const responseType = detectResponseType(text);

  // Get the core message
  const essence = extractEssence(cleaned);
  const essenceSimplified = simplifyForSpeech(essence);

  // Build natural voice response
  const intro = getVoiceIntro(responseType);

  // For short essence, use it directly
  let voiceContent = essenceSimplified;

  // Trim to reasonable length for speech
  const words = voiceContent.split(/\s+/);
  if (words.length > maxWords) {
    voiceContent = words.slice(0, maxWords).join(' ');
    // End at natural break
    const lastPeriod = voiceContent.lastIndexOf('.');
    if (lastPeriod > voiceContent.length * 0.5) {
      voiceContent = voiceContent.substring(0, lastPeriod + 1);
    } else {
      voiceContent += '...';
    }
  }

  // Combine intro and content naturally
  let result = intro ? `${intro} ${voiceContent}` : voiceContent;

  // Clean up
  result = result
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim();

  // Ensure clean ending
  if (result && !result.match(/[.!?]$/)) {
    result += '.';
  }

  // Add context note for long responses
  const totalWords = countWords(cleaned);
  if (totalWords > maxWords * 2) {
    result += " Check the chat for the full details.";
  }

  return result;
};

export function useAvatarSpeech(options: UseAvatarSpeechOptions = {}): UseAvatarSpeechReturn {
  const {
    autoSpeak = true,
    bufferSentences = true,
    minBufferLength = 50,
    summarizeLongResponses = true,
    summaryWordThreshold = 40,
    onSpeechStart,
    onSpeechEnd,
    onProviderSwitch,
  } = options;

  const isEnabled = useAvatarStore(selectAvatarEnabled);
  const config = useAvatarStore(selectAvatarConfig);
  const { queueSpeech, state, isInitialized } = useAvatarStore();

  const bufferRef = useRef<string>('');
  const isSpeakingRef = useRef(false);
  const lastProviderRef = useRef<TTSProvider>('elevenlabs');

  // Real-time streaming state
  const streamingSentencesSpokenRef = useRef<number>(0);
  const fullResponseRef = useRef<string>(''); // Track full response for final summary decision
  const isStreamingModeRef = useRef<boolean>(false);

  // Initialize TTS usage manager with callbacks
  const usageManager = getTTSUsageManager({
    monthlyLimit: 10000,  // ElevenLabs free tier
    switchThresholdPercent: 90,
    warningThresholdPercent: 75,
    fallbackProvider: 'kokoro',
    onAutoSwitch: (stats) => {
      console.log('[useAvatarSpeech] Auto-switched to Kokoro (ElevenLabs at 90%)');
      if (lastProviderRef.current !== 'kokoro') {
        onProviderSwitch?.('elevenlabs', 'kokoro');
        lastProviderRef.current = 'kokoro';
      }
    },
    onWarning: (stats) => {
      console.warn(`[useAvatarSpeech] ElevenLabs usage warning: ${stats.percentUsed.toFixed(1)}%`);
    },
  });

  // Track speaking state
  useEffect(() => {
    isSpeakingRef.current = state === 'speaking';
  }, [state]);

  // Get current provider
  const getCurrentProvider = useCallback((): TTSProvider => {
    return usageManager.getCurrentProvider();
  }, [usageManager]);

  /**
   * Detect emotion from text content
   */
  const detectEmotion = useCallback((text: string): AvatarEmotion => {
    const lowerText = text.toLowerCase();

    // Question detection
    if (text.includes('?')) {
      return 'thinking';
    }

    // Excitement detection
    if (text.includes('!') || lowerText.includes('great') || lowerText.includes('excellent')) {
      return 'excited';
    }

    // Concern detection
    if (
      lowerText.includes('error') ||
      lowerText.includes('failed') ||
      lowerText.includes('problem') ||
      lowerText.includes('issue')
    ) {
      return 'concerned';
    }

    // Happy detection
    if (
      lowerText.includes('success') ||
      lowerText.includes('done') ||
      lowerText.includes('complete') ||
      lowerText.includes('perfect')
    ) {
      return 'happy';
    }

    // Focus detection
    if (
      lowerText.includes('let me') ||
      lowerText.includes("i'll") ||
      lowerText.includes('working on')
    ) {
      return 'focused';
    }

    return 'neutral';
  }, []);

  /**
   * Queue text to be spoken
   * Automatically tracks ElevenLabs usage and switches to Kokoro if needed
   */
  const speak = useCallback(
    async (text: string, emotion?: AvatarEmotion): Promise<void> => {
      if (!isEnabled || !autoSpeak || !config.autoSpeak) {
        return;
      }

      const detectedEmotion = emotion || detectEmotion(text);

      // Check which provider to use based on usage
      const provider = usageManager.getCurrentProvider();

      // Record usage if using ElevenLabs
      if (provider === 'elevenlabs') {
        usageManager.recordUsage(text, 'elevenlabs');
      }

      // Log provider being used
      console.log(`[useAvatarSpeech] Speaking with ${provider}: "${text.substring(0, 50)}..."`);

      return new Promise((resolve) => {
        queueSpeech({
          text,
          emotion: detectedEmotion,
          priority: 'normal',
          onStart: onSpeechStart,
          onEnd: () => {
            onSpeechEnd?.();
            resolve();
          },
        });
      });
    },
    [isEnabled, autoSpeak, config.autoSpeak, detectEmotion, queueSpeech, onSpeechStart, onSpeechEnd, usageManager]
  );

  /**
   * Add a streaming chunk and speak sentences in real-time
   * CHANGED: Now speaks sentences as they complete for fluid voice response
   * Summarization only applies to remainder if response gets very long
   */
  const addStreamChunk = useCallback(
    (chunk: string) => {
      if (!isEnabled || !autoSpeak || !config.autoSpeak) {
        return;
      }

      // Mark as streaming mode
      if (!isStreamingModeRef.current) {
        isStreamingModeRef.current = true;
        streamingSentencesSpokenRef.current = 0;
        fullResponseRef.current = '';
      }

      bufferRef.current += chunk;
      fullResponseRef.current += chunk;

      if (!bufferSentences) {
        // Immediate mode - speak every chunk (not recommended)
        if (bufferRef.current.length >= minBufferLength) {
          speak(bufferRef.current);
          bufferRef.current = '';
        }
        return;
      }

      // Check for complete sentences
      if (SENTENCE_ENDINGS.test(bufferRef.current) && bufferRef.current.length >= STREAMING_CONFIG.minSentenceLength) {
        // Split into sentences
        const sentences = bufferRef.current.split(SENTENCE_BOUNDARY);

        // Keep the last incomplete sentence in buffer
        const lastSentence = sentences[sentences.length - 1];
        const isLastComplete = SENTENCE_ENDINGS.test(lastSentence);

        // Get complete sentences to speak
        const completeSentences = isLastComplete ? sentences : sentences.slice(0, -1);

        // Speak complete sentences (up to max streaming limit)
        for (const sentence of completeSentences) {
          const trimmedSentence = sentence.trim();
          if (!trimmedSentence || trimmedSentence.length < STREAMING_CONFIG.minSentenceLength) {
            continue;
          }

          // Check if we've exceeded the streaming limit
          if (summarizeLongResponses &&
              streamingSentencesSpokenRef.current >= STREAMING_CONFIG.maxStreamingSentences) {
            // Stop speaking individual sentences - will summarize remainder in flushBuffer
            console.log('[AvatarSpeech] Max streaming sentences reached, will summarize remainder');
            break;
          }

          // Clean and speak this sentence
          const cleanedSentence = cleanForSpeech(trimmedSentence);
          if (cleanedSentence) {
            console.log(`[AvatarSpeech] Streaming sentence ${streamingSentencesSpokenRef.current + 1}: "${cleanedSentence.substring(0, 50)}..."`);
            speak(cleanedSentence);
            streamingSentencesSpokenRef.current++;
          }
        }

        // Update buffer - keep only incomplete portion
        if (isLastComplete) {
          bufferRef.current = '';
        } else {
          bufferRef.current = lastSentence;
        }
      }
    },
    [isEnabled, autoSpeak, config.autoSpeak, bufferSentences, minBufferLength, speak, summarizeLongResponses]
  );

  /**
   * Flush any remaining buffered text
   * CHANGED: Now handles streaming mode - only summarizes remaining content after streaming
   */
  const flushBuffer = useCallback(() => {
    const remainingBuffer = bufferRef.current.trim();
    const wasStreamingMode = isStreamingModeRef.current;
    const sentencesSpoken = streamingSentencesSpokenRef.current;

    // Reset streaming state
    isStreamingModeRef.current = false;
    streamingSentencesSpokenRef.current = 0;
    bufferRef.current = '';

    // If we already spoke sentences during streaming, handle remainder differently
    if (wasStreamingMode && sentencesSpoken > 0) {
      console.log(`[AvatarSpeech] flushBuffer - Already spoke ${sentencesSpoken} sentences during streaming`);

      // Check if there's significant remaining content
      const remainingWords = countWords(remainingBuffer);

      if (remainingBuffer && remainingWords > 10) {
        // Speak remaining content if substantial
        if (summarizeLongResponses && remainingWords > STREAMING_CONFIG.summaryThresholdWords) {
          // Summarize the remainder
          const summary = createVoiceSummary(remainingBuffer, 30);
          if (summary) {
            console.log(`[AvatarSpeech] Speaking summary of remainder: "${summary.substring(0, 60)}..."`);
            speak(summary);
          }
        } else {
          // Speak remainder as-is (it's short enough)
          const cleaned = cleanForSpeech(remainingBuffer);
          if (cleaned) {
            speak(cleaned);
          }
        }
      }
      // If remainder is minimal, we've already said enough

      fullResponseRef.current = '';
      return;
    }

    // Non-streaming mode OR no sentences were spoken - use original logic
    const fullText = remainingBuffer || fullResponseRef.current.trim();
    fullResponseRef.current = '';

    if (!fullText) {
      return;
    }

    const wordCount = countWords(fullText);
    const charCount = fullText.length;
    // Keep voice responses concise - 800 chars is about 1 minute of speech
    const MAX_TTS_CHARS = 800;

    console.log(`[AvatarSpeech] flushBuffer (full) - ${wordCount} words, ${charCount} chars`);

    let textToSpeak = fullText;

    // Always summarize if enabled AND (over word threshold OR over char limit)
    if (summarizeLongResponses && (wordCount > summaryWordThreshold || charCount > MAX_TTS_CHARS)) {
      // Long response - speak a summary instead
      const summary = createVoiceSummary(fullText, Math.min(summaryWordThreshold, 40));
      console.log(`[AvatarSpeech] Summarized to ${summary.length} chars: "${summary.substring(0, 80)}..."`);
      textToSpeak = summary;
    } else if (charCount > MAX_TTS_CHARS) {
      // Even without summarization, enforce hard limit to prevent TTS cutoff
      console.log(`[AvatarSpeech] Truncating ${charCount} chars to ${MAX_TTS_CHARS}`);
      const cleaned = cleanForSpeech(fullText);
      textToSpeak = cleaned.substring(0, MAX_TTS_CHARS);
      const lastPeriod = textToSpeak.lastIndexOf('.');
      if (lastPeriod > MAX_TTS_CHARS * 0.6) {
        textToSpeak = textToSpeak.substring(0, lastPeriod + 1);
      }
      textToSpeak += ' See the chat for full details.';
    }

    speak(textToSpeak);
  }, [speak, summarizeLongResponses, summaryWordThreshold]);

  /**
   * Stop speaking and clear queue
   */
  const stop = useCallback(() => {
    if (window.pronetheliaAvatar) {
      window.pronetheliaAvatar.stop();
    }
    bufferRef.current = '';
  }, []);

  return {
    speak,
    addStreamChunk,
    flushBuffer,
    stop,
    isSpeaking: state === 'speaking',
    isEnabled,
    isReady: isEnabled && isInitialized,
    currentProvider: getCurrentProvider(),
    isElevenLabsAvailable: usageManager.shouldUseElevenLabs(),
  };
}

export default useAvatarSpeech;
