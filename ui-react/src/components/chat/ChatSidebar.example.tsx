/**
 * ChatSidebar Usage Example
 * Demonstrates how to integrate the ChatSidebar component
 *
 * This example shows:
 * - State management for conversations
 * - Handling CRUD operations
 * - Integration with chat API
 */
import React, { useState, useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import type { Conversation } from '../../types/chat';

/**
 * Example integration component
 */
export function ChatSidebarExample() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Replace with actual API call
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      // Create new conversation
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New conversation' }),
      });
      const newConv = await response.json();

      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id);
    // Load conversation messages here
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));

      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleDeleteMultipleConversations = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' })));
      setConversations(prev => prev.filter(c => !ids.includes(c.id)));

      if (currentConversationId && ids.includes(currentConversationId)) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversations:', error);
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      await fetch(`/api/chat/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, title } : c))
      );
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onDeleteMultipleConversations={handleDeleteMultipleConversations}
        onDeleteAllConversations={async () => { setConversations([]); }}
        onRenameConversation={handleRenameConversation}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div style={{ flex: 1, padding: '20px' }}>
        {currentConversationId ? (
          <div>Chat content for conversation {currentConversationId}</div>
        ) : (
          <div>Select a conversation or start a new chat</div>
        )}
      </div>
    </div>
  );
}

export default ChatSidebarExample;
