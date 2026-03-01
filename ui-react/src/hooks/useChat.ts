/**
 * useChat - Main hook for chat functionality
 * Manages conversations, messages, and AI completions
 *
 * Usage:
 *   const {
 *     conversations,
 *     currentConversation,
 *     isLoading,
 *     isSending,
 *     sendMessage,
 *     createConversation,
 *     selectConversation,
 *   } = useChat();
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { chatService } from '../services/chatService';
import { useSessionStatsStore } from '../stores/sessionStatsStore';
import type {
  Conversation,
  ConversationDetail,
  UseChatReturn,
  ToolActivity,
  StreamEvent,
  AgentStreamEvent,
  AgenticStreamEvent,
  TaskPhase,
  ExecutionStep,
  CurrentQuestion,
  AskQuestionEvent,
  GSDHandoffEvent,
} from '../types/chat';

// SECURITY: Dev-only logger to prevent info leakage in production (M-7/L-6 fix)
const _isDev = import.meta.env.DEV;
const _log = (...args: unknown[]) => { if (_isDev) {console.log(...args);} };
const _warn = (...args: unknown[]) => { if (_isDev) {console.warn(...args);} };
const _error = (...args: unknown[]) => { if (_isDev) {console.error(...args);} };

interface SendMessageOptions {
  agentMode?: boolean;
  agenticMode?: boolean;  // True agentic loop with iterative tool execution (like Claude Code)
  phase?: TaskPhase;
  projectId?: string;  // Project ID for project-context-aware agent responses
  projectPath?: string;  // Project directory path for artifact saving
  saveArtifacts?: boolean;  // Whether to auto-save generated artifacts (default: true)
  tools?: string[];  // Enabled tools (e.g., ['web_search', 'code_exec', 'image_gen'])
  workspaceMode?: 'requirements_studio' | 'implementation_hub' | 'development';  // Workspace mode for artifact filtering
  maxIterations?: number;  // Max agentic loop iterations (default: 10)
  enableSelfHealing?: boolean;  // Enable rebuild/deploy tools in agentic mode (default: true)
}

interface UseChatExtendedReturn extends UseChatReturn {
  toolActivities: ToolActivity[];
  statusMessage: string | null;
  streamingContent: string | null;
  useStreaming: boolean;
  setUseStreaming: (enabled: boolean) => void;
  sendMessage: (content: string, model?: string, options?: SendMessageOptions) => Promise<void>;
  deleteMultipleConversations: (ids: string[]) => Promise<void>;
  // New execution progress tracking
  executionSteps: ExecutionStep[];
  currentPhase: string | null;
  isStreaming: boolean;
  // Cancel support
  cancelMessage: () => void;
  // Interactive question support
  currentQuestion: CurrentQuestion | null;
  submitQuestionAnswer: (answer: string, selectedOptions?: string[]) => Promise<void>;
  // Regenerate message support
  regenerateMessage: (messageId: string, model?: string) => Promise<void>;
  // Retry support
  retryLastMessage: () => Promise<void>;
  canRetry: boolean;
}

export function useChat(): UseChatExtendedReturn {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Streaming and tool activity state
  const [toolActivities, setToolActivities] = useState<ToolActivity[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState(true); // Default to streaming

  // Execution progress tracking (Claude Code-like)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const stepIdRef = useRef(0);

  // Interactive question state (AskUserQuestion tool)
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);

  // State for retry functionality - tracks the last failed message
  const [lastFailedMessage, setLastFailedMessage] = useState<{
    content: string;
    model?: string;
    options?: SendMessageOptions;
  } | null>(null);

  // AbortController for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track conversations that were started with /p-* commands and need agent-stream routing
  // This is necessary because agent-stream stores conversations in-memory, not in the database
  const agentStreamConversationsRef = useRef<Set<string>>(new Set());

  // Track if we're in actual agent mode (for showing phases) vs just tools mode
  const isAgentModeRef = useRef(false);

  // Store last send options for conversation continuation after question answers
  const lastSendOptionsRef = useRef<{ model?: string; options?: SendMessageOptions } | null>(null);

  // Ref to hold sendMessage for use in submitQuestionAnswer (avoids circular dependency)
  const sendMessageRef = useRef<((content: string, model?: string, options?: SendMessageOptions) => Promise<void>) | null>(null);

  // Session stats tracking
  const recordUsage = useSessionStatsStore(state => state.recordUsage);

  // GSD command detection helper
  const isGSDCommand = useCallback((message: string): boolean => {
    return message.trim().toLowerCase().startsWith('/gsd:');
  }, []);

  // Pronetheia command detection helper
  const isPronetheiaCommand = useCallback((message: string): boolean => {
    return message.trim().toLowerCase().startsWith('/p-');
  }, []);

  // ============================================================================
  // CONVERSATION OPERATIONS
  // ============================================================================

  /**
   * Load all conversations from the API (uses persistent storage)
   * Called on mount and after certain operations
   */
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use persistent endpoint for database-backed conversations
      _log('[useChat] Loading conversations from persistent endpoint...');
      const data = await chatService.listPersistentConversations();
      _log('[useChat] Loaded conversations:', data.length, data.map(c => ({ id: c.id, title: c.title, channel: c.channel })));
      setConversations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      _error('[useChat] Load conversations error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new conversation
   * @param title - Optional conversation title
   * @returns The created conversation
   */
  const createConversation = useCallback(async (title?: string): Promise<Conversation> => {
    setError(null);
    // Clear any pending question from previous conversation
    setCurrentQuestion(null);
    setStatusMessage(null);
    setStreamingContent(null);
    setExecutionSteps([]);
    setCurrentPhase(null);
    try {
      // Just reset state for new conversation - actual conversation creation
      // happens in sendMessage via sendPersistentChatStream
      const tempConversation: ConversationDetail = {
        id: 'new',
        title: title || 'New Conversation',
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
        messages: [],
      };

      setCurrentConversation(tempConversation);

      // Return as Conversation (without messages) for compatibility
      const { messages, ...conversationWithoutMessages } = tempConversation;
      return conversationWithoutMessages as Conversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      _error('Create conversation error:', err);
      throw err;
    }
  }, []);

  /**
   * Select and load a conversation by ID (uses persistent storage)
   * @param id - Conversation ID to load
   */
  const selectConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    // Clear any pending question from previous conversation
    setCurrentQuestion(null);
    setStatusMessage(null);
    setStreamingContent(null);
    setExecutionSteps([]);
    setCurrentPhase(null);
    try {
      // Use persistent endpoint for database-backed conversations
      const detail = await chatService.getPersistentConversation(id);
      setCurrentConversation(detail);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      _error('Select conversation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a conversation (uses persistent storage)
   * @param id - Conversation ID to delete
   */
  const deleteConversation = useCallback(async (id: string) => {
    setError(null);
    try {
      // Skip deleting temporary/unsaved conversations
      if (id === 'new' || id.startsWith('temp')) {
        // Just remove from local state - nothing to delete on server
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversation?.id === id) {
          setCurrentConversation(null);
        }
        return;
      }

      // Use persistent endpoint for database-backed conversations
      await chatService.deletePersistentConversation(id);

      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== id));

      // Clear current conversation if it was deleted
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      _error('Delete conversation error:', err);
    }
  }, [currentConversation]);

  /**
   * Delete multiple conversations (uses persistent storage)
   * @param ids - Array of conversation IDs to delete
   */
  const deleteMultipleConversations = useCallback(async (ids: string[]) => {
    _log('useChat: deleteMultipleConversations called with ids:', ids);
    setError(null);
    try {
      // Filter out temporary/unsaved conversation IDs
      const tempIds = ids.filter(id => id === 'new' || id.startsWith('temp'));
      const persistentIds = ids.filter(id => id !== 'new' && !id.startsWith('temp'));

      // Delete persistent conversations in parallel using persistent endpoint
      if (persistentIds.length > 0) {
        _log('useChat: Starting parallel delete...');
        await Promise.all(persistentIds.map(id => {
          _log('useChat: Deleting conversation:', id);
          return chatService.deletePersistentConversation(id);
        }));
        _log('useChat: All deletes completed');
      }

      if (tempIds.length > 0) {
        _log('useChat: Skipped temp IDs:', tempIds);
      }

      // Remove all deleted conversations from list
      setConversations(prev => prev.filter(c => !ids.includes(c.id)));

      // Clear current conversation if it was one of the deleted ones
      if (currentConversation && ids.includes(currentConversation.id)) {
        setCurrentConversation(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversations';
      setError(errorMessage);
      _error('Delete multiple conversations error:', err);
      throw err; // Re-throw to propagate to caller
    }
  }, [currentConversation]);

  /**
   * Rename a conversation
   * @param id - Conversation ID
   * @param title - New title
   */
  const renameConversation = useCallback(async (id: string, title: string) => {
    setError(null);
    try {
      const updated = await chatService.updateConversation(id, { title });

      // Update in conversation list
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, title } : c
      ));

      // Update current conversation if it's the one being renamed
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename conversation';
      setError(errorMessage);
      _error('Rename conversation error:', err);
    }
  }, [currentConversation]);

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  /**
   * Handle streaming events - update tool activities and status
   */
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'status':
        setStatusMessage(event.message);
        break;

      case 'tool_selection':
        setStatusMessage(`Selected ${event.tools.length} tool(s): ${event.tools.join(', ')}`);
        break;

      case 'tool_start': {
        const newActivity: ToolActivity = {
          id: `${event.tool}-${crypto.randomUUID()}`,
          tool: event.tool,
          status: 'running',
          input: event.input,
          startedAt: new Date(),
        };
        setToolActivities(prev => [...prev, newActivity]);
        setStatusMessage(`Executing ${event.tool}...`);
        break;
      }

      case 'tool_result':
        setToolActivities(prev =>
          prev.map(activity =>
            activity.tool === event.tool && activity.status === 'running'
              ? {
                  ...activity,
                  status: event.success ? 'success' : 'error',
                  result: event.result,
                  completedAt: new Date(),
                }
              : activity
          )
        );
        setStatusMessage(event.success ? `${event.tool} completed` : `${event.tool} failed`);
        break;

      case 'content_chunk':
        // Real-time streaming - update content as chunks arrive
        setStatusMessage(null);
        setStreamingContent(event.content);
        break;

      case 'final_content':
        // Final content received - streaming complete
        setStatusMessage(null);
        setStreamingContent(event.content);
        break;

      case 'error':
        setError(event.message);
        setStatusMessage(null);
        setStreamingContent(null);
        break;

      case 'done':
        setStatusMessage(null);
        setStreamingContent(null);
        // Record usage stats if available
        if (event.result?.tokens_used && event.result?.model) {
          // Estimate input/output split (typically ~20% input, ~80% output for chat)
          const inputTokens = Math.round(event.result.tokens_used * 0.2);
          const outputTokens = event.result.tokens_used - inputTokens;
          recordUsage({
            model: event.result.model,
            inputTokens,
            outputTokens,
          });
        }
        break;
    }
  }, [recordUsage]);

  /**
   * Helper to add an execution step
   */
  const addExecutionStep = useCallback((step: Omit<ExecutionStep, 'id' | 'timestamp'>) => {
    const newStep: ExecutionStep = {
      ...step,
      id: `step-${++stepIdRef.current}`,
      timestamp: new Date(),
    };
    setExecutionSteps(prev => [...prev, newStep]);
    return newStep.id;
  }, []);

  /**
   * Helper to update an execution step status
   */
  const updateStepStatus = useCallback((stepId: string, status: ExecutionStep['status'], details?: string) => {
    setExecutionSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, details: details || step.details } : step
    ));
  }, []);

  /**
   * Handle agent streaming events - similar to regular streaming but with phase awareness
   * Now with execution step tracking for Claude Code-like progress display
   */
  const handleAgentStreamEvent = useCallback((event: AgentStreamEvent) => {
    _log('[AgentStream] Event received:', event.type, event);
    switch (event.type) {
      case 'thinking':
        setStatusMessage(event.message);
        // Only add execution steps in Agent Mode
        if (isAgentModeRef.current) {
          const thinkingStepId = addExecutionStep({
            type: 'thinking',
            title: event.message,
            status: 'complete',
          });
          _log('[AgentStream] Added thinking step:', thinkingStepId);
        }
        break;

      case 'phase_start':
        // Only show phase events in Agent Mode, not in LLM Mode with tools
        if (isAgentModeRef.current) {
          setCurrentPhase(event.phase);
          setStatusMessage(event.message);
          const phaseStepId = addExecutionStep({
            type: 'phase',
            title: event.phase,
            details: event.message,
            status: 'running',
            metadata: { phase: event.phase },
          });
          _log('[AgentStream] Added phase step:', phaseStepId, event.phase);
        }
        break;

      case 'phase_complete':
        // Only handle phase events in Agent Mode
        if (isAgentModeRef.current) {
          setStatusMessage(`${event.phase} complete`);
          // Mark the phase step as complete
          setExecutionSteps(prev => prev.map(step =>
            step.type === 'phase' && step.metadata?.phase === event.phase
              ? { ...step, status: 'complete' as const }
              : step
          ));
        }
        break;

      case 'skill_invoked': {
        // Only show skill events in Agent Mode
        if (isAgentModeRef.current) {
          // Enhanced skill event with keywords and categories
          const skillEvent = event as AgentStreamEvent & {
            keywords?: string[];
            categories?: string[];
          };
          setStatusMessage(`Loading ${event.skills.length} skill(s)...`);
          const skillStepId = addExecutionStep({
            type: 'skill',
            title: `Matched ${event.skills.length} skill(s)`,
            details: event.message,
            status: 'complete',
            metadata: {
              skills: event.skills,
              keywords: skillEvent.keywords,
              categories: skillEvent.categories,
            },
          });
          _log('[AgentStream] Added skill step:', skillStepId, event.skills);
        }
        break;
      }

      case 'content_chunk':
        setStatusMessage(null);
        setStreamingContent(event.content);
        setIsStreaming(true);
        break;

      case 'sprint_import_start':
        // Only show sprint events in Agent Mode
        if (isAgentModeRef.current) {
          setStatusMessage(event.message);
          addExecutionStep({
            type: 'thinking',
            title: 'Sprint Board',
            details: event.message,
            status: 'running',
          });
          _log('[AgentStream] Sprint Board import starting');
        }
        break;

      case 'sprint_import_complete':
        // Only show sprint events in Agent Mode
        if (isAgentModeRef.current) {
          setStatusMessage(`Imported ${event.stories_imported} stories to Sprint Board`);
          // Update the sprint import step to complete
          setExecutionSteps(prev => prev.map(step =>
            step.title === 'Sprint Board' && step.status === 'running'
              ? {
                  ...step,
                  status: 'complete' as const,
                  details: `${event.stories_imported} stories (${event.total_points} pts) → ${event.sprint_name}`,
                }
              : step
          ));
          _log('[AgentStream] Sprint Board import complete:', event.stories_imported, 'stories');
        }
        break;

      case 'sprint_import_failed':
      case 'sprint_import_error':
        _warn('[AgentStream] Sprint Board import failed:', event.message);
        // Only show sprint events in Agent Mode
        if (isAgentModeRef.current) {
          // Update the sprint import step to error
          setExecutionSteps(prev => prev.map(step =>
            step.title === 'Sprint Board' && step.status === 'running'
              ? { ...step, status: 'error' as const, details: event.message }
              : step
          ));
        }
        break;

      case 'error':
        setError(event.message);
        setStatusMessage(null);
        setStreamingContent(null);
        setIsStreaming(false);
        // Only add error steps in Agent Mode
        if (isAgentModeRef.current) {
          addExecutionStep({
            type: 'thinking',
            title: 'Error',
            details: event.message,
            status: 'error',
          });
        }
        break;

      case 'done':
        setStatusMessage(null);
        setStreamingContent(null);
        setCurrentPhase(null);
        setIsStreaming(false);
        // Record usage stats for agent mode
        if (event.result?.completion_time_ms) {
          const estimatedTokens = Math.round(event.result.completion_time_ms / 10);
          const inputTokens = Math.round(estimatedTokens * 0.2);
          const outputTokens = estimatedTokens - inputTokens;
          recordUsage({
            model: 'universal-agent',
            inputTokens,
            outputTokens,
            agent: event.result.phase || 'universal',
          });
        }
        break;

      case 'ask_question': {
        // Agent is asking user a clarifying question
        const questionEvent = event as unknown as AskQuestionEvent;
        _log('[AgentStream] Question received:', questionEvent);
        setCurrentQuestion({
          question_id: questionEvent.question_id,
          question: questionEvent.question,
          header: questionEvent.header,
          options: questionEvent.options,
          multiSelect: questionEvent.multiSelect,
          conversation_id: questionEvent.conversation_id,
        });
        setStatusMessage('Waiting for your response...');

        // CRITICAL: Update currentConversation with the real ID from the backend
        // This ensures subsequent messages use the correct conversation_id
        if (questionEvent.conversation_id) {
          setCurrentConversation(prev => {
            if (!prev || prev.id === 'temp-new' || prev.id !== questionEvent.conversation_id) {
              _log('[AgentStream] Updating conversation ID:', questionEvent.conversation_id);
              return {
                id: questionEvent.conversation_id,
                title: prev?.title || 'New Conversation',
                user_id: prev?.user_id || null,
                created_at: prev?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                message_count: prev?.message_count || 1,
                messages: prev?.messages || [],
              };
            }
            return prev;
          });
        }

        // Add execution step for the question
        addExecutionStep({
          type: 'thinking',
          title: `Question: ${questionEvent.header}`,
          details: questionEvent.question,
          status: 'running',
          metadata: { question_id: questionEvent.question_id },
        });
        break;
      }

      case 'awaiting_answer':
        // Stream paused, waiting for user input
        _log('[AgentStream] Awaiting answer');
        setIsStreaming(false);
        break;

      case 'gsd_command_start': {
        // GSD command execution started
        const gsdEvent = event as unknown as { type: string; command: string };
        _log('[AgentStream] GSD command start:', gsdEvent.command);
        setStatusMessage(`Executing /gsd:${gsdEvent.command}...`);
        addExecutionStep({
          type: 'thinking',
          title: `/gsd:${gsdEvent.command}`,
          status: 'running',
          metadata: { gsd_command: gsdEvent.command },
        });
        break;
      }

      case 'gsd_command_progress': {
        // GSD command progress update (for streaming commands)
        const progressEvent = event as unknown as {
          type: string;
          success: boolean;
          command_type: string;
          message: string;
          streaming: boolean;
        };
        _log('[AgentStream] GSD command progress:', progressEvent.message);
        setStatusMessage(progressEvent.message);
        break;
      }

      case 'gsd_command_complete': {
        // GSD command execution completed
        const completeEvent = event as unknown as {
          type: string;
          success: boolean;
          command_type: string;
          message: string;
          data?: Record<string, unknown>;
          next_action?: string;
          requires_followup?: boolean;
        };
        _log('[AgentStream] GSD command complete:', completeEvent.command_type, completeEvent.success);

        // Update execution step status
        setExecutionSteps(prev => prev.map(step =>
          step.metadata?.gsd_command === completeEvent.command_type
            ? {
                ...step,
                status: completeEvent.success ? 'complete' as const : 'error' as const,
                details: completeEvent.message,
              }
            : step
        ));

        // Store GSD result in streaming content for display
        setStreamingContent(completeEvent.message);
        setStatusMessage(completeEvent.success ? 'Command completed' : 'Command failed');

        // Store GSD result data in conversation for proper rendering
        setCurrentConversation(prev => {
          if (!prev) {return prev;}
          const gsdResultMessage = {
            id: `gsd-result-${crypto.randomUUID()}`,
            conversation_id: prev.id,
            role: 'assistant' as const,
            content: completeEvent.message,
            created_at: new Date().toISOString(),
            gsdResult: completeEvent,  // Store full GSD result for GSDCommandOutput
          };
          return {
            ...prev,
            messages: [...prev.messages.filter(m => !m.id.startsWith('temp-')), gsdResultMessage],
            message_count: prev.message_count + 1,
          };
        });
        break;
      }

      case 'gsd_followup': {
        // GSD command requires LLM followup
        const followupEvent = event as unknown as { type: string; prompt: string };
        _log('[AgentStream] GSD followup needed:', followupEvent.prompt.substring(0, 100));
        // The followup prompt can be used to continue the conversation
        // For now, just log it - actual continuation would require sending to LLM
        break;
      }

      case 'gsd_handoff': {
        // GSD phase transition handoff event
        const handoffEvent = event;
        _log('[AgentStream] GSD handoff:', handoffEvent.from_phase, '->', handoffEvent.to_phase);
        // Add execution step to show handoff in UI
        addExecutionStep({
          type: 'handoff',
          title: `Phase: ${handoffEvent.from_phase} \u2192 ${handoffEvent.to_phase}`,
          details: handoffEvent.summary,
          status: 'complete',
          metadata: {
            handoff: {
              from_phase: handoffEvent.from_phase,
              to_phase: handoffEvent.to_phase,
              summary: handoffEvent.summary,
              key_actions: handoffEvent.key_actions,
              files_modified: handoffEvent.files_modified,
            },
          },
        });
        break;
      }

      // ========== Athena Orchestration Events ==========

      case 'athena_routing_start': {
        // Athena routing has begun
        _log('[AgentStream] Athena routing started');
        setStatusMessage('Athena analyzing request...');
        addExecutionStep({
          type: 'thinking',
          title: 'Athena Routing',
          details: 'Finding best agent and skills...',
          status: 'running',
          metadata: { athena: true, stage: 'routing' },
        });
        break;
      }

      case 'athena_routing_complete': {
        // Athena routing succeeded
        const athenaCompleteEvent = event as unknown as {
          type: string;
          agent: string | null;
          skills: string[];
          time_ms: number;
        };
        _log('[AgentStream] Athena routing complete:', athenaCompleteEvent.agent, athenaCompleteEvent.skills);

        // Build details string
        const agentInfo = athenaCompleteEvent.agent ? `Agent: ${athenaCompleteEvent.agent}` : 'No specific agent';
        const skillInfo = athenaCompleteEvent.skills?.length > 0
          ? `Skills: ${athenaCompleteEvent.skills.join(', ')}`
          : 'No skills matched';
        const timeInfo = `(${athenaCompleteEvent.time_ms.toFixed(0)}ms)`;

        // Update the Athena routing step to complete
        setExecutionSteps(prev => prev.map(step =>
          step.metadata?.athena && step.metadata?.stage === 'routing'
            ? {
                ...step,
                status: 'complete' as const,
                details: `${agentInfo} | ${skillInfo} ${timeInfo}`,
              }
            : step
        ));
        setStatusMessage(athenaCompleteEvent.agent ? `Routed to ${athenaCompleteEvent.agent}` : null);
        break;
      }

      case 'athena_routing_fallback': {
        // Athena routing fell back to default
        const athenaFallbackEvent = event as unknown as { type: string; reason: string };
        _log('[AgentStream] Athena routing fallback:', athenaFallbackEvent.reason);

        // Update the Athena routing step to show fallback
        setExecutionSteps(prev => prev.map(step =>
          step.metadata?.athena && step.metadata?.stage === 'routing'
            ? {
                ...step,
                status: 'complete' as const,
                title: 'Athena Fallback',
                details: athenaFallbackEvent.reason || 'Using default routing',
              }
            : step
        ));
        setStatusMessage(null);
        break;
      }

      case 'athena_gap_detected': {
        // Athena detected skill gaps
        const athenaGapEvent = event as unknown as {
          type: string;
          gaps: Array<{ task_type?: string; description?: string }>;
        };
        _log('[AgentStream] Athena gaps detected:', athenaGapEvent.gaps?.length || 0);

        if (athenaGapEvent.gaps?.length > 0) {
          const gapDescriptions = athenaGapEvent.gaps
            .map(g => g.task_type || g.description || 'Unknown gap')
            .join(', ');
          addExecutionStep({
            type: 'thinking',
            title: 'Skill Gaps Detected',
            details: `${athenaGapEvent.gaps.length} gap(s): ${gapDescriptions}`,
            status: 'complete',
            metadata: { athena: true, stage: 'gaps', gaps: athenaGapEvent.gaps },
          });
        }
        break;
      }

      case 'memory_saved': {
        // Mnemosyne captured a memory from this conversation
        const memoryEvent = event as unknown as { type: string; memory_id: string; summary: string };
        _log('[AgentStream] Memory saved:', memoryEvent.memory_id);
        addExecutionStep({
          type: 'thinking',
          title: 'Memory Captured',
          details: memoryEvent.summary || 'Conversation stored in Mnemosyne',
          status: 'complete',
          metadata: { mnemosyne: true, memory_id: memoryEvent.memory_id },
        });
        break;
      }
    }
  }, [recordUsage, addExecutionStep]);

  /**
   * Cancel the current message/request
   * Aborts the fetch and resets streaming state
   */
  const cancelMessage = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    setIsStreaming(false);
    setStreamingContent(null);
    setStatusMessage('Cancelled');
    // Add cancelled step to execution progress
    setExecutionSteps(prev => [
      ...prev,
      {
        id: `step-cancelled-${crypto.randomUUID()}`,
        type: 'thinking',
        title: 'Cancelled',
        status: 'error',
        timestamp: new Date(),
      }
    ]);
  }, []);

  /**
   * Submit an answer to a question asked by the agent
   * Used when agent pauses execution via ask_user_question tool
   * @param answer - The user's selected answer or custom text
   * @param selectedOptions - For multiSelect questions, array of selected option labels
   */
  const submitQuestionAnswer = useCallback(async (answer: string, selectedOptions?: string[]) => {
    if (!currentQuestion) {
      _warn('No pending question to answer');
      return;
    }

    setStatusMessage('Submitting answer...');

    try {
      const result = await chatService.submitQuestionAnswer(
        currentQuestion.conversation_id,
        currentQuestion.question_id,
        answer,
        selectedOptions
      );

      _log('[useChat] Answer submitted:', result);

      // Mark the question step as complete
      setExecutionSteps(prev => prev.map(step =>
        step.metadata?.question_id === currentQuestion.question_id
          ? { ...step, status: 'complete' as const, details: `Answered: ${answer}` }
          : step
      ));

      // Save question info before clearing
      const questionText = currentQuestion.question;
      const questionHeader = currentQuestion.header;

      // Clear the current question
      setCurrentQuestion(null);
      setStatusMessage(null);

      // Auto-continue the conversation with the answer
      // Include the question context so the agent knows what was answered
      const answerText = selectedOptions && selectedOptions.length > 1
        ? selectedOptions.join(', ')
        : answer;
      const continuationMessage = `[${questionHeader}] ${questionText}\n\nMy answer: ${answerText}\n\nPlease continue with the next question.`;

      // Use stored options to continue with same settings
      // Capture refs immediately to avoid stale closures in async callback
      const lastOptions = lastSendOptionsRef.current;
      const sendMessageFn = sendMessageRef.current;
      if (lastOptions && sendMessageFn) {
        _log('[useChat] Auto-continuing conversation after answer');
        // Use queueMicrotask to defer until after state updates complete
        // This avoids the race condition from setTimeout while ensuring UI updates first
        queueMicrotask(() => {
          // Double-check refs are still valid after microtask
          if (sendMessageRef.current) {
            sendMessageFn(continuationMessage, lastOptions.model, lastOptions.options);
          }
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(errorMessage);
      _error('Submit answer error:', err);

      // Mark the question step as error
      setExecutionSteps(prev => prev.map(step =>
        step.metadata?.question_id === currentQuestion.question_id
          ? { ...step, status: 'error' as const, details: errorMessage }
          : step
      ));
    }
  }, [currentQuestion]);

  /**
   * Regenerate (re-execute) a message response
   * Deletes the assistant's response and re-sends the user's prompt
   * @param messageId - ID of the message to regenerate (user or assistant)
   * @param model - Optional different model to use for regeneration
   */
  const regenerateMessage = useCallback(async (messageId: string, model?: string) => {
    if (!currentConversation) {
      _warn('No current conversation for regeneration');
      return;
    }

    setIsSending(true);
    setError(null);
    setStatusMessage('Preparing to regenerate...');

    try {
      // Call backend to prepare for regeneration
      const result = await chatService.regenerateMessage(messageId, model);

      _log('[useChat] Regeneration prepared:', result);

      // Update status
      setStatusMessage('Regenerating response...');

      // Clear execution state for fresh run
      setExecutionSteps([]);
      setCurrentPhase(null);
      stepIdRef.current = 0;

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Re-send the original prompt using persistent chat stream
      const streamResult = await chatService.sendPersistentChatStream(
        {
          message: result.prompt,
          conversation_id: result.conversation_id,
          phase: (result.phase as TaskPhase) || 'auto',
          model: model || result.model,
        },
        handleAgentStreamEvent,
        abortControllerRef.current?.signal
      );

      if (streamResult) {
        // Reload the conversation to get updated messages
        const detail = await chatService.getPersistentConversation(result.conversation_id);
        setCurrentConversation(detail);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate message';
      setError(errorMessage);
      _error('Regenerate message error:', err);
    } finally {
      setIsSending(false);
      setStatusMessage(null);
      setStreamingContent(null);
      setIsStreaming(false);
    }
  }, [currentConversation, handleAgentStreamEvent]);

  /**
   * Send a message and get AI response
   * Handles conversation creation if needed
   * Uses streaming endpoint for real-time tool visibility
   * Supports both Direct Mode and Agent Mode (Universal Agent)
   * @param content - Message content to send
   * @param model - Optional model ID to use for completion
   * @param options - Optional agent mode settings
   */
  const sendMessage = useCallback(async (content: string, model?: string, options?: SendMessageOptions) => {
    if (!content.trim()) {
      _warn('Attempted to send empty message');
      return;
    }

    // GSD command detection and handling
    if (isGSDCommand(content)) {
      _log('GSD command detected:', content);

      // Handle /gsd:help locally - display help in chat
      if (content.trim().toLowerCase() === '/gsd:help') {
        const helpContent = `## GSD Commands (Get Shit Done)

29 commands for project workflow orchestration:

| Command | Description |
|---------|-------------|
| \`/gsd:add-phase\` | Add phase to end of current milestone |
| \`/gsd:add-todo\` | Capture idea or task as todo |
| \`/gsd:audit-milestone\` | Audit milestone completion |
| \`/gsd:check-todos\` | List pending todos |
| \`/gsd:complete-milestone\` | Archive completed milestone |
| \`/gsd:create-roadmap\` | Create roadmap with phases |
| \`/gsd:debug <issue>\` | Systematic debugging with persistent state |
| \`/gsd:define-requirements\` | Define what "done" looks like |
| \`/gsd:discuss-milestone\` | Gather context for next milestone |
| \`/gsd:discuss-phase\` | Gather phase context before planning |
| \`/gsd:execute-phase <id>\` | Execute all plans in a phase |
| \`/gsd:execute-plan\` | Execute a PLAN.md file |
| \`/gsd:help\` | Show this help message |
| \`/gsd:insert-phase\` | Insert urgent work as decimal phase |
| \`/gsd:list-phase-assumptions\` | Surface assumptions about phase |
| \`/gsd:map-codebase\` | Analyze codebase with parallel mappers |
| \`/gsd:new-milestone\` | Start a new milestone cycle |
| \`/gsd:new-project\` | Initialize new project with PROJECT.md |
| \`/gsd:pause-work\` | Create context handoff when pausing |
| \`/gsd:plan-milestone-gaps\` | Create phases to close gaps |
| \`/gsd:plan-phase <id>\` | Create detailed execution plan |
| \`/gsd:progress\` | Check project progress |
| \`/gsd:remove-phase\` | Remove phase and renumber |
| \`/gsd:research-phase <id>\` | Research how to implement phase |
| \`/gsd:research-project\` | Research domain ecosystem |
| \`/gsd:resume-work\` | Resume work from previous session |
| \`/gsd:update\` | Update GSD to latest version |
| \`/gsd:verify-work\` | Validate built features through UAT |
| \`/gsd:whats-new\` | See what's new in GSD |

**Typical Workflow:**
1. \`/gsd:new-project\` - Initialize project
2. \`/gsd:define-requirements\` - Define success criteria
3. \`/gsd:create-roadmap\` - Create phases
4. \`/gsd:plan-phase 1\` - Plan first phase
5. \`/gsd:execute-phase 1\` - Execute the phase
6. \`/gsd:progress\` - Check progress

*Note: GSD commands require Agent Mode to be enabled for full functionality.*`;

        // Add user message
        const userMessage = {
          id: `gsd-help-user-${crypto.randomUUID()}`,
          conversation_id: currentConversation?.id || 'new',
          role: 'user' as const,
          content: content,
          created_at: new Date().toISOString(),
        };

        // Add assistant response
        const assistantMessage = {
          id: `gsd-help-assistant-${crypto.randomUUID()}`,
          conversation_id: currentConversation?.id || 'new',
          role: 'assistant' as const,
          content: helpContent,
          created_at: new Date().toISOString(),
        };

        setCurrentConversation(prev => {
          if (!prev) {
            return {
              id: 'temp-new',
              title: 'GSD Help',
              user_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: 2,
              messages: [userMessage, assistantMessage],
            };
          }
          return {
            ...prev,
            messages: [...prev.messages, userMessage, assistantMessage],
            message_count: prev.message_count + 2,
          };
        });

        return; // Don't send to backend
      }
    }

    // Pronetheia command detection and handling
    if (isPronetheiaCommand(content)) {
      _log('Pronetheia command detected:', content);

      // Handle /p-help locally - display help in chat
      if (content.trim().toLowerCase() === '/p-help') {
        const helpContent = `## Pronetheia Commands

63 commands for AI-powered development:

### Development & Code
| Command | Description |
|---------|-------------|
| \`/p-debug\` | Apply expert debugging methodology |
| \`/p-review\` | Quick code review |
| \`/p-test\` | Quick testing with QA agent |
| \`/p-docs\` | Quick documentation generation |
| \`/p-validate\` | Run comprehensive project validation |
| \`/p-security\` | Security scanning and vulnerability testing |
| \`/p-feature\` | Execute full Ex Nihilo feature workflow |
| \`/p-files\` | File system operations |
| \`/p-cleanup\` | Clean up temporary files |

### Planning & Orchestration
| Command | Description |
|---------|-------------|
| \`/p-new\` | Start a new project with Intent Capture |
| \`/p-plan\` | Multi-agent task planning |
| \`/p-orchestrate\` | Unified multi-agent orchestration |
| \`/p-breakdown\` | Task decomposition without execution |
| \`/p-requirements\` | Strategic requirements gathering |
| \`/p-stack\` | Interactive technology stack builder |
| \`/p-oneshot\` | Complete app generation in one execution |
| \`/p-run-plan\` | Execute a PLAN.md file |
| \`/p-run-prompt\` | Delegate prompts to sub-task contexts |
| \`/p-next-phase\` | Execute next phase workflow |

### Agents & Skills
| Command | Description |
|---------|-------------|
| \`/p-agents\` | List and search all 98 agents |
| \`/p-prompt\` | Prompt Engineer for optimization |
| \`/p-create-agent-skill\` | Create Claude Code skills |
| \`/p-create-slash-command\` | Create new slash commands |
| \`/p-create-subagent\` | Create specialized subagents |
| \`/p-create-hook\` | Claude Code hook development |
| \`/p-create-prompt\` | Create prompts for Claude |
| \`/p-create-plan\` | Create hierarchical project plans |
| \`/p-create-meta-prompt\` | Optimize Claude-to-Claude pipelines |
| \`/p-arena\` | Parallel Development Arena |
| \`/p-arena-status\` | View active arena status |

### Analysis & Decision Making
| Command | Description |
|---------|-------------|
| \`/p-5-whys\` | Drill to root cause |
| \`/p-10-10-10\` | Evaluate across time horizons |
| \`/p-swot\` | Map strengths, weaknesses, opportunities, threats |
| \`/p-pareto\` | Apply 80/20 rule |
| \`/p-first-principles\` | Break down to fundamentals |
| \`/p-eisenhower-matrix\` | Prioritize by urgent/important |
| \`/p-inversion\` | Solve problems backwards |
| \`/p-occams-razor\` | Find simplest explanation |
| \`/p-one-thing\` | Identify highest-leverage action |
| \`/p-opportunity-cost\` | Analyze trade-offs |
| \`/p-second-order\` | Think through consequences |
| \`/p-via-negativa\` | Improve by removing |

### Session & State
| Command | Description |
|---------|-------------|
| \`/p-status\` | Show comprehensive system status |
| \`/p-checkpoint\` | Create checkpoint and push to GitHub |
| \`/p-restore\` | Restore from a checkpoint |
| \`/p-handoff\` | Generate handoff documentation |
| \`/p-whats-next\` | Create handoff for fresh context |
| \`/p-reflect\` | Reflect on corrections, update CLAUDE.md |
| \`/p-skip-reflect\` | Discard queued learnings |
| \`/p-view-queue\` | View pending learnings |
| \`/p-processes\` | Monitor background processes |
| \`/p-init\` | Initialize Pronetheia-OS |

### Todos & Tasks
| Command | Description |
|---------|-------------|
| \`/p-add-to-todos\` | Add todo item to TO-DOS.md |
| \`/p-check-todos\` | List outstanding todos |
| \`/p-ba\` | Business Analyst methodology |

### Auditing
| Command | Description |
|---------|-------------|
| \`/p-audit-skill\` | Audit skill for best practices |
| \`/p-audit-slash-command\` | Audit slash command file |
| \`/p-audit-subagent\` | Audit subagent configuration |
| \`/p-heal-skill\` | Apply corrections to skill docs |

### Other
| Command | Description |
|---------|-------------|
| \`/p-voice\` | Voice service management |
| \`/p-plugin\` | Plugin management system |
| \`/p-spec\` | View/edit TaskSpec |
| \`/p-help\` | Show this help message |

*Note: Commands require Agent Mode for full functionality.*`;

        // Add user message
        const userMessage = {
          id: `pronetheia-help-user-${crypto.randomUUID()}`,
          conversation_id: currentConversation?.id || 'new',
          role: 'user' as const,
          content: content,
          created_at: new Date().toISOString(),
        };

        // Add assistant response
        const assistantMessage = {
          id: `pronetheia-help-assistant-${crypto.randomUUID()}`,
          conversation_id: currentConversation?.id || 'new',
          role: 'assistant' as const,
          content: helpContent,
          created_at: new Date().toISOString(),
        };

        setCurrentConversation(prev => {
          if (!prev) {
            return {
              id: 'temp-new',
              title: 'Pronetheia Help',
              user_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: 2,
              messages: [userMessage, assistantMessage],
            };
          }
          return {
            ...prev,
            messages: [...prev.messages, userMessage, assistantMessage],
            message_count: prev.message_count + 2,
          };
        });

        return; // Don't send to backend
      }

      // Execute /p-* commands via agent-stream for full multi-turn conversation support
      // This allows commands like /p-requirements to ask questions interactively and create files
      const commandMatch = content.trim().match(/^\/p-([a-z0-9-]+)(?:\s+(.*))?$/i);
      if (commandMatch) {
        const commandName = `p-${commandMatch[1]}`;

        // Add user message to chat
        const userMessage = {
          id: `cmd-user-${crypto.randomUUID()}`,
          conversation_id: currentConversation?.id || 'new',
          role: 'user' as const,
          content: content,
          created_at: new Date().toISOString(),
        };

        setCurrentConversation(prev => {
          if (!prev) {
            return {
              id: 'temp-new',
              title: `/${commandName}`,
              user_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: 1,
              messages: [userMessage],
            };
          }
          return {
            ...prev,
            messages: [...prev.messages, userMessage],
            message_count: prev.message_count + 1,
          };
        });

        setIsSending(true);
        setIsStreaming(true);
        setStreamingContent('');
        setStatusMessage(`Executing /${commandName}...`);

        try {
          // Route through agent-stream for full conversation support
          // The backend detects /p-* commands and injects the template as system prompt
          let accumulatedContent = '';

          const result = await chatService.sendAgentChatStream(
            {
              message: content,
              conversation_id: currentConversation?.id,
              phase: 'discovery',
            },
            (event) => {
              const e = event as unknown as Record<string, unknown>;
              switch (e.type) {
                case 'content_chunk':
                  accumulatedContent = (e.content as string) || accumulatedContent;
                  setStreamingContent(accumulatedContent);
                  break;
                case 'content':
                  accumulatedContent += (e.content as string) || '';
                  setStreamingContent(accumulatedContent);
                  break;
                case 'pronetheia_command':
                  setStatusMessage(`Running /p-${e.command}: ${e.description || ''}`);
                  break;
                case 'thinking':
                  setStatusMessage((e.message as string) || 'Processing...');
                  break;
                case 'phase_start':
                  setStatusMessage(`${(e.message as string) || (e.phase as string) || ''}`);
                  break;
                case 'error':
                  setError((e.message as string) || 'Command failed');
                  break;
                case 'artifacts_saved':
                  if (e.files && Array.isArray(e.files) && (e.files as string[]).length > 0) {
                    const fileList = (e.files as string[]).map((f: string) => `- ${f}`).join('\n');
                    accumulatedContent += `\n\n---\n**Files Saved:**\n${fileList}`;
                    setStreamingContent(accumulatedContent);
                    window.dispatchEvent(new CustomEvent('pronetheia:files-changed', {
                      detail: { files: e.files, fullPaths: e.full_paths }
                    }));
                  }
                  break;
                case 'project_files_changed':
                  window.dispatchEvent(new CustomEvent('pronetheia:files-changed', {
                    detail: { action: e.action, file: e.file, fullPath: e.full_path }
                  }));
                  break;
              }
            },
            abortControllerRef.current?.signal
          );

          // Handle conversation_id from done result
          if (result?.conversation_id) {
            const backendConvId = result.conversation_id;
            agentStreamConversationsRef.current.add(backendConvId);

            setCurrentConversation(prev => {
              if (!prev || prev.id === 'temp-new' || prev.id === 'new') {
                return {
                  id: backendConvId,
                  title: prev?.title || 'New Conversation',
                  user_id: prev?.user_id || null,
                  created_at: prev?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  message_count: prev?.message_count || 1,
                  messages: prev?.messages || [],
                };
              }
              return prev;
            });
          }

          // Add assistant message with accumulated content
          const assistantMessage = {
            id: `cmd-assistant-${crypto.randomUUID()}`,
            conversation_id: currentConversation?.id || 'new',
            role: 'assistant' as const,
            content: accumulatedContent || 'Command executed successfully.',
            created_at: new Date().toISOString(),
          };

          setCurrentConversation(prev => {
            if (!prev) {return prev;}
            return {
              ...prev,
              messages: [...prev.messages, assistantMessage],
              message_count: prev.message_count + 1,
            };
          });

        } catch (error) {
          _error('Command execution failed:', error);
          const errorMessage = {
            id: `cmd-error-${crypto.randomUUID()}`,
            conversation_id: currentConversation?.id || 'new',
            role: 'assistant' as const,
            content: `**Error executing /${commandName}:** ${error instanceof Error ? error.message : 'Unknown error'}`,
            created_at: new Date().toISOString(),
          };

          setCurrentConversation(prev => {
            if (!prev) {return prev;}
            return {
              ...prev,
              messages: [...prev.messages, errorMessage],
              message_count: prev.message_count + 1,
            };
          });
        } finally {
          setIsSending(false);
          setIsStreaming(false);
          setStreamingContent(null);
          setStatusMessage(null);
        }

        return; // Command executed, don't send to regular chat
      }
    }

    setIsSending(true);
    setError(null);
    setToolActivities([]);
    setStatusMessage(null);
    setStreamingContent(null);
    setExecutionSteps([]);
    setCurrentPhase(null);
    setIsStreaming(false);
    stepIdRef.current = 0;

    // Track whether we're in actual agent mode (for showing phases)
    isAgentModeRef.current = options?.agentMode ?? false;

    // Save message params for retry functionality
    setLastFailedMessage({ content, model, options });

    // Store options for conversation continuation after question answers
    lastSendOptionsRef.current = { model, options };

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Optimistically add user message to UI immediately
    const tempUserMessage = {
      id: `temp-${crypto.randomUUID()}`,
      conversation_id: currentConversation?.id || 'new',
      role: 'user' as const,
      content: content,
      created_at: new Date().toISOString(),
    };

    // Add user message to current conversation immediately (even for new conversations)
    if (currentConversation) {
      setCurrentConversation(prev => {
        if (!prev) {return null;}
        return {
          ...prev,
          messages: [...prev.messages, tempUserMessage],
          message_count: prev.message_count + 1,
        };
      });
    } else {
      // For new conversations, create a temporary conversation state to show the message
      setCurrentConversation({
        id: 'temp-new',
        title: 'New Conversation',
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 1,
        messages: [tempUserMessage],
      });
    }

    try {
      // Check if this conversation needs agent-stream routing (started with /p-* command)
      const currentConvId = currentConversation?.id;
      const needsAgentStream = currentConvId &&
        !currentConvId.startsWith('temp') &&
        currentConvId !== 'new' &&
        agentStreamConversationsRef.current.has(currentConvId);

      if (needsAgentStream) {
        // AGENT-STREAM MODE: Continue conversation that was started with /p-* command
        // These conversations use in-memory storage via agent-stream endpoint
        let accumulatedContent = '';

        await chatService.sendAgentChatStream(
          {
            message: content,
            conversation_id: currentConvId,
            model: model,
            phase: options?.phase || 'discovery',
            project_path: options?.projectPath,
            project_id: options?.projectId,
          },
          (event) => {
            const e = event as unknown as Record<string, unknown>;
            switch (e.type) {
              case 'content_chunk':
                accumulatedContent = (e.content as string) || accumulatedContent;
                setStreamingContent(accumulatedContent);
                break;
              case 'content':
                accumulatedContent += (e.content as string) || '';
                setStreamingContent(accumulatedContent);
                break;
              case 'thinking':
                setStatusMessage((e.message as string) || 'Processing...');
                break;
              case 'phase_start':
                setStatusMessage(`${(e.message as string) || (e.phase as string) || ''}`);
                break;
              case 'error':
                throw new Error((e.error as string) || (e.message as string) || 'Request failed');
              case 'done':
                break;
            }
          },
          abortControllerRef.current?.signal
        );

        // Add assistant message to conversation
        if (accumulatedContent) {
          const assistantMessage = {
            id: `agent-${crypto.randomUUID()}`,
            conversation_id: currentConvId,
            role: 'assistant' as const,
            content: accumulatedContent,
            created_at: new Date().toISOString(),
          };

          setCurrentConversation(prev => {
            if (!prev) {return null;}
            return {
              ...prev,
              messages: [...prev.messages, assistantMessage],
              message_count: prev.message_count + 1,
              updated_at: assistantMessage.created_at,
            };
          });
        }

        setLastFailedMessage(null);
      } else if (options?.agenticMode) {
        // AGENTIC MODE: True agentic loop with iterative tool execution (like Claude Code)
        // Uses the new agentic-stream endpoint that loops until task is complete
        setIsStreaming(true);
        let accumulatedContent = '';
        const stepIdMap: Record<string, string> = {};

        const result = await chatService.sendAgenticChatStream(
          {
            message: content,
            conversation_id: currentConversation?.id,
            model: model,
            project_path: options?.projectPath,
            max_iterations: options?.maxIterations ?? 10,
            enable_self_healing: options?.enableSelfHealing ?? true,
          },
          (event) => {
            switch (event.type) {
              case 'status':
                setStatusMessage(event.message);
                break;
              case 'iteration_start':
                setCurrentPhase(`Iteration ${event.iteration}/${event.max_iterations}`);
                stepIdMap[`iter-${event.iteration}`] = addExecutionStep({
                  type: 'phase',
                  status: 'running',
                  title: `Iteration ${event.iteration}`,
                });
                break;
              case 'iteration_end':
                const iterStepId = stepIdMap[`iter-${event.iteration}`];
                if (iterStepId) {
                  updateStepStatus(
                    iterStepId,
                    event.continuing ? 'running' : 'complete',
                    event.tool_calls > 0 ? `${event.tool_calls} tool(s) executed` : 'Thinking...'
                  );
                }
                break;
              case 'tool_start':
                stepIdMap[`tool-${event.tool_call_id}`] = addExecutionStep({
                  type: 'tool',
                  status: 'running',
                  title: event.tool,
                  details: JSON.stringify(event.arguments).slice(0, 100),
                });
                setToolActivities(prev => [...prev, {
                  id: event.tool_call_id,
                  tool: event.tool,
                  status: 'running',
                  startedAt: new Date(),
                }]);
                break;
              case 'tool_result':
                const toolStepId = stepIdMap[`tool-${event.tool_call_id}`];
                if (toolStepId) {
                  updateStepStatus(
                    toolStepId,
                    event.success ? 'complete' : 'error',
                    event.success ? `Completed in ${event.duration_ms}ms` : `Error: ${event.error}`
                  );
                }
                setToolActivities(prev => prev.map(t =>
                  t.id === event.tool_call_id
                    ? { ...t, status: event.success ? 'success' : 'error', completedAt: new Date() }
                    : t
                ));
                break;
              case 'content_chunk':
                accumulatedContent = event.content;
                setStreamingContent(accumulatedContent);
                break;
              case 'circuit_breaker':
                setError(`Circuit breaker: ${event.reason}`);
                addExecutionStep({
                  type: 'phase',
                  status: 'error',
                  title: 'Circuit Breaker',
                  details: event.reason,
                });
                break;
              case 'complete':
                setCurrentPhase(null);
                addExecutionStep({
                  type: 'phase',
                  status: event.success ? 'complete' : 'error',
                  title: event.success ? 'Complete' : 'Failed',
                  details: `${event.iterations} iterations, ${event.total_tool_calls} tools, ${event.elapsed_seconds.toFixed(1)}s`,
                });
                break;
              case 'error':
                setError(event.error);
                break;
            }
          },
          abortControllerRef.current?.signal
        );

        // Add assistant message with accumulated content
        if (accumulatedContent) {
          const assistantMessage = {
            id: `agentic-${crypto.randomUUID()}`,
            conversation_id: currentConversation?.id || 'new',
            role: 'assistant' as const,
            content: accumulatedContent,
            created_at: new Date().toISOString(),
          };

          setCurrentConversation(prev => {
            if (!prev) {return null;}
            return {
              ...prev,
              messages: [...prev.messages, assistantMessage],
              message_count: prev.message_count + 1,
            };
          });
        }

        setLastFailedMessage(null);
        setIsStreaming(false);
      } else if (options?.agentMode) {
        // AGENT MODE: Use persistent chat stream with full agent features
        // Includes phase-based orchestration, tools, and clarifying questions
        const conversationId = currentConversation?.id &&
          !currentConversation.id.startsWith('temp') &&
          currentConversation.id !== 'new'
            ? currentConversation.id
            : undefined;

        const result = await chatService.sendPersistentChatStream(
          {
            message: content,
            conversation_id: conversationId,
            phase: options.phase || 'auto',
            model: model,
            project_id: options?.projectId,
            project_path: options?.projectPath,
            save_artifacts: options?.saveArtifacts ?? true,
            tools: options?.tools,
            workspace_mode: options?.workspaceMode,
          },
          handleAgentStreamEvent,
          abortControllerRef.current?.signal
        );

        if (result) {
          // Got result from agent - extract conversation_id and update UI
          const conversationId = result.conversation_id;
          const userMessage = result.user_message;
          const assistantMessage = result.assistant_message;

          if (userMessage && assistantMessage) {
            // Use messages from the done event directly (works for both new and existing conversations)
            // Map backend fields to frontend Message type (handle timestamp/created_at)
            const mapMsg = (msg: any): import('../types/chat').Message => ({
              id: typeof msg.id === 'string' ? msg.id : crypto.randomUUID(),
              conversation_id: conversationId,
              role: ['user', 'assistant', 'system'].includes(msg.role) ? msg.role : 'assistant',
              content: typeof msg.content === 'string' ? msg.content : String(msg.content || ''),
              created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
            });

            setCurrentConversation(prev => {
              const base = prev || {
                id: conversationId,
                title: 'New Conversation',
                user_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                message_count: 0,
                messages: [],
              };
              const messagesWithoutTemp = base.messages.filter(m => !m.id.startsWith('temp-'));
              const mapped = [mapMsg(userMessage), mapMsg(assistantMessage)];
              const newIds = new Set(mapped.map(m => m.id));
              const deduped = messagesWithoutTemp.filter(m => !newIds.has(m.id));
              return {
                ...base,
                id: conversationId,
                messages: [...deduped, ...mapped],
                message_count: deduped.length + 2,
                updated_at: mapped[1].created_at,
              };
            });

            // Refresh conversation list in background (for sidebar title)
            loadConversations();
          } else {
            // Fallback: no messages in result - fetch from DB
            const detail = await chatService.getPersistentConversation(conversationId);
            setCurrentConversation(detail);
            await loadConversations();
          }

          // Success - clear the last failed message (only when we got a valid response)
          setLastFailedMessage(null);
        } else {
          // Agent request returned null but no error was set - set a generic error
          // This catches cases where the network fails but error callback didn't fire
          setError(prev => prev || 'Failed to send message. Please check your connection.');
        }
      } else {
        // LLM MODE: Use simple chat endpoint - no tools, no questions, just direct responses
        // This provides Claude.ai-like experience for pure Q&A
        const conversationId = currentConversation?.id &&
          !currentConversation.id.startsWith('temp') &&
          currentConversation.id !== 'new'
            ? currentConversation.id
            : undefined;

        let fullContent = '';
        let gsdResult: import('../types/chat').GSDResultData | null = null;

        const resultConversationId = await chatService.sendSimpleChatStream(
          {
            message: content,
            conversation_id: conversationId,
            model: model,
            project_path: options?.projectPath,  // Required for GSD commands
          },
          (event) => {
            // Handle simple chat events (including GSD commands)
            switch (event.type) {
              case 'start':
                setStatusMessage('Thinking...');
                setIsStreaming(true);
                break;
              case 'content':
                fullContent = event.content || '';
                setStreamingContent(fullContent);
                setStatusMessage(null);
                break;
              case 'reasoning':
                // Show reasoning in status (optional)
                break;
              case 'gsd_command_start': {
                // GSD command execution started
                const gsdEvent = event as unknown as { type: string; command: string };
                _log('[SimpleChat] GSD command start:', gsdEvent.command);
                setStatusMessage(`Executing /gsd:${gsdEvent.command}...`);
                break;
              }
              case 'gsd_command_complete': {
                // GSD command execution completed
                const completeEvent = event as unknown as {
                  type: string;
                  success: boolean;
                  command_type: string;
                  message: string;
                  data?: Record<string, unknown>;
                  next_action?: string;
                  requires_followup?: boolean;
                };
                _log('[SimpleChat] GSD command complete:', completeEvent.command_type, completeEvent.success);
                // Store GSD result for message creation
                gsdResult = {
                  success: completeEvent.success,
                  command_type: completeEvent.command_type,
                  message: completeEvent.message,
                  data: completeEvent.data,
                  next_action: completeEvent.next_action,
                  requires_followup: completeEvent.requires_followup,
                };
                fullContent = completeEvent.message; // Fallback content
                setStatusMessage(completeEvent.success ? 'Command completed' : 'Command failed');
                break;
              }
              case 'done':
                setStatusMessage(null);
                setStreamingContent(null);
                setIsStreaming(false);
                break;
              case 'error':
                setError(event.message || 'Unknown error');
                setStatusMessage(null);
                setIsStreaming(false);
                break;
            }
          },
          abortControllerRef.current?.signal
        );

        if (resultConversationId) {
          // Simple chat uses in-memory storage, so just update local state
          // Don't try to load from database - it won't be there
          const userMessage = {
            id: `user-${crypto.randomUUID()}`,
            conversation_id: resultConversationId,
            role: 'user' as const,
            content: content,
            created_at: new Date().toISOString(),
          };
          const assistantMessage: import('../types/chat').Message = {
            id: `assistant-${crypto.randomUUID()}`,
            conversation_id: resultConversationId,
            role: 'assistant' as const,
            content: fullContent,
            created_at: new Date().toISOString(),
            gsdResult: gsdResult || undefined, // Include GSD result for proper rendering
          };

          setCurrentConversation(prev => {
            // Remove temp messages and add real ones
            const messagesWithoutTemp = prev?.messages.filter(m => !m.id.startsWith('temp-')) || [];
            return {
              id: resultConversationId,
              title: prev?.title || 'Simple Chat',
              user_id: prev?.user_id || null,
              created_at: prev?.created_at || new Date().toISOString(),
              updated_at: assistantMessage.created_at,
              message_count: messagesWithoutTemp.length + 2,
              messages: [...messagesWithoutTemp, userMessage, assistantMessage],
            };
          });

          // Success - clear the last failed message (only when we got a valid response)
          setLastFailedMessage(null);
        } else {
          // Simple chat request returned null but no error was set - set a generic error
          // This catches cases where the network fails but error callback didn't fire
          setError(prev => prev || 'Failed to send message. Please check your connection.');
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      _error('Send message error:', err);
    } finally {
      setIsSending(false);
      setToolActivities([]);
      setStatusMessage(null);
      setStreamingContent(null);
      setIsStreaming(false);
    }
  }, [currentConversation, loadConversations, useStreaming, handleStreamEvent, handleAgentStreamEvent, isGSDCommand, isPronetheiaCommand]);

  // Update ref so submitQuestionAnswer can call sendMessage
  sendMessageRef.current = sendMessage;

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Retry the last failed message
   * Re-sends the message with the same parameters
   */
  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage) {return;}

    // Clear the current error first
    setError(null);

    // Retry with the same params
    await sendMessage(
      lastFailedMessage.content,
      lastFailedMessage.model,
      lastFailedMessage.options
    );
  }, [lastFailedMessage, sendMessage]);

  // Derived state for retry availability
  const canRetry = !!lastFailedMessage && !isSending;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load conversations on mount and poll for updates every 15 seconds
   * This ensures new Telegram/WhatsApp messages appear without manual refresh
   */
  useEffect(() => {
    loadConversations();

    // Poll for new conversations (for multi-channel support)
    const pollInterval = setInterval(() => {
      loadConversations();
    }, 15000); // 15 seconds

    return () => clearInterval(pollInterval);
  }, [loadConversations]);

  /**
   * Auto-refresh current conversation for channel messages (Telegram/WhatsApp)
   * Polls every 5 seconds when viewing a channel conversation
   */
  useEffect(() => {
    // Only poll for channel conversations (telegram, whatsapp)
    const isChannelConversation = currentConversation?.channel &&
      ['telegram', 'whatsapp'].includes(currentConversation.channel);

    if (!isChannelConversation || !currentConversation?.id) {
      return;
    }

    // Don't poll while sending a message
    if (isSending) {
      return;
    }

    const pollMessages = async () => {
      try {
        const detail = await chatService.getPersistentConversation(currentConversation.id);
        // Only update if message count changed (new messages arrived)
        if (detail.messages.length !== currentConversation.messages.length) {
          _log('[useChat] New channel messages detected, updating conversation');
          setCurrentConversation(detail);
        }
      } catch (err) {
        // Silently ignore polling errors
        console.debug('[useChat] Channel message poll error:', err);
      }
    };

    // Poll every 5 seconds for channel conversations
    const pollInterval = setInterval(pollMessages, 5000);

    return () => clearInterval(pollInterval);
  }, [currentConversation?.id, currentConversation?.channel, currentConversation?.messages.length, isSending]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // State
    conversations,
    currentConversation,
    isLoading,
    isSending,
    error,

    // Streaming state
    toolActivities,
    statusMessage,
    streamingContent,
    useStreaming,
    setUseStreaming,

    // Execution progress (Claude Code-like)
    executionSteps,
    currentPhase,
    isStreaming,

    // Interactive question state (AskUserQuestion tool)
    currentQuestion,
    submitQuestionAnswer,

    // Actions
    loadConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    deleteMultipleConversations,
    renameConversation,
    sendMessage,
    clearError,
    cancelMessage,
    regenerateMessage,

    // Retry support
    retryLastMessage,
    canRetry,
  };
}

export default useChat;
