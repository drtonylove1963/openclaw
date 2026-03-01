import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoiceStore, type OrbState } from '../../stores/voiceStore';

/** Mini-orb gradient per voice state */
const STATE_GRADIENTS: Record<OrbState, string> = {
  idle: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(0,240,255,0.6) 40%, rgba(0,100,150,0.2))',
  connecting: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(245,158,11,0.5) 40%, rgba(150,80,0,0.2))',
  listening: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(0,240,255,0.7) 40%, rgba(0,100,150,0.3))',
  thinking: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(123,97,255,0.6) 40%, rgba(80,40,150,0.2))',
  speaking: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(245,158,11,0.6) 30%, rgba(0,240,255,0.4) 60%)',
  complete: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(0,240,255,0.6) 40%, rgba(0,100,150,0.2))',
  error: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(239,68,68,0.6) 40%, rgba(150,20,20,0.2))',
};

/** Mini-orb glow per voice state */
const STATE_GLOWS: Record<OrbState, string> = {
  idle: '0 0 20px rgba(0, 240, 255, 0.4)',
  connecting: '0 0 25px rgba(245, 158, 11, 0.4)',
  listening: '0 0 30px rgba(0, 240, 255, 0.6)',
  thinking: '0 0 25px rgba(123, 97, 255, 0.5)',
  speaking: '0 0 25px rgba(245, 158, 11, 0.5)',
  complete: '0 0 20px rgba(0, 240, 255, 0.4)',
  error: '0 0 25px rgba(239, 68, 68, 0.5)',
};

/** Pulse speed per state */
const STATE_PULSE: Record<OrbState, string> = {
  idle: 'orb-breathe 4s ease-in-out infinite',
  connecting: 'orb-breathe 1.5s ease-in-out infinite',
  listening: 'orb-breathe 1s ease-in-out infinite',
  thinking: 'orb-breathe 0.5s ease-in-out infinite',
  speaking: 'orb-breathe 2s ease-in-out infinite',
  complete: 'orb-breathe 4s ease-in-out infinite',
  error: 'none',
};

/**
 * MiniOrb - Persistent bottom-right voice access indicator.
 *
 * Mirrors voice system state through color and glow changes:
 * - idle: default cyan, breathing pulse
 * - listening: intensified cyan glow, 1s pulse
 * - thinking: violet gradient, 0.5s pulse
 * - speaking: amber/cyan gradient, subtle ripple
 * - error: rose flash (handled via store)
 *
 * Click opens the voice overlay.
 * Hidden on the Home page (full orb is displayed) and when overlay is open.
 *
 * Keyboard shortcut: Ctrl+Shift+V toggles the overlay globally.
 */
export function MiniOrb() {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();

  const orbState = useVoiceStore(s => s.orbState);
  const isOverlayOpen = useVoiceStore(s => s.isOverlayOpen);
  const wakeWordEnabled = useVoiceStore(s => s.wakeWordEnabled);
  const openOverlay = useVoiceStore(s => s.openOverlay);
  const toggleOverlay = useVoiceStore(s => s.toggleOverlay);

  // Global Ctrl+Shift+V keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        toggleOverlay();
      }
      // Ctrl+Shift+M to toggle mute
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        useVoiceStore.getState().toggleMute();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleOverlay]);

  // Hide on home page (full orb displayed there), chat page (has its own mic), and when overlay is open
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isChatPage = location.pathname.startsWith('/chat');
  if (isHomePage || isChatPage || isOverlayOpen) {
    return null;
  }

  const gradient = STATE_GRADIENTS[orbState];
  const glow = hovered
    ? STATE_GLOWS[orbState].replace(/\d+px/, (m) => `${parseInt(m) + 10}px`)
    : STATE_GLOWS[orbState];
  const pulseAnim = STATE_PULSE[orbState];
  const label = wakeWordEnabled ? 'Always listening' : 'Tap to talk';

  return (
    <div
      className="fixed z-50 flex flex-col items-center gap-2 cursor-pointer"
      style={{ bottom: '40px', right: '40px' }}
      onClick={openOverlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      aria-label={`Talk to Athena${orbState !== 'idle' ? ` - ${orbState}` : ''}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOverlay(); } }}
      title={`Talk to Athena${orbState !== 'idle' ? ` -- ${orbState.charAt(0).toUpperCase() + orbState.slice(1)}...` : ''}`}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: '40px',
          height: '40px',
          background: gradient,
          boxShadow: glow,
          transform: hovered ? 'scale(1.15)' : 'scale(1)',
          animation: pulseAnim,
          transition: 'background 500ms ease-in-out, box-shadow 500ms ease-in-out, transform 300ms ease',
        }}
      />
      <span
        className="text-center whitespace-nowrap uppercase tracking-wider transition-opacity duration-300"
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          letterSpacing: '0.5px',
          opacity: hovered ? 0.8 : 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
}
