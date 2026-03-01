import { useEffect } from 'react';
import { CreditCard, TrendingUp, Zap, Users, Building2, Check, type LucideIcon } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { NeuralButton } from '../shared/NeuralModal';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuth } from '../../contexts/AuthContext';

type TierType = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';

interface TierFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  team: boolean | string;
  enterprise: boolean | string;
}

const TIER_FEATURES: TierFeature[] = [
  {
    name: 'Agents per session',
    free: '1',
    pro: '5',
    team: '25',
    enterprise: 'Unlimited',
  },
  {
    name: 'One-shot executions',
    free: '10/month',
    pro: '100/month',
    team: '500/month',
    enterprise: 'Unlimited',
  },
  {
    name: 'Context window',
    free: '7K tokens',
    pro: '50K tokens',
    team: '100K tokens',
    enterprise: '200K tokens',
  },
  {
    name: 'Custom agents',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    name: 'Priority support',
    free: false,
    pro: true,
    team: true,
    enterprise: true,
  },
  {
    name: 'Team collaboration',
    free: false,
    pro: false,
    team: true,
    enterprise: true,
  },
  {
    name: 'Dedicated infrastructure',
    free: false,
    pro: false,
    team: false,
    enterprise: true,
  },
];

const TIER_ICONS: Record<TierType, LucideIcon> = {
  FREE: Zap,
  PRO: TrendingUp,
  TEAM: Users,
  ENTERPRISE: Building2,
};

const TIER_COLORS: Record<TierType, string> = {
  FREE: '#6b7280',
  PRO: '#00d4ff',
  TEAM: '#8b5cf6',
  ENTERPRISE: '#f59e0b',
};

const TIER_PRICES: Record<TierType, string> = {
  FREE: '$0',
  PRO: '$29',
  TEAM: '$99',
  ENTERPRISE: 'Custom',
};

