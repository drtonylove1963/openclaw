# Chat Sidebar Component Specifications

## Visual Specifications

### ConversationItem Component

**Dimensions**:
- Height: 44px (with 10px padding + 4px margin)
- Width: 100% (flexible)
- Border radius: 8px
- Margin bottom: 4px

**States**:

1. **Default (Inactive)**:
   - Background: transparent
   - Border: 1px solid transparent
   - Text color: #94a3b8 (textMuted)
   - Icon color: #94a3b8 (textMuted)

2. **Active**:
   - Background: #0f1f38 (bgAlt)
   - Border: 1px solid #1e3a5f (border)
   - Text color: #f1f5f9 (text)
   - Icon color: #3b82f6 (accent)

3. **Hover (Inactive)**:
   - Action buttons fade in (opacity: 0 → 1)
   - Smooth 0.15s transition

4. **Editing**:
   - Input background: #0a1628 (bg)
   - Input border: 1px solid #3b82f6 (accent)
   - Input padding: 4px 8px
   - Auto-focus and select all text

**Icons** (Feather icons, 14x14px):
- Chat bubble: 20x20px (left icon)
- Edit (pen): 14x14px (rename action)
- Trash: 14x14px (delete action)
- Stroke width: 2px

**Layout**:
```
[Icon 20x20] [Title text...] [Edit btn][Delete btn]
     10px gap      flex: 1         4px gap
```

### ChatSidebar Component

**Dimensions**:
- Width expanded: 280px
- Width collapsed: 60px
- Height: 100vh
- Transition: width 0.2s ease

**Header Section**:
- Padding: 16px
- Border bottom: 1px solid #1e3a5f (border)
- New Chat button:
  - Width: 100%
  - Height: 44px (12px padding)
  - Background: #3b82f6 (accent)
  - Border radius: 8px
  - Icon: Plus (18x18px)
  - Text: "New Chat" (14px, weight 500)
  - Hover: opacity 0.9

**Conversation List**:
- Padding: 8px
- Overflow-y: auto
- Scrollbar styling: Custom (recommended)

**Group Headers**:
- Font size: 11px
- Font weight: 600
- Color: #94a3b8 (textMuted)
- Text transform: uppercase
- Letter spacing: 0.5px
- Padding: 8px 12px
- Margin bottom: 16px per group

**Empty State**:
- Padding: 24px 16px
- Text align: center
- Color: #94a3b8 (textMuted)
- Font size: 14px
- Line height: 1.6

**Collapse Button**:
- Position: absolute bottom 16px, right 16px
- Width: 24px
- Height: 24px
- Background: #0a1628 (bg)
- Border: 1px solid #1e3a5f (border)
- Border radius: 4px
- Icon: Chevron left (14x14px)
- Icon rotation: 180deg when collapsed
- Transition: all 0.2s

## Color System

```typescript
// Blue Cobalt Theme
const COLORS = {
  // Backgrounds
  bg: '#0a1628',        // Deep navy - primary background
  bgAlt: '#0f1f38',     // Slightly lighter navy - sidebar, cards

  // Accent
  accent: '#3b82f6',    // Bright blue - primary actions, highlights

  // Text
  text: '#f1f5f9',      // Near white - primary text
  textMuted: '#94a3b8', // Blue-gray - secondary text, placeholders

  // Structure
  border: '#1e3a5f',    // Dark blue - borders, dividers

  // Status
  danger: '#ef4444',    // Red - delete, errors
};
```

## Interaction States

### Hover Effects

1. **ConversationItem**:
   - Actions appear: opacity 0 → 1 (0.15s)
   - No background change unless active

2. **Action Buttons**:
   - Background: transparent → #0f1f38 (bgAlt)
   - Edit button: color stays #94a3b8
   - Delete button: color → #ef4444 (danger)

3. **New Chat Button**:
   - Opacity: 1 → 0.9

4. **Collapse Button**:
   - Background: #0a1628 → #0f1f38

### Click Behaviors

1. **Select Conversation**:
   - Prevents selection during edit mode
   - Updates active state immediately
   - Callback: `onSelectConversation(id)`

2. **Start Edit**:
   - Stops event propagation
   - Enters edit mode
   - Focuses input with text selected

