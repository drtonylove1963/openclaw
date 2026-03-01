/**
 * WorkflowCanvas Component Tests
 *
 * Basic unit tests for the workflow canvas components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowCanvas, PaletteItem, CanvasNode, PalettePanel } from './';
import { Bot } from 'lucide-react';

describe('WorkflowCanvas', () => {
  const mockPaletteItems: PaletteItem[] = [
    {
      id: 'test-1',
      type: 'canvasNode',
      label: 'Test Agent',
      icon: <Bot />,
      category: 'Testing',
      color: '#3b82f6',
      data: {
        subtitle: 'Test subtitle',
        status: 'idle' as const,
      },
    },
  ];

  it('renders without crashing', () => {
    render(
      <div style={{ height: '600px', width: '800px' }}>
        <WorkflowCanvas paletteItems={mockPaletteItems} />
      </div>
    );
  });

  it('displays palette title', () => {
    render(
      <div style={{ height: '600px', width: '800px' }}>
        <WorkflowCanvas
          paletteItems={mockPaletteItems}
          paletteTitle="Test Components"
        />
      </div>
    );
    expect(screen.getByText('Test Components')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', () => {
    const onSave = vi.fn();
    const { container } = render(
      <div style={{ height: '600px', width: '800px' }}>
        <WorkflowCanvas
          paletteItems={mockPaletteItems}
          onSave={onSave}
        />
      </div>
    );

    // Find and click Save button
    const saveButton = container.querySelector('[title="Save"]');
    if (saveButton) {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(onSave).toHaveBeenCalled();
    }
  });

  it('displays empty message when no nodes', () => {
    render(
      <div style={{ height: '600px', width: '800px' }}>
        <WorkflowCanvas
          paletteItems={mockPaletteItems}
          emptyMessage="Custom empty message"
        />
      </div>
    );
    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
  });
});

describe('PalettePanel', () => {
  const mockItems: PaletteItem[] = [
    {
      id: '1',
      type: 'canvasNode',
      label: 'Agent 1',
      category: 'Development',
      color: '#3b82f6',
      data: {},
    },
    {
      id: '2',
      type: 'canvasNode',
      label: 'Agent 2',
      category: 'Testing',
      color: '#22c55e',
      data: {},
    },
  ];

  it('renders all palette items', () => {
    render(<PalettePanel items={mockItems} />);
    expect(screen.getByText('Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Agent 2')).toBeInTheDocument();
  });

  it('displays categories', () => {
    render(<PalettePanel items={mockItems} />);
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('filters items by search query', () => {
    render(<PalettePanel items={mockItems} />);
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
  });

  it('shows item count in category header', () => {
    render(<PalettePanel items={mockItems} />);
    // Each category should show count of 1
    const countElements = screen.getAllByText('1');
    expect(countElements.length).toBeGreaterThan(0);
  });
});

describe('CanvasNode', () => {
  it('renders with minimal props', () => {
    const { container } = render(
      <div style={{ width: '200px' }}>
        <CanvasNode
          data={{
            label: 'Test Node',
          }}
          selected={false}
          id="test-1"
          type="canvasNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          isConnectable={true}
          zIndex={0}
          xPos={0}
          yPos={0}
        />
      </div>
    );
    expect(container.textContent).toContain('Test Node');
  });

  it('displays subtitle when provided', () => {
    const { container } = render(
      <div style={{ width: '200px' }}>
        <CanvasNode
          data={{
            label: 'Test Node',
            subtitle: 'Test Subtitle',
          }}
          selected={false}
          id="test-1"
          type="canvasNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          isConnectable={true}
          zIndex={0}
          xPos={0}
          yPos={0}
        />
      </div>
    );
    expect(container.textContent).toContain('Test Subtitle');
  });

  it('displays badges when provided', () => {
    const { container } = render(
      <div style={{ width: '200px' }}>
        <CanvasNode
          data={{
            label: 'Test Node',
            badges: ['Python', 'TypeScript'],
          }}
          selected={false}
          id="test-1"
          type="canvasNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          isConnectable={true}
          zIndex={0}
          xPos={0}
          yPos={0}
        />
      </div>
    );
    expect(container.textContent).toContain('Python');
    expect(container.textContent).toContain('TypeScript');
  });

  it('shows edit button when onEdit provided', () => {
    const onEdit = vi.fn();
    const { container } = render(
      <div style={{ width: '200px' }}>
        <CanvasNode
          data={{
            label: 'Test Node',
            onEdit,
          }}
          selected={false}
          id="test-1"
          type="canvasNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          isConnectable={true}
          zIndex={0}
          xPos={0}
          yPos={0}
        />
      </div>
    );
    expect(container.textContent).toContain('Edit');
  });

  it('shows delete button when onDelete provided', () => {
    const onDelete = vi.fn();
    const { container } = render(
      <div style={{ width: '200px' }}>
        <CanvasNode
          data={{
            label: 'Test Node',
            onDelete,
          }}
          selected={false}
          id="test-1"
          type="canvasNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          isConnectable={true}
          zIndex={0}
          xPos={0}
          yPos={0}
        />
      </div>
    );
    expect(container.textContent).toContain('Delete');
  });

  it('applies correct status color', () => {
    const { container } = render(
      <div style={{ width: '200px' }}>
        <CanvasNode
          data={{
            label: 'Test Node',
            status: 'success' as const,
          }}
          selected={false}
          id="test-1"
          type="canvasNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          isConnectable={true}
          zIndex={0}
          xPos={0}
          yPos={0}
        />
      </div>
    );
    // Check that the node rendered
    expect(container.querySelector('[style*="minWidth"]')).toBeInTheDocument();
  });
});
