# Chat Hooks Documentation

## Overview
React hooks for managing chat functionality in Pronetheia. These hooks provide a clean, reusable interface for conversation management and messaging.

## Hooks

### `useChat()`

Main hook for complete chat functionality. Manages conversations, messages, and AI interactions.

**Location:** `frontend/src/hooks/useChat.ts`

#### Return Values

```typescript
interface UseChatReturn {
  // State
  conversations: Conversation[];
  currentConversation: ConversationDetail | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Actions
  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}
```

#### Usage Example

```typescript
import { useChat } from '../hooks/useChat';

function ChatInterface() {
  const {
    conversations,
    currentConversation,
    isLoading,
    isSending,
    error,
    sendMessage,
    createConversation,
    selectConversation,
  } = useChat();

  // Conversations are loaded automatically on mount

  const handleNewChat = async () => {
    await createConversation('New Chat');
  };

  const handleSelectChat = async (id: string) => {
    await selectConversation(id);
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div>
      {/* Sidebar */}
      <aside>
        <button onClick={handleNewChat}>New Chat</button>
        {conversations.map(conv => (
          <button key={conv.id} onClick={() => handleSelectChat(conv.id)}>
            {conv.title || 'Untitled'}
          </button>
        ))}
      </aside>

      {/* Messages */}
      <main>
        {currentConversation?.messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </main>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} disabled={isSending} />
    </div>
  );
}
```

#### State Details

**conversations**
- Array of all conversations
- Automatically loaded on mount
- Updated after create/delete operations

**currentConversation**
- Full conversation with messages
- `null` when no conversation selected
- Updated after `selectConversation()` or `sendMessage()`

**isLoading**
- `true` when loading conversations or conversation details
- Used for skeleton loading states

**isSending**
- `true` when sending a message
- Used to disable input during send

**error**
- Error message string or `null`
- Set when any operation fails
- Clear with `clearError()`

#### Actions

**loadConversations()**
```typescript
await loadConversations();
```
Manually refresh the conversation list. Called automatically on mount.

**createConversation(title?)**
```typescript
const conversation = await createConversation('Project Discussion');
```
Creates a new conversation and sets it as current.

**selectConversation(id)**
```typescript
await selectConversation('conv-123');
```
Loads a conversation and its messages, setting it as current.

**deleteConversation(id)**
```typescript
await deleteConversation('conv-123');
```
Deletes a conversation. Clears current if it was selected.

**renameConversation(id, title)**
```typescript
await renameConversation('conv-123', 'New Title');
```
Updates conversation title in both list and current conversation.

**sendMessage(content)**
```typescript
await sendMessage('What is React?');
```
Sends a message and receives AI response. Creates conversation if needed.

**clearError()**
```typescript
clearError();
```
Clears the error state.

---

### `useConversations()`

Focused hook for conversation management with date grouping. Useful for sidebar implementations.

**Location:** `frontend/src/hooks/useConversations.ts`

#### Return Values

```typescript
interface UseConversationsReturn {
  // State
  conversations: Conversation[];
  groupedConversations: GroupedConversations;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  updateConversation: (id: string, title: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
}
```

#### Usage Example

```typescript
import { useConversations } from '../hooks/useConversations';

function ConversationSidebar() {
  const {
    groupedConversations,
    isLoading,
    createConversation,
    deleteConversation,
  } = useConversations();

  return (
    <aside>
      <button onClick={() => createConversation()}>New Chat</button>

      {/* Today */}
      {groupedConversations.today.length > 0 && (
        <section>
          <h3>Today</h3>
          {groupedConversations.today.map(conv => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </section>
      )}

      {/* Yesterday */}
      {groupedConversations.yesterday.length > 0 && (
        <section>
          <h3>Yesterday</h3>
          {groupedConversations.yesterday.map(conv => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </section>
      )}

      {/* Previous Week */}
      {groupedConversations.previousWeek.length > 0 && (
        <section>
          <h3>Previous 7 Days</h3>
          {groupedConversations.previousWeek.map(conv => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </section>
      )}

      {/* Older */}
      {groupedConversations.older.length > 0 && (
        <section>
          <h3>Older</h3>
          {groupedConversations.older.map(conv => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </section>
      )}
    </aside>
  );
}
```

#### Grouped Conversations

```typescript
interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  previousWeek: Conversation[];
  older: Conversation[];
}
```

Conversations are automatically grouped by `updated_at` timestamp:
- **today**: Updated today
- **yesterday**: Updated yesterday
- **previousWeek**: Updated in the last 7 days
- **older**: Updated more than 7 days ago

---

## Hook Comparison

| Feature | useChat | useConversations |
|---------|---------|------------------|
| Load conversations | Yes | Yes (manual) |
| Create conversation | Yes | Yes |
| Update conversation | Yes (rename) | Yes (update) |
| Delete conversation | Yes | Yes |
| Select conversation | Yes | No |
| Send messages | Yes | No |
| Date grouping | No | Yes |
| Message management | Yes | No |
| Best for | Full chat UI | Sidebar only |

## Performance Optimizations

### Memoization
```typescript
// groupedConversations is memoized in useConversations
const groupedConversations = useMemo(
  () => groupConversationsByDate(conversations),
  [conversations]
);
```

### Debouncing
For search/filter, debounce input:

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    // Search logic
  }, 300),
  []
);
```

### Lazy Loading
Load conversations on demand:

```typescript
const { fetchConversations } = useConversations();

// Only load when needed
<button onClick={fetchConversations}>
  Show Conversations
</button>
```

## Error Handling

All hooks provide error states:

```typescript
const { error, clearError } = useChat();

return (
  <>
    {error && (
      <div className="error-banner">
        {error}
        <button onClick={clearError}>Dismiss</button>
      </div>
    )}
  </>
);
```

## Best Practices

### 1. Use the Right Hook
- **Full chat interface**: Use `useChat()`
- **Sidebar only**: Use `useConversations()`

### 2. Handle Loading States
```typescript
const { isLoading, isSending } = useChat();

if (isLoading) return <Skeleton />;
```

### 3. Optimistic Updates
Update UI immediately, rollback on error:

```typescript
const handleDelete = async (id: string) => {
  // Remove from UI immediately
  setLocalConversations(prev => prev.filter(c => c.id !== id));

  try {
    await deleteConversation(id);
  } catch (err) {
    // Rollback on error
    await loadConversations();
  }
};
```

### 4. Empty States
```typescript
{conversations.length === 0 && (
  <div className="empty-state">
    <p>No conversations yet</p>
    <button onClick={() => createConversation()}>
      Start your first chat
    </button>
  </div>
)}
```

### 5. Keyboard Navigation
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(input);
  }
};
```

## Testing

Example test structure:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from './useChat';

test('loads conversations on mount', async () => {
  const { result } = renderHook(() => useChat());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.conversations).toHaveLength(2);
});
```

## TypeScript Types

All hooks use types from `frontend/src/types/chat.ts`:
- `Conversation`
- `ConversationDetail`
- `Message`
- `MessageRole`
- `GroupedConversations`

## Related Files

- Types: `frontend/src/types/chat.ts`
- Service: `frontend/src/services/chatService.ts`
- API Config: `frontend/src/config/api.ts`
- Example: `frontend/src/examples/ChatExample.tsx`
