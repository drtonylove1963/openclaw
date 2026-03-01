/**
 * ChatPage - Two-column chat layout with conversation history
 *
 *   Left:   ChatSidebar with conversation history (resizable, collapsible)
 *   Right:  Main chat area with messages, input bar, and model/agent controls
 *
 * Route: /chat and /chat/:conversationId
 */

import { useState, useRef, useEffect, useCallback, useMemo, type FormEvent, type KeyboardEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GradientText } from '../../components/shared';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { PlusMenu } from '../../components/chat/PlusMenu';
import { ModelSelector } from '../../components/chat/ModelSelector';
import { useChatStore, type Message } from '../../stores/chatStore';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { isTokenExpired } from '../../utils/auth';
import { parseSSEStream } from '../../utils/sseParser';
import { CHAT_ENDPOINTS, STORAGE_KEYS, FILE_UPLOAD, CHAT_DEFAULTS, UUID_REGEX } from '../../constants/chat';
import { classifyError, type ChatError, ERROR_COLORS } from '../../utils/chatErrors';
import { createSwarm, executeSwarm } from '../../services/swarm-api';

// --- Sub-components ---

/** Neural connection line between messages */
function NeuralConnection() {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: '2px',
        height: '20px',
        background: 'linear-gradient(180deg, rgba(0, 212, 255, 0.4), rgba(139, 92, 246, 0.4))',
      }}
    >
      <div
        className="absolute w-full animate-neural-flow"
        style={{
          height: '10px',
          background: 'rgba(0, 212, 255, 0.8)',
          boxShadow: '0 0 10px #00d4ff',
        }}
      />
    </div>
  );
}

