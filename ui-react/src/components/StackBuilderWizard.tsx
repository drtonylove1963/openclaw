import React, { useState } from 'react';
import { COLORS } from '../styles/colors';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TaskSpec {
  problem_statement: string;
  features: Array<{ name: string; description: string; priority: string }>;
  domain: string;
  complexity_score: number;
  recommended_tracks: number;
  constraints?: {
    compliance?: string[];
  };
}

export interface StackOption {
  id: string;
  name: string;
  tier: 'optimal' | 'balanced' | 'rapid';
  frontend: string;
  backend: string;
  database: string;
  hosting: string;
  costEstimate: string;
  complexity: 'high' | 'medium' | 'low';
  description: string;
  tags: string[];
}

interface StackBuilderWizardProps {
  taskSpec: TaskSpec;
  onComplete: (selectedStack: StackOption) => void;
  onBack: () => void;
  onCancel: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STACK OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const STACK_OPTIONS: Record<string, StackOption[]> = {
  saas: [
    {
      id: 'saas-optimal',
      name: 'Enterprise SaaS',
      tier: 'optimal',
      frontend: 'Next.js 14 + TypeScript',
      backend: 'NestJS + GraphQL',
      database: 'PostgreSQL + Redis',
      hosting: 'AWS + Kubernetes',
      costEstimate: '$200-500/mo',
      complexity: 'high',
      description: 'Future-proof enterprise architecture with microservices',
      tags: ['Scalable', 'Enterprise', 'Microservices'],
    },
    {
      id: 'saas-balanced',
      name: 'Modern SaaS',
      tier: 'balanced',
      frontend: 'Next.js 14 + TypeScript',
      backend: 'FastAPI + REST',
      database: 'Supabase (PostgreSQL)',
      hosting: 'Vercel + Railway',
      costEstimate: '$50-150/mo',
      complexity: 'medium',
      description: 'Recommended balance of features and simplicity',
      tags: ['Recommended', 'Modern', 'Serverless'],
    },
    {
      id: 'saas-rapid',
      name: 'Rapid MVP',
      tier: 'rapid',
      frontend: 'HTMX + Alpine.js',
      backend: 'Flask + REST',
      database: 'SQLite → PostgreSQL',
      hosting: 'Railway',
      costEstimate: '$0-25/mo',
      complexity: 'low',
      description: 'Fastest path to market, easy to scale later',
      tags: ['Quick', 'Simple', 'Cost-effective'],
    },
  ],
  ecommerce: [
    {
      id: 'ecom-optimal',
      name: 'Enterprise Commerce',
      tier: 'optimal',
      frontend: 'Next.js + Shopify Storefront',
      backend: 'Node.js + Medusa',
      database: 'PostgreSQL + Redis + Elasticsearch',
      hosting: 'Vercel + AWS',
      costEstimate: '$300-800/mo',
      complexity: 'high',
      description: 'High-volume commerce with headless CMS',
      tags: ['Enterprise', 'Headless', 'High-volume'],
    },
    {
      id: 'ecom-balanced',
      name: 'Modern Store',
      tier: 'balanced',
      frontend: 'Next.js Commerce',
      backend: 'FastAPI + Stripe',
      database: 'Supabase + Redis',
      hosting: 'Vercel',
      costEstimate: '$75-200/mo',
      complexity: 'medium',
      description: 'Full-featured store with great DX',
      tags: ['Recommended', 'Stripe', 'Modern'],
    },
    {
      id: 'ecom-rapid',
      name: 'Quick Store',
      tier: 'rapid',
      frontend: 'Astro + React',
      backend: 'Stripe Checkout (hosted)',
      database: 'Airtable → Supabase',
      hosting: 'Netlify',
      costEstimate: '$0-50/mo',
      complexity: 'low',
      description: 'Launch fast with hosted payment pages',
      tags: ['Quick', 'No-code Backend', 'Simple'],
    },
  ],
  healthcare: [
    {
      id: 'health-optimal',
      name: 'Enterprise Healthcare',
      tier: 'optimal',
      frontend: 'React + TypeScript',
      backend: 'Spring Boot + FHIR',
      database: 'PostgreSQL + MongoDB',
      hosting: 'AWS GovCloud',
      costEstimate: '$500-2000/mo',
      complexity: 'high',
      description: 'HIPAA-compliant enterprise platform',
      tags: ['HIPAA', 'FHIR', 'Enterprise'],
    },
    {
      id: 'health-balanced',
      name: 'Secure Health App',
      tier: 'balanced',
      frontend: 'Next.js + TypeScript',
      backend: 'FastAPI + HIPAA middleware',
      database: 'Supabase (encrypted)',
      hosting: 'Railway + Cloudflare',
      costEstimate: '$100-300/mo',
      complexity: 'medium',
      description: 'HIPAA-ready with encryption at rest',
      tags: ['Recommended', 'HIPAA-ready', 'Secure'],
    },
    {
      id: 'health-rapid',
      name: 'Health MVP',
      tier: 'rapid',
      frontend: 'React',
      backend: 'Flask + basic auth',
      database: 'PostgreSQL (encrypted)',
      hosting: 'Heroku',
      costEstimate: '$50-100/mo',
      complexity: 'low',
      description: 'Basic compliance, upgrade path clear',
      tags: ['MVP', 'Upgrade Path', 'Simple'],
    },
  ],
  default: [
    {
      id: 'default-optimal',
      name: 'Full-Stack Pro',
      tier: 'optimal',
      frontend: 'Next.js 14 + TypeScript',
      backend: 'NestJS + Prisma',
      database: 'PostgreSQL + Redis',
      hosting: 'Vercel + Railway',
      costEstimate: '$100-300/mo',
      complexity: 'high',
      description: 'Production-ready with all the bells and whistles',
      tags: ['Full-featured', 'TypeScript', 'Scalable'],
    },
    {
      id: 'default-balanced',
      name: 'Modern Stack',
      tier: 'balanced',
      frontend: 'Next.js 14 + TypeScript',
      backend: 'FastAPI',
      database: 'Supabase',
      hosting: 'Vercel',
      costEstimate: '$25-100/mo',
      complexity: 'medium',
      description: 'Great developer experience with modern tools',
      tags: ['Recommended', 'Modern', 'Easy'],
    },
    {
      id: 'default-rapid',
      name: 'Quick Start',
      tier: 'rapid',
      frontend: 'HTMX + Tailwind',
      backend: 'Flask',
      database: 'SQLite',
      hosting: 'Railway',
      costEstimate: '$0-25/mo',
      complexity: 'low',
      description: 'Ship fast, iterate later',
      tags: ['Quick', 'Simple', 'Free Tier'],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function StackBuilderWizard({ taskSpec, onComplete, onBack, onCancel }: StackBuilderWizardProps) {
  const [selectedStack, setSelectedStack] = useState<StackOption | null>(null);

  // Get stacks based on domain
  const domain = taskSpec.domain || 'default';
  const stacks = STACK_OPTIONS[domain] || STACK_OPTIONS.default;

  const styles = {
    container: {
      backgroundColor: COLORS.card,
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '900px',
      margin: '0 auto',
      border: `1px solid ${COLORS.border}`,
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      color: COLORS.text,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    subtitle: {
      color: COLORS.textMuted,
      fontSize: '14px',
      lineHeight: 1.6,
    },
    contextBox: {
      backgroundColor: COLORS.bg,
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: `1px solid ${COLORS.border}`,
    },
    contextTitle: {
      fontSize: '13px',
      fontWeight: 600,
      color: COLORS.textMuted,
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    contextText: {
      color: COLORS.text,
      fontSize: '14px',
    },
    stacksGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    stackCard: {
      backgroundColor: COLORS.bg,
      borderRadius: '12px',
      padding: '20px',
      border: `2px solid ${COLORS.border}`,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    stackCardSelected: {
      borderColor: COLORS.accent,
      backgroundColor: `${COLORS.accent}10`,
    },
    stackTier: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
    },
    tierBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
    },
    optimalBadge: {
      backgroundColor: 'rgba(91, 138, 196, 0.15)',
      color: '#5B8AC4',
    },
    balancedBadge: {
      backgroundColor: 'rgba(91, 196, 91, 0.15)',
      color: COLORS.success,
    },
    rapidBadge: {
      backgroundColor: 'rgba(196, 166, 91, 0.15)',
      color: '#C4A65B',
    },
    stackName: {
      fontSize: '16px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '8px',
    },
    stackDescription: {
      fontSize: '13px',
      color: COLORS.textMuted,
      marginBottom: '16px',
      lineHeight: 1.5,
    },
    techList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      marginBottom: '16px',
    },
    techItem: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      padding: '6px 0',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    techLabel: {
      color: COLORS.textMuted,
    },
    techValue: {
      color: COLORS.text,
      fontWeight: 500,
    },
    costRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '12px',
      borderTop: `1px solid ${COLORS.border}`,
    },
    costLabel: {
      fontSize: '12px',
      color: COLORS.textMuted,
    },
    costValue: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.accent,
    },
    tags: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap' as const,
      marginBottom: '12px',
    },
    tag: {
      padding: '2px 8px',
      backgroundColor: COLORS.bgAlt,
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 500,
      color: COLORS.textMuted,
    },
    recommendedTag: {
      backgroundColor: `${COLORS.success}20`,
      color: COLORS.success,
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
    selectedPreview: {
      backgroundColor: COLORS.bg,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: `2px solid ${COLORS.accent}`,
    },
    previewTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: '12px',
    },
    previewGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    },
    previewItem: {
      fontSize: '13px',
    },
    previewLabel: {
      color: COLORS.textMuted,
      marginBottom: '2px',
    },
    previewValue: {
      color: COLORS.text,
      fontWeight: 500,
    },
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'optimal':
        return { ...styles.tierBadge, ...styles.optimalBadge };
      case 'balanced':
        return { ...styles.tierBadge, ...styles.balancedBadge };
      case 'rapid':
        return { ...styles.tierBadge, ...styles.rapidBadge };
      default:
        return styles.tierBadge;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'optimal':
        return 'Optimal';
      case 'balanced':
        return 'Balanced';
      case 'rapid':
        return 'Rapid';
      default:
        return tier;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'optimal':
        return '⚡';
      case 'balanced':
        return '⭐';
      case 'rapid':
        return '🚀';
      default:
        return '📦';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <span>🔧</span>
          Stack Builder
        </h2>
        <p style={styles.subtitle}>
          Choose your technology stack. We've pre-selected options based on your project requirements.
        </p>
      </div>

      {/* Context from TaskSpec */}
      <div style={styles.contextBox}>
        <div style={styles.contextTitle}>Based on your requirements</div>
        <div style={styles.contextText}>
          <strong>{taskSpec.features.length} features</strong> •
          Complexity: <strong>{taskSpec.complexity_score}/100</strong> •
          Domain: <strong>{taskSpec.domain}</strong>
          {taskSpec.constraints?.compliance?.length ? (
            <> • Compliance: <strong>{taskSpec.constraints.compliance.join(', ')}</strong></>
          ) : null}
        </div>
      </div>

      {/* Stack Options */}
      <div style={styles.stacksGrid}>
        {stacks.map((stack) => (
          <div
            key={stack.id}
            style={{
              ...styles.stackCard,
              ...(selectedStack?.id === stack.id ? styles.stackCardSelected : {}),
            }}
            onClick={() => setSelectedStack(stack)}
          >
            <div style={styles.stackTier}>
              <span style={getTierBadgeStyle(stack.tier)}>
                {getTierIcon(stack.tier)} {getTierLabel(stack.tier)}
              </span>
              <span style={{ fontSize: '18px' }}>
                {stack.tier === 'balanced' ? '✓' : ''}
              </span>
            </div>

            <h3 style={styles.stackName}>{stack.name}</h3>

            <div style={styles.tags}>
              {stack.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    ...styles.tag,
                    ...(tag === 'Recommended' ? styles.recommendedTag : {}),
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <p style={styles.stackDescription}>{stack.description}</p>

            <ul style={styles.techList}>
              <li style={styles.techItem}>
                <span style={styles.techLabel}>Frontend</span>
                <span style={styles.techValue}>{stack.frontend}</span>
              </li>
              <li style={styles.techItem}>
                <span style={styles.techLabel}>Backend</span>
                <span style={styles.techValue}>{stack.backend}</span>
              </li>
              <li style={styles.techItem}>
                <span style={styles.techLabel}>Database</span>
                <span style={styles.techValue}>{stack.database}</span>
              </li>
              <li style={styles.techItem}>
                <span style={styles.techLabel}>Hosting</span>
                <span style={styles.techValue}>{stack.hosting}</span>
              </li>
            </ul>

            <div style={styles.costRow}>
              <span style={styles.costLabel}>Est. Monthly Cost</span>
              <span style={styles.costValue}>{stack.costEstimate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Stack Preview */}
      {selectedStack && (
        <div style={styles.selectedPreview}>
          <div style={styles.previewTitle}>
            Selected: {selectedStack.name}
          </div>
          <div style={styles.previewGrid}>
            <div style={styles.previewItem}>
              <div style={styles.previewLabel}>Frontend</div>
              <div style={styles.previewValue}>{selectedStack.frontend}</div>
            </div>
            <div style={styles.previewItem}>
              <div style={styles.previewLabel}>Backend</div>
              <div style={styles.previewValue}>{selectedStack.backend}</div>
            </div>
            <div style={styles.previewItem}>
              <div style={styles.previewLabel}>Database</div>
              <div style={styles.previewValue}>{selectedStack.database}</div>
            </div>
            <div style={styles.previewItem}>
              <div style={styles.previewLabel}>Hosting</div>
              <div style={styles.previewValue}>{selectedStack.hosting}</div>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={styles.buttonRow}>
        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={onBack}
        >
          Back
        </button>
        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={() => selectedStack && onComplete(selectedStack)}
          disabled={!selectedStack}
        >
          Continue to Execution
        </button>
      </div>
    </div>
  );
}

export default StackBuilderWizard;
