import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText, ArcGauge, StatusIndicator, GlassCard } from '../../components/shared';
import { AthenaOrb } from '../../components/voice/AthenaOrb';
import { useVoiceStore, type OrbState } from '../../stores/voiceStore';
import { useLiveKitVoice } from '../../hooks/useLiveKitVoice';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { GitBranch, Sparkles, Zap, Coins, Plus, Workflow, Users } from 'lucide-react';

// --- Types ---

interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  accent: string;
}

interface VitalsData {
  cpu: number;
  tokens: number;
  uptime: number;
}

interface DashboardStats {
  activeWorkflows: number;
  agentsOnline: number;
  oneShotsToday: number;
  tokensUsed: number;
}

interface RecentProject {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  lastModified: string;
}

// --- Orbital Node Configuration ---

interface OrbitalNodeDef {
  angle: number;
  type: 'active' | 'memory' | 'project' | 'infra';
}

interface OrbitalRingDef {
  size: number;
  nodes: OrbitalNodeDef[];
}

const ORBITAL_RINGS: OrbitalRingDef[] = [
  {
    size: 200,
    nodes: [
      { angle: 0, type: 'active' },
      { angle: 90, type: 'active' },
      { angle: 180, type: 'active' },
      { angle: 270, type: 'active' },
    ],
  },
  {
    size: 320,
    nodes: [
      { angle: 45, type: 'memory' },
      { angle: 135, type: 'memory' },
      { angle: 225, type: 'memory' },
      { angle: 315, type: 'memory' },
    ],
  },
  {
    size: 440,
    nodes: [
      { angle: 30, type: 'project' },
      { angle: 150, type: 'project' },
      { angle: 270, type: 'project' },
    ],
  },
  {
    size: 560,
    nodes: [
      { angle: 0, type: 'infra' },
      { angle: 72, type: 'infra' },
      { angle: 144, type: 'infra' },
      { angle: 216, type: 'infra' },
      { angle: 288, type: 'infra' },
    ],
  },
];

const NODE_COLORS: Record<string, string> = {
  active: '#10b981',
  memory: '#f59e0b',
  project: '#8b5cf6',
  infra: '#34d399',
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {return 'just now';}
  if (mins < 60) {return `${mins}m ago`;}
  const hours = Math.floor(mins / 60);
  if (hours < 24) {return `${hours}h ago`;}
  return `${Math.floor(hours / 24)}d ago`;
}

// --- Helper: get greeting based on time of day ---

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {return 'Good morning';}
  if (hour < 17) {return 'Good afternoon';}
  return 'Good evening';
}

// --- Orbital Node Sub-component ---

function OrbitalNode({ angle, type, ringSize }: { angle: number; type: string; ringSize: number }) {
  const radius = ringSize / 2;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  const color = NODE_COLORS[type] || '#00d4ff';

  return (
    <div
      className={type === 'active' ? 'animate-orbit-pulse' : 'animate-orbit-breathe'}
      style={{
        position: 'absolute',
        width: '12px',
        height: '12px',
        background: color,
        borderRadius: '50%',
        boxShadow: `0 0 12px ${color}`,
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      }}
    />
  );
}

// --- Activity Card Sub-component ---

function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <div
      className="relative flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        minWidth: '280px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        padding: '15px',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 h-full"
        style={{
          width: '3px',
          background: item.accent,
          boxShadow: `0 0 10px ${item.accent}`,
        }}
      />

      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: '40px',
          height: '40px',
          background: item.accent,
          fontSize: '18px',
          boxShadow: `0 0 20px ${item.accent}`,
        }}
      >
        {item.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{ fontSize: '13px', color: '#f0f0f5', marginBottom: '4px' }}
        >
          {item.text}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          {item.time}
        </div>
      </div>
    </div>
  );
}

// --- HomePage Main Component ---

