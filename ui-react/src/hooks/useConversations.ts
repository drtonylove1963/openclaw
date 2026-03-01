/**
 * useConversations - Hook for conversation list management
 * Includes date-based grouping for sidebar display
 *
 * Usage:
 *   const {
 *     conversations,
 *     groupedConversations,
 *     isLoading,
 *     fetchConversations,
 *     createConversation,
 *   } = useConversations();
 */
import { useState, useCallback, useMemo } from 'react';
import { chatService } from '../services/chatService';
import type {
  Conversation,
  GroupedConversations,
  UseConversationsReturn,
} from '../types/chat';

/**
 * Groups conversations by date for sidebar organization
 * Categorizes conversations into: today, yesterday, previous week, and older
 */
function groupConversationsByDate(conversations: Conversation[]): GroupedConversations {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: GroupedConversations = {
    today: [],
    yesterday: [],
    previousWeek: [],
    older: [],
  };

  conversations.forEach(conv => {
    // Use updated_at for sorting, fall back to created_at
    const convDate = new Date(conv.updated_at || conv.created_at);

    if (convDate >= today) {
      groups.today.push(conv);
    } else if (convDate >= yesterday) {
      groups.yesterday.push(conv);
    } else if (convDate >= weekAgo) {
      groups.previousWeek.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

export function useConversations(): UseConversationsReturn {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized grouped conversations
  // Recomputes only when conversations array changes
  const groupedConversations = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations]
  );

  // ============================================================================
  // API OPERATIONS
  // ============================================================================

  /**
   * Fetch all conversations from the API
   * Loads the complete list and updates state
   */
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await chatService.listConversations();
      setConversations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      console.error('Fetch conversations error:', err);
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
    try {
      const conversation = await chatService.createConversation({ title });

      // Add to beginning of list (most recent first)
      setConversations(prev => [conversation, ...prev]);

      return conversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Create conversation error:', err);
      throw err;
    }
  }, []);

  /**
   * Update conversation metadata (currently title)
   * @param id - Conversation ID
   * @param title - New title
   * @returns Updated conversation
   */
  const updateConversation = useCallback(async (id: string, title: string): Promise<Conversation> => {
    setError(null);
    try {
      const updated = await chatService.updateConversation(id, { title });

      // Update in local state
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, title } : c
      ));

      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation';
      setError(errorMessage);
      console.error('Update conversation error:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a conversation
   * @param id - Conversation ID to delete
   */
  const deleteConversation = useCallback(async (id: string) => {
    setError(null);
    try {
      await chatService.deleteConversation(id);

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      console.error('Delete conversation error:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // State
    conversations,
    groupedConversations,
    isLoading,
    error,

    // Actions
    fetchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
  };
}

export default useConversations;