3. **Save Edit**:
   - On Enter key
   - On input blur
   - Only if title changed and not empty
   - Callback: `onRename(newTitle)`

4. **Cancel Edit**:
   - On Escape key
   - Restores original title
   - Exits edit mode

5. **Delete**:
   - Shows browser confirmation dialog
   - "Delete this conversation? This action cannot be undone."
   - Only deletes if confirmed
   - Callback: `onDelete()`

### Keyboard Shortcuts

- **Enter**: Save rename
- **Escape**: Cancel rename
- **Tab**: Navigate between elements
- **Space/Enter**: Activate focused button

## Responsive Behavior

### Desktop (Primary)
- Sidebar width: 280px expanded, 60px collapsed
- All features available
- Smooth transitions

### Tablet (Future)
- Sidebar overlays on toggle
- Full-screen on small tablets
- Touch-friendly targets (min 44px)

### Mobile (Future)
- Drawer-style sidebar
- Swipe to open/close
- Bottom sheet for actions

## Accessibility Requirements

### ARIA Attributes

**ConversationItem**:
```html
role="button"
tabIndex={0}
aria-label="Conversation: {title}"
aria-current={isActive ? 'true' : 'false'}
```

**ChatSidebar**:
```html
<nav aria-label="Chat conversations">
  <button aria-label="Start new chat">
  <div role="status"> (empty state)
  <div role="heading" aria-level={2}> (group headers)
  <button aria-label="Collapse sidebar" aria-expanded={!isCollapsed}>
```

### Focus Management

1. Edit mode automatically focuses input
2. Input text auto-selected for quick replacement
3. Focus returns to conversation item after edit
4. Keyboard navigation through all interactive elements

### Screen Reader Support

- Conversation status announced (active/inactive)
- Action button labels ("Rename conversation", "Delete conversation")
- Empty state announced
- Collapse state announced

## Performance Optimizations

1. **Memoization**:
   ```typescript
   const grouped = useMemo(() => groupByDate(conversations), [conversations]);
   ```

2. **Key Props**:
   ```typescript
   {conversations.map(conv => (
     <ConversationItem key={conv.id} ... />
   ))}
   ```

3. **Conditional Rendering**:
   ```typescript
   {!isCollapsed && <div style={styles.list}>...</div>}
   ```

4. **CSS Transitions** (GPU-accelerated):
   - `transform` instead of position changes
   - `opacity` for fade effects
   - `width` for sidebar collapse

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern features used:
- CSS Flexbox
- CSS Transitions
- React Hooks
- ES6+ JavaScript

## Testing Scenarios

### Unit Tests
- [ ] Component renders without crashing
- [ ] Props are properly typed
- [ ] Callbacks are invoked correctly
- [ ] State updates work as expected
- [ ] Date grouping is accurate

### Integration Tests
- [ ] Conversation CRUD operations
- [ ] Active state management
- [ ] Edit mode entry/exit
- [ ] Delete confirmation
- [ ] Sidebar collapse/expand

### E2E Tests
- [ ] Create new conversation
- [ ] Select conversation
- [ ] Rename conversation (keyboard)
- [ ] Delete conversation (confirmation)
- [ ] Navigate with keyboard
- [ ] Screen reader announces states

### Visual Regression Tests
- [ ] Default state
- [ ] Active conversation
- [ ] Hover states
- [ ] Edit mode
- [ ] Empty state
- [ ] Collapsed state
- [ ] All date groups visible

## File Locations

```
frontend/src/components/chat/
├── ConversationItem.tsx          (6.5 KB) - Individual conversation item
├── ChatSidebar.tsx               (8.9 KB) - Full sidebar with grouping
├── ChatSidebar.example.tsx       (3.5 KB) - Integration example
├── SIDEBAR_README.md             (Documentation)
├── COMPONENT_SPECS.md            (This file)
└── index.ts                      (Exports)
```

## Integration with Existing Components

The sidebar should be used alongside:

1. **ChatContainer** - Main chat interface
2. **MessageList** - Displays conversation messages
3. **MessageInput** - Send new messages
4. **MessageItem** - Individual message display

Layout example:
```typescript
<div style={{ display: 'flex', height: '100vh' }}>
  <ChatSidebar {...sidebarProps} />
  <ChatContainer {...containerProps} />
</div>
```
