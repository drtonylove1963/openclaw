/**
 * AvatarControls - Settings panel for AI Avatar configuration
 * Simplified for pulsating logo avatar (no 3D settings)
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAvatarStore, selectAvatarConfig } from '../../stores/avatarStore';
import { TTSUsageIndicator } from './TTSUsageIndicator';
import { COLORS } from '../../styles/colors';

interface AvatarControlsProps {
  onClose: () => void;
}

// Hook to get available voices from the browser
function useAvailableVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || [];
      // Filter to English voices and sort by quality indicators
      const englishVoices = availableVoices
        .filter(v => v.lang.startsWith('en'))
        .toSorted((a, b) => {
          // Prioritize natural/online voices
          const aScore = getVoiceQualityScore(a);
          const bScore = getVoiceQualityScore(b);
          return bScore - aScore;
        });
      setVoices(englishVoices);
    };

    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  return voices;
}

// Score voices by quality (higher = better)
function getVoiceQualityScore(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  if (name.includes('natural') || name.includes('online')) {return 100;}
  if (name.includes('neural')) {return 90;}
  if (name.includes('google')) {return 80;}
  if (name.includes('samantha') || name.includes('karen')) {return 70;}
  if (!voice.localService) {return 60;} // Remote/cloud voices
  return 50;
}

// ElevenLabs voice options - all free premade voices
const ELEVENLABS_VOICES = [
  // Female voices
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm, American (F)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Soft, American (F)' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Warm, American (F)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Strong, American (F)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'Young, American (F)' },
  { id: 'LcfcDJNUP1GQjkzn1xUU', name: 'Emily', description: 'Calm, American (F)' },
  { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', description: 'Young, American (F)' },
  { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', description: 'Southern, American (F)' },
  { id: 'pMsXgVXv3BLzUgSXRplE', name: 'Serena', description: 'Pleasant, American (F)' },
  { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole', description: 'Whisper, American (F)' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', description: 'Confident, British (F)' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Seductive, British-Swedish (F)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', description: 'Pleasant, British (F)' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Raspy, British (F)' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', description: 'Childish, American (F)' },
  { id: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', description: 'Witch, American (F)' },
  { id: 'zrHiDhphv9ZnVXBqCLjz', name: 'Mimi', description: 'Childish, Swedish (F)' },
  // Male voices
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep, American (M)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Deep, American (M)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Well-rounded, American (M)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'Crisp, American (M)' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', description: 'Strong, American (M)' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Deep, American (M)' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', description: 'Hoarse, American (M)' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', description: 'Casual, American (M)' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde', description: 'War veteran, American (M)' },
  { id: '29vD33N1CtxCmqQRPOHJ', name: 'Drew', description: 'Well-rounded, American (M)' },
  { id: 'g5CIjZEefAph4nQFvHAz', name: 'Ethan', description: 'ASMR, American (M)' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry', description: 'Anxious, American (M)' },
  { id: 'bVMeCyTHy58xNoL34h3p', name: 'Jeremy', description: 'Excited, Irish-American (M)' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Young, American (M)' },
  { id: 'flq6f7yk4E4fJM5XTYuZ', name: 'Michael', description: 'Old, American (M)' },
  { id: 'ODq5zmih8GrVes37Dizd', name: 'Patrick', description: 'Shouty, American (M)' },
  { id: '5Q0t7uMcjvnagumLfvZi', name: 'Paul', description: 'Ground reporter, American (M)' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', description: 'Raspy, American (M)' },
  { id: 'GBv7mTt0atIp3Br8iCZE', name: 'Thomas', description: 'Calm, American (M)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Deep, British (M)' },
  { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave', description: 'Conversational, British (M)' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Raspy, British (M)' },
  { id: 'Zlb1dXrM653N07WRdFW3', name: 'Joseph', description: 'British (M)' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Casual, Australian (M)' },
  { id: 'ZQe5CZNOzWyzPSCn5a3c', name: 'James', description: 'Calm, Australian (M)' },
  { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', description: 'Sailor, Irish (M)' },
  { id: 'zcAOhNBS3c14rBihAFp1', name: 'Giovanni', description: 'Foreigner, Italian (M)' },
  { id: 't0jbNlBVZ17f02VDIeMI', name: 'Jessie', description: 'Raspy old, American (M)' },
  { id: 'knrPHWnBmmDHMoiMeP3l', name: 'Santa Claus', description: 'Jolly, Christmas (M)' },
];

// Type for ElevenLabs voice from API
interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  description?: string;
}

export const AvatarControls: React.FC<AvatarControlsProps> = ({ onClose }) => {
  const config = useAvatarStore(selectAvatarConfig);
  const { updateConfig, setEnabled, setMuted, isEnabled, isMuted } = useAvatarStore();
  const availableVoices = useAvailableVoices();

  const [activeTab, setActiveTab] = useState<'general' | 'voice'>('general');
  const [elevenLabsKey, setElevenLabsKey] = useState(() =>
    localStorage.getItem('elevenlabs_api_key') || ''
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [userVoices, setUserVoices] = useState<ElevenLabsVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);

  // Fetch user's voices - tries backend first (uses DB-stored API key from Admin Settings),
  // then falls back to direct ElevenLabs call with localStorage key
  const fetchUserVoices = useCallback(async (apiKey: string) => {
    setLoadingVoices(true);
    setVoicesError(null);

    try {
      // 1. Try backend endpoint first (uses API key stored in Admin Settings DB)
      const backendResponse = await fetch('/api/v1/voice/voices');
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        const elVoices: ElevenLabsVoice[] = data.elevenlabs || [];
        if (elVoices.length > 0) {
          setUserVoices(elVoices);
          setLoadingVoices(false);
          return;
        }
      }
    } catch {
      // Backend unavailable, fall through to direct API call
    }

    // 2. Fallback: direct ElevenLabs API call with localStorage key
    if (!apiKey) {
      setUserVoices([]);
      setLoadingVoices(false);
      return;
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      const allVoices = data.voices || [];
      setUserVoices(allVoices);
    } catch (err) {
      console.error('[AvatarControls] Error fetching voices:', err);
      setVoicesError(err instanceof Error ? err.message : 'Failed to load voices');
      setUserVoices([]);
    } finally {
      setLoadingVoices(false);
    }
  }, []);

  // Fetch voices when provider is ElevenLabs (backend DB key or localStorage key)
  useEffect(() => {
    if (config.voice.provider === 'elevenlabs') {
      fetchUserVoices(elevenLabsKey);
    }
  }, [elevenLabsKey, config.voice.provider, fetchUserVoices]);

  // Save ElevenLabs API key
  const saveElevenLabsKey = (key: string) => {
    setElevenLabsKey(key);
    if (key) {
      localStorage.setItem('elevenlabs_api_key', key);
    } else {
      localStorage.removeItem('elevenlabs_api_key');
      setUserVoices([]);
    }
  };

  // Format voice description from labels
  const formatVoiceLabels = (voice: ElevenLabsVoice): string => {
    if (voice.description) {return voice.description;}
    if (!voice.labels) {return '';}
    const parts: string[] = [];
    if (voice.labels.accent) {parts.push(voice.labels.accent);}
    if (voice.labels.gender) {parts.push(voice.labels.gender === 'male' ? 'M' : 'F');}
    if (voice.labels.age) {parts.push(voice.labels.age);}
    if (voice.labels.use_case) {parts.push(voice.labels.use_case);}
    return parts.join(', ');
  };

  // Format voice name for display
  const formatVoiceName = (voice: SpeechSynthesisVoice) => {
    let label = voice.name;
    // Add quality indicator
    if (voice.name.toLowerCase().includes('natural') || voice.name.toLowerCase().includes('online')) {
      label += ' ★';
    }
    return label;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>Avatar Settings</h3>
          <button style={styles.closeButton} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {(['general', 'voice'] as const).map((tab) => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                ...(activeTab === tab && styles.tabActive),
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'general' && (
            <>
              {/* Enable/Disable */}
              <div style={styles.field}>
                <label style={styles.label}>Avatar Enabled</label>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(isEnabled && styles.toggleButtonActive),
                  }}
                  onClick={() => setEnabled(!isEnabled)}
                >
                  {isEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Mute */}
              <div style={styles.field}>
                <label style={styles.label}>Mute Audio</label>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(isMuted && styles.toggleButtonActive),
                  }}
                  onClick={() => setMuted(!isMuted)}
                >
                  {isMuted ? 'Muted' : 'Unmuted'}
                </button>
              </div>

              {/* Auto Speak */}
              <div style={styles.field}>
                <label style={styles.label}>Auto-speak Responses</label>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(config.autoSpeak && styles.toggleButtonActive),
                  }}
                  onClick={() => updateConfig({ autoSpeak: !config.autoSpeak })}
                >
                  {config.autoSpeak ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Subtitles */}
              <div style={styles.field}>
                <label style={styles.label}>Show Subtitles</label>
                <button
                  style={{
                    ...styles.toggleButton,
                    ...(config.showSubtitles && styles.toggleButtonActive),
                  }}
                  onClick={() => updateConfig({ showSubtitles: !config.showSubtitles })}
                >
                  {config.showSubtitles ? 'ON' : 'OFF'}
                </button>
              </div>
            </>
          )}

          {activeTab === 'voice' && (
            <>
              {/* TTS Usage Indicator */}
              <TTSUsageIndicator showDetails={true} />

              {/* Voice Pipeline Selection (Phase 2) */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Voice Pipeline
                  <span style={styles.badge}>NEW</span>
                </label>
                <select
                  style={styles.select}
                  value={config.voice.pipeline || 'livekit'}
                  onChange={(e) =>
                    updateConfig({ voice: { ...config.voice, pipeline: e.target.value } })
                  }
                >
                  <option value="auto">Auto (Best Available)</option>
                  <option value="gemini_hybrid">Turbo + Voice Choice (1.3s)</option>
                  <option value="gemini_full">Ultra-Fast (1-2s, 1 voice)</option>
                  <option value="unified">Self-Hosted (2-3s)</option>
                  <option value="livekit">Standard (4-12s)</option>
                </select>
                <span style={styles.hint}>
                  {config.voice.pipeline === 'auto'
                    ? 'Automatically selects the fastest available pipeline based on your preference.'
                    : config.voice.pipeline === 'gemini_full'
                    ? 'Fastest response. Uses Gemini voice (Kore). Requires GEMINI_API_KEY.'
                    : config.voice.pipeline === 'gemini_hybrid'
                    ? 'Fast response with your choice of 50+ voices. Best balance of speed and variety.'
                    : config.voice.pipeline === 'unified'
                    ? 'Self-hosted pipeline. No cloud dependency. Uses Whisper + Llama + Kokoro.'
                    : 'Current pipeline. Reliable but slower. Uses LiveKit + Whisper + Kokoro.'}
                </span>
              </div>

              {/* Auto Selection Preference (only shown when Auto is selected) */}
              {config.voice.pipeline === 'auto' && (
                <div style={styles.field}>
                  <label style={styles.label}>Auto Selection Preference</label>
                  <select
                    style={styles.select}
                    value={config.voice.autoPreference || 'balanced'}
                    onChange={(e) =>
                      updateConfig({ voice: { ...config.voice, autoPreference: e.target.value } })
                    }
                  >
                    <option value="balanced">Balanced (Recommended)</option>
                    <option value="speed">Prioritize Speed</option>
                    <option value="voice_variety">Prioritize Voice Choice</option>
                    <option value="self_hosted">Prioritize Privacy</option>
                  </select>
                  <span style={styles.hint}>
                    {config.voice.autoPreference === 'speed'
                      ? 'Selects the fastest available pipeline (may use single voice).'
                      : config.voice.autoPreference === 'voice_variety'
                      ? 'Prefers pipelines with more voice options.'
                      : config.voice.autoPreference === 'self_hosted'
                      ? 'Prefers self-hosted pipelines when available (no cloud).'
                      : 'Best balance of speed and voice selection.'}
                  </span>
                </div>
              )}

              {/* Voice Selection - only show for pipelines that support voice choice */}
              {/* TTS Provider Selection */}
              <div style={styles.field}>
                <label style={styles.label}>Voice Provider</label>
                <select
                  style={styles.select}
                  value={config.voice.provider}
                  onChange={(e) =>
                    updateConfig({ voice: { ...config.voice, provider: e.target.value } })
                  }
                  disabled={config.voice.pipeline === 'gemini_full'}
                >
                  <option value="web">Browser (Free)</option>
                  <option value="elevenlabs">ElevenLabs (Premium)</option>
                </select>
                <span style={styles.hint}>
                  {config.voice.pipeline === 'gemini_full'
                    ? 'Ultra-Fast mode uses Gemini built-in voice (Kore)'
                    : config.voice.provider === 'elevenlabs'
                    ? 'Natural AI voices - requires API key'
                    : 'Free browser voices - quality varies by browser'}
                </span>
              </div>

              {/* ElevenLabs Settings */}
              {config.voice.provider === 'elevenlabs' && (
                <>
                  {/* API Key */}
                  <div style={styles.field}>
                    <label style={styles.label}>ElevenLabs API Key</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        style={{ ...styles.select, flex: 1 }}
                        value={elevenLabsKey}
                        onChange={(e) => saveElevenLabsKey(e.target.value)}
                        placeholder="Enter your API key"
                      />
                      <button
                        style={styles.toggleButton}
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <span style={styles.hint}>
                      Optional - voices load automatically from Admin Settings.
                      Override here or get a key at{' '}
                      <a
                        href="https://elevenlabs.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: COLORS.accent }}
                      >
                        elevenlabs.io
                      </a>
                    </span>
                  </div>

                  {/* ElevenLabs Voice Selection */}
                  <div style={styles.field}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={styles.label}>Voice</label>
                      <button
                        style={styles.refreshButton}
                        onClick={() => fetchUserVoices(elevenLabsKey)}
                        disabled={loadingVoices || !elevenLabsKey}
                        title="Refresh My Voices"
                      >
                        {loadingVoices ? '...' : '↻'}
                      </button>
                    </div>
                    <select
                      style={styles.select}
                      value={config.voice.voiceId}
                      onChange={(e) =>
                        updateConfig({ voice: { ...config.voice, voiceId: e.target.value } })
                      }
                    >
                      {/* Show voices from API if available */}
                      {userVoices.length > 0 ? (
                        <>
                          {/* Group by category */}
                          {(() => {
                            const cloned = userVoices.filter(v => v.category === 'cloned');
                            const generated = userVoices.filter(v => v.category === 'generated');
                            const professional = userVoices.filter(v => v.category === 'professional');
                            const premade = userVoices.filter(v => v.category === 'premade');
                            const other = userVoices.filter(v =>
                              !['cloned', 'generated', 'professional', 'premade'].includes(v.category || '')
                            );
                            return (
                              <>
                                {cloned.length > 0 && (
                                  <optgroup label="★ Cloned Voices">
                                    {cloned.map((voice) => (
                                      <option key={voice.voice_id} value={voice.voice_id}>
                                        {voice.name} {formatVoiceLabels(voice) ? `- ${formatVoiceLabels(voice)}` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {generated.length > 0 && (
                                  <optgroup label="★ Generated Voices">
                                    {generated.map((voice) => (
                                      <option key={voice.voice_id} value={voice.voice_id}>
                                        {voice.name} {formatVoiceLabels(voice) ? `- ${formatVoiceLabels(voice)}` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {professional.length > 0 && (
                                  <optgroup label="★ Professional Voices">
                                    {professional.map((voice) => (
                                      <option key={voice.voice_id} value={voice.voice_id}>
                                        {voice.name} {formatVoiceLabels(voice) ? `- ${formatVoiceLabels(voice)}` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {other.length > 0 && (
                                  <optgroup label="★ My Voices">
                                    {other.map((voice) => (
                                      <option key={voice.voice_id} value={voice.voice_id}>
                                        {voice.name} {formatVoiceLabels(voice) ? `- ${formatVoiceLabels(voice)}` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {premade.length > 0 && (
                                  <optgroup label="Premade Voices">
                                    {premade.map((voice) => (
                                      <option key={voice.voice_id} value={voice.voice_id}>
                                        {voice.name} {formatVoiceLabels(voice) ? `- ${formatVoiceLabels(voice)}` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        /* Fallback to hardcoded list if API not loaded */
                        <optgroup label="Premade Voices">
                          {ELEVENLABS_VOICES.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                              {voice.name} - {voice.description}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {loadingVoices && (
                      <span style={styles.hint}>Loading voices...</span>
                    )}
                    {voicesError && (
                      <span style={{ ...styles.hint, color: '#ef4444' }}>
                        {voicesError}
                      </span>
                    )}
                    {userVoices.length > 0 && !loadingVoices && (
                      <span style={styles.hint}>
                        {userVoices.length} voice{userVoices.length !== 1 ? 's' : ''} loaded from your account
                      </span>
                    )}
                  </div>

                  {/* ElevenLabs Model Selection */}
                  <div style={styles.field}>
                    <label style={styles.label}>Model</label>
                    <select
                      style={styles.select}
                      value={config.voice.model || 'eleven_turbo_v2_5'}
                      onChange={(e) =>
                        updateConfig({ voice: { ...config.voice, model: e.target.value } })
                      }
                    >
                      <option value="eleven_turbo_v2_5">Turbo v2.5 (Fastest, Recommended)</option>
                      <option value="eleven_multilingual_v2">Multilingual v2 (Best Quality)</option>
                      <option value="eleven_monolingual_v1">Monolingual v1 (Legacy)</option>
                    </select>
                    <span style={styles.hint}>
                      Turbo v2.5 is recommended for low-latency voice. Multilingual v2 for best quality.
                    </span>
                  </div>

                  {/* Stability */}
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Stability: {((config.voice.stability ?? 0.5) * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.voice.stability ?? 0.5}
                      onChange={(e) =>
                        updateConfig({ voice: { ...config.voice, stability: parseFloat(e.target.value) } })
                      }
                      style={styles.slider}
                    />
                    <span style={styles.hint}>
                      Higher = more consistent, Lower = more expressive/variable
                    </span>
                  </div>

                  {/* Similarity Boost */}
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Clarity + Similarity: {((config.voice.similarityBoost ?? 0.75) * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.voice.similarityBoost ?? 0.75}
                      onChange={(e) =>
                        updateConfig({ voice: { ...config.voice, similarityBoost: parseFloat(e.target.value) } })
                      }
                      style={styles.slider}
                    />
                    <span style={styles.hint}>
                      Higher = closer to original voice, Lower = more variation
                    </span>
                  </div>

                  {/* Style Exaggeration */}
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Style Exaggeration: {((config.voice.style ?? 0) * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.voice.style ?? 0}
                      onChange={(e) =>
                        updateConfig({ voice: { ...config.voice, style: parseFloat(e.target.value) } })
                      }
                      style={styles.slider}
                    />
                    <span style={styles.hint}>
                      Amplifies the style of the original speaker (can reduce stability)
                    </span>
                  </div>

                  {/* Speaker Boost */}
                  <div style={styles.field}>
                    <label style={styles.label}>Speaker Boost</label>
                    <button
                      style={{
                        ...styles.toggleButton,
                        ...((config.voice.speakerBoost ?? true) && styles.toggleButtonActive),
                      }}
                      onClick={() =>
                        updateConfig({ voice: { ...config.voice, speakerBoost: !(config.voice.speakerBoost ?? true) } })
                      }
                    >
                      {(config.voice.speakerBoost ?? true) ? 'ON' : 'OFF'}
                    </button>
                    <span style={styles.hint}>
                      Boosts similarity to original speaker (recommended for cloned voices)
                    </span>
                  </div>
                </>
              )}

              {/* Web Speech API Settings */}
              {config.voice.provider === 'web' && (
                <div style={styles.field}>
                  <label style={styles.label}>Voice</label>
                  <select
                    style={styles.select}
                    value={config.voice.voiceId}
                    onChange={(e) =>
                      updateConfig({ voice: { ...config.voice, voiceId: e.target.value } })
                    }
                  >
                    <option value="auto">Auto (Best Available)</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {formatVoiceName(voice)}
                      </option>
                    ))}
                  </select>
                  <span style={styles.hint}>
                    {availableVoices.length} voices available. ★ = High quality
                  </span>
                </div>
              )}

              {/* Speech Rate */}
              <div style={styles.field}>
                <label style={styles.label}>Speech Rate: {config.voice.rate.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={config.voice.rate}
                  onChange={(e) =>
                    updateConfig({ voice: { ...config.voice, rate: parseFloat(e.target.value) } })
                  }
                  style={styles.slider}
                />
              </div>

              {/* Pitch - only for Web Speech API */}
              {config.voice.provider === 'web' && (
                <div style={styles.field}>
                  <label style={styles.label}>Pitch: {config.voice.pitch.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.voice.pitch}
                    onChange={(e) =>
                      updateConfig({ voice: { ...config.voice, pitch: parseFloat(e.target.value) } })
                    }
                    style={styles.slider}
                  />
                </div>
              )}

              {/* Volume */}
              <div style={styles.field}>
                <label style={styles.label}>Volume: {Math.round(config.voice.volume * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.voice.volume}
                  onChange={(e) =>
                    updateConfig({ voice: { ...config.voice, volume: parseFloat(e.target.value) } })
                  }
                  style={styles.slider}
                />
              </div>

              {/* Test Voice Button */}
              <div style={styles.field}>
                <button
                  style={styles.testButton}
                  onClick={() => {
                    if (window.pronetheliaAvatar?.speak) {
                      window.pronetheliaAvatar.speak('Hello! I am Athena, your AI assistant.');
                    }
                  }}
                >
                  Test Voice
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CloseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: COLORS.bg || '#09090b',
    borderRadius: '12px',
    width: '380px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${COLORS.border || '#27272a'}`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${COLORS.border || '#27272a'}`,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.text || '#fafafa',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: COLORS.textMuted || '#a1a1aa',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${COLORS.border || '#27272a'}`,
  },
  tab: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.textMuted || '#a1a1aa',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: COLORS.accent || '#10b981',
    borderBottomColor: COLORS.accent || '#10b981',
  },
  content: {
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: COLORS.textMuted || '#a1a1aa',
  },
  hint: {
    fontSize: '11px',
    color: COLORS.textDim || '#71717a',
    fontStyle: 'italic',
  },
  badge: {
    display: 'inline-block',
    marginLeft: '8px',
    padding: '2px 6px',
    fontSize: '9px',
    fontWeight: 600,
    textTransform: 'uppercase',
    backgroundColor: COLORS.accent || '#10b981',
    color: '#ffffff',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '10px 12px',
    backgroundColor: COLORS.bgAlt || '#141415',
    border: `1px solid ${COLORS.border || '#27272a'}`,
    borderRadius: '6px',
    color: COLORS.text || '#fafafa',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  slider: {
    width: '100%',
    height: '6px',
    appearance: 'none',
    backgroundColor: COLORS.bgAlt || '#141415',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  toggleButton: {
    padding: '8px 16px',
    backgroundColor: COLORS.bgAlt || '#141415',
    border: `1px solid ${COLORS.border || '#27272a'}`,
    borderRadius: '6px',
    color: COLORS.textMuted || '#a1a1aa',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.accent || '#10b981',
    borderColor: COLORS.accent || '#10b981',
    color: '#fff',
  },
  testButton: {
    padding: '10px 20px',
    backgroundColor: COLORS.accent || '#10b981',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  refreshButton: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgAlt || '#141415',
    border: `1px solid ${COLORS.border || '#27272a'}`,
    borderRadius: '6px',
    color: COLORS.textMuted || '#a1a1aa',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default AvatarControls;
