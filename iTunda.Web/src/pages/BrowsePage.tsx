import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProduce, getCategories } from '../services/api';
import type { ProduceResponse } from '../types';
import ProduceCard from '../components/ProduceCard';
import './BrowsePage.css';

const KENYAN_COUNTIES = [
  'Nairobi','Murang\'a','Nyeri','Kirinyaga','Nakuru','Nandi','Kisumu',
  'Kilifi','Kajiado','Machakos','Trans Nzoia','Elgeyo Marakwet','Kisii',
  'Homa Bay','Makueni','Uasin Gishu',
];

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<ProduceResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [county, setCounty] = useState(params.get('county') ?? '');
  const [exportOnly, setExportOnly] = useState(false);
  const [includeFuture, setIncludeFuture] = useState(false);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProduce({
        q: q || undefined,
        category: category || undefined,
        county: county || undefined,
        exportReady: exportOnly || undefined,
        includeFuture,
      });
      setItems(data);
    } catch {
      setError('Failed to load listings. Is the API running?');
    } finally { setLoading(false); }
  }, [q, category, county, exportOnly, includeFuture]);

  useEffect(() => { load(); }, [load]);

  const applyCategory = (cat: string) => {
    setCategory(cat);
    setParams(cat ? { category: cat } : {});
  };

  return (
    <div className="browse-page">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="browse-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Search</h3>
          <input
            className="input"
            placeholder="e.g. avocados, onions…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
          <button className="btn btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center', borderRadius: 8 }} onClick={load}>
            Search
          </button>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Category</h3>
          <div className="sidebar-chips">
            <button className={`chip ${!category ? 'active' : ''}`} onClick={() => applyCategory('')}>All</button>
            {categories.map(c => (
              <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => applyCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">County</h3>
          <select className="select" value={county} onChange={e => setCounty(e.target.value)}>
            <option value="">All Counties</option>
            {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Filters</h3>
          <label className="check-label">
            <input type="checkbox" checked={exportOnly} onChange={e => setExportOnly(e.target.checked)} />
            ✈ Export Ready Only
          </label>
          <label className="check-label">
            <input type="checkbox" checked={includeFuture} onChange={e => setIncludeFuture(e.target.checked)} />
            🕐 Include Scheduled
          </label>
        </div>

        <button className="btn btn-outline btn-sm" style={{ margin: '0 16px' }} onClick={() => {
          setQ(''); setCategory(''); setCounty(''); setExportOnly(false); setIncludeFuture(false); setParams({});
        }}>
          Clear Filters
        </button>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="browse-main">
        <div className="browse-header">
          <div>
            <h1 className="browse-title">
              {category || 'All Produce'}
              {county && <span className="browse-subtitle"> in {county}</span>}
            </h1>
            {!loading && <p className="browse-count">{items.length.toLocaleString()} listings found</p>}
          </div>
          {category && (
            <button className="btn btn-outline btn-sm" onClick={() => applyCategory('')}>✕ Clear category</button>
          )}
        </div>

        {loading && <div className="spinner" />}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="browse-empty">
            <div style={{ fontSize: 48 }}>🔍</div>
            <h3>No listings found</h3>
            <p>Try clearing some filters or a different search term.</p>
          </div>
        )}
        {!loading && (
          <div className="browse-grid">
            {items.map(item => <ProduceCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </div>
  );
}
