/**
 * QuestionPrompt - Interactive question card component
 * Displays questions from the agent's ask_user_question tool
 * Allows users to select from options or provide custom input
 */
import React, { useState, useCallback } from 'react';
import { COLORS } from '../../styles/colors';
import type { CurrentQuestion, QuestionOption } from '../../types/chat';

interface QuestionPromptProps {
  question: CurrentQuestion;
  onSubmit: (answer: string, selectedOptions?: string[]) => void;
  isSubmitting?: boolean;
}

export function QuestionPrompt({ question, onSubmit, isSubmitting = false }: QuestionPromptProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleOptionClick = useCallback((option: QuestionOption) => {
    if (question.multiSelect) {
      // Toggle selection for multiSelect
      setSelectedOptions(prev => {
        const next = new Set(prev);
        if (next.has(option.label)) {
          next.delete(option.label);
        } else {
          next.add(option.label);
        }
        return next;
      });
      setShowCustomInput(false);
    } else {
      // Single select - submit immediately
      setSelectedOptions(new Set([option.label]));
      onSubmit(option.label, [option.label]);
    }
  }, [question.multiSelect, onSubmit]);

  const handleOtherClick = useCallback(() => {
    setShowCustomInput(true);
    setSelectedOptions(new Set());
  }, []);

  const handleSubmit = useCallback(() => {
    if (showCustomInput && customInput.trim()) {
      onSubmit(customInput.trim());
    } else if (selectedOptions.size > 0) {
      const optionsArray = Array.from(selectedOptions);
      onSubmit(optionsArray.join(', '), optionsArray);
    }
  }, [showCustomInput, customInput, selectedOptions, onSubmit]);

  const canSubmit = showCustomInput
    ? customInput.trim().length > 0
    : selectedOptions.size > 0;

  return (
    <div style={styles.container}>
      {/* Header badge */}
      <div style={styles.header}>
        <span style={styles.badge}>{question.header}</span>
        <span style={styles.questionIcon}>?</span>
      </div>

      {/* Question text */}
      <p style={styles.questionText}>{question.question}</p>

      {/* Options */}
      <div style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <button
            key={index}
            style={{
              ...styles.optionButton,
              ...(selectedOptions.has(option.label) ? styles.optionSelected : {}),
            }}
            onClick={() => handleOptionClick(option)}
            disabled={isSubmitting}
          >
            <span style={styles.optionLabel}>{option.label}</span>
            {option.description && (
              <span style={styles.optionDescription}>{option.description}</span>
            )}
            {question.multiSelect && (
              <span style={styles.checkbox}>
                {selectedOptions.has(option.label) ? '\u2713' : ''}
              </span>
            )}
          </button>
        ))}

        {/* Other option */}
        <button
          style={{
            ...styles.optionButton,
            ...styles.otherButton,
            ...(showCustomInput ? styles.optionSelected : {}),
          }}
          onClick={handleOtherClick}
          disabled={isSubmitting}
        >
          <span style={styles.optionLabel}>Other</span>
          <span style={styles.optionDescription}>Provide your own answer</span>
        </button>
      </div>

      {/* Custom input */}
      {showCustomInput && (
        <div style={styles.customInputContainer}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type your answer..."
            style={styles.customInput}
            autoFocus
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit && !isSubmitting) {
                handleSubmit();
              }
            }}
          />
        </div>
      )}

      {/* Submit button for multiSelect or custom input */}
      {(question.multiSelect || showCustomInput) && (
        <div style={styles.submitContainer}>
          <button
            style={{
              ...styles.submitButton,
              ...(canSubmit && !isSubmitting ? {} : styles.submitDisabled),
            }}
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: COLORS.bgPanel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '16px',
    margin: '12px 0',
    maxWidth: '600px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  badge: {
    background: COLORS.accentMuted,
    color: COLORS.accent,
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  questionIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: COLORS.accent,
    color: COLORS.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
  },
  questionText: {
    color: COLORS.text,
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  optionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    padding: '12px 16px',
    background: COLORS.bgHover,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  optionSelected: {
    background: COLORS.accentMuted,
    borderColor: COLORS.accent,
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: 500,
  },
  optionDescription: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  checkbox: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: `2px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.accent,
    fontWeight: 700,
    fontSize: '14px',
  },
  otherButton: {
    borderStyle: 'dashed',
  },
  customInputContainer: {
    marginTop: '12px',
  },
  customInput: {
    width: '100%',
    padding: '12px 16px',
    background: COLORS.input,
    border: `1px solid ${COLORS.inputBorder}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  submitContainer: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitButton: {
    padding: '10px 20px',
    background: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default QuestionPrompt;
