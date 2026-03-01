/**
 * ActivityPanel - Multi-tab activity panel for Sprint Board
 *
 * Features:
 * - Tabbed interface for monitoring multiple agents in parallel
 * - Inline chat for story-specific communication
 * - Execution logs with streaming output
 * - Agent status and progress indicators
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { THEME } from '../../styles/theme';

// Types
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
}

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

interface ActivityPanelProps {
  executions: AgentExecution[];
  onSendMessage: (executionId: string, message: string) => void;
  onPauseExecution: (executionId: string) => void;
  onResumeExecution: (executionId: string) => void;
  onStopExecution: (executionId: string) => void;
  onCloseTab: (executionId: string) => void;
  activeExecutionId?: string;
  onTabChange: (executionId: string) => void;
}

// Status colors
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: '#6b7280' },
  running: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: '#3b82f6' },
  paused: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: '#f59e0b' },
  completed: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: '#10b981' },
  failed: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: '#ef4444' },
};

// Log level colors
const LOG_COLORS: Record<string, string> = {
  info: THEME.textMuted,
  warn: '#f59e0b',
  error: '#ef4444',
  debug: '#6b7280',
  success: '#10b981',
};

export function ActivityPanel({
  executions,
  onSendMessage,
  onPauseExecution,
  onResumeExecution,
  onStopExecution,
  onCloseTab,
  activeExecutionId,
  onTabChange,
}: ActivityPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeView, setActiveView] = useState<'chat' | 'logs'>('chat');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeExecution = executions.find(e => e.id === activeExecutionId);

  // Auto-scroll logs and chat
  useEffect(() => {
    if (activeView === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeExecution?.logs, activeExecution?.messages, activeView]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !activeExecutionId) {return;}
    onSendMessage(activeExecutionId, inputValue.trim());
    setInputValue('');
  }, [inputValue, activeExecutionId, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state
  if (executions.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: THEME.bg,
          borderLeft: `1px solid ${THEME.border}`,
          padding: '24px',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.5,
          }}
        >
          🚀
        </div>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: THEME.text,
            margin: '0 0 8px',
          }}
        >
          Activity Panel
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: THEME.textMuted,
            textAlign: 'center',
            maxWidth: '240px',
          }}
        >
          Select a story and click "Start Agent" to begin implementation. Agent activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: THEME.bg,
        borderLeft: `1px solid ${THEME.border}`,
      }}
    >
      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${THEME.border}`,
          backgroundColor: THEME.bgElevated,
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {executions.map((exec) => {
          const isActive = exec.id === activeExecutionId;
          const statusStyle = STATUS_COLORS[exec.status];

          return (
            <div
              key={exec.id}
              onClick={() => onTabChange(exec.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderBottom: isActive ? `2px solid ${THEME.primary}` : '2px solid transparent',
                backgroundColor: isActive ? THEME.bg : 'transparent',
                cursor: 'pointer',
                minWidth: '160px',
                maxWidth: '220px',
              }}
            >
              {/* Status dot */}
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: statusStyle.text,
                  flexShrink: 0,
                  animation: exec.status === 'running' ? 'pulse 2s infinite' : 'none',
                }}
              />

              {/* Story info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: THEME.primary,
                    fontFamily: 'monospace',
                  }}
                >
                  {exec.story_id}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: isActive ? THEME.text : THEME.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {exec.agent_type}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(exec.id);
                }}
                style={{
                  padding: '2px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: THEME.textMuted,
                  fontSize: '14px',
                  lineHeight: 1,
                  borderRadius: '4px',
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Execution Content */}
      {activeExecution && (
        <>
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${THEME.border}`,
              backgroundColor: THEME.bgMuted,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.text }}>
                  {activeExecution.story_title}
                </div>
                <div style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '4px' }}>
                  {activeExecution.agent_type} • {activeExecution.phase}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeExecution.status === 'running' && (
                  <button
                    onClick={() => onPauseExecution(activeExecution.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#f59e0b',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: THEME.radius.sm,
                      cursor: 'pointer',
                    }}
                  >
                    Pause
                  </button>
                )}
                {activeExecution.status === 'paused' && (
                  <button
                    onClick={() => onResumeExecution(activeExecution.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: THEME.radius.sm,
                      cursor: 'pointer',
                    }}
                  >
                    Resume
                  </button>
                )}
                {(activeExecution.status === 'running' || activeExecution.status === 'paused') && (
                  <button
                    onClick={() => onStopExecution(activeExecution.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: THEME.radius.sm,
                      cursor: 'pointer',
                    }}
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {activeExecution.status === 'running' && (
              <div
                style={{
                  marginTop: '12px',
                  height: '4px',
                  backgroundColor: THEME.border,
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${activeExecution.progress}%`,
                    backgroundColor: THEME.primary,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            )}

            {/* Current action */}
            {activeExecution.current_action && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: THEME.textMuted,
                  fontFamily: 'monospace',
                }}
              >
                {activeExecution.current_action}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${THEME.border}`,
              backgroundColor: THEME.bgElevated,
            }}
          >
            <button
              onClick={() => setActiveView('chat')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '12px',
                fontWeight: 500,
                color: activeView === 'chat' ? THEME.primary : THEME.textMuted,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeView === 'chat' ? `2px solid ${THEME.primary}` : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveView('logs')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '12px',
                fontWeight: 500,
                color: activeView === 'logs' ? THEME.primary : THEME.textMuted,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeView === 'logs' ? `2px solid ${THEME.primary}` : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Logs ({activeExecution.logs.length})
            </button>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {activeView === 'chat' ? (
              /* Chat View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeExecution.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: THEME.radius.md,
                        backgroundColor: msg.role === 'user'
                          ? THEME.primary
                          : msg.role === 'system'
                            ? THEME.bgMuted
                            : THEME.bgElevated,
                        color: msg.role === 'user' ? '#fff' : THEME.text,
                        border: msg.role === 'agent' ? `1px solid ${THEME.border}` : 'none',
                      }}
                    >
                      {msg.role === 'agent' && (
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: THEME.primary,
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {activeExecution.agent_type}
                        </div>
                      )}
                      <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                        {msg.content}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: THEME.textMuted,
                        marginTop: '4px',
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              /* Logs View */
              <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                {activeExecution.logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '4px 0',
                      borderBottom: `1px solid ${THEME.border}`,
                    }}
                  >
                    <span style={{ color: THEME.textMuted, flexShrink: 0 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      style={{
                        color: LOG_COLORS[log.level],
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        width: '50px',
                        flexShrink: 0,
                      }}
                    >
                      {log.level}
                    </span>
                    {log.tool && (
                      <span
                        style={{
                          color: THEME.primary,
                          padding: '0 4px',
                          backgroundColor: THEME.primaryMuted,
                          borderRadius: '2px',
                          flexShrink: 0,
                        }}
                      >
                        {log.tool}
                      </span>
                    )}
                    <span style={{ color: THEME.text, flex: 1 }}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* Input Area (only for chat view when execution is active) */}
          {activeView === 'chat' && (activeExecution.status === 'running' || activeExecution.status === 'paused') && (
            <div
              style={{
                padding: '12px',
                borderTop: `1px solid ${THEME.border}`,
                backgroundColor: THEME.bgElevated,
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send feedback or instructions..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '13px',
                    backgroundColor: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: THEME.radius.md,
                    color: THEME.text,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#fff',
                    backgroundColor: inputValue.trim() ? THEME.primary : THEME.borderFocus,
                    border: 'none',
                    borderRadius: THEME.radius.md,
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CSS Animation for running status */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default ActivityPanel;
