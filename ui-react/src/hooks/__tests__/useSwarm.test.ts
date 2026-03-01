/**
 * Tests for useSwarm Hook
 *
 * Tests cover:
 * - State management
 * - Swarm creation and selection
 * - WebSocket connection management
 * - Error handling
 * - Cleanup
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSwarm } from '../useSwarm';
import * as swarmApi from '../../services/swarm-api';

// Mock the swarm API
jest.mock('../../services/swarm-api');

const mockedSwarmApi = swarmApi as jest.Mocked<typeof swarmApi>;

describe('useSwarm Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useSwarm());

      expect(result.current.swarms).toEqual([]);
      expect(result.current.activeSwarm).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.events).toEqual([]);
      expect(result.current.stats).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('createNewSwarm', () => {
    it('should create a swarm successfully', async () => {
      const mockSwarm = {
        swarm_id: 'swarm-001',
        status: 'initializing' as const,
        strategy: 'democratic' as const,
        task_description: 'Test task',
        agents: ['agent-1'],
        decisions_made: 0,
      };

      mockedSwarmApi.createSwarm.mockResolvedValueOnce(mockSwarm);

      const { result } = renderHook(() => useSwarm());

      const task = {
        task_id: 'task-001',
        description: 'Test task',
        complexity: 5,
        required_capabilities: ['backend'],
        min_agents: 2,
        max_agents: 5,
        requires_consensus: true,
      };

      await act(async () => {
        await result.current.createNewSwarm(task, 'democratic');
      });

      expect(result.current.activeSwarm).toEqual(mockSwarm);
      expect(result.current.swarms).toContainEqual(mockSwarm);
      expect(result.current.error).toBeNull();
    });

    it('should handle creation errors', async () => {
      mockedSwarmApi.createSwarm.mockRejectedValueOnce(new Error('Creation failed'));

      const { result } = renderHook(() => useSwarm());

      const task = {
        task_id: 'task-001',
        description: 'Test',
        complexity: 1,
        required_capabilities: ['test'],
        min_agents: 2,
        max_agents: 5,
        requires_consensus: false,
      };

      await act(async () => {
        try {
          await result.current.createNewSwarm(task);
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Creation failed');
    });
  });

  describe('loadSwarms', () => {
    it('should load swarms list', async () => {
      const mockSwarms = [
        {
          swarm_id: 'swarm-001',
          status: 'initializing' as const,
          strategy: 'democratic' as const,
          task_description: 'Task 1',
          agents: [],
          decisions_made: 0,
        },
        {
          swarm_id: 'swarm-002',
          status: 'completed' as const,
          strategy: 'competitive' as const,
          task_description: 'Task 2',
          agents: [],
          decisions_made: 1,
        },
      ];

      mockedSwarmApi.listSwarms.mockResolvedValueOnce(mockSwarms);

      const { result } = renderHook(() => useSwarm());

      await act(async () => {
        await result.current.loadSwarms();
      });

      expect(result.current.swarms).toEqual(mockSwarms);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('selectSwarm', () => {
    it('should select and load a swarm', async () => {
      const mockSwarm = {
        swarm_id: 'swarm-001',
        status: 'running' as const,
        strategy: 'democratic' as const,
        task_description: 'Test task',
        agents: ['agent-1', 'agent-2'],
        decisions_made: 0,
      };

      mockedSwarmApi.getSwarmStatus.mockResolvedValueOnce(mockSwarm);

      const { result } = renderHook(() => useSwarm());

      await act(async () => {
        await result.current.selectSwarm('swarm-001');
      });

      expect(result.current.activeSwarm).toEqual(mockSwarm);
    });

    it('should load result if swarm is completed', async () => {
      const mockSwarm = {
        swarm_id: 'swarm-001',
        status: 'completed' as const,
        strategy: 'democratic' as const,
        task_description: 'Test task',
        agents: [],
        decisions_made: 1,
      };

      const mockResult = {
        swarm_id: 'swarm-001',
        task: 'Test task',
        strategy: 'democratic',
        winning_solution: {
          solution_id: 'sol-1',
          agent_id: 'agent-1',
          agent_type: 'backend',
          approach: 'Test',
          estimated_quality: 0.9,
          estimated_time: 100,
        },
        decision: {
          question: 'Best approach?',
          votes: {},
          result: 'sol-1',
          consensus: true,
          confidence: 0.9,
        },
        all_proposals: [],
        agents_involved: [],
      };

      mockedSwarmApi.getSwarmStatus.mockResolvedValueOnce(mockSwarm);
      mockedSwarmApi.getSwarmResult.mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useSwarm());

      await act(async () => {
        await result.current.selectSwarm('swarm-001');
      });

      await waitFor(() => {
        expect(result.current.result).toEqual(mockResult);
      });
    });
  });

  describe('execute', () => {
    it('should execute a swarm', async () => {
      const mockResult = {
        swarm_id: 'swarm-001',
        task: 'Test task',
        strategy: 'democratic',
        winning_solution: {
          solution_id: 'sol-1',
          agent_id: 'agent-1',
          agent_type: 'backend',
          approach: 'Test',
          estimated_quality: 0.95,
          estimated_time: 120,
        },
        decision: {
          question: 'Best solution?',
          votes: { 'agent-1': 'sol-1' },
          result: 'sol-1',
          consensus: true,
          confidence: 0.95,
        },
        all_proposals: [],
        agents_involved: ['agent-1'],
      };

      mockedSwarmApi.executeSwarm.mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useSwarm());

      // Set active swarm first
      act(() => {
        (result.current as any).setActiveSwarm({
          swarm_id: 'swarm-001',
          status: 'initializing',
          strategy: 'democratic',
          task_description: 'Test',
          agents: [],
          decisions_made: 0,
        });
      });

      await act(async () => {
        await result.current.execute('swarm-001');
      });

      expect(result.current.result).toEqual(mockResult);
      expect(result.current.activeSwarm?.status).toBe('completed');
    });
  });

  describe('loadStats', () => {
    it('should load statistics', async () => {
      const mockStats = {
        coordinator: {
          total_agents: 5,
          active_swarms: 2,
          agents: [],
        },
        communication_bus: {
          total_messages: 20,
          active_subscribers: 3,
          subscribers: [],
        },
        active_swarms: 2,
        completed_swarms: 10,
        websocket_connections: {},
      };

      mockedSwarmApi.getSwarmStats.mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useSwarm());

      await act(async () => {
        await result.current.loadStats();
      });

      expect(result.current.stats).toEqual(mockStats);
    });
  });

  describe('Error handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useSwarm());

      // Set an error
      act(() => {
        (result.current as any).setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear events', () => {
      const { result } = renderHook(() => useSwarm());

      // Add events
      act(() => {
        (result.current as any).setEvents([
          { event_type: 'test', swarm_id: 'swarm-1', timestamp: new Date().toISOString(), data: {} },
        ]);
      });

      expect(result.current.events).toHaveLength(1);

      // Clear events
      act(() => {
        result.current.clearEvents();
      });

      expect(result.current.events).toEqual([]);
    });
  });

  describe('WebSocket connection', () => {
    it('should handle event updates', () => {
      const mockEvent = {
        event_type: 'proposal_submitted',
        swarm_id: 'swarm-001',
        timestamp: new Date().toISOString(),
        data: { proposal_id: 'prop-1' },
      };

      const onEvent = jest.fn();
      const { result } = renderHook(() => useSwarm({ onEvent }));

      // Simulate event
      act(() => {
        (result.current as any).handleEvent(mockEvent);
      });

      expect(result.current.events).toContainEqual(mockEvent);
      expect(onEvent).toHaveBeenCalledWith(mockEvent);
    });
  });
});
