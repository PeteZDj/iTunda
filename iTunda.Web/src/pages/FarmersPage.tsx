import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFarmers } from '../services/api';
import { flagUrl } from '../lib/geo';
import type { FarmerResponse } from '../types';
import './FarmersPage.css';

type SortKey = 'rating' | 'orders' | 'acres';

function farmPhoto(f: FarmerResponse, i = 0): string {
  if (f.farmImages && f.farmImages[i]) return f.farmImages[i];
  const topic = (f.specialization || 'farm').split(/[,&]/)[0].trim().toLowerCase();
  return `https://loremflickr.com/640/360/${encodeURIComponent(topic)},farm?lock=${f.id * 10 + i}`;
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<FarmerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exportOnly, setExportOnly] = useState(false);
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState<SortKey>('rating');

  useEffect(() => {
    getFarmers().then(setFarmers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const countries = useMemo(
    () => Array.from(new Set(farmers.map(f => f.country).filter(Boolean))).sort() as string[],
    [farmers]);

  const stats = useMemo(() => ({
    total: farmers.length,
    exporters: farmers.filter(f => f.ableToExportDirectly).length,
    acres: Math.round(farmers.reduce((s, f) => s + (f.sizeOfFarmAcres || 0), 0)),
    orders: farmers.reduce((s, f) => s + (f.ordersFulfilled || 0), 0),
    rating: farmers.length ? farmers.reduce((s, f) => s + f.ratingFarmer, 0) / farmers.length : 0,
  }), [farmers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return farmers
      .filter(f =>
        (!q || f.name.toLowerCase().includes(q) || f.farmName?.toLowerCase().includes(q) ||
          f.locationCounty?.toLowerCase().includes(q) || f.specialization?.toLowerCase().includes(q) ||
          f.region?.toLowerCase().includes(q) || f.country?.toLowerCase().includes(q))
        && (!exportOnly || f.ableToExportDirectly)
        && (!country || f.country === country))
      .sort((a, b) =>
        sort === 'orders' ? b.ordersFulfilled - a.ordersFulfilled
          : sort === 'acres' ? b.sizeOfFarmAcres - a.sizeOfFarmAcres
            : b.ratingFarmer - a.ratingFarmer);
  }, [farmers, search, exportOnly, country, sort]);

  return (
    <div className="farmers-page">
      <div className="fp-hero">
        <div className="page-container">
          <h1 className="fp-title">Meet the Growers</h1>
          <p className="fp-sub">
            A verified network of {stats.total} farms across {countries.length} countries — from smallholder
            co-ops to certified exporters. Every profile shows real farm data, produce and location.
          </p>
          <div className="fp-stats">
            <div><b>{stats.total}</b><span>Farms</span></div>
            <div><b>{stats.exporters}</b><span>Exporters</span></div>
            <div><b>{stats.acres.toLocaleString()}</b><span>Acres farmed</span></div>
            <div><b>{stats.orders.toLocaleString()}</b><span>Orders fulfilled</span></div>
            <div><b>★ {stats.rating.toFixed(1)}</b><span>Avg rating</span></div>
          </div>
        </div>
      </div>

      <div className="page-container fp-body">
        <div className="fp-controls">
          <input className="input fp-search" placeholder="Search farms, counties, crops, regions…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="select" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="rating">Top rated</option>
            <option value="orders">Most orders</option>
            <option value="acres">Largest farms</option>
          </select>
          <button className={`fp-toggle ${exportOnly ? 'active' : ''}`} onClick={() => setExportOnly(v => !v)}>✈ Exporters only</button>
        </div>

        {loading && <div className="spinner" />}
        {!loading && (
          <>
            <div className="fp-count">{filtered.length} farm{filtered.length === 1 ? '' : 's'}</div>
            <div className="fp-grid">
              {filtered.map(f => <FarmerCard key={f.id} farmer={f} />)}
            </div>
            {filtered.length === 0 && <div className="fp-empty">No farms match your filters.</div>}
          </>
        )}
      </div>
    </div>
  );
}

function FarmerCard({ farmer: f }: { farmer: FarmerResponse }) {
  const gallery = (f.farmImages && f.farmImages.length ? f.farmImages : [farmPhoto(f, 0), farmPhoto(f, 1), farmPhoto(f, 2)]).slice(0, 3);
  const crops = (f.specialization || '').split(/[,&]/).map(s => s.trim()).filter(Boolean).slice(0, 3);

  return (
    <Link to={`/farmers/${f.id}`} className="fc2">
      <div className="fc2-cover" style={{ backgroundImage: `url(${gallery[0]})` }}>
        <div className="fc2-cover-grad" />
        {f.ableToExportDirectly && <span className="fc2-export">✈ Export-ready</span>}
        <span className="fc2-rating">★ {f.ratingFarmer.toFixed(1)}</span>
        <div className="fc2-loc">
          {f.countryCode && <img className="fc2-flag" src={flagUrl(f.countryCode)} alt="" />}
          <span>{f.region || f.locationTown || f.locationCounty}{f.country ? `, ${f.country}` : ''}</span>
        </div>
      </div>

      <div className="fc2-body">
        <div className="fc2-head">
          <div className="fc2-avatar">
            {f.imagePath ? <img src={f.imagePath} alt="" /> : <span>{f.name[0]}</span>}
          </div>
          <div className="fc2-names">
            <div className="fc2-farm">{f.farmName}</div>
            <div className="fc2-by">by {f.name}</div>
          </div>
        </div>

        {f.description && <p className="fc2-desc">{f.description.slice(0, 130)}{f.description.length > 130 ? '…' : ''}</p>}

        {crops.length > 0 && (
          <div className="fc2-chips">
            {crops.map(c => <span key={c} className="fc2-chip">{c}</span>)}
            {f.zone ? <span className="fc2-chip zone">Zone {f.zone}</span> : null}
          </div>
        )}

        <div className="fc2-stats">
          <div><b>{f.sizeOfFarmAcres.toFixed(0)}</b><span>acres</span></div>
          <div><b>{f.ordersFulfilled}</b><span>orders</span></div>
          <div><b>{f.ratingFarmer.toFixed(1)}</b><span>rating</span></div>
        </div>

        {gallery.length > 1 && (
          <div className="fc2-thumbs">
            {gallery.slice(1, 3).map((src, i) => <img key={i} src={src} alt="" loading="lazy" />)}
            <span className="fc2-view">View farm →</span>
          </div>
        )}

        {f.certifications && <div className="fc2-certs">🏆 {f.certifications}</div>}
      </div>
    </Link>
  );
}
