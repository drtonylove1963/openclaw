import React, { useState, useEffect, useCallback } from 'react';
import { COLORS } from '../styles/colors';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PartialSpec {
  name: string;
  description: string;
  domain: string;
  features: Array<{ name: string; description: string; priority: string }>;
  user_roles: Array<{ name: string; permissions: string[] }>;
  constraints: {
    security: string[];
    performance: string[];
    compliance: string[];
  };
}

interface Answer {
  question: string;
  answer: string;
  phase: string;
}

interface SessionStatus {
  session_id: string;
  current_phase: string;
  detected_domain: string;
  confidence_score: number;
  questions_answered: number;
  answers: Answer[];
  partial_spec: PartialSpec;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskSpec {
  title?: string;
  problem_statement: string;
  success_criteria: string[];
  features: Array<{
    name: string;
    description: string;
    priority: string;
    user_stories: string[];
    acceptance_criteria: string[];
  }>;
  user_roles: Array<{
    name: string;
    permissions: string[];
    description: string;
  }>;
  constraints: {
    security: string[];
    performance: string[];
    compliance: string[];
  };
  test_cases: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  complexity_score: number;
  recommended_tracks: number;
  domain: string;
  timeline_estimate: string | null;
}

interface IntentCaptureWizardProps {
  onComplete: (taskSpec: TaskSpec, sessionId: string) => void;
  onCancel: () => void;
  initialIdea?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function startIntentCapture(token: string, initialIdea: string) {
  const response = await fetch(`${API_BASE}/api/v1/intent-capture/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initial_idea: initialIdea }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start session: ${response.status}`);
  }

  return response.json();
}

async function submitAnswer(token: string, sessionId: string, answer: string) {
  const response = await fetch(`${API_BASE}/api/v1/intent-capture/${sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit answer: ${response.status}`);
  }

  return response.json();
}

