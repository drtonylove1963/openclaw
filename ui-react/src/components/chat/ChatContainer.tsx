/**
 * ChatContainer - Main chat area with messages and input
 * Claude.ai-like centered layout with stats header bar
 * Supports prompt history navigation with up/down arrows
 * Shows inline Intent Capture for new AI projects in Discovery phase
 * Input area is vertically resizable
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatStatsHeader } from './ChatStatsHeader';
import { ChatStatsPanel } from './ChatStatsPanel';
import { QuestionPrompt } from './QuestionPrompt';
import { ErrorDisplay } from './ErrorDisplay';
import { TeamModeToggle } from './TeamModeToggle';
import { TeamSelector } from './TeamSelector';
import { TeamWorkflowProgress } from './TeamWorkflowProgress';
import { MultiTeamProgress } from './MultiTeamProgress';
import IntentCaptureWizard, { TaskSpec } from '../IntentCaptureWizard';
import type { ChatContainerProps } from '../../types/chat';
import type { SavedTeam, Workflow } from '../../types/agentTeams';
import { COLORS } from '../../styles/colors';
import { useVerticalResizable } from '../../hooks/useVerticalResizable';
import { HorizontalResizeHandle } from '../HorizontalResizeHandle';

export function ChatContainer({
  conversation,
  isLoading,
  isSending,
  error,
  onSendMessage,
  onResendMessage,
  onRegenerateMessage,
  onNewChat,
  onClearError,
  selectedModel,
  onModelChange,
  toolActivities = [],
  statusMessage = null,
  streamingContent = null,
  executionSteps = [],
  currentPhase = null,
  isStreaming = false,
  agentModeEnabled = false,
  onAgentModeChange,
  agenticModeEnabled = true,  // Default ON for Claude Code-like behavior
  onAgenticModeChange,
  selectedPhase = 'auto',
  onPhaseChange,
  currentProject,
  onCancelMessage,
  currentQuestion,
  onSubmitAnswer,
  onRetryMessage,
  canRetry = false,
  teamModeEnabled = false,
  onTeamModeChange,
  savedTeams = [],
  selectedTeamId = null,
  onTeamSelect,
  activeWorkflow = null,
  activeMultiTeamProjectId = null,
  onCloseMultiTeamProject,
}: ChatContainerProps & {
  onCancelMessage?: () => void;
  onRetryMessage?: () => void;
  canRetry?: boolean;
  agenticModeEnabled?: boolean;
  onAgenticModeChange?: (enabled: boolean) => void;
  teamModeEnabled?: boolean;
  onTeamModeChange?: (enabled: boolean) => void;
  savedTeams?: SavedTeam[];
  selectedTeamId?: string | null;
  onTeamSelect?: (teamId: string | null) => void;
  activeWorkflow?: Workflow | null;
  activeMultiTeamProjectId?: string | null;
  onCloseMultiTeamProject?: () => void;
}) {
  // Resizable input area height (increased to accommodate 4-line textarea)
  const {
    height: inputAreaHeight,
    isResizing: isInputResizing,
    handleProps: inputResizeHandleProps,
  } = useVerticalResizable({
    initialHeight: 180, // Increased from 140 to fit 4 lines (90px) + padding + controls
    minHeight: 160,     // Increased min to ensure 4 lines visible
    maxHeight: 400,
    direction: 'top',
    storageKey: 'pronetheia-chat-input-height',
  });

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: COLORS.bg,
    },
    chatArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '800px',
      width: '100%',
      margin: '0 auto',
      height: '100%',
      padding: '0 16px',
    },
    welcome: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
      textAlign: 'center',
    },
    welcomeIcon: {
      width: '48px',
      height: '48px',
      marginBottom: '16px',
      color: COLORS.accentOrange,
    },
    welcomeTitle: {
      fontSize: '28px',
      fontWeight: 400,
      color: COLORS.text,
      margin: '0 0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    welcomeText: {
      fontSize: '15px',
      color: COLORS.textMuted,
      margin: 0,
      maxWidth: '400px',
    },
  };

  // State for stats panel visibility
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  // Debug: Check if currentProject is loaded
  // Using window.__DEBUG to avoid alert spam
  if (currentProject?.isNewAiProject && typeof window !== 'undefined') {
    if (!(window as any).__debugAlertShown) {
      (window as any).__debugAlertShown = true;
      // alert(`DEBUG: isNewAiProject=${currentProject?.isNewAiProject}, agentMode=${agentModeEnabled}, phase=${selectedPhase}`);
    }
  }
  console.warn('[ChatContainer] RENDER - currentProject:', currentProject?.name, 'isNewAiProject:', currentProject?.isNewAiProject);

  // State for Discovery phase - stores TaskSpec after Intent Capture completes
  const [discoveryTaskSpec, setDiscoveryTaskSpec] = useState<TaskSpec | null>(null);
  const [discoveryComplete, setDiscoveryComplete] = useState(false);

  // Check if we should show inline Intent Capture (new AI project in Discovery phase)
  const showInlineIntentCapture = useMemo(() => {
    const result = (
      currentProject?.isNewAiProject &&
      agentModeEnabled &&
      selectedPhase === 'discovery' &&
      !discoveryComplete &&
      !conversation?.messages?.length
    );
    console.warn('[ChatContainer] showInlineIntentCapture check:', {
      isNewAiProject: currentProject?.isNewAiProject,
      agentModeEnabled,
      selectedPhase,
      discoveryComplete,
      hasMessages: conversation?.messages?.length,
      result
    });
    return result;
  }, [currentProject, agentModeEnabled, selectedPhase, discoveryComplete, conversation]);

  // Handle Intent Capture completion
  const handleIntentCaptureComplete = (taskSpec: TaskSpec, sessionId: string) => {
    setDiscoveryTaskSpec(taskSpec);
    setDiscoveryComplete(true);

    // Store TaskSpec in sessionStorage for later use
    sessionStorage.setItem('currentTaskSpec', JSON.stringify(taskSpec));
    sessionStorage.setItem('intentCaptureSessionId', sessionId);

    // Update project in sessionStorage to clear the newAiProject flag
    if (currentProject) {
      const updatedProject = { ...currentProject, isNewAiProject: false, taskSpec };
      sessionStorage.setItem('activeProject', JSON.stringify(updatedProject));
    }

    // Auto-advance to Planning phase
    if (onPhaseChange) {
      onPhaseChange('planning');
    }
  };

  // Handle Intent Capture cancellation
  const handleIntentCaptureCancel = () => {
    // Clear the newAiProject flag
    if (currentProject) {
      const updatedProject = { ...currentProject, isNewAiProject: false };
      sessionStorage.setItem('activeProject', JSON.stringify(updatedProject));
    }
    setDiscoveryComplete(true); // Mark as done so we show normal chat
  };

  // Sparkle/star icon like Claude.ai
  const SparkleIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: COLORS.accentOrange }}>
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  );

  // Extract user prompts for history navigation (most recent first)
  const promptHistory = useMemo(() => {
    if (!conversation?.messages) {return [];}
    return conversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .toReversed(); // Most recent first
  }, [conversation?.messages]);

  return (
    <div style={styles.container}>
      {/* Stats Header Bar */}
      <ChatStatsHeader
        onToggleStats={() => setShowStatsPanel(!showStatsPanel)}
        isStatsOpen={showStatsPanel}
        currentProject={currentProject}
      />

      {/* Team Mode Controls Bar */}
      {agentModeEnabled && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderBottom: `1px solid ${COLORS.border}`,
          backgroundColor: teamModeEnabled ? `${COLORS.purple}08` : 'transparent',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}>
          {onTeamModeChange && (
            <TeamModeToggle
              enabled={teamModeEnabled}
              onToggle={onTeamModeChange}
              disabled={savedTeams.length === 0}
              disabledReason={savedTeams.length === 0 ? 'Create a team on the Agents page first' : undefined}
            />
          )}
          {teamModeEnabled && onTeamSelect && (
            <TeamSelector
              teams={savedTeams}
              selectedTeamId={selectedTeamId ?? null}
              onSelect={onTeamSelect}
              disabled={!teamModeEnabled}
            />
          )}
        </div>
      )}

      {/* Main Chat Area (relative for stats panel overlay) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'visible' }}>
        {/* Stats Panel Overlay */}
        {showStatsPanel && (
          <ChatStatsPanel onClose={() => setShowStatsPanel(false)} />
        )}

        <div style={{ ...styles.chatArea, height: '100%', overflow: 'auto' }}>
          {/* Multi-Team Project Progress */}
          {teamModeEnabled && activeMultiTeamProjectId && (
            <div style={{ padding: '16px 0 0' }}>
              <MultiTeamProgress
                projectId={activeMultiTeamProjectId}
                onClose={onCloseMultiTeamProject}
              />
            </div>
          )}

          {/* Single Team Workflow Progress */}
          {teamModeEnabled && activeWorkflow && !activeMultiTeamProjectId && (
            <div style={{ padding: '16px 0 0' }}>
              <TeamWorkflowProgress
                workflow={activeWorkflow}
                isActive={activeWorkflow.status !== 'completed' && activeWorkflow.status !== 'cancelled'}
              />
            </div>
          )}

          {showInlineIntentCapture ? (
            /* Inline Intent Capture for new AI projects in Discovery phase */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: COLORS.card,
                borderRadius: '12px',
                border: `1px solid ${COLORS.border}`,
              }}>
                <h2 style={{ color: COLORS.text, margin: '0 0 8px', fontSize: '20px' }}>
                  Discovery Phase
                </h2>
                <p style={{ color: COLORS.textMuted, margin: 0, fontSize: '14px' }}>
                  Tell us about your project and we'll extract requirements automatically
                </p>
              </div>
              <IntentCaptureWizard
                onComplete={handleIntentCaptureComplete}
                onCancel={handleIntentCaptureCancel}
                initialIdea={currentProject?.initialIdea || ''}
              />
            </div>
          ) : !conversation && !isSending ? (
            <div style={styles.welcome}>
              <h2 style={styles.welcomeTitle}>
                <SparkleIcon />
                How can I help you today?
              </h2>
            </div>
          ) : (
            <MessageList
              messages={conversation?.messages || []}
              isLoading={isSending}
              toolActivities={toolActivities}
              statusMessage={statusMessage}
              streamingContent={streamingContent}
              executionSteps={executionSteps}
              currentPhase={currentPhase}
              isStreaming={isStreaming}
              onResendMessage={onResendMessage}
              onRegenerateMessage={onRegenerateMessage}
            />
          )}

          {error && (
            <ErrorDisplay
              error={error}
              onRetry={canRetry ? onRetryMessage : undefined}
              onDismiss={onClearError}
              canRetry={canRetry}
            />
          )}

          {/* Interactive Question Prompt (when agent asks for input) */}
          {currentQuestion && onSubmitAnswer && (
            <QuestionPrompt
              question={currentQuestion}
              onSubmit={onSubmitAnswer}
              isSubmitting={isSending}
            />
          )}
        </div>

        {/* Resizable Input Area - OUTSIDE scrollable area for autocomplete to work */}
        <div style={{
          position: 'relative',
          minHeight: `${inputAreaHeight}px`,
          height: `${inputAreaHeight}px`,
          flexShrink: 0,
          transition: isInputResizing ? 'none' : 'height 0.15s ease',
          overflow: 'visible',
        }}>
          {/* Resize Handle */}
          <HorizontalResizeHandle
            isResizing={isInputResizing}
            onMouseDown={inputResizeHandleProps.onMouseDown}
            onTouchStart={inputResizeHandleProps.onTouchStart}
            theme={{
              border: COLORS.border,
              hover: COLORS.textMuted,
              active: COLORS.accent,
            }}
          />
          <MessageInput
            onSend={onSendMessage}
            isDisabled={isSending || isLoading}
            placeholder="How can I help you today?"
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            promptHistory={promptHistory}
            agenticModeEnabled={agenticModeEnabled}
            onAgenticModeChange={onAgenticModeChange}
            agentModeEnabled={agentModeEnabled}
            onAgentModeChange={onAgentModeChange}
            selectedPhase={selectedPhase}
            onPhaseChange={onPhaseChange}
            onCancel={onCancelMessage}
            canCancel={isSending || isStreaming}
            inputHeight={inputAreaHeight - 50}
            currentProject={currentProject}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatContainer;
