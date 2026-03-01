/**
 * useSwarm Hook
 *
 * React hook for agent swarm orchestration with real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Swarm,
  SwarmAgent,
  SwarmTask,
  SwarmResult,
  SwarmEvent,
  SwarmStats,
  createSwarm,
  listSwarms,
  executeSwarm,
  getSwarmStatus,
  getSwarmResult,
  getSwarmStats,
  createSwarmEventStream,
} from '../services/swarm-api';

interface UseSwarmOptions {
  autoConnect?: boolean;
  onEvent?: (event: SwarmEvent) => void;
}

interface UseSwarmReturn {
  // State
  swarms: Swarm[];
  activeSwarm: Swarm | null;
  result: SwarmResult | null;
  events: SwarmEvent[];
  stats: SwarmStats | null;
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;

  // Actions
  createNewSwarm: (task: SwarmTask, strategy?: string) => Promise<Swarm>;
  loadSwarms: () => Promise<void>;
  selectSwarm: (swarmId: string) => Promise<void>;
  execute: (swarmId: string) => Promise<SwarmResult>;
  loadStats: () => Promise<void>;
  clearEvents: () => void;
  clearError: () => void;

  // WebSocket
  isConnected: boolean;
  connect: (swarmId: string) => void;
  disconnect: () => void;
}

export function useSwarm(options: UseSwarmOptions = {}): UseSwarmReturn {
  const { autoConnect = false, onEvent } = options;

  // State
  const [swarms, setSwarms] = useState<Swarm[]>([]);
  const [activeSwarm, setActiveSwarm] = useState<Swarm | null>(null);
  const [result, setResult] = useState<SwarmResult | null>(null);
  const [events, setEvents] = useState<SwarmEvent[]>([]);
  const [stats, setStats] = useState<SwarmStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // S-25: Exponential backoff state (1s, 2s, 4s, 8s, max 60s, max 10 attempts)
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  // CR-013: Use ref for event handler to avoid stale closure in connect callback
  const handleEventRef = useRef<(event: SwarmEvent) => void>(() => {});

  // Event handlers
  const handleEvent = useCallback(
    (event: SwarmEvent) => {
      console.log('[useSwarm] Event received:', event);

      // Add to events list
      // S-12: Bound event list to prevent unbounded memory growth
      setEvents((prev) => [...prev, event].slice(-500));

      // Update active swarm status based on events
      if (event.event_type === 'execution_complete' && activeSwarm?.swarm_id === event.swarm_id) {
        setActiveSwarm((prev) =>
          prev ? { ...prev, status: 'completed' } : null
        );
      }

      // Call custom event handler
      if (onEvent) {
        onEvent(event);
      }
    },
    [activeSwarm, onEvent]
  );

  // CR-013: Keep ref in sync with latest handleEvent
  useEffect(() => {
    handleEventRef.current = handleEvent;
  }, [handleEvent]);

  // WebSocket management
  const connect = useCallback((swarmId: string, isReconnect = false) => {
    // Disconnect existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // S-25: Check max reconnect attempts
    if (isReconnect && reconnectAttempts.current >= maxReconnectAttempts) {
      setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
      return;
    }

    try {
      const ws = createSwarmEventStream(
        swarmId,
        // CR-013: Use ref to always call latest handleEvent, avoiding stale closure
        (event: SwarmEvent) => handleEventRef.current(event),
        (error) => {
          console.error('[useSwarm] WebSocket error:', error);
          setIsConnected(false);
        },
        () => {
          setIsConnected(false);

          // S-25: Auto-reconnect with exponential backoff
          if (autoConnect) {
            reconnectAttempts.current += 1;
            // Calculate backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s (max)
            const backoffMs = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current - 1),
              60000
            );

            console.log(
              `[useSwarm] Reconnecting in ${backoffMs}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              connect(swarmId, true);
            }, backoffMs);
          }
        },
        undefined, // token (use default from getAuthToken)
        () => {
          // NEW-06: Set connected AFTER handshake completes (onOpen callback)
          setIsConnected(true);
          // Reset reconnect attempts on successful connection
          if (isReconnect) {
            reconnectAttempts.current = 0;
          }
        }
      );

      wsRef.current = ws;
    } catch (err) {
      console.error('[useSwarm] Failed to connect:', err);
      const rawMessage = err instanceof Error ? err.message : 'Failed to connect';
      const friendlyMessage =
        rawMessage.includes('Authentication token required')
          ? 'Your session has expired. Please log in again to connect to real-time updates.'
          : rawMessage;
      setError(friendlyMessage);
    }
  }, [autoConnect]); // CR-013: Removed handleEvent dep — using ref instead

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // API actions
  const createNewSwarm = useCallback(async (task: SwarmTask, strategy: string = 'democratic') => {
    setIsLoading(true);
    setError(null);

    try {
      const swarm = await createSwarm({ task, strategy });
      setActiveSwarm(swarm);
      setSwarms((prev) => [...prev, swarm]);

      // Auto-connect if enabled
      if (autoConnect) {
        connect(swarm.swarm_id);
      }

      return swarm;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create swarm';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [autoConnect, connect]);

  const loadSwarms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listSwarms();
      setSwarms(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load swarms';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectSwarm = useCallback(async (swarmId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const swarm = await getSwarmStatus(swarmId);
      setActiveSwarm(swarm);

      // Try to load result if completed
      if (swarm.status === 'completed') {
        try {
          const res = await getSwarmResult(swarmId);
          setResult(res);
        } catch (err) {
          // Result might not be available yet
          console.log('[useSwarm] Result not yet available');
        }
      }

      // Auto-connect if enabled
      if (autoConnect) {
        connect(swarmId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select swarm';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [autoConnect, connect]);

  const execute = useCallback(async (swarmId: string) => {
    setIsExecuting(true);
    setError(null);

    try {
      const res = await executeSwarm(swarmId);
      setResult(res);

      // Update swarm status
      setActiveSwarm((prev) =>
        prev && prev.swarm_id === swarmId
          ? { ...prev, status: 'completed' }
          : prev
      );

      return res;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute swarm';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSwarmStats();
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stats';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // H-4: Cleanup on unmount (stable disconnect reference)
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []); // H-4: Empty deps - cleanup refs directly

  return {
    // State
    swarms,
    activeSwarm,
    result,
    events,
    stats,
    isLoading,
    isExecuting,
    error,

    // Actions
    createNewSwarm,
    loadSwarms,
    selectSwarm,
    execute,
    loadStats,
    clearEvents,
    clearError,

    // WebSocket
    isConnected,
    connect,
    disconnect,
  };
}
