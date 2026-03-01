/**
 * PronetheiaLogo - Static Pronetheia AI Brain in Lightbulb logo
 * Lions Blue color scheme (#0076B6)
 */
import { useId } from 'react';

interface PronetheiaLogoProps {
  size?: number;
}

export function PronetheiaLogo({ size = 32 }: PronetheiaLogoProps) {
  const id = useId();
  const lionsGradId = `${id}-lionsGrad`;
  const glowGradId = `${id}-glowGrad`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={lionsGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#004d7a"/>
          <stop offset="100%" stopColor="#0076B6"/>
        </linearGradient>
        <radialGradient id={glowGradId} cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#0076B6" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#0076B6" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Outer glow */}
      <circle cx="16" cy="12" r="14" fill={`url(#${glowGradId})`}/>
      {/* Lightbulb glass */}
      <path
        d="M16 2C10.5 2 6 6.5 6 12c0 3.5 1.8 6.5 4.5 8.2V23c0 0.5 0.5 1 1 1h9c0.5 0 1-0.5 1-1v-2.8c2.7-1.7 4.5-4.7 4.5-8.2C26 6.5 21.5 2 16 2z"
        fill="none"
        stroke={`url(#${lionsGradId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Lightbulb base */}
      <rect x="11" y="24" width="10" height="2" rx="0.5" fill={`url(#${lionsGradId})`}/>
      <rect x="12" y="26.5" width="8" height="1.5" rx="0.5" fill={`url(#${lionsGradId})`}/>
      <path d="M13 28.5L14 30h4l1-1.5" stroke={`url(#${lionsGradId})`} strokeWidth="1" fill="none"/>
      {/* Brain shape */}
      <path
        d="M16 7c-1.5 0-2.8 0.8-3.5 2-0.5-0.3-1-0.5-1.5-0.5-1.4 0-2.5 1.1-2.5 2.5 0 0.5 0.1 0.9 0.3 1.3-0.5 0.5-0.8 1.2-0.8 2 0 1.5 1.2 2.7 2.7 2.7h0.3c0.5 1.2 1.7 2 3 2h4c1.3 0 2.5-0.8 3-2h0.3c1.5 0 2.7-1.2 2.7-2.7 0-0.8-0.3-1.5-0.8-2 0.2-0.4 0.3-0.8 0.3-1.3 0-1.4-1.1-2.5-2.5-2.5-0.5 0-1 0.2-1.5 0.5-0.7-1.2-2-2-3.5-2z"
        fill={`url(#${lionsGradId})`}
        opacity="0.9"
      />
      {/* Brain center line */}
      <path d="M16 7.5v9" stroke="#B0B7BC" strokeWidth="0.5" opacity="0.6"/>
      {/* A and I letters */}
      <text x="10.5" y="14" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" fill="#B0B7BC">A</text>
      <text x="19" y="14" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" fill="#B0B7BC">I</text>
    </svg>
  );
}

export default PronetheiaLogo;
