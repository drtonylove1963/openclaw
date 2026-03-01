/**
 * ChatStatsHeader.tsx - Header bar showing model costs, token usage, and stats button
 * Matches the height and styling of the FilesPanel header bar.
 */

import React from 'react';
import { BarChart2, DollarSign, Zap, FolderOpen } from 'lucide-react';
import { useSessionStatsStore } from '../../stores/sessionStatsStore';
import type { ActiveProject } from '../../types/chat';

const THEME = {
  bg: {
    primary: '#0a1628',
    secondary: '#0f1f38',
    tertiary: '#1e3a5f',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
  accent: {
    primary: '#3b82f6',
    secondary: '#22c55e',
    warning: '#eab308',
    cyan: '#00D9FF',
  },
  border: '#1e3a5f',
};

interface ChatStatsHeaderProps {
  onToggleStats: () => void;
  isStatsOpen: boolean;
  currentProject?: ActiveProject | null;
}

export function ChatStatsHeader({ onToggleStats, isStatsOpen, currentProject }: ChatStatsHeaderProps) {
  const {
    totalInputTokens,
    totalOutputTokens,
    totalInputCost,
    totalOutputCost,
    totalCalls,
    getFormattedCost,
    getFormattedTokens,
  } = useSessionStatsStore();

  const totalTokens = totalInputTokens + totalOutputTokens;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${THEME.border}`,
        background: THEME.bg.secondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* Left: Project Context + Cost Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Project Context */}
        {currentProject && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: THEME.bg.tertiary,
              borderRadius: '6px',
              border: `1px solid ${THEME.accent.cyan}40`,
            }}
          >
            <FolderOpen size={14} color={THEME.accent.cyan} />
            <span style={{ fontSize: '12px', color: THEME.accent.cyan, fontWeight: 600 }}>
              {currentProject.name}
            </span>
          </div>
        )}
        {/* Cost Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DollarSign size={14} color={THEME.accent.secondary} />
          <span style={{ fontSize: '12px', color: THEME.text.primary, fontWeight: 500 }}>
            {getFormattedCost(totalInputCost)} Input
          </span>
          <span style={{ fontSize: '12px', color: THEME.text.secondary }}>/</span>
          <span style={{ fontSize: '12px', color: THEME.text.primary, fontWeight: 500 }}>
            {getFormattedCost(totalOutputCost)} Output
          </span>
        </div>
      </div>

      {/* Center: Token Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Zap size={14} color={THEME.accent.warning} />
        <span style={{ fontSize: '12px', color: THEME.text.secondary }}>Tokens:</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.text.primary }}>
          {getFormattedTokens(totalTokens)}
        </span>
        {totalCalls > 0 && (
          <span
            style={{
              fontSize: '10px',
              color: THEME.text.primary,
              background: THEME.bg.tertiary,
              padding: '2px 6px',
              borderRadius: '8px',
              marginLeft: '4px',
            }}
          >
            {totalCalls} {totalCalls === 1 ? 'call' : 'calls'}
          </span>
        )}
      </div>

      {/* Right: Stats Button */}
      <button
        onClick={onToggleStats}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: isStatsOpen ? THEME.accent.primary : THEME.bg.tertiary,
          border: `1px solid ${isStatsOpen ? THEME.accent.primary : THEME.border}`,
          borderRadius: '6px',
          color: isStatsOpen ? '#fff' : THEME.text.secondary,
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseOver={(e) => {
          if (!isStatsOpen) {
            e.currentTarget.style.background = THEME.bg.tertiary;
            e.currentTarget.style.borderColor = THEME.accent.primary;
            e.currentTarget.style.color = THEME.text.primary;
          }
        }}
        onMouseOut={(e) => {
          if (!isStatsOpen) {
            e.currentTarget.style.background = THEME.bg.tertiary;
            e.currentTarget.style.borderColor = THEME.border;
            e.currentTarget.style.color = THEME.text.secondary;
          }
        }}
      >
        <BarChart2 size={14} />
        Stats
      </button>
    </div>
  );
}

export default ChatStatsHeader;
