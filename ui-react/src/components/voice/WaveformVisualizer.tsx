import { useEffect, useRef, useCallback } from 'react';

export interface WaveformVisualizerProps {
  /** 'circular' for listening state, 'horizontal' for speaking state */
  mode: 'circular' | 'horizontal';
  /** Whether the visualizer is active and animating */
  active: boolean;
  /** Audio analyser data (0-255 per bar), or null for mock data */
  audioData?: Uint8Array | null;
  /** Number of bars (default 32) */
  barCount?: number;
  /** CSS class for the container */
  className?: string;
}

/**
 * WaveformVisualizer - Renders audio waveform bars in circular or horizontal layout.
 *
 * Circular mode: 32 bars arranged in a ring around the orb (listening state).
 * Horizontal mode: 32 horizontal bars below the orb (speaking state).
 *
 * Uses requestAnimationFrame for smooth 60fps animation.
 * When no audioData is provided, generates mock waveform data.
 */
export function WaveformVisualizer({
  mode,
  active,
  audioData = null,
  barCount = 32,
  className = '',
}: WaveformVisualizerProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const generateMockData = useCallback((time: number, count: number): number[] => {
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      if (mode === 'circular') {
        // Random-ish heights for circular waveform (listening)
        bars.push(Math.random() * 40 + 10);
      } else {
        // Sinusoidal wave for horizontal waveform (speaking)
        bars.push(Math.sin(time / 100 + i * 0.5) * 20 + 30);
      }
    }
    return bars;
  }, [mode]);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      // Reset bar heights
      barsRef.current.forEach(bar => {
        if (bar) {bar.style.height = mode === 'circular' ? '20px' : '10px';}
      });
      return;
    }

    const animate = () => {
      timeRef.current = Date.now();
      let heights: number[];

      if (audioData && audioData.length > 0) {
        // Use real audio data
        heights = [];
        const step = audioData.length / barCount;
        for (let i = 0; i < barCount; i++) {
          const idx = Math.floor(i * step);
          const value = audioData[idx] || 0;
          heights.push((value / 255) * 40 + 10);
        }
      } else {
        heights = generateMockData(timeRef.current, barCount);
      }

      barsRef.current.forEach((bar, i) => {
        if (bar && heights[i] !== undefined) {
          bar.style.height = `${heights[i]}px`;
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, audioData, barCount, generateMockData, mode]);

  const setBarRef = useCallback((el: HTMLDivElement | null, index: number) => {
    barsRef.current[index] = el;
  }, []);

  if (mode === 'circular') {
    return (
      <div
        className={`absolute pointer-events-none transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={{ width: '320px', height: '320px' }}
        aria-hidden="true"
      >
        {Array.from({ length: barCount }).map((_, i) => {
          const angle = (i / barCount) * 360;
          const radius = 160;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <div
              key={i}
              ref={(el) => setBarRef(el, i)}
              style={{
                position: 'absolute',
                width: '4px',
                height: '20px',
                background: 'linear-gradient(180deg, #00f0ff, #7b61ff)',
                borderRadius: '2px',
                left: `calc(50% + ${x}px - 2px)`,
                top: `calc(50% + ${y}px)`,
                transform: `rotate(${angle + 90}deg)`,
                transformOrigin: 'center',
                transition: 'height 0.1s ease',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Horizontal mode
  return (
    <div
      className={`flex items-end gap-1 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ height: '60px' }}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => setBarRef(el, i)}
          style={{
            width: '6px',
            height: '10px',
            background: 'linear-gradient(180deg, #00f0ff, #7b61ff, #ff6b9d)',
            borderRadius: '3px',
            transition: 'height 0.1s ease',
          }}
        />
      ))}
    </div>
  );
}
