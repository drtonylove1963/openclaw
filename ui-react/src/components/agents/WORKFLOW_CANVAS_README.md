# Workflow Canvas Components

N8N-style drag-and-drop workflow builder for Pronetheia OS. Built with ReactFlow and @dnd-kit, featuring a dark neural theme.

## Components

### 1. WorkflowCanvas

Main canvas component with palette, ReactFlow canvas, and optional config panel.

**Props:**

```typescript
interface WorkflowCanvasProps {
  // Palette items to show in left sidebar
  paletteItems: PaletteItem[];

  // Initial state (for editing existing workflows)
  initialNodes?: Node[];
  initialEdges?: Edge[];

  // Custom node types (defaults to CanvasNode)
  nodeTypes?: Record<string, any>;

  // Callbacks
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onChange?: (nodes: Node[], edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;

  // Config panel renderer (shown when node selected)
  renderConfigPanel?: (node: Node) => ReactNode;

  // Labels
  paletteTitle?: string;
  emptyMessage?: string;
}
```

**Basic Usage:**

```tsx
import { WorkflowCanvas, PaletteItem } from '@/components/agents';

function MyWorkflow() {
  const items: PaletteItem[] = [
    {
      id: 'agent-1',
      type: 'canvasNode',
      label: 'Developer Agent',
      icon: '🤖',
      category: 'Agents',
      color: '#3b82f6',
      data: {
        subtitle: 'Writes code',
        status: 'idle',
      },
    },
  ];

  return (
    <div style={{ height: '800px' }}>
      <WorkflowCanvas
        paletteItems={items}
        paletteTitle="Agents"
        onSave={(nodes, edges) => console.log('Save:', { nodes, edges })}
      />
    </div>
  );
}
```

### 2. CanvasNode

Generic node component for the canvas. Works for agents, teams, skills, etc.

**Data Interface:**

```typescript
interface CanvasNodeData {
  label: string;              // Main label
  subtitle?: string;          // Secondary text
  icon?: string;              // Emoji or icon component
  color?: string;             // Header accent color (hex)
  status?: 'idle' | 'active' | 'success' | 'error';
  badges?: string[];          // Small tags below subtitle
  onEdit?: () => void;        // Edit handler
  onDelete?: () => void;      // Delete handler
}
```

**Features:**

- Neural dark theme styling
- Colored top border (3px accent)
- Status indicator dot
- Left/Right connection handles
- Hover glow effect
- Edit/Delete buttons (optional)
- 180px min width

### 3. PalettePanel

Left sidebar with draggable items.

**Props:**

```typescript
interface PalettePanelProps {
  items: PaletteItem[];
  title?: string;
  onDragStart?: (item: PaletteItem) => void;
  onItemClick?: (item: PaletteItem) => void;
}
```

**Features:**

- Search/filter input
- Category grouping with collapse
- Drag-to-canvas support
- Neural theme styling

## Usage Examples

### Example 1: Agent Workflow

```tsx
import { WorkflowCanvas, PaletteItem } from '@/components/agents';
import { Bot, Shield, Code } from 'lucide-react';

const agentItems: PaletteItem[] = [
  {
    id: 'dev',
    type: 'canvasNode',
    label: 'Developer',
    icon: <Code size={16} />,
    category: 'Development',
    color: '#3b82f6',
    data: {
      subtitle: 'Writes code',
      badges: ['Python', 'TypeScript'],
      status: 'idle',
    },
  },
  {
    id: 'qa',
    type: 'canvasNode',
    label: 'QA Tester',
    icon: <Shield size={16} />,
    category: 'Testing',
    color: '#22c55e',
    data: {
      subtitle: 'Tests code',
      badges: ['Pytest'],
      status: 'idle',
    },
  },
];

function AgentWorkflow() {
  return (
    <WorkflowCanvas
      paletteItems={agentItems}
      paletteTitle="Agents"
      emptyMessage="Drag agents to build your workflow"
    />
  );
}
```

### Example 2: With Config Panel

```tsx
function WorkflowWithConfig() {
  const renderConfig = (node: Node) => (
    <div>
      <h4>Configure Agent</h4>
      <input
        type="text"
        defaultValue={node.data.label}
        placeholder="Agent name"
      />
      <select>
        <option>Claude Opus 4.6</option>
        <option>Claude Sonnet 4.5</option>
      </select>
    </div>
  );

  return (
    <WorkflowCanvas
      paletteItems={items}
      renderConfigPanel={renderConfig}
      onNodeSelect={(node) => console.log('Selected:', node)}
    />
  );
}
```

### Example 3: Load Existing Workflow

```tsx
import { Node, Edge } from 'reactflow';

function EditWorkflow() {
  const existingNodes: Node[] = [
    {
      id: '1',
      type: 'canvasNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Start',
        color: '#22c55e',
        status: 'success',
      },
    },
    {
      id: '2',
      type: 'canvasNode',
      position: { x: 400, y: 100 },
      data: {
        label: 'Process',
        color: '#f59e0b',
        status: 'active',
      },
    },
  ];

  const existingEdges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'smoothstep',
      animated: true,
    },
  ];

  return (
    <WorkflowCanvas
      paletteItems={items}
      initialNodes={existingNodes}
      initialEdges={existingEdges}
      onSave={(nodes, edges) => saveToAPI(nodes, edges)}
    />
  );
}
```

