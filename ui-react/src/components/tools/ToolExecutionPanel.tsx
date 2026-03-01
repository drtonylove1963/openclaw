import React, { useState } from 'react';
import type { Tool, ToolExecution } from '../../types/tools';
import { COLORS } from '../../styles/colors';

interface ToolExecutionPanelProps {
  tool: Tool;
  onClose: () => void;
  onExecute: (toolId: string, params: Record<string, any>) => Promise<ToolExecution>;
}

export const ToolExecutionPanel: React.FC<ToolExecutionPanelProps> = ({
  tool,
  onClose,
  onExecute,
}) => {
  const [params, setParams] = useState<Record<string, any>>({});
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ToolExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawParams, setShowRawParams] = useState(false);
  const [rawParamsText, setRawParamsText] = useState('');

  // Parse input schema to generate form fields
  const inputFields = React.useMemo(() => {
    if (!tool.input_schema || !tool.input_schema.properties) {
      return [];
    }

    return Object.entries(tool.input_schema.properties).map(([key, schema]: [string, any]) => ({
      key,
      label: schema.title || key,
      type: schema.type || 'string',
      description: schema.description,
      required: tool.input_schema?.required?.includes(key) || false,
      default: schema.default,
      enum: schema.enum,
    }));
  }, [tool.input_schema]);

  const handleParamChange = (key: string, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const paramsToUse = showRawParams ? JSON.parse(rawParamsText) : params;
      const execution = await onExecute(tool.id, paramsToUse);
      setResult(execution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const toggleRawParams = () => {
    if (!showRawParams) {
      setRawParamsText(JSON.stringify(params, null, 2));
    }
    setShowRawParams(!showRawParams);
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    panel: {
      backgroundColor: COLORS.card,
      borderRadius: '16px',
      border: `1px solid ${COLORS.border}`,
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    header: {
      padding: '24px',
      borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: '20px',
      fontWeight: 600,
      color: COLORS.text,
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: COLORS.textMuted,
      fontSize: '24px',
      cursor: 'pointer',
      padding: '4px 8px',
      transition: 'color 0.2s',
    },
    content: {
      padding: '24px',
      overflowY: 'auto' as const,
      flex: 1,
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleButton: {
      fontSize: '12px',
      padding: '4px 10px',
      borderRadius: '4px',
      backgroundColor: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      color: COLORS.textMuted,
      cursor: 'pointer',
      fontWeight: 500,
    },
    formField: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 500,
      color: COLORS.text,
      marginBottom: '6px',
    },
    required: {
      color: COLORS.danger,
      marginLeft: '4px',
    },
    description: {
      fontSize: '12px',
      color: COLORS.textMuted,
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '13px',
      fontFamily: 'monospace',
      outline: 'none',
      boxSizing: 'border-box' as const,
      minHeight: '200px',
      resize: 'vertical' as const,
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      color: COLORS.text,
      fontSize: '14px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
      outline: 'none',
      cursor: 'pointer',
    },
    resultContainer: {
      backgroundColor: COLORS.bg,
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${COLORS.border}`,
    },
    resultSuccess: {
      borderColor: COLORS.success,
      backgroundColor: `${COLORS.success}10`,
    },
    resultError: {
      borderColor: COLORS.danger,
      backgroundColor: `${COLORS.danger}10`,
    },
    resultLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: COLORS.textMuted,
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    resultOutput: {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: COLORS.text,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
    },
    footer: {
      padding: '20px 24px',
      borderTop: `1px solid ${COLORS.border}`,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    button: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    },
    primaryButton: {
      backgroundColor: COLORS.accent,
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: COLORS.textMuted,
      border: `1px solid ${COLORS.border}`,
    },
    errorMessage: {
      backgroundColor: `${COLORS.danger}20`,
      color: COLORS.danger,
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '16px',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Execute: {tool.name}</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseOver={(e) => (e.currentTarget.style.color = COLORS.text)}
            onMouseOut={(e) => (e.currentTarget.style.color = COLORS.textMuted)}
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          {error && <div style={styles.errorMessage}>Error: {error}</div>}

          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>Parameters</span>
              {inputFields.length > 0 && (
                <button style={styles.toggleButton} onClick={toggleRawParams}>
                  {showRawParams ? 'Form View' : 'Raw JSON'}
                </button>
              )}
            </div>

            {inputFields.length === 0 && !showRawParams && (
              <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
                No parameters required for this tool.
              </p>
            )}

            {showRawParams ? (
              <textarea
                style={styles.textarea}
                value={rawParamsText}
                onChange={(e) => setRawParamsText(e.target.value)}
                placeholder='{"param": "value"}'
              />
            ) : (
              inputFields.map((field) => (
                <div key={field.key} style={styles.formField}>
                  <label style={styles.label}>
                    {field.label}
                    {field.required && <span style={styles.required}>*</span>}
                  </label>
                  {field.description && (
                    <div style={styles.description}>{field.description}</div>
                  )}
                  {field.enum ? (
                    <select
                      style={styles.select}
                      value={params[field.key] || field.default || ''}
                      onChange={(e) => handleParamChange(field.key, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {field.enum.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <select
                      style={styles.select}
                      value={params[field.key] !== undefined ? String(params[field.key]) : ''}
                      onChange={(e) => handleParamChange(field.key, e.target.value === 'true')}
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : field.type === 'number' || field.type === 'integer' ? (
                    <input
                      type="number"
                      style={styles.input}
                      value={params[field.key] || field.default || ''}
                      onChange={(e) =>
                        handleParamChange(
                          field.key,
                          field.type === 'integer'
                            ? parseInt(e.target.value)
                            : parseFloat(e.target.value)
                        )
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      style={styles.input}
                      value={params[field.key] || field.default || ''}
                      onChange={(e) => handleParamChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {result && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Result</div>
              <div
                style={{
                  ...styles.resultContainer,
                  ...(result.status === 'completed'
                    ? styles.resultSuccess
                    : result.status === 'failed'
                    ? styles.resultError
                    : {}),
                }}
              >
                <div style={styles.resultLabel}>
                  Status: {result.status} • Duration: {result.duration_ms}ms
                </div>
                <div style={styles.resultOutput}>
                  {result.result
                    ? JSON.stringify(result.result, null, 2)
                    : result.error_message || 'No output'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = COLORS.accent)}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = COLORS.border)}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleExecute}
            disabled={executing}
            onMouseOver={(e) => {
              if (!executing) {e.currentTarget.style.backgroundColor = COLORS.accentLight;}
            }}
            onMouseOut={(e) => {
              if (!executing) {e.currentTarget.style.backgroundColor = COLORS.accent;}
            }}
          >
            {executing ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolExecutionPanel;