export function HomePage() {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const isMobile = useBreakpoint('md');
  const [vitals, setVitals] = useState<VitalsData>({ cpu: 0, tokens: 0, uptime: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [networkStatus, setNetworkStatus] = useState<string>('connecting...');
  const [stats, setStats] = useState<DashboardStats>({
    activeWorkflows: 0,
    agentsOnline: 0,
    oneShotsToday: 0,
    tokensUsed: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const mountedRef = useRef(true);
  const stoppedRef = useRef(false);

  // Voice integration — Athena via LiveKit pipeline (real mic)
  const setOrbState = useVoiceStore(s => s.setOrbState);
  const setUserTranscript = useVoiceStore(s => s.setUserTranscript);
  const setAssistantResponse = useVoiceStore(s => s.setAssistantResponse);
  const setError = useVoiceStore(s => s.setError);
  const orbState = useVoiceStore(s => s.orbState);
  const userTranscript = useVoiceStore(s => s.userTranscript);
  const assistantResponse = useVoiceStore(s => s.assistantResponse);
  const lastError = useVoiceStore(s => s.lastError);

  const {
    isConnected,
    isListening,
    isAgentSpeaking,
    transcript,
    state: liveKitState,
    error: liveKitError,
    connect,
    disconnect,
    startListening: lkStartListening,
    stopListening: lkStopListening,
  } = useLiveKitVoice({
    roomName: 'athena-voice',
    autoConnect: false,
    onTranscript: (text, isFinal) => {
      if (stoppedRef.current) {return;}
      setUserTranscript(text);
      if (isFinal) {
        setOrbState('thinking');
      }
    },
    onAgentSpeaking: (speaking) => {
      if (stoppedRef.current) {return;}
      if (speaking) {
        setOrbState('speaking');
      } else if (orbState === 'speaking') {
        setOrbState('complete');
      }
    },
    onAgentResponse: (text) => {
      if (stoppedRef.current) {return;}
      setAssistantResponse(text);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Sync LiveKit state → voiceStore orbState
  useEffect(() => {
    if (stoppedRef.current) {return;}
    if (isListening && orbState !== 'listening' && orbState !== 'thinking') {
      setOrbState('listening');
    }
  }, [isListening, orbState, setOrbState]);

  // Sync transcript text
  useEffect(() => {
    if (transcript) {
      setUserTranscript(transcript);
    }
  }, [transcript, setUserTranscript]);

  // Sync LiveKit errors
  useEffect(() => {
    if (liveKitError) {
      setError(liveKitError);
    }
  }, [liveKitError, setError]);

  // Cleanup ref on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch dashboard stats
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL ?? '';

    const fetchStats = async () => {
      if (!authToken) {return;}
      try {
        const response = await fetch(`${API_BASE}/api/v1/dashboard/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.ok && mountedRef.current) {
          const data = await response.json();
          setStats({
            activeWorkflows: data.active_workflows ?? 0,
            agentsOnline: data.agents_online ?? 0,
            oneShotsToday: data.oneshots_today ?? 0,
            tokensUsed: data.tokens_used ?? 0,
          });
        }
      } catch {
        // Keep default values on error
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [authToken]);

  // Fetch recent projects
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL ?? '';

    const fetchProjects = async () => {
      if (!authToken) {return;}
      try {
        const response = await fetch(`${API_BASE}/api/v1/projects/summary/recent`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.ok && mountedRef.current) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setRecentProjects(data.slice(0, 4)); // Show max 4 projects
          }
        }
      } catch {
        // Keep empty on error
      }
    };

    fetchProjects();
    const interval = setInterval(fetchProjects, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [authToken]);

  // Fetch live data from backend APIs
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        // Fetch both endpoints in parallel
        const [meshRes, umsRes] = await Promise.allSettled([
          fetch('/api/v1/health/mesh'),
          fetch('/api/v1/ums/health'),
        ]);

        if (!mountedRef.current) {return;}

        // --- Parse mesh health for service statuses ---
        let healthyCount = 0;
        let totalCount = 0;
        const activityItems: ActivityItem[] = [];

        if (meshRes.status === 'fulfilled' && meshRes.value.ok) {
          const mesh = await meshRes.value.json();
          const services = mesh.services || {};

          for (const [name, svc] of Object.entries(services)) {
            totalCount++;
            if (svc.status === 'healthy') {healthyCount++;}

            activityItems.push({
              id: `svc-${name}`,
              icon: svc.status === 'healthy' ? '\u2705' : '\u26A0\uFE0F',
              text: `${name}: ${svc.status ?? 'unknown'}`,
              time: 'live',
              accent: svc.status === 'healthy' ? '#10b981' : '#f59e0b',
            });
          }

          setNetworkStatus(
            mesh.status === 'healthy'
              ? 'All systems operational'
              : `${healthyCount}/${totalCount} services healthy`
          );
        }

        // --- Parse UMS health for memory/knowledge vitals ---
        if (umsRes.status === 'fulfilled' && umsRes.value.ok) {
          const ums = await umsRes.value.json();

          // Map real data to vitals gauges
          const episodeCount = ums.episode_count ?? 0;
          const kgEntities = ums.knowledge_graph?.entities ?? 0;
          const kgFacts = ums.knowledge_graph?.facts ?? 0;
          const perceptionTotal = ums.perception_stats?.total_interactions ?? 0;

          setVitals({
            cpu: Math.min(100, Math.round((perceptionTotal / Math.max(perceptionTotal, 1)) * 100)),
            tokens: Math.min(100, Math.round((episodeCount / 100) * 100)),
            uptime: ums.status === 'healthy' ? 100 : 50,
          });

          // Add UMS activity items
          activityItems.push({
            id: 'ums-episodes',
            icon: '\uD83E\uDDE0',
            text: `${episodeCount} episodes stored`,
            time: 'live',
            accent: '#8b5cf6',
          });

          activityItems.push({
            id: 'ums-knowledge',
            icon: '\uD83D\uDCCA',
            text: `${kgEntities} entities, ${kgFacts} facts in knowledge graph`,
            time: 'live',
            accent: '#c084fc',
          });

          const consolidation = ums.consolidation;
          if (consolidation?.last_runs?.fast_loop) {
            activityItems.push({
              id: 'ums-consolidation',
              icon: '\u26A1',
              text: `Last consolidation ${formatTimeAgo(consolidation.last_runs.fast_loop)}`,
              time: formatTimeAgo(consolidation.last_runs.fast_loop),
              accent: '#f59e0b',
            });
          }

          if (consolidation?.scheduler_running) {
            activityItems.push({
              id: 'ums-scheduler',
              icon: '\u2699\uFE0F',
              text: 'Consolidation scheduler active',
              time: 'live',
              accent: '#00d4ff',
            });
          }

          const perception = ums.perception_stats;
          if (perception) {
            activityItems.push({
              id: 'ums-perception',
              icon: '\uD83D\uDC41\uFE0F',
              text: `${perception.total_interactions} interactions, ${perception.high_salience_count} high salience`,
              time: 'live',
              accent: '#10b981',
            });
          }
        }

        if (mountedRef.current && activityItems.length > 0) {
          setActivity(activityItems);
        }
      } catch {
        // Keep previous data on error
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting();
  const displayName = user?.username || 'Tony';

  // Voice state machine — tap the orb to interact with Athena
  const handleOrbTap = useCallback(async () => {
    try {
      // Auto-connect if needed
      if (!isConnected) {
        await connect();
      }

      switch (orbState) {
        case 'idle':
        case 'complete':
          stoppedRef.current = false;
          setUserTranscript('');
          setAssistantResponse('');
          await lkStartListening();
          setOrbState('listening');
          break;
        case 'listening':
        case 'thinking':
        case 'speaking':
          // Stop and fully disconnect from the voice session
          stoppedRef.current = true;
          setOrbState('idle');
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

  const handleReplay = useCallback(() => {
    // Replay not available in real pipeline mode — could re-request TTS
    setOrbState('speaking');
  }, [setOrbState]);

  const handleErrorDismiss = useCallback(() => {
    useVoiceStore.getState().setError(null);
  }, []);

  return (
    <div className="relative h-full" style={{ padding: isMobile ? '20px 16px 140px' : '40px 60px' }}>
      {/* Header */}
      <header style={{ marginBottom: isMobile ? '30px' : '60px' }}>
        <GradientText
          as="h1"
          animate
          glow
          className="block"
          gradient="cyan-violet"
        >
          <span style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 700 }}>Pronetheia</span>
        </GradientText>

        <p
          className="text-greeting"
          style={{ color: '#f0f0f5', marginBottom: '8px' }}
        >
          {greeting}, {displayName}
        </p>

        <StatusIndicator
          status={networkStatus.includes('All') ? 'active' : 'idle'}
          text={networkStatus}
        />
      </header>

      {/* System Vitals - responsive layout */}
      <div
        className={isMobile ? 'flex gap-4 overflow-x-auto pb-2' : 'absolute flex gap-8'}
        style={isMobile ? { marginBottom: '20px' } : { top: '40px', right: '60px' }}
      >
        <ArcGauge
          value={vitals.cpu}
          label="Perception"
          gradient={['#00d4ff', '#8b5cf6']}
          size={isMobile ? 60 : 80}
        />
        <ArcGauge
          value={vitals.tokens}
          label="Episodes"
          gradient={['#f59e0b', '#fbbf24']}
          size={isMobile ? 60 : 80}
        />
        <ArcGauge
          value={vitals.uptime}
          label="UMS"
          gradient={['#10b981', '#34d399']}
          size={isMobile ? 60 : 80}
        />
      </div>

      {/* Dashboard Stats Row - responsive grid */}
      <div 
        className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`} 
        style={{ maxWidth: '1200px', margin: isMobile ? '0 0 20px' : '0 auto 40px' }}
      >
        <GlassCard variant="bordered" className="p-4">
          <div className="flex items-center gap-3">
            <GitBranch size={16} style={{ color: '#8b5cf6' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Active Workflows
              </div>
              <div style={{ fontSize: '24px', color: '#f0f0f5', fontWeight: 700 }}>
                {stats.activeWorkflows}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="bordered" className="p-4">
          <div className="flex items-center gap-3">
            <Sparkles size={16} style={{ color: '#00d4ff' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Agents Online
              </div>
              <div style={{ fontSize: '24px', color: '#f0f0f5', fontWeight: 700 }}>
                {stats.agentsOnline}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="bordered" className="p-4">
          <div className="flex items-center gap-3">
            <Zap size={16} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                One-Shots Today
              </div>
              <div style={{ fontSize: '24px', color: '#f0f0f5', fontWeight: 700 }}>
                {stats.oneShotsToday}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="bordered" className="p-4">
          <div className="flex items-center gap-3">
            <Coins size={16} style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Tokens Used
              </div>
              <div style={{ fontSize: '24px', color: '#f0f0f5', fontWeight: 700 }}>
                {stats.tokensUsed.toLocaleString()}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions - stack on mobile */}
      <div 
        className={`flex gap-4 mb-12 ${isMobile ? 'flex-col' : ''}`} 
        style={{ maxWidth: '1200px', margin: isMobile ? '0 0 30px' : '0 auto 60px' }}
      >
        <button
          onClick={() => navigate('/build')}
          className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            color: '#f0f0f5',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} style={{ color: '#00d4ff' }} />
          New One-Shot
        </button>

        <button
          onClick={() => navigate('/workflows')}
          className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            color: '#f0f0f5',
            cursor: 'pointer',
          }}
        >
          <Workflow size={16} style={{ color: '#8b5cf6' }} />
          Create Workflow
        </button>

        <button
          onClick={() => navigate('/agents')}
          className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            color: '#f0f0f5',
            cursor: 'pointer',
          }}
        >
          <Users size={16} style={{ color: '#10b981' }} />
          Browse Agents
        </button>
      </div>

      {/* Neural Orb Visualization */}
      <div
        className="flex justify-center items-center relative"
        style={{ height: isMobile ? '350px' : '600px', margin: '0 auto' }}
      >
        {/* AthenaOrb — OUTSIDE the rotating container so it stays fixed */}
        <div
          className="absolute z-10"
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
            onReplay={handleReplay}
            onErrorDismiss={handleErrorDismiss}
            size={isMobile ? 'medium' : 'large'}
          />
        </div>

        {/* Orbital rings rotate around the orb — orb itself stays still */}
        <div
          className="relative animate-rotate-slow"
          style={{ width: isMobile ? '300px' : '600px', height: isMobile ? '300px' : '600px' }}
        >
          {ORBITAL_RINGS.map((ring, i) => (
            <div key={i}>
              <div
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  width: `${ring.size}px`,
                  height: `${ring.size}px`,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              {ring.nodes.map((node, j) => (
                <OrbitalNode
                  key={`${i}-${j}`}
                  angle={node.angle}
                  type={node.type}
                  ringSize={ring.size}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Projects - responsive grid */}
      {recentProjects.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: isMobile ? '0 0 20px' : '0 auto 40px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>
            Recent Projects
          </h3>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {recentProjects.map((project) => (
              <GlassCard
                key={project.id}
                variant="bordered"
                className="p-4 cursor-pointer transition-all duration-200 hover:scale-105"
                onClick={() => navigate('/projects')}
              >
                <div className="flex flex-col gap-2">
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f5' }}>
                    {project.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background:
                          project.status === 'active'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : project.status === 'completed'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          project.status === 'active'
                            ? '#10b981'
                            : project.status === 'completed'
                            ? '#8b5cf6'
                            : '#f59e0b',
                      }}
                    >
                      {project.status}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      {formatTimeAgo(project.lastModified)}
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Activity Stream - live data from backend */}
      <div
        className="fixed ni-glass ni-scrollbar"
        style={{
          bottom: isMobile ? '70px' : '40px',
          left: isMobile ? '16px' : '120px',
          right: isMobile ? '16px' : '60px',
          height: isMobile ? '100px' : '120px',
          borderRadius: '20px',
          padding: isMobile ? '12px' : '20px',
          overflowX: 'auto',
          overflowY: 'hidden',
          zIndex: 20,
        }}
      >
        <div className="flex gap-4 h-full">
          {activity.length > 0 ? (
            activity.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))
          ) : (
            <div
              className="flex items-center justify-center w-full"
              style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}
            >
              Connecting to neural network...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
