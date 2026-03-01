/**
 * Tests for Swarm API Service
 *
 * Tests cover:
 * - Agent registration and retrieval
 * - Swarm creation and management
 * - Swarm execution
 * - Error handling
 * - WebSocket connection creation
 */

import {
  registerAgent,
  listAgents,
  getAgent,
  createSwarm,
  listSwarms,
  getSwarmStatus,
  executeSwarm,
  getSwarmResult,
  getSwarmStats,
  swarmHealth,
  createSwarmEventStream,
  SwarmAgent,
  SwarmTask,
  Swarm,
  SwarmResult,
} from '../swarm-api';

// Mock fetch globally
global.fetch = jest.fn();

describe('Swarm API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('registerAgent', () => {
    it('should register an agent successfully', async () => {
      const mockAgent: SwarmAgent = {
        agent_id: 'agent-001',
        agent_type: 'backend-developer',
        capabilities: ['python', 'fastapi'],
        capacity: 1.0,
        current_tasks: [],
        completed_tasks: 0,
        success_rate: 1.0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgent,
      });

      const result = await registerAgent({
        agent_id: 'agent-001',
        agent_type: 'backend-developer',
        capabilities: ['python', 'fastapi'],
      });

      expect(result).toEqual(mockAgent);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swarm/agents/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
      );
    });

    it('should handle registration errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Agent already exists' }),
      });

      await expect(registerAgent({
        agent_id: 'agent-001',
        agent_type: 'backend',
        capabilities: ['python'],
      })).rejects.toThrow('Agent already exists');
    });
  });

  describe('listAgents', () => {
    it('should list all agents', async () => {
      const mockAgents: SwarmAgent[] = [
        {
          agent_id: 'agent-001',
          agent_type: 'backend',
          capabilities: ['python'],
          capacity: 1.0,
          current_tasks: [],
          completed_tasks: 5,
          success_rate: 0.95,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgents,
      });

      const result = await listAgents();

      expect(result).toEqual(mockAgents);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swarm/agents'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('createSwarm', () => {
    it('should create a swarm successfully', async () => {
      const task: SwarmTask = {
        task_id: 'task-001',
        description: 'Implement auth API',
        complexity: 5,
        required_capabilities: ['backend', 'security'],
        min_agents: 2,
        max_agents: 5,
        requires_consensus: true,
      };

      const mockSwarm: Swarm = {
        swarm_id: 'swarm-001',
        status: 'initializing',
        strategy: 'democratic',
        task_description: task.description,
        agents: ['agent-001', 'agent-002'],
        decisions_made: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSwarm,
      });

      const result = await createSwarm({ task, strategy: 'democratic' });

      expect(result).toEqual(mockSwarm);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swarm/create'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"strategy":"democratic"'),
        })
      );
    });

    it('should handle swarm creation limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Maximum active swarms limit reached' }),
      });

      const task: SwarmTask = {
        task_id: 'task-001',
        description: 'Test',
        complexity: 1,
        required_capabilities: ['test'],
        min_agents: 2,
        max_agents: 5,
        requires_consensus: false,
      };

      await expect(createSwarm({ task })).rejects.toThrow('Maximum active swarms limit reached');
    });
  });

  describe('executeSwarm', () => {
    it('should execute a swarm and return results', async () => {
      const mockResult: SwarmResult = {
        swarm_id: 'swarm-001',
        task: 'Test task',
        strategy: 'democratic',
        winning_solution: {
          solution_id: 'sol-001',
          agent_id: 'agent-001',
          agent_type: 'backend',
          approach: 'Use FastAPI',
          estimated_quality: 0.95,
          estimated_time: 120,
        },
        decision: {
          question: 'Best approach?',
          votes: { 'agent-001': 'sol-001', 'agent-002': 'sol-001' },
          result: 'sol-001',
          consensus: true,
          confidence: 0.95,
        },
        all_proposals: [],
        agents_involved: ['agent-001', 'agent-002'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await executeSwarm('swarm-001');

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swarm/swarm-001/execute'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('getSwarmStats', () => {
    it('should retrieve swarm statistics', async () => {
      const mockStats = {
        coordinator: {
          total_agents: 3,
          active_swarms: 2,
          agents: [],
        },
        communication_bus: {
          total_messages: 10,
          active_subscribers: 2,
          subscribers: [],
        },
        active_swarms: 2,
        completed_swarms: 5,
        websocket_connections: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await getSwarmStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('swarmHealth', () => {
    it('should check swarm service health', async () => {
      const mockHealth = {
        status: 'healthy',
        service: 'swarm-orchestration',
        timestamp: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await swarmHealth();

      expect(result.status).toBe('healthy');
    });
  });

  describe('createSwarmEventStream', () => {
    it('should create a WebSocket connection', () => {
      // Mock WebSocket
      global.WebSocket = jest.fn().mockImplementation(() => ({
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
        readyState: 1,
        send: jest.fn(),
      })) as any;

      const onEvent = jest.fn();
      const onError = jest.fn();
      const onClose = jest.fn();

      const ws = createSwarmEventStream('swarm-001', onEvent, onError, onClose);

      expect(ws).toBeDefined();
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swarm/ws/swarm-001')
      );
    });
  });
});