async function completeSession(token: string, sessionId: string) {
  const response = await fetch(`${API_BASE}/api/v1/intent-capture/${sessionId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to complete session: ${response.status}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const DOMAIN_ICONS: Record<string, string> = {
  saas: '💼',
  ecommerce: '🛒',
  healthcare: '🏥',
  church_nonprofit: '⛪',
  internal_tool: '🔧',
  mobile_app: '📱',
  api_service: '🔌',
  unknown: '❓',
};

const DOMAIN_LABELS: Record<string, string> = {
  saas: 'SaaS',
  ecommerce: 'E-Commerce',
  healthcare: 'Healthcare',
  church_nonprofit: 'Church/Non-Profit',
  internal_tool: 'Internal Tool',
  mobile_app: 'Mobile App',
  api_service: 'API Service',
  unknown: 'General',
};

const PHASE_LABELS: Record<string, string> = {
  initial: 'Getting Started',
  domain_discovery: 'Domain Discovery',
  scope_definition: 'Scope Definition',
  feature_deep_dive: 'Feature Details',
  non_functional: 'Requirements',
  complete: 'Complete',
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function IntentCaptureWizard({ onComplete, onCancel, initialIdea = '' }: IntentCaptureWizardProps) {
  const [step, setStep] = useState<'idea' | 'questioning' | 'review'>('idea');
  const [idea, setIdea] = useState(initialIdea);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session state
  const [detectedDomain, setDetectedDomain] = useState('unknown');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('initial');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [totalQuestionsEstimate, setTotalQuestionsEstimate] = useState(10);
  const [partialSpec, setPartialSpec] = useState<PartialSpec | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [taskSpec, setTaskSpec] = useState<TaskSpec | null>(null);

  // Get token from localStorage (must match AuthContext TOKEN_KEY)
  const getToken = useCallback(() => {
    return localStorage.getItem('pronetheia_token') || '';
  }, []);

  // Start the session
  const handleStartSession = async () => {
    if (!idea.trim()) {
      setError('Please describe your project idea');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const result = await startIntentCapture(token, idea);

      setSessionId(result.session_id);
      setDetectedDomain(result.detected_domain);
      setConfidenceScore(result.confidence_score);
      setCurrentPhase(result.current_phase);
      setCurrentQuestion(result.first_question);
      setPartialSpec(result.partial_spec);
      
      // Check if session is already complete from extraction
      if (result.is_complete) {
        setIsComplete(true);
        const token = getToken();
        const completeResult = await completeSession(token, result.session_id);
        setTaskSpec(completeResult.task_spec);
        setStep('review');
      } else {
        setStep('questioning');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit an answer
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !sessionId) {return;}

    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const result = await submitAnswer(token, sessionId, answer);

      setConfidenceScore(result.confidence_score);
      setCurrentPhase(result.current_phase);
      setQuestionsAnswered(result.questions_answered);
      setTotalQuestionsEstimate(result.total_questions_estimate);
      setPartialSpec(result.partial_spec);
      setIsComplete(result.is_complete);

      if (result.is_complete) {
        // Session complete, move to review
        const completeResult = await completeSession(token, sessionId);
        setTaskSpec(completeResult.task_spec);
        setStep('review');
      } else {
        setCurrentQuestion(result.next_question);
        setAnswers(prev => [...prev, { question: currentQuestion || '', answer, phase: currentPhase }]);
      }

      setAnswer('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  };

  // Skip to completion
  const handleSkipToComplete = async () => {
    if (!sessionId) {return;}

    setIsLoading(true);
    try {
      const token = getToken();
      const result = await completeSession(token, sessionId);
      setTaskSpec(result.task_spec);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
    } finally {
      setIsLoading(false);
    }
  };

  // Final completion
  const handleFinalComplete = () => {
    if (taskSpec && sessionId) {
      onComplete(taskSpec, sessionId);
    }
  };

  // Styles
  const styles = {
    container: {
      backgroundColor: COLORS.card,
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '700px',
      margin: '0 auto',
      border: `1px solid ${COLORS.border}`,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      color: COLORS.text,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.accent,
    },
    progressSection: {
      marginBottom: '24px',
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    progressLabel: {
      fontSize: '13px',
      color: COLORS.textMuted,
    },
    progressValue: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.accent,
    },
    progressBar: {
      height: '8px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '4px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: COLORS.accent,
      borderRadius: '4px',
      transition: 'width 0.3s ease',
    },
    phaseIndicator: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
      flexWrap: 'wrap' as const,
    },
    phaseBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.textMuted,
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    textarea: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '10px',
      backgroundColor: COLORS.bg,
      color: COLORS.text,
      outline: 'none',
      minHeight: '120px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
    },
    questionBox: {
      backgroundColor: COLORS.bg,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: `1px solid ${COLORS.border}`,
    },
    questionText: {
      fontSize: '16px',
      fontWeight: 500,
      color: COLORS.text,
      lineHeight: 1.5,
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    button: {
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 600,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    primaryButton: {
      backgroundColor: COLORS.accent,
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: COLORS.bgAlt,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
    },
    skipButton: {
      backgroundColor: 'transparent',
      color: COLORS.textMuted,
      border: 'none',
      fontSize: '13px',
    },
    errorBox: {
      padding: '12px 16px',
      backgroundColor: 'rgba(196, 91, 91, 0.1)',
      border: `1px solid ${COLORS.danger}`,
      borderRadius: '8px',
      color: COLORS.danger,
      fontSize: '14px',
      marginBottom: '16px',
    },
    specPreview: {
      backgroundColor: COLORS.bg,
      padding: '16px',
      borderRadius: '12px',
      marginTop: '20px',
      border: `1px solid ${COLORS.border}`,
    },
    specTitle: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.textMuted,
      marginBottom: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    featureList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    featureItem: {
      padding: '8px 0',
      borderBottom: `1px solid ${COLORS.border}`,
      fontSize: '14px',
      color: COLORS.text,
    },
    answersHistory: {
      marginTop: '20px',
      maxHeight: '200px',
      overflowY: 'auto' as const,
    },
    answerItem: {
      padding: '12px',
      backgroundColor: COLORS.bg,
      borderRadius: '8px',
      marginBottom: '8px',
      fontSize: '13px',
    },
    answerQuestion: {
      color: COLORS.textMuted,
      marginBottom: '4px',
    },
    answerText: {
      color: COLORS.text,
    },
    reviewSection: {
      marginBottom: '24px',
    },
    reviewTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '12px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      backgroundColor: COLORS.bg,
      padding: '16px',
      borderRadius: '12px',
      textAlign: 'center' as const,
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 700,
      color: COLORS.accent,
    },
    statLabel: {
      fontSize: '12px',
      color: COLORS.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
  };

  // Render based on step
  if (step === 'idea') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <span>🧭</span>
            Intent Capture
          </h2>
        </div>

        <p style={{ color: COLORS.textMuted, marginBottom: '24px', lineHeight: 1.6 }}>
          Describe your project idea and we'll ask strategic questions to build a precise specification.
          This improves accuracy by ~10% compared to just starting with a vague description.
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.formGroup}>
          <label style={styles.label}>What do you want to build?</label>
          <textarea
            style={styles.textarea}
            placeholder="e.g., A member management system for my church with attendance tracking, small groups, and giving management..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </div>

        <div style={styles.buttonRow}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleStartSession}
            disabled={isLoading || !idea.trim()}
          >
            {isLoading ? 'Starting...' : 'Start Guided Creation'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'questioning') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <span>{DOMAIN_ICONS[detectedDomain]}</span>
            {DOMAIN_LABELS[detectedDomain]}
          </h2>
          <div style={styles.badge}>
            Phase: {PHASE_LABELS[currentPhase] || currentPhase}
          </div>
        </div>

        {/* Progress Section */}
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Confidence Score</span>
            <span style={styles.progressValue}>{confidenceScore}%</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${confidenceScore}%` }} />
          </div>
          <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '8px' }}>
            Question {questionsAnswered + 1} of ~{totalQuestionsEstimate}
            {confidenceScore >= 80 && ' (Ready to complete!)'}
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Current Question */}
        <div style={styles.questionBox}>
          <p style={styles.questionText}>{currentQuestion}</p>
        </div>

        {/* Answer Input */}
        <div style={styles.formGroup}>
          <textarea
            style={{ ...styles.textarea, minHeight: '100px' }}
            placeholder="Your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleSubmitAnswer();
              }
            }}
          />
          <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '4px' }}>
            Press Cmd+Enter to submit
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonRow}>
          {confidenceScore >= 60 && (
            <button
              style={{ ...styles.button, ...styles.skipButton }}
              onClick={handleSkipToComplete}
              disabled={isLoading}
            >
              Skip to Review
            </button>
          )}
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmitAnswer}
            disabled={isLoading || !answer.trim()}
          >
            {isLoading ? 'Submitting...' : 'Continue'}
          </button>
        </div>

        {/* Partial Spec Preview */}
        {partialSpec && partialSpec.features.length > 0 && (
          <div style={styles.specPreview}>
            <div style={styles.specTitle}>Features Captured</div>
            <ul style={styles.featureList}>
              {partialSpec.features.slice(0, 5).map((feature, idx) => (
                <li key={idx} style={styles.featureItem}>
                  {feature.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Answers History */}
        {answers.length > 0 && (
          <div style={styles.answersHistory}>
            <div style={styles.specTitle}>Previous Answers</div>
            {answers.slice(-3).map((a, idx) => (
              <div key={idx} style={styles.answerItem}>
                <div style={styles.answerQuestion}>{a.question}</div>
                <div style={styles.answerText}>{a.answer}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Review step
  if (step === 'review' && taskSpec) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <span>✅</span>
            TaskSpec Complete
          </h2>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{taskSpec.complexity_score}</div>
            <div style={styles.statLabel}>Complexity</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{taskSpec.recommended_tracks}</div>
            <div style={styles.statLabel}>Tracks</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{taskSpec.features.length}</div>
            <div style={styles.statLabel}>Features</div>
          </div>
        </div>

        {/* Problem Statement */}
        <div style={styles.reviewSection}>
          <div style={styles.reviewTitle}>Problem Statement</div>
          <p style={{ color: COLORS.text, lineHeight: 1.6 }}>
            {taskSpec.problem_statement}
          </p>
        </div>

        {/* Features */}
        <div style={styles.reviewSection}>
          <div style={styles.reviewTitle}>Features ({taskSpec.features.length})</div>
          <ul style={styles.featureList}>
            {taskSpec.features.map((feature, idx) => (
              <li key={idx} style={styles.featureItem}>
                <strong>{feature.name}</strong>
                <span style={{ color: COLORS.textMuted, marginLeft: '8px' }}>
                  ({feature.priority})
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* User Roles */}
        <div style={styles.reviewSection}>
          <div style={styles.reviewTitle}>User Roles ({taskSpec.user_roles.length})</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {taskSpec.user_roles.map((role, idx) => (
              <span key={idx} style={styles.badge}>
                {role.name}
              </span>
            ))}
          </div>
        </div>

        {/* Constraints */}
        {(taskSpec.constraints.compliance.length > 0 ||
          taskSpec.constraints.security.length > 0) && (
          <div style={styles.reviewSection}>
            <div style={styles.reviewTitle}>Constraints</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {taskSpec.constraints.compliance.map((c, idx) => (
                <span key={`c-${idx}`} style={{ ...styles.badge, backgroundColor: 'rgba(196, 91, 91, 0.1)', color: COLORS.danger }}>
                  {c}
                </span>
              ))}
              {taskSpec.constraints.security.map((s, idx) => (
                <span key={`s-${idx}`} style={{ ...styles.badge, backgroundColor: 'rgba(91, 138, 91, 0.1)', color: COLORS.success }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleFinalComplete}
          >
            Continue to Stack Selection
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default IntentCaptureWizard;
