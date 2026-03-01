import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Bell, BellOff, DollarSign, Sparkles, Mic } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { NeuralButton } from '../shared/NeuralModal';
import { useSettingsStore } from '../../stores/settingsStore';

const MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

// Voice-optimized models with fast response times
const VOICE_MODELS = [
  { id: '', name: 'System Default (Claude 3.5 Sonnet)', description: 'Use the system default model' },
  { id: 'groq/llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', description: 'Ultra-fast, great for voice' },
  { id: 'cerebras/llama3.1-8b', name: 'Llama 3.1 8B (Cerebras)', description: 'Fastest response, FREE tier' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Best quality, subscription' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Balanced quality and speed' },
  { id: 'z-ai/glm-4.7', name: 'GLM 4.7 (Z.AI)', description: 'Fast multilingual model' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable' },
];

const TIERS = ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'] as const;

export function PreferencesTab() {
  const { preferences, loading, loadPreferences, updatePreferences } = useSettingsStore();

  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('dark');
  const [defaultModel, setDefaultModel] = useState('');
  const [voiceModel, setVoiceModel] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [costCeilingTier, setCostCeilingTier] = useState<'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE'>('FREE');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    if (preferences) {
      setThemeMode(preferences.theme_mode);
      setDefaultModel(preferences.default_model);
      setVoiceModel(preferences.voice_model);
      setNotificationsEnabled(preferences.notifications_enabled);
      setCostCeilingTier(preferences.cost_ceiling_tier);
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      await updatePreferences({
        theme_mode: themeMode,
        default_model: defaultModel,
        voice_model: voiceModel,
        notifications_enabled: notificationsEnabled,
        cost_ceiling_tier: costCeilingTier,
      });
      setSaveMessage('Preferences saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage((error as Error).message);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <GlassCard variant="bordered" style={{ padding: '32px' }}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(0, 212, 255, 0.15)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: '#00d4ff',
            }}
          >
            <Moon size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: '#f0f0f5' }}>
              Theme Mode
            </h3>
            <p className="text-[14px]" style={{ color: '#6b7280' }}>
              Choose your preferred color theme
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {[
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'system', label: 'System', icon: Monitor },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = themeMode === id;
            return (
              <button
                key={id}
                onClick={() => setThemeMode(id as typeof themeMode)}
                className="flex-1 flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer border-0 outline-none"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: isActive
                    ? 'rgba(0, 212, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive
                    ? '1px solid rgba(0, 212, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: isActive ? '0 0 20px rgba(0, 212, 255, 0.2)' : 'none',
                  color: isActive ? '#00d4ff' : '#6b7280',
                }}
              >
                <Icon size={24} />
                <span className="text-[14px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Default Model */}
      <GlassCard variant="bordered" style={{ padding: '32px' }}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#8b5cf6',
            }}
          >
            <Sparkles size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: '#f0f0f5' }}>
              Default Model
            </h3>
            <p className="text-[14px]" style={{ color: '#6b7280' }}>
              Select the AI model to use by default
            </p>
          </div>
        </div>

        <select
          value={defaultModel}
          onChange={(e) => setDefaultModel(e.target.value)}
          className="w-full text-[14px] border-0 outline-none cursor-pointer"
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#f0f0f5',
          }}
        >
          {MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </GlassCard>

      {/* Voice Chat Model */}
      <GlassCard variant="bordered" style={{ padding: '32px' }}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: '#ec4899',
            }}
          >
            <Mic size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: '#f0f0f5' }}>
              Voice Chat Model
            </h3>
            <p className="text-[14px]" style={{ color: '#6b7280' }}>
              Model for voice conversations (faster models recommended)
            </p>
          </div>
        </div>

        <select
          value={voiceModel || ''}
          onChange={(e) => setVoiceModel(e.target.value || null)}
          className="w-full text-[14px] border-0 outline-none cursor-pointer"
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#f0f0f5',
          }}
        >
          {VOICE_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} — {model.description}
            </option>
          ))}
        </select>

        <p className="mt-3 text-[12px]" style={{ color: '#6b7280' }}>
          💡 Tip: Groq and Cerebras models offer the fastest response times for natural voice conversations.
        </p>
      </GlassCard>

      {/* Notifications */}
      <GlassCard variant="bordered" style={{ padding: '32px' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: notificationsEnabled
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(107, 114, 128, 0.15)',
                border: notificationsEnabled
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(107, 114, 128, 0.3)',
                color: notificationsEnabled ? '#10b981' : '#6b7280',
              }}
            >
              {notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
            </div>
            <div>
              <h3 className="text-[18px] font-semibold mb-1" style={{ color: '#f0f0f5' }}>
                Notifications
              </h3>
              <p className="text-[14px]" style={{ color: '#6b7280' }}>
                Receive notifications for important events
              </p>
            </div>
          </div>

          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className="relative flex-shrink-0 transition-all duration-300 cursor-pointer border-0 outline-none"
            style={{
              width: '56px',
              height: '32px',
              borderRadius: '16px',
              background: notificationsEnabled
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(255, 255, 255, 0.1)',
              border: notificationsEnabled
                ? '1px solid rgba(16, 185, 129, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span
              className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                background: notificationsEnabled ? '#10b981' : '#6b7280',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                left: notificationsEnabled ? 'calc(100% - 28px)' : '4px',
              }}
            />
          </button>
        </div>
      </GlassCard>

      {/* Cost Ceiling */}
      <GlassCard variant="bordered" style={{ padding: '32px' }}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
            }}
          >
            <DollarSign size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: '#f0f0f5' }}>
              Cost Ceiling Tier
            </h3>
            <p className="text-[14px]" style={{ color: '#6b7280' }}>
              Set a maximum spending limit for API usage
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {TIERS.map((tier) => {
            const isActive = costCeilingTier === tier;
            return (
              <button
                key={tier}
                onClick={() => setCostCeilingTier(tier)}
                className="flex items-center justify-center text-[14px] font-semibold transition-all duration-300 cursor-pointer border-0 outline-none"
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: isActive
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#f59e0b' : '#6b7280',
                }}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <NeuralButton variant="primary" onClick={handleSave} disabled={loading}>
          Save Preferences
        </NeuralButton>
        {saveMessage && (
          <span
            className="text-[14px]"
            style={{
              color: saveMessage.includes('success') ? '#10b981' : '#ef4444',
            }}
          >
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}