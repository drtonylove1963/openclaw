import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { MemoryUnitCard, type MemoryUnit, type MemoryStratum, type MemoryScope } from './MemoryUnitCard';
import { NeuralEmptyState } from '../shared/NeuralEmptyState';
import { NeuralModal, NeuralButton } from '../shared/NeuralModal';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface MnemosyneFilters {
  stratum: MemoryStratum | 'all';
  scope: MemoryScope | 'all';
  minConfidence: number;
}

/**
 * MnemosyneTab - Memory unit browser with filters
 *
 * Features:
 * - Stratum filter chips (episodic, semantic, procedural, meta-cognitive)
 * - Scope filter chips (local, project, global)
 * - Confidence slider (0-100)
 * - Memory unit grid (auto-fill, minmax 300px)
 * - Create Memory button opens modal
 */
export function MnemosyneTab() {
  const [units, setUnits] = useState<MemoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MnemosyneFilters>({
    stratum: 'all',
    scope: 'all',
    minConfidence: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMemory, setNewMemory] = useState({
    content: '',
    stratum: 'semantic' as MemoryStratum,
    scope: 'local' as MemoryScope,
    tags: '',
  });

  // Fetch memory units
  useEffect(() => {
    fetchMemoryUnits();
  }, [filters]);

  const fetchMemoryUnits = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('pronetheia_token');
      const params = new URLSearchParams();

      if (filters.stratum !== 'all') {params.append('stratum', filters.stratum);}
      if (filters.scope !== 'all') {params.append('scope', filters.scope);}
      if (filters.minConfidence > 0) {params.append('min_confidence', filters.minConfidence.toString());}

      const response = await fetch(`${API_BASE}/api/v1/mnemosyne/units?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {throw new Error('Failed to fetch memory units');}

      const data = await response.json();
      setUnits(data.units || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMemory = async () => {
    if (!newMemory.content.trim()) {return;}

    try {
      const token = localStorage.getItem('pronetheia_token');
      const response = await fetch(`${API_BASE}/api/v1/mnemosyne/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: newMemory.content,
          stratum: newMemory.stratum,
          scope: newMemory.scope,
          tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {throw new Error('Failed to create memory unit');}

      // Reset form and close modal
      setNewMemory({ content: '', stratum: 'semantic', scope: 'local', tags: '' });
      setIsModalOpen(false);

      // Refresh list
      fetchMemoryUnits();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create memory');
    }
  };

  const filteredUnits = units.filter(unit => unit.confidence >= filters.minConfidence);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters Section */}
      <div style={{ marginBottom: '24px' }}>
        {/* Stratum Filters */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Stratum
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'episodic', 'semantic', 'procedural', 'meta-cognitive'] as const).map((stratum) => (
              <button
                key={stratum}
                onClick={() => setFilters(prev => ({ ...prev, stratum }))}
                className="text-[12px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: filters.stratum === stratum
                    ? 'rgba(0, 212, 255, 0.2)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: filters.stratum === stratum
                    ? '1px solid rgba(0, 212, 255, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: filters.stratum === stratum ? '#00d4ff' : '#f0f0f5',
                  textTransform: 'capitalize',
                }}
              >
                {stratum}
              </button>
            ))}
          </div>
        </div>

        {/* Scope Filters */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Scope
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'local', 'project', 'global'] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => setFilters(prev => ({ ...prev, scope }))}
                className="text-[12px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: filters.scope === scope
                    ? 'rgba(0, 212, 255, 0.2)'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: filters.scope === scope
                    ? '1px solid rgba(0, 212, 255, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: filters.scope === scope ? '#00d4ff' : '#f0f0f5',
                  textTransform: 'capitalize',
                }}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Slider */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Minimum Confidence: {filters.minConfidence}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.minConfidence}
            onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseInt(e.target.value) }))}
            className="w-full cursor-pointer"
            style={{
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.08)',
              outline: 'none',
            }}
          />
        </div>

        {/* Create Memory Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 text-[14px] font-medium transition-all duration-200 cursor-pointer border-0 outline-none"
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: 'rgba(0, 212, 255, 0.2)',
            border: '1px solid rgba(0, 212, 255, 0.4)',
            color: '#00d4ff',
          }}
        >
          <Plus size={16} />
          Create Memory
        </button>
      </div>

      {/* Memory Grid */}
      <div className="flex-1 overflow-auto ni-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Loading memories...</span>
          </div>
        ) : error ? (
          <NeuralEmptyState
            icon={<span style={{ fontSize: '32px' }}>⚠️</span>}
            title="Error Loading Memories"
            description={error}
          />
        ) : filteredUnits.length === 0 ? (
          <NeuralEmptyState
            icon={<span style={{ fontSize: '32px' }}>🧬</span>}
            title="No Memories Found"
            description="No memory units match your current filters. Try adjusting the filters or create a new memory."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredUnits.map((unit) => (
              <MemoryUnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </div>

      {/* Create Memory Modal */}
      <NeuralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Memory Unit"
        footer={
          <>
            <NeuralButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </NeuralButton>
            <NeuralButton
              variant="primary"
              onClick={handleCreateMemory}
              disabled={!newMemory.content.trim()}
            >
              Create
            </NeuralButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Content Textarea */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Content
            </label>
            <textarea
              value={newMemory.content}
              onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter memory content..."
              rows={4}
              className="w-full ni-scrollbar"
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f0f0f5',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Stratum Selector */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Stratum
            </label>
            <select
              value={newMemory.stratum}
              onChange={(e) => setNewMemory(prev => ({ ...prev, stratum: e.target.value as MemoryStratum }))}
              className="w-full cursor-pointer"
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f0f0f5',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="episodic">Episodic</option>
              <option value="semantic">Semantic</option>
              <option value="procedural">Procedural</option>
              <option value="meta-cognitive">Meta-cognitive</option>
            </select>
          </div>

          {/* Scope Selector */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Scope
            </label>
            <select
              value={newMemory.scope}
              onChange={(e) => setNewMemory(prev => ({ ...prev, scope: e.target.value as MemoryScope }))}
              className="w-full cursor-pointer"
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f0f0f5',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="local">Local</option>
              <option value="project">Project</option>
              <option value="global">Global</option>
            </select>
          </div>

          {/* Tags Input */}
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={newMemory.tags}
              onChange={(e) => setNewMemory(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="ai, memory, semantic"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f0f0f5',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </NeuralModal>
    </div>
  );
}
