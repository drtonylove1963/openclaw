import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { NeuralModal, NeuralButton } from '../shared/NeuralModal';
import { NeuralEmptyState } from '../shared/NeuralEmptyState';
import { StatusIndicator } from '../shared/StatusIndicator';
import { useSettingsStore } from '../../stores/settingsStore';

const PROVIDER_ICONS: Record<string, string> = {
  agent_teams: '🤝',
  anthropic: '🔮',
  brave: '🦁',
  cerebras: '🧠',
  cloudflare: '☁️',
  cloudflare_tunnel: '🔗',
  deepseek: '🐋',
  elevenlabs: '🎙️',
  firecrawl: '🔥',
  gateway_secret: '🔑',
  github_oauth: '🐙',
  github_pat: '🐱',
  glm: '🀄',
  google: '🔍',
  groq: '⚡',
  keycloak: '🛡️',
  livekit: '📡',
  livekit_secret: '🔐',
  n8n: '⚙️',
  neo4j: '🕸️',
  ollama: '🦙',
  openai: '🤖',
  openrouter: '🚀',
  replicate: '🎨',
  security_audit: '🔏',
  sentry: '🛡️',
  smtp: '📧',
  stripe: '💳',
  stripe_webhook: '🪝',
  telegram: '📱',
  vault: '🏦',
  xai: '🅧',
  zhipu: '🀄',
};

export function ApiKeysTab() {
  const { apiKeys, providers, loading, loadApiKeys, loadProviders, addApiKey, removeApiKey } =
    useSettingsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [addError, setAddError] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadApiKeys();
    loadProviders();
  }, [loadApiKeys, loadProviders]);

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKeyInput) {
      setAddError('Please select a provider and enter an API key');
      return;
    }

    try {
      await addApiKey(selectedProvider, apiKeyInput);
      setShowAddModal(false);
      setSelectedProvider('');
      setApiKeyInput('');
      setAddError('');
    } catch (error) {
      setAddError((error as Error).message);
    }
  };

  const handleRemoveKey = async (provider: string) => {
    if (confirm('Are you sure you want to remove this API key?')) {
      try {
        await removeApiKey(provider);
      } catch (error) {
        console.error('Failed to remove key:', error);
      }
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (hint: string, visible: boolean) => {
    if (visible) {return hint;}
    return hint.substring(0, 8) + '••••••••••••';
  };

  const getProviderForKey = (providerId: string) => {
    return providers.find((p) => p.id === providerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-semibold mb-2" style={{ color: '#f0f0f5' }}>
            API Keys
          </h2>
          <p className="text-[14px]" style={{ color: '#6b7280' }}>
            Manage your API keys for various AI providers
          </p>
        </div>
        <NeuralButton
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add API Key
        </NeuralButton>
      </div>

      {/* API Keys Grid */}
      {apiKeys.length === 0 ? (
        <NeuralEmptyState
          icon={<Key size={32} />}
          title="No API Keys"
          description="Add your first API key to start using AI providers"
          action={
            <NeuralButton variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              Add API Key
            </NeuralButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiKeys.map((key) => {
            const provider = getProviderForKey(key.provider);
            const isVisible = visibleKeys[key.id] || false;

            return (
              <GlassCard
                key={key.id}
                variant="bordered"
                style={{ padding: '24px' }}
                hoverable
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center text-[24px]"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(0, 212, 255, 0.1)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                      }}
                    >
                      {PROVIDER_ICONS[key.provider] || '🔑'}
                    </div>
                    <div>
                      <h3
                        className="text-[16px] font-semibold mb-1"
                        style={{ color: '#f0f0f5' }}
                      >
                        {provider?.name || key.provider}
                      </h3>
                      <StatusIndicator
                        status={key.is_valid ? 'active' : 'offline'}
                        text={key.is_valid ? 'Valid' : 'Invalid'}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveKey(key.provider)}
                    className="flex items-center justify-center transition-all duration-200 border-0 outline-none cursor-pointer"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                    }}
                    title="Remove key"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* API Key Display */}
                  <div>
                    <label className="block text-[12px] font-medium mb-2" style={{ color: '#6b7280' }}>
                      API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 text-[13px] font-mono"
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          color: '#6b7280',
                        }}
                      >
                        {maskKey(key.key_hint, isVisible)}
                      </div>
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="flex items-center justify-center transition-all duration-200 border-0 outline-none cursor-pointer"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#6b7280',
                        }}
                        title={isVisible ? 'Hide key' : 'Show key'}
                      >
                        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="text-[12px]" style={{ color: '#6b7280' }}>
                    Added {new Date(key.created_at).toLocaleDateString()}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add API Key Modal */}
      <NeuralModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedProvider('');
          setApiKeyInput('');
          setAddError('');
        }}
        title="Add API Key"
        footer={
          <>
            <NeuralButton variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </NeuralButton>
            <NeuralButton
              variant="primary"
              onClick={handleAddKey}
              disabled={loading || !selectedProvider || !apiKeyInput}
            >
              Add Key
            </NeuralButton>
          </>
        }
      >
        <div className="space-y-4">
          {addError && (
            <div
              className="text-[13px] p-3 rounded-lg"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
              }}
            >
              {addError}
            </div>
          )}

          {/* Provider Select */}
          <div>
            <label
              htmlFor="provider"
              className="block text-[13px] font-medium mb-2"
              style={{ color: '#6b7280' }}
            >
              Provider
            </label>
            <select
              id="provider"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full text-[14px] border-0 outline-none cursor-pointer"
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: '#1a1a2e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f0f0f5',
              }}
            >
              <option value="" style={{ background: '#1a1a2e', color: '#6b7280' }}>Select a provider</option>
              {[...providers]
                .toSorted((a, b) => a.name.localeCompare(b.name))
                .map((provider) => (
                  <option key={provider.id} value={provider.id} style={{ background: '#1a1a2e', color: '#f0f0f5' }}>
                    {PROVIDER_ICONS[provider.id] ? `${PROVIDER_ICONS[provider.id]}  ${provider.name}` : provider.name}
                  </option>
                ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <label
              htmlFor="apiKey"
              className="block text-[13px] font-medium mb-2"
              style={{ color: '#6b7280' }}
            >
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full text-[14px] font-mono border-0 outline-none"
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#f0f0f5',
              }}
              placeholder="sk-..."
            />
            <p className="text-[12px] mt-2" style={{ color: '#6b7280' }}>
              Your API key will be encrypted and stored securely
            </p>
          </div>
        </div>
      </NeuralModal>
    </div>
  );
}
