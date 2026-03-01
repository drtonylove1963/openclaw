import { useCallback, useEffect, useState } from 'react';
import { AthenaOrb } from '../../components/voice/AthenaOrb';
import { useVoiceStore } from '../../stores/voiceStore';
import { useLiveKitVoice } from '../../hooks/useLiveKitVoice';
import { GradientText, StatusIndicator, ArcGauge } from '../../components/shared';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {return 'Good morning';}
  if (hour < 17) {return 'Good afternoon';}
  return 'Good evening';
}

/**
 * VoicePage - Athena Voice Interface (Home page for voice).
 *
 * Full-page voice interaction with:
 * - Header with brand title, greeting, and status
 * - System vitals gauges (top-right)
 * - Centered AthenaOrb with full state machine animations
 * - Activity stream cards (bottom)
 *
 * From mockup-v2-04-voice.html
 */
export function VoicePage() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState({ cpu: 75, tokens: 60, uptime: 95 });
  const isMobile = useBreakpoint('md');

  const {
    orbState,
    userTranscript,
    assistantResponse,
    lastError,
    setOrbState,
    setUserTranscript,
    setAssistantResponse,
    setError,
  } = useVoiceStore();

  const {
    connect,
    disconnect,
    startListening: lkStartListening,
    stopListening: lkStopListening,
    isConnected,
  } = useLiveKitVoice({
    roomName: 'athena-voice',
    autoConnect: false,
    onTranscript: (text, isFinal) => {
      setUserTranscript(text);
      if (isFinal) {
        setOrbState('thinking');
      }
    },
    onAgentSpeaking: (speaking) => {
      if (speaking) {
        setOrbState('speaking');
      } else if (orbState === 'speaking') {
        setOrbState('complete');
      }
    },
    onAgentResponse: (text) => {
      setAssistantResponse(text);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Fetch vitals from backend health endpoint
  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await fetch('/api/v1/health/mesh');
        if (res.ok) {
          const data = await res.json();
          if (data.cpu_percent != null) {
            setVitals((prev) => ({ ...prev, cpu: data.cpu_percent }));
          }
        }
      } catch {
        // Use demo data on error
      }
    };
    fetchVitals();
    const interval = setInterval(fetchVitals, 30000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting();
  const displayName = user?.username || 'Tony';

  const handleOrbTap = useCallback(async () => {
    try {
      // Auto-connect if needed
      if (!isConnected) {
        await connect();
      }

      switch (orbState) {
        case 'idle':
        case 'complete':
          setUserTranscript('');
          setAssistantResponse('');
          await lkStartListening();
          setOrbState('listening');
          break;
        case 'listening':
        case 'thinking':
        case 'speaking':
          // Stop and fully disconnect from the voice session
          await disconnect();
          setOrbState('idle');
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice connection failed');
    }
  }, [orbState, isConnected, connect, disconnect, lkStartListening, lkStopListening, setOrbState, setUserTranscript, setAssistantResponse, setError]);

  const handleErrorDismiss = useCallback(() => {
    useVoiceStore.getState().setError(null);
  }, []);

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{ background: '#0a0a0f', padding: isMobile ? '20px 20px' : '40px 60px' }}
    >
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-start'} mb-[${isMobile ? '40px' : '60px'}]`}>
        <div>
          <GradientText
            as="h1"
            gradient="tricolor"
            className={isMobile ? 'text-[32px]' : 'text-[42px] font-semibold'}
          >
            Pronetheia
          </GradientText>
          <p style={{ fontSize: isMobile ? '14px' : '18px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '6px' }}>
            {greeting}, {displayName}
          </p>
          <StatusIndicator status="active" text="Your neural network is active" />
        </div>

        {/* Gauge Cluster - stack on mobile */}
        <div className={`flex ${isMobile ? 'justify-center gap-4' : 'gap-[30px]'}`}>
          <ArcGauge label="CPU Load" value={vitals.cpu} gradient={['#00f0ff', '#8b5cf6']} size={isMobile ? 70 : 100} />
          <ArcGauge label="Token Usage" value={vitals.tokens} gradient={['#7b61ff', '#c084fc']} size={isMobile ? 70 : 100} />
          <ArcGauge label="System Uptime" value={vitals.uptime} gradient={['#10b981', '#34d399']} size={isMobile ? 70 : 100} />
        </div>
      </div>

      {/* Athena Orb Container (Centered) */}
      <div
        className="absolute flex flex-col items-center z-[5]"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <AthenaOrb
          orbState={orbState}
          userTranscript={userTranscript}
          assistantResponse={assistantResponse}
          error={lastError}
          onTap={handleOrbTap}
          onReplay={() => setOrbState('speaking')}
          onErrorDismiss={handleErrorDismiss}
          size={isMobile ? 'medium' : 'large'}
        />
      </div>

      {/* Activity Stream (bottom) - stack on mobile */}
      <div
        className={`fixed flex ${isMobile ? 'flex-col gap-3' : 'gap-5'} z-[2]`}
        style={{ 
          bottom: isMobile ? '20px' : '40px', 
          left: isMobile ? '20px' : '100px',
          right: isMobile ? '20px' : 'auto'
        }}
      >
        <ActivityCard
          title="Tests Passing"
          value="322/323"
          borderColor="#10b981"
          isMobile={isMobile}
        />
        <ActivityCard
          title="Memory Consolidation"
          value="47 min ago"
          borderColor="#00f0ff"
          isMobile={isMobile}
        />
        <ActivityCard
          title="Active Agents"
          value="12 running"
          borderColor="#f59e0b"
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

function ActivityCard({
  title,
  value,
  borderColor,
  isMobile = false,
}: {
  title: string;
  value: string;
  borderColor: string;
  isMobile?: boolean;
}) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        padding: '16px 20px',
        width: isMobile ? 'auto' : '220px',
        borderLeft: `3px solid ${borderColor}`,
        minHeight: isMobile ? '60px' : 'auto',
      }}
    >
      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
        {value}
      </div>
    </div>
  );
}
