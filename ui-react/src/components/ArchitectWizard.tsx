import React, { useState, useEffect, useCallback } from 'react';
import { COLORS } from '../styles/colors';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';

// Types
interface BoundedContext {
  id: string;
  name: string;
  description: string;
  entities: string[];
  aggregates: string[];
  services: string[];
  events: string[];
  dependencies: string[];
}

interface SystemComponent {
  id: string;
  name: string;
  type: 'api' | 'service' | 'database' | 'cache' | 'queue' | 'gateway' | 'frontend' | 'worker';
  description: string;
  bounded_context: string;
  technologies: string[];
  interfaces: Array<{ type: string; path?: string; port?: number }>;
  dependencies: string[];
}

interface ArchitectureDecision {
  id: string;
  title: string;
  status: string;
  context: string;
  decision: string;
  consequences: string[];
  alternatives: Array<{ name: string; reason: string }>;
  created_at: string;
}

interface TechStackRecommendation {
  category: string;
  recommended: string;
  alternatives: string[];
  rationale: string;
}

export interface ArchitectureSpec {
  id: string;
  project_name: string;
  pattern: string;
  summary: string;
  bounded_contexts: BoundedContext[];
  components: SystemComponent[];
  decisions: ArchitectureDecision[];
  tech_stack: TechStackRecommendation[];
  diagrams?: Record<string, string>;
  created_at: string;
  confidence_score: number;
}

interface StackOption {
  id: string;
  name: string;
  tier: string;
  frontend?: string;
  backend?: string;
  database?: string;
  hosting?: string;
  costEstimate?: string;
  complexity?: string;
  description?: string;
  tags?: string[];
  technologies?: Record<string, string>;
}

interface ThemeConfig {
  id: string;
  name: string;
  personality: string;
  dark_mode: boolean;
  tokens: Record<string, any>;
}

interface ArchitectWizardProps {
  requirements: Record<string, any>;
  taskSpec: Record<string, any>;
  projectName: string;
  stack?: StackOption | null;
  theme?: ThemeConfig | null;
  onComplete: (architecture: ArchitectureSpec, sessionId: string) => void;
  onBack: () => void;
}

