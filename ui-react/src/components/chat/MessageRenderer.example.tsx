/**
 * MessageRenderer Usage Examples
 * Demonstrates all supported message types
 */
import React from 'react';
import { MessageRenderer } from './MessageRenderer';
import type { UnifiedMessage } from '../../types/chat';

// ============================================================================
// EXAMPLE MESSAGES
// ============================================================================

/**
 * Example 1: Simple text message
 */
const textMessage: UnifiedMessage = {
  id: '1',
  role: 'assistant',
  content: 'Hello! I can help you with **code generation**, agent execution, and more. Use `slash commands` to access special features.',
  message_type: 'text',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {},
};

/**
 * Example 2: Agent execution (running)
 */
const agentExecutionRunning: UnifiedMessage = {
  id: '2',
  role: 'assistant',
  content: 'Executing agent task...',
  message_type: 'agent_execution',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    execution_id: 'exec-12345',
    agent_id: 'code-agent-v1',
    task: 'Generate React component for user dashboard',
    status: 'running',
    progress: 65,
  },
};

/**
 * Example 3: Agent execution (completed)
 */
const agentExecutionCompleted: UnifiedMessage = {
  id: '3',
  role: 'assistant',
  content: 'Agent task completed successfully',
  message_type: 'agent_execution',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    execution_id: 'exec-12345',
    agent_id: 'code-agent-v1',
    task: 'Generate React component for user dashboard',
    status: 'completed',
    progress: 100,
    output: 'Successfully generated UserDashboard.tsx with 3 child components',
  },
};

/**
 * Example 4: Tool result
 */
const toolResult: UnifiedMessage = {
  id: '4',
  role: 'assistant',
  content: 'Tool execution completed',
  message_type: 'tool_result',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    tool_name: 'web_search',
    duration_ms: 1245,
    result: {
      query: 'React hooks best practices',
      results_count: 10,
      top_result: 'React documentation on hooks',
    },
  },
};

/**
 * Example 5: Workflow execution
 */
const workflowExecution: UnifiedMessage = {
  id: '5',
  role: 'assistant',
  content: 'Processing workflow: Data Analysis Pipeline',
  message_type: 'workflow_execution',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    execution_id: 'wf-exec-789',
    workflow_id: 'data-pipeline-v2',
    status: 'running',
    current_node: 'data_transformation',
  },
};

/**
 * Example 6: Search results
 */
const searchResults: UnifiedMessage = {
  id: '6',
  role: 'assistant',
  content: 'Found 3 relevant results',
  message_type: 'search_results',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    results: [
      {
        title: 'React Hooks Documentation',
        snippet: 'Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class.',
        url: 'https://react.dev/reference/react',
      },
      {
        title: 'useState Hook Guide',
        snippet: 'The useState Hook is a special function that lets you add React state to function components.',
        url: 'https://react.dev/reference/react/useState',
      },
      {
        title: 'useEffect Hook Best Practices',
        snippet: 'Learn how to use the useEffect Hook to synchronize your component with external systems.',
        url: 'https://react.dev/reference/react/useEffect',
      },
    ],
  },
};

/**
 * Example 7: Code generation (single file)
 */
const codeGenerationSingle: UnifiedMessage = {
  id: '7',
  role: 'assistant',
  content: 'Generated React component based on your requirements',
  message_type: 'code_generation',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    language: 'typescript',
    files: [
      {
        filename: 'UserProfile.tsx',
        language: 'typescript',
        content: `import React from 'react';

interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ name, email, avatar }) => {
  return (
    <div className="user-profile">
      {avatar && <img src={avatar} alt={name} />}
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
};`,
      },
    ],
  },
};

/**
 * Example 8: Code generation (multiple files)
 */
