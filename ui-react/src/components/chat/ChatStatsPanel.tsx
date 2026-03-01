/**
 * ChatStatsPanel.tsx - Full-height sliding overlay panel with session statistics
 * Shows usage graphs, model breakdown, agent stats, and cost summary.
 */

import React, { useMemo } from 'react';
import { X, Activity, Cpu, Users, DollarSign, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { useSessionStatsStore, UsageDataPoint } from '../../stores/sessionStatsStore';

const THEME = {
  bg: {
    primary: '#0a1628',
    secondary: '#0f1f38',
    tertiary: '#1e3a5f',
    overlay: 'rgba(10, 22, 40, 0.95)',
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
    error: '#ef4444',
    purple: '#a855f7',
    cyan: '#00D9FF',
  },
  border: '#1e3a5f',
};

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#00D9FF', '#ef4444'];

interface ChatStatsPanelProps {
  onClose: () => void;
}

export function ChatStatsPanel({ onClose }: ChatStatsPanelProps) {
  const {
    totalInputTokens,
    totalOutputTokens,
    totalInputCost,
    totalOutputCost,
    totalCalls,
    modelUsage,
    agentUsage,
    usageHistory,
    startTime,
    getFormattedCost,
    getFormattedTokens,
  } = useSessionStatsStore();

  // Prepare chart data - aggregate by minute for cleaner visualization
  const chartData = useMemo(() => {
    if (usageHistory.length === 0) {return [];}

    const aggregated: Record<string, { time: string; input: number; output: number }> = {};

    usageHistory.forEach((point: UsageDataPoint) => {
      const timeKey = new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (!aggregated[timeKey]) {
        aggregated[timeKey] = { time: timeKey, input: 0, output: 0 };
      }
      aggregated[timeKey].input += point.inputTokens;
      aggregated[timeKey].output += point.outputTokens;
    });

    return Object.values(aggregated);
  }, [usageHistory]);

  // Prepare model data for display
  const modelData = useMemo(() => {
    return Object.entries(modelUsage).map(([model, usage]) => ({
      name: model,
      calls: usage.calls,
      tokens: usage.inputTokens + usage.outputTokens,
      cost: usage.inputCost + usage.outputCost,
    }));
  }, [modelUsage]);

  // Prepare agent data for display
  const agentData = useMemo(() => {
    return Object.entries(agentUsage).map(([agent, usage]) => ({
      name: agent,
      calls: usage.calls,
      tokens: usage.inputTokens + usage.outputTokens,
      model: usage.model,
    }));
  }, [agentUsage]);

  const totalCost = totalInputCost + totalOutputCost;
  const totalTokens = totalInputTokens + totalOutputTokens;
  const sessionDuration = Math.round((Date.now() - new Date(startTime).getTime()) / 60000);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: THEME.bg.overlay,
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideDown 0.2s ease-out',
      }}
    >
      {/* Inject animation keyframes */}
      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: THEME.bg.secondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color={THEME.accent.cyan} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: THEME.text.primary }}>
            Session Statistics
          </span>
          <span
            style={{
              fontSize: '11px',
              color: THEME.text.muted,
              background: THEME.bg.tertiary,
              padding: '3px 8px',
              borderRadius: '10px',
            }}
          >
            {sessionDuration} min
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: THEME.text.muted,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = THEME.bg.tertiary;
            e.currentTarget.style.color = THEME.text.primary;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = THEME.text.muted;
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {/* Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <SummaryCard
            icon={<Zap size={18} />}
            label="Total Tokens"
            value={getFormattedTokens(totalTokens)}
            subValue={`${getFormattedTokens(totalInputTokens)} in / ${getFormattedTokens(totalOutputTokens)} out`}
            color={THEME.accent.warning}
          />
          <SummaryCard
            icon={<DollarSign size={18} />}
            label="Total Cost"
            value={getFormattedCost(totalCost)}
            subValue={`${getFormattedCost(totalInputCost)} in / ${getFormattedCost(totalOutputCost)} out`}
            color={THEME.accent.secondary}
          />
          <SummaryCard
            icon={<Cpu size={18} />}
            label="API Calls"
            value={totalCalls.toString()}
            subValue={`${modelData.length} model${modelData.length !== 1 ? 's' : ''}`}
            color={THEME.accent.primary}
          />
          <SummaryCard
            icon={<Users size={18} />}
            label="Agents Used"
            value={agentData.length.toString()}
            subValue={agentData.length > 0 ? agentData.map((a) => a.name).join(', ') : 'None'}
            color={THEME.accent.purple}
          />
        </div>

        {/* Usage Chart */}
        {chartData.length > 0 && (
          <div
            style={{
              background: THEME.bg.secondary,
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: THEME.text.primary,
                marginBottom: '16px',
              }}
            >
              Token Usage Over Time
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="time" stroke={THEME.text.muted} fontSize={11} />
                <YAxis stroke={THEME.text.muted} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: THEME.bg.primary,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '8px',
                    color: THEME.text.primary,
                  }}
                />
                <Legend />
                <Bar dataKey="input" name="Input" fill={THEME.accent.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="output" name="Output" fill={THEME.accent.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Two Column Layout for Models and Agents */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Models Table */}
          <div
            style={{
              background: THEME.bg.secondary,
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${THEME.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Cpu size={16} color={THEME.accent.primary} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.text.primary }}>
                Models Used
              </span>
            </div>
            {modelData.length > 0 ? (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {modelData.map((model, index) => (
                  <div
                    key={model.name}
                    style={{
                      padding: '10px 16px',
                      borderBottom: index < modelData.length - 1 ? `1px solid ${THEME.border}` : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', color: THEME.text.primary, fontWeight: 500 }}>
                        {model.name}
                      </div>
                      <div style={{ fontSize: '11px', color: THEME.text.muted }}>
                        {model.calls} call{model.calls !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: THEME.text.secondary }}>
                        {getFormattedTokens(model.tokens)} tokens
                      </div>
                      <div style={{ fontSize: '11px', color: THEME.accent.secondary }}>
                        {getFormattedCost(model.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: THEME.text.muted, fontSize: '13px' }}>
                No models used yet
              </div>
            )}
          </div>

          {/* Agents Table */}
          <div
            style={{
              background: THEME.bg.secondary,
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${THEME.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={16} color={THEME.accent.purple} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.text.primary }}>
                Agents Used
              </span>
            </div>
            {agentData.length > 0 ? (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {agentData.map((agent, index) => (
                  <div
                    key={agent.name}
                    style={{
                      padding: '10px 16px',
                      borderBottom: index < agentData.length - 1 ? `1px solid ${THEME.border}` : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', color: THEME.text.primary, fontWeight: 500 }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '11px', color: THEME.text.muted }}>
                        {agent.calls} call{agent.calls !== 1 ? 's' : ''} • {agent.model}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: THEME.text.secondary }}>
                      {getFormattedTokens(agent.tokens)} tokens
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: THEME.text.muted, fontSize: '13px' }}>
                No agents used yet
              </div>
            )}
          </div>
        </div>

        {/* Cost Summary Footer */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: THEME.bg.secondary,
            border: `1px solid ${THEME.border}`,
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
          }}
        >
          <CostItem label="Input Cost" value={getFormattedCost(totalInputCost)} color={THEME.accent.primary} />
          <div style={{ width: '1px', background: THEME.border }} />
          <CostItem label="Output Cost" value={getFormattedCost(totalOutputCost)} color={THEME.accent.secondary} />
          <div style={{ width: '1px', background: THEME.border }} />
          <CostItem label="Total Cost" value={getFormattedCost(totalCost)} color={THEME.accent.warning} highlight />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function SummaryCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: THEME.bg.secondary,
        border: `1px solid ${THEME.border}`,
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: '12px', color: THEME.text.muted }}>{label}</span>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: THEME.text.primary, marginBottom: '4px' }}>
        {value}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: THEME.text.muted,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {subValue}
      </div>
    </div>
  );
}

function CostItem({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: THEME.text.muted, marginBottom: '4px' }}>{label}</div>
      <div
        style={{
          fontSize: highlight ? '18px' : '16px',
          fontWeight: highlight ? 700 : 600,
          color: highlight ? color : THEME.text.primary,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default ChatStatsPanel;
