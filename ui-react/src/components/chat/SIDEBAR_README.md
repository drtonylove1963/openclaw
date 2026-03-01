# Chat Sidebar Components

Professional conversation management sidebar components for Pronetheia, inspired by Claude.ai.

## Components

### 1. ConversationItem
Individual conversation item with hover actions and inline editing.

**Location**: `C:\projects\pronetheia-os\frontend\src\components\chat\ConversationItem.tsx`

**Features**:
- Active state highlighting with accent color
- Inline title editing (click edit button)
- Keyboard shortcuts: Enter (save), Escape (cancel)
- Hover actions: Rename, Delete
- Title truncation with tooltip (28 characters)
- Confirmation dialog before delete
- Smooth hover transitions
- Full accessibility support (ARIA labels, keyboard navigation)

**Props** (from `frontend/src/types/chat.ts`):
```typescript
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}
```

**Usage**:
```typescript
<ConversationItem
  conversation={conversation}
  isActive={conversation.id === currentId}
  onSelect={() => handleSelect(conversation.id)}
  onDelete={() => handleDelete(conversation.id)}
  onRename={(title) => handleRename(conversation.id, title)}
/>
```

### 2. ChatSidebar
Full sidebar with conversation list, date grouping, and new chat button.

**Location**: `C:\projects\pronetheia-os\frontend\src\components\chat\ChatSidebar.tsx`

**Features**:
- Date-based grouping (Today, Yesterday, Previous 7 Days, Older)
- New Chat button with icon
- Collapsible sidebar (280px expanded, 60px collapsed)
- Automatic conversation sorting by updated_at
- Empty state with helpful message
- Smooth width transitions
- Scrollable conversation list
- Collapse/expand button with animation

**Props** (from `frontend/src/types/chat.ts`):
```typescript
interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
```

**Usage**:
```typescript
<ChatSidebar
  conversations={conversations}
  currentConversationId={currentConversationId}
  onNewChat={handleNewChat}
  onSelectConversation={handleSelectConversation}
  onDeleteConversation={handleDeleteConversation}
  onRenameConversation={handleRenameConversation}
  isCollapsed={isCollapsed}
  onToggleCollapse={handleToggleCollapse}
/>
```

## Color Palette

```typescript
const COLORS = {
  bg: '#0a1628',          // Primary background
  bgAlt: '#0f1f38',       // Secondary background (sidebar)
  accent: '#3b82f6',      // Accent color (active, buttons)
  text: '#f1f5f9',        // Primary text
  textMuted: '#94a3b8',   // Secondary text
  border: '#1e3a5f',      // Borders
  danger: '#ef4444',      // Delete action hover
};
```

## Date Grouping Logic

Conversations are automatically grouped based on their `updated_at` timestamp:

1. **Today**: Updated since midnight today
2. **Yesterday**: Updated between yesterday midnight and today midnight
3. **Previous 7 Days**: Updated in the last 7 days (excluding today/yesterday)
4. **Older**: Updated more than 7 days ago

Groups are only shown if they contain conversations.

## Integration Example

See `ChatSidebar.example.tsx` for a complete integration example:

**Location**: `C:\projects\pronetheia-os\frontend\src\components\chat\ChatSidebar.example.tsx`

Basic integration pattern:

```typescript
import { ChatSidebar } from './components/chat';
import { Conversation } from './types/chat';

function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const handleNewChat = async () => {
    const newConv = await api.createConversation();
    setConversations(prev => [newConv, ...prev]);
    setCurrentId(newConv.id);
  };

  const handleSelect = (id: string) => {
    setCurrentId(id);
    // Load conversation messages
  };

  const handleDelete = async (id: string) => {
    await api.deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentId === id) setCurrentId(null);
  };

  const handleRename = async (id: string, title: string) => {
    await api.updateConversation(id, { title });
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title } : c)
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelect}
        onDeleteConversation={handleDelete}
        onRenameConversation={handleRename}
      />
      {/* Chat content area */}
    </div>
  );
}
```

## Accessibility

Both components include proper accessibility features:

- **Semantic HTML**: `<nav>`, `<button>`, proper heading levels
- **ARIA labels**: All interactive elements have descriptive labels
- **Keyboard navigation**: Full keyboard support including Enter/Escape in edit mode
- **Focus management**: Automatic focus on edit input
- **Screen reader support**: Status messages, current conversation indicator

## Performance Considerations

1. **Memoization**: Date grouping is memoized with `useMemo`
2. **Efficient sorting**: Conversations sorted once per update
3. **Conditional rendering**: Collapsed state hides list content
4. **CSS transitions**: GPU-accelerated transforms for smooth animations

## Responsive Design

- **Desktop**: 280px expanded, 60px collapsed
- **Smooth transitions**: 0.2s width transition
- **Overflow handling**: Scrollable list, truncated titles
- **Icon-only mode**: Collapsed state shows only icons

## Testing Checklist

- [ ] Create new conversation
- [ ] Select conversation (active state)
- [ ] Rename conversation (inline editing)
- [ ] Delete conversation (with confirmation)
- [ ] Keyboard shortcuts (Enter, Escape)
- [ ] Collapse/expand sidebar
- [ ] Empty state display
- [ ] Date grouping accuracy
- [ ] Long title truncation
- [ ] Hover state animations
- [ ] Delete confirmation dialog
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Future Enhancements

- Drag-and-drop reordering
- Search/filter conversations
- Conversation pinning
- Keyboard shortcuts (Cmd+K for new chat)
- Conversation context menu
- Batch operations (archive, delete multiple)
- Conversation tags/labels
- Export conversation history

## Files Created

1. `C:\projects\pronetheia-os\frontend\src\components\chat\ConversationItem.tsx` (6.5 KB)
2. `C:\projects\pronetheia-os\frontend\src\components\chat\ChatSidebar.tsx` (8.9 KB)
3. `C:\projects\pronetheia-os\frontend\src\components\chat\index.ts` (Updated)
4. `C:\projects\pronetheia-os\frontend\src\components\chat\ChatSidebar.example.tsx` (3.5 KB)

## Dependencies

- React 18+
- TypeScript 5+
- Existing types from `frontend/src/types/chat.ts`

No external dependencies required - pure React with inline styles.