### Example 4: Custom Node Types

```tsx
import { CanvasNode } from '@/components/agents';

// Custom node extending CanvasNode
function TeamNode({ data, selected }: any) {
  return (
    <CanvasNode
      data={{
        ...data,
        icon: '👥',
        onEdit: () => openTeamEditor(data),
        onDelete: () => deleteTeam(data),
      }}
      selected={selected}
    />
  );
}

function TeamWorkflow() {
  const nodeTypes = {
    canvasNode: CanvasNode,
    team: TeamNode,
  };

  const items: PaletteItem[] = [
    {
      id: 'team-1',
      type: 'team',  // Custom type
      label: 'Backend Team',
      category: 'Teams',
      color: '#3b82f6',
      data: { members: 3 },
    },
  ];

  return (
    <WorkflowCanvas
      paletteItems={items}
      nodeTypes={nodeTypes}
    />
  );
}
```

## Styling

All components use the neural dark theme from `/src/styles/theme.ts`:

```typescript
const COLORS = {
  bg: '#09090b',           // Main background
  bgPanel: '#141415',      // Panel background
  bgHover: '#1f1f23',      // Hover state
  border: '#27272a',       // Borders
  text: '#fafafa',         // Primary text
  textMuted: '#a1a1aa',    // Secondary text
  info: '#00d4ff',         // Accent (cyan)
};
```

## ReactFlow Theming

The canvas uses custom ReactFlow styles:

- **Background**: Dark with subtle dot pattern
- **Edges**: Smoothstep with cyan color (#00d4ff)
- **Handles**: 10px circles with node accent color
- **Selection**: Cyan glow effect

## Keyboard Shortcuts

- **Delete/Backspace**: Delete selected node
- **Tab**: (Future) Navigate between nodes

## Features

### Canvas Features
- ✅ Drag from palette to canvas
- ✅ Connect nodes with edges
- ✅ Delete nodes/edges
- ✅ Mini-map
- ✅ Zoom/pan controls
- ✅ Node selection
- ✅ Config panel on selection
- ✅ Save workflow
- ✅ Load workflow
- ⏳ Undo/redo (planned)
- ⏳ Copy/paste (planned)
- ⏳ Note nodes (planned)

### Node Features
- ✅ Colored accent border
- ✅ Status indicator
- ✅ Icon support (emoji or Lucide)
- ✅ Badges
- ✅ Edit/Delete actions
- ✅ Hover glow
- ✅ Connection handles

### Palette Features
- ✅ Search/filter
- ✅ Category grouping
- ✅ Collapse categories
- ✅ Drag to canvas
- ✅ Click to add (optional)

## Integration

### With Agent Teams Tab

```tsx
import { WorkflowCanvas, PaletteItem } from '@/components/agents';
import { useAgents } from '@/hooks/useAgents';

function AgentTeamsTab() {
  const { agents } = useAgents();

  const paletteItems: PaletteItem[] = agents.map(agent => ({
    id: agent.id,
    type: 'canvasNode',
    label: agent.name,
    category: agent.type,
    color: agentColors[agent.type],
    data: {
      subtitle: agent.description,
      status: agent.status,
      badges: agent.skills.slice(0, 2),
    },
  }));

  return <WorkflowCanvas paletteItems={paletteItems} />;
}
```

### With Skills Tab

```tsx
function SkillsWorkflow() {
  const { skills } = useSkills();

  const paletteItems = skills.map(skill => ({
    id: skill.id,
    type: 'canvasNode',
    label: skill.name,
    icon: '⚡',
    category: skill.category,
    color: '#8b5cf6',
    data: {
      subtitle: skill.description,
      status: 'idle',
    },
  }));

  return <WorkflowCanvas paletteItems={paletteItems} />;
}
```

## Accessibility

- ✅ Keyboard navigation (Delete key)
- ✅ ARIA labels on buttons
- ✅ Focus indicators
- ⏳ Screen reader support (planned)

## Performance

- Memoized node components
- Optimized edge rendering
- Virtual scrolling in palette (future)
- Lazy loading for large workflows (future)

## Testing

```bash
# Run component tests
npm test WorkflowCanvas

# Visual regression tests
npm run test:visual
```

## File Locations

```
/home/user/pronetheia-os/frontend/src/components/agents/
├── WorkflowCanvas.tsx          # Main canvas
├── CanvasNode.tsx              # Generic node
├── PalettePanel.tsx            # Left palette
├── WorkflowCanvas.example.tsx  # Usage examples
├── WORKFLOW_CANVAS_README.md   # This file
└── index.ts                    # Exports
```

## Dependencies

- `reactflow` (v11.10.0) - Flow diagram library
- `@dnd-kit/core` - Drag and drop utilities
- `lucide-react` - Icon library

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Issues

- Undo/redo not implemented yet
- Copy/paste not implemented yet
- Note nodes not implemented yet
- Multi-select not implemented yet

## Roadmap

- [ ] Undo/redo stack
- [ ] Copy/paste nodes
- [ ] Note/comment nodes
- [ ] Multi-select with Shift
- [ ] Grid snapping
- [ ] Auto-layout algorithms
- [ ] Export as image
- [ ] Workflow templates

## License

MIT - See project LICENSE