export function BillingTab() {
  const { user } = useAuth();
  const { billing, loadBilling } = useSettingsStore();

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const currentTier = (billing?.tier || user?.role || 'FREE') as TierType;

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) {return 0;}
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Current Tier */}
      <GlassCard variant="highlighted" glowColor={TIER_COLORS[currentTier]} style={{ padding: '32px' }}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `${TIER_COLORS[currentTier]}20`,
                border: `1px solid ${TIER_COLORS[currentTier]}40`,
                color: TIER_COLORS[currentTier],
              }}
            >
              {(() => {
                const Icon = TIER_ICONS[currentTier];
                return <Icon size={28} />;
              })()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-[28px] font-bold" style={{ color: '#f0f0f5' }}>
                  {currentTier}
                </h2>
                <div
                  className="text-[16px] font-semibold px-4 py-1 rounded-full"
                  style={{
                    background: `${TIER_COLORS[currentTier]}20`,
                    color: TIER_COLORS[currentTier],
                  }}
                >
                  Current Plan
                </div>
              </div>
              <p className="text-[15px]" style={{ color: '#6b7280' }}>
                {currentTier === 'FREE' && 'Get started with basic features'}
                {currentTier === 'PRO' && 'Perfect for individual developers'}
                {currentTier === 'TEAM' && 'Collaborate with your team'}
                {currentTier === 'ENTERPRISE' && 'Custom solutions for organizations'}
              </p>
            </div>
          </div>

          {currentTier !== 'ENTERPRISE' && (
            <NeuralButton variant="primary">
              Upgrade Plan
            </NeuralButton>
          )}
        </div>

        {/* Usage Stats */}
        {billing && (
          <div className="grid grid-cols-2 gap-4">
            {/* Agents Usage */}
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium" style={{ color: '#6b7280' }}>
                  Agents Used
                </span>
                <span className="text-[14px] font-semibold" style={{ color: '#f0f0f5' }}>
                  {billing.agents_used} / {billing.agents_limit === -1 ? '∞' : billing.agents_limit}
                </span>
              </div>
              <div
                className="relative w-full h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-300"
                  style={{
                    width: `${getUsagePercentage(billing.agents_used, billing.agents_limit)}%`,
                    background: `linear-gradient(90deg, ${TIER_COLORS[currentTier]} 0%, ${TIER_COLORS[currentTier]}80 100%)`,
                  }}
                />
              </div>
            </div>

            {/* One-shots Usage */}
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium" style={{ color: '#6b7280' }}>
                  One-shots Used
                </span>
                <span className="text-[14px] font-semibold" style={{ color: '#f0f0f5' }}>
                  {billing.oneshots_used} / {billing.oneshots_limit === -1 ? '∞' : billing.oneshots_limit}
                </span>
              </div>
              <div
                className="relative w-full h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-300"
                  style={{
                    width: `${getUsagePercentage(billing.oneshots_used, billing.oneshots_limit)}%`,
                    background: `linear-gradient(90deg, ${TIER_COLORS[currentTier]} 0%, ${TIER_COLORS[currentTier]}80 100%)`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Pricing Tiers */}
      <div>
        <h2 className="text-[24px] font-semibold mb-4" style={{ color: '#f0f0f5' }}>
          Available Plans
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {(['FREE', 'PRO', 'TEAM', 'ENTERPRISE'] as const).map((tier) => {
            const Icon = TIER_ICONS[tier];
            const isCurrent = tier === currentTier;

            return (
              <GlassCard
                key={tier}
                variant={isCurrent ? 'highlighted' : 'bordered'}
                glowColor={isCurrent ? TIER_COLORS[tier] : undefined}
                style={{ padding: '24px' }}
              >
                <div className="flex flex-col h-full">
                  {/* Tier Header */}
                  <div className="mb-4">
                    <div
                      className="flex items-center justify-center mb-3"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `${TIER_COLORS[tier]}20`,
                        border: `1px solid ${TIER_COLORS[tier]}40`,
                        color: TIER_COLORS[tier],
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 className="text-[18px] font-bold mb-1" style={{ color: '#f0f0f5' }}>
                      {tier}
                    </h3>
                    <div className="text-[24px] font-bold" style={{ color: TIER_COLORS[tier] }}>
                      {TIER_PRICES[tier]}
                      {tier !== 'ENTERPRISE' && tier !== 'FREE' && (
                        <span className="text-[14px] font-normal" style={{ color: '#6b7280' }}>
                          /month
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current Badge */}
                  {isCurrent && (
                    <div
                      className="text-[12px] font-semibold text-center mb-4 py-2 px-3 rounded-lg"
                      style={{
                        background: `${TIER_COLORS[tier]}20`,
                        color: TIER_COLORS[tier],
                      }}
                    >
                      Current Plan
                    </div>
                  )}

                  {/* Action Button */}
                  {!isCurrent && (
                    <NeuralButton
                      variant={tier === 'PRO' ? 'primary' : 'secondary'}
                      className="w-full mb-4"
                    >
                      {tier === 'ENTERPRISE' ? 'Contact Sales' : 'Upgrade'}
                    </NeuralButton>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison */}
      <div>
        <h2 className="text-[24px] font-semibold mb-4" style={{ color: '#f0f0f5' }}>
          Feature Comparison
        </h2>
        <GlassCard variant="bordered" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <th
                  className="text-left text-[13px] font-semibold"
                  style={{ padding: '16px 24px', color: '#6b7280' }}
                >
                  Feature
                </th>
                {(['FREE', 'PRO', 'TEAM', 'ENTERPRISE'] as const).map((tier) => (
                  <th
                    key={tier}
                    className="text-center text-[13px] font-semibold"
                    style={{
                      padding: '16px 24px',
                      color: tier === currentTier ? TIER_COLORS[tier] : '#6b7280',
                    }}
                  >
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIER_FEATURES.map((feature, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom:
                      index < TIER_FEATURES.length - 1
                        ? '1px solid rgba(255, 255, 255, 0.04)'
                        : 'none',
                  }}
                >
                  <td
                    className="text-[14px]"
                    style={{ padding: '16px 24px', color: '#f0f0f5' }}
                  >
                    {feature.name}
                  </td>
                  {(['free', 'pro', 'team', 'enterprise'] as const).map((tier) => {
                    const value = feature[tier];
                    const tierUpper = tier.toUpperCase() as TierType;
                    const color = tierUpper === currentTier ? TIER_COLORS[tierUpper] : '#6b7280';

                    return (
                      <td
                        key={tier}
                        className="text-center"
                        style={{ padding: '16px 24px' }}
                      >
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check size={18} style={{ color, margin: '0 auto' }} />
                          ) : (
                            <span style={{ color: '#374151' }}>—</span>
                          )
                        ) : (
                          <span className="text-[13px] font-medium" style={{ color }}>
                            {value}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
