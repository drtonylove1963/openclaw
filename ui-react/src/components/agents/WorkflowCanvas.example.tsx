/**
 * WorkflowCanvas Usage Examples
 *
 * This file demonstrates how to use the N8N-style workflow canvas
 * for different use cases (agents, teams, skills, workflows).
 */

import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';
import { WorkflowCanvas, PaletteItem } from './';
import { Bot, Users, Zap, Database, FileCode, Shield } from 'lucide-react';

// ============================================================================
// Example 1: Agent Workflow Builder
// ============================================================================

export function AgentWorkflowExample() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const agentPaletteItems: PaletteItem[] = [
    {
      id: 'developer',
      type: 'canvasNode',
      label: 'Developer Agent',
      icon: <FileCode style={{ width: '16px', height: '16px' }} />,
      category: 'Development',
      color: '#3b82f6',
      data: {
        subtitle: 'Writes and refactors code',
        badges: ['Python', 'TypeScript'],
        status: 'idle',
      },
    },
    {
      id: 'qa',
      type: 'canvasNode',
      label: 'QA Tester',
      icon: <Shield style={{ width: '16px', height: '16px' }} />,
      category: 'Testing',
      color: '#22c55e',
      data: {
        subtitle: 'Tests and validates code',
        badges: ['Pytest', 'Jest'],
        status: 'idle',
      },
    },
    {
      id: 'architect',
      type: 'canvasNode',
      label: 'System Architect',
      icon: <Database style={{ width: '16px', height: '16px' }} />,
      category: 'Planning',
      color: '#a855f7',
      data: {
        subtitle: 'Designs system architecture',
        badges: ['PostgreSQL', 'Redis'],
        status: 'idle',
      },
    },
  ];

  const handleSave = (nodes: Node[], edges: Edge[]) => {
    console.log('Saving workflow:', { nodes, edges });
    // Make API call to save workflow
  };

  const handleChange = (nodes: Node[], edges: Edge[]) => {
    setNodes(nodes);
    setEdges(edges);
  };

  const handleNodeSelect = (node: Node | null) => {
    console.log('Selected node:', node);
  };

  const renderConfigPanel = (node: Node) => {
    return (
      <div>
        <h4 style={{ marginTop: 0 }}>Agent Configuration</h4>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Agent Name
          </label>
          <input
            type="text"
            defaultValue={node.data.label}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#f0f0f5',
            }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Model
          </label>
          <select
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#f0f0f5',
            }}
          >
            <option>Claude Opus 4.6</option>
            <option>Claude Sonnet 4.5</option>
            <option>GPT-4</option>
          </select>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Temperature
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            defaultValue="0.7"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <WorkflowCanvas
        paletteItems={agentPaletteItems}
        paletteTitle="Agents"
        initialNodes={nodes}
        initialEdges={edges}
        onSave={handleSave}
        onChange={handleChange}
        onNodeSelect={handleNodeSelect}
        renderConfigPanel={renderConfigPanel}
        emptyMessage="Drag agents from the left to create your workflow"
      />
    </div>
  );
}

// ============================================================================
// Example 2: Team Workflow Builder
// ============================================================================

export function TeamWorkflowExample() {
  const teamPaletteItems: PaletteItem[] = [
    {
      id: 'backend-team',
      type: 'canvasNode',
      label: 'Backend Team',
      icon: '🔧',
      category: 'Teams',
      color: '#3b82f6',
      data: {
        subtitle: '3 agents',
        badges: ['Python', 'FastAPI'],
        status: 'active',
      },
    },
    {
      id: 'frontend-team',
      type: 'canvasNode',
      label: 'Frontend Team',
      icon: '🎨',
      category: 'Teams',
      color: '#f59e0b',
      data: {
        subtitle: '2 agents',
        badges: ['React', 'TypeScript'],
        status: 'idle',
      },
    },
  ];

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <WorkflowCanvas
        paletteItems={teamPaletteItems}
        paletteTitle="Teams"
        emptyMessage="Build your team collaboration workflow"
      />
    </div>
  );
}

// ============================================================================
// Example 3: Skills Workflow
// ============================================================================

