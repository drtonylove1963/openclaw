/**
 * ADAVoice - Real-time voice interface for Athena using Gemini Native Audio
 *
 * Replaces the TTS-based avatar with a true bidirectional voice experience.
 * Features streaming transcription for both user and AI speech.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useADAVoice, ADAVoiceMessage, ToolCall } from '../../hooks/useADAVoice';

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #2d2d44',
    backgroundColor: '#16162a',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titleText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  status: {
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '12px',
    backgroundColor: '#2d2d44',
    color: '#a0a0b0',
  },
  statusActive: {
    backgroundColor: '#1a4d2e',
    color: '#4ade80',
  },
  controls: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  muteButton: {
    backgroundColor: '#2d2d44',
    color: '#fff',
  },
  mutedButton: {
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
  transcript: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '12px',
    animation: 'fadeIn 0.2s ease-out',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2d2d44',
    color: '#e0e0e8',
    borderBottomLeftRadius: '4px',
  },
  messageSender: {
    fontSize: '11px',
    fontWeight: 600,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  messageText: {
    fontSize: '14px',
    lineHeight: 1.5,
    margin: 0,
  },
  visualizer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60px',
    padding: '0 20px',
    backgroundColor: '#16162a',
  },
  bars: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    height: '40px',
  },
  bar: {
    width: '4px',
    backgroundColor: '#3b82f6',
    borderRadius: '2px',
    transition: 'height 0.05s ease-out',
  },
  inputArea: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #2d2d44',
    backgroundColor: '#16162a',
  },
  textInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '24px',
    border: '1px solid #2d2d44',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#6b7280',
    gap: '12px',
    padding: '40px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '14px',
    lineHeight: 1.6,
    maxWidth: '280px',
  },
};

// Icons (inline SVG for simplicity)
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

interface ADAVoiceProps {
  /** Backend server URL */
  serverUrl?: string;
  /** Custom system prompt */
  systemPrompt?: string;
  /** Called when navigation requested */
  onNavigate?: (page: string) => void;
  /** Compact mode for sidebar */
  compact?: boolean;
}

export const ADAVoice: React.FC<ADAVoiceProps> = ({
  serverUrl,
  systemPrompt,
  onNavigate,
  compact = false,
}) => {
  const [inputText, setInputText] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle navigation from tool calls
  const handleToolCall = useCallback(
    (tool: ToolCall) => {
      if (tool.name === 'navigate_to_page' && tool.args.page) {
        onNavigate?.(tool.args.page as string);
      }
    },
    [onNavigate]
  );

  const {
    voiceState,
    messages,
    start,
    stop,
    togglePause,
    sendText,
    clearMessages,
    audioLevel,
  } = useADAVoice({
    serverUrl,
    systemPrompt,
    onToolCall: handleToolCall,
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle text submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {return;}

    sendText(inputText.trim());
    setInputText('');
    inputRef.current?.focus();
  };

  // Generate visualizer bars based on audio level
  const generateBars = () => {
    const barCount = 20;
    const bars = [];
    for (let i = 0; i < barCount; i++) {
      const baseHeight = 4;
      const maxHeight = 36;
      const variance = Math.sin((i / barCount) * Math.PI) * 0.8 + 0.2;
      const height = baseHeight + audioLevel * maxHeight * variance * Math.random();

      bars.push(
        <div
          key={i}
          style={{
            ...styles.bar,
            height: `${Math.max(4, height)}px`,
            opacity: voiceState.isPaused ? 0.3 : 0.8 + audioLevel * 0.2,
          }}
        />
      );
    }
    return bars;
  };

  // Get status text and style
  const getStatus = () => {
    if (!voiceState.isConnected) {
      return { text: 'Disconnected', active: false };
    }
    if (voiceState.isActive) {
      if (voiceState.isPaused) {
        return { text: 'Paused', active: false };
      }
      switch (voiceState.state) {
        case 'listening':
          return { text: 'Listening...', active: true };
        case 'speaking':
          return { text: 'Speaking...', active: true };
        default:
          return { text: 'Active', active: true };
      }
    }
    return { text: 'Ready', active: false };
  };

  const status = getStatus();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={{ fontSize: '24px' }}>
            {voiceState.isActive && !voiceState.isPaused ? '🎙️' : '💬'}
          </span>
          <h2 style={styles.titleText}>Athena</h2>
          <span
            style={{
              ...styles.status,
              ...(status.active ? styles.statusActive : {}),
            }}
          >
            {status.text}
          </span>
        </div>

        <div style={styles.controls}>
          {voiceState.isActive && (
            <button
              style={{
                ...styles.button,
                ...(voiceState.isPaused ? styles.mutedButton : styles.muteButton),
              }}
              onClick={togglePause}
              title={voiceState.isPaused ? 'Unmute' : 'Mute'}
            >
              {voiceState.isPaused ? <MicOffIcon /> : <MicIcon />}
            </button>
          )}

          <button
            style={{
              ...styles.button,
              ...(voiceState.isActive ? styles.stopButton : styles.startButton),
            }}
            onClick={voiceState.isActive ? stop : start}
            title={voiceState.isActive ? 'Stop' : 'Start'}
          >
            {voiceState.isActive ? <StopIcon /> : <PlayIcon />}
          </button>
        </div>
      </div>

      {/* Visualizer */}
      {voiceState.isActive && (
        <div style={styles.visualizer}>
          <div style={styles.bars}>{generateBars()}</div>
        </div>
      )}

      {/* Transcript */}
      <div ref={transcriptRef} style={styles.transcript}>
        {messages.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>🎤</span>
            <p style={styles.emptyText}>
              {voiceState.isActive
                ? 'Listening... Start speaking and I will transcribe our conversation.'
                : 'Click the play button to start a voice conversation with Athena.'}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.message,
                ...(msg.sender === 'User' ? styles.userMessage : styles.aiMessage),
              }}
            >
              <span style={styles.messageSender}>{msg.sender}</span>
              <p style={styles.messageText}>{msg.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Text Input */}
      <form onSubmit={handleSubmit} style={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={styles.textInput}
          disabled={!voiceState.isActive && !voiceState.isConnected}
        />
        <button
          type="submit"
          style={{
            ...styles.sendButton,
            opacity: inputText.trim() ? 1 : 0.5,
          }}
          disabled={!inputText.trim()}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ADAVoice;
