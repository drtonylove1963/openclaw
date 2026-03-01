/**
 * PhaseSelector - Select which phase of the Universal Agent pipeline to run
 *
 * Phases:
 * - Auto: Agent decides based on message content (default)
 * - Discovery: Ex Nihilo requirements gathering
 * - Planning: Architecture and design
 * - Implementation: Code generation
 * - Validation: Testing and security
 * - Refinement: Bug fixes and improvements
 * - Delivery: Packaging and deployment
 */
import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../../styles/colors';

export type TaskPhase = 'auto' | 'discovery' | 'planning' | 'implementation' | 'validation' | 'refinement' | 'delivery';

interface PhaseSelectorProps {
  selectedPhase: TaskPhase;
  onPhaseChange: (phase: TaskPhase) => void;
  disabled?: boolean;
}

const PHASES: { value: TaskPhase; label: string; icon: string; description: string }[] = [
  { value: 'auto', label: 'Auto', icon: 'A', description: 'Agent decides based on your message' },
  { value: 'discovery', label: 'Discovery', icon: 'D', description: 'Requirements gathering with Ex Nihilo' },
  { value: 'planning', label: 'Planning', icon: 'P', description: 'Architecture and system design' },
  { value: 'implementation', label: 'Implementation', icon: 'I', description: 'Code generation and development' },
  { value: 'validation', label: 'Validation', icon: 'V', description: 'Testing and security checks' },
  { value: 'refinement', label: 'Refinement', icon: 'R', description: 'Bug fixes and improvements' },
  { value: 'delivery', label: 'Delivery', icon: 'L', description: 'Packaging and deployment' },
];

export function PhaseSelector({ selectedPhase, onPhaseChange, disabled = false }: PhaseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPhaseInfo = PHASES.find(p => p.value === selectedPhase) || PHASES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'relative',
      display: 'inline-block',
    },
    trigger: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '6px',
      background: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s ease',
    },
    triggerHover: {
      borderColor: COLORS.accent,
    },
    phaseIcon: {
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      background: `${COLORS.accent}30`,
      color: COLORS.accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 600,
    },
    label: {
      fontSize: '12px',
      color: COLORS.text,
      fontWeight: 500,
    },
    chevron: {
      width: '12px',
      height: '12px',
      color: COLORS.textMuted,
      transition: 'transform 0.2s ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    },
    dropdown: {
      position: 'absolute',
      bottom: 'calc(100% + 4px)',
      right: 0,
      width: '240px',
      background: COLORS.bgAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
      zIndex: 100,
      overflow: 'hidden',
    },
    option: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '10px 12px',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    },
    optionHover: {
      background: `${COLORS.accent}15`,
    },
    optionSelected: {
      background: `${COLORS.accent}25`,
    },
    optionIcon: {
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      background: `${COLORS.accent}30`,
      color: COLORS.accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 600,
      flexShrink: 0,
    },
    optionContent: {
      flex: 1,
      minWidth: 0,
    },
    optionLabel: {
      fontSize: '13px',
      fontWeight: 500,
      color: COLORS.text,
      marginBottom: '2px',
    },
    optionDescription: {
      fontSize: '11px',
      color: COLORS.textMuted,
      lineHeight: 1.3,
    },
  };

  const handleSelect = (phase: TaskPhase) => {
    onPhaseChange(phase);
    setIsOpen(false);
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <div
        style={styles.trigger}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        title={`Phase: ${selectedPhaseInfo.label}`}
      >
        <div style={styles.phaseIcon}>{selectedPhaseInfo.icon}</div>
        <span style={styles.label}>{selectedPhaseInfo.label}</span>
        <svg style={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isOpen && (
        <div style={styles.dropdown}>
          {PHASES.map(phase => (
            <div
              key={phase.value}
              style={{
                ...styles.option,
                ...(phase.value === selectedPhase ? styles.optionSelected : {}),
              }}
              onClick={() => handleSelect(phase.value)}
              onMouseEnter={(e) => {
                if (phase.value !== selectedPhase) {
                  e.currentTarget.style.background = `${COLORS.accent}15`;
                }
              }}
              onMouseLeave={(e) => {
                if (phase.value !== selectedPhase) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={styles.optionIcon}>{phase.icon}</div>
              <div style={styles.optionContent}>
                <div style={styles.optionLabel}>{phase.label}</div>
                <div style={styles.optionDescription}>{phase.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
