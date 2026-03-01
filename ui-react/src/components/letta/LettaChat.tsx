/**
 * LettaChat - Main Chat Interface with Three-Panel Layout
 * Uses unified THEME system for consistent styling
 */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { THEME } from '../../styles/theme';
import { LettaLayout, LettaButton } from './LettaLayout';
import { AgentConfigPanel, CustomAgent } from './AgentConfigPanel';
import { MemoryStatePanel } from './MemoryStatePanel';
import { TemplateModal, AgentTemplate } from './TemplateModal';
import { SaveAgentModal, AgentConfig } from './SaveAgentModal';
import { useChat } from '../../hooks/useChat';
import { useAthenaRoute } from '../../hooks/useAthenaRoute';
import { AuthMethodIndicator } from '../chat/AuthMethodIndicator';
import { ExecutionProgress } from '../chat/ExecutionProgress';
import { QuestionPrompt } from '../chat/QuestionPrompt';
import { MessageInput } from '../chat/MessageInput';
import { ErrorDisplay } from '../chat/ErrorDisplay';
import { AthenaRouteDisplay } from '../chat/AthenaRouteDisplay';
import IntentCaptureWizard, { TaskSpec } from '../IntentCaptureWizard';
import { PronetheiaAPI, useModels, Project } from '../../services/pronetheia-api';
import type { TaskPhase, ExecutionStep, ActiveProject } from '../../types/chat';
import { PronetheiaLogo } from '../shared/PronetheiaLogo';
import { PulsingPronetheiaLogo } from '../shared/PulsingPronetheiaLogo';
import { AIAvatar, AvatarToggle, MicButton, HandsFreeMode, useAvatarStore } from '../avatar';
import { useAvatarSpeech } from '../../hooks/useAvatarSpeech';

// Create API instance for fetching models
const api = new PronetheiaAPI();

// Key for storing active project in sessionStorage
const ACTIVE_PROJECT_KEY = 'activeProject';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Simple token estimation (approx 4 chars per token)
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

interface MemoryBlock {
  id: string;
  name: string;
  content: string;
  type: 'core' | 'archival' | 'recall';
  lastUpdated: Date;
}

const DEFAULT_MEMORY_BLOCKS: MemoryBlock[] = [
  {
    id: 'persona',
    name: 'persona',
    content: 'I am Pronetheia, an AI development assistant specialized in software architecture, code generation, and multi-agent orchestration. I use the Ex Nihilo methodology for strategic questioning and one-shot implementation.',
    type: 'core',
    lastUpdated: new Date(),
  },
  {
    id: 'human',
    name: 'human',
    content: 'The user is working with Pronetheia-OS, a multi-agent development platform. They may be building applications, configuring agents, or exploring workflows.',
    type: 'core',
    lastUpdated: new Date(),
  },
];

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MODEL_STORAGE_KEY = 'pronetheia-selected-model';
const AGENT_MODE_STORAGE_KEY = 'pronetheia-agent-mode';
const PHASE_STORAGE_KEY = 'pronetheia-selected-phase';

const getPersistedModel = (): string => {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
};

