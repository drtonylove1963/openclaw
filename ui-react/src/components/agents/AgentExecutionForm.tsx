import React, { useState } from 'react';
import { COLORS } from '../../styles/colors';

interface AgentExecutionFormProps {
  agentId: string;
  agentName: string;
  onExecutionStarted: (executionId: string) => void;
}

export const AgentExecutionForm: React.FC<AgentExecutionFormProps> = ({
  agentId,
  agentName,
  onExecutionStarted,
}) => {
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task.trim()) {
      setError('Please enter a task description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: task.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to execute agent: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Expect the response to contain an execution ID
      if (data.execution_id || data.id) {
        onExecutionStarted(data.execution_id || data.id);
      } else {
        throw new Error('No execution ID returned from server');
      }
    } catch (err) {
      console.error('Error executing agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute agent');
      setLoading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    title: {
      fontSize: '16px',
      fontWeight: 700,
      color: COLORS.text,
      marginBottom: '8px',
      letterSpacing: '-0.2px',
    },
    subtitle: {
      fontSize: '14px',
      color: COLORS.textMuted,
      lineHeight: 1.6,
      marginBottom: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.text,
      letterSpacing: '0.1px',
    },
    textarea: {
      width: '100%',
      minHeight: '160px',
      padding: '14px 16px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '10px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      lineHeight: 1.6,
      resize: 'vertical' as const,
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    hint: {
      fontSize: '12px',
      color: COLORS.textMuted,
      fontStyle: 'italic' as const,
    },
    buttonContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    button: {
      padding: '14px 28px',
      backgroundColor: COLORS.accent,
      border: 'none',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid #ffffff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    errorContainer: {
      backgroundColor: `${COLORS.danger}15`,
      border: `1px solid ${COLORS.danger}40`,
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    errorIcon: {
      fontSize: '16px',
      color: COLORS.danger,
    },
    errorText: {
      color: COLORS.danger,
      fontSize: '13px',
      fontWeight: 500,
    },
    charCount: {
      fontSize: '12px',
      color: COLORS.textMuted,
      textAlign: 'right' as const,
    },
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div>
        <h3 style={styles.title}>Execute Agent: {agentName}</h3>
        <p style={styles.subtitle}>
          Describe the task you want this agent to perform. Be as specific as possible for best results.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="task-input" style={styles.label}>
            Task Description *
          </label>
          <textarea
            id="task-input"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter your task here... (e.g., 'Analyze the security vulnerabilities in this API endpoint', 'Generate unit tests for the UserService class')"
            style={styles.textarea}
            disabled={loading}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.accent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.accent}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <div style={styles.charCount}>{task.length} characters</div>
          <div style={styles.hint}>
            Tip: Include relevant context and specific requirements for better results
          </div>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button
            type="submit"
            disabled={loading || !task.trim()}
            style={{
              ...styles.button,
              ...(loading || !task.trim() ? styles.buttonDisabled : {}),
            }}
            onMouseOver={(e) => {
              if (!loading && task.trim()) {
                e.currentTarget.style.backgroundColor = COLORS.accentLight;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading && task.trim()) {
                e.currentTarget.style.backgroundColor = COLORS.accent;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? (
              <>
                <div style={styles.spinner} />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <span>▶</span>
                <span>Execute Agent</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentExecutionForm;
