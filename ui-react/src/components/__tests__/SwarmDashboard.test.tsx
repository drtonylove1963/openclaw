/**
 * Tests for SwarmDashboard Component
 *
 * Tests cover:
 * - Component rendering
 * - Swarm creation form
 * - Swarm list display
 * - Status updates
 * - Error handling
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SwarmDashboard } from '../SwarmDashboard';
import * as useSwarmHook from '../../hooks/useSwarm';

// Mock the useSwarm hook
jest.mock('../../hooks/useSwarm');

const mockedUseSwarm = useSwarmHook.useSwarm as jest.MockedFunction<typeof useSwarmHook.useSwarm>;

describe('SwarmDashboard Component', () => {
  const mockUseSwarmReturn = {
    swarms: [],
    activeSwarm: null,
    result: null,
    events: [],
    stats: null,
    isLoading: false,
    isExecuting: false,
    error: null,
    isConnected: false,
    createNewSwarm: jest.fn(),
    loadSwarms: jest.fn(),
    selectSwarm: jest.fn(),
    execute: jest.fn(),
    loadStats: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    clearEvents: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSwarm.mockReturnValue(mockUseSwarmReturn);
  });

  describe('Initial Rendering', () => {
    it('should render the dashboard title', () => {
      render(<SwarmDashboard />);
      expect(screen.getByText(/Agent Swarm Orchestration/i)).toBeInTheDocument();
    });

    it('should render the create swarm button', () => {
      render(<SwarmDashboard />);
      expect(screen.getByText('+ New')).toBeInTheDocument();
    });

    it('should show empty state when no swarms exist', () => {
      render(<SwarmDashboard />);
      expect(screen.getByText(/No swarms yet/i)).toBeInTheDocument();
    });

    it('should load swarms and stats on mount', () => {
      render(<SwarmDashboard />);
      expect(mockUseSwarmReturn.loadSwarms).toHaveBeenCalled();
      expect(mockUseSwarmReturn.loadStats).toHaveBeenCalled();
    });
  });

  describe('Statistics Display', () => {
    it('should display statistics when available', () => {
      const mockStats = {
        coordinator: {
          total_agents: 5,
          active_swarms: 2,
          agents: [],
        },
        communication_bus: {
          total_messages: 100,
          active_subscribers: 3,
          subscribers: [],
        },
        active_swarms: 2,
        completed_swarms: 10,
        websocket_connections: {},
      };

      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        stats: mockStats,
      });

      render(<SwarmDashboard />);

      expect(screen.getByText('5')).toBeInTheDocument(); // Total agents
      expect(screen.getByText('2')).toBeInTheDocument(); // Active swarms
      expect(screen.getByText('100')).toBeInTheDocument(); // Messages
      expect(screen.getByText('10')).toBeInTheDocument(); // Completed
    });
  });

  describe('Swarm List', () => {
    it('should display swarms list', () => {
      const mockSwarms = [
        {
          swarm_id: 'swarm-001',
          status: 'running' as const,
          strategy: 'democratic' as const,
          task_description: 'Implement authentication API',
          agents: ['agent-1', 'agent-2'],
          decisions_made: 0,
        },
      ];

      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        swarms: mockSwarms,
      });

      render(<SwarmDashboard />);

      expect(screen.getByText(/Implement authentication API/i)).toBeInTheDocument();
      expect(screen.getByText(/2 agents/i)).toBeInTheDocument();
      expect(screen.getByText(/democratic/i)).toBeInTheDocument();
    });

    it('should allow selecting a swarm', async () => {
      const mockSwarms = [
        {
          swarm_id: 'swarm-001',
          status: 'initializing' as const,
          strategy: 'democratic' as const,
          task_description: 'Test task',
          agents: [],
          decisions_made: 0,
        },
      ];

      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        swarms: mockSwarms,
      });

      render(<SwarmDashboard />);

      const swarmButton = screen.getByText(/Test task/i).closest('button');
      if (swarmButton) {
        fireEvent.click(swarmButton);
        expect(mockUseSwarmReturn.selectSwarm).toHaveBeenCalledWith('swarm-001');
      }
    });
  });

  describe('Create Swarm Form', () => {
    it('should show create form when "+ New" is clicked', () => {
      render(<SwarmDashboard />);

      const newButton = screen.getByText('+ New');
      fireEvent.click(newButton);

      expect(screen.getByPlaceholderText(/Describe the task/i)).toBeInTheDocument();
    });

    it('should allow creating a new swarm', async () => {
      mockUseSwarmReturn.createNewSwarm.mockResolvedValueOnce({
        swarm_id: 'swarm-new',
        status: 'initializing',
        strategy: 'democratic',
        task_description: 'New task',
        agents: [],
        decisions_made: 0,
      });

      render(<SwarmDashboard />);

      // Open form
      fireEvent.click(screen.getByText('+ New'));

      // Fill form
      const textarea = screen.getByPlaceholderText(/Describe the task/i);
      fireEvent.change(textarea, { target: { value: 'Create user API' } });

      // Submit
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockUseSwarmReturn.createNewSwarm).toHaveBeenCalled();
      });
    });

    it('should close form when Cancel is clicked', () => {
      render(<SwarmDashboard />);

      // Open form
      fireEvent.click(screen.getByText('+ New'));
      expect(screen.getByPlaceholderText(/Describe the task/i)).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByPlaceholderText(/Describe the task/i)).not.toBeInTheDocument();
    });
  });

  describe('Active Swarm Details', () => {
    it('should display active swarm details', () => {
      const mockActiveSwarm = {
        swarm_id: 'swarm-001',
        status: 'running' as const,
        strategy: 'democratic' as const,
        task_description: 'Implement user authentication',
        agents: ['agent-1', 'agent-2', 'agent-3'],
        decisions_made: 1,
      };

      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        activeSwarm: mockActiveSwarm,
      });

      render(<SwarmDashboard />);

      expect(screen.getByText(/Implement user authentication/i)).toBeInTheDocument();
      expect(screen.getByText(/swarm-001/i)).toBeInTheDocument();
      expect(screen.getByText('agent-1')).toBeInTheDocument();
      expect(screen.getByText('agent-2')).toBeInTheDocument();
      expect(screen.getByText('agent-3')).toBeInTheDocument();
    });

    it('should show execute button for initializing swarms', () => {
      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        activeSwarm: {
          swarm_id: 'swarm-001',
          status: 'initializing',
          strategy: 'democratic',
          task_description: 'Test',
          agents: ['agent-1'],
          decisions_made: 0,
        },
      });

      render(<SwarmDashboard />);

      expect(screen.getByText('▶ Execute')).toBeInTheDocument();
    });

    it('should execute swarm when Execute button is clicked', async () => {
      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        activeSwarm: {
          swarm_id: 'swarm-001',
          status: 'initializing',
          strategy: 'democratic',
          task_description: 'Test',
          agents: [],
          decisions_made: 0,
        },
      });

      render(<SwarmDashboard />);

      const executeButton = screen.getByText('▶ Execute');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockUseSwarmReturn.execute).toHaveBeenCalledWith('swarm-001');
      });
    });

    it('should show live indicator when connected', () => {
      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        activeSwarm: {
          swarm_id: 'swarm-001',
          status: 'running',
          strategy: 'democratic',
          task_description: 'Test',
          agents: [],
          decisions_made: 0,
        },
        isConnected: true,
      });

      render(<SwarmDashboard />);

      expect(screen.getByText(/● Live/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        error: 'Failed to create swarm',
      });

      render(<SwarmDashboard />);

      expect(screen.getByText('Failed to create swarm')).toBeInTheDocument();
    });

    it('should allow clearing errors', () => {
      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        error: 'Test error',
      });

      render(<SwarmDashboard />);

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(mockUseSwarmReturn.clearError).toHaveBeenCalled();
    });
  });

  describe('Activity Feed', () => {
    it('should display events', () => {
      const mockEvents = [
        {
          event_type: 'proposal_submitted',
          swarm_id: 'swarm-001',
          timestamp: new Date().toISOString(),
          data: { proposal_id: 'prop-1' },
        },
      ];

      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        events: mockEvents,
      });

      render(<SwarmDashboard />);

      expect(screen.getByText('proposal_submitted')).toBeInTheDocument();
    });

    it('should show empty state for activity feed', () => {
      render(<SwarmDashboard />);

      expect(screen.getByText('No events yet')).toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    it('should display swarm results', () => {
      const mockResult = {
        swarm_id: 'swarm-001',
        task: 'Test task',
        strategy: 'democratic',
        winning_solution: {
          solution_id: 'sol-1',
          agent_id: 'agent-1',
          agent_type: 'backend',
          approach: 'Use FastAPI',
          estimated_quality: 0.923,
          estimated_time: 120,
        },
        decision: {
          question: 'Best approach?',
          votes: {},
          result: 'sol-1',
          consensus: true,
          confidence: 0.95,
        },
        all_proposals: [],
        agents_involved: [],
      };

      mockedUseSwarm.mockReturnValue({
        ...mockUseSwarmReturn,
        result: mockResult,
      });

      render(<SwarmDashboard />);

      expect(screen.getByText(/✓ Winner:/i)).toBeInTheDocument();
      expect(screen.getByText(/Quality: 92.3%/i)).toBeInTheDocument();
      expect(screen.getByText(/Confidence: 95.0%/i)).toBeInTheDocument();
    });
  });
});
