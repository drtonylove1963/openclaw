import { useState, useEffect, useRef, useCallback } from 'react';
import { GlassCard, NeuralModal, NeuralButton, NeuralEmptyState } from '../shared';
import {
  Download, Github, Upload, Package, Shield, ShieldCheck, ShieldAlert, ShieldX,
  AlertTriangle, CheckCircle2, XCircle, Loader, ChevronDown, RefreshCw,
  FileJson, Clock, X, Eye, Search, Zap, Globe,
} from 'lucide-react';
import {
  getImportSources, getImportPresets, previewGitHubImport, importFromGitHub,
  previewFileImport, importFromFile, importFromPreset, listImportJobs,
  getSecurityRules, searchSkillsSh, importFromSkillsSh, searchClawHub, importFromClawHub,
  type ImportSource, type ImportPreset, type ImportPreview, type ImportJob,
  type SecurityRule, type SkillsShSkill, type ClawHubSkill,
} from '../../services/athena-api';

const CYAN = '#00d4ff';
const TEXT = '#f0f0f5';
const TEXT_MUTED = '#9ca3af';
const BG_CARD = 'rgba(255, 255, 255, 0.04)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const SUCCESS = '#10b981';
const DANGER = '#ef4444';
const WARNING = '#f59e0b';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '14px',
  color: TEXT,
  background: BG_CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: '10px',
  outline: 'none',
};

type ImportTab = 'github' | 'file' | 'skills-sh' | 'clawhub' | 'presets' | 'history';