/** Single message bubble */
function MessageBubble({ message, onResend }: { message: Message; onResend?: (content: string) => void }) {
  const isUser = message.role === 'user';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex gap-4 items-start animate-message-appear ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: '44px',
          height: '44px',
          minWidth: '44px',
          background: isUser
            ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
            : 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
          boxShadow: isUser
            ? '0 0 20px rgba(245, 158, 11, 0.4)'
            : '0 0 20px rgba(0, 212, 255, 0.4)',
          fontSize: '20px',
        }}
      >
        {isUser ? '\uD83D\uDC64' : '\u2728'}
      </div>

      {/* Bubble */}
      <div
        className="relative"
        style={{
          maxWidth: '70%',
          padding: '20px',
          background: isUser
            ? 'rgba(0, 212, 255, 0.08)'
            : 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          border: isUser
            ? '1px solid rgba(0, 212, 255, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Resend button (user messages only, visible on hover) */}
        {isUser && onResend && (
          <button
            type="button"
            onClick={() => onResend(message.content)}
            title="Re-send this prompt"
            aria-label="Re-send this prompt"
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              background: 'rgba(0, 212, 255, 0.1)',
              color: '#00d4ff',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              zIndex: 2,
              padding: 0,
              lineHeight: 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        )}
        {/* Left/Right accent bar */}
        <div
          className="absolute top-0 h-full"
          style={{
            width: '3px',
            background: 'linear-gradient(180deg, #00d4ff, #8b5cf6)',
            borderRadius: isUser ? '0 2px 2px 0' : '2px 0 0 2px',
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.4)',
            [isUser ? 'right' : 'left']: 0,
          }}
        />

        {/* Content */}
        <div style={{ color: '#f0f0f5', lineHeight: 1.6, fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
          {/* Streaming cursor */}
          {message.isStreaming && (
            <span className="inline-block animate-blink" style={{ color: '#00d4ff', marginLeft: '2px' }}>
              |
            </span>
          )}
        </div>

        {/* Agent mentions */}
        {message.agentMentions && message.agentMentions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.agentMentions.map((agent, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-badge"
                style={{
                  padding: '2px 8px',
                  background: `${agent.color}33`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: agent.color,
                }}
              >
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: agent.color,
                    boxShadow: `0 0 6px ${agent.color}`,
                  }}
                />
                {agent.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Typing indicator (3 animated dots) */
function TypingIndicator() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '15px 20px',
      }}
    >
      {/* Pulsating Lightbulb */}
      <div
        style={{
          width: '28px',
          height: '28px',
          animation: 'pulse-glow 1.5s ease-in-out infinite',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            width: '100%',
            height: '100%',
            color: '#fbbf24',
            filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))',
          }}
        >
          {/* Lightbulb outline */}
          <path
            d="M9 21h6M12 3a6 6 0 0 0-6 6c0 2.22 1.21 4.16 3 5.19V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.81c1.79-1.03 3-2.97 3-5.19a6 6 0 0 0-6-6z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner glow lines */}
          <path
            d="M12 7v3M10 8.5l2 1.5 2-1.5"
            strokeLinecap="round"
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>
      </div>
      {/* Thinking text */}
      <span
        style={{
          fontSize: '13px',
          color: '#9ca3af',
          animation: 'pulse-text 1.5s ease-in-out infinite',
        }}
      >
        Thinking...
      </span>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/** Compact segmented agent mode selector for the input bar */
function InlineAgentToggle({
  mode,
  onChange,
}: {
  mode: 'standard' | 'multi-agent' | 'swarm';
  onChange: (m: 'standard' | 'multi-agent' | 'swarm') => void;
}) {
  const options: { key: 'standard' | 'multi-agent' | 'swarm'; label: string; color: string; title: string }[] = [
    { key: 'standard', label: 'Standard', color: '#a0a0b0', title: 'Standard LLM chat' },
    { key: 'multi-agent', label: 'Agent', color: '#8b5cf6', title: 'Multi-agent mode' },
    { key: 'swarm', label: 'Swarm', color: '#f59e0b', title: 'Swarm intelligence mode' },
  ];

  return (
    <div
      className="flex items-center"
      style={{
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
      role="radiogroup"
      aria-label="Agent mode"
    >
      {options.map((opt, idx) => {
        const active = mode === opt.key;
        const isLast = idx === options.length - 1;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 border-0"
            style={{
              padding: '4px 10px',
              background: active ? `${opt.color}22` : 'rgba(255, 255, 255, 0.03)',
              borderRight: !isLast ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
              fontSize: '12px',
              color: active ? opt.color : '#6b7280',
              fontWeight: active ? 600 : 400,
            }}
            onClick={() => onChange(opt.key)}
            title={opt.title}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {opt.key === 'standard' && <circle cx="12" cy="12" r="8" />}
              {opt.key === 'multi-agent' && (
                <>
                  <circle cx="12" cy="5" r="3" />
                  <circle cx="5" cy="19" r="3" />
                  <circle cx="19" cy="19" r="3" />
                  <line x1="12" y1="8" x2="5" y2="16" />
                  <line x1="12" y1="8" x2="19" y2="16" />
                </>
              )}
              {opt.key === 'swarm' && (
                <>
                  <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="none" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="4" y1="7" x2="20" y2="17" />
                  <line x1="20" y1="7" x2="4" y2="17" />
                </>
              )}
            </svg>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Agentic mode toggle - enables Claude Code-like iterative tool execution */
function InlineAgenticToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  // Debug: wrap in a div to ensure it renders
  return (
    <div data-testid="agentic-toggle-wrapper" style={{ display: 'contents' }}>
      <button
        type="button"
        data-testid="agentic-toggle"
        onClick={() => onChange(!enabled)}
        title={enabled 
          ? 'Agentic Mode ON: Iterative tool loop until task complete' 
          : 'Agentic Mode OFF: Standard single-turn responses'}
        className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 border-0"
        style={{
        padding: '4px 10px',
        borderRadius: '8px',
        border: `1px solid ${enabled ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        background: enabled ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        fontSize: '12px',
        color: enabled ? '#00d4ff' : '#6b7280',
        fontWeight: enabled ? 600 : 400,
      }}
    >
      {/* Infinity icon for agentic loop */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {enabled ? (
          <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {enabled ? 'Agentic' : 'Standard'}
      </button>
    </div>
  );
}

// --- ChatPage Main Component ---

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>(CHAT_DEFAULTS.defaultModelId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [chatError, setChatError] = useState<ChatError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMobile = useBreakpoint('md');
  
  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Prompt history navigation state
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // Zustand chat store
  const {
    conversations,
    messages,
    isStreaming,
    agentMode,
    agenticMode,  // True agentic loop mode (like Claude Code)
    temperature,
    systemPrompt,
    memoryEnabled,
    activeConversationId,
    conversationsLoading,
    setAgentMode,
    setAgenticMode,
    addMessage,
    setStreaming,
    loadConversation,
    newConversation,
    fetchConversations,
    createConversation,
    deleteConversation,
    deleteMultipleConversations,
  } = useChatStore();

  // Extract user prompts for history navigation (most recent first)
  const promptHistory = useMemo(() => {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .toReversed();
  }, [messages]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load conversation from URL param; reset history & abort in-flight stream
  useEffect(() => {
    const { isStreaming: currentlyStreaming, activeConversationId: storeConvId } = useChatStore.getState();

    // If we're streaming and the conversationId change came from the SSE start
    // event (activeConversationId was just set to this same ID), skip the
    // abort-and-reload to avoid a race condition that wipes out in-progress messages.
    if (currentlyStreaming && conversationId && conversationId === storeConvId) {
      return;
    }

    // Abort any in-flight streaming request when switching conversations
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      useChatStore.setState({ isStreaming: false });
    }
    // Reset prompt history state
    setHistoryIndex(-1);
    setSavedInput('');
    setInputValue('');

    if (conversationId) {
      loadConversation(conversationId);
    } else {
      newConversation();
    }
  }, [conversationId, loadConversation, newConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sidebar handlers
  const handleNewChat = useCallback(() => {
    newConversation();
    navigate('/chat');
  }, [newConversation, navigate]);

  const handleSelectConversation = useCallback((id: string) => {
    navigate(`/chat/${id}`);
  }, [navigate]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      if (activeConversationId === id) {
        navigate('/chat');
      }
    } catch {
      setChatError({ type: 'unknown' as any, message: 'Failed to delete conversation. Please try again.' });
    }
  }, [deleteConversation, activeConversationId, navigate]);

  const handleDeleteMultiple = useCallback(async (ids: string[]) => {
    try {
      await deleteMultipleConversations(ids);
      if (activeConversationId && ids.includes(activeConversationId)) {
        navigate('/chat');
      }
    } catch {
      setChatError({ type: 'unknown' as any, message: 'Failed to delete some conversations. Please try again.' });
    }
  }, [deleteMultipleConversations, activeConversationId, navigate]);

  const handleDeleteAll = useCallback(async () => {
    try {
      await useChatStore.getState().deleteAllConversations();
      navigate('/chat');
    } catch {
      setChatError({ type: 'unknown' as any, message: 'Failed to delete all conversations. Please try again.' });
    }
  }, [navigate]);

  const handleRenameConversation = useCallback(async (id: string, title: string) => {
    try {
      await useChatStore.getState().renameConversation(id, title);
    } catch {
      setChatError({ type: 'unknown' as any, message: 'Failed to rename conversation.' });
    }
  }, []);

  // Re-send: populate input with a previous user prompt
  const handleResend = useCallback((content: string) => {
    setInputValue(content);
    inputRef.current?.focus();
  }, []);

  // Cancel an in-progress request
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    // Finalize any streaming message
    useChatStore.setState((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last?.isStreaming) {
        msgs[msgs.length - 1] = { ...last, isStreaming: false, content: last.content || '(cancelled)' };
      }
      return { messages: msgs, isStreaming: false };
    });
  }, []);

  // Send message handler
  const handleSend = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const content = inputValue.trim();
      // Guard with getState() to avoid stale closure on isStreaming
      if (!content || useChatStore.getState().isStreaming) {return;}

      setChatError(null);
      const abort = new AbortController();
      abortRef.current = abort;

      // Add user message
      addMessage({
        id: `msg-${crypto.randomUUID()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      });
      setInputValue('');
      setHistoryIndex(-1);
      setSavedInput('');
      setStreaming(true);

      // Check token expiry before making API call
      const token = localStorage.getItem(STORAGE_KEYS.token) || '';
      if (!token || isTokenExpired(token)) {
        window.dispatchEvent(new Event('auth-expired'));
        setStreaming(false);
        return;
      }

      // Swarm mode: two-step flow via swarm-api.ts (create → execute)
      if (agentMode === 'swarm') {
        try {
          // Step 1: Create swarm with task description
          const swarm = await createSwarm({
            task: {
              task_id: crypto.randomUUID(),
              description: content,
              complexity: 5,
              required_capabilities: ['reasoning', 'analysis'],
              min_agents: 2,
              max_agents: 5,
              requires_consensus: true,
            },
            strategy: 'collaborative',
            auto_recruit: true,
          });

          // Step 2: Execute the created swarm
          const result = await executeSwarm(swarm.swarm_id);
          const winning = result.winning_solution;
          const swarmContent = winning
            ? `**Swarm Result** (${result.strategy} strategy)\n\n` +
              `**Approach:** ${winning.approach}\n` +
              `**Quality:** ${(winning.estimated_quality * 100).toFixed(0)}%\n` +
              `**Agents involved:** ${(result.agents_involved || []).length}\n` +
              (result.decision?.consensus ? `**Consensus reached** (confidence: ${(result.decision.confidence * 100).toFixed(0)}%)` : '**No consensus** - best proposal selected')
            : JSON.stringify(result, null, 2);

          addMessage({
            id: `msg-${crypto.randomUUID()}`,
            role: 'assistant',
            content: swarmContent,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {return;}
          setChatError(classifyError(err));
        } finally {
          abortRef.current = null;
          setStreaming(false);
        }
        return;
      }

      // Determine endpoint based on agentic mode first, then agent mode
      // Agentic mode takes priority - it's the Claude Code-like iterative loop
      const endpoint = agenticMode
        ? CHAT_ENDPOINTS.agenticStream
        : agentMode === 'multi-agent'
          ? CHAT_ENDPOINTS.agentStream
          : CHAT_ENDPOINTS.simple;

      // Use better model for agentic mode (function calling is critical)
      const effectiveModelId = agenticMode
        ? (selectedModelId.includes('cerebras/llama-3.1-8b') 
            ? CHAT_DEFAULTS.agenticModelId  // Upgrade 8B to 70B for agentic
            : selectedModelId)
        : selectedModelId;

      const streamingMsgId = `msg-${crypto.randomUUID()}`;

      try {
        // Build request body - agentic mode needs different parameters
        const requestBody = agenticMode
          ? {
              message: content,
              conversation_id: activeConversationId || undefined,
              model: effectiveModelId,
              max_iterations: 10,
              enable_self_healing: true,
            }
          : {
              message: content,
              conversation_id: activeConversationId || undefined,
              model: effectiveModelId,
              temperature,
              system_prompt: systemPrompt,
              memory_enabled: memoryEnabled,
            };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          signal: abort.signal,
        });

        if (!res.ok) {
          if (res.status === 401) {
            window.dispatchEvent(new Event('auth-expired'));
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error(`Chat API returned ${res.status}`);
        }

        // Handle SSE streaming
        let assistantContent = '';

        // Add placeholder assistant message
        addMessage({
          id: streamingMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        });

        await parseSSEStream<Record<string, unknown>>(res, (event) => {
          if (event.type === 'error') {
            assistantContent = (event.message as string) || 'An error occurred';
            useChatStore.getState().updateStreamingMessage(assistantContent);
          } else if (event.type === 'content_chunk' && event.chunk) {
            assistantContent += event.chunk as string;
            useChatStore.getState().updateStreamingMessage(assistantContent);
          } else if (event.content && typeof event.content === 'string') {
            assistantContent = event.content;
            useChatStore.getState().updateStreamingMessage(assistantContent);
          }

          // If the backend returns a conversation_id, navigate to it (with UUID validation)
          // Use getState() to avoid stale closure — activeConversationId may have been set by a prior chunk
          if (event.conversation_id && typeof event.conversation_id === 'string' && !useChatStore.getState().activeConversationId) {
            const newId = event.conversation_id;
            if (UUID_REGEX.test(newId)) {
              useChatStore.setState({ activeConversationId: newId });
              navigate(`/chat/${newId}`, { replace: true });
              fetchConversations();
            }
          }
        }, { onYield: ['content_chunk'] });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {return;}
        setChatError(classifyError(err));
      } finally {
        // Finalize streaming message: clear isStreaming flag on the message itself
        useChatStore.setState((state) => {
          const msgs = [...state.messages];
          const last = msgs[msgs.length - 1];
          if (last?.isStreaming) {
            msgs[msgs.length - 1] = { ...last, isStreaming: false };
          }
          return { messages: msgs };
        });
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [inputValue, agentMode, agenticMode, selectedModelId, temperature, systemPrompt, memoryEnabled, addMessage, setStreaming, activeConversationId, navigate, fetchConversations]
  );

  // Find title of current conversation
  const currentTitle = conversations.find(c => c.id === activeConversationId)?.title;

  return (
    <div className="flex h-full" style={{ overflow: 'hidden' }}>
      {/* Mobile sidebar overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* === LEFT - Conversation Sidebar === */}
      <div className={isMobile && !sidebarCollapsed ? 'fixed left-0 top-0 z-50 h-full' : ''}>
        <ChatSidebar
          conversations={conversations}
          currentConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={(id) => {
            handleSelectConversation(id);
            if (isMobile) {setSidebarCollapsed(true);}
          }}
          onDeleteConversation={handleDeleteConversation}
          onDeleteMultipleConversations={handleDeleteMultiple}
          onDeleteAllConversations={handleDeleteAll}
          onRenameConversation={handleRenameConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* === RIGHT - Main Chat Area === */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.03) 0%, transparent 60%)',
        }}
      >
        {/* Header */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Shimmer bar */}
          <div
            className="absolute top-0 left-0 right-0 animate-shimmer-header"
            style={{
              height: '50px',
              background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.06), transparent)',
            }}
          />
          <GradientText
            as="h2"
            gradient="cyan-violet"
            className="relative"
          >
            <span style={{ fontSize: '18px', fontWeight: 600 }}>
              {currentTitle || (activeConversationId ? 'Conversation' : 'New Conversation')}
            </span>
          </GradientText>
          {/* Separator shimmer line */}
          <div
            className="relative overflow-hidden"
            style={{
              height: '1px',
              marginTop: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '1px',
            }}
          >
            <div
              className="absolute h-full animate-shimmer-header"
              style={{
                width: '50%',
                background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)',
              }}
            />
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 flex flex-col gap-3 ni-scrollbar"
          style={{ padding: '20px 24px', overflowY: 'auto' }}
        >
          {messages.length === 0 && (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-4"
              style={{ opacity: 0.5 }}
            >
              <div
                className="rounded-full animate-orb-breathe"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3), rgba(139, 92, 246, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '32px' }}>{'\uD83E\uDDE0'}</span>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Start a conversation with Athena...
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id}>
              <MessageBubble
                message={msg}
                onResend={msg.role === 'user' ? handleResend : undefined}
              />
              {i < messages.length - 1 && <NeuralConnection />}
            </div>
          ))}

          {isStreaming && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Error banner (color-coded by error type) */}
        {chatError && (() => {
          const colors = ERROR_COLORS[chatError.type] || ERROR_COLORS.unknown;
          return (
            <div
              style={{
                margin: '0 24px',
                padding: '10px 16px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span style={{ color: colors.text, fontSize: '13px' }}>{chatError.message}</span>
              <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                {chatError.action && chatError.onAction && (
                  <button
                    type="button"
                    onClick={chatError.onAction}
                    style={{
                      background: 'none',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      color: colors.text,
                      cursor: 'pointer',
                      padding: '2px 8px',
                      fontSize: '12px',
                    }}
                  >
                    {chatError.action}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setChatError(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text,
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                  aria-label="Dismiss error"
                >
                  &times;
                </button>
              </div>
            </div>
          );
        })()}

        {/* Input bar with inline controls */}
        <div
          className="flex-shrink-0"
          style={{
            padding: '12px 24px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <form
            onSubmit={handleSend}
            className="flex flex-col gap-2"
          >
            {/* Main input row */}
            <div
              className="flex items-start gap-3 transition-all duration-300 focus-within:border-[rgba(0,212,255,0.4)] focus-within:shadow-[0_0_30px_rgba(0,212,255,0.2)]"
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
              }}
            >
              {/* Plus menu trigger + popover */}
              <div className="relative" style={{ marginTop: '2px' }}>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 hover:scale-110 border-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    background: plusMenuOpen ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: plusMenuOpen ? '#00d4ff' : '#6b7280',
                    fontSize: '16px',
                    transform: plusMenuOpen ? 'rotate(45deg)' : undefined,
                    transition: 'transform 0.2s, background 0.2s, color 0.2s',
                  }}
                  onClick={() => setPlusMenuOpen((v) => !v)}
                  aria-label="Open actions menu"
                  aria-haspopup="menu"
                  aria-expanded={plusMenuOpen}
                >
                  +
                </button>
                <PlusMenu
                  open={plusMenuOpen}
                  onClose={() => setPlusMenuOpen(false)}
                  onUploadFile={() => fileInputRef.current?.click()}
                  onSlashCommands={() => {
                    setInputValue('/');
                    inputRef.current?.focus();
                  }}
                  onVoiceInput={() => navigate('/voice')}
                  onBrowseAgents={() => navigate('/agents')}
                />
              </div>
              {/* Hidden file input for uploads */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                accept={FILE_UPLOAD.acceptedTypes}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {return;}
                  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
                  if (file.size > FILE_UPLOAD.maxSizeBytes) {
                    setChatError({ type: 'validation' as any, message: `File size exceeds ${FILE_UPLOAD.maxSizeMB}MB limit.` });
                  } else if (FILE_UPLOAD.binaryExtensions.has(ext)) {
                    setChatError({ type: 'validation' as any, message: 'PDF and binary files are not yet supported. Please upload a text-based file.' });
                  } else if (!FILE_UPLOAD.textExtensions.has(ext)) {
                    setChatError({ type: 'validation' as any, message: `Unsupported file type: ${ext}` });
                  } else {
                    // Read text content and inject into input
                    const reader = new FileReader();
                    reader.onload = () => {
                      const text = reader.result as string;
                      const safeName = file.name.replace(/[^\w.-]/g, '_');
                      const truncated = text.length > FILE_UPLOAD.maxInlineBytes
                        ? text.slice(0, FILE_UPLOAD.maxInlineBytes) + '\n... (truncated)'
                        : text;
                      setInputValue((prev) => prev + `\n\`\`\`${ext.slice(1)} [${safeName}]\n${truncated}\n\`\`\`\n`);
                      inputRef.current?.focus();
                    };
                    reader.onerror = () => {
                      setChatError({ type: 'unknown' as any, message: 'Failed to read file.' });
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }}
              />

              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, CHAT_DEFAULTS.maxTextareaHeight) + 'px';
                  // Reset history when user types manually
                  if (historyIndex >= 0) {
                    setHistoryIndex(-1);
                    setSavedInput('');
                  }
                }}
                onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                  // Prompt history: ArrowUp when cursor is at start
                  if (e.key === 'ArrowUp' && promptHistory.length > 0 && inputRef.current?.selectionStart === 0) {
                    e.preventDefault();
                    if (historyIndex === -1) {
                      setSavedInput(inputValue);
                      setHistoryIndex(0);
                      setInputValue(promptHistory[0]);
                    } else if (historyIndex < promptHistory.length - 1) {
                      const next = historyIndex + 1;
                      setHistoryIndex(next);
                      setInputValue(promptHistory[next]);
                    }
                    return;
                  }
                  if (e.key === 'ArrowDown' && historyIndex >= 0) {
                    e.preventDefault();
                    if (historyIndex === 0) {
                      setHistoryIndex(-1);
                      setInputValue(savedInput);
                    } else {
                      const next = historyIndex - 1;
                      setHistoryIndex(next);
                      setInputValue(promptHistory[next]);
                    }
                    return;
                  }
                  // Enter sends (Shift+Enter for newline)
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={CHAT_DEFAULTS.placeholder}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none"
                style={{
                  color: '#f0f0f5',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  maxHeight: `${CHAT_DEFAULTS.maxTextareaHeight}px`,
                  scrollbarWidth: 'thin',
                }}
                disabled={isStreaming}
              />

              {/* Right-side action buttons */}
              <div className="flex items-center gap-3" style={{ marginTop: '2px', flexShrink: 0 }}>
                {/* Cancel button (visible while streaming) */}
                {isStreaming && (
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 hover:scale-110 border-0"
                    style={{
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                    }}
                    onClick={handleCancel}
                    aria-label="Cancel response"
                    title="Stop generating"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                )}

                {/* Mic button */}
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 hover:scale-110 border-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#6b7280',
                  }}
                  onClick={() => navigate('/voice')}
                  aria-label="Voice input"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>

                {/* Send button */}
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] border-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
                    color: '#fff',
                    opacity: isStreaming || !inputValue.trim() ? 0.5 : 1,
                  }}
                  disabled={isStreaming || !inputValue.trim()}
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bottom controls row: model selector, agentic toggle, agent mode toggle */}
            <div className="flex items-center gap-2" style={{ paddingLeft: '4px' }}>
              <ModelSelector value={selectedModelId} onChange={setSelectedModelId} mode="compact" />
              <InlineAgenticToggle enabled={agenticMode} onChange={setAgenticMode} />
              <InlineAgentToggle mode={agentMode} onChange={setAgentMode} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
