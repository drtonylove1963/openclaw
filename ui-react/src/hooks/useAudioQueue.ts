/**
 * useAudioQueue - Clearable Audio Queue Manager for Immediate Barge-In
 *
 * Manages audio playback with the ability to immediately stop and clear
 * the queue without network round-trips. Essential for low-latency barge-in.
 *
 * Key Features:
 * - Immediate stop (<1ms) - no waiting for network
 * - Queue management with priority support
 * - Audio visualization via AnalyserNode
 * - Streaming audio support (add chunks while playing)
 */

import { useRef, useCallback, useState, useEffect } from 'react';

export interface AudioQueueItem {
  /** Unique identifier for this audio item */
  id: string;
  /** Audio data (ArrayBuffer, Blob, or URL) */
  audio: ArrayBuffer | Blob | string;
  /** Priority: 'high' items skip to front of queue */
  priority?: 'normal' | 'high';
  /** Callback when this item starts playing */
  onStart?: () => void;
  /** Callback when this item finishes playing */
  onEnd?: () => void;
  /** Callback if this item is interrupted */
  onInterrupt?: () => void;
  /** Associated text (for subtitles) */
  text?: string;
}

export interface AudioQueueOptions {
  /** Audio context to use (created if not provided) */
  audioContext?: AudioContext;
  /** Callback when any audio starts playing */
  onPlayStart?: (item: AudioQueueItem) => void;
  /** Callback when any audio stops (finished or interrupted) */
  onPlayStop?: (item: AudioQueueItem, interrupted: boolean) => void;
  /** Callback when queue becomes empty */
  onQueueEmpty?: () => void;
  /** Callback with current amplitude (0-1) for visualization */
  onAmplitudeUpdate?: (amplitude: number) => void;
}

export interface AudioQueueReturn {
  /** Add audio to the queue */
  add: (item: AudioQueueItem) => void;
  /** Add multiple items to the queue */
  addBatch: (items: AudioQueueItem[]) => void;
  /** Immediately stop current audio and clear queue */
  clear: () => void;
  /** Pause current playback */
  pause: () => void;
  /** Resume playback */
  resume: () => void;
  /** Skip to next item in queue */
  skip: () => void;
  /** Whether currently playing */
  isPlaying: boolean;
  /** Whether paused */
  isPaused: boolean;
  /** Number of items in queue */
  queueLength: number;
  /** Current item being played */
  currentItem: AudioQueueItem | null;
  /** Current playback time in seconds */
  currentTime: number;
  /** Duration of current item in seconds */
  duration: number;
  /** Current amplitude (0-1) */
  amplitude: number;
  /** Get the analyser node for external visualization */
  getAnalyser: () => AnalyserNode | null;
}

