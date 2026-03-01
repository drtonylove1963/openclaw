import { useEffect } from 'react';
import { User, Key, Sliders, CreditCard } from 'lucide-react';
import { NeuralTabBar, type TabDef } from '../../components/shared/NeuralTabBar';
import { useSettingsStore } from '../../stores/settingsStore';
import { ProfileTab } from '../../components/settings/ProfileTab';
import { ApiKeysTab } from '../../components/settings/ApiKeysTab';
import { PreferencesTab } from '../../components/settings/PreferencesTab';
import { BillingTab } from '../../components/settings/BillingTab';

type SettingsTabId = 'profile' | 'apikeys' | 'preferences' | 'billing';

const TABS: TabDef<SettingsTabId>[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User size={16} />,
  },
  {
    id: 'apikeys',
    label: 'API Keys',
    icon: <Key size={16} />,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: <Sliders size={16} />,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <CreditCard size={16} />,
  },
];

/**
 * SettingsPage - Complete Neural Interface Settings
 *
 * Features:
 * - Profile management (avatar, name, email, password)
 * - API Keys for providers (add/remove with validation)
 * - User preferences (theme, model, notifications, cost ceiling)
 * - Billing info and tier comparison
 *
 * State managed via Zustand store with API integration.
 */
export function SettingsPage() {
  const { activeTab, setActiveTab } = useSettingsStore();

  useEffect(() => {
    document.title = 'Settings - Pronetheia Neural Interface';
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'apikeys':
        return <ApiKeysTab />;
      case 'preferences':
        return <PreferencesTab />;
      case 'billing':
        return <BillingTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ padding: '40px 60px 20px' }}>
        <h1
          className="ni-tricolor-text mb-6"
          style={{
            fontSize: '48px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          Settings
        </h1>
        <NeuralTabBar
          tabs={TABS}
          activeTab={activeTab as SettingsTabId}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto ni-scrollbar"
        style={{ padding: '0 60px 40px' }}
      >
        {renderTabContent()}
      </div>
    </div>
  );
}
