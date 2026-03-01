/**
 * WorkflowCanvas - N8N-style drag-and-drop workflow builder
 *
 * Features:
 * - ReactFlow canvas with dark neural theme
 * - Left palette for draggable items
 * - Right config panel on node selection
 * - Node/edge creation, deletion, and connections
 * - Mini-map and controls
 * - Save/load workflow state
 */

import React, { useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Maximize2, StickyNote, Undo, X } from 'lucide-react';
import { COLORS } from '../../styles/colors';
import { CanvasNode } from './CanvasNode';
import { PalettePanel, PaletteItem } from './PalettePanel';

export interface WorkflowCanvasProps {
  // Palette items to show in the left sidebar
  paletteItems: PaletteItem[];
  // Initial nodes/edges (for editing existing workflows)
  initialNodes?: Node[];
  initialEdges?: Edge[];
  // Custom node types to register (uses built-in CanvasNode by default)
  nodeTypes?: Record<string, any>;
  // Callbacks
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onChange?: (nodes: Node[], edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  // Config panel renderer
  renderConfigPanel?: (node: Node) => ReactNode;
  // Labels
  paletteTitle?: string;
  emptyMessage?: string;
}

const defaultNodeTypes = {
  canvasNode: CanvasNode,
};

function WorkflowCanvasInner({
  paletteItems,
  initialNodes = [],
  initialEdges = [],
  nodeTypes: customNodeTypes,
  onSave,
  onChange,
  onNodeSelect,
  renderConfigPanel,
  paletteTitle = 'Components',
  emptyMessage = 'Drag items from the left panel to build your workflow',
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { project } = useReactFlow();

  // Merge custom node types with defaults (memoized to preserve reference identity)
  const nodeTypes = useMemo(
    () => ({ ...defaultNodeTypes, ...customNodeTypes }),
    [customNodeTypes]
  );

  // Node changes (move, select, delete)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);
      onChange?.(newNodes, edges);

      // Update selected node if it was deleted
      changes.forEach((change) => {
        if (change.type === 'remove' && selectedNode?.id === change.id) {
          setSelectedNode(null);
          onNodeSelect?.(null);
        }
      });
    },
    [nodes, edges, selectedNode, onChange, onNodeSelect]
  );

  // Edge changes (delete, select)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges);
      setEdges(newEdges);
      onChange?.(nodes, newEdges);
    },
    [edges, nodes, onChange]
  );

  // Connect nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          style: { stroke: COLORS.info, strokeWidth: 2 },
        },
        edges
      );
      setEdges(newEdges);
      onChange?.(nodes, newEdges);
    },
    [edges, nodes, onChange]
  );

  // Handle drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) {return;}

      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) {return;}

      const item: PaletteItem = JSON.parse(data);

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${item.type}-${Date.now()}`,
        type: 'canvasNode',
        position,
        data: {
          ...item.data,
          label: item.label,
          icon: item.icon,
          color: item.color,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      onChange?.(newNodes, edges);
    },
    [nodes, edges, project, onChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  // Deselect on pane click
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // Keyboard shortcuts
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode) {
          const newNodes = nodes.filter((n) => n.id !== selectedNode.id);
          const newEdges = edges.filter(
            (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
          );
          setNodes(newNodes);
          setEdges(newEdges);
          setSelectedNode(null);
          onNodeSelect?.(null);
          onChange?.(newNodes, newEdges);
        }
      }
    },
    [selectedNode, nodes, edges, onChange, onNodeSelect]
  );

  // Delete a node from the canvas (used by node action buttons)
  const deleteNode = useCallback(
    (nodeId: string) => {
      const newNodes = nodes.filter((n) => n.id !== nodeId);
      const newEdges = edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      setNodes(newNodes);
      setEdges(newEdges);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
        onNodeSelect?.(null);
      }
      onChange?.(newNodes, newEdges);
    },
    [nodes, edges, selectedNode, onChange, onNodeSelect]
  );

  // Select a node for editing (opens config panel)
  const selectNodeForEdit = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        onNodeSelect?.(node);
      }
    },
    [nodes, onNodeSelect]
  );

  // Inject onEdit/onDelete callbacks into node data for CanvasNode buttons
  const nodesWithActions = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: renderConfigPanel ? () => selectNodeForEdit(node.id) : undefined,
          onDelete: () => deleteNode(node.id),
        },
      })),
    [nodes, deleteNode, selectNodeForEdit, renderConfigPanel]
  );

  const handleSave = () => {
    onSave?.(nodes, edges);
  };

  const handleFitView = () => {
    // This would normally use ReactFlow's fitView, handled by Controls component
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        backgroundColor: COLORS.bg,
      }}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Left Palette Panel */}
      <PalettePanel
        items={paletteItems}
        title={paletteTitle}
      />

      {/* Canvas */}
      <div
        ref={reactFlowWrapper}
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        <ReactFlow
          nodes={nodesWithActions}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          style={{
            backgroundColor: COLORS.bg,
          }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: COLORS.info, strokeWidth: 2 },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color={COLORS.border}
          />
          <Controls
            style={{
              backgroundColor: COLORS.bgPanel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
            }}
          />
          <MiniMap
            style={{
              backgroundColor: COLORS.bgPanel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
            }}
            nodeColor={(node) => {
              const data = node.data;
              return data.color || COLORS.info;
            }}
            maskColor={COLORS.bgHover}
          />

          {/* Toolbar */}
          <Panel position="top-left">
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px',
                backgroundColor: COLORS.bgPanel,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <ToolbarButton
                icon={<Save style={{ width: '16px', height: '16px' }} />}
                label="Save"
                onClick={handleSave}
              />
              <ToolbarButton
                icon={<Maximize2 style={{ width: '16px', height: '16px' }} />}
                label="Fit View"
                onClick={handleFitView}
              />
              <ToolbarButton
                icon={<StickyNote style={{ width: '16px', height: '16px' }} />}
                label="Add Note"
                onClick={() => {}}
                disabled
              />
              <ToolbarButton
                icon={<Undo style={{ width: '16px', height: '16px' }} />}
                label="Undo"
                onClick={() => {}}
                disabled
              />
            </div>
          </Panel>

          {/* Empty State */}
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div
                style={{
                  marginTop: '100px',
                  padding: '24px 32px',
                  backgroundColor: COLORS.bgPanel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: COLORS.textMuted,
                  fontSize: '14px',
                  maxWidth: '400px',
                }}
              >
                {emptyMessage}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Right Config Panel */}
      {selectedNode && renderConfigPanel && (
        <div
          style={{
            width: '320px',
            height: '100%',
            backgroundColor: COLORS.bgPanel,
            borderLeft: `1px solid ${COLORS.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Config Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: COLORS.text,
              }}
            >
              Node Configuration
            </h3>
            <button
              onClick={() => {
                setSelectedNode(null);
                onNodeSelect?.(null);
              }}
              style={{
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: COLORS.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.bgHover;
                e.currentTarget.style.color = COLORS.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.textMuted;
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Config Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
            }}
          >
            {renderConfigPanel(selectedNode)}
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        padding: '8px 12px',
        backgroundColor: disabled ? COLORS.bgHover : COLORS.bgActive,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '6px',
        color: disabled ? COLORS.textDim : COLORS.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 500,
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = COLORS.bgHover;
          e.currentTarget.style.borderColor = COLORS.info;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = COLORS.bgActive;
          e.currentTarget.style.borderColor = COLORS.border;
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Wrapper component with ReactFlowProvider
export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