const codeGenerationMultiple: UnifiedMessage = {
  id: '8',
  role: 'assistant',
  content: 'Generated complete feature with 3 files',
  message_type: 'code_generation',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    language: 'typescript',
    files: [
      {
        filename: 'types/user.ts',
        language: 'typescript',
        content: `export interface User {
  id: string;
  name: string;
  email: string;
}`,
      },
      {
        filename: 'hooks/useUser.ts',
        language: 'typescript',
        content: `import { useState, useEffect } from 'react';
import type { User } from '../types/user';

export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch user logic
  }, [userId]);

  return user;
};`,
      },
      {
        filename: 'components/UserCard.tsx',
        language: 'typescript',
        content: `import React from 'react';
import { useUser } from '../hooks/useUser';

export const UserCard: React.FC<{ userId: string }> = ({ userId }) => {
  const user = useUser(userId);
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
};`,
      },
    ],
  },
};

/**
 * Example 9: Help message
 */
const helpMessage: UnifiedMessage = {
  id: '9',
  role: 'assistant',
  content: 'Here are the available slash commands:',
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
      {
        command: '/workflow',
        usage: '/workflow <name>',
        description: 'Run a predefined workflow',
      },
      {
        command: '/search',
        usage: '/search <query>',
        description: 'Search the web or knowledge base',
      },
      {
        command: '/code',
        usage: '/code <description>',
        description: 'Generate code based on description',
      },
      {
        command: '/help',
        usage: '/help',
        description: 'Show this help message',
      },
    ],
  },
};

/**
 * Example 10: Error message
 */
const errorMessage: UnifiedMessage = {
  id: '10',
  role: 'assistant',
  content: 'Failed to execute agent task due to timeout',
  message_type: 'error',
  conversation_id: 'conv-1',
  created_at: new Date().toISOString(),
  metadata: {
    error_type: 'TimeoutError',
    details: `Stack trace:
  at AgentExecutor.execute (executor.ts:45)
  at TaskRunner.run (runner.ts:123)
  at async processTask (queue.ts:67)

Timeout exceeded: 30000ms`,
  },
};

// ============================================================================
// EXAMPLE COMPONENT
// ============================================================================

/**
 * Demo component showing all message types
 */
export const MessageRendererDemo: React.FC = () => {
  const messages = [
    textMessage,
    agentExecutionRunning,
    agentExecutionCompleted,
    toolResult,
    workflowExecution,
    searchResults,
    codeGenerationSingle,
    codeGenerationMultiple,
    helpMessage,
    errorMessage,
  ];

  return (
    <div style={{ padding: '24px', background: '#0a1628', minHeight: '100vh' }}>
      <h1 style={{ color: '#f1f5f9', marginBottom: '24px' }}>
        MessageRenderer Examples
      </h1>

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

// ============================================================================
// USAGE IN REAL COMPONENTS
// ============================================================================

/**
 * Example: Using MessageRenderer in MessageList component
 *
 * import { MessageRenderer } from './MessageRenderer';
 * import type { UnifiedMessage } from '../../types/chat';
 *
 * interface MessageListProps {
 *   messages: UnifiedMessage[];
 * }
 *
 * export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
 *   return (
 *     <div className="message-list">
 *       {messages.map((message, index) => (
 *         <MessageRenderer
 *           key={message.id}
 *           message={message}
 *           isLast={index === messages.length - 1}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 */

/**
 * Example: Creating a custom message programmatically
 *
 * const createAgentMessage = (task: string, status: 'running' | 'completed'): UnifiedMessage => {
 *   return {
 *     id: crypto.randomUUID(),
 *     role: 'assistant',
 *     content: `Agent task ${status}`,
 *     message_type: 'agent_execution',
 *     conversation_id: currentConversationId,
 *     created_at: new Date().toISOString(),
 *     metadata: {
 *       execution_id: crypto.randomUUID(),
 *       agent_id: 'my-agent',
 *       task,
 *       status,
 *       progress: status === 'completed' ? 100 : 50,
 *     },
 *   };
 * };
 */

export default MessageRendererDemo;
