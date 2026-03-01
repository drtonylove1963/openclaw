import { lazy, Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NavSidebar } from './NavSidebar';
import { MiniOrb } from './MiniOrb';
import { ParticleCanvas } from '../shared/ParticleCanvas';
import { useVoiceStore } from '../../stores/voiceStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { Menu } from 'lucide-react';

const VoiceOverlay = lazy(() =>
  import('../voice/VoiceOverlay').then(m => ({ default: m.VoiceOverlay }))
);

/**
 * AppShell - Root layout for the Neural Interface.
 * Contains the ParticleCanvas background, NavSidebar, main content area, MiniOrb, and VoiceOverlay.
 */
export function AppShell() {
  const isOverlayOpen = useVoiceStore(s => s.isOverlayOpen);
  const closeOverlay = useVoiceStore(s => s.closeOverlay);
  const isMobile = useBreakpoint('md');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      className="relative flex w-full h-screen overflow-hidden font-neural"
      style={{
        background: 'linear-gradient(180deg, #05050a 0%, #0a0a1a 100%)',
        color: '#f0f0f5',
        // Add safe area insets for mobile
        paddingTop: 'var(--sat)',
        paddingLeft: 'var(--sal)',
        paddingRight: 'var(--sar)',
      }}
    >
      {/* Particle constellation background (z-0, fixed, pointer-events: none) */}
      <ParticleCanvas />

      {/* Hamburger button for mobile */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center rounded-lg ni-glass-button mobile-safe-top"
          aria-label="Open navigation menu"
          style={{
            background: 'rgba(15, 15, 25, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            // Position with safe area consideration
            top: 'calc(var(--sat) + 1rem)',
            left: 'calc(var(--sal) + 1rem)',
          }}
        >
          <Menu size={24} />
        </button>
      )}

      {/* Navigation Sidebar (handles mobile drawer internally) */}
      <NavSidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main
        className="relative flex-1 min-h-0 overflow-auto transition-opacity duration-400 p-4 md:p-6"
        style={{
          zIndex: 1,
          opacity: isOverlayOpen ? 0.2 : 1,
          pointerEvents: isOverlayOpen ? 'none' : 'auto',
          paddingBottom: 'var(--sab)', // Safe area for bottom
        }}
      >
        <Outlet />
      </main>

      {/* Persistent Voice Orb with safe area positioning */}
      <div className="fixed bottom-4 right-4 mobile-safe-bottom mobile-safe-right">
        <MiniOrb />
      </div>

      {/* Voice Overlay (z-100, renders above everything) */}
      <Suspense fallback={null}>
        <VoiceOverlay isOpen={isOverlayOpen} onClose={closeOverlay} />
      </Suspense>
    </div>
  );
}