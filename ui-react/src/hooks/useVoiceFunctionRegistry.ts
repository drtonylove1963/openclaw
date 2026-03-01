/**
 * Voice Function Registry - Registers all voice-callable functions for Athena
 *
 * These functions are called by the backend's UniversalCommandRouter via
 * gui_action: { type: "execute_function", function: "<name>" }
 *
 * Each function receives params from the voice command and executes the action.
 */

import { useEffect, useCallback } from 'react';
import { registerVoiceFunction, unregisterVoiceFunction } from './useVoiceCommands';

interface VoiceFunctionRegistryOptions {
  /** Navigation function */
  navigate: (page: string) => void;
  /** Show toast/notification */
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

/**
 * Hook to register all voice-callable functions
 *
 * This makes Athena able to execute commands like:
 * - "open the demo project" -> calls openProjectInChat
 * - "create new branch called feature/voice" -> calls createBranch
 * - "run tests" -> calls runTests
 * - "show all agents" -> navigates to /agents
 */
export function useVoiceFunctionRegistry(options: VoiceFunctionRegistryOptions) {
  const { navigate, showToast } = options;

  // Helper to dispatch custom events for components that listen
  const dispatchEvent = useCallback((eventName: string, detail?: any) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }, []);

  useEffect(() => {
    // =========================================================================
    // NAVIGATION FUNCTIONS
    // =========================================================================

    // Navigate to dashboard
    registerVoiceFunction('navigateToDashboard', () => {
      navigate('dashboard');
      showToast?.('Navigating to dashboard', 'info');
    });

    // Navigate to chat
    registerVoiceFunction('navigateToChat', (params?: { mode?: string }) => {
      if (params?.mode) {
        localStorage.setItem('pronetheia-chat-mode', params.mode);
      }
      navigate('chat');
    });

    // Navigate to workflows
    registerVoiceFunction('navigateToWorkflows', () => {
      navigate('workflows');
    });

    // Navigate to settings
    registerVoiceFunction('navigateToSettings', () => {
      navigate('settings');
    });

    // Navigate to agents
    registerVoiceFunction('navigateToAgents', () => {
      navigate('agents');
    });

    // Navigate to projects
    registerVoiceFunction('navigateToProjects', () => {
      navigate('projects');
    });

    // =========================================================================
    // PROJECT FUNCTIONS
    // =========================================================================

    // Open project in chat (already registered in App.tsx, but define backup)
    registerVoiceFunction('openProjectInChat', (params?: { project?: any; mode?: string }) => {
      if (!params?.project) {
        console.warn('[VoiceFunction] openProjectInChat: No project provided');
        return;
      }

      const { project, mode } = params;

      // Store project in sessionStorage
      const activeProject = {
        id: project.id,
        name: project.name,
        directory_path: project.directory_path,
        template: project.template || 'blank',
        status: project.status || 'active',
      };
      sessionStorage.setItem('activeProject', JSON.stringify(activeProject));

      // Store mode preference
      if (mode && mode !== 'default') {
        const agentMode = mode === 'agent' || mode === 'llm';
        localStorage.setItem('pronetheia-agent-mode', agentMode ? 'true' : 'false');
      }

      console.log('[VoiceFunction] openProjectInChat:', activeProject.name);
      navigate('chat');
      dispatchEvent('activeProjectChanged');
      showToast?.(`Opening ${project.name}`, 'success');
    });

    // =========================================================================
    // CONVERSATION FUNCTIONS
    // =========================================================================

    // Start new conversation
    registerVoiceFunction('newConversation', () => {
      dispatchEvent('newConversation');
      showToast?.('Starting new conversation', 'info');
    });

    // Clear conversation
    registerVoiceFunction('clearConversation', () => {
      dispatchEvent('clearConversation');
    });

    // =========================================================================
    // GIT FUNCTIONS
    // =========================================================================

    // Open git panel
    registerVoiceFunction('openGitPanel', () => {
      dispatchEvent('openGitPanel');
      navigate('code'); // Git panel is usually in code view
    });

    // Create commit
    registerVoiceFunction('createCommit', (params?: { message?: string }) => {
      dispatchEvent('createCommit', { message: params?.message });
      showToast?.('Opening commit dialog', 'info');
    });

    // Create branch
    registerVoiceFunction('createBranch', (params?: { name?: string }) => {
      dispatchEvent('createBranch', { name: params?.name });
      showToast?.(`Creating branch${params?.name ? `: ${params.name}` : ''}`, 'info');
    });

    // List branches
    registerVoiceFunction('listBranches', () => {
      dispatchEvent('listBranches');
    });

    // Create pull request
    registerVoiceFunction('createPullRequest', (params?: { title?: string }) => {
      dispatchEvent('createPullRequest', params);
      showToast?.('Opening pull request wizard', 'info');
    });

    // =========================================================================
    // CODE/EDITOR FUNCTIONS
    // =========================================================================

    // Search code
    registerVoiceFunction('searchCode', (params?: { query?: string }) => {
      dispatchEvent('searchCode', { query: params?.query });
      navigate('code');
      showToast?.(`Searching: ${params?.query || 'all code'}`, 'info');
    });

    // Create file
    registerVoiceFunction('createFile', (params?: { name?: string; path?: string }) => {
      dispatchEvent('createFile', params);
      navigate('editor');
      showToast?.('Creating new file', 'info');
    });

    // Open file
    registerVoiceFunction('openFile', (params?: { path?: string }) => {
      dispatchEvent('openFile', params);
      navigate('editor');
    });

    // =========================================================================
    // TEST/BUILD FUNCTIONS
    // =========================================================================

    // Run tests
    registerVoiceFunction('runTests', (params?: { file?: string; coverage?: boolean }) => {
      dispatchEvent('runTests', params);
      showToast?.('Running tests...', 'info');
    });

    // Create test
    registerVoiceFunction('createTest', (params?: { for?: string }) => {
      dispatchEvent('createTest', params);
      showToast?.('Creating test file', 'info');
    });

    // Start build
    registerVoiceFunction('startBuild', () => {
      dispatchEvent('startBuild');
      showToast?.('Starting build...', 'info');
    });

    // =========================================================================
    // WORKFLOW FUNCTIONS
    // =========================================================================

    // Run workflow
    registerVoiceFunction('runWorkflow', (params?: { id?: string; name?: string }) => {
      dispatchEvent('runWorkflow', params);
      navigate('workflows');
      showToast?.('Running workflow', 'info');
    });

    // Create workflow
    registerVoiceFunction('createWorkflow', (params?: { name?: string }) => {
      dispatchEvent('createWorkflow', params);
      navigate('workflows');
      showToast?.('Creating new workflow', 'info');
    });

    // =========================================================================
    // AGENT FUNCTIONS
    // =========================================================================

    // Show agents
    registerVoiceFunction('showAgents', () => {
      navigate('agents');
    });

    // Run agent
    registerVoiceFunction('runAgent', (params?: { name?: string; task?: string }) => {
      dispatchEvent('runAgent', params);
      showToast?.(`Running agent: ${params?.name || 'default'}`, 'info');
    });

    // =========================================================================
    // MODEL/LLM FUNCTIONS
    // =========================================================================

    // Show models
    registerVoiceFunction('showModels', () => {
      dispatchEvent('showModels');
      navigate('settings'); // Models are in settings
    });

    // Change model
    registerVoiceFunction('changeModel', (params?: { model?: string }) => {
      dispatchEvent('changeModel', params);
      showToast?.(`Switching to ${params?.model || 'default model'}`, 'info');
    });

    // =========================================================================
    // SPRINT/TASK FUNCTIONS
    // =========================================================================

    // Show sprint board
    registerVoiceFunction('showSprintBoard', () => {
      navigate('sprint');
    });

    // Create task
    registerVoiceFunction('createTask', (params?: { title?: string; description?: string }) => {
      dispatchEvent('createTask', params);
      navigate('sprint');
      showToast?.('Creating task', 'info');
    });

    // =========================================================================
    // DEPLOYMENT FUNCTIONS
    // =========================================================================

    // Deploy
    registerVoiceFunction('deploy', (params?: { environment?: string; project?: string }) => {
      dispatchEvent('deploy', params);
      showToast?.(`Deploying to ${params?.environment || 'production'}`, 'info');
    });

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    // Refresh page data
    registerVoiceFunction('refresh', () => {
      dispatchEvent('refreshData');
      showToast?.('Refreshing...', 'info');
    });

    // Toggle sidebar
    registerVoiceFunction('toggleSidebar', () => {
      dispatchEvent('toggleSidebar');
    });

    // Toggle theme
    registerVoiceFunction('toggleTheme', () => {
      dispatchEvent('toggleTheme');
    });

    // Cleanup on unmount
    return () => {
      // Unregister all functions
      const functions = [
        'navigateToDashboard', 'navigateToChat', 'navigateToWorkflows',
        'navigateToSettings', 'navigateToAgents', 'navigateToProjects',
        'openProjectInChat', 'newConversation', 'clearConversation',
        'openGitPanel', 'createCommit', 'createBranch', 'listBranches', 'createPullRequest',
        'searchCode', 'createFile', 'openFile',
        'runTests', 'createTest', 'startBuild',
        'runWorkflow', 'createWorkflow',
        'showAgents', 'runAgent',
        'showModels', 'changeModel',
        'showSprintBoard', 'createTask',
        'deploy', 'refresh', 'toggleSidebar', 'toggleTheme',
      ];
      functions.forEach(unregisterVoiceFunction);
    };
  }, [navigate, showToast, dispatchEvent]);
}

export default useVoiceFunctionRegistry;
