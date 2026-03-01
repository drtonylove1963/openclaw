# Chat API Service Documentation

## Overview
The chat service provides a clean interface for all chat-related API operations in Pronetheia. It follows the singleton pattern and handles error management consistently.

## Location
`frontend/src/services/chatService.ts`

## API Methods

### Conversation Operations

#### `listConversations(limit?, offset?)`
Fetches a list of conversations with pagination.

```typescript
const conversations = await chatService.listConversations(50, 0);
```

**Parameters:**
- `limit` (number, optional): Maximum conversations to return (default: 50)
- `offset` (number, optional): Number to skip (default: 0)

**Returns:** `Promise<Conversation[]>`

---

#### `getConversation(id)`
Retrieves a single conversation with all messages.

```typescript
const conversation = await chatService.getConversation('conv-123');
```

**Parameters:**
- `id` (string): Conversation ID

**Returns:** `Promise<ConversationDetail>`

---

#### `createConversation(data?)`
Creates a new conversation.

```typescript
const conversation = await chatService.createConversation({
  title: 'My New Chat'
});
```

**Parameters:**
- `data` (CreateConversationRequest, optional): Conversation data
  - `title` (string, optional): Conversation title

**Returns:** `Promise<Conversation>`

---

#### `updateConversation(id, data)`
Updates conversation metadata (currently title).

```typescript
const updated = await chatService.updateConversation('conv-123', {
  title: 'Updated Title'
});
```

**Parameters:**
- `id` (string): Conversation ID
- `data` (UpdateConversationRequest): Update data
  - `title` (string): New title

**Returns:** `Promise<Conversation>`

---

#### `deleteConversation(id)`
Deletes a conversation permanently.

```typescript
await chatService.deleteConversation('conv-123');
```

**Parameters:**
- `id` (string): Conversation ID

**Returns:** `Promise<void>`

---

### Message Operations

#### `addMessage(conversationId, data)`
Manually adds a message to a conversation. Rarely used in normal flow.

```typescript
const message = await chatService.addMessage('conv-123', {
  content: 'Hello world',
  role: 'user'
});
```

**Parameters:**
- `conversationId` (string): Target conversation ID
- `data` (CreateMessageRequest): Message data
  - `content` (string): Message content
  - `role` (MessageRole, optional): 'user' | 'assistant' | 'system'

**Returns:** `Promise<Message>`

---

### Chat Completion

#### `sendChatCompletion(data)`
Primary method for chat interactions. Sends a user message and receives AI response.

```typescript
const response = await chatService.sendChatCompletion({
  message: 'What is TypeScript?',
  conversation_id: 'conv-123', // optional, creates new if omitted
  model: 'claude-3-5-sonnet-20241022' // optional
});
```

**Parameters:**
- `data` (ChatCompletionRequest):
  - `message` (string): User's message
  - `conversation_id` (string, optional): Existing conversation ID
  - `model` (string, optional): AI model to use

**Returns:** `Promise<ChatCompletionResponse>`
- `message`: The user's message
- `conversation_id`: ID of the conversation
- `assistant_message`: The AI's response

---

## Error Handling

All methods throw errors with descriptive messages. Wrap calls in try/catch:

```typescript
try {
  const conversations = await chatService.listConversations();
} catch (error) {
  console.error('Failed to load conversations:', error.message);
}
```

## Usage with Hooks

The service is typically used through React hooks rather than directly:

```typescript
import { useChat } from '../hooks/useChat';

function MyComponent() {
  const { sendMessage, currentConversation } = useChat();

  // Hook handles service calls internally
  await sendMessage('Hello!');
}
```

## Configuration

API endpoints are configured in `frontend/src/config/api.ts`:

```typescript
export const api = {
  chat: `${API_BASE_URL}/api/v1/chat`,
  conversations: `${API_BASE_URL}/api/v1/conversations`,
};
```

## Type Safety

All methods use TypeScript types from `frontend/src/types/chat.ts`:
- `Conversation`
- `ConversationDetail`
- `Message`
- `ChatCompletionRequest`
- `ChatCompletionResponse`

## Performance Considerations

1. **Pagination**: Use limit/offset for large conversation lists
2. **Caching**: Consider implementing local state caching for conversations
3. **Debouncing**: Debounce search/filter operations
4. **Optimistic Updates**: Update UI before API confirmation for better UX

## Best Practices

1. Always handle errors appropriately
2. Use hooks instead of direct service calls in components
3. Validate input before making API calls
4. Clean up resources (abort requests) on component unmount
5. Use TypeScript types for all parameters and return values
