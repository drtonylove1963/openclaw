/**
 * Chat Example Component
 * Demonstrates how to use the useChat hook in a React component
 *
 * This is a minimal example showing the basic integration pattern.
 * For production use, split into smaller components (Sidebar, MessageList, MessageInput)
 */
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';

export function ChatExample() {
  const {
    conversations,
    currentConversation,
    isLoading,
    isSending,
    error,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    clearError,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');

  // Handle new chat creation
  const handleNewChat = async () => {
    try {
      await createConversation();
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Handle message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) {return;}

    await sendMessage(messageInput);
    setMessageInput('');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            New Chat
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`
                w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors
                ${currentConversation?.id === conv.id ? 'bg-gray-700' : ''}
              `}
            >
              <div className="font-medium truncate">
                {conv.title || 'New Conversation'}
              </div>
              <div className="text-sm text-gray-400">
                {conv.message_count} messages
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Error Display */}
        {error && (
          <div className="bg-red-600 px-4 py-2 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="ml-4 hover:text-gray-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : currentConversation ? (
            currentConversation.messages.map(msg => (
              <div
                key={msg.id}
                className={`
                  max-w-3xl mx-auto p-4 rounded-lg
                  ${msg.role === 'user' ? 'bg-gray-700' : 'bg-gray-800'}
                `}
              >
                <div className="font-semibold mb-2">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400">
              Select a conversation or create a new one
            </div>
          )}

          {isSending && (
            <div className="max-w-3xl mx-auto p-4 rounded-lg bg-gray-800 text-gray-400">
              Sending...
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-700 p-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isSending}
                className="
                  flex-1 px-4 py-3 bg-gray-800 border border-gray-700
                  rounded-lg focus:outline-none focus:border-blue-500
                  disabled:opacity-50
                "
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className="
                  px-6 py-3 bg-blue-600 hover:bg-blue-700
                  rounded-lg transition-colors disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/**
 * Example using useConversations hook separately
 * Useful when you need conversation management without full chat UI
 */
export function ConversationListExample() {
  const {
    groupedConversations,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    deleteConversation,
  } = useConversations();

  const handleRefresh = () => {
    fetchConversations();
  };

  const handleCreate = async () => {
    try {
      await createConversation('New Conversation');
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  if (isLoading) {return <div>Loading...</div>;}
  if (error) {return <div>Error: {error}</div>;}

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          New Conversation
        </button>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Refresh
        </button>
      </div>

      {/* Today */}
      {groupedConversations.today.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Today</h2>
          {groupedConversations.today.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))}
        </div>
      )}

      {/* Yesterday */}
      {groupedConversations.yesterday.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Yesterday</h2>
          {groupedConversations.yesterday.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))}
        </div>
      )}

      {/* Previous Week */}
      {groupedConversations.previousWeek.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Previous 7 Days</h2>
          {groupedConversations.previousWeek.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))}
        </div>
      )}

      {/* Older */}
      {groupedConversations.older.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Older</h2>
          {groupedConversations.older.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  onDelete,
}: {
  conversation: { id: string; title: string | null; message_count: number };
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
      <div>
        <div className="font-medium">{conversation.title || 'Untitled'}</div>
        <div className="text-sm text-gray-600">
          {conversation.message_count} messages
        </div>
      </div>
      <button
        onClick={onDelete}
        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
      >
        Delete
      </button>
    </div>
  );
}

// Don't import useConversations if it's not defined yet
// This is just for demonstration
import { useConversations } from '../hooks/useConversations';

export default ChatExample;