// API
const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function createArchitecture(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>,
  request: {
    requirements: Record<string, any>;
    task_spec: Record<string, any>;
    project_name: string;
    preferred_patterns?: string[];
    stack?: StackOption | null;
    theme?: ThemeConfig | null;
  }
) {
  const response = await authenticatedFetch(`${API_BASE}/api/v1/architect/design`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create architecture: ${response.status}`);
  }

  return response.json();
}

async function getArchitectureDiagram(
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>,
  sessionId: string,
  diagramType: string
) {
  const response = await authenticatedFetch(`${API_BASE}/api/v1/architect/${sessionId}/diagram/${diagramType}`);

  if (!response.ok) {
    throw new Error(`Failed to get diagram: ${response.status}`);
  }

  return response.json();
}

// Component
export const ArchitectWizard: React.FC<ArchitectWizardProps> = ({
  requirements,
  taskSpec,
  projectName,
  stack,
  theme,
  onComplete,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureSpec | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contexts' | 'components' | 'decisions' | 'stack'>('overview');
  const [diagram, setDiagram] = useState<string | null>(null);

  // Use authenticated fetch hook (no more localStorage token access)
  const authenticatedFetch = useAuthenticatedFetch();

  // Generate architecture on mount
  useEffect(() => {
    const generateArchitecture = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await createArchitecture(authenticatedFetch, {
          requirements,
          task_spec: taskSpec,
          project_name: projectName,
          stack,
          theme,
        });

        setArchitecture(result.architecture);
        setSessionId(result.session_id);

        // Load system diagram
        const diagramResult = await getArchitectureDiagram(authenticatedFetch, result.session_id, 'system');
        setDiagram(diagramResult.mermaid);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate architecture');
      } finally {
        setLoading(false);
      }
    };

    generateArchitecture();
  }, [requirements, taskSpec, projectName, stack, theme, authenticatedFetch]);

  const handleContinue = () => {
    if (architecture && sessionId) {
      onComplete(architecture, sessionId);
    }
  };

  // Styles
  const styles = {
    container: {
      backgroundColor: COLORS.bgAlt,
      borderRadius: '12px',
      padding: '24px',
      minHeight: '500px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      color: COLORS.text,
    },
    subtitle: {
      fontSize: '14px',
      color: COLORS.textMuted,
      marginTop: '4px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: COLORS.purple + '20',
      color: COLORS.purple,
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      borderBottom: `1px solid ${COLORS.border}`,
      paddingBottom: '8px',
    },
    tab: (active: boolean) => ({
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: active ? COLORS.info + '20' : 'transparent',
      color: active ? COLORS.info : COLORS.textMuted,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s',
    }),
    content: {
      minHeight: '300px',
    },
    card: {
      backgroundColor: COLORS.bg,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      border: `1px solid ${COLORS.border}`,
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '8px',
    },
    cardDescription: {
      fontSize: '14px',
      color: COLORS.textMuted,
      marginBottom: '12px',
    },
    tag: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      backgroundColor: COLORS.success + '20',
      color: COLORS.success,
      marginRight: '8px',
      marginBottom: '4px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px',
    },
    diagram: {
      backgroundColor: COLORS.bg,
      borderRadius: '8px',
      padding: '16px',
      fontFamily: 'monospace',
      fontSize: '12px',
      whiteSpace: 'pre-wrap' as const,
      overflow: 'auto',
      maxHeight: '300px',
      border: `1px solid ${COLORS.border}`,
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: `1px solid ${COLORS.border}`,
    },
    button: (primary: boolean = false) => ({
      padding: '12px 24px',
      borderRadius: '8px',
      border: primary ? 'none' : `1px solid ${COLORS.border}`,
      backgroundColor: primary ? COLORS.info : 'transparent',
      color: primary ? '#fff' : COLORS.textMuted,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    }),
    loading: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      gap: '16px',
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: `4px solid ${COLORS.border}`,
      borderTop: `4px solid ${COLORS.info}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    error: {
      backgroundColor: COLORS.error + '10',
      color: COLORS.error,
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px',
    },
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <div style={{ color: COLORS.textMuted }}>
            Generating architecture with AI Architect Agent...
          </div>
          <div style={{ fontSize: '12px', color: COLORS.textDim }}>
            Analyzing requirements and designing bounded contexts
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button style={styles.button()} onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  if (!architecture) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>No architecture generated</div>
        <button style={styles.button()} onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Architecture Design</div>
          <div style={styles.subtitle}>
            Phase 2: System architecture for {projectName}
          </div>
        </div>
        <div style={styles.badge}>
          {architecture.pattern.replace('_', ' ').toUpperCase()} Architecture
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['overview', 'contexts', 'components', 'decisions', 'stack'] as const).map((tab) => (
          <button
            key={tab}
            style={styles.tab(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'overview' && (
          <>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Summary</div>
              <div style={styles.cardDescription}>{architecture.summary}</div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div>
                  <span style={{ color: COLORS.textDim }}>Contexts:</span>{' '}
                  <strong>{architecture.bounded_contexts.length}</strong>
                </div>
                <div>
                  <span style={{ color: COLORS.textDim }}>Components:</span>{' '}
                  <strong>{architecture.components.length}</strong>
                </div>
                <div>
                  <span style={{ color: COLORS.textDim }}>Decisions:</span>{' '}
                  <strong>{architecture.decisions.length}</strong>
                </div>
              </div>
            </div>
            {diagram && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>System Diagram</div>
                <div style={styles.diagram}>{diagram}</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'contexts' && (
          <div style={styles.grid}>
            {architecture.bounded_contexts.map((context) => (
              <div key={context.id} style={styles.card}>
                <div style={styles.cardTitle}>{context.name}</div>
                <div style={styles.cardDescription}>{context.description}</div>
                <div>
                  <strong style={{ fontSize: '12px', color: COLORS.textDim }}>
                    Entities:
                  </strong>
                  <div>
                    {context.entities.map((entity) => (
                      <span key={entity} style={styles.tag}>{entity}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <strong style={{ fontSize: '12px', color: COLORS.textDim }}>
                    Services:
                  </strong>
                  <div>
                    {context.services.map((service) => (
                      <span key={service} style={{ ...styles.tag, backgroundColor: COLORS.info + '20', color: COLORS.info }}>
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'components' && (
          <div style={styles.grid}>
            {architecture.components.map((component) => (
              <div key={component.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.cardTitle}>{component.name}</div>
                  <span style={{ ...styles.tag, backgroundColor: COLORS.purple + '20', color: COLORS.purple }}>
                    {component.type}
                  </span>
                </div>
                <div style={styles.cardDescription}>{component.description}</div>
                <div>
                  <strong style={{ fontSize: '12px', color: COLORS.textDim }}>
                    Technologies:
                  </strong>
                  <div>
                    {component.technologies.map((tech) => (
                      <span key={tech} style={styles.tag}>{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'decisions' && (
          <>
            {architecture.decisions.map((decision) => (
              <div key={decision.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.cardTitle}>{decision.id}: {decision.title}</div>
                  <span style={{ ...styles.tag, backgroundColor: decision.status === 'accepted' ? COLORS.success + '20' : COLORS.warning + '20', color: decision.status === 'accepted' ? COLORS.success : COLORS.warning }}>
                    {decision.status}
                  </span>
                </div>
                <div style={styles.cardDescription}>
                  <strong>Context:</strong> {decision.context}
                </div>
                <div style={styles.cardDescription}>
                  <strong>Decision:</strong> {decision.decision}
                </div>
                <div>
                  <strong style={{ fontSize: '12px', color: COLORS.textDim }}>
                    Consequences:
                  </strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    {decision.consequences.map((c, i) => (
                      <li key={i} style={{ fontSize: '14px', color: COLORS.textMuted }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'stack' && (
          <div style={styles.grid}>
            {architecture.tech_stack.map((tech, index) => (
              <div key={index} style={styles.card}>
                <div style={styles.cardTitle}>{tech.category.charAt(0).toUpperCase() + tech.category.slice(1)}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: COLORS.success, marginBottom: '8px' }}>
                  {tech.recommended}
                </div>
                <div style={styles.cardDescription}>{tech.rationale}</div>
                <div>
                  <strong style={{ fontSize: '12px', color: COLORS.textDim }}>
                    Alternatives:
                  </strong>
                  <div>
                    {tech.alternatives.map((alt) => (
                      <span key={alt} style={{ ...styles.tag, backgroundColor: COLORS.bgPanel, color: COLORS.textMuted }}>
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.button()} onClick={onBack}>
          Back to Requirements
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: COLORS.textDim, fontSize: '14px' }}>
            Confidence: {architecture.confidence_score}%
          </div>
          <button style={styles.button(true)} onClick={handleContinue}>
            Continue to Backlog
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchitectWizard;
