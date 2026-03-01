/**
 * useAthenaRoute - Hook for Athena task routing with auto-generation
 *
 * Calls the Athena routing API to get skill/agent matching for messages.
 * When gaps are detected, automatically triggers skill generation.
 */
import { useState, useCallback } from 'react';
import { routeTask, resolveGap, RouteResponse, Skill } from '../services/athena-api';

interface AthenaRouteState {
  isRouting: boolean;
  routeData: RouteResponse | null;
  error: string | null;
  lastMessage: string | null;
  // Auto-generation state
  isGenerating: boolean;
  generatedSkill: Skill | null;
  generationError: string | null;
}

interface UseAthenaRouteReturn extends AthenaRouteState {
  routeMessage: (message: string, autoGenerate?: boolean) => Promise<RouteResponse | null>;
  clearRoute: () => void;
  autoGenerateEnabled: boolean;
  setAutoGenerateEnabled: (enabled: boolean) => void;
}

const AUTO_GENERATE_KEY = 'athena-auto-generate';

export function useAthenaRoute(): UseAthenaRouteReturn {
  const [autoGenerateEnabled, setAutoGenerateEnabledState] = useState(() => {
    try {
      return localStorage.getItem(AUTO_GENERATE_KEY) !== 'false'; // Default to true
    } catch {
      return true;
    }
  });

  const setAutoGenerateEnabled = useCallback((enabled: boolean) => {
    setAutoGenerateEnabledState(enabled);
    try {
      localStorage.setItem(AUTO_GENERATE_KEY, String(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const [state, setState] = useState<AthenaRouteState>({
    isRouting: false,
    routeData: null,
    error: null,
    lastMessage: null,
    isGenerating: false,
    generatedSkill: null,
    generationError: null,
  });

  const routeMessage = useCallback(async (
    message: string,
    autoGenerate?: boolean
  ): Promise<RouteResponse | null> => {
    // Skip routing for very short messages or commands
    if (!message || message.length < 5) {
      return null;
    }

    // Skip routing for /p-* commands (they have dedicated routing)
    if (message.trim().startsWith('/p-')) {
      setState(prev => ({
        ...prev,
        routeData: null,
        error: null,
        lastMessage: message,
        generatedSkill: null,
        generationError: null,
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isRouting: true,
      error: null,
      lastMessage: message,
      generatedSkill: null,
      generationError: null,
    }));

    try {
      const result = await routeTask(message);

      setState(prev => ({
        ...prev,
        isRouting: false,
        routeData: result,
        error: null,
      }));

      // Auto-generate skill if gap detected and auto-generation is enabled
      const shouldAutoGenerate = autoGenerate ?? autoGenerateEnabled;
      if (result.gap_detected && result.gap_id && shouldAutoGenerate) {
        console.log('[useAthenaRoute] Gap detected, auto-generating skill for gap:', result.gap_id);

        setState(prev => ({ ...prev, isGenerating: true }));

        try {
          const newSkill = await resolveGap(result.gap_id, undefined, true);
          console.log('[useAthenaRoute] Skill generated:', newSkill.name);

          setState(prev => ({
            ...prev,
            isGenerating: false,
            generatedSkill: newSkill,
            // Update routeData to reflect the new skill
            routeData: prev.routeData ? {
              ...prev.routeData,
              gap_detected: false,
              matched_skills: [
                {
                  skill_id: newSkill.id,
                  skill_name: newSkill.name,
                  skill_slug: newSkill.slug,
                  score: 1.0,
                  match_reasons: ['auto-generated'],
                },
                ...prev.routeData.matched_skills,
              ],
            } : prev.routeData,
          }));
        } catch (genErr) {
          const genErrMsg = genErr instanceof Error ? genErr.message : 'Skill generation failed';
          console.error('[useAthenaRoute] Skill generation failed:', genErrMsg);
          setState(prev => ({
            ...prev,
            isGenerating: false,
            generationError: genErrMsg,
          }));
        }
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Athena routing failed';
      console.warn('[useAthenaRoute] Routing failed:', errorMsg);
      setState(prev => ({
        ...prev,
        isRouting: false,
        routeData: null,
        error: errorMsg,
      }));
      return null;
    }
  }, [autoGenerateEnabled]);

  const clearRoute = useCallback(() => {
    setState({
      isRouting: false,
      routeData: null,
      error: null,
      lastMessage: null,
      isGenerating: false,
      generatedSkill: null,
      generationError: null,
    });
  }, []);

  return {
    ...state,
    routeMessage,
    clearRoute,
    autoGenerateEnabled,
    setAutoGenerateEnabled,
  };
}

export default useAthenaRoute;
