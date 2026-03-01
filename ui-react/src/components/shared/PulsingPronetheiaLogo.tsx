/**
 * PulsingPronetheiaLogo - Animated pulsating version of the Pronetheia logo
 * Used during loading states to indicate the AI is thinking/processing
 */
import React, { useEffect } from 'react';

interface PulsingPronetheiaLogoProps {
  size?: number;
}

// Inject keyframes globally once
const STYLE_ID = 'pronetheia-pulse-keyframes';

function injectKeyframes() {
  if (typeof document === 'undefined') {return;}
  if (document.getElementById(STYLE_ID)) {return;}

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pronetheiaPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }
    @keyframes pronetheiaGlow {
      0%, 100% {
        box-shadow: 0 0 10px rgba(0, 118, 182, 0.4);
      }
      50% {
        box-shadow: 0 0 25px rgba(0, 118, 182, 0.8), 0 0 40px rgba(0, 118, 182, 0.4);
      }
    }
  `;
  document.head.appendChild(style);
}

export function PulsingPronetheiaLogo({ size = 32 }: PulsingPronetheiaLogoProps) {
  useEffect(() => {
    injectKeyframes();
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        animation: 'pronetheiaPulse 1.5s ease-in-out infinite',
        borderRadius: '50%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: '50%',
          animation: 'pronetheiaGlow 1.5s ease-in-out infinite',
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <defs>
          <linearGradient id="lionsGradPulsing" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#004d7a"/>
            <stop offset="100%" stopColor="#0076B6"/>
          </linearGradient>
          <radialGradient id="glowGradPulsing" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#0076B6" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#0076B6" stopOpacity="0"/>
          </radialGradient>
          <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Outer glow */}
        <circle cx="16" cy="12" r="14" fill="url(#glowGradPulsing)"/>
        {/* Lightbulb glass */}
        <path
          d="M16 2C10.5 2 6 6.5 6 12c0 3.5 1.8 6.5 4.5 8.2V23c0 0.5 0.5 1 1 1h9c0.5 0 1-0.5 1-1v-2.8c2.7-1.7 4.5-4.7 4.5-8.2C26 6.5 21.5 2 16 2z"
          fill="none"
          stroke="url(#lionsGradPulsing)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#pulseGlow)"
        />
        {/* Lightbulb base */}
        <rect x="11" y="24" width="10" height="2" rx="0.5" fill="url(#lionsGradPulsing)"/>
        <rect x="12" y="26.5" width="8" height="1.5" rx="0.5" fill="url(#lionsGradPulsing)"/>
        <path d="M13 28.5L14 30h4l1-1.5" stroke="url(#lionsGradPulsing)" strokeWidth="1" fill="none"/>
        {/* Brain shape */}
        <path
          d="M16 7c-1.5 0-2.8 0.8-3.5 2-0.5-0.3-1-0.5-1.5-0.5-1.4 0-2.5 1.1-2.5 2.5 0 0.5 0.1 0.9 0.3 1.3-0.5 0.5-0.8 1.2-0.8 2 0 1.5 1.2 2.7 2.7 2.7h0.3c0.5 1.2 1.7 2 3 2h4c1.3 0 2.5-0.8 3-2h0.3c1.5 0 2.7-1.2 2.7-2.7 0-0.8-0.3-1.5-0.8-2 0.2-0.4 0.3-0.8 0.3-1.3 0-1.4-1.1-2.5-2.5-2.5-0.5 0-1 0.2-1.5 0.5-0.7-1.2-2-2-3.5-2z"
          fill="url(#lionsGradPulsing)"
          opacity="0.9"
          filter="url(#pulseGlow)"
        />
        {/* Brain center line */}
        <path d="M16 7.5v9" stroke="#B0B7BC" strokeWidth="0.5" opacity="0.6"/>
        {/* A and I letters */}
        <text x="10.5" y="14" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" fill="#B0B7BC">A</text>
        <text x="19" y="14" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" fill="#B0B7BC">I</text>
      </svg>
    </div>
  );
}

export default PulsingPronetheiaLogo;
