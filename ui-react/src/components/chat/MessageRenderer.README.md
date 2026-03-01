# MessageRenderer Component

A comprehensive React component for rendering different message types in the Pronetheia chat interface.

## File Location

`frontend/src/components/chat/MessageRenderer.tsx`

## Features

### Supported Message Types

1. **Text** - Basic text messages with markdown support
2. **Agent Execution** - Agent task execution with status badges and progress bars
3. **Tool Result** - Tool execution results with collapsible output
4. **Workflow Execution** - Workflow status and current node information
5. **Search Results** - Structured search results with titles and snippets
6. **Code Generation** - Code blocks with syntax highlighting and copy buttons
7. **Help** - Command documentation and usage information
8. **Error** - Error messages with detailed stack traces

### UI Components

#### Built-in Utility Components

- **Collapsible** - Expandable sections for long content
- **Badge** - Status indicators with color variants (success, error, warning, info)
- **CodeBlock** - Code display with copy-to-clipboard functionality
- **ProgressBar** - Visual progress indicator for long-running tasks

### Styling

- Consistent color scheme matching the Pronetheia design system
- Dark theme optimized for readability
- Inline styles for zero dependencies
- Responsive layout with proper spacing

### Icons

Uses `lucide-react` icons throughout:
- Terminal, Code2, FileCode for technical operations
- CheckCircle, XCircle, AlertTriangle for status indicators
- Search, HelpCircle for informational content
- ChevronDown/Right for expandable sections
- Copy, Check for clipboard operations

## Usage

### Basic Usage

```typescript
import { MessageRenderer } from './components/chat/MessageRenderer';
import type { UnifiedMessage } from './types/chat';

const message: UnifiedMessage = {
  id: '1',
  role: 'assistant',
  content: 'Hello! How can I help you?',
  message_type: 'text',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {},
};

<MessageRenderer message={message} isLast={false} />
```

### In MessageList

```typescript
import { MessageRenderer } from './components/chat/MessageRenderer';
import type { UnifiedMessage } from './types/chat';

interface MessageListProps {
  messages: UnifiedMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <MessageRenderer
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
    </div>
  );
};
```

## Message Type Examples

### 1. Text Message

```typescript
{
  id: '1',
  role: 'assistant',
  content: 'Use **bold** and `code` in your messages!',
  message_type: 'text',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {},
}
```

### 2. Agent Execution

```typescript
{
  id: '2',
  role: 'assistant',
  content: 'Executing task...',
  message_type: 'agent_execution',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    execution_id: 'exec-123',
    agent_id: 'my-agent',
    task: 'Generate React component',
    status: 'running', // 'pending' | 'running' | 'completed' | 'failed'
    progress: 65, // optional, 0-100
    output: 'Optional output string', // optional
  },
}
```

### 3. Tool Result

```typescript
{
  id: '3',
  role: 'assistant',
  content: 'Tool executed successfully',
  message_type: 'tool_result',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    tool_name: 'web_search',
    duration_ms: 1234,
    result: { /* any object or string */ },
  },
}
```

### 4. Workflow Execution

```typescript
{
  id: '4',
  role: 'assistant',
  content: 'Running workflow...',
  message_type: 'workflow_execution',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    execution_id: 'wf-exec-456',
    workflow_id: 'data-pipeline',
    status: 'running',
    current_node: 'transform_data', // optional
  },
}
```

### 5. Search Results

```typescript
{
  id: '5',
  role: 'assistant',
  content: 'Found 3 results',
  message_type: 'search_results',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    results: [
      {
        title: 'Result Title',
        snippet: 'Result description...',
        url: 'https://example.com', // optional
      },
    ],
  },
}
```

### 6. Code Generation

```typescript
{
  id: '6',
  role: 'assistant',
  content: 'Generated code for you',
  message_type: 'code_generation',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    language: 'typescript',
    files: [
      {
        filename: 'Component.tsx',
        language: 'typescript',
        content: 'const Component = () => { ... }',
      },
    ],
  },
}
```

### 7. Help Message

```typescript
{
  id: '7',
  role: 'assistant',
  content: 'Available commands:',
  message_type: 'help',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    commands: [
      {
        command: '/agent',
        usage: '/agent <task>',
        description: 'Execute a task using AI agents',
      },
    ],
  },
}
```

### 8. Error Message

```typescript
{
  id: '8',
  role: 'assistant',
  content: 'An error occurred',
  message_type: 'error',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    error_type: 'ValidationError', // optional
    details: 'Stack trace or additional info', // optional
  },
}
```

## Props

### MessageRendererProps

```typescript
interface MessageRendererProps {
  message: UnifiedMessage;
  isLast?: boolean; // Optional flag for last message in list
}
```

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support for interactive elements
- Color contrast ratios meet WCAG AA standards
- Screen reader friendly content structure

## Performance Considerations

- Memoized markdown rendering for text messages
- Lazy rendering of collapsible content
- Efficient re-renders with React.memo potential
- No external style dependencies
- Minimal DOM manipulation

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES2015+ support
- Uses CSS Grid and Flexbox
- Clipboard API for copy functionality

## Customization

### Color Scheme

The color constants are defined at the top of the file and can be modified:

```typescript
const COLORS = {
  bg: '#0a1628',
  bgAlt: '#0f1f38',
  bgCard: '#1a2942',
  accent: '#3b82f6',
  // ... more colors
};
```

### Adding New Message Types

1. Add type to `UnifiedMessageType` in `types/chat.ts`
2. Create metadata interface if needed
3. Add renderer component following the pattern
4. Add case to `renderContent()` switch statement

## Dependencies

- React 18+
- lucide-react (icons)
- TypeScript (types from `../../types/chat`)

## Related Files

- `frontend/src/types/chat.ts` - Type definitions
- `frontend/src/components/chat/MessageRenderer.example.tsx` - Usage examples
- `frontend/src/components/chat/MessageList.tsx` - Parent component
- `frontend/src/components/chat/index.ts` - Exports

## Testing Checklist

- [ ] All message types render correctly
- [ ] User vs assistant styling differs appropriately
- [ ] Collapsible sections expand/collapse
- [ ] Code copy button works
- [ ] Progress bars animate smoothly
- [ ] Links in search results are clickable
- [ ] Error messages display with proper styling
- [ ] Markdown rendering works (bold, code, line breaks)
- [ ] Long content handles overflow properly
- [ ] Component performs well with many messages

## Future Enhancements

- [ ] Syntax highlighting for code blocks (consider react-syntax-highlighter)
- [ ] Rich markdown support (tables, lists, links)
- [ ] Message reactions/interactions
- [ ] Streaming support for partial content
- [ ] Animation for status changes
- [ ] Theme customization props
- [ ] Export/share functionality
- [ ] Message threading/replies
