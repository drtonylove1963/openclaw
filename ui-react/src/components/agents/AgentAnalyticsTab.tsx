import { useMemo } from 'react';
import { GlassCard } from '../shared';
import { Sparkles, Activity, CheckCircle, TrendingUp } from 'lucide-react';
import { useAgentsStore } from '../../stores/agentsStore';

/**
 * AgentAnalyticsTab - Analytics and statistics for agents
 *
 * Features:
 * - Stats overview (total agents, active now, executions today, success rate)
 * - Category distribution chart
 * - Top agents by usage
 */
export function AgentAnalyticsTab() {
  const { agents, activeAgents } = useAgentsStore();

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAgents = agents.length;
    const activeNow = activeAgents.length;

    // Calculate executions today and success rate from agent execution history
    let executionsToday = 0;
    let successfulExecutions = 0;
    let totalExecutions = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    agents.forEach((agent) => {
      if (agent.executionHistory) {
        agent.executionHistory.forEach((execution) => {
          const execDate = new Date(execution.timestamp);
          execDate.setHours(0, 0, 0, 0);

          if (execDate.getTime() === today.getTime()) {
            executionsToday++;
          }

          totalExecutions++;
          if (execution.status === 'success') {
            successfulExecutions++;
          }
        });
      }
    });

    const successRate = totalExecutions > 0
      ? Math.round((successfulExecutions / totalExecutions) * 100)
      : 0;

    return {
      totalAgents,
      activeNow,
      executionsToday,
      successRate,
    };
  }, [agents, activeAgents]);

  // Calculate category distribution
  const categoryDistribution = useMemo(() => {
    const categories: Record<string, number> = {};

    agents.forEach((agent) => {
      const category = agent.category || 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / agents.length) * 100,
      }))
      .toSorted((a, b) => b.count - a.count);
  }, [agents]);

  // Calculate top agents by usage
  const topAgents = useMemo(() => {
    return agents
      .map((agent) => ({
        ...agent,
        executionCount: agent.executionHistory?.length || 0,
      }))
      .toSorted((a, b) => b.executionCount - a.executionCount)
      .slice(0, 5);
  }, [agents]);

  // Category colors
  const getCategoryColor = (index: number): string => {
    const colors = [
      '#00d4ff', // cyan
      '#8b5cf6', // purple
      '#10b981', // green
      '#f59e0b', // orange
      '#ef4444', // red
      '#06b6d4', // teal
      '#6366f1', // indigo
      '#ec4899', // pink
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-full overflow-auto ni-scrollbar">
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#f0f0f5',
          margin: '0 0 24px 0',
        }}
      >
        Agent Analytics
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Stats Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Total Agents */}
          <GlassCard
            variant="bordered"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Total Agents
              </span>
              <div
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                }}
              >
                <Sparkles size={20} style={{ color: '#00d4ff' }} />
              </div>
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#f0f0f5',
                lineHeight: 1,
              }}
            >
              {stats.totalAgents}
            </div>
          </GlassCard>

          {/* Active Now */}
          <GlassCard
            variant="bordered"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Active Now
              </span>
              <div
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <Activity size={20} style={{ color: '#10b981' }} />
              </div>
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#f0f0f5',
                lineHeight: 1,
              }}
            >
              {stats.activeNow}
            </div>
          </GlassCard>

          {/* Executions Today */}
          <GlassCard
            variant="bordered"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Executions Today
              </span>
              <div
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                }}
              >
                <TrendingUp size={20} style={{ color: '#8b5cf6' }} />
              </div>
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#f0f0f5',
                lineHeight: 1,
              }}
            >
              {stats.executionsToday}
            </div>
          </GlassCard>

          {/* Success Rate */}
          <GlassCard
            variant="bordered"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Success Rate
              </span>
              <div
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <CheckCircle size={20} style={{ color: '#10b981' }} />
              </div>
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#f0f0f5',
                lineHeight: 1,
              }}
            >
              {stats.successRate}%
            </div>
          </GlassCard>
        </div>

        {/* Category Distribution */}
        <GlassCard
          variant="bordered"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#f0f0f5',
              margin: 0,
            }}
          >
            Category Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categoryDistribution.map((category, index) => {
              const color = getCategoryColor(index);
              return (
                <div key={category.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#f0f0f5',
                      }}
                    >
                      {category.name}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#6b7280',
                      }}
                    >
                      {category.count} ({Math.round(category.percentage)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${category.percentage}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${color}80, ${color})`,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Top Agents by Usage */}
        <GlassCard
          variant="bordered"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#f0f0f5',
              margin: 0,
            }}
          >
            Top Agents by Usage
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center gap-3"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: index === 0
                      ? 'rgba(245, 158, 11, 0.2)'
                      : index === 1
                      ? 'rgba(209, 213, 219, 0.2)'
                      : index === 2
                      ? 'rgba(205, 127, 50, 0.2)'
                      : 'rgba(0, 212, 255, 0.1)',
                    border: `1px solid ${
                      index === 0
                        ? 'rgba(245, 158, 11, 0.4)'
                        : index === 1
                        ? 'rgba(209, 213, 219, 0.4)'
                        : index === 2
                        ? 'rgba(205, 127, 50, 0.4)'
                        : 'rgba(0, 212, 255, 0.2)'
                    }`,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: index === 0
                      ? '#f59e0b'
                      : index === 1
                      ? '#d1d5db'
                      : index === 2
                      ? '#cd7f32'
                      : '#00d4ff',
                  }}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#f0f0f5',
                      marginBottom: '2px',
                    }}
                  >
                    {agent.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                    }}
                  >
                    {agent.category}
                  </div>
                </div>

                <div
                  className="flex-shrink-0"
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#00d4ff',
                  }}
                >
                  {agent.executionCount} {agent.executionCount === 1 ? 'execution' : 'executions'}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
