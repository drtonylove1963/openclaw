import React, { useState, useEffect } from 'react';
import type { Tool, ToolCreate, ToolUpdate, ToolCategory, ToolStatus } from '../../types/tools';
import { COLORS } from '../../styles/colors';

const CATEGORIES: ToolCategory[] = [
  'filesystem',
  'database',
  'api',
  'utility',
  'communication',
  'data-processing',
  'ml-ai',
  'testing',
  'monitoring',
  'other',
];

const STATUSES: ToolStatus[] = ['active', 'inactive', 'deprecated', 'error'];

interface ToolEditModalProps {
  tool?: Tool; // If provided, edit mode; otherwise create mode
  onClose: () => void;
  onSave: (data: ToolCreate | ToolUpdate, toolId?: string) => Promise<void>;
}

export const ToolEditModal: React.FC<ToolEditModalProps> = ({ tool, onClose, onSave }) => {
  const isEditMode = !!tool;

  const [formData, setFormData] = useState({
    name: tool?.name || '',
    description: tool?.description || '',
    source: tool?.source || '',
    category: tool?.category || ('utility' as ToolCategory),
    status: tool?.status || ('active' as ToolStatus),
    version: tool?.version || '',
    author: tool?.author || '',
    documentation_url: tool?.documentation_url || '',
    tags: tool?.tags?.join(', ') || '',
    input_schema: tool?.input_schema ? JSON.stringify(tool.input_schema, null, 2) : '',
    output_schema: tool?.output_schema ? JSON.stringify(tool.output_schema, null, 2) : '',
    // Session-based execution fields
    requires_session: tool?.requires_session || false,
    mcp_package: tool?.mcp_package || '',
    mcp_command: tool?.mcp_command || 'npx',
    mcp_args: tool?.mcp_args?.join(', ') || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.source.trim()) {
      newErrors.source = 'Source is required';
    }

    // Validate JSON schemas
    if (formData.input_schema) {
      try {
        JSON.parse(formData.input_schema);
      } catch {
        newErrors.input_schema = 'Invalid JSON format';
      }
    }
    if (formData.output_schema) {
      try {
        JSON.parse(formData.output_schema);
      } catch {
        newErrors.output_schema = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {return;}

    setSaving(true);
    setGeneralError(null);

    try {
      const data: ToolCreate | ToolUpdate = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        source: formData.source.trim(),
        category: formData.category,
        status: formData.status,
        version: formData.version.trim() || undefined,
        author: formData.author.trim() || undefined,
        documentation_url: formData.documentation_url.trim() || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        input_schema: formData.input_schema ? JSON.parse(formData.input_schema) : undefined,
        output_schema: formData.output_schema ? JSON.parse(formData.output_schema) : undefined,
        // Session-based execution fields
        requires_session: formData.requires_session,
        mcp_package: formData.mcp_package.trim() || undefined,
        mcp_command: formData.mcp_command.trim() || undefined,
        mcp_args: formData.mcp_args
          ? formData.mcp_args.split(',').map((a) => a.trim()).filter(Boolean)
          : undefined,
      };

      await onSave(data, tool?.id);
      onClose();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Failed to save tool');
    } finally {
      setSaving(false);
    }
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
    modal: {
      backgroundColor: COLORS.card,
      borderRadius: '16px',
      border: `1px solid ${COLORS.border}`,
      width: '100%',
      maxWidth: '900px',
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '20px',
    },
    formField: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '8px',
    },
    required: {
      color: COLORS.danger,
      marginLeft: '4px',
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
    inputError: {
      borderColor: COLORS.danger,
    },
    textarea: {
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
      minHeight: '100px',
      resize: 'vertical' as const,
    },
    codeTextarea: {
      fontFamily: 'monospace',
      fontSize: '13px',
      minHeight: '150px',
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
    errorText: {
      color: COLORS.danger,
      fontSize: '12px',
      marginTop: '4px',
    },
    generalError: {
      backgroundColor: `${COLORS.danger}20`,
      color: COLORS.danger,
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: 600,
      color: COLORS.text,
      marginTop: '24px',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    helpText: {
      fontSize: '12px',
      color: COLORS.textMuted,
      marginTop: '4px',
    },
    footer: {
      padding: '20px 24px',
      borderTop: `1px solid ${COLORS.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerLeft: {
      fontSize: '12px',
      color: COLORS.textMuted,
    },
    footerRight: {
      display: 'flex',
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
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{isEditMode ? 'Edit Tool' : 'Create New Tool'}</h2>
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
          {generalError && <div style={styles.generalError}>Error: {generalError}</div>}

          {/* Basic Information */}
          <div style={styles.grid}>
            <div style={styles.formField}>
              <label style={styles.label}>
                Name<span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                style={{
                  ...styles.input,
                  ...(errors.name ? styles.inputError : {}),
                }}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., file_reader"
              />
              {errors.name && <div style={styles.errorText}>{errors.name}</div>}
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>
                Source<span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                style={{
                  ...styles.input,
                  ...(errors.source ? styles.inputError : {}),
                }}
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                placeholder="e.g., mcp-server-filesystem"
              />
              {errors.source && <div style={styles.errorText}>{errors.source}</div>}
            </div>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>
              Description<span style={styles.required}>*</span>
            </label>
            <textarea
              style={{
                ...styles.textarea,
                ...(errors.description ? styles.inputError : {}),
              }}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this tool does..."
            />
            {errors.description && <div style={styles.errorText}>{errors.description}</div>}
          </div>

          <div style={styles.grid}>
            <div style={styles.formField}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.select}
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Status</label>
              <select
                style={styles.select}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Metadata */}
          <div style={styles.sectionTitle}>Optional Information</div>

          <div style={styles.grid}>
            <div style={styles.formField}>
              <label style={styles.label}>Version</label>
              <input
                type="text"
                style={styles.input}
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
                placeholder="e.g., 1.0.0"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Author</label>
              <input
                type="text"
                style={styles.input}
                value={formData.author}
                onChange={(e) => handleChange('author', e.target.value)}
                placeholder="e.g., Your Name"
              />
            </div>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Documentation URL</label>
            <input
              type="url"
              style={styles.input}
              value={formData.documentation_url}
              onChange={(e) => handleChange('documentation_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Tags</label>
            <input
              type="text"
              style={styles.input}
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
            <div style={styles.helpText}>Comma-separated list of tags</div>
          </div>

          {/* Session-Based Execution */}
          <div style={styles.sectionTitle}>Session-Based Execution</div>

          <div style={styles.formField}>
            <label style={{
              ...styles.label,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={formData.requires_session}
                onChange={(e) => handleChange('requires_session', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Requires Session
            </label>
            <div style={styles.helpText}>
              Enable for stateful tools (e.g., Puppeteer browser sessions) that need to maintain state across multiple calls
            </div>
          </div>

          {formData.requires_session && (
            <>
              <div style={styles.grid}>
                <div style={styles.formField}>
                  <label style={styles.label}>MCP Package</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.mcp_package}
                    onChange={(e) => handleChange('mcp_package', e.target.value)}
                    placeholder="@modelcontextprotocol/server-puppeteer"
                  />
                  <div style={styles.helpText}>NPM package name for the MCP server</div>
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>MCP Command</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.mcp_command}
                    onChange={(e) => handleChange('mcp_command', e.target.value)}
                    placeholder="npx"
                  />
                  <div style={styles.helpText}>Command to start the MCP server (default: npx)</div>
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.label}>MCP Arguments</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.mcp_args}
                  onChange={(e) => handleChange('mcp_args', e.target.value)}
                  placeholder="-y, @modelcontextprotocol/server-puppeteer"
                />
                <div style={styles.helpText}>Comma-separated arguments for the MCP server command</div>
              </div>
            </>
          )}

          {/* Schemas */}
          <div style={styles.sectionTitle}>Schemas (JSON)</div>

          <div style={styles.formField}>
            <label style={styles.label}>Input Schema</label>
            <textarea
              style={{
                ...styles.textarea,
                ...styles.codeTextarea,
                ...(errors.input_schema ? styles.inputError : {}),
              }}
              value={formData.input_schema}
              onChange={(e) => handleChange('input_schema', e.target.value)}
              placeholder={'{\n  "type": "object",\n  "properties": {\n    "param": {\n      "type": "string"\n    }\n  }\n}'}
            />
            {errors.input_schema && <div style={styles.errorText}>{errors.input_schema}</div>}
            <div style={styles.helpText}>JSON Schema defining expected input parameters</div>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Output Schema</label>
            <textarea
              style={{
                ...styles.textarea,
                ...styles.codeTextarea,
                ...(errors.output_schema ? styles.inputError : {}),
              }}
              value={formData.output_schema}
              onChange={(e) => handleChange('output_schema', e.target.value)}
              placeholder={'{\n  "type": "object",\n  "properties": {\n    "result": {\n      "type": "string"\n    }\n  }\n}'}
            />
            {errors.output_schema && <div style={styles.errorText}>{errors.output_schema}</div>}
            <div style={styles.helpText}>JSON Schema defining expected output structure</div>
          </div>
        </div>

        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            {isEditMode ? `Editing: ${tool.name}` : 'Creating new tool'}
          </div>
          <div style={styles.footerRight}>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={onClose}
              disabled={saving}
              onMouseOver={(e) => {
                if (!saving) {e.currentTarget.style.borderColor = COLORS.accent;}
              }}
              onMouseOut={(e) => {
                if (!saving) {e.currentTarget.style.borderColor = COLORS.border;}
              }}
            >
              Cancel
            </button>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleSave}
              disabled={saving}
              onMouseOver={(e) => {
                if (!saving) {e.currentTarget.style.backgroundColor = COLORS.accentLight;}
              }}
              onMouseOut={(e) => {
                if (!saving) {e.currentTarget.style.backgroundColor = COLORS.accent;}
              }}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Tool' : 'Create Tool'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolEditModal;
