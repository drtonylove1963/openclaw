/**
 * ArenaDashboard - Comprehensive Arena session management interface
 *
 * Features:
 * - Real-time track status monitoring
 * - Escalation handling (HITL - Human in the Loop)
 * - File comparison across tracks
 * - Winner selection and merge
 * - Session history and replay
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface ArenaTrack {
  id: string;
  name: string;
  status: 'spawning' | 'ready' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  agent: string;
  coach: string;
  files: ArenaFile[];
  messages: TrackMessage[];
  metrics: TrackMetrics;
  started_at: string;
  completed_at?: string;
}

interface ArenaFile {
  path: string;
  status: 'created' | 'modified' | 'deleted';
  lines: number;
  language: string;
}

interface TrackMessage {
  id: string;
  timestamp: string;
  role: 'agent' | 'coach' | 'system';
  content: string;
}

interface TrackMetrics {
  files_created: number;
  lines_of_code: number;
  tests_written: number;
  test_coverage?: number;
  complexity_score?: number;
}

interface ArenaEscalation {
  id: string;
  track_id: string;
  type: 'decision' | 'clarification' | 'approval' | 'conflict';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  options?: EscalationOption[];
  context?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  resolution?: string;
}

interface EscalationOption {
  value: string;
  label: string;
  description?: string;
}

interface ArenaSession {
  id: string;
  project_name: string;
  status: 'spawning' | 'ready' | 'running' | 'evaluating' | 'complete' | 'failed';
  track_count: number;
  tracks: ArenaTrack[];
  escalations: ArenaEscalation[];
  winner_track_id?: string;
  created_at: string;
  completed_at?: string;
}

interface ArenaDashboardProps {
  arenaId: string;
  onClose: () => void;
  onComplete?: (winnerTrackId: string) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm'
}) => {
  const colors: Record<string, string> = {
    spawning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400',
    ready: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400',
    running: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400',
    paused: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
    evaluating: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-400',
    completed: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400',
    complete: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400',
    failed: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400'
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`${sizeClasses} rounded-full font-medium ${colors[status] || colors.ready}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ProgressBar: React.FC<{ progress: number; color?: string }> = ({
  progress,
  color = 'bg-blue-500'
}) => (
  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    <div
      className={`h-full ${color} rounded-full transition-all duration-500`}
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const ArenaDashboard: React.FC<ArenaDashboardProps> = ({
  arenaId,
  onClose,
  onComplete
}) => {
  // State
  const [session, setSession] = useState<ArenaSession | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'messages' | 'compare'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/arena/${arenaId}`);
      if (!response.ok) {throw new Error('Failed to fetch arena session');}
      const data = await response.json();
      setSession(data);
      setIsLoading(false);

      // Auto-select first track if none selected
      if (!selectedTrackId && data.tracks?.length > 0) {
        setSelectedTrackId(data.tracks[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
      setIsLoading(false);
    }
  }, [arenaId, selectedTrackId]);

  // Initial fetch and SSE setup
  useEffect(() => {
    fetchSession();

    // Setup SSE for real-time updates
    const eventSource = new EventSource(`/api/v1/arena/${arenaId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        handleUpdate(update);
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    eventSource.onerror = () => {
      setLogs(prev => [...prev, 'Connection lost, reconnecting...']);
    };

    return () => {
      eventSource.close();
    };
  }, [arenaId, fetchSession]);

  // ============================================================================
  // Update Handler
  // ============================================================================

  const handleUpdate = useCallback((update: any) => {
    switch (update.type) {
      case 'session_update':
        setSession(prev => prev ? { ...prev, ...update.session } : null);
        break;

      case 'track_update':
        setSession(prev => {
          if (!prev) {return null;}
          const tracks = prev.tracks.map(t =>
            t.id === update.track_id ? { ...t, ...update.track } : t
          );
          return { ...prev, tracks };
        });
        break;

      case 'track_progress':
        setSession(prev => {
          if (!prev) {return null;}
          const tracks = prev.tracks.map(t =>
            t.id === update.track_id ? { ...t, progress: update.progress } : t
          );
          return { ...prev, tracks };
        });
        break;

      case 'file_created':
      case 'file_modified':
        setSession(prev => {
          if (!prev) {return null;}
          const tracks = prev.tracks.map(t => {
            if (t.id !== update.track_id) {return t;}
            const existingFile = t.files.find(f => f.path === update.file.path);
            const files = existingFile
              ? t.files.map(f => f.path === update.file.path ? update.file : f)
              : [...t.files, update.file];
            return { ...t, files };
          });
          return { ...prev, tracks };
        });
        break;

      case 'message':
        setSession(prev => {
          if (!prev) {return null;}
          const tracks = prev.tracks.map(t => {
            if (t.id !== update.track_id) {return t;}
            return { ...t, messages: [...t.messages, update.message] };
          });
          return { ...prev, tracks };
        });
        setLogs(prev => [...prev, `[${update.track_id}] ${update.message.role}: ${update.message.content.substring(0, 100)}...`]);
        break;

      case 'escalation':
        setSession(prev => {
          if (!prev) {return null;}
          return { ...prev, escalations: [...prev.escalations, update.escalation] };
        });
        setLogs(prev => [...prev, `Escalation: ${update.escalation.title}`]);
        break;

      case 'evaluation_start':
        setSession(prev => prev ? { ...prev, status: 'evaluating' } : null);
        setLogs(prev => [...prev, 'Starting track evaluation...']);
        break;

      case 'winner_selected':
        setSession(prev => prev ? { ...prev, winner_track_id: update.winner_track_id, status: 'complete' } : null);
        setLogs(prev => [...prev, `Winner selected: Track ${update.winner_track_id}`]);
        break;

      case 'log':
        setLogs(prev => [...prev, update.message]);
        break;

      case 'complete':
        setSession(prev => prev ? { ...prev, status: 'complete' } : null);
        setLogs(prev => [...prev, 'Arena session complete!']);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        break;

      case 'error':
        setError(update.message);
        setLogs(prev => [...prev, `Error: ${update.message}`]);
        break;
    }
  }, []);

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleEscalationResponse = async (escalationId: string, response: string) => {
    try {
      await fetch(`/api/v1/arena/${arenaId}/escalation/${escalationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });

      setSession(prev => {
        if (!prev) {return null;}
        const escalations = prev.escalations.map(e =>
          e.id === escalationId ? { ...e, status: 'resolved' as const, resolution: response } : e
        );
        return { ...prev, escalations };
      });
    } catch (err) {
      setError('Failed to submit escalation response');
    }
  };

  const handleSelectWinner = async (trackId: string) => {
    try {
      await fetch(`/api/v1/arena/${arenaId}/select-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: trackId })
      });

      setSession(prev => prev ? { ...prev, winner_track_id: trackId } : null);
      onComplete?.(trackId);
    } catch (err) {
      setError('Failed to select winner');
    }
  };

  const handlePauseTrack = async (trackId: string) => {
    try {
      await fetch(`/api/v1/arena/${arenaId}/tracks/${trackId}/pause`, {
        method: 'POST'
      });
    } catch (err) {
      setError('Failed to pause track');
    }
  };

  const handleResumeTrack = async (trackId: string) => {
    try {
      await fetch(`/api/v1/arena/${arenaId}/tracks/${trackId}/resume`, {
        method: 'POST'
      });
    } catch (err) {
      setError('Failed to resume track');
    }
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const selectedTrack = session?.tracks.find(t => t.id === selectedTrackId);

  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Arena: {session?.project_name || 'Loading...'}
        </h2>
        {session && <StatusBadge status={session.status} size="md" />}
      </div>
      <div className="flex items-center gap-3">
        {session?.status === 'evaluating' && (
          <span className="text-sm text-purple-600 dark:text-purple-400 animate-pulse">
            Evaluating tracks...
          </span>
        )}
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderTracksSidebar = () => (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Tracks ({session?.tracks.length || 0})
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {session?.tracks.map((track) => (
          <div
            key={track.id}
            onClick={() => setSelectedTrackId(track.id)}
            className={`
              p-3 cursor-pointer transition-colors
              ${selectedTrackId === track.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
              ${session?.winner_track_id === track.id
                ? 'ring-2 ring-green-500 ring-inset'
                : ''}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {track.name}
              </span>
              <StatusBadge status={track.status} />
            </div>
            <ProgressBar progress={track.progress} />
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>{track.metrics.files_created} files</span>
              <span>{track.metrics.lines_of_code} LOC</span>
            </div>
            {session?.winner_track_id === track.id && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                Winner
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderEscalations = () => {
    const pendingEscalations = session?.escalations.filter(e => e.status === 'pending') || [];
    if (pendingEscalations.length === 0) {return null;}

    return (
      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          Action Required ({pendingEscalations.length})
        </h3>
        <div className="space-y-3">
          {pendingEscalations.map((esc) => (
            <div key={esc.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {esc.title}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    esc.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400' :
                    esc.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {esc.priority}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Track: {session?.tracks.find(t => t.id === esc.track_id)?.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {esc.description}
              </p>
              {esc.options ? (
                <div className="flex flex-wrap gap-2">
                  {esc.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleEscalationResponse(esc.id, opt.value)}
                      className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300
                                 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600
                                 transition-colors"
                      title={opt.description}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Type your response..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                             rounded-lg bg-white dark:bg-gray-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleEscalationResponse(esc.id, e.currentTarget.value);
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Track Details */}
      {selectedTrack && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedTrack.name}
            </h3>
            <div className="flex gap-2">
              {selectedTrack.status === 'running' && (
                <button
                  onClick={() => handlePauseTrack(selectedTrack.id)}
                  className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900
                             text-yellow-700 dark:text-yellow-400 rounded-lg
                             hover:bg-yellow-200 dark:hover:bg-yellow-800"
                >
                  Pause
                </button>
              )}
              {selectedTrack.status === 'paused' && (
                <button
                  onClick={() => handleResumeTrack(selectedTrack.id)}
                  className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900
                             text-green-700 dark:text-green-400 rounded-lg
                             hover:bg-green-200 dark:hover:bg-green-800"
                >
                  Resume
                </button>
              )}
              {session?.status === 'evaluating' && !session.winner_track_id && (
                <button
                  onClick={() => handleSelectWinner(selectedTrack.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700"
                >
                  Select as Winner
                </button>
              )}
            </div>
          </div>

          {/* Agent/Coach Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Agent</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedTrack.agent}
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coach</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedTrack.coach}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTrack.metrics.files_created}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Files</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTrack.metrics.lines_of_code}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Lines</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTrack.metrics.tests_written}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Tests</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTrack.metrics.test_coverage || 'N/A'}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Coverage</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-2">
      {selectedTrack?.files.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No files generated yet
        </div>
      ) : (
        selectedTrack?.files.map((file) => (
          <div
            key={file.path}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800
                       rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className={`
                w-2 h-2 rounded-full
                ${file.status === 'created' ? 'bg-green-500' :
                  file.status === 'modified' ? 'bg-yellow-500' : 'bg-red-500'}
              `} />
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {file.path}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{file.language}</span>
              <span>{file.lines} lines</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {selectedTrack?.messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No messages yet
        </div>
      ) : (
        selectedTrack?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.role === 'agent'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                : msg.role === 'coach'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-l-2 border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {msg.role}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {msg.content}
            </p>
          </div>
        ))
      )}
    </div>
  );

  const renderCompareTab = () => {
    if (!session || session.tracks.length < 2) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Need at least 2 tracks to compare
        </div>
      );
    }

    // Find common files across tracks
    const allFiles = new Set<string>();
    session.tracks.forEach(t => t.files.forEach(f => allFiles.add(f.path)));

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                File
              </th>
              {session.tracks.map(track => (
                <th key={track.id} className="text-center py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {track.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(allFiles).map(filePath => (
              <tr key={filePath} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-3 font-mono text-sm text-gray-900 dark:text-white">
                  {filePath}
                </td>
                {session.tracks.map(track => {
                  const file = track.files.find(f => f.path === filePath);
                  return (
                    <td key={track.id} className="text-center py-2 px-3">
                      {file ? (
                        <span className="text-green-600 dark:text-green-400">
                          {file.lines} lines
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderLogs = () => (
    <div className="mt-4 p-3 bg-gray-900 rounded-lg max-h-32 overflow-y-auto">
      <div className="font-mono text-xs text-gray-300">
        {logs.map((log, idx) => (
          <div key={idx} className="py-0.5">
            <span className="text-gray-500">[{String(idx).padStart(3, '0')}]</span>{' '}
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );

  // ============================================================================
  // Loading / Error States
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading Arena session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      {renderHeader()}

      <div className="flex flex-1 overflow-hidden">
        {renderTracksSidebar()}

        <div className="flex-1 p-4 overflow-y-auto">
          {/* Escalations */}
          {renderEscalations()}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                           dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
            {(['overview', 'files', 'messages', 'compare'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'files' && renderFilesTab()}
          {activeTab === 'messages' && renderMessagesTab()}
          {activeTab === 'compare' && renderCompareTab()}

          {/* Logs */}
          {renderLogs()}
        </div>
      </div>
    </div>
  );
};

export default ArenaDashboard;
