/**
 * useExecutionWebSocket - Hook for real-time agent execution updates
 *
 * Connects to the backend WebSocket for streaming execution updates,
 * managing reconnection and state synchronization.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  message: string;
  tool?: string;
  details?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

interface AgentExecution {
  id: string;
  story_id: string;
  story_title: string;
  agent_type: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  phase: string;
  started_at: string;
  progress: number;
  current_action?: string;
  logs: ExecutionLog[];
  messages: ChatMessage[];
  worktree?: {
    branch_name: string;
    worktree_path: string;
    status: string;
  };
}

interface WebSocketMessage {
  type: 'initial_state' | 'execution_update' | 'heartbeat';
  execution_id?: string;
  execution?: AgentExecution;
  executions?: AgentExecution[];
  count?: number;
  active_count?: number;
  timestamp?: string;
}

interface UseExecutionWebSocketOptions {
  /**
   * Base URL for WebSocket connection
   * Default: constructs from window.location
   */
  baseUrl?: string;

  /**
   * Whether to connect to all executions or a specific one
   */
  executionId?: string;

  /**
   * Reconnection delay in ms
   */
  reconnectDelay?: number;

  /**
   * Maximum reconnection attempts
   */
  maxReconnectAttempts?: number;

  /**
   * Callback when executions are updated
   */
  onUpdate?: (executions: AgentExecution[]) => void;
}

export function useExecutionWebSocket(options: UseExecutionWebSocketOptions = {}) {
  const {
    baseUrl,
    executionId,
    reconnectDelay = 2000,
    maxReconnectAttempts = 5,
    onUpdate,
  } = options;

  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store onUpdate in a ref to avoid dependency changes triggering reconnects
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const getWebSocketUrl = useCallback(() => {
    if (baseUrl) {
      return baseUrl;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    if (executionId) {
      return `${protocol}//${host}/api/v1/sprint/agent/execution/${executionId}/ws`;
    }

    return `${protocol}//${host}/api/v1/sprint/agent/executions/ws`;
  }, [baseUrl, executionId]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'initial_state':
          if (data.executions) {
            setExecutions(data.executions);
            onUpdateRef.current?.(data.executions);
          } else if (data.execution) {
            setExecutions([data.execution]);
            onUpdateRef.current?.([data.execution]);
          }
          break;

        case 'execution_update':
          if (data.execution) {
            setExecutions((prev) => {
              const index = prev.findIndex((e) => e.id === data.execution_id);
              let updated: AgentExecution[];
              if (index >= 0) {
                updated = [...prev];
                updated[index] = data.execution!;
              } else {
                updated = [...prev, data.execution];
              }
              onUpdateRef.current?.(updated);
              return updated;
            });
          }
          break;

        case 'heartbeat':
          // Connection is alive, nothing to do
          break;
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }, []); // No dependencies - uses ref for callback

  const connect = useCallback(() => {
    // Check for both OPEN and CONNECTING states to prevent race conditions
    // (especially from React StrictMode double-mounting)
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Clean up any existing WebSocket that might be in CLOSING state
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      try {
        wsRef.current.close();
      } catch {
        // Ignore close errors
      }
      wsRef.current = null;
    }

    const url = getWebSocketUrl();

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('Execution WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('Execution WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);

          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionError('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [getWebSocketUrl, handleMessage, maxReconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Remove event handlers to prevent callbacks during cleanup
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      try {
        wsRef.current.close();
      } catch {
        // Ignore close errors during cleanup
      }
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string | object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(data);
    }
  }, []);

  const sendChatMessage = useCallback((content: string) => {
    sendMessage({ type: 'message', content });
  }, [sendMessage]);

  const sendPing = useCallback(() => {
    sendMessage('ping');
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Ping interval to keep connection alive
  useEffect(() => {
    if (!isConnected) {return;}

    const interval = setInterval(() => {
      sendPing();
    }, 25000);

    return () => {
      clearInterval(interval);
    };
  }, [isConnected, sendPing]);

  return {
    executions,
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    sendChatMessage,
  };
}

export default useExecutionWebSocket;
