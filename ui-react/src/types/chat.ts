/**
 * TypeScript types for Pronetheia Chat Interface
 * Comprehensive type definitions for Claude.ai-like chat functionality
 */

/**
 * Message role types
 * Defines who sent the message in a conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Conversation status
 * Determines visibility and organization of conversations
 */
export type ConversationStatus = 'active' | 'archived';

/**
 * Channel types for multi-channel messaging
 * Identifies the source/destination of a conversation
 */
export type ChannelType = 'web' | 'telegram' | 'whatsapp';

/**
 * Date grouping categories for conversation organization
 * Used to group conversations by recency in the sidebar
 */
export type DateGroup = 'today' | 'yesterday' | 'previousWeek' | 'older';

/**
 * GSD command result data structure
 * Returned by backend when executing /gsd:* commands
 */
export interface GSDResultData {
  success: boolean;
  command_type: string;
  message: string;
  data?: Record<string, unknown>;
  next_action?: string;
  requires_followup?: boolean;
  streaming?: boolean;
  followup_prompt?: string;
}

/**
 * Core Message interface
 * Represents a single message in a conversation
 */
export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  gsdResult?: GSDResultData;  // GSD command result when message is from /gsd:* command
  /** Extra metadata including channel info */
  extra_data?: {
    channel?: ChannelType;
    channel_user_id?: string;
    channel_user_name?: string;
    sent_from?: 'web' | 'telegram' | 'whatsapp';
    [key: string]: unknown;
  };
}

/**
 * Base Conversation interface
 * Minimal conversation metadata
 */
export interface Conversation {
  id: string;
  title: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  /** Source channel: web, telegram, whatsapp, etc. */
  channel?: ChannelType;
  /** External channel's chat/conversation ID (e.g., Telegram chat_id) */
  channel_id?: string | null;
}

/**
 * Extended Conversation with messages
 * Full conversation data including all messages
 */
