/**
 * UMS Integration for Athena Gateway
 * 
 * Hooks into chat to:
 * 1. Search memories before LLM call (inject context)
 * 2. Store interactions after LLM call (build memory)
 */

const UMS_BASE = 'http://192.168.1.120:8000/api/v1/mnemo';
const GATEWAY_SECRET = '01c1b66797fa9f84e794ed313bb5d1aa4b0add96e216723725b8c88b8e6c57eb';

interface Memory {
  id: string;
  content: string;
  memory_type: string;
  importance: number;
  created_at: string;
}

interface SearchResult {
  memories: Memory[];
  total: number;
}

/**
 * Search UMS for relevant memories
 */
export async function searchMemories(query: string, limit = 5): Promise<Memory[]> {
  try {
    const response = await fetch(`${UMS_BASE}/memories/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Secret': GATEWAY_SECRET,
      },
      body: JSON.stringify({
        query,
        limit,
        min_importance: 0.3,
      }),
    });
    
    if (!response.ok) {
      console.error('[UMS] Search failed:', response.statusText);
      return [];
    }
    
    const result: SearchResult = await response.json();
    return result.memories || [];
  } catch (error) {
    console.error('[UMS] Search error:', error);
    return [];
  }
}

/**
 * Store a new memory in UMS
 */
export async function storeMemory(
  content: string,
  memoryType: 'episodic' | 'semantic' | 'procedural' = 'episodic',
  importance = 0.5,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    const response = await fetch(`${UMS_BASE}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Secret': GATEWAY_SECRET,
      },
      body: JSON.stringify({
        content,
        memory_type: memoryType,
        importance,
        metadata: {
          source: 'athena-gateway',
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      }),
    });
    
    if (!response.ok) {
      console.error('[UMS] Store failed:', response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[UMS] Store error:', error);
    return false;
  }
}

/**
 * Format memories as context for injection
 */
export function formatMemoriesAsContext(memories: Memory[]): string {
  if (memories.length === 0) {return '';}
  
  const lines = memories.map(m => 
    `- [${m.memory_type}] ${m.content}`
  );
  
  return `\n<relevant_memories>\n${lines.join('\n')}\n</relevant_memories>\n`;
}

/**
 * Pre-chat hook: Search and inject memories
 */
export async function preChatHook(userMessage: string): Promise<string> {
  const memories = await searchMemories(userMessage);
  return formatMemoriesAsContext(memories);
}

/**
 * Post-chat hook: Store the interaction
 */
export async function postChatHook(
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  // Store as episodic memory (fire and forget)
  storeMemory(
    `User: ${userMessage.slice(0, 500)}\nAthena: ${assistantResponse.slice(0, 500)}`,
    'episodic',
    0.5,
    { type: 'conversation' }
  ).catch(() => {}); // Non-blocking
}

export default {
  searchMemories,
  storeMemory,
  preChatHook,
  postChatHook,
};