const getPersistedAgentMode = (): boolean => {
  try {
    return localStorage.getItem(AGENT_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const getPersistedPhase = (): TaskPhase => {
  try {
    const stored = localStorage.getItem(PHASE_STORAGE_KEY);
    return (stored as TaskPhase) || 'auto';
  } catch {
    return 'auto';
  }
};

export function LettaChat() {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Avatar state
  const isAvatarEnabled = useAvatarStore((state) => state.isEnabled);

  // Avatar speech for voice output
  // When responses are > 50 words, extract key points and speak a natural summary
  const { addStreamChunk, flushBuffer, stop: stopSpeech, isSpeaking } = useAvatarSpeech({
    autoSpeak: true,
    bufferSentences: true,
    minBufferLength: 50,
    summarizeLongResponses: true,
    summaryWordThreshold: 50,
  });

  // Track previous streaming content for voice output (declared early for stopSpeech callback)
  const prevStreamingContentRef = useRef<string>('');

  // Stop/interrupt handler for avatar speech
  const handleStopSpeech = useCallback(() => {
    stopSpeech();
    prevStreamingContentRef.current = '';
  }, [stopSpeech]);

  const [selectedModel, setSelectedModel] = useState(getPersistedModel);
  const [agentModeEnabled, setAgentModeEnabled] = useState(getPersistedAgentMode);
  const [selectedPhase, setSelectedPhase] = useState<TaskPhase>(getPersistedPhase);
  const [inputValue, setInputValue] = useState('');
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>(DEFAULT_MEMORY_BLOCKS);

  // Athena orchestration - display routing info for messages
  const [athenaEnabled, setAthenaEnabled] = useState(true);
  const {
    isRouting: athenaIsRouting,
    routeData: athenaRouteData,
    error: athenaError,
    routeMessage: athenaRouteMessage,
    clearRoute: athenaClearRoute,
    isGenerating: athenaIsGenerating,
    generatedSkill: athenaGeneratedSkill,
    generationError: athenaGenerationError,
    autoGenerateEnabled: athenaAutoGenerate,
    setAutoGenerateEnabled: setAthenaAutoGenerate,
  } = useAthenaRoute();
  // Track route data per message (keyed by message content hash for simplicity)
  // Now includes generation state
  const [athenaRouteMap, setAthenaRouteMap] = useState<Map<string, any>>(new Map());

  // Update route map when skill generation completes
  useEffect(() => {
    if (athenaGeneratedSkill && athenaRouteData) {
      // Find the message this relates to and update its entry
      const lastMessage = Array.from(athenaRouteMap.entries()).pop();
      if (lastMessage) {
        setAthenaRouteMap(prev => {
          const newMap = new Map(prev);
          newMap.set(lastMessage[0], {
            ...athenaRouteData,
            generatedSkill: athenaGeneratedSkill,
          });
          return newMap;
        });
      }
    }
  }, [athenaGeneratedSkill, athenaRouteData]);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveAgentModal, setShowSaveAgentModal] = useState(false);
  const [currentAgentName, setCurrentAgentName] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  // Requirements Studio Mode: Only documentation-friendly tools enabled by default
  // Code execution and file operations are handled by Sprint Board (Implementation Hub)
  const [enabledTools, setEnabledTools] = useState<string[]>(['web-search', 'ask-user-question']);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [activeProject, setActiveProject] = useState<ActiveProject | null>(null);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Toast notification state for user feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Discovery phase state for new AI projects
  const [discoveryComplete, setDiscoveryComplete] = useState(false);

  // Load active project from sessionStorage - on mount AND when navigation happens
  useEffect(() => {
    const loadActiveProject = () => {
      try {
        const stored = sessionStorage.getItem(ACTIVE_PROJECT_KEY);
        if (stored) {
          const project = JSON.parse(stored) as ActiveProject;
          setActiveProject(project);

          // Also reload agent mode and phase from localStorage (set by Projects.tsx)
          const agentMode = localStorage.getItem(AGENT_MODE_STORAGE_KEY) === 'true';
          const phase = (localStorage.getItem(PHASE_STORAGE_KEY) as TaskPhase) || 'auto';
          setAgentModeEnabled(agentMode);
          setSelectedPhase(phase);

          // Reset discovery state for new AI projects
          if (project.isNewAiProject) {
            setDiscoveryComplete(false);
          }

          // Update memory blocks to include project context
          setMemoryBlocks(prev => {
            const withoutProject = prev.filter(b => b.id !== 'project');
            return [
              ...withoutProject,
              {
                id: 'project',
                name: 'project',
                content: `Current project: ${project.name}\nDirectory: ${project.directory_path}\nTemplate: ${(project as any).template || 'blank'}\nStatus: ${(project as any).status || 'active'}`,
                type: 'core',
                lastUpdated: new Date(),
              }
            ];
          });
        }
      } catch (err) {
        console.warn('Failed to load active project:', err);
      }
    };

    // Load on mount
    loadActiveProject();

    // Listen for custom event from Projects page (SPA navigation)
    window.addEventListener('activeProjectChanged', loadActiveProject);

    return () => {
      window.removeEventListener('activeProjectChanged', loadActiveProject);
    };
  }, []);

  // Clear active project
  const handleClearProject = useCallback(() => {
    setActiveProject(null);
    setProjectFiles([]);
    sessionStorage.removeItem(ACTIVE_PROJECT_KEY);
    setMemoryBlocks(prev => prev.filter(b => b.id !== 'project'));
  }, []);

  // Function to fetch project files
  const fetchProjectFiles = useCallback(async () => {
    if (!activeProject) {
      setProjectFiles([]);
      return;
    }
    try {
      const API_BASE = import.meta.env.VITE_API_URL ?? '';
      const response = await fetch(`${API_BASE}/api/v1/projects/${activeProject.id}/files`);
      if (response.ok) {
        const files = await response.json();
        // Convert to GeneratedFile format
        const formattedFiles = files.map((f: any, index: number) => ({
          id: `project-file-${index}`,
          path: f.path,
          name: f.name,
          type: getFileType(f.path),
          extension: f.path.split('.').pop() || '',
          size: f.size || 0,
          content: f.content,
          status: 'complete' as const,
          timestamp: new Date(f.created_at),
        }));
        setProjectFiles(formattedFiles);
      }
    } catch (err) {
      console.warn('Failed to fetch project files:', err);
    }
  }, [activeProject]);

  // Fetch project files when activeProject changes
  useEffect(() => {
    fetchProjectFiles();
  }, [activeProject, fetchProjectFiles]);

  // Listen for file changes from tool execution
  useEffect(() => {
    const handleFilesChanged = (event: CustomEvent) => {
      console.log('[LettaChat] Files changed event:', event.detail);
      // Refresh project files if we have an active project
      if (activeProject) {
        fetchProjectFiles();
      }
    };

    window.addEventListener('pronetheia:files-changed', handleFilesChanged as EventListener);
    return () => {
      window.removeEventListener('pronetheia:files-changed', handleFilesChanged as EventListener);
    };
  }, [activeProject, fetchProjectFiles]);

  // Helper to determine file type from path
  function getFileType(path: string): 'code' | 'config' | 'doc' | 'data' | 'other' {
    const ext = path.split('.').pop()?.toLowerCase();
    if (['py', 'js', 'ts', 'tsx', 'jsx', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext || '')) {return 'code';}
    if (['json', 'yaml', 'yml', 'toml', 'ini', 'env', 'gitignore'].includes(ext || '')) {return 'config';}
    if (['md', 'txt', 'rst', 'html'].includes(ext || '')) {return 'doc';}
    if (['csv', 'xml', 'sql'].includes(ext || '')) {return 'data';}
    return 'other';
  }

  const {
    conversations,
    currentConversation,
    isLoading,
    isSending,
    error,
    toolActivities,
    statusMessage,
    streamingContent,
    executionSteps,
    currentPhase,
    isStreaming,
    createConversation,
    selectConversation,
    deleteConversation,
    deleteMultipleConversations,
    sendMessage,
    clearError,
    currentQuestion,
    submitQuestionAnswer,
    retryLastMessage,
    canRetry,
  } = useChat();

  // Check if we should show inline Intent Capture (new AI project in Discovery phase)
  const showInlineIntentCapture = useMemo(() => {
    const hasMessages = (currentConversation?.messages?.length ?? 0) > 0;
    const result = Boolean(
      activeProject?.isNewAiProject &&
      agentModeEnabled &&
      selectedPhase === 'discovery' &&
      !discoveryComplete &&
      !hasMessages
    );
    console.log('[LettaChat] showInlineIntentCapture:', {
      isNewAiProject: activeProject?.isNewAiProject,
      agentModeEnabled,
      selectedPhase,
      discoveryComplete,
      hasMessages,
      result
    });
    return result;
  }, [activeProject, agentModeEnabled, selectedPhase, discoveryComplete, currentConversation]);

  // Handle Intent Capture completion
  const handleIntentCaptureComplete = useCallback((taskSpec: TaskSpec, sessionId: string) => {
    setDiscoveryComplete(true);

    // Store TaskSpec in sessionStorage for later use
    sessionStorage.setItem('currentTaskSpec', JSON.stringify(taskSpec));
    sessionStorage.setItem('intentCaptureSessionId', sessionId);

    // Update project in sessionStorage to clear the newAiProject flag
    if (activeProject) {
      const updatedProject = { ...activeProject, isNewAiProject: false, taskSpec };
      setActiveProject(updatedProject);
      sessionStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(updatedProject));
    }

    // Auto-advance to Planning phase
    setSelectedPhase('planning');
    localStorage.setItem(PHASE_STORAGE_KEY, 'planning');
  }, [activeProject]);

  // Handle Intent Capture cancellation
  const handleIntentCaptureCancel = useCallback(() => {
    // Clear the newAiProject flag
    if (activeProject) {
      const updatedProject = { ...activeProject, isNewAiProject: false };
      setActiveProject(updatedProject);
      sessionStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(updatedProject));
    }
    setDiscoveryComplete(true); // Mark as done so we show normal chat
  }, [activeProject]);

  // Fetch models from API to get accurate context sizes
  const { providers } = useModels(api);

  // Calculate context window state based on conversation
  const contextWindow = useMemo(() => {
    // Look up the model's context size from the API data
    let totalTokens = 200000; // Default fallback

    for (const provider of providers) {
      const model = provider.models.find(m => m.id === selectedModel);
      if (model) {
        totalTokens = model.context;
        break;
      }
    }

    // Estimate system prompt tokens
    const systemPromptText = memoryBlocks.map(b => b.content).join('\n');
    const systemPromptTokens = estimateTokens(systemPromptText) + 500; // Base system prompt

    // Estimate memory tokens
    const memoryTokens = memoryBlocks.reduce((acc, b) => acc + estimateTokens(b.content), 0);

    // Estimate conversation tokens
    const messages = currentConversation?.messages || [];
    const conversationText = messages.map((m: any) => m.content || '').join('\n');
    const conversationTokens = estimateTokens(conversationText);

    // Add streaming content if present
    const streamingTokens = streamingContent ? estimateTokens(streamingContent) : 0;

    const usedTokens = systemPromptTokens + memoryTokens + conversationTokens + streamingTokens;

    return {
      totalTokens,
      usedTokens,
      systemPromptTokens,
      memoryTokens,
      conversationTokens: conversationTokens + streamingTokens,
    };
  }, [selectedModel, memoryBlocks, currentConversation, streamingContent, providers]);

  // Look up the current model's display name from providers
  const currentModelName = useMemo(() => {
    for (const provider of providers) {
      const model = provider.models.find(m => m.id === selectedModel);
      if (model) {
        return model.name;
      }
    }
    // Fallback to parsing the ID if model not found
    return selectedModel.split('-').slice(0, 2).map(
      s => s.charAt(0).toUpperCase() + s.slice(1)
    ).join(' ');
  }, [selectedModel, providers]);

  // Sync selected model when providers load - if current model doesn't exist, select first available
  useEffect(() => {
    if (providers.length === 0) {return;}

    // Check if current model exists in available models
    const modelExists = providers.some(provider =>
      provider.models.some(m => m.id === selectedModel)
    );

    if (!modelExists) {
      // Select first available model
      const firstProvider = providers[0];
      if (firstProvider && firstProvider.models.length > 0) {
        const firstModel = firstProvider.models[0];
        setSelectedModel(firstModel.id);
        localStorage.setItem(MODEL_STORAGE_KEY, firstModel.id);
        console.log(`[LettaChat] Model "${selectedModel}" not available, switched to "${firstModel.id}"`);
      }
    }
  }, [providers, selectedModel]);

  // Handle memory block edits
  const handleMemoryEdit = useCallback((blockId: string, content: string) => {
    setMemoryBlocks(prev => prev.map(block =>
      block.id === blockId
        ? { ...block, content, lastUpdated: new Date() }
        : block
    ));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, streamingContent]);

  // Pipe streaming content to avatar speech for voice output
  useEffect(() => {
    if (!isAvatarEnabled) {return;}

    if (streamingContent && isStreaming) {
      // Calculate new chunk (content added since last update)
      const prevLength = prevStreamingContentRef.current.length;
      const newChunk = streamingContent.slice(prevLength);

      if (newChunk) {
        addStreamChunk(newChunk);
      }
      prevStreamingContentRef.current = streamingContent;
    }

    // When streaming ends, flush any remaining buffered text
    if (!isStreaming && prevStreamingContentRef.current) {
      flushBuffer();
      prevStreamingContentRef.current = '';
    }
  }, [streamingContent, isStreaming, isAvatarEnabled, addStreamChunk, flushBuffer]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, []);

  const handleAgentModeChange = useCallback((enabled: boolean) => {
    // When enabling Agent Mode, check if a project is loaded
    if (enabled) {
      // Check both state and sessionStorage for active project
      const storedProject = sessionStorage.getItem(ACTIVE_PROJECT_KEY);
      const hasActiveProject = activeProject !== null || (storedProject !== null && storedProject !== '');

      if (!hasActiveProject) {
        // Show warning toast and redirect to Projects page
        setToast({
          message: 'A project must be loaded to use Agent Mode. Redirecting to Projects...',
          type: 'warning'
        });

        // Redirect to Projects page after a short delay for user to see the message
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'projects' } }));
        }, 1500);

        // Don't enable agent mode
        return;
      }
    }

    setAgentModeEnabled(enabled);
    localStorage.setItem(AGENT_MODE_STORAGE_KEY, String(enabled));
  }, [activeProject]);

  const handlePhaseChange = useCallback((phase: TaskPhase) => {
    setSelectedPhase(phase);
    localStorage.setItem(PHASE_STORAGE_KEY, phase);
  }, []);

  // Auto-sync phase selector when agent transitions to a new phase
  useEffect(() => {
    console.log('[PhaseSync] currentPhase:', currentPhase, 'selectedPhase:', selectedPhase);
    if (currentPhase && currentPhase !== selectedPhase && currentPhase !== 'auto') {
      // Map agent phase names to TaskPhase values
      const phaseMap: Record<string, TaskPhase> = {
        'discovery': 'discovery',
        'planning': 'planning',
        'implementation': 'implementation',
        'validation': 'validation',
        'refinement': 'refinement',
        'delivery': 'delivery',
      };
      const mappedPhase = phaseMap[currentPhase.toLowerCase()];
      console.log('[PhaseSync] mappedPhase:', mappedPhase);
      if (mappedPhase) {
        console.log('[PhaseSync] Updating selectedPhase to:', mappedPhase);
        setSelectedPhase(mappedPhase);
        localStorage.setItem(PHASE_STORAGE_KEY, mappedPhase);
      }
    }
  }, [currentPhase, selectedPhase]);

  // Handle template selection - apply template settings
  const handleSelectTemplate = useCallback((template: AgentTemplate) => {
    // Apply phase
    setSelectedPhase(template.phase as TaskPhase);
    localStorage.setItem(PHASE_STORAGE_KEY, template.phase);

    // Enable agent mode when using a template
    setAgentModeEnabled(true);
    localStorage.setItem(AGENT_MODE_STORAGE_KEY, 'true');

    // Update memory blocks with template system prompt
    setMemoryBlocks([
      {
        id: 'persona',
        name: 'persona',
        content: template.systemPrompt,
        type: 'core',
        lastUpdated: new Date(),
      },
      {
        id: 'human',
        name: 'human',
        content: `The user is working with the ${template.name} agent template. ${template.description}`,
        type: 'core',
        lastUpdated: new Date(),
      },
    ]);

    // Track current agent name
    setCurrentAgentName(template.name);

    // Close modal
    setShowTemplateModal(false);
  }, []);

  // Handle new agent - reset to defaults
  const handleNewAgent = useCallback(() => {
    setSelectedPhase('auto');
    setAgentModeEnabled(true);
    setMemoryBlocks(DEFAULT_MEMORY_BLOCKS);
    setCurrentAgentName(null);
    setCurrentAgentId(null);
    setSystemPrompt('');
    setTemperature(0.7);
    setEnabledTools(['web-search', 'code-execution', 'file-operations', 'ask-user-question']);
    localStorage.setItem(PHASE_STORAGE_KEY, 'auto');
    localStorage.setItem(AGENT_MODE_STORAGE_KEY, 'true');
  }, []);

  // Fetch custom agents
  const fetchCustomAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/custom-agents?user_id=default`);
      if (response.ok) {
        const data = await response.json();
        setCustomAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to fetch custom agents:', err);
    }
  }, []);

  // Load custom agents on mount
  useEffect(() => {
    fetchCustomAgents();
  }, [fetchCustomAgents]);

  // Memory persistence functions
  const saveMemoryState = useCallback(async (sessionId: string, blocks: MemoryBlock[]) => {
    try {
      const memoryBlocks = blocks.map(b => ({
        id: b.id,
        name: b.name,
        content: b.content,
        type: b.type,
        lastUpdated: b.lastUpdated.toISOString(),
      }));

      await fetch(`${API_BASE}/api/v1/memory/sessions/${sessionId}?user_id=default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: memoryBlocks,
          context: contextWindow,
        }),
      });
    } catch (err) {
      console.error('Failed to save memory state:', err);
    }
  }, [contextWindow]);

  const loadMemoryState = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/memory/sessions/${sessionId}?user_id=default&create_if_missing=true`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.blocks && data.blocks.length > 0) {
          const loadedBlocks: MemoryBlock[] = data.blocks.map((b: any) => ({
            id: b.id,
            name: b.name,
            content: b.content,
            type: b.type as 'core' | 'archival' | 'recall',
            lastUpdated: new Date(b.lastUpdated),
          }));
          setMemoryBlocks(loadedBlocks);
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to load memory state:', err);
    }
    return false;
  }, []);

  // Save memory when blocks change (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const sessionId = currentConversation?.id;
    if (!sessionId) {return;}

    // Debounce save to avoid too many API calls
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveMemoryState(sessionId, memoryBlocks);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [memoryBlocks, currentConversation?.id, saveMemoryState]);

  // Load memory when conversation changes
  useEffect(() => {
    const sessionId = currentConversation?.id;
    if (!sessionId) {return;}

    loadMemoryState(sessionId);
  }, [currentConversation?.id, loadMemoryState]);

  // Handle save agent - called after modal saves
  const handleAgentSaved = useCallback((savedAgent: CustomAgent) => {
    setCustomAgents(prev => {
      const existing = prev.findIndex(a => a.id === savedAgent.id);
      if (existing >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existing] = savedAgent;
        return updated;
      }
      // Add new
      return [savedAgent, ...prev];
    });
    setCurrentAgentId(savedAgent.id);
    setCurrentAgentName(savedAgent.name);
  }, []);

  // Handle load custom agent
  const handleLoadCustomAgent = useCallback((agent: CustomAgent) => {
    setSelectedPhase(agent.phase as TaskPhase);
    setAgentModeEnabled(true);
    setCurrentAgentName(agent.name);
    setCurrentAgentId(agent.id);
    setSystemPrompt(agent.systemPrompt);
    setTemperature(agent.temperature);
    setEnabledTools(agent.tools);

    // Update memory blocks
    setMemoryBlocks([
      {
        id: 'persona',
        name: 'persona',
        content: agent.systemPrompt || 'Custom agent configuration.',
        type: 'core',
        lastUpdated: new Date(),
      },
      {
        id: 'human',
        name: 'human',
        content: `Using ${agent.name}. ${agent.description}`,
        type: 'core',
        lastUpdated: new Date(),
      },
    ]);

    localStorage.setItem(PHASE_STORAGE_KEY, agent.phase);
    localStorage.setItem(AGENT_MODE_STORAGE_KEY, 'true');
  }, []);

  // Handle delete custom agent
  const handleDeleteCustomAgent = useCallback(async (agentId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/custom-agents/${agentId}?user_id=default`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCustomAgents(prev => prev.filter(a => a.id !== agentId));
        if (currentAgentId === agentId) {
          setCurrentAgentId(null);
          setCurrentAgentName(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete custom agent:', err);
    }
  }, [currentAgentId]);

  // Current agent config for save modal
  const currentAgentConfig: AgentConfig = useMemo(() => ({
    name: currentAgentName || '',
    description: '',
    icon: 'robot',
    color: '#8B5CF6',
    phase: selectedPhase,
    tools: enabledTools,
    systemPrompt: systemPrompt || memoryBlocks.find(b => b.id === 'persona')?.content || '',
    temperature: temperature,
    maxTokens: null,
    model: selectedModel,
  }), [currentAgentName, selectedPhase, enabledTools, systemPrompt, memoryBlocks, temperature, selectedModel]);

  const handleSendMessage = useCallback(async (directMessage?: string) => {
    const message = directMessage?.trim() || inputValue.trim();
    if (!message || isSending) {return;}

    setInputValue('');

    // Athena routing (non-blocking, runs in parallel)
    if (athenaEnabled && !message.startsWith('/p-')) {
      athenaRouteMessage(message).then(routeResult => {
        if (routeResult) {
          // Store route data keyed by message for display
          setAthenaRouteMap(prev => {
            const newMap = new Map(prev);
            newMap.set(message, routeResult);
            return newMap;
          });
        }
      }).catch(err => {
        console.warn('[LettaChat] Athena routing failed:', err);
      });
    }

    try {
      if (!currentConversation) {
        await createConversation();
      }
      // Read fresh from sessionStorage to catch navigation updates
      let projectId = activeProject?.id;
      let projectPath = activeProject?.directory_path;
      try {
        const stored = sessionStorage.getItem(ACTIVE_PROJECT_KEY);
        if (stored) {
          const project = JSON.parse(stored);
          projectId = project?.id;
          projectPath = project?.directory_path;
          // DEBUG: Log stored project details
          console.log('[LettaChat] Stored project from sessionStorage:', {
            id: project?.id,
            name: project?.name,
            directory_path: project?.directory_path,
            keys: Object.keys(project || {}),
          });
          if (project?.id !== activeProject?.id) {
            setActiveProject(project);
          }
        }
      } catch (e) {
        // Use existing state if parse fails
        console.warn('[LettaChat] Failed to parse stored project:', e);
      }

      // DEBUG: Log final values being passed to sendMessage
      console.log('[LettaChat] Sending message with:', { projectId, projectPath, model: selectedModel });

      await sendMessage(message, selectedModel, {
        agentMode: agentModeEnabled,
        phase: selectedPhase,
        projectId,  // Pass project context for agent mode
        projectPath,  // Pass project path for artifact saving
        tools: enabledTools,  // Pass enabled tools for tool use
        workspaceMode: 'requirements_studio',  // Requirements Studio only saves documentation artifacts
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [inputValue, isSending, currentConversation, createConversation, sendMessage, selectedModel, agentModeEnabled, selectedPhase, activeProject, enabledTools, athenaEnabled, athenaRouteMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handler for sending documentation to Sprint Board
  const handleSendToSprintBoard = useCallback(() => {
    // Store conversation context for Sprint Board import
    const importContext = {
      conversationId: currentConversation?.id,
      projectId: activeProject?.id,
      projectName: activeProject?.name,
      messages: currentConversation?.messages || [],
      taskSpec: sessionStorage.getItem('currentTaskSpec'),
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem('sprintBoardImport', JSON.stringify(importContext));

    // Navigate to Sprint Board page
    // The Sprint Board will detect the import context and show a preview modal
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'sprint' } }));
  }, [currentConversation, activeProject]);

  const toolCalls = toolActivities.map((activity, index) => ({
    id: String(index),
    name: activity.tool || 'Unknown',
    status: (activity.status === 'success' ? 'success' :
           activity.status === 'error' ? 'error' :
           activity.status === 'running' ? 'running' : 'pending'),
    input: activity.input ? JSON.stringify(activity.input) : undefined,
    output: (activity as any).output ? String((activity as any).output) : undefined,
    timestamp: new Date(),
  }));

  return (
    <>
    <LettaLayout
      leftPanelCollapsed={leftPanelCollapsed}
      rightPanelCollapsed={rightPanelCollapsed}
      onLeftPanelToggle={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
      onRightPanelToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      leftPanel={
        <AgentConfigPanel
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          agentMode={agentModeEnabled}
          onAgentModeChange={handleAgentModeChange}
          selectedPhase={selectedPhase}
          onPhaseChange={handlePhaseChange}
          collapsed={leftPanelCollapsed}
          onLoadTemplate={() => setShowTemplateModal(true)}
          onNewAgent={handleNewAgent}
          onSaveAgent={() => setShowSaveAgentModal(true)}
          customAgents={customAgents}
          onLoadCustomAgent={handleLoadCustomAgent}
          onDeleteCustomAgent={handleDeleteCustomAgent}
          currentAgentId={currentAgentId}
          enabledTools={enabledTools}
          onToolsChange={setEnabledTools}
          // Requirements Studio Mode - Chat page is for documentation only
          workspaceMode="requirements_studio"
          allowedPhases={['auto', 'discovery', 'planning']}
          restrictedToolCategories={['communication', 'utility']}
        />
      }
      centerPanel={
        <ChatSimulator
          conversation={currentConversation}
          conversations={conversations}
          isLoading={isLoading}
          isSending={isSending}
          error={error}
          streamingContent={streamingContent || ''}
          statusMessage={statusMessage || ''}
          executionSteps={executionSteps}
          currentPhase={currentPhase}
          isStreaming={isStreaming}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSendMessage}
          onKeyDown={handleKeyDown}
          onClearError={clearError}
          canRetry={canRetry}
          onRetry={retryLastMessage}
          onNewChat={createConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onDeleteMultipleConversations={deleteMultipleConversations}
          messagesEndRef={messagesEndRef}
          selectedModel={selectedModel}
          currentModelName={currentModelName}
          agentMode={agentModeEnabled}
          currentAgentName={currentAgentName}
          activeProject={activeProject}
          onClearProject={handleClearProject}
          showInlineIntentCapture={showInlineIntentCapture}
          onIntentCaptureComplete={handleIntentCaptureComplete}
          onIntentCaptureCancel={handleIntentCaptureCancel}
          currentQuestion={currentQuestion}
          onSubmitAnswer={submitQuestionAnswer}
          onSendToSprintBoard={handleSendToSprintBoard}
          athenaEnabled={athenaEnabled}
          onToggleAthena={() => setAthenaEnabled(prev => !prev)}
          athenaRouteMap={athenaRouteMap}
          athenaIsRouting={athenaIsRouting}
          athenaIsGenerating={athenaIsGenerating}
          athenaAutoGenerate={athenaAutoGenerate}
          onToggleAutoGenerate={() => setAthenaAutoGenerate(!athenaAutoGenerate)}
        />
      }
      rightPanel={
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Avatar Toggle - Always visible */}
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${THEME.border}` }}>
            <AvatarToggle showLabel={true} />
          </div>

          {/* AI Avatar Panel - Only when enabled */}
          {isAvatarEnabled && (
            <div style={{ padding: '12px', borderBottom: `1px solid ${THEME.border}` }}>
              <AIAvatar />
              <HandsFreeMode
                onRequestReady={(text) => {
                  setInputValue(text);
                }}
                onAutoSubmit={async (text) => {
                  // Auto-submit directly using sendMessage with the transcript
                  if (!text.trim() || isSending) {return;}
                  try {
                    if (!currentConversation) {
                      await createConversation();
                    }
                    setInputValue(''); // Clear input
                    await sendMessage(text.trim(), selectedModel, {
                      agentMode: agentModeEnabled,
                      phase: selectedPhase,
                      projectId: activeProject?.id,
                      projectPath: activeProject?.directory_path,
                      tools: enabledTools,
                      workspaceMode: 'requirements_studio',  // Requirements Studio only saves documentation artifacts
                    });
                  } catch (err) {
                    console.error('Failed to send voice message:', err);
                  }
                }}
                isProcessing={isSending || isStreaming}
                wakeWord="hey athena"
                avatarName="Athena"
                defaultAutoSubmit={true}
                style={{ padding: '8px 0' }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingTop: '8px' }}>
                <MicButton
                  onSpeechResult={(text) => {
                    setInputValue(text);
                  }}
                  disabled={isSending}
                  size="medium"
                  showPreview={true}
                />
                {/* Stop Speech Button - visible when speaking or streaming */}
                {(isSpeaking || isStreaming) && (
                  <button
                    onClick={handleStopSpeech}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      border: '2px solid #dc2626',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    title="Stop speaking"
                    aria-label="Stop avatar speech"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Memory State Panel */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <MemoryStatePanel
              contextWindow={contextWindow}
              memoryBlocks={memoryBlocks}
              toolCalls={toolCalls}
              files={projectFiles}
              collapsed={rightPanelCollapsed}
              projectId={activeProject?.id}
              conversationId={currentConversation?.id}
              onMemoryEdit={handleMemoryEdit}
            />
          </div>
        </div>
      }
    />

    {/* Template Modal */}
    <TemplateModal
      isOpen={showTemplateModal}
      onClose={() => setShowTemplateModal(false)}
      onSelectTemplate={handleSelectTemplate}
    />

    {/* Save Agent Modal */}
    <SaveAgentModal
      isOpen={showSaveAgentModal}
      onClose={() => setShowSaveAgentModal(false)}
      onSave={handleAgentSaved}
      currentConfig={currentAgentConfig}
      editingAgent={currentAgentId ? customAgents.find(a => a.id === currentAgentId) : null}
    />

    {/* Toast Notification */}
    {toast && (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '14px 20px',
          borderRadius: '8px',
          backgroundColor: toast.type === 'success' ? '#1a3a2a' :
                          toast.type === 'error' ? '#3a1a1a' :
                          toast.type === 'warning' ? '#3a3a1a' : '#1a2a3a',
          border: `1px solid ${
            toast.type === 'success' ? '#22c55e' :
            toast.type === 'error' ? '#ef4444' :
            toast.type === 'warning' ? '#eab308' : '#3b82f6'
          }`,
          color: toast.type === 'success' ? '#4ade80' :
                toast.type === 'error' ? '#f87171' :
                toast.type === 'warning' ? '#fde047' : '#60a5fa',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '400px',
        }}
      >
        <span>
          {toast.type === 'success' ? '✓' :
           toast.type === 'error' ? '✕' :
           toast.type === 'warning' ? '⚠' : 'ℹ'}
        </span>
        <span>{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 0 0 8px',
            fontSize: '16px',
            opacity: 0.7,
          }}
        >
          ×
        </button>
      </div>
    )}
    </>
  );
}

// Chat Simulator Component
interface ChatSimulatorProps {
  conversation: any;
  conversations: any[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  streamingContent: string;
  statusMessage: string;
  executionSteps: ExecutionStep[];
  currentPhase: string | null;
  isStreaming: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: (message?: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClearError: () => void;
  canRetry: boolean;
  onRetry?: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteMultipleConversations: (ids: string[]) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  selectedModel: string;
  currentModelName: string;
  agentMode: boolean;
  currentAgentName: string | null;
  activeProject: ActiveProject | null;
  onClearProject: () => void;
  // Intent Capture props for new AI projects
  showInlineIntentCapture: boolean;
  onIntentCaptureComplete: (taskSpec: TaskSpec, sessionId: string) => void;
  onIntentCaptureCancel: () => void;
  // Interactive question props (AskUserQuestion tool)
  currentQuestion: any | null;
  onSubmitAnswer: ((answer: string, selectedOptions?: string[]) => void) | null;
  // Requirements Studio: Send to Sprint Board
  onSendToSprintBoard?: () => void;
  // Athena orchestration display
  athenaEnabled: boolean;
  onToggleAthena: () => void;
  athenaRouteMap: Map<string, any>;
  athenaIsRouting: boolean;
  athenaIsGenerating: boolean;
  athenaAutoGenerate: boolean;
  onToggleAutoGenerate: () => void;
}

function ChatSimulator({
  conversation,
  conversations,
  isSending,
  error,
  streamingContent,
  statusMessage,
  executionSteps,
  currentPhase,
  isStreaming,
  inputValue,
  onInputChange,
  onSend,
  onKeyDown,
  onClearError,
  canRetry,
  onRetry,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onDeleteMultipleConversations,
  messagesEndRef,
  selectedModel,
  currentModelName,
  agentMode,
  currentAgentName,
  activeProject,
  onClearProject,
  showInlineIntentCapture,
  onIntentCaptureComplete,
  onIntentCaptureCancel,
  currentQuestion,
  onSubmitAnswer,
  onSendToSprintBoard,
  athenaEnabled,
  onToggleAthena,
  athenaRouteMap,
  athenaIsRouting,
  athenaIsGenerating,
  athenaAutoGenerate,
  onToggleAutoGenerate,
}: ChatSimulatorProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle selection for a single conversation
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations.map((c: any) => c.id)));
    }
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  // Handle bulk delete
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {return;}
    setIsDeleting(true);
    try {
      await onDeleteMultipleConversations(Array.from(selectedIds));
      exitSelectionMode();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: THEME.bg }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: THEME.bgElevated,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              color: showHistory ? THEME.text : THEME.textSecondary,
              backgroundColor: showHistory ? THEME.bgHover : 'transparent',
              border: `1px solid ${showHistory ? THEME.borderFocus : THEME.border}`,
              borderRadius: THEME.radius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: `all ${THEME.transition.fast}`,
            }}
          >
            History
          </button>

          <LettaButton variant="primary" size="sm" onClick={() => onNewChat()}>
            New Chat
          </LettaButton>

          {/* Athena Toggle */}
          <button
            onClick={onToggleAthena}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: athenaEnabled ? '#a78bfa' : '#64748b',
              backgroundColor: athenaEnabled ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
              border: `1px solid ${athenaEnabled ? '#a78bfa' : '#334155'}`,
              borderRadius: THEME.radius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title={athenaEnabled ? 'Athena routing visible' : 'Athena routing hidden'}
          >
            🧠 Athena {athenaEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Auto-Generate Toggle - only show when Athena is enabled */}
          {athenaEnabled && (
            <button
              onClick={onToggleAutoGenerate}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                color: athenaAutoGenerate ? '#10b981' : '#64748b',
                backgroundColor: athenaAutoGenerate ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: `1px solid ${athenaAutoGenerate ? '#10b981' : '#334155'}`,
                borderRadius: THEME.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title={athenaAutoGenerate ? 'Auto-generate skills when gaps detected' : 'Manual skill creation only'}
            >
              ✨ Auto-Gen {athenaAutoGenerate ? 'ON' : 'OFF'}
            </button>
          )}

          {/* Send to Sprint Board - only show when there are messages */}
          {onSendToSprintBoard && conversation?.messages?.length > 0 && (
            <button
              onClick={onSendToSprintBoard}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: THEME.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: `all ${THEME.transition.fast}`,
              }}
              title="Send documentation to Sprint Board for implementation"
            >
              <span>📋</span>
              Send to Sprint Board
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Requirements Studio Badge */}
          <span
            style={{
              fontSize: '11px',
              color: '#3b82f6',
              padding: '4px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              borderRadius: THEME.radius.sm,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontWeight: 500,
            }}
          >
            📝 Requirements Studio
          </span>
          <span
            style={{
              fontSize: '11px',
              color: THEME.textMuted,
              padding: '4px 8px',
              backgroundColor: THEME.bgMuted,
              borderRadius: THEME.radius.sm,
              fontFamily: THEME.fontMono,
            }}
          >
            {currentModelName}
          </span>
          <AuthMethodIndicator modelId={selectedModel} />
          {agentMode && (
            <span
              style={{
                fontSize: '11px',
                color: THEME.primary,
                padding: '4px 8px',
                backgroundColor: THEME.primaryMuted,
                borderRadius: THEME.radius.sm,
              }}
            >
              Agent Mode
            </span>
          )}
          {currentAgentName && (
            <span
              style={{
                fontSize: '11px',
                color: THEME.purple,
                padding: '4px 8px',
                backgroundColor: `${THEME.purple}15`,
                borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.purple}30`,
                fontWeight: 500,
              }}
            >
              {currentAgentName}
            </span>
          )}
          {activeProject && (
            <span
              style={{
                fontSize: '11px',
                color: THEME.success,
                padding: '4px 8px',
                backgroundColor: `${THEME.success}15`,
                borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.success}30`,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              [] {activeProject.name}
              <button
                onClick={onClearProject}
                style={{
                  background: 'none',
                  border: 'none',
                  color: THEME.success,
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
                title="Clear project context"
              >
                x
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* History Sidebar */}
        {showHistory && (
          <div
            style={{
              width: '240px',
              borderRight: `1px solid ${THEME.border}`,
              backgroundColor: THEME.bgElevated,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
              {/* Header with Select/Cancel */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                {selectionMode ? (
                  <>
                    {/* Select All checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={toggleSelectAll}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '3px',
                          border: `2px solid ${selectedIds.size === conversations.length && conversations.length > 0 ? THEME.primary : THEME.textMuted}`,
                          background: selectedIds.size === conversations.length && conversations.length > 0 ? THEME.primary : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        {selectedIds.size === conversations.length && conversations.length > 0 && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <span style={{ fontSize: '11px', color: THEME.textMuted }}>
                        {selectedIds.size} selected
                      </span>
                    </div>
                    {/* Delete & Cancel buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={selectedIds.size === 0 || isDeleting}
                        style={{
                          padding: '4px 8px',
                          background: selectedIds.size > 0 ? '#ef4444' : THEME.bgHover,
                          border: 'none',
                          borderRadius: '4px',
                          color: selectedIds.size > 0 ? '#fff' : THEME.textMuted,
                          fontSize: '10px',
                          fontWeight: 500,
                          cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={exitSelectionMode}
                        style={{
                          padding: '4px 8px',
                          background: THEME.bgHover,
                          border: 'none',
                          borderRadius: '4px',
                          color: THEME.textMuted,
                          fontSize: '10px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: THEME.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Recent Chats
                    </span>
                    {conversations.length > 0 && (
                      <button
                        onClick={() => setSelectionMode(true)}
                        style={{
                          padding: '4px 8px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          color: THEME.textMuted,
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        Select
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Delete Confirmation Dialog */}
              {showDeleteConfirm && (
                <div
                  style={{
                    marginBottom: '10px',
                    padding: '10px',
                    background: THEME.bg,
                    borderRadius: THEME.radius.md,
                    border: '1px solid #ef4444',
                  }}
                >
                  <div style={{ fontSize: '12px', color: THEME.text, marginBottom: '10px' }}>
                    Delete {selectedIds.size} chat{selectedIds.size !== 1 ? 's' : ''}?
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      style={{
                        padding: '5px 10px',
                        background: THEME.bgHover,
                        border: 'none',
                        borderRadius: '4px',
                        color: THEME.text,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      style={{
                        padding: '5px 10px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '11px',
                        cursor: 'pointer',
                        opacity: isDeleting ? 0.7 : 1,
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}

              {/* Conversation List */}
              {conversations.map((conv: any) => {
                const isSelected = selectedIds.has(conv.id);
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelection(conv.id);
                      } else {
                        onSelectConversation(conv.id);
                      }
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: THEME.radius.md,
                      marginBottom: '4px',
                      cursor: 'pointer',
                      backgroundColor: isSelected
                        ? `${THEME.primary}22`
                        : conversation?.id === conv.id
                        ? THEME.bgHover
                        : 'transparent',
                      border: isSelected
                        ? `1px solid ${THEME.primary}44`
                        : conversation?.id === conv.id
                        ? `1px solid ${THEME.border}`
                        : '1px solid transparent',
                      transition: `all ${THEME.transition.fast}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    {/* Checkbox in selection mode */}
                    {selectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(conv.id);
                        }}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '3px',
                          border: `2px solid ${isSelected ? THEME.primary : THEME.textMuted}`,
                          background: isSelected ? THEME.primary : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          color: THEME.text,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conv.title || 'New Chat'}
                      </div>
                      <div style={{ fontSize: '11px', color: THEME.textDim, marginTop: '4px' }}>
                        {conv.messages?.length || 0} messages
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {error && (
              <ErrorDisplay
                error={error}
                onRetry={canRetry ? onRetry : undefined}
                onDismiss={onClearError}
                canRetry={canRetry}
              />
            )}

            {/* Empty State - Either Intent Capture for new AI projects or default welcome */}
            {(!conversation || conversation.messages?.length === 0) && !streamingContent && (
              showInlineIntentCapture ? (
                /* Inline Intent Capture for new AI projects in Discovery phase */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: THEME.bgElevated,
                    borderRadius: '12px',
                    border: `1px solid ${THEME.border}`,
                  }}>
                    <h2 style={{ color: THEME.text, margin: '0 0 8px', fontSize: '20px' }}>
                      Discovery Phase
                    </h2>
                    <p style={{ color: THEME.textMuted, margin: 0, fontSize: '14px' }}>
                      Tell us about your project and we'll extract requirements automatically
                    </p>
                  </div>
                  <IntentCaptureWizard
                    onComplete={onIntentCaptureComplete}
                    onCancel={onIntentCaptureCancel}
                    initialIdea={activeProject?.initialIdea || ''}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: THEME.textMuted,
                  }}
                >
                  <div style={{ marginBottom: '16px', opacity: 0.6 }}>
                    <PronetheiaLogo size={64} />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: THEME.text, marginBottom: '8px' }}>
                    Start a conversation
                  </div>
                  <div style={{ fontSize: '14px' }}>Type a message below to begin</div>
                </div>
              )
            )}

            {/* Messages List */}
            {conversation?.messages?.map((msg: any, index: number) => (
              <React.Fragment key={msg.id || index}>
                <MessageBubble role={msg.role} content={msg.content} />
                {/* Athena routing display after user messages */}
                {athenaEnabled && msg.role === 'user' && athenaRouteMap.get(msg.content) && (
                  <AthenaRouteDisplay
                    routeData={athenaRouteMap.get(msg.content)}
                    compact={true}
                    generatedSkill={athenaRouteMap.get(msg.content)?.generatedSkill}
                  />
                )}
              </React.Fragment>
            ))}

            {/* Athena Routing/Generating Indicator */}
            {athenaEnabled && (athenaIsRouting || athenaIsGenerating) && (
              <AthenaRouteDisplay
                routeData={null}
                isLoading={athenaIsRouting}
                isGenerating={athenaIsGenerating}
                compact={true}
              />
            )}

            {/* Execution Progress - Claude Code-like display */}
            {(executionSteps.length > 0 || currentPhase) && (
              <ExecutionProgress
                steps={executionSteps}
                currentPhase={currentPhase || undefined}
                statusMessage={statusMessage}
                isStreaming={isStreaming || isSending}
              />
            )}

            {/* Streaming Content */}
            {streamingContent && <MessageBubble role="assistant" content={streamingContent} isStreaming />}

            {/* Status Message - fallback when no execution steps */}
            {statusMessage && executionSteps.length === 0 && !currentPhase && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  color: THEME.textMuted,
                  fontSize: '13px',
                }}
              >
                <PulsingPronetheiaLogo size={28} />
                <span>{statusMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Question Prompt (when agent asks for input) */}
          {currentQuestion && onSubmitAnswer && (
            <div style={{ padding: '0 16px', marginBottom: '8px' }}>
              <QuestionPrompt
                question={currentQuestion}
                onSubmit={onSubmitAnswer}
                isSubmitting={isSending}
              />
            </div>
          )}

          {/* Input Area with Slash Command Autocomplete */}
          <div
            style={{
              padding: '14px 16px',
              borderTop: `1px solid ${THEME.border}`,
              backgroundColor: THEME.bgElevated,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <MessageInput
              onSend={onSend}
              isDisabled={isSending}
              placeholder="Send a message..."
              selectedModel={selectedModel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced markdown renderer with table support and proper list handling
function renderMarkdown(content: string): string {
  let result = content;

  // Parse markdown tables
  const tableRegex = /\n?\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
  result = result.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
    const rows = bodyRows.trim().split('\n').map((row: string) =>
      row.split('|').map((cell: string) => cell.trim()).filter(Boolean)
    );

    const tableStyle = 'width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;';
    const thStyle = 'padding:8px 12px;background:#1e293b;border:1px solid #334155;text-align:left;font-weight:600;color:#f1f5f9;';
    const tdStyle = 'padding:8px 12px;border:1px solid #334155;color:#cbd5e1;';

    let html = `<table style="${tableStyle}"><thead><tr>`;
    headers.forEach((h: string) => { html += `<th style="${thStyle}">${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach((row: string[]) => {
      html += '<tr>';
      row.forEach((cell: string) => { html += `<td style="${tdStyle}">${cell}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  });

  // Process code blocks first to protect them
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#1e293b;padding:12px;border-radius:6px;overflow-x:auto;margin:8px 0;font-size:13px;"><code>$2</code></pre>');

  // Process headers
  result = result
    .replace(/^#### (.+)$/gm, '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:#60a5fa;">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="margin:14px 0 8px;font-size:15px;font-weight:600;color:#60a5fa;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:16px 0 10px;font-size:17px;font-weight:600;color:#f1f5f9;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:20px 0 12px;font-size:20px;font-weight:700;color:#f1f5f9;">$1</h1>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #1e3a5f;margin:16px 0;"/>');

  // Process numbered lists - preserve original numbers and style consistently
  const listItemStyle = 'margin-bottom:6px;color:#cbd5e1;padding-left:8px;';
  result = result.replace(/^(\d+)\. (.+)$/gm,
    `<div style="${listItemStyle}"><span style="color:#60a5fa;font-weight:500;margin-right:8px;">$1.</span>$2</div>`
  );

  // Process unordered lists - style as indented bullet points
  const bulletStyle = 'margin-bottom:4px;color:#cbd5e1;margin-left:40px;padding-left:20px;position:relative;';
  result = result.replace(/^- (.+)$/gm,
    `<div style="${bulletStyle}"><span style="position:absolute;left:0;color:#60a5fa;">•</span>$1</div>`
  );

  // Process inline elements
  const html = result
    .replace(/`([^`]+)`/g, '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;font-size:12px;color:#60a5fa;">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#f1f5f9;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match: string, text: string, url: string) => {
      // SECURITY: Block javascript: and data: protocols (H-6 fix)
      const safeUrl = /^(https?:\/\/|mailto:|\/)/i.test(url) ? url : '#';
      return `<a href="${safeUrl}" style="color:#3b82f6;text-decoration:none;" target="_blank" rel="noopener noreferrer">${text}</a>`;
    })
    .replace(/\n(?!<)/g, '<br/>');

  // SECURITY: Sanitize HTML to prevent XSS (C-1 fix)
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'strong', 'em', 'a', 'br', 'div', 'span', 'p'],
    ALLOWED_ATTR: ['style', 'href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

// Message Bubble Component
function MessageBubble({
  role,
  content,
  isStreaming = false,
}: {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === 'user';
  const renderedContent = useMemo(() => isUser ? content : renderMarkdown(content), [content, isUser]);

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '14px' }}>
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          backgroundColor: isUser ? THEME.primary : THEME.bgMuted,
          color: isUser ? '#000' : THEME.text,
          border: isUser ? 'none' : `1px solid ${THEME.border}`,
        }}
      >
        {!isUser && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: THEME.purple,
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Pronetheia
            {isStreaming && <span style={{ animation: 'pulse 1.5s infinite' }}>o</span>}
          </div>
        )}
        {isUser ? (
          <div style={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
          </div>
        ) : (
          <div
            style={{ fontSize: '14px', lineHeight: 1.6, wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        )}
      </div>
    </div>
  );
}

export default LettaChat;
