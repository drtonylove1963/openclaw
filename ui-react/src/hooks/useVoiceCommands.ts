/**
 * useVoiceCommands - React hook for executing voice commands with user authority
 *
 * Integrates with the avatar system to:
 * - Send voice commands to backend
 * - Execute commands with user's JWT token
 * - Handle GUI actions (navigation, modals, etc.)
 * - Provide feedback through avatar speech
 */

import { useState, useCallback } from 'react';
import { useAvatarStore } from '../stores/avatarStore';
import { apiClient } from '../config/api';

export interface VoiceCommandRequest {
  text: string;
  session_id?: string;
}

export interface VoiceCommandResponse {
  success: boolean;
  message: string;
  intent?: {
    action: string;
    entity?: string;
    parameters: Record<string, any>;
    raw_text: string;
    confidence: number;
  };
  data?: any;
  gui_action?: {
    type: 'navigate' | 'open_modal' | 'update_state' | 'execute_function';
    route?: string;
    modal?: string;
    params?: Record<string, any>;
    state?: any;
    function?: string;
  };
  error?: string;
}

interface UseVoiceCommandsReturn {
  /** Execute a voice command */
  executeCommand: (text: string) => Promise<VoiceCommandResponse>;
  /** Whether a command is currently executing */
  isExecuting: boolean;
  /** Last command result */
  lastResult: VoiceCommandResponse | null;
  /** Last error */
  error: string | null;
}

export function useVoiceCommands(): UseVoiceCommandsReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceCommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get avatar functions for speech feedback
  const { queueSpeech } = useAvatarStore();

  const handleGuiAction = useCallback(async (action: VoiceCommandResponse['gui_action']) => {
    if (!action) {return;}

    console.log('[VoiceCommands] Executing GUI action:', action);

    switch (action.type) {
      case 'navigate':
        if (action.route) {
          // Use window.location for navigation (works outside Router context)
          const params = action.params ? '?' + new URLSearchParams(action.params).toString() : '';
          window.location.href = action.route + params;
        }
        break;

      case 'open_modal':
        if (action.modal) {
          // Trigger modal open event
          const event = new CustomEvent('open-modal', {
            detail: {
              modal: action.modal,
              params: action.params,
            },
          });
          window.dispatchEvent(event);
        }
        break;

      case 'update_state':
        if (action.state) {
          // Update global state or specific component state
          const event = new CustomEvent('update-state', {
            detail: action.state,
          });
          window.dispatchEvent(event);
        }
        break;

      case 'execute_function':
        if (action.function) {
          // Execute a registered function
          const functionName = action.function;
          const registeredFunction = (window as any).voiceFunctions?.[functionName];

          if (registeredFunction && typeof registeredFunction === 'function') {
            await registeredFunction(action.params);
          } else {
            console.warn(`[VoiceCommands] Function not registered: ${functionName}`);
          }
        }
        break;

      default:
        console.warn('[VoiceCommands] Unknown GUI action type:', action.type);
    }
  }, []);

  const executeCommand = useCallback(async (text: string): Promise<VoiceCommandResponse> => {
    setIsExecuting(true);
    setError(null);

    try {
      console.log('[VoiceCommands] Executing:', text);

      // Call backend API to execute command
      const result = await apiClient.post<VoiceCommandResponse>(
        '/api/v1/voice/command',
        { text }
      );

      setLastResult(result);

      console.log('[VoiceCommands] Result:', result);

      // Provide audio feedback
      if (result.message) {
        queueSpeech({
          text: result.message,
          priority: 'high',
        });
      }

      // Execute GUI action if provided
      if (result.gui_action) {
        await handleGuiAction(result.gui_action);
      }

      setIsExecuting(false);
      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Command execution failed';
      console.error('[VoiceCommands] Error:', errorMessage);

      setError(errorMessage);
      setIsExecuting(false);

      // Provide error feedback
      queueSpeech({
        text: `I'm sorry, ${errorMessage}`,
        priority: 'high',
      });

      throw err;
    }
  }, [queueSpeech, handleGuiAction]);

  return {
    executeCommand,
    isExecuting,
    lastResult,
    error,
  };
}

/**
 * Register a function that can be called via voice commands
 *
 * Example:
 *   registerVoiceFunction('refreshDashboard', async () => {
 *     await refetchData();
 *   });
 *
 * Then voice command: "refresh the dashboard" can trigger this function
 */
export function registerVoiceFunction(name: string, fn: (params?: any) => void | Promise<void>) {
  if (typeof window === 'undefined') {return;}

  if (!(window as any).voiceFunctions) {
    (window as any).voiceFunctions = {};
  }

  (window as any).voiceFunctions[name] = fn;
  console.log(`[VoiceCommands] Registered function: ${name}`);
}

/**
 * Unregister a voice function
 */
export function unregisterVoiceFunction(name: string) {
  if (typeof window === 'undefined') {return;}

  if ((window as any).voiceFunctions) {
    delete (window as any).voiceFunctions[name];
    console.log(`[VoiceCommands] Unregistered function: ${name}`);
  }
}

export default useVoiceCommands;
