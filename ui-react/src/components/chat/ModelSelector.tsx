/**
 * ModelSelector - Unified model dropdown component
 * 
 * Supports two modes:
 * - compact: Simple inline dropdown (for chat input bar)
 * - full: Full-featured with badges, capabilities, provider filtering
 * 
 * Automatically filters models based on user's configured API keys.
 * On mobile (< 768px), uses a full-screen modal for better UX.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { COLORS } from '../../styles/colors';
import { AVAILABLE_MODELS, type ModelInfo } from '../../constants/models';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// API key from BYOK system
interface ApiKeyInfo {
  id: string;
  provider: string;
  key_hint: string | null;
  is_valid: boolean;
}

// Map provider IDs (from API keys) to model provider names
const PROVIDER_TO_MODEL_PROVIDER: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI',
  mistral: 'Mistral',
  groq: 'Groq',
  cerebras: 'Cerebras',
  replicate: 'Replicate',
  zai: 'Z.AI',
  glm: 'GLM',
  deepseek: 'DeepSeek',
  openrouter: 'OpenRouter',  // OpenRouter gives access to many providers
};

// OpenRouter gives access to these providers
const OPENROUTER_PROVIDERS = [
  'Anthropic', 'OpenAI', 'Google', 'Mistral', 'Meta', 'DeepSeek', 'GLM', 'Qwen',
  'Cohere', 'Perplexity', 'xAI', 'Replicate', 'MoonshotAI',
];

export interface ModelSelectorProps {
  /** Currently selected model ID */
  value: string;
  /** Callback when model changes */
  onChange: (modelId: string) => void;
  /** Display mode: compact (inline) or full (detailed) */
  mode?: 'compact' | 'full';
  /** Placeholder text when no model selected */
  placeholder?: string;
  /** Additional class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  mode = 'compact',
  placeholder = 'Select model',
  className,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isMobile = useBreakpoint('md');

  // Fetch API keys on mount
  useEffect(() => {
    async function fetchKeys() {
      try {
        const res = await fetch('/api/v1/keys/');
        if (res.ok) {
          const keys = await res.json();
          setApiKeys((keys || []).filter((k: ApiKeyInfo) =>  k.is_valid));
        }
      } catch (e) {
        console.error('Failed to fetch API keys:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchKeys();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) {return;}
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Get providers the user has access to (via API keys)
  const accessibleProviders = useMemo(() => {
    const providers = new Set<string>();
    
    // Local models are always accessible
    providers.add('Local');
    
    for (const key of apiKeys) {
      // OpenRouter gives access to many providers
      if (key.provider === 'openrouter') {
        OPENROUTER_PROVIDERS.forEach(p => providers.add(p));
      } else {
        const modelProvider = PROVIDER_TO_MODEL_PROVIDER[key.provider];
        if (modelProvider) {
          providers.add(modelProvider);
        }
      }
    }
    
    return providers;
  }, [apiKeys]);

  // Filter models based on accessible providers
  const filteredModels = useMemo(() => {
    // If user has any API keys, filter by accessible providers
    if (apiKeys.length > 0) {
      return AVAILABLE_MODELS.filter(model => accessibleProviders.has(model.provider));
    }
    // No API keys = show all models (fallback for demo/dev)
    return AVAILABLE_MODELS;
  }, [apiKeys, accessibleProviders]);

  // Find current model
  const currentModel = useMemo(() => {
    return filteredModels.find(m => m.id === value) || filteredModels[0];
  }, [filteredModels, value]);

  // Get provider badge color
  const getProviderColor = (provider: string): string => {
    const colors: Record<string, string> = {
      'Z.AI': '#06b6d4',      // Cyan
      'Anthropic': '#d97706', // Amber
      'OpenAI': '#10b981',    // Green
      'Google': '#4285f4',    // Blue
      'Groq': '#ef4444',      // Red
      'Cerebras': '#8b5cf6',  // Purple
      'DeepSeek': '#3b82f6',  // Blue
      'GLM': '#ec4899',       // Pink
      'Local': '#22c55e',     // Green
      'Meta': '#6366f1',      // Indigo
      'Mistral': '#f97316',   // Orange
    };
    return colors[provider] || '#6b7280';
  };

  // Handle model selection
  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setOpen(false);
  };

  // Compact mode styles
  if (mode === 'compact') {
    return (
      <div className={`relative ${className || ''}`} ref={dropdownRef}>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 border-0"
          style={{
            padding: '4px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: disabled ? '#666' : '#a0a0b0',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onClick={() => !disabled && setOpen(!open)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: '8px',
              height: '8px',
              background: currentModel ? getProviderColor(currentModel.provider) : '#6b7280',
            }}
          />
          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentModel?.name || placeholder}
          </span>
          <span style={{ fontSize: '8px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : undefined }}>
            {'▼'}
          </span>
        </button>

        {open && (
          isMobile ? (
            /* Mobile: Full-screen modal */
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={() => setOpen(false)}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxHeight: '80vh',
                  background: 'rgba(15, 15, 25, 0.98)',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle bar */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                  <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
                </div>
                
                {/* Header */}
                <div style={{ padding: '0 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#f0f0f5' }}>Select Model</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{filteredModels.length} available</div>
                </div>
                
                {/* Model list */}
                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 80px)', WebkitOverflowScrolling: 'touch' }}>
                  {filteredModels.map(model => (
                    <button
                      key={model.id}
                      type="button"
                      className="w-full flex items-center gap-3 text-left border-0"
                      style={{
                        padding: '14px 16px',
                        background: model.id === value ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSelect(model.id)}
                    >
                      <span
                        className="rounded-full flex-shrink-0"
                        style={{ width: '10px', height: '10px', background: getProviderColor(model.provider) }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: model.id === value ? '#00d4ff' : '#f0f0f5' }}>
                          {model.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {model.provider}
                          {model.speed && <span style={{ marginLeft: '6px', color: '#22c55e' }}>• {model.speed}</span>}
                        </div>
                      </div>
                      {model.id === value && <span style={{ color: '#00d4ff' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Desktop: Dropdown */
            <div
              className="absolute bottom-full left-0 mb-1 ni-glass overflow-hidden"
              style={{
                borderRadius: '10px',
                zIndex: 50,
                minWidth: '220px',
                maxHeight: '60vh',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="listbox"
            >
              {/* Header with API key status */}
              {apiKeys.length > 0 && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '10px',
                    color: '#6b7280',
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  {apiKeys.slice(0, 4).map(key => (
                    <span
                      key={key.id}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 212, 255, 0.1)',
                        color: '#00d4ff',
                      }}
                    >
                      {PROVIDER_TO_MODEL_PROVIDER[key.provider] || key.provider}
                    </span>
                  ))}
                  {apiKeys.length > 4 && (
                    <span style={{ color: '#6b7280' }}>+{apiKeys.length - 4} more</span>
                  )}
                </div>
              )}
              
              {/* Model list grouped by provider */}
              {filteredModels.map(model => (
                <button
                  key={model.id}
                  type="button"
                  role="option"
                  aria-selected={model.id === value}
                  className="w-full flex items-center gap-2 text-left cursor-pointer border-0"
                  style={{
                    padding: '8px 12px',
                    background: model.id === value ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                    fontSize: '12px',
                    color: model.id === value ? '#00d4ff' : '#a0a0b0',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => handleSelect(model.id)}
                  onMouseEnter={(e) => {
                    if (model.id !== value) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = model.id === value ? 'rgba(0, 212, 255, 0.1)' : 'transparent';
                  }}
                >
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{
                      width: '8px',
                      height: '8px',
                      background: getProviderColor(model.provider),
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {model.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {model.provider}
                      {model.speed && <span style={{ marginLeft: '4px', color: '#22c55e' }}>• {model.speed}</span>}
                    </div>
                  </div>
                  {model.id === value && (
                    <span style={{ color: '#00d4ff', fontSize: '12px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )
        )}
      </div>
    );
  }

  // Full mode styles (for settings, detailed selection)
  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: currentModel ? '#f0f0f5' : '#6b7280',
          fontSize: '13px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: currentModel ? getProviderColor(currentModel.provider) : '#6b7280',
          }}
        />
        <span>{currentModel?.name || placeholder}</span>
        <span style={{ 
          fontSize: '9px', 
          color: '#6b7280',
          marginLeft: 'auto',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            minWidth: '320px',
            maxHeight: '60vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            background: 'rgba(20, 20, 30, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Select Model ({filteredModels.length} available)
          </div>

          {/* Model list */}
          {filteredModels.map(model => (
            <button
              key={model.id}
              type="button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                background: model.id === value ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onClick={() => handleSelect(model.id)}
              onMouseEnter={(e) => {
                if (model.id !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = model.id === value ? 'rgba(0, 212, 255, 0.08)' : 'transparent';
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getProviderColor(model.provider),
                  flexShrink: 0,
                  marginTop: '4px',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <span style={{ fontWeight: 500, color: '#f0f0f5' }}>{model.name}</span>
                  {model.speed && (
                    <span style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: model.speed === 'ultra-fast' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: model.speed === 'ultra-fast' ? '#22c55e' : '#3b82f6',
                    }}>
                      {model.speed}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {model.provider} • {model.description}
                </div>
                {model.capabilities && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {model.capabilities.vision && <CapabilityBadge label="Vision" />}
                    {model.capabilities.tools && <CapabilityBadge label="Tools" />}
                    {model.capabilities.thinking && <CapabilityBadge label="Thinking" />}
                    {model.capabilities.code && <CapabilityBadge label="Code" />}
                    {model.capabilities.longContext && <CapabilityBadge label="100K+" />}
                  </div>
                )}
              </div>
              {model.id === value && (
                <span style={{ color: '#00d4ff', fontSize: '14px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Capability badge component for full mode
function CapabilityBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: '9px',
      padding: '2px 6px',
      borderRadius: '4px',
      background: 'rgba(139, 92, 246, 0.15)',
      color: '#a78bfa',
    }}>
      {label}
    </span>
  );
}

export default ModelSelector;