export function SkillsWorkflowExample() {
  const skillsPaletteItems: PaletteItem[] = [
    {
      id: 'code-review',
      type: 'canvasNode',
      label: 'Code Review',
      icon: <Zap style={{ width: '16px', height: '16px' }} />,
      category: 'Code Quality',
      color: '#22c55e',
      data: {
        subtitle: 'Reviews code for quality',
        badges: ['Linting', 'Security'],
        status: 'idle',
      },
    },
    {
      id: 'testing',
      type: 'canvasNode',
      label: 'Unit Testing',
      icon: <Zap style={{ width: '16px', height: '16px' }} />,
      category: 'Testing',
      color: '#ef4444',
      data: {
        subtitle: 'Creates unit tests',
        badges: ['Pytest', 'Coverage'],
        status: 'idle',
      },
    },
    {
      id: 'documentation',
      type: 'canvasNode',
      label: 'Documentation',
      icon: <Zap style={{ width: '16px', height: '16px' }} />,
      category: 'Documentation',
      color: '#8b5cf6',
      data: {
        subtitle: 'Generates docs',
        badges: ['Markdown', 'Sphinx'],
        status: 'idle',
      },
    },
  ];

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <WorkflowCanvas
        paletteItems={skillsPaletteItems}
        paletteTitle="Skills"
        emptyMessage="Create a skill execution pipeline"
      />
    </div>
  );
}

// ============================================================================
// Example 4: Using Custom Node Types
// ============================================================================

import { CanvasNode, CanvasNodeData } from './CanvasNode';

// Custom node component that extends CanvasNode
function CustomAgentNode({ data, selected }: any) {
  return (
    <CanvasNode
      data={{
        ...data,
        onEdit: () => console.log('Edit node:', data.label),
        onDelete: () => console.log('Delete node:', data.label),
      }}
      selected={selected}
    />
  );
}

export function CustomNodeExample() {
  const customNodeTypes = {
    canvasNode: CanvasNode,
    customAgent: CustomAgentNode,
  };

  const paletteItems: PaletteItem[] = [
    {
      id: 'custom-agent',
      type: 'customAgent',
      label: 'Custom Agent',
      icon: <Bot style={{ width: '16px', height: '16px' }} />,
      category: 'Custom',
      color: '#06b6d4',
      data: {
        subtitle: 'Custom configured agent',
        status: 'idle',
      },
    },
  ];

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <WorkflowCanvas
        paletteItems={paletteItems}
        nodeTypes={customNodeTypes}
        paletteTitle="Custom Nodes"
      />
    </div>
  );
}

// ============================================================================
// Example 5: Programmatically Loading a Workflow
// ============================================================================

export function PreloadedWorkflowExample() {
  const paletteItems: PaletteItem[] = [
    {
      id: 'agent',
      type: 'canvasNode',
      label: 'Agent',
      icon: <Bot style={{ width: '16px', height: '16px' }} />,
      category: 'Agents',
      color: '#3b82f6',
      data: { subtitle: 'AI Agent', status: 'idle' },
    },
  ];

  // Pre-configured workflow
  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'canvasNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Start Agent',
        icon: <Bot style={{ width: '16px', height: '16px' }} />,
        subtitle: 'Initiates the workflow',
        color: '#22c55e',
        status: 'success',
      },
    },
    {
      id: '2',
      type: 'canvasNode',
      position: { x: 400, y: 100 },
      data: {
        label: 'Process Agent',
        icon: <Zap style={{ width: '16px', height: '16px' }} />,
        subtitle: 'Processes the task',
        color: '#f59e0b',
        status: 'active',
      },
    },
    {
      id: '3',
      type: 'canvasNode',
      position: { x: 700, y: 100 },
      data: {
        label: 'End Agent',
        icon: <Shield style={{ width: '16px', height: '16px' }} />,
        subtitle: 'Finalizes the workflow',
        color: '#3b82f6',
        status: 'idle',
      },
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
    { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
  ];

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <WorkflowCanvas
        paletteItems={paletteItems}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        paletteTitle="Agents"
        emptyMessage="Modify the pre-loaded workflow"
      />
    </div>
  );
}
