import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Wifi } from 'lucide-react';
import { NeuralModal, NeuralButton, GlassCard } from '../shared';
import type { Integration, ServiceTypeInfo } from '../../stores/integrationsStore';
import { useIntegrationsStore } from '../../stores/integrationsStore';

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------
const CATEGORIES: Record<string, string> = {
  infrastructure: 'Infrastructure',
  automation: 'Automation',
  monitoring: 'Monitoring',
  security: 'Security',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** If set, we are editing an existing integration. */
  editIntegration?: Integration | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function IntegrationFormModal({ isOpen, onClose, editIntegration }: Props) {
  const { serviceTypes, createIntegration, updateIntegration, testRawConnection } =
    useIntegrationsStore();

  // --- Local state --------------------------------------------------------
  const [step, setStep] = useState<'select' | 'form'>(editIntegration ? 'form' : 'select');
  const [selectedType, setSelectedType] = useState<string>(editIntegration?.service_type ?? '');
  const [name, setName] = useState(editIntegration?.name ?? '');
  const [credentials, setCredentials] = useState<Record<string, unknown>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes or edit target changes
  useEffect(() => {
    if (isOpen) {
      if (editIntegration) {
        setStep('form');
        setSelectedType(editIntegration.service_type);
        setName(editIntegration.name);
        // Pre-populate with masked data so the user sees existing values
        setCredentials(editIntegration.data ?? {});
      } else {
        setStep('select');
        setSelectedType('');
        setName('');
        setCredentials({});
      }
      setShowSecrets({});
      setTestResult(null);
      setError(null);
    }
  }, [isOpen, editIntegration]);

  // Apply default values when a service type is first chosen (create mode only)
  useEffect(() => {
    if (!editIntegration && selectedType && serviceTypes[selectedType]) {
      const defaults: Record<string, unknown> = {};
      for (const f of serviceTypes[selectedType].fields) {
        if (f.default !== undefined) {defaults[f.key] = f.default;}
      }
      setCredentials(defaults);
    }
  }, [selectedType, editIntegration, serviceTypes]);

  const schema: ServiceTypeInfo | undefined = serviceTypes[selectedType];

  // Group services by category for the selector step
  const grouped = useMemo(() => {
    const map: Record<string, { key: string; info: ServiceTypeInfo }[]> = {};
    for (const [key, info] of Object.entries(serviceTypes)) {
      const cat = info.category || 'other';
      if (!map[cat]) {map[cat] = [];}
      map[cat].push({ key, info });
    }
    return map;
  }, [serviceTypes]);

  // --- Handlers -----------------------------------------------------------

  const handleSelectType = (key: string) => {
    setSelectedType(key);
    setStep('form');
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestRaw = async () => {
    if (!selectedType) {return;}
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testRawConnection(selectedType, credentials);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: 'Test request failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedType || !name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editIntegration) {
        await updateIntegration(editIntegration.id, { name, credentials });
      } else {
        await createIntegration({ name, service_type: selectedType, credentials });
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // --- Render helpers -----------------------------------------------------

  const renderSelectStep = () => (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {CATEGORIES[cat] ?? cat}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {items.map(({ key, info }) => (
              <GlassCard
                key={key}
                onClick={() => handleSelectType(key)}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.4)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#f0f0f5', marginBottom: '4px' }}>
                  {info.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                  {info.description}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFormStep = () => {
    if (!schema) {return null;}
    return (
      <div className="space-y-5">
        {/* Service badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(0,212,255,0.12)',
            color: '#00d4ff',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {schema.name}
          </span>
          {!editIntegration && (
            <button
              onClick={() => { setStep('select'); setSelectedType(''); setCredentials({}); setTestResult(null); }}
              style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Change
            </button>
          )}
        </div>

        {/* Name */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
            Integration Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. Prod ${schema.name}`}
            style={inputStyle}
            onFocus={focusHandler}
            onBlur={blurHandler}
          />
        </div>

        {/* Credential fields */}
        {schema.fields.map((field) => (
          <div key={field.key}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
              {field.label}{field.required ? ' *' : ''}
            </label>

            {field.type === 'boolean' ? (
              <button
                onClick={() => handleFieldChange(field.key, !credentials[field.key])}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  color: '#f0f0f5',
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  background: credentials[field.key] ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  display: 'inline-block',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: credentials[field.key] ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#f0f0f5',
                    transition: 'left 0.2s',
                  }} />
                </span>
                {credentials[field.key] ? 'Enabled' : 'Disabled'}
              </button>
            ) : field.type === 'textarea' ? (
              <textarea
                value={(credentials[field.key] as string) ?? ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            ) : field.type === 'secret' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showSecrets[field.key] ? 'text' : 'password'}
                  value={(credentials[field.key] as string) ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={focusHandler}
                  onBlur={blurHandler}
                />
                <button
                  onClick={() => setShowSecrets((p) => ({ ...p, [field.key]: !p[field.key] }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0,212,255,0.1)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {showSecrets[field.key]
                    ? <EyeOff size={16} color="#00d4ff" />
                    : <Eye size={16} color="#00d4ff" />}
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={(credentials[field.key] as string) ?? ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            )}
          </div>
        ))}

        {/* Test result banner */}
        {testResult && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            ...(testResult.success
              ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }
              : { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }),
          }}>
            {testResult.success ? 'Connection successful' : `Connection failed: ${testResult.error}`}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}
      </div>
    );
  };

  // --- Modal footer -------------------------------------------------------
  const footer = step === 'form' ? (
    <>
      <NeuralButton variant="secondary" onClick={handleTestRaw} disabled={testing}>
        <Wifi size={14} />
        {testing ? 'Testing...' : 'Test Connection'}
      </NeuralButton>
      <NeuralButton variant="secondary" onClick={onClose}>
        Cancel
      </NeuralButton>
      <NeuralButton variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : editIntegration ? 'Update' : 'Save'}
      </NeuralButton>
    </>
  ) : undefined;

  return (
    <NeuralModal
      isOpen={isOpen}
      onClose={onClose}
      title={editIntegration ? `Edit ${editIntegration.name}` : 'Add Integration'}
      maxWidth="640px"
      footer={footer}
    >
      {step === 'select' ? renderSelectStep() : renderFormStep()}
    </NeuralModal>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
  color: '#f0f0f5',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)';
};
const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
};
