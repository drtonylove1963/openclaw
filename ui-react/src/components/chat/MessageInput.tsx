/**
 * MessageInput - Claude.ai-like input component
 * Centered input box with inline model selector and slash command autocomplete
 * Supports agent autocomplete when typing '/agent <type>'
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { MessageInputProps, SlashCommand, TaskPhase } from '../../types/chat';
import { ModelSelector } from './ModelSelector';
import { AuthMethodIndicator } from './AuthMethodIndicator';
import { AgentModeToggle } from './AgentModeToggle';
import { AgenticModeToggle } from './AgenticModeToggle';
import { PhaseSelector } from './PhaseSelector';
import { api } from '../../config/api';
import { COLORS } from '../../styles/colors';
import { validateContent, ValidationResult } from '../../security';
import SecurityWarningModal from './SecurityWarningModal';

// Built-in slash commands (always available)
const BUILTIN_COMMANDS: SlashCommand[] = [
  { command: '/agent', usage: '/agent <type> <prompt>', description: 'Execute a specialized AI agent (98 available)', shortcuts: ['/a'] },
  { command: '/tool', usage: '/tool <name> [args]', description: 'Execute an MCP tool', shortcuts: ['/t'] },
  { command: '/search', usage: '/search <query>', description: 'Search the knowledge base and memory system', shortcuts: ['/s'] },
  { command: '/workflow', usage: '/workflow run <id>', description: 'Execute a workflow', shortcuts: ['/wf'] },
  { command: '/generate', usage: '/generate <description>', description: 'Generate a complete application using One-Shot', shortcuts: ['/gen'] },
  { command: '/github', usage: '/github <action> [args]', description: 'Perform GitHub operations', shortcuts: ['/gh'] },
  { command: '/models', usage: '/models [provider]', description: 'List available AI models', shortcuts: ['/m'] },
  { command: '/memory', usage: '/memory <action>', description: 'Memory and RAG operations', shortcuts: ['/mem'] },
  { command: '/voice', usage: '/voice <on|off|set>', description: 'Voice control settings', shortcuts: ['/v'] },
  { command: '/help', usage: '/help [command]', description: 'Show help for all commands or a specific command', shortcuts: ['/h'] },
];

// GSD Pipeline commands (Get Shit Done workflow orchestration) - 29 commands
const GSD_COMMANDS: SlashCommand[] = [
  { command: '/gsd:add-phase', usage: '/gsd:add-phase', description: 'Add phase to end of current milestone in roadmap', shortcuts: [] },
  { command: '/gsd:add-todo', usage: '/gsd:add-todo', description: 'Capture idea or task as todo from current conversation context', shortcuts: [] },
  { command: '/gsd:audit-milestone', usage: '/gsd:audit-milestone', description: 'Audit milestone completion against original intent before archiving', shortcuts: [] },
  { command: '/gsd:check-todos', usage: '/gsd:check-todos', description: 'List pending todos and select one to work on', shortcuts: [] },
  { command: '/gsd:complete-milestone', usage: '/gsd:complete-milestone', description: 'Archive completed milestone and prepare for next version', shortcuts: [] },
  { command: '/gsd:create-roadmap', usage: '/gsd:create-roadmap', description: 'Create roadmap with phases for the project', shortcuts: [] },
  { command: '/gsd:debug', usage: '/gsd:debug <issue>', description: 'Systematic debugging with persistent state across context resets', shortcuts: [] },
  { command: '/gsd:define-requirements', usage: '/gsd:define-requirements', description: 'Define what "done" looks like with checkable requirements', shortcuts: [] },
  { command: '/gsd:discuss-milestone', usage: '/gsd:discuss-milestone', description: 'Gather context for next milestone through adaptive questioning', shortcuts: [] },
  { command: '/gsd:discuss-phase', usage: '/gsd:discuss-phase', description: 'Gather phase context through adaptive questioning before planning', shortcuts: [] },
  { command: '/gsd:execute-phase', usage: '/gsd:execute-phase <phase-id>', description: 'Execute all plans in a phase with wave-based parallelization', shortcuts: [] },
  { command: '/gsd:execute-plan', usage: '/gsd:execute-plan', description: 'Execute a PLAN.md file', shortcuts: [] },
  { command: '/gsd:help', usage: '/gsd:help', description: 'Show available GSD commands and usage guide', shortcuts: [] },
  { command: '/gsd:insert-phase', usage: '/gsd:insert-phase', description: 'Insert urgent work as decimal phase (e.g., 72.1) between existing phases', shortcuts: [] },
  { command: '/gsd:list-phase-assumptions', usage: '/gsd:list-phase-assumptions', description: 'Surface Claude assumptions about a phase approach before planning', shortcuts: [] },
  { command: '/gsd:map-codebase', usage: '/gsd:map-codebase', description: 'Analyze codebase with parallel mapper agents', shortcuts: [] },
  { command: '/gsd:new-milestone', usage: '/gsd:new-milestone', description: 'Start a new milestone cycle and route to requirements', shortcuts: [] },
  { command: '/gsd:new-project', usage: '/gsd:new-project', description: 'Initialize a new project with deep context gathering and PROJECT.md', shortcuts: [] },
  { command: '/gsd:pause-work', usage: '/gsd:pause-work', description: 'Create context handoff when pausing work mid-phase', shortcuts: [] },
  { command: '/gsd:plan-milestone-gaps', usage: '/gsd:plan-milestone-gaps', description: 'Create phases to close all gaps identified by milestone audit', shortcuts: [] },
  { command: '/gsd:plan-phase', usage: '/gsd:plan-phase <phase-id>', description: 'Create detailed execution plan for a phase (PLAN.md)', shortcuts: [] },
  { command: '/gsd:progress', usage: '/gsd:progress', description: 'Check project progress, show context, and route to next action', shortcuts: [] },
  { command: '/gsd:remove-phase', usage: '/gsd:remove-phase', description: 'Remove a future phase from roadmap and renumber subsequent phases', shortcuts: [] },
  { command: '/gsd:research-phase', usage: '/gsd:research-phase <phase-id>', description: 'Research how to implement a phase before planning', shortcuts: [] },
  { command: '/gsd:research-project', usage: '/gsd:research-project', description: 'Research domain ecosystem before creating roadmap', shortcuts: [] },
  { command: '/gsd:resume-work', usage: '/gsd:resume-work', description: 'Resume work from previous session with full context restoration', shortcuts: [] },
  { command: '/gsd:update', usage: '/gsd:update', description: 'Update GSD to latest version with changelog display', shortcuts: [] },
  { command: '/gsd:verify-work', usage: '/gsd:verify-work', description: 'Validate built features through conversational UAT', shortcuts: [] },
  { command: '/gsd:whats-new', usage: '/gsd:whats-new', description: 'See what is new in GSD since your installed version', shortcuts: [] },
];

// Pronetheia commands (67 commands from .claude/commands/)
const PRONETHEIA_COMMANDS: SlashCommand[] = [
  { command: '/p-10-10-10', usage: '/p-10-10-10', description: 'Evaluate decisions across three time horizons', shortcuts: [] },
  { command: '/p-5-whys', usage: '/p-5-whys', description: 'Drill to root cause by asking why repeatedly', shortcuts: [] },
  { command: '/p-add-to-todos', usage: '/p-add-to-todos', description: 'Add todo item to TO-DOS.md with context from conversation', shortcuts: [] },
  { command: '/p-agents', usage: '/p-agents', description: 'List and search all 98 available Claude Code agents', shortcuts: [] },
  { command: '/p-arena', usage: '/p-arena', description: 'Parallel Development Arena - multi-track code generation', shortcuts: [] },
  { command: '/p-arena-status', usage: '/p-arena-status', description: 'View status of all active Parallel Development Arenas', shortcuts: [] },
  { command: '/p-audit-skill', usage: '/p-audit-skill', description: 'Audit skill for YAML compliance and best practices', shortcuts: [] },
  { command: '/p-audit-slash-command', usage: '/p-audit-slash-command', description: 'Audit slash command file for YAML and content quality', shortcuts: [] },
  { command: '/p-audit-subagent', usage: '/p-audit-subagent', description: 'Audit subagent configuration for best practices', shortcuts: [] },
  { command: '/p-ba', usage: '/p-ba', description: 'Business Analyst with Ex Nihilo methodology', shortcuts: [] },
  { command: '/p-breakdown', usage: '/p-breakdown', description: 'Task decomposition without execution', shortcuts: [] },
  { command: '/p-check-todos', usage: '/p-check-todos', description: 'List outstanding todos and select one to work on', shortcuts: [] },
  { command: '/p-checkpoint', usage: '/p-checkpoint', description: 'Create checkpoint and push to GitHub', shortcuts: [] },
  { command: '/p-cleanup', usage: '/p-cleanup', description: 'Clean up temporary and unnecessary files', shortcuts: [] },
  { command: '/p-create-agent-skill', usage: '/p-create-agent-skill', description: 'Create or edit Claude Code skills with expert guidance', shortcuts: [] },
  { command: '/p-create-hook', usage: '/p-create-hook', description: 'Expert guidance on Claude Code hook development', shortcuts: [] },
  { command: '/p-create-meta-prompt', usage: '/p-create-meta-prompt', description: 'Create optimized prompts for Claude-to-Claude pipelines', shortcuts: [] },
  { command: '/p-create-plan', usage: '/p-create-plan', description: 'Create hierarchical project plans for solo agentic development', shortcuts: [] },
  { command: '/p-create-prompt', usage: '/p-create-prompt', description: 'Create a new prompt that another Claude can execute', shortcuts: [] },
  { command: '/p-create-slash-command', usage: '/p-create-slash-command', description: 'Create a new slash command following best practices', shortcuts: [] },
  { command: '/p-create-subagent', usage: '/p-create-subagent', description: 'Create specialized Claude Code subagents with expert guidance', shortcuts: [] },
  { command: '/p-debug', usage: '/p-debug', description: 'Apply expert debugging methodology to investigate an issue', shortcuts: [] },
  { command: '/p-docs', usage: '/p-docs', description: 'Quick documentation generation', shortcuts: [] },
  { command: '/p-eisenhower-matrix', usage: '/p-eisenhower-matrix', description: 'Apply Eisenhower matrix to prioritize tasks or decisions', shortcuts: [] },
  { command: '/p-feature', usage: '/p-feature', description: 'Execute full Ex Nihilo feature workflow', shortcuts: [] },
  { command: '/p-files', usage: '/p-files', description: 'File system operations', shortcuts: [] },
  { command: '/p-first-principles', usage: '/p-first-principles', description: 'Break down to fundamentals and rebuild from base truths', shortcuts: [] },
  { command: '/p-handoff', usage: '/p-handoff', description: 'Generate handoff documentation for next session', shortcuts: [] },
  { command: '/p-heal-skill', usage: '/p-heal-skill', description: 'Heal skill documentation by applying corrections', shortcuts: [] },
  { command: '/p-help', usage: '/p-help', description: 'Show Pronetheia slash command help', shortcuts: [] },
  { command: '/p-init', usage: '/p-init', description: 'Initialize Pronetheia-OS into an application', shortcuts: [] },
  { command: '/p-inversion', usage: '/p-inversion', description: 'Solve problems backwards - what would guarantee failure?', shortcuts: [] },
  { command: '/p-new', usage: '/p-new', description: 'Start a new project with Intent Capture Agent', shortcuts: [] },
  { command: '/p-next-phase', usage: '/p-next-phase', description: 'Execute next phase workflow', shortcuts: [] },
  { command: '/p-occams-razor', usage: '/p-occams-razor', description: 'Find simplest explanation that fits all the facts', shortcuts: [] },
  { command: '/p-one-thing', usage: '/p-one-thing', description: 'Identify the single highest-leverage action', shortcuts: [] },
  { command: '/p-oneshot', usage: '/p-oneshot', description: 'One Shot Technology - complete app generation in one execution', shortcuts: [] },
  { command: '/p-opportunity-cost', usage: '/p-opportunity-cost', description: 'Analyze what you give up by choosing this option', shortcuts: [] },
  { command: '/p-orchestrate', usage: '/p-orchestrate', description: 'Unified multi-agent orchestration workflow', shortcuts: [] },
  { command: '/p-pareto', usage: '/p-pareto', description: 'Apply Pareto principle (80/20 rule) to analyze arguments', shortcuts: [] },
  { command: '/p-plan', usage: '/p-plan', description: 'Multi-agent task planning with orchestrator', shortcuts: [] },
  { command: '/p-plugin', usage: '/p-plugin', description: 'Plugin management system', shortcuts: [] },
  { command: '/p-processes', usage: '/p-processes', description: 'Monitor background processes', shortcuts: [] },
  { command: '/p-prompt', usage: '/p-prompt', description: 'Prompt Engineer for prompt optimization', shortcuts: [] },
  { command: '/p-reflect', usage: '/p-reflect', description: 'Reflect on session corrections and update CLAUDE.md', shortcuts: [] },
  { command: '/p-requirements', usage: '/p-requirements', description: 'Strategic requirements gathering using Intent Capture Agent', shortcuts: [] },
  { command: '/p-restore', usage: '/p-restore', description: 'Restore project state from a checkpoint', shortcuts: [] },
  { command: '/p-review', usage: '/p-review', description: 'Quick code review', shortcuts: [] },
  { command: '/p-run-plan', usage: '/p-run-plan', description: 'Execute a PLAN.md file directly', shortcuts: [] },
  { command: '/p-run-prompt', usage: '/p-run-prompt', description: 'Delegate prompts to fresh sub-task contexts', shortcuts: [] },
  { command: '/p-second-order', usage: '/p-second-order', description: 'Think through consequences of consequences', shortcuts: [] },
  { command: '/p-security', usage: '/p-security', description: 'Security scanning and vulnerability testing', shortcuts: [] },
  { command: '/p-skip-reflect', usage: '/p-skip-reflect', description: 'Discard all queued learnings without applying', shortcuts: [] },
  { command: '/p-spec', usage: '/p-spec', description: 'View or edit the current TaskSpec generated by Intent Capture', shortcuts: [] },
  { command: '/p-stack', usage: '/p-stack', description: 'Interactive technology stack builder for new applications', shortcuts: [] },
  { command: '/p-status', usage: '/p-status', description: 'Show comprehensive Pronetheia system status', shortcuts: [] },
  { command: '/p-swot', usage: '/p-swot', description: 'Map strengths, weaknesses, opportunities, and threats', shortcuts: [] },
  { command: '/p-test', usage: '/p-test', description: 'Quick testing with QA agent', shortcuts: [] },
  { command: '/p-validate', usage: '/p-validate', description: 'Run comprehensive project validation', shortcuts: [] },
  { command: '/p-via-negativa', usage: '/p-via-negativa', description: 'Improve by removing rather than adding', shortcuts: [] },
  { command: '/p-view-queue', usage: '/p-view-queue', description: 'View pending learnings without processing them', shortcuts: [] },
  { command: '/p-voice', usage: '/p-voice', description: 'Voice service management', shortcuts: [] },
  { command: '/p-whats-next', usage: '/p-whats-next', description: 'Analyze conversation and create handoff document', shortcuts: [] },
];

// Agent type for autocomplete
interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  model: string;
  tools?: string[];
  tool_count?: number;
}

// Extended props for agent mode support
interface ExtendedMessageInputProps extends MessageInputProps {
  promptHistory?: string[];
  agentModeEnabled?: boolean;
  onAgentModeChange?: (enabled: boolean) => void;
  // Agentic mode - true iterative tool loop (like Claude Code)
  agenticModeEnabled?: boolean;
  onAgenticModeChange?: (enabled: boolean) => void;
  selectedPhase?: TaskPhase;
  onPhaseChange?: (phase: TaskPhase) => void;
  // Cancel support
  onCancel?: () => void;
  canCancel?: boolean;
  // Resizable height support
  inputHeight?: number;
  // Current project - Agent Mode requires a project to be loaded
  currentProject?: { id: string; name: string } | null;
}

export function MessageInput({
  onSend,
  isDisabled = false,
  placeholder = 'How can I help you today?',
  selectedModel,
  onModelChange,
  promptHistory = [],
  agentModeEnabled = false,
  onAgentModeChange,
  agenticModeEnabled = true,  // Default ON for Claude Code-like behavior
  onAgenticModeChange,
  selectedPhase = 'auto',
  onPhaseChange,
  onCancel,
  canCancel = false,
  inputHeight,
  currentProject = null,
}: ExtendedMessageInputProps) {
  const [content, setContent] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentAutocomplete, setShowAgentAutocomplete] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [agentDetails, setAgentDetails] = useState<Record<string, any>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Prompt history navigation state
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState(''); // Save current input when navigating history

  // Security validation state
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityValidation, setSecurityValidation] = useState<ValidationResult | null>(null);

  // All slash commands: built-in + GSD + Pronetheia (102 commands total)
  const SLASH_COMMANDS = useMemo(() => {
    return [...BUILTIN_COMMANDS, ...GSD_COMMANDS, ...PRONETHEIA_COMMANDS];
  }, []);

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(`${api.agents}`);
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      }
    };

    fetchAgents();
  }, []);

  // Check if we're typing an agent type (after "/agent ")
  const agentMatch = content.match(/^\/agent\s+(\S*)$/i);
  const agentSearchTerm = agentMatch ? agentMatch[1].toLowerCase() : '';

  // Filter agents based on search term - show ALL agents (no limit)
  const filteredAgents = useMemo(() => {
    if (!agentMatch) {return [];}
    if (!agentSearchTerm) {return agents;} // Show all agents
    return agents.filter(agent =>
      agent.id.toLowerCase().includes(agentSearchTerm) ||
      agent.name.toLowerCase().includes(agentSearchTerm) ||
      agent.category.toLowerCase().includes(agentSearchTerm)
    );
  }, [agents, agentMatch, agentSearchTerm]);

  // Fetch agent details for expanded view
  const fetchAgentDetails = useCallback(async (agentId: string) => {
    if (agentDetails[agentId]) {return;} // Already fetched
    try {
      const response = await fetch(`${api.agents}/${agentId}`);
      const data = await response.json();
      setAgentDetails(prev => ({ ...prev, [agentId]: data }));
    } catch (err) {
      console.error('Failed to fetch agent details:', err);
    }
  }, [agentDetails]);

  // Toggle agent details
  const toggleAgentDetails = useCallback((e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null);
    } else {
      setExpandedAgentId(agentId);
      fetchAgentDetails(agentId);
    }
  }, [expandedAgentId, fetchAgentDetails]);

  // Filter commands based on input
  const filteredCommands = useMemo(() => {
    if (!content.startsWith('/')) {return [];}
    if (agentMatch) {return [];} // Don't show commands when typing agent
    const input = content.toLowerCase();
    return SLASH_COMMANDS.filter(cmd => {
      // Match main command or shortcuts
      const matchesCommand = cmd.command.toLowerCase().startsWith(input);
      const matchesShortcut = cmd.shortcuts.some(s => s.toLowerCase().startsWith(input));
      return matchesCommand || matchesShortcut;
    });
  }, [content, agentMatch]);

  // Show autocomplete when typing a slash command or agent
  useEffect(() => {
    const shouldShowCommands = content.startsWith('/') &&
                               !content.includes(' ') &&
                               filteredCommands.length > 0;
    const shouldShowAgents = agentMatch && filteredAgents.length > 0;

    setShowAutocomplete(shouldShowCommands);
    setShowAgentAutocomplete(shouldShowAgents || false);

    if (shouldShowCommands || shouldShowAgents) {
      setSelectedIndex(0);
    }
  }, [content, filteredCommands.length, filteredAgents.length, agentMatch]);

  // Auto-resize textarea (minimum 4 lines = 90px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 90; // 4 lines minimum
      const maxHeight = 200;
      textarea.style.height = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight)) + 'px';
    }
  }, [content]);

  // Reset history index when user manually edits (not via history navigation)
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    // Reset history navigation when user types
    if (historyIndex >= 0) {
      setHistoryIndex(-1);
      setSavedInput('');
    }
  }, [historyIndex]);

  // Select a command from autocomplete
  const selectCommand = useCallback((command: SlashCommand) => {
    setContent(command.command + ' ');
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  }, []);

  // Select an agent from autocomplete
  const selectAgent = useCallback((agent: Agent) => {
    setContent(`/agent ${agent.id} `);
    setShowAgentAutocomplete(false);
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    if (content.trim() && !isDisabled) {
      // Security validation - check for sensitive data patterns
      const validation = validateContent(content);
      if (validation.hasSensitiveData) {
        setSecurityValidation(validation);
        setShowSecurityWarning(true);
        return; // Don't send until user reviews warning
      }

      // No sensitive data detected, send normally
      onSend(content.trim());
      setContent('');
      setShowAutocomplete(false);
      setHistoryIndex(-1); // Reset history navigation
      setSavedInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [content, isDisabled, onSend]);

  // Security modal callbacks
  const handleSecurityWarningClose = useCallback(() => {
    setShowSecurityWarning(false);
    setSecurityValidation(null);
  }, []);

  const handleSecurityWarningProceed = useCallback(() => {
    // User chose to send anyway (only allowed for warnings, not errors)
    setShowSecurityWarning(false);
    setSecurityValidation(null);
    onSend(content.trim());
    setContent('');
    setShowAutocomplete(false);
    setHistoryIndex(-1);
    setSavedInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, onSend]);

  const handleSecurityWarningEdit = useCallback(() => {
    // User wants to edit their message
    setShowSecurityWarning(false);
    setSecurityValidation(null);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle command autocomplete navigation
    if (showAutocomplete && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        selectCommand(filteredCommands[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    // Handle agent autocomplete navigation
    if (showAgentAutocomplete && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredAgents.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredAgents.length) % filteredAgents.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        selectAgent(filteredAgents[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAgentAutocomplete(false);
        return;
      }
    }

    // Prompt history navigation with up/down arrows (when not in autocomplete mode)
    if (!showAutocomplete && !showAgentAutocomplete && promptHistory.length > 0) {
      if (e.key === 'ArrowUp') {
        // Only navigate history when cursor is at the start or input is empty/single line
        const textarea = textareaRef.current;
        const isAtStart = textarea && (textarea.selectionStart === 0 || !content.includes('\n'));

        if (isAtStart) {
          e.preventDefault();
          if (historyIndex === -1) {
            // Save current input before navigating
            setSavedInput(content);
            setHistoryIndex(0);
            setContent(promptHistory[0]);
          } else if (historyIndex < promptHistory.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setContent(promptHistory[historyIndex + 1]);
          }
          return;
        }
      }

      if (e.key === 'ArrowDown') {
        // Only navigate history when cursor is at the end or input is empty/single line
        const textarea = textareaRef.current;
        const isAtEnd = textarea && (textarea.selectionStart === content.length || !content.includes('\n'));

        if (isAtEnd && historyIndex >= 0) {
          e.preventDefault();
          if (historyIndex === 0) {
            // Return to saved input
            setHistoryIndex(-1);
            setContent(savedInput);
          } else {
            setHistoryIndex(prev => prev - 1);
            setContent(promptHistory[historyIndex - 1]);
          }
          return;
        }
      }
    }

    // Normal enter to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Escape to cancel (when not in autocomplete mode)
    if (e.key === 'Escape' && !showAutocomplete && !showAgentAutocomplete && canCancel && onCancel) {
      e.preventDefault();
      onCancel();
    }
  }, [handleSubmit, showAutocomplete, showAgentAutocomplete, filteredCommands, filteredAgents, selectedIndex, selectCommand, selectAgent, promptHistory, historyIndex, content, savedInput, canCancel, onCancel]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '16px 0 24px',
      position: 'relative',
    },
    inputBox: {
      background: COLORS.bgAlt,
      borderRadius: '24px',
      border: `1px solid ${COLORS.border}`,
      position: 'relative',
    },
    autocompleteDropdown: {
      position: 'absolute',
      bottom: '100%',
      left: '0',
      right: '0',
      marginBottom: '8px',
      background: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
      zIndex: 100,
    },
    autocompleteItem: {
      padding: '12px 16px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      transition: 'background 0.15s',
    },
    autocompleteItemSelected: {
      background: COLORS.bgHover,
    },
    commandName: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    commandText: {
      color: COLORS.accentLight,
      fontWeight: 600,
      fontSize: '14px',
      fontFamily: 'monospace',
    },
    commandShortcut: {
      color: COLORS.textMuted,
      fontSize: '12px',
      fontFamily: 'monospace',
    },
    commandDescription: {
      color: COLORS.textMuted,
      fontSize: '13px',
    },
    commandUsage: {
      color: COLORS.text,
      fontSize: '12px',
      fontFamily: 'monospace',
      opacity: 0.7,
    },
    agentCategory: {
      color: COLORS.accentOrange,
      fontSize: '11px',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    agentModel: {
      color: COLORS.textMuted,
      fontSize: '11px',
      fontFamily: 'monospace',
      background: COLORS.bg,
      padding: '2px 6px',
      borderRadius: '4px',
    },
    autocompleteHeader: {
      padding: '8px 16px',
      borderBottom: `1px solid ${COLORS.border}`,
      color: COLORS.textMuted,
      fontSize: '12px',
      fontWeight: 500,
    },
    autocompleteScroll: {
      maxHeight: '400px',
      overflowY: 'auto' as const,
    },
    agentDetailsButton: {
      padding: '4px 8px',
      background: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '4px',
      color: COLORS.textMuted,
      fontSize: '11px',
      cursor: 'pointer',
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    agentDetailsExpanded: {
      padding: '12px 16px',
      background: COLORS.bg,
      borderTop: `1px solid ${COLORS.border}`,
      fontSize: '12px',
    },
    detailSection: {
      marginBottom: '8px',
    },
    detailLabel: {
      color: COLORS.textMuted,
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '4px',
    },
    toolsList: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '4px',
    },
    toolBadge: {
      background: COLORS.bgHover,
      color: COLORS.text,
      padding: '2px 6px',
      borderRadius: '3px',
      fontSize: '11px',
      fontFamily: 'monospace',
    },
    fullDescription: {
      color: COLORS.text,
      lineHeight: '1.5',
    },
    textareaWrapper: {
      padding: '16px 20px 8px',
    },
    textarea: {
      width: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: COLORS.text,
      fontSize: '15px',
      lineHeight: '1.5',
      resize: 'none',
      minHeight: '90px', // Show 4 lines at all times (4 lines * ~22.5px per line)
      maxHeight: inputHeight ? `${inputHeight}px` : '200px',
      fontFamily: '"Libre Franklin", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    bottomRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px 12px 16px',
    },
    leftControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    rightControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    sendButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: 'none',
      background: content.trim() && !isDisabled ? COLORS.accentOrange : COLORS.border,
      color: content.trim() && !isDisabled ? '#fff' : COLORS.textMuted,
      cursor: content.trim() && !isDisabled ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s',
    },
    cancelButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '8px',
      border: 'none',
      background: COLORS.bgHover,
      color: COLORS.error || '#ef4444',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    cancelHint: {
      color: COLORS.textMuted,
      fontSize: '11px',
      fontFamily: 'monospace',
    },
  };

  return (
    <div style={styles.container} data-testid="message-input-container">
      {/* Slash command autocomplete dropdown */}
      {showAutocomplete && filteredCommands.length > 0 && (
        <div ref={autocompleteRef} style={styles.autocompleteDropdown} data-testid="command-autocomplete">
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.command}
              style={{
                ...styles.autocompleteItem,
                ...(index === selectedIndex ? styles.autocompleteItemSelected : {}),
              }}
              onClick={() => selectCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={styles.commandName}>
                <span style={styles.commandText}>{cmd.command}</span>
                {cmd.shortcuts.length > 0 && (
                  <span style={styles.commandShortcut}>
                    ({cmd.shortcuts.join(', ')})
                  </span>
                )}
              </div>
              <div style={styles.commandDescription}>{cmd.description}</div>
              <div style={styles.commandUsage}>{cmd.usage}</div>
            </div>
          ))}
        </div>
      )}

      {/* Agent autocomplete dropdown */}
      {showAgentAutocomplete && filteredAgents.length > 0 && (
        <div ref={autocompleteRef} style={styles.autocompleteDropdown}>
          <div style={styles.autocompleteHeader}>
            {filteredAgents.length} of {agents.length} agents {agentSearchTerm ? `matching "${agentSearchTerm}"` : '- type to filter'}
          </div>
          <div style={styles.autocompleteScroll}>
            {filteredAgents.map((agent, index) => (
              <div key={agent.id}>
                <div
                  style={{
                    ...styles.autocompleteItem,
                    ...(index === selectedIndex ? styles.autocompleteItemSelected : {}),
                  }}
                  onClick={() => selectAgent(agent)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div style={{ ...styles.commandName, width: '100%' }}>
                    <span style={styles.commandText}>{agent.id}</span>
                    <span style={styles.agentCategory}>{agent.category}</span>
                    <span style={styles.agentModel}>{agent.model}</span>
                    <button
                      style={styles.agentDetailsButton}
                      onClick={(e) => toggleAgentDetails(e, agent.id)}
                      title="Show agent details"
                    >
                      {expandedAgentId === agent.id ? 'Hide' : 'Info'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {expandedAgentId === agent.id
                          ? <path d="M18 15l-6-6-6 6" />
                          : <path d="M6 9l6 6 6-6" />
                        }
                      </svg>
                    </button>
                  </div>
                  <div style={styles.commandDescription}>
                    {expandedAgentId === agent.id
                      ? agent.description
                      : (agent.description.length > 120
                          ? agent.description.slice(0, 120) + '...'
                          : agent.description)
                    }
                  </div>
                </div>
                {/* Expanded agent details */}
                {expandedAgentId === agent.id && (
                  <div style={styles.agentDetailsExpanded}>
                    {agentDetails[agent.id] ? (
                      <>
                        <div style={styles.detailSection}>
                          <div style={styles.detailLabel}>Tools ({agentDetails[agent.id].tools?.length || 0})</div>
                          <div style={styles.toolsList}>
                            {(agentDetails[agent.id].tools || []).map((tool: string) => (
                              <span key={tool} style={styles.toolBadge}>{tool}</span>
                            ))}
                          </div>
                        </div>
                        {agentDetails[agent.id].tags && agentDetails[agent.id].tags.length > 0 && (
                          <div style={styles.detailSection}>
                            <div style={styles.detailLabel}>Tags</div>
                            <div style={styles.toolsList}>
                              {agentDetails[agent.id].tags.map((tag: string) => (
                                <span key={tag} style={{ ...styles.toolBadge, background: COLORS.accent }}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={styles.detailSection}>
                          <div style={styles.detailLabel}>Usage</div>
                          <div style={{ ...styles.commandUsage, color: COLORS.accentLight }}>
                            /agent {agent.id} &lt;your prompt here&gt;
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: COLORS.textMuted }}>Loading details...</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.inputBox}>
        {/* Textarea area */}
        <div style={styles.textareaWrapper}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={4}
            style={styles.textarea}
            data-testid="message-input"
          />
        </div>

        {/* Bottom row with model selector and send button */}
        <div style={styles.bottomRow}>
          <div style={styles.leftControls}>
            {/* Model selector - inline like Claude.ai */}
            {selectedModel && onModelChange && (
              <ModelSelector
                value={selectedModel}
                onChange={onModelChange}
                mode="compact"
              />
            )}
            {/* Auth method indicator - shows subscription/API key status */}
            {selectedModel && (
              <AuthMethodIndicator modelId={selectedModel} />
            )}
            {/* Agentic Mode Toggle - true iterative tool loop (like Claude Code) */}
            {onAgenticModeChange && (
              <AgenticModeToggle
                enabled={agenticModeEnabled}
                onToggle={onAgenticModeChange}
                disabled={isDisabled}
              />
            )}
            {/* Agent Mode Toggle - requires a project to be loaded */}
            {onAgentModeChange && (
              <AgentModeToggle
                enabled={agentModeEnabled}
                onToggle={onAgentModeChange}
                disabled={isDisabled || !currentProject}
                disabledReason={!currentProject ? 'Load a project to enable Agent Mode' : undefined}
              />
            )}
            {/* Phase Selector - only shown when agent mode is enabled */}
            {agentModeEnabled && onPhaseChange && (
              <PhaseSelector
                selectedPhase={selectedPhase}
                onPhaseChange={onPhaseChange}
                disabled={isDisabled}
              />
            )}
          </div>
          <div style={styles.rightControls}>
            {/* Cancel button - shown when streaming */}
            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                style={styles.cancelButton}
                title="Cancel (Esc)"
                data-testid="cancel-button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Cancel
                <span style={styles.cancelHint}>(Esc)</span>
              </button>
            )}
            {/* Send button - hidden when cancel is shown */}
            {!canCancel && (
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isDisabled}
                style={styles.sendButton}
                title="Send message"
                data-testid="send-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security Warning Modal */}
      {securityValidation && (
        <SecurityWarningModal
          isOpen={showSecurityWarning}
          onClose={handleSecurityWarningClose}
          onProceed={handleSecurityWarningProceed}
          onEdit={handleSecurityWarningEdit}
          validation={securityValidation}
          canProceed={securityValidation.errors.length === 0}
        />
      )}
    </div>
  );
}

export default MessageInput;
