/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      // Neural Interface Color System (from DESIGN-SYSTEM.md)
      colors: {
        // Legacy compatibility
        'pronetheia-bg': '#09090b',
        'pronetheia-card': '#141415',
        'pronetheia-border': '#27272a',
        'pronetheia-accent': '#10b981',

        // Neural Interface Backgrounds
        neural: {
          bg: '#05050a',
          'bg-deep': '#0a0a1a',
          'bg-voice': '#0a0a0f',
          card: 'rgba(255, 255, 255, 0.03)',
          'card-hover': 'rgba(255, 255, 255, 0.06)',
          'card-solid': 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.06)',
          'border-hover': 'rgba(255, 255, 255, 0.08)',
        },

        // Accent palette
        ni: {
          cyan: '#00d4ff',
          'cyan-voice': '#00f0ff',
          violet: '#8b5cf6',
          'violet-light': '#c084fc',
          'violet-voice': '#7b61ff',
          emerald: '#10b981',
          'emerald-light': '#34d399',
          amber: '#f59e0b',
          'amber-light': '#fbbf24',
          rose: '#ff6b9d',
        },

        // Surface levels (glassmorphism)
        'ni-surface': {
          0: 'rgba(255, 255, 255, 0.03)',
          1: 'rgba(255, 255, 255, 0.04)',
          2: 'rgba(255, 255, 255, 0.05)',
          3: 'rgba(255, 255, 255, 0.06)',
          4: 'rgba(255, 255, 255, 0.08)',
        },

        // Text
        'ni-text': '#f0f0f5',
        'ni-text-muted': '#6b7280',
      },

      // Font family
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        neural: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },

      // Font sizes from design system
      fontSize: {
        'brand': ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        'brand-voice': ['42px', { lineHeight: '1.1', fontWeight: '600' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'greeting': ['24px', { lineHeight: '1.3', fontWeight: '300' }],
        'h3': ['18px', { lineHeight: '1.4' }],
        'body-chat': ['15px', { lineHeight: '1.6' }],
        'content': ['14px', { lineHeight: '1.6' }],
        'small-ui': ['13px', { lineHeight: '1.5' }],
        'caption': ['12px', { lineHeight: '1.5' }],
        'micro': ['11px', { lineHeight: '1.4' }],
        'nano': ['10px', { lineHeight: '1.4', fontWeight: '600' }],
      },

      // Spacing extensions
      spacing: {
        'sidebar': '60px',
        'sidebar-expanded': '200px',
      },

      // Border radius
      borderRadius: {
        'panel': '24px',
        'card': '20px',
        'tab': '16px',
        'item': '12px',
        'badge': '8px',
        'bar': '2px',
        // Legacy aliases
        'ni-card': '24px',
        'ni-card-sm': '16px',
        'ni-chip': '12px',
        'ni-pill': '20px',
      },

      // Backdrop blur
      backdropBlur: {
        'glass': '20px',
        'message': '10px',
      },

      // Animations (from DESIGN-SYSTEM.md section 8)
      keyframes: {
        'shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.05)' },
        },
        'orb-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        'orbit-breathe': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        'orbit-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        'agent-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'brain-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.4)',
          },
          '50%': {
            transform: 'scale(1.1)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.6)',
          },
        },
        'neural-flow': {
          '0%': { top: '0', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        'stream-flow': {
          '0%': { top: '0', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        'message-appear': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'episode-appear': {
          'from': { opacity: '0', transform: 'translateX(-20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'typing-wave': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.6' },
          '30%': { transform: 'translateY(-10px)', opacity: '1' },
        },
        'frequency-pulse': {
          '0%, 100%': { transform: 'scaleY(1)', opacity: '0.6' },
          '50%': { transform: 'scaleY(1.3)', opacity: '1' },
        },
        'shimmer-header': {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
        },
        'neural-pulse-text': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.4))',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.6))',
          },
        },
        'date-pulse': {
          '0%, 100%': { transform: 'translateY(-50%) scale(1)' },
          '50%': { transform: 'translateY(-50%) scale(1.2)' },
        },
        'node-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'flow-move': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(40px)', opacity: '0' },
        },
        'ripple-expand': {
          '0%': { width: '180px', height: '180px', opacity: '0.8' },
          '100%': { width: '380px', height: '380px', opacity: '0' },
        },
        'fade-in-out': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'orbit': {
          'from': { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
          'to': { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' },
        },
        'ripple-out': {
          'to': { width: '110%', height: '140%', opacity: '0' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'orb-breathe': 'orb-breathe 4s ease-in-out infinite',
        'orbit-breathe': 'orbit-breathe 3s ease-in-out infinite',
        'orbit-pulse': 'orbit-pulse 1.5s ease-in-out infinite',
        'agent-pulse': 'agent-pulse 2s ease-in-out infinite',
        'brain-pulse': 'brain-pulse 3s ease-in-out infinite',
        'neural-flow': 'neural-flow 2s ease-in-out infinite',
        'stream-flow': 'stream-flow 3s linear infinite',
        'message-appear': 'message-appear 0.4s ease-out',
        'episode-appear': 'episode-appear 0.5s ease-out backwards',
        'typing-wave': 'typing-wave 1.4s ease-in-out infinite',
        'frequency-pulse': 'frequency-pulse 1.5s ease-in-out infinite',
        'shimmer-header': 'shimmer-header 3s ease-in-out infinite',
        'neural-pulse-text': 'neural-pulse-text 4s ease-in-out infinite',
        'date-pulse': 'date-pulse 2s ease-in-out infinite',
        'node-float': 'node-float 4s ease-in-out infinite',
        'flow-move': 'flow-move 1.5s ease-in-out infinite',
        'ripple-expand': 'ripple-expand 2s ease-out infinite',
        'fade-in-out': 'fade-in-out 2s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'rotate-slow': 'spin 120s linear infinite',
        'rotate-ring-fast': 'spin 15s linear infinite',
        'rotate-ring-medium': 'spin 20s linear infinite',
        'rotate-ring-slow': 'spin 25s linear infinite',
        'orbit': 'orbit 20s linear infinite',
        'ripple-out': 'ripple-out 1s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