export function SkillsImportPanel() {
  const [activeTab, setActiveTab] = useState<ImportTab>('github');
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [presets, setPresets] = useState<ImportPreset[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Skills.sh form
  const [shQuery, setShQuery] = useState('');
  const [shCategory, setShCategory] = useState('');
  const [shSkipDupes, setShSkipDupes] = useState(true);
  const [shSearchResults, setShSearchResults] = useState<SkillsShSkill[]>([]);
  const [shSearching, setShSearching] = useState(false);
  const [shImporting, setShImporting] = useState(false);
  const [shSelectedIds, setShSelectedIds] = useState<Set<string>>(new Set());

  // ClawHub form
  const [chQuery, setChQuery] = useState('');
  const [chCategory, setChCategory] = useState('');
  const [chSkipDupes, setChSkipDupes] = useState(true);
  const [chSearchResults, setChSearchResults] = useState<ClawHubSkill[]>([]);
  const [chSearching, setChSearching] = useState(false);
  const [chImporting, setChImporting] = useState(false);
  const [chSelectedSlugs, setChSelectedSlugs] = useState<Set<string>>(new Set());

  // GitHub form
  const [ghUrl, setGhUrl] = useState('');
  const [ghBranch, setGhBranch] = useState('main');
  const [ghPath, setGhPath] = useState('');
  const [ghDomain, setGhDomain] = useState('');
  const [ghSkipDupes, setGhSkipDupes] = useState(true);
  const [ghPreview, setGhPreview] = useState<ImportPreview | null>(null);
  const [ghPreviewing, setGhPreviewing] = useState(false);
  const [ghImporting, setGhImporting] = useState(false);

  // File form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDomain, setFileDomain] = useState('');
  const [fileSkipDupes, setFileSkipDupes] = useState(true);
  const [filePreview, setFilePreview] = useState<ImportPreview | null>(null);
  const [filePreviewing, setFilePreviewing] = useState(false);
  const [fileImporting, setFileImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Presets
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [importingPresetId, setImportingPresetId] = useState<string | null>(null);

  useEffect(() => {
    getImportSources().then((d) => setSources(d.sources)).catch(() => {});
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await listImportJobs(20);
      setJobs(Array.isArray(data) ? data : []);
    } catch { setJobs([]); }
  };

  const loadPresets = async () => {
    setPresetsLoading(true);
    try {
      const data = await getImportPresets();
      setPresets(data.presets || []);
    } catch { setPresets([]); }
    finally { setPresetsLoading(false); }
  };

  const loadRules = async () => {
    try {
      const data = await getSecurityRules();
      setSecurityRules(data.rules || []);
    } catch { setSecurityRules([]); }
  };

  // ─── GitHub ────────────────────────────────────────────────────────────

  const handleGhPreview = async () => {
    if (!ghUrl.trim() || ghPreviewing) {return;}
    setGhPreviewing(true);
    setGhPreview(null);
    setError(null);
    try {
      const preview = await previewGitHubImport(ghUrl.trim(), ghBranch || 'main', ghPath);
      setGhPreview(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally { setGhPreviewing(false); }
  };

  const handleGhImport = async () => {
    if (!ghUrl.trim() || ghImporting) {return;}
    setGhImporting(true);
    setError(null);
    try {
      await importFromGitHub(ghUrl.trim(), {
        branch: ghBranch || 'main',
        path: ghPath || undefined,
        skip_duplicates: ghSkipDupes,
        domain: ghDomain || undefined,
      });
      setGhPreview(null);
      setGhUrl('');
      loadJobs();
      setActiveTab('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally { setGhImporting(false); }
  };

  // ─── File ──────────────────────────────────────────────────────────────

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.zip') || file.name.endsWith('.json') || file.name.endsWith('.md'))) {
      setSelectedFile(file);
      setFilePreview(null);
    }
  }, []);

  const handleFilePreview = async () => {
    if (!selectedFile || filePreviewing) {return;}
    setFilePreviewing(true);
    setFilePreview(null);
    setError(null);
    try {
      const preview = await previewFileImport(selectedFile);
      setFilePreview(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally { setFilePreviewing(false); }
  };

  const handleFileImport = async () => {
    if (!selectedFile || fileImporting) {return;}
    setFileImporting(true);
    setError(null);
    try {
      await importFromFile(selectedFile, {
        skip_duplicates: fileSkipDupes,
        domain: fileDomain || undefined,
      });
      setSelectedFile(null);
      setFilePreview(null);
      loadJobs();
      setActiveTab('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally { setFileImporting(false); }
  };

  // ─── Presets ───────────────────────────────────────────────────────────

  const handlePresetImport = async (presetId: string) => {
    if (importingPresetId) {return;}
    setImportingPresetId(presetId);
    setError(null);
    try {
      await importFromPreset(presetId);
      loadJobs();
      setActiveTab('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preset import failed');
    } finally { setImportingPresetId(null); }
  };

  // ─── Skills.sh ────────────────────────────────────────────────────────

  const handleShSearch = async () => {
    if (shSearching) {return;}
    setShSearching(true);
    setError(null);
    setShSelectedIds(new Set());
    try {
      const results = await searchSkillsSh(
        shQuery || undefined,
        shCategory || undefined,
        50
      );
      setShSearchResults(results.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'skills.sh search failed');
    } finally { setShSearching(false); }
  };

  const handleShToggleSkill = (id: string) => {
    setShSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {next.delete(id);}
      else {next.add(id);}
      return next;
    });
  };

  const handleShImport = async () => {
    if (shImporting) {return;}
    setShImporting(true);
    setError(null);
    try {
      const ids = shSelectedIds.size > 0 ? Array.from(shSelectedIds) : undefined;
      await importFromSkillsSh({
        skill_ids: ids,
        category: ids ? undefined : (shCategory || undefined),
        skip_duplicates: shSkipDupes,
      });
      setShSearchResults([]);
      setShSelectedIds(new Set());
      loadJobs();
      setActiveTab('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'skills.sh import failed');
    } finally { setShImporting(false); }
  };

  // ─── ClawHub ─────────────────────────────────────────────────────────

  const handleChSearch = async () => {
    if (chSearching) {return;}
    setChSearching(true);
    setError(null);
    setChSelectedSlugs(new Set());
    try {
      const results = await searchClawHub(
        chQuery || undefined,
        chCategory || undefined,
        50
      );
      setChSearchResults(results.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ClawHub search failed');
    } finally { setChSearching(false); }
  };

  const handleChToggleSkill = (slug: string) => {
    setChSelectedSlugs(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {next.delete(slug);}
      else {next.add(slug);}
      return next;
    });
  };

  const handleChImport = async () => {
    if (chImporting) {return;}
    setChImporting(true);
    setError(null);
    try {
      const slugs = chSelectedSlugs.size > 0 ? Array.from(chSelectedSlugs) : undefined;
      await importFromClawHub({
        query: slugs ? undefined : (chQuery || undefined),
        category: slugs ? undefined : (chCategory || undefined),
        skill_slugs: slugs,
        skip_duplicates: chSkipDupes,
      });
      setChSearchResults([]);
      setChSelectedSlugs(new Set());
      loadJobs();
      setActiveTab('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ClawHub import failed');
    } finally { setChImporting(false); }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={14} style={{ color: SUCCESS }} />;
      case 'failed': return <XCircle size={14} style={{ color: DANGER }} />;
      case 'running': return <Loader size={14} style={{ color: CYAN }} className="animate-spin" />;
      default: return <Clock size={14} style={{ color: WARNING }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) { case 'completed': return SUCCESS; case 'failed': return DANGER; case 'running': return CYAN; default: return WARNING; }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldX size={14} style={{ color: DANGER }} />;
      case 'high': return <ShieldAlert size={14} style={{ color: WARNING }} />;
      case 'medium': return <Shield size={14} style={{ color: '#f59e0b' }} />;
      default: return <ShieldCheck size={14} style={{ color: SUCCESS }} />;
    }
  };

  const tabs: { id: ImportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'github', label: 'GitHub', icon: <Github size={14} /> },
    { id: 'file', label: 'File Upload', icon: <Upload size={14} /> },
    { id: 'skills-sh', label: 'Skills.sh', icon: <Zap size={14} /> },
    { id: 'clawhub', label: 'ClawHub', icon: <Globe size={14} /> },
    { id: 'presets', label: 'Presets', icon: <Package size={14} /> },
    { id: 'history', label: 'History', icon: <Clock size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full" style={{ gap: '20px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: TEXT, margin: 0 }}>
            Import Skills
          </h2>
          <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: '4px 0 0' }}>
            Import skills from GitHub, files, or curated presets. All imports are security-scanned.
          </p>
        </div>
        <button
          onClick={() => { loadRules(); setShowRules(true); }}
          className="flex items-center gap-2"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: SUCCESS,
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Shield size={14} /> Security Rules
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between" style={{
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: DANGER,
          fontSize: '13px',
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: DANGER, cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'presets' && presets.length === 0) {loadPresets();}
              if (tab.id === 'history') {loadJobs();}
            }}
            className="flex items-center gap-2"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(0, 212, 255, 0.15)' : BG_CARD,
              color: activeTab === tab.id ? CYAN : TEXT_MUTED,
              border: activeTab === tab.id ? '1px solid rgba(0, 212, 255, 0.3)' : `1px solid ${BORDER}`,
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto ni-scrollbar">
        {/* ─── GitHub Tab ─────────────────────────────────────────── */}
        {activeTab === 'github' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
            <GlassCard variant="bordered" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex items-center gap-2">
                <Github size={18} style={{ color: TEXT }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>Import from GitHub</span>
              </div>
              <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: 0 }}>
                Import SKILL.md files from a GitHub repository. Skills are previewed and security-scanned before import.
              </p>

              {/* Repo URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                  Repository URL *
                </label>
                <input
                  type="text"
                  value={ghUrl}
                  onChange={(e) => setGhUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                />
              </div>

              {/* Branch + Path row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Branch
                  </label>
                  <input
                    type="text"
                    value={ghBranch}
                    onChange={(e) => setGhBranch(e.target.value)}
                    placeholder="main"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Path (optional)
                  </label>
                  <input
                    type="text"
                    value={ghPath}
                    onChange={(e) => setGhPath(e.target.value)}
                    placeholder="skills/"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                  />
                </div>
              </div>

              {/* Domain + Skip Dupes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Domain Override (optional)
                  </label>
                  <input
                    type="text"
                    value={ghDomain}
                    onChange={(e) => setGhDomain(e.target.value)}
                    placeholder="e.g., backend"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer" style={{ padding: '12px 0' }}>
                  <input
                    type="checkbox"
                    checked={ghSkipDupes}
                    onChange={(e) => setGhSkipDupes(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: TEXT_MUTED, whiteSpace: 'nowrap' }}>Skip duplicates</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleGhPreview}
                  disabled={!ghUrl.trim() || ghPreviewing}
                  className="flex items-center gap-2"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    cursor: ghUrl.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: ghUrl.trim() ? 1 : 0.5,
                  }}
                >
                  {ghPreviewing ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
                  {ghPreviewing ? 'Scanning...' : 'Preview & Scan'}
                </button>
                <button
                  onClick={handleGhImport}
                  disabled={!ghUrl.trim() || ghImporting}
                  className="flex items-center gap-2"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(0, 212, 255, 0.15)',
                    color: CYAN,
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    cursor: ghUrl.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: ghUrl.trim() ? 1 : 0.5,
                  }}
                >
                  {ghImporting ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                  {ghImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </GlassCard>

            {/* GitHub Preview Results */}
            {ghPreview && renderPreview(ghPreview)}
          </div>
        )}

        {/* ─── File Upload Tab ────────────────────────────────────── */}
        {activeTab === 'file' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
            <GlassCard variant="bordered" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex items-center gap-2">
                <Upload size={18} style={{ color: TEXT }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>Upload Skills File</span>
              </div>
              <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: 0 }}>
                Upload a .zip, .json, or .md file containing skill definitions. All skills are security-scanned before import.
              </p>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '40px 20px',
                  borderRadius: '12px',
                  border: `2px dashed ${isDragging ? CYAN : BORDER}`,
                  background: isDragging ? 'rgba(0, 212, 255, 0.05)' : BG_CARD,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.json,.md"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setSelectedFile(file); setFilePreview(null); }
                  }}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileJson size={24} style={{ color: CYAN }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{selectedFile.name}</div>
                      <div style={{ fontSize: '12px', color: TEXT_MUTED }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFilePreview(null); }}
                      style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} style={{ color: TEXT_MUTED, marginBottom: '12px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>
                      Drop file here or click to browse
                    </div>
                    <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '4px' }}>
                      Supports .zip, .json, .md files
                    </div>
                  </>
                )}
              </div>

              {/* Domain + Skip Dupes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Domain Override (optional)
                  </label>
                  <input
                    type="text"
                    value={fileDomain}
                    onChange={(e) => setFileDomain(e.target.value)}
                    placeholder="e.g., backend"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer" style={{ padding: '12px 0' }}>
                  <input
                    type="checkbox"
                    checked={fileSkipDupes}
                    onChange={(e) => setFileSkipDupes(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: TEXT_MUTED, whiteSpace: 'nowrap' }}>Skip duplicates</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleFilePreview}
                  disabled={!selectedFile || filePreviewing}
                  className="flex items-center gap-2"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    cursor: selectedFile ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: selectedFile ? 1 : 0.5,
                  }}
                >
                  {filePreviewing ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
                  {filePreviewing ? 'Scanning...' : 'Preview & Scan'}
                </button>
                <button
                  onClick={handleFileImport}
                  disabled={!selectedFile || fileImporting}
                  className="flex items-center gap-2"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(0, 212, 255, 0.15)',
                    color: CYAN,
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    cursor: selectedFile ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: selectedFile ? 1 : 0.5,
                  }}
                >
                  {fileImporting ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                  {fileImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </GlassCard>

            {/* File Preview Results */}
            {filePreview && renderPreview(filePreview)}
          </div>
        )}

        {/* ─── Skills.sh Tab ─────────────────────────────────────── */}
        {activeTab === 'skills-sh' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
            <GlassCard variant="bordered" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex items-center gap-2">
                <Zap size={18} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>Import from Skills.sh</span>
                <a
                  href="https://skills.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: CYAN, textDecoration: 'none', marginLeft: 'auto' }}
                >
                  skills.sh
                </a>
              </div>
              <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: 0 }}>
                Skills.sh is a community skill registry with 51K+ skills. Search and select skills to import.
                All imports are security-scanned.
              </p>

              {/* Search row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={shQuery}
                    onChange={(e) => setShQuery(e.target.value)}
                    placeholder="e.g., fastapi, react, testing..."
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                    onKeyDown={(e) => { if (e.key === 'Enter') {handleShSearch();} }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={shCategory}
                    onChange={(e) => setShCategory(e.target.value)}
                    placeholder="e.g., backend, devops..."
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                    onKeyDown={(e) => { if (e.key === 'Enter') {handleShSearch();} }}
                  />
                </div>
                <button
                  onClick={handleShSearch}
                  disabled={shSearching}
                  className="flex items-center gap-2"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    cursor: shSearching ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: shSearching ? 0.5 : 1,
                  }}
                >
                  {shSearching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                  Search
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shSkipDupes}
                  onChange={(e) => setShSkipDupes(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '13px', color: TEXT_MUTED }}>Skip duplicates</span>
              </label>
            </GlassCard>

            {/* Search Results */}
            {shSearchResults.length > 0 && (
              <GlassCard variant="bordered" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>
                    Results ({shSearchResults.length})
                  </span>
                  <div className="flex items-center gap-3">
                    {shSelectedIds.size > 0 && (
                      <span style={{ fontSize: '12px', color: CYAN }}>
                        {shSelectedIds.size} selected
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (shSelectedIds.size === shSearchResults.length) {
                          setShSelectedIds(new Set());
                        } else {
                          setShSelectedIds(new Set(shSearchResults.map(s => s.id)));
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: BG_CARD,
                        border: `1px solid ${BORDER}`,
                        color: TEXT_MUTED,
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {shSelectedIds.size === shSearchResults.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                  {shSearchResults.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => handleShToggleSkill(skill.id)}
                      className="flex items-center gap-3"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: shSelectedIds.has(skill.id) ? 'rgba(245, 158, 11, 0.08)' : BG_CARD,
                        border: `1px solid ${shSelectedIds.has(skill.id) ? 'rgba(245, 158, 11, 0.3)' : BORDER}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={shSelectedIds.has(skill.id)}
                        onChange={() => handleShToggleSkill(skill.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '16px', height: '16px', flexShrink: 0 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{skill.name}</div>
                        <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px' }}>
                          {skill.source}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        flexShrink: 0,
                      }}>
                        {skill.installs?.toLocaleString() ?? 0} installs
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleShImport}
                  disabled={shImporting}
                  className="flex items-center gap-2"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(0, 212, 255, 0.15)',
                    color: CYAN,
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    cursor: shImporting ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: shImporting ? 0.5 : 1,
                    alignSelf: 'flex-start',
                  }}
                >
                  {shImporting ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                  {shImporting
                    ? 'Importing...'
                    : shSelectedIds.size > 0
                      ? `Import ${shSelectedIds.size} Selected`
                      : `Import All ${shSearchResults.length} Skills`
                  }
                </button>
              </GlassCard>
            )}
          </div>
        )}

        {/* ─── ClawHub Tab ──────────────────────────────────────── */}
        {activeTab === 'clawhub' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
            <GlassCard variant="bordered" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex items-center gap-2">
                <Globe size={18} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>Import from ClawHub</span>
                <a
                  href="https://clawhub.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: CYAN, textDecoration: 'none', marginLeft: 'auto' }}
                >
                  clawhub.ai
                </a>
              </div>
              <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: 0 }}>
                ClawHub is the official skill marketplace for OpenClaw with 3,000+ community skills.
                Search and select skills to import. All imports are security-scanned.
              </p>

              {/* Search row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={chQuery}
                    onChange={(e) => setChQuery(e.target.value)}
                    placeholder="e.g., python, react, database..."
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                    onKeyDown={(e) => { if (e.key === 'Enter') {handleChSearch();} }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={chCategory}
                    onChange={(e) => setChCategory(e.target.value)}
                    placeholder="e.g., backend, tools..."
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = CYAN; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                    onKeyDown={(e) => { if (e.key === 'Enter') {handleChSearch();} }}
                  />
                </div>
                <button
                  onClick={handleChSearch}
                  disabled={chSearching}
                  className="flex items-center gap-2"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    cursor: chSearching ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: chSearching ? 0.5 : 1,
                  }}
                >
                  {chSearching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                  Search
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chSkipDupes}
                  onChange={(e) => setChSkipDupes(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '13px', color: TEXT_MUTED }}>Skip duplicates</span>
              </label>
            </GlassCard>

            {/* Search Results */}
            {chSearchResults.length > 0 && (
              <GlassCard variant="bordered" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>
                    Results ({chSearchResults.length})
                  </span>
                  <div className="flex items-center gap-3">
                    {chSelectedSlugs.size > 0 && (
                      <span style={{ fontSize: '12px', color: CYAN }}>
                        {chSelectedSlugs.size} selected
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (chSelectedSlugs.size === chSearchResults.length) {
                          setChSelectedSlugs(new Set());
                        } else {
                          setChSelectedSlugs(new Set(chSearchResults.map(s => s.slug)));
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: BG_CARD,
                        border: `1px solid ${BORDER}`,
                        color: TEXT_MUTED,
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {chSelectedSlugs.size === chSearchResults.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                  {chSearchResults.map((skill) => (
                    <div
                      key={skill.slug}
                      onClick={() => handleChToggleSkill(skill.slug)}
                      className="flex items-center gap-3"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: chSelectedSlugs.has(skill.slug) ? 'rgba(0, 212, 255, 0.08)' : BG_CARD,
                        border: `1px solid ${chSelectedSlugs.has(skill.slug) ? 'rgba(0, 212, 255, 0.3)' : BORDER}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={chSelectedSlugs.has(skill.slug)}
                        onChange={() => handleChToggleSkill(skill.slug)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '16px', height: '16px', flexShrink: 0 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{skill.name}</div>
                        {skill.description && (
                          <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {skill.description}
                          </div>
                        )}
                      </div>
                      {skill.version && (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          color: '#8b5cf6',
                          flexShrink: 0,
                        }}>
                          v{skill.version}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleChImport}
                  disabled={chImporting}
                  className="flex items-center gap-2"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(0, 212, 255, 0.15)',
                    color: CYAN,
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    cursor: chImporting ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: chImporting ? 0.5 : 1,
                    alignSelf: 'flex-start',
                  }}
                >
                  {chImporting ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                  {chImporting
                    ? 'Importing...'
                    : chSelectedSlugs.size > 0
                      ? `Import ${chSelectedSlugs.size} Selected`
                      : `Import All ${chSearchResults.length} Skills`
                  }
                </button>
              </GlassCard>
            )}
          </div>
        )}

        {/* ─── Presets Tab ────────────────────────────────────────── */}
        {activeTab === 'presets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
            <div className="flex items-center justify-between">
              <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: 0 }}>
                Curated skill packs ready to import. All presets are pre-scanned and verified.
              </p>
              <button
                onClick={loadPresets}
                style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', padding: '4px' }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {presetsLoading && (
              <div className="flex items-center justify-center" style={{ padding: '40px' }}>
                <Loader size={20} style={{ color: CYAN }} className="animate-spin" />
              </div>
            )}

            {!presetsLoading && presets.length === 0 && (
              <NeuralEmptyState
                icon={<Package size={32} />}
                title="No Presets Available"
                description="Skill presets are configured on the backend. Check the API or add preset configurations."
              />
            )}

            {!presetsLoading && presets.map((preset) => (
              <GlassCard key={preset.id} variant="bordered" style={{ padding: '16px 20px' }}>
                <div className="flex items-center gap-4">
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Package size={20} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{preset.name}</div>
                    <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px' }}>{preset.description}</div>
                    <div className="flex items-center gap-3" style={{ marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: CYAN }}>~{preset.estimated_count} skills</span>
                      <span style={{ fontSize: '11px', color: TEXT_MUTED }}>{preset.branch}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePresetImport(preset.id)}
                    disabled={!!importingPresetId}
                    className="flex items-center gap-2"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(0, 212, 255, 0.15)',
                      color: CYAN,
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      cursor: importingPresetId ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      opacity: importingPresetId ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {importingPresetId === preset.id
                      ? <><Loader size={14} className="animate-spin" /> Importing...</>
                      : <><Download size={14} /> Import</>
                    }
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* ─── History Tab ────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '700px' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>
                Import History ({jobs.length})
              </span>
              <button
                onClick={loadJobs}
                className="flex items-center gap-1"
                style={{
                  background: 'none',
                  border: 'none',
                  color: TEXT_MUTED,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {jobs.length === 0 && (
              <NeuralEmptyState
                icon={<Clock size={32} />}
                title="No Import History"
                description="Import jobs will appear here after you import skills."
              />
            )}

            {jobs.map((job) => (
              <GlassCard key={job.id} variant="bordered" style={{ padding: '14px 18px' }}>
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>
                        {job.source_type === 'github' ? 'GitHub' : job.source_type === 'file' ? 'File' : 'Preset'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: `${getStatusColor(job.status)}15`,
                        color: getStatusColor(job.status),
                        textTransform: 'uppercase',
                      }}>
                        {job.status}
                      </span>
                    </div>
                    {job.source_url && (
                      <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.source_url}
                      </div>
                    )}
                    <div className="flex items-center gap-4" style={{ marginTop: '6px', fontSize: '12px' }}>
                      <span style={{ color: SUCCESS }}>{job.imported_count} imported</span>
                      {job.skipped_count > 0 && <span style={{ color: WARNING }}>{job.skipped_count} skipped</span>}
                      {job.error_count > 0 && <span style={{ color: DANGER }}>{job.error_count} errors</span>}
                      <span style={{ color: TEXT_MUTED }}>
                        {new Date(job.started_at).toLocaleDateString()} {new Date(job.started_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                {job.errors && job.errors.length > 0 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '12px',
                    color: DANGER,
                    maxHeight: '80px',
                    overflow: 'auto',
                  }}>
                    {job.errors.slice(0, 3).map((err, i) => (
                      <div key={i}>{err.skill ? `${err.skill}: ` : ''}{err.error}</div>
                    ))}
                    {job.errors.length > 3 && (
                      <div style={{ color: TEXT_MUTED }}>...and {job.errors.length - 3} more</div>
                    )}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Security Rules Modal */}
      <NeuralModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="Security Scanning Rules"
        footer={
          <NeuralButton variant="secondary" onClick={() => setShowRules(false)}>Close</NeuralButton>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '13px', color: TEXT_MUTED, margin: '0 0 12px' }}>
            Every skill is scanned against these rules before import. CRITICAL findings block the import automatically.
          </p>
          {securityRules.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: TEXT_MUTED, fontSize: '13px' }}>
              Loading rules...
            </div>
          )}
          {securityRules.map((rule) => (
            <div key={rule.id} style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: BG_CARD,
              border: `1px solid ${BORDER}`,
            }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                {getSeverityIcon(rule.severity)}
                <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{rule.name}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: rule.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' :
                    rule.severity === 'high' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                  color: rule.severity === 'critical' ? DANGER :
                    rule.severity === 'high' ? WARNING : TEXT_MUTED,
                  textTransform: 'uppercase',
                }}>
                  {rule.severity}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: TEXT_MUTED }}>{rule.description}</div>
            </div>
          ))}
        </div>
      </NeuralModal>
    </div>
  );

  function renderPreview(preview: ImportPreview) {
    return (
      <GlassCard variant="bordered" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} style={{ color: SUCCESS }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>Preview Results</span>
        </div>

        <div className="flex items-center gap-4" style={{ fontSize: '13px' }}>
          <span style={{ color: CYAN, fontWeight: 600 }}>{preview.total_skills} skills found</span>
          {preview.existing_count > 0 && (
            <span style={{ color: WARNING }}>{preview.existing_count} already exist</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
          {preview.skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-3" style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: BG_CARD,
              border: `1px solid ${BORDER}`,
            }}>
              <CheckCircle2 size={12} style={{ color: SUCCESS, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{skill.name}</span>
                {skill.description && (
                  <span style={{ fontSize: '12px', color: TEXT_MUTED, marginLeft: '8px' }}>{skill.description}</span>
                )}
              </div>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                color: CYAN,
                flexShrink: 0,
              }}>
                {skill.domain}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }
}
