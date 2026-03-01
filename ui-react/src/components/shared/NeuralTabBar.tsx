import { type ReactNode } from 'react';

export interface TabDef<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

export interface NeuralTabBarProps<T extends string = string> {
  tabs: TabDef<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

/**
 * NeuralTabBar - Reusable glassmorphic tab bar component
 *
 * Generic tab navigation matching the neural design system.
 * Active tab has cyan accent background with glow.
 */
export function NeuralTabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: NeuralTabBarProps<T>) {
  return (
    <div className={`flex gap-[15px] ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className="relative flex items-center gap-2 text-[14px] font-medium transition-all duration-300 cursor-pointer border-0 outline-none"
            style={{
              padding: '12px 24px',
              background: isActive
                ? 'rgba(0, 212, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              border: isActive
                ? '1px solid rgba(0, 212, 255, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              color: isActive ? '#f0f0f5' : '#6b7280',
              boxShadow: isActive ? '0 0 20px rgba(0, 212, 255, 0.2)' : 'none',
            }}
          >
            {tab.icon && <span className="flex items-center">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="flex items-center justify-center text-[11px] font-bold"
                style={{
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  borderRadius: '10px',
                  background: 'rgba(0, 212, 255, 0.3)',
                  color: '#00d4ff',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
