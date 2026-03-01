/**
 * Shared SSE (Server-Sent Events) stream parser.
 * Eliminates duplicated SSE parsing logic across chatService methods.
 */
import { SSE_MAX_BUFFER_SIZE } from '../constants/chat';

/** Maximum SSE buffer size to prevent client-side DoS (L-5 fix) */
const MAX_BUFFER_SIZE = SSE_MAX_BUFFER_SIZE;

/** Valid SSE event types for schema validation (M-6 fix) */
const VALID_EVENT_TYPES = new Set([
  'start', 'content', 'content_chunk', 'reasoning', 'done', 'error',
  'thinking', 'phase_start', 'phase_complete', 'skill_invoked',
  'tool_start', 'tool_result', 'status', 'ask_question',
  'learning_detected', 'gsd_command_start', 'gsd_command_complete',
  'artifact_saved', 'artifacts_failed', 'artifact_error', 'saving_artifacts',
  'artifacts_saved', 'intent_analysis', 'intent_update',
  'files_changed', 'sprint_import', 'sprint_import_start', 'sprint_import_complete',
  'sprint_import_failed', 'sprint_import_error',
  'awaiting_answer', 'gsd_followup', 'gsd_command_progress', 'gsd_handoff',
  'pronetheia_command', 'project_files_changed',
  'athena_routing_start', 'athena_routing_complete', 'athena_routing_fallback',
  'athena_gap_detected', 'memory_saved', 'ums_memory',
  'pronetheia_command_start', 'pronetheia_command_complete', 'pronetheia_command_progress',
  'gsd_llm_followup_start',
]);

/**
 * Parse an SSE stream from a fetch Response, calling onEvent for each parsed event.
 */
export async function parseSSEStream<T>(
  response: Response,
  onEvent: (event: T) => void,
  options?: {
    onYield?: string[];
  }
): Promise<void> {
  if (!response.body) {
    throw new Error('No response body');
  }

  const yieldToMain = (): Promise<void> => {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  };

  const yieldTypes = new Set(options?.onYield ?? ['content_chunk', 'content']);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {break;}

    buffer += decoder.decode(value, { stream: true });

    // SECURITY: Prevent unbounded buffer growth (L-5 fix)
    if (buffer.length > MAX_BUFFER_SIZE) {
      reader.cancel();
      throw new Error('SSE stream exceeded maximum buffer size');
    }

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const eventData = JSON.parse(line.slice(6));

          // SECURITY: Validate event type (M-6 fix)
          if (eventData && typeof eventData === 'object' && typeof eventData.type === 'string') {
            if (!VALID_EVENT_TYPES.has(eventData.type)) {
              if (import.meta.env.DEV) {
                console.warn('[SSE] Unknown event type:', eventData.type);
              }
              continue; // Skip unknown event types
            }
          }

          onEvent(eventData as T);

          // Yield to browser for smooth rendering on content events
          if (yieldTypes.has(eventData.type)) {
            await yieldToMain();
          }
        } catch {
          if (import.meta.env.DEV) {
            console.warn('[SSE] Invalid JSON:', line.slice(6, 200));
          }
        }
      }
    }
  }
}