export interface ConversationDetail extends Conversation {
  messages: Message[];
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Create new conversation request payload
 */
export interface CreateConversationRequest {
  title?: string;
}

/**
 * Update conversation request payload
 * Currently supports title updates
 */
export interface UpdateConversationRequest {
  title: string;
}

/**
 * Create message request payload
 * Used for manually adding messages to a conversation
 */
export interface CreateMessageRequest {
  content: string;
  role?: MessageRole;
}

/**
 * Chat completion request
 * Primary interface for sending messages and receiving AI responses
 */
export interface ChatCompletionRequest {
  message: string;
  conversation_id?: string;
  model?: string;
  project_id?: string;  // Project ID for project-context-aware responses
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Chat completion response
 * Contains both the user message and assistant's response
 */
export interface ChatCompletionResponse {
  conversation_id: string;
  user_message: Message;
  assistant_message: Message;
  message?: Message; // Alias for user_message for backward compatibility
  model?: string;
  tokens_used?: number;
  completion_time_ms?: number;
}

/**
 * Paginated conversation list response
 */
export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Global chat state
 * Main state container for the chat feature
 */
export interface ChatState {
  conversations: Conversation[];
  currentConversation: ConversationDetail | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

/**
 * Message input component state
 */
export interface MessageInputState {
  content: string;
  isSubmitting: boolean;
}

/**
 * Grouped conversations for sidebar display
 * Organizes conversations by recency
 */
export interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  previousWeek: Conversation[];
  older: Conversation[];
}

/**
 * Date group label mapping
 * Human-readable labels for date groups
 */
export interface DateGroupLabel {
  key: DateGroup;
  label: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Main chat hook return type
 * Provides complete chat functionality
 */
export interface UseChatReturn {
  // State
  conversations: Conversation[];
  currentConversation: ConversationDetail | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Actions
  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  sendMessage: (content: string, model?: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Conversations management hook return type
 * Focused on conversation CRUD operations
 */
export interface UseConversationsReturn {
  conversations: Conversation[];
  groupedConversations: GroupedConversations;
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  updateConversation: (id: string, title: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
}

// ============================================================================
// API SERVICE TYPES
// ============================================================================

/**
 * Chat API service interface
 * Defines all API methods for chat functionality
 */
export interface ChatApiService {
  // Conversations
  listConversations: (limit?: number, offset?: number) => Promise<Conversation[]>;
  getConversation: (id: string) => Promise<ConversationDetail>;
  createConversation: (data: CreateConversationRequest) => Promise<Conversation>;
  updateConversation: (id: string, data: UpdateConversationRequest) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;

  // Messages
  addMessage: (conversationId: string, data: CreateMessageRequest) => Promise<Message>;

  // Chat Completion
  sendChatCompletion: (data: ChatCompletionRequest) => Promise<ChatCompletionResponse>;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Chat sidebar component props
 * Main navigation and conversation list
 */
export interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteMultipleConversations: (ids: string[]) => void;
  onDeleteAllConversations: () => Promise<void>;
  onRenameConversation: (id: string, title: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Active project context for chat
 */
export interface ActiveProject {
  id: string;
  name: string;
  slug: string;
  directory_path?: string;  // Project directory path for artifact saving
  isNewAiProject?: boolean;  // Flag for new AI projects that need Discovery phase
  initialIdea?: string;  // Initial project idea/description for Intent Capture
  taskSpec?: unknown;  // TaskSpec from Intent Capture (discovery phase)
}

/**
 * Main chat container props
 * Primary chat interface container
 */
/**
 * Execution step for Claude Code-like progress display
 */
export interface ExecutionStep {
  id: string;
  type: 'thinking' | 'phase' | 'skill' | 'tool' | 'content' | 'handoff';
  title: string;
  details?: string;
  status: 'running' | 'complete' | 'error';
  timestamp: Date;
  metadata?: {
    phase?: string;
    skills?: string[];
    keywords?: string[];
    categories?: string[];
    toolName?: string;
    toolInput?: Record<string, unknown>;
    toolResult?: string;
    question_id?: string;  // For AskUserQuestion tool steps
    gsd_command?: string;  // For GSD command execution steps
    handoff?: {  // For GSD phase transition handoffs
      from_phase: string;
      to_phase: string;
      summary: string;
      key_actions: string[];
      files_modified: string[];
    };
    // Athena orchestration metadata
    athena?: boolean;  // Whether this step is from Athena routing
    stage?: 'routing' | 'gaps';  // Athena routing stage
    gaps?: Array<{ task_type?: string; description?: string }>;  // Detected skill gaps
    // Mnemosyne memory metadata
    mnemosyne?: boolean;  // Whether this step is from Mnemosyne memory capture
    memory_id?: string;  // Mnemosyne memory unit ID
  };
}

export interface ChatContainerProps {
  conversation: ConversationDetail | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onResendMessage?: (content: string) => void;
  onNewChat: () => void;
  onClearError?: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  toolActivities?: ToolActivity[];
  statusMessage?: string | null;
  streamingContent?: string | null;
  // Claude Code-like execution progress
  executionSteps?: ExecutionStep[];
  currentPhase?: string | null;
  isStreaming?: boolean;
  // Agent Mode props
  agentModeEnabled?: boolean;
  onAgentModeChange?: (enabled: boolean) => void;
  selectedPhase?: TaskPhase;
  onPhaseChange?: (phase: TaskPhase) => void;
  // Project context
  currentProject?: ActiveProject | null;
  // Tool selection
  enabledTools?: string[];
  onToolsChange?: (tools: string[]) => void;
  // Interactive question support (AskUserQuestion tool)
  currentQuestion?: CurrentQuestion | null;
  onSubmitAnswer?: (answer: string, selectedOptions?: string[]) => void;
  // Message regeneration support
  onRegenerateMessage?: (messageId: string) => void;
  // Retry support for failed messages
  onRetryMessage?: () => void;
  canRetry?: boolean;
}

/**
 * Message list component props
 * Displays conversation messages
 */
export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onResendMessage?: (content: string) => void;
  onRegenerateMessage?: (messageId: string) => void;
}

/**
 * Individual message item props
 */
export interface MessageItemProps {
  message: Message;
  isLast?: boolean;
  onResend?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
}

/**
 * Message input component props
 * Text input and send functionality with inline model selector
 */
export interface MessageInputProps {
  onSend: (content: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

/**
 * Conversation list item props
 */
export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

// ============================================================================
// STREAMING TYPES (Claude Code-like tool visibility)
// ============================================================================

/**
 * Streaming event types from the backend
 */
export type StreamEventType =
  | 'status'
  | 'tool_selection'
  | 'tool_start'
  | 'tool_result'
  | 'content_chunk'
  | 'final_content'
  | 'done'
  | 'error';

/**
 * Base streaming event
 */
export interface BaseStreamEvent {
  type: StreamEventType;
}

/**
 * Status event - progress updates
 */
export interface StatusEvent extends BaseStreamEvent {
  type: 'status';
  message: string;
}

/**
 * Tool selection event - which tools were chosen
 */
export interface ToolSelectionEvent extends BaseStreamEvent {
  type: 'tool_selection';
  tools: string[];
  method: 'direct' | 'two_phase';
}

/**
 * Tool start event - tool execution beginning
 */
export interface ToolStartEvent extends BaseStreamEvent {
  type: 'tool_start';
  tool: string;
  input: Record<string, unknown>;
}

/**
 * Tool result event - tool execution completed
 */
export interface ToolResultEvent extends BaseStreamEvent {
  type: 'tool_result';
  tool: string;
  result: string;
  success: boolean;
}

/**
 * Content chunk event - streaming text as it's generated
 */
export interface ContentChunkEvent extends BaseStreamEvent {
  type: 'content_chunk';
  chunk: string;
  content: string; // Accumulated content so far
}

/**
 * Final content event - model's text response complete
 */
export interface FinalContentEvent extends BaseStreamEvent {
  type: 'final_content';
  content: string;
  tokens: number;
}

/**
 * Done event - completion with full result
 */
export interface DoneEvent extends BaseStreamEvent {
  type: 'done';
  result: ChatCompletionResponse;
}

/**
 * Error event
 */
export interface ErrorEvent extends BaseStreamEvent {
  type: 'error';
  message: string;
}

/**
 * Union type for all stream events
 */
export type StreamEvent =
  | StatusEvent
  | ToolSelectionEvent
  | ToolStartEvent
  | ToolResultEvent
  | ContentChunkEvent
  | FinalContentEvent
  | DoneEvent
  | ErrorEvent;

/**
 * Tool activity for display
 */
export interface ToolActivity {
  id: string;
  tool: string;
  status: 'running' | 'success' | 'error';
  input?: Record<string, unknown>;
  result?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Streaming message chunk (legacy)
 */
export interface MessageChunk {
  conversation_id: string;
  message_id: string;
  content: string;
  is_final: boolean;
}

/**
 * Streaming status
 */
export type StreamingStatus = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

/**
 * Streaming state with tool activity
 */
export interface StreamingState {
  status: StreamingStatus;
  currentMessage: string;
  error: string | null;
  toolActivities: ToolActivity[];
  statusMessage: string | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Conversation filters
 * For filtering and searching conversations
 */
export interface ConversationFilters {
  status?: ConversationStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Message filters
 * For filtering messages within a conversation
 */
export interface MessageFilters {
  role?: MessageRole;
  search?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: 'created_at' | 'updated_at' | 'title';
  order: 'asc' | 'desc';
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * API error response
 */
export interface ChatApiError {
  status: number;
  message: string;
  details?: Record<string, any>;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// UNIFIED CHAT TYPES (Slash Commands Support)
// ============================================================================

/**
 * Message types for unified chat
 * Determines how the message should be rendered
 */
export type UnifiedMessageType =
  | 'text'
  | 'agent_execution'
  | 'tool_result'
  | 'workflow_execution'
  | 'search_results'
  | 'code_generation'
  | 'help'
  | 'error';

/**
 * Unified message with type information
 */
export interface UnifiedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: UnifiedMessageType;
  conversation_id: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Unified chat request
 * Supports both regular messages and slash commands
 */
export interface UnifiedChatRequest {
  message: string;
  conversation_id?: string;
  model?: string;
  user_id?: string;
}

/**
 * Unified chat response
 */
export interface UnifiedChatResponse {
  conversation_id: string;
  user_message: UnifiedMessage;
  assistant_message: UnifiedMessage;
  message_type: UnifiedMessageType;
  metadata: Record<string, unknown>;
}

/**
 * Slash command information
 */
export interface SlashCommand {
  command: string;
  usage: string;
  description: string;
  shortcuts: string[];
}

/**
 * Agent execution message metadata
 */
export interface AgentExecutionMetadata {
  execution_id: string;
  agent_id: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  output?: string;
}

/**
 * Tool result message metadata
 */
export interface ToolResultMetadata {
  tool_name: string;
  result: unknown;
  duration_ms?: number;
}

/**
 * Workflow execution message metadata
 */
export interface WorkflowExecutionMetadata {
  execution_id: string;
  workflow_id: string;
  status: string;
  current_node?: string;
}

// ============================================================================
// AGENT MODE TYPES (Universal Agent Support)
// ============================================================================

/**
 * Task phases for the Universal Agent pipeline
 */
export type TaskPhase = 'auto' | 'discovery' | 'planning' | 'implementation' | 'validation' | 'refinement' | 'delivery';

/**
 * Agent chat request
 * Sends a message through the Universal Agent with optional phase selection
 */
export interface AgentChatRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
  phase?: TaskPhase;
  skills?: string[];
  model?: string;  // Model ID from selector (e.g., "z-ai/glm-4.6", "anthropic/claude-sonnet-4")
  project_id?: string;  // Project ID for project-context-aware responses
  project_path?: string;  // Project directory path for artifact saving
  save_artifacts?: boolean;  // Whether to auto-save generated artifacts (default: true)
  tools?: string[];  // Enabled tools (e.g., ['web_search', 'code_exec', 'image_gen'])
  workspace_mode?: 'requirements_studio' | 'implementation_hub' | 'development';  // Workspace mode for artifact filtering
}

/**
 * Agent stream event types
 */
export type AgentStreamEventType =
  | 'thinking'
  | 'phase_start'
  | 'phase_complete'
  | 'content_chunk'
  | 'skill_invoked'
  | 'saving_artifacts'
  | 'artifacts_saved'
  | 'artifacts_failed'
  | 'artifact_error'
  | 'sprint_import_start'
  | 'sprint_import_complete'
  | 'sprint_import_failed'
  | 'sprint_import_error'
  | 'athena_routing_start'
  | 'athena_routing_complete'
  | 'athena_routing_fallback'
  | 'athena_gap_detected'
  | 'memory_saved'
  | 'done'
  | 'error';

/**
 * Agent thinking event
 */
export interface AgentThinkingEvent {
  type: 'thinking';
  message: string;
}

/**
 * Agent phase start event
 */
export interface AgentPhaseStartEvent {
  type: 'phase_start';
  phase: string;
  message: string;
}

/**
 * Agent phase complete event
 */
export interface AgentPhaseCompleteEvent {
  type: 'phase_complete';
  phase: string;
  message?: string;
  result?: unknown;
}

/**
 * Agent content chunk event
 */
export interface AgentContentChunkEvent {
  type: 'content_chunk';
  chunk: string;
  content: string;
}

/**
 * Agent skill invoked event
 */
export interface AgentSkillInvokedEvent {
  type: 'skill_invoked';
  skills: string[];
  message?: string;
}

/**
 * Agent done event
 */
export interface AgentDoneEvent {
  type: 'done';
  result: {
    conversation_id: string;
    user_message?: Message | null;
    assistant_message?: Message | null;
    phase: string;
    skills_used: string[];
    completion_time_ms: number;
  };
}

/**
 * Agent error event
 */
export interface AgentErrorEvent {
  type: 'error';
  message: string;
}

/**
 * Sprint Board import start event
 */
export interface SprintImportStartEvent {
  type: 'sprint_import_start';
  message: string;
}

/**
 * Sprint Board import complete event
 */
export interface SprintImportCompleteEvent {
  type: 'sprint_import_complete';
  sprint_id: string;
  sprint_name: string;
  stories_imported: number;
  total_points: number;
  message: string;
}

/**
 * Sprint Board import failed event
 */
export interface SprintImportFailedEvent {
  type: 'sprint_import_failed';
  message: string;
}

/**
 * Sprint Board import error event
 */
export interface SprintImportErrorEvent {
  type: 'sprint_import_error';
  message: string;
}

// ============================================================================
// ASK USER QUESTION TYPES (Interactive Agent Questions)
// ============================================================================

/**
 * Question option for ask_user_question tool
 */
export interface QuestionOption {
  label: string;
  description: string;
}

/**
 * Ask question event - agent needs user input
 */
export interface AskQuestionEvent {
  type: 'ask_question';
  question_id: string;
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect: boolean;
  conversation_id: string;
}

/**
 * Awaiting answer event - agent is waiting for user response
 */
export interface AwaitingAnswerEvent {
  type: 'awaiting_answer';
  message: string;
}

/**
 * Current question state for UI
 */
export interface CurrentQuestion {
  question_id: string;
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect: boolean;
  conversation_id: string;
}

/**
 * Answer submission request
 */
export interface SubmitAnswerRequest {
  conversation_id: string;
  question_id: string;
  answer: string;
  selected_options?: string[];
}

/**
 * Answer submission response
 */
export interface SubmitAnswerResponse {
  success: boolean;
  conversation_id: string;
  question_id: string;
  answer_recorded: string;
  message: string;
  context_addition: string;
}

// ============================================================================
// GSD PIPELINE STREAM EVENTS
// ============================================================================

/**
 * GSD phase start event - indicates a GSD pipeline phase is beginning
 */
export interface GSDPhaseStartEvent {
  type: 'gsd_phase_start';
  phase: string;
  description: string;
}

/**
 * GSD phase complete event - indicates a GSD pipeline phase finished
 */
export interface GSDPhaseCompleteEvent {
  type: 'gsd_phase_complete';
  phase: string;
  result?: unknown;
}

/**
 * GSD handoff event - provides context when transitioning between GSD phases
 */
export interface GSDHandoffEvent {
  type: 'gsd_handoff';
  from_phase: string;
  to_phase: string;
  summary: string;
  key_actions: string[];
  files_modified: string[];
  handoff_id: string;
}

/**
 * GSD command start event - indicates a GSD command is being executed
 */
export interface GSDCommandStartEvent {
  type: 'gsd_command_start';
  command: string;
}

/**
 * GSD command progress event - streaming progress updates for long-running commands
 */
export interface GSDCommandProgressEvent {
  type: 'gsd_command_progress';
  success: boolean;
  command_type: string;
  message: string;
  streaming: boolean;
}

/**
 * GSD command complete event - final result from a GSD command
 */
export interface GSDCommandCompleteEvent {
  type: 'gsd_command_complete';
  success: boolean;
  command_type: string;
  message: string;
  data?: Record<string, unknown>;
  next_action?: string;
  requires_followup?: boolean;
  followup_prompt?: string;
}

/**
 * GSD followup event - command requires LLM continuation
 */
export interface GSDFollowupEvent {
  type: 'gsd_followup';
  prompt: string;
}

/**
 * Athena routing start event - indicates Athena routing has begun
 */
export interface AthenaRoutingStartEvent {
  type: 'athena_routing_start';
  message: string;
}

/**
 * Athena routing complete event - routing succeeded with agent/skills
 */
export interface AthenaRoutingCompleteEvent {
  type: 'athena_routing_complete';
  agent: string | null;
  skills: string[];
  time_ms: number;
}

/**
 * Athena routing fallback event - routing fell back to default
 */
export interface AthenaRoutingFallbackEvent {
  type: 'athena_routing_fallback';
  reason: string;
}

/**
 * Athena gap detected event - skill gaps were identified
 */
export interface AthenaGapDetectedEvent {
  type: 'athena_gap_detected';
  gaps: Array<{
    task_type?: string;
    description?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Memory saved event - conversation stored in Mnemosyne
 */
export interface MemorySavedEvent {
  type: 'memory_saved';
  memory_id: string;
  summary: string;
}

// ============================================================================
// AGENTIC CHAT TYPES (True agentic loop with iterative tool execution)
// ============================================================================

/**
 * Agentic status event
 */
export interface AgenticStatusEvent {
  type: 'status';
  timestamp: string;
  message: string;
}

/**
 * Agentic thinking event
 */
export interface AgenticThinkingEvent {
  type: 'thinking';
  timestamp: string;
  content: string;
}

/**
 * Agentic iteration start event
 */
export interface AgenticIterationStartEvent {
  type: 'iteration_start';
  timestamp: string;
  iteration: number;
  max_iterations: number;
}

/**
 * Agentic iteration end event
 */
export interface AgenticIterationEndEvent {
  type: 'iteration_end';
  timestamp: string;
  iteration: number;
  tool_calls: number;
  continuing: boolean;
}

/**
 * Agentic tool start event
 */
export interface AgenticToolStartEvent {
  type: 'tool_start';
  timestamp: string;
  tool: string;
  tool_call_id: string;
  arguments: Record<string, unknown>;
}

/**
 * Agentic tool progress event
 */
export interface AgenticToolProgressEvent {
  type: 'tool_progress';
  timestamp: string;
  tool: string;
  message: string;
}

/**
 * Agentic tool result event
 */
export interface AgenticToolResultEvent {
  type: 'tool_result';
  timestamp: string;
  tool: string;
  tool_call_id: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration_ms: number;
}

/**
 * Agentic content chunk event
 */
export interface AgenticContentChunkEvent {
  type: 'content_chunk';
  timestamp: string;
  chunk: string;
  content: string;
}

/**
 * Agentic circuit breaker event
 */
export interface AgenticCircuitBreakerEvent {
  type: 'circuit_breaker';
  timestamp: string;
  reason: string;
  iteration?: number;
}

/**
 * Agentic complete event
 */
export interface AgenticCompleteEvent {
  type: 'complete';
  timestamp: string;
  run_id: string;
  iterations: number;
  total_tool_calls: number;
  elapsed_seconds: number;
  success: boolean;
  error?: string;
}

/**
 * Agentic error event
 */
export interface AgenticErrorEvent {
  type: 'error';
  timestamp: string;
  error: string;
}

/**
 * Union type for all agentic stream events
 */
export type AgenticStreamEvent =
  | AgenticStatusEvent
  | AgenticThinkingEvent
  | AgenticIterationStartEvent
  | AgenticIterationEndEvent
  | AgenticToolStartEvent
  | AgenticToolProgressEvent
  | AgenticToolResultEvent
  | AgenticContentChunkEvent
  | AgenticCircuitBreakerEvent
  | AgenticCompleteEvent
  | AgenticErrorEvent;

/**
 * Union type for all agent stream events
 */
export type AgentStreamEvent =
  | AgentThinkingEvent
  | AgentPhaseStartEvent
  | AgentPhaseCompleteEvent
  | AgentContentChunkEvent
  | AgentSkillInvokedEvent
  | AgentDoneEvent
  | AgentErrorEvent
  | SprintImportStartEvent
  | SprintImportCompleteEvent
  | SprintImportFailedEvent
  | SprintImportErrorEvent
  | AskQuestionEvent
  | AwaitingAnswerEvent
  | GSDPhaseStartEvent
  | GSDPhaseCompleteEvent
  | GSDHandoffEvent
  | GSDCommandStartEvent
  | GSDCommandProgressEvent
  | GSDCommandCompleteEvent
  | GSDFollowupEvent
  | AthenaRoutingStartEvent
  | AthenaRoutingCompleteEvent
  | AthenaRoutingFallbackEvent
  | AthenaGapDetectedEvent
  | MemorySavedEvent;
