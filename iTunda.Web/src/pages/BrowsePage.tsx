import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { getProduce, getCategories } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { flagUrl, ZONES } from '../lib/geo';
import type { ProduceResponse } from '../types';
import ProduceCard from '../components/ProduceCard';
import './BrowsePage.css';

export default function BrowsePage() {
  const [params] = useSearchParams();
  const { category: pathCategory } = useParams();
  const navigate = useNavigate();
  const { regions, zone, region, setZone, setRegion, clear } = useRegion();

  const [items, setItems] = useState<ProduceResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState(params.get('q') ?? '');
  const [exportOnly, setExportOnly] = useState(false);
  const [includeFuture, setIncludeFuture] = useState(false);

  // Category resolves from the path (/browse/Avocados) or the query (?category=Avocados)
  const category = pathCategory ? decodeURIComponent(pathCategory) : (params.get('category') ?? '');

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProduce({
        q: q || undefined,
        category: category || undefined,
        region: region || undefined,
        zone: zone ?? undefined,
        exportReady: exportOnly || undefined,
        includeFuture,
      });
      setItems(data);
    } catch {
      setError('Failed to load listings. Is the API running?');
    } finally { setLoading(false); }
  }, [q, category, region, zone, exportOnly, includeFuture]);

  useEffect(() => { load(); }, [load]);

  const applyCategory = (cat: string) => {
    if (cat) navigate(`/browse/${encodeURIComponent(cat)}`);
    else navigate('/browse');
  };

  const activeOriginLabel = region
    ? region
    : zone != null ? (ZONES.find(z => z.zone === zone)?.name ?? `Zone ${zone}`)
    : null;

  return (
    <div className="browse-page">
      <aside className="browse-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Search</h3>
          <input
            className="input"
            placeholder="e.g. avocados, Kenya…"
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
          <h3 className="sidebar-heading">Export Zone</h3>
          <div className="sidebar-chips">
            <button className={`chip ${zone == null && !region ? 'active' : ''}`} onClick={clear}>All</button>
            {ZONES.map(z => (
              <button key={z.zone} className={`chip ${zone === z.zone ? 'active' : ''}`} onClick={() => setZone(z.zone)}>
                Zone {z.zone}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Region of origin</h3>
          <select className="select" value={region ?? ''} onChange={e => setRegion(e.target.value || null)}>
            <option value="">All regions</option>
            {ZONES.map(z => (
              <optgroup key={z.zone} label={z.name}>
                {regions.filter(r => r.zone === z.zone).map(r => (
                  <option key={r.name} value={r.name}>{r.name}, {r.country} ({r.listingCount})</option>
                ))}
              </optgroup>
            ))}
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
          setQ(''); setExportOnly(false); setIncludeFuture(false); clear(); navigate('/browse');
        }}>
          Clear Filters
        </button>
      </aside>

      <main className="browse-main">
        <div className="browse-header">
          <div>
            <h1 className="browse-title">
              {category || 'All Produce'}
              {activeOriginLabel && <span className="browse-subtitle"> · {activeOriginLabel}</span>}
            </h1>
            {!loading && <p className="browse-count">{items.length.toLocaleString()} listings found</p>}
          </div>
          {category && (
            <button className="btn btn-outline btn-sm" onClick={() => applyCategory('')}>✕ Clear category</button>
          )}
        </div>

        {activeOriginLabel && (
          <div className="browse-origin-note">
            {region && regions.find(r => r.name === region) && (
              <img className="pc-flag" src={flagUrl(regions.find(r => r.name === region)!.countryCode)} alt="" />
            )}
            Showing produce from <strong>{activeOriginLabel}</strong>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 12 }} onClick={clear}>✕ Clear origin</button>
          </div>
        )}

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