export function useAudioQueue(options: AudioQueueOptions = {}): AudioQueueReturn {
  const {
    audioContext: providedContext,
    onPlayStart,
    onPlayStop,
    onQueueEmpty,
    onAmplitudeUpdate,
  } = options;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [currentItem, setCurrentItem] = useState<AudioQueueItem | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(providedContext || null);
  const queueRef = useRef<AudioQueueItem[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const currentItemRef = useRef<AudioQueueItem | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  /**
   * Initialize audio context and nodes
   */
  const initAudio = useCallback(async () => {
    if (audioContextRef.current) {return;}

    audioContextRef.current = new AudioContext();

    // Create gain node for volume control
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    // Create analyser for amplitude visualization
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    analyserRef.current.smoothingTimeConstant = 0.8;
    analyserRef.current.connect(gainNodeRef.current);

    // Resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  /**
   * Update amplitude visualization
   */
  const updateAmplitude = useCallback(() => {
    if (!analyserRef.current || !isPlaying) {
      setAmplitude(0);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const normalizedAmplitude = average / 255;

    setAmplitude(normalizedAmplitude);
    onAmplitudeUpdate?.(normalizedAmplitude);

    // Update current time
    if (audioContextRef.current && startTimeRef.current > 0) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      setCurrentTime(elapsed);
    }

    animationFrameRef.current = requestAnimationFrame(updateAmplitude);
  }, [isPlaying, onAmplitudeUpdate]);

  /**
   * Play the next item in the queue
   */
  const playNext = useCallback(async () => {
    if (isProcessingRef.current) {return;}
    if (queueRef.current.length === 0) {
      setIsPlaying(false);
      setCurrentItem(null);
      currentItemRef.current = null;
      onQueueEmpty?.();
      return;
    }

    isProcessingRef.current = true;

    try {
      await initAudio();

      const item = queueRef.current.shift();
      setQueueLength(queueRef.current.length);

      currentItemRef.current = item;
      setCurrentItem(item);

      // Resume audio context if needed
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Convert audio to ArrayBuffer if needed
      let audioBuffer: AudioBuffer;

      if (item.audio instanceof ArrayBuffer) {
        audioBuffer = await audioContextRef.current.decodeAudioData(item.audio.slice(0));
      } else if (item.audio instanceof Blob) {
        const arrayBuffer = await item.audio.arrayBuffer();
        audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } else {
        // URL - fetch it
        const response = await fetch(item.audio);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      }

      setDuration(audioBuffer.duration);

      // Create and configure source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current);

      currentSourceRef.current = source;

      // Handle playback end
      source.onended = () => {
        const wasInterrupted = currentSourceRef.current !== source;
        currentSourceRef.current = null;

        if (!wasInterrupted) {
          item.onEnd?.();
          onPlayStop?.(item, false);
          isProcessingRef.current = false;
          playNext();
        }
      };

      // Start playback
      startTimeRef.current = audioContextRef.current.currentTime;
      source.start(0);

      setIsPlaying(true);
      setIsPaused(false);
      item.onStart?.();
      onPlayStart?.(item);

      // Start amplitude updates
      animationFrameRef.current = requestAnimationFrame(updateAmplitude);
    } catch (err) {
      console.error('[AudioQueue] Playback error:', err);
      isProcessingRef.current = false;
      playNext(); // Try next item
    } finally {
      isProcessingRef.current = false;
    }
  }, [initAudio, onPlayStart, onPlayStop, onQueueEmpty, updateAmplitude]);

  /**
   * Add item to queue
   */
  const add = useCallback(
    (item: AudioQueueItem) => {
      if (item.priority === 'high') {
        queueRef.current.unshift(item);
      } else {
        queueRef.current.push(item);
      }
      setQueueLength(queueRef.current.length);

      // Start playback if not already playing
      if (!isPlaying && !isProcessingRef.current) {
        playNext();
      }
    },
    [isPlaying, playNext]
  );

  /**
   * Add multiple items to queue
   */
  const addBatch = useCallback(
    (items: AudioQueueItem[]) => {
      const highPriority = items.filter((i) => i.priority === 'high');
      const normalPriority = items.filter((i) => i.priority !== 'high');

      queueRef.current = [...highPriority, ...queueRef.current, ...normalPriority];
      setQueueLength(queueRef.current.length);

      if (!isPlaying && !isProcessingRef.current) {
        playNext();
      }
    },
    [isPlaying, playNext]
  );

  /**
   * IMMEDIATELY stop current audio and clear queue
   * This is the critical method for barge-in - must be <1ms
   */
  const clear = useCallback(() => {
    console.log('[AudioQueue] Immediate clear triggered');

    // Cancel amplitude animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop current source IMMEDIATELY
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop(0); // Stop immediately (0 = now)
        currentSourceRef.current.disconnect();
      } catch {
        // May already be stopped
      }
      currentSourceRef.current = null;
    }

    // Notify current item was interrupted
    if (currentItemRef.current) {
      currentItemRef.current.onInterrupt?.();
      onPlayStop?.(currentItemRef.current, true);
    }

    // Clear queue and notify all items
    queueRef.current.forEach((item) => item.onInterrupt?.());
    queueRef.current = [];

    // Reset state
    setQueueLength(0);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentItem(null);
    setCurrentTime(0);
    setDuration(0);
    setAmplitude(0);
    currentItemRef.current = null;
    startTimeRef.current = 0;
    pauseTimeRef.current = 0;
    isProcessingRef.current = false;

    onQueueEmpty?.();
  }, [onPlayStop, onQueueEmpty]);

  /**
   * Pause current playback
   */
  const pause = useCallback(() => {
    if (!isPlaying || isPaused || !audioContextRef.current) {return;}

    pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
    audioContextRef.current.suspend();
    setIsPaused(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isPlaying, isPaused]);

  /**
   * Resume playback
   */
  const resume = useCallback(async () => {
    if (!isPaused || !audioContextRef.current) {return;}

    await audioContextRef.current.resume();
    setIsPaused(false);
    animationFrameRef.current = requestAnimationFrame(updateAmplitude);
  }, [isPaused, updateAmplitude]);

  /**
   * Skip to next item
   */
  const skip = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop(0);
      } catch {
        // May already be stopped
      }
    }
    // onended handler will call playNext
  }, []);

  /**
   * Get analyser node for external visualization
   */
  const getAnalyser = useCallback(() => analyserRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear();
      if (audioContextRef.current && !providedContext) {
        audioContextRef.current.close();
      }
    };
  }, [clear, providedContext]);

  return {
    add,
    addBatch,
    clear,
    pause,
    resume,
    skip,
    isPlaying,
    isPaused,
    queueLength,
    currentItem,
    currentTime,
    duration,
    amplitude,
    getAnalyser,
  };
}

export default useAudioQueue;
