import { useRef, useEffect, useCallback } from 'react';

export interface ParticleCanvasProps {
  /** Number of particles to render */
  particleCount?: number;
  /** Maximum particle velocity */
  velocity?: number;
  /** Min particle radius */
  radiusMin?: number;
  /** Max particle radius */
  radiusMax?: number;
  /** Min particle opacity */
  opacityMin?: number;
  /** Max particle opacity */
  opacityMax?: number;
  /** Max distance for connection lines (px) */
  connectionDistance?: number;
  /** Max opacity for connection lines */
  connectionOpacity?: number;
  /** Primary particle color as [r, g, b] */
  color?: [number, number, number];
  /** Secondary color for connection gradients [r, g, b]. If omitted, connections use single color. */
  colorSecondary?: [number, number, number];
  /** Whether particles have a glow effect */
  glow?: boolean;
  /** Canvas opacity (0-1) */
  opacity?: number;
  /** Additional CSS class */
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

/**
 * ParticleCanvas - Full-screen animated constellation background
 *
 * Renders floating particles connected by fading lines.
 * Uses requestAnimationFrame for 60fps animation.
 * Pauses when the tab is not visible (Page Visibility API).
 *
 * Default config matches the Home page mockup: 80 particles, cyan color, glow enabled.
 */
export function ParticleCanvas({
  particleCount = 80,
  velocity = 0.3,
  radiusMin = 1,
  radiusMax = 3,
  opacityMin = 0.3,
  opacityMax = 0.8,
  connectionDistance = 150,
  connectionOpacity = 0.2,
  color = [0, 212, 255],
  colorSecondary = [139, 92, 246],
  glow = true,
  opacity = 1,
  className,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Initialize particles
  const initParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * velocity,
          vy: (Math.random() - 0.5) * velocity,
          radius: Math.random() * (radiusMax - radiusMin) + radiusMin,
          opacity: Math.random() * (opacityMax - opacityMin) + opacityMin,
        });
      }
      particlesRef.current = particles;
    },
    [particleCount, velocity, radiusMin, radiusMax, opacityMin, opacityMax]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {return;}

    const ctx = canvas.getContext('2d');
    if (!ctx) {return;}

    const [r, g, b] = color;

    // Resize handler
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      sizeRef.current = { w: rect.width, h: rect.height };

      // Re-init particles if none exist or canvas grew significantly
      if (particlesRef.current.length === 0) {
        initParticles(rect.width, rect.height);
      }
    };

    resize();
    if (particlesRef.current.length === 0) {
      initParticles(sizeRef.current.w, sizeRef.current.h);
    }

    // Animation loop
    const animate = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      // Update positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) {p.vx *= -1;}
        if (p.y < 0 || p.y > h) {p.vy *= -1;}
      }

      // Draw connections
      const distSq = connectionDistance * connectionDistance;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;

          if (d2 < distSq) {
            const dist = Math.sqrt(d2);
            const alpha = (1 - dist / connectionDistance) * connectionOpacity;

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        // Main dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
        ctx.fill();

        // Glow effect
        if (glow) {
          const grad = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            p.radius * 3
          );
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.3})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    rafRef.current = requestAnimationFrame(animate);

    // Pause when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      resizeObserver.disconnect();
    };
  }, [
    color,
    colorSecondary,
    connectionDistance,
    connectionOpacity,
    glow,
    initParticles,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity,
      }}
      aria-hidden="true"
    />
  );
}
