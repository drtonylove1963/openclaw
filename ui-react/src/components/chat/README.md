# Chat Components

Core chat UI components for Pronetheia, matching Claude.ai's design aesthetic.

## Components

### ChatContainer
Main chat interface combining message list and input.

```tsx
import { ChatContainer } from './components/chat';

function ChatPage() {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (content: string) => {
    setIsSending(true);
    try {
      // Send message via API
      const response = await chatApi.sendChatCompletion({
        message: content,
        conversation_id: conversation?.id,
      });
      // Update conversation state
      setConversation({
        ...conversation!,
        messages: [...conversation!.messages, response.message, response.assistant_message],
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setConversation(null);
  };

  return (
    <ChatContainer
      conversation={conversation}
      isLoading={false}
      isSending={isSending}
      onSendMessage={handleSendMessage}
      onNewChat={handleNewChat}
    />
  );
}
```

### MessageList
Scrollable list of messages with auto-scroll to bottom.

```tsx
import { MessageList } from './components/chat';

<MessageList
  messages={conversation.messages}
  isLoading={isSending}
/>
```

### MessageItem
Individual message bubble with markdown rendering.

```tsx
import { MessageItem } from './components/chat';

<MessageItem
  message={{
    id: '1',
    conversation_id: 'conv-1',
    role: 'user',
    content: 'Hello!',
    created_at: new Date().toISOString(),
  }}
  isLast={false}
/>
```

### MessageInput
Multi-line expandable textarea with send button.

```tsx
import { MessageInput } from './components/chat';

<MessageInput
  onSend={(content) => console.log('Sending:', content)}
  isDisabled={false}
  placeholder="Message Pronetheia..."
/>
```

## Features

- **Auto-expanding textarea**: Input grows as you type (max 200px)
- **Keyboard shortcuts**: Enter to send, Shift+Enter for new line
- **Markdown rendering**: Basic markdown support (code blocks, inline code, bold, italic)
- **Auto-scroll**: Automatically scrolls to latest message
- **Loading states**: Animated loading indicator while AI responds
- **Empty states**: Friendly welcome message for new conversations
- **Hover effects**: Smooth transitions on interactive elements
- **Responsive design**: Works on all screen sizes

## Styling

Components use inline CSS-in-JS following the project's design system:

```javascript
const COLORS = {
  bg: '#0a1628',
  bgAlt: '#0f1f38',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#1e3a5f',
};
```

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus visible states
- High contrast text

## Performance

- Memoized markdown rendering
- Efficient auto-scroll with refs
- Minimal re-renders
- Optimized textarea resize

## Future Enhancements

- [ ] Streaming message support
- [ ] Rich markdown library (syntax highlighting)
- [ ] File attachments
- [ ] Message editing
- [ ] Message reactions
- [ ] Code copy buttons
- [ ] Image rendering
- [ ] Voice input
