import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFarmers } from '../services/api';
import type { FarmerResponse } from '../types';
import './FarmersPage.css';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<FarmerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getFarmers()
      .then(setFarmers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.farmName?.toLowerCase().includes(search.toLowerCase())) ||
    (f.locationCounty?.toLowerCase().includes(search.toLowerCase())) ||
    (f.specialization?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="page-container">
        <div className="farmers-header">
          <div>
            <h1 className="farmers-title">Our Farmers</h1>
            <p className="farmers-sub">Meet the {farmers.length} certified farmers powering Kenya's export market</p>
          </div>
          <input
            className="input"
            style={{ maxWidth: 280 }}
            placeholder="Search farmers, counties…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <div className="spinner" />}
        {!loading && (
          <div className="farmers-grid">
            {filtered.map(f => <FarmerCard key={f.id} farmer={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function FarmerCard({ farmer }: { farmer: FarmerResponse }) {
  return (
    <Link to={`/farmers/${farmer.id}`} className="farmer-card">
      <div className="fc-header">
        <div className="fc-avatar">{farmer.name[0]}</div>
        <div>
          <div className="fc-farm-name">{farmer.farmName}</div>
          <div className="fc-name">by {farmer.name}</div>
        </div>
        <div className="fc-rating">★ {farmer.ratingFarmer.toFixed(1)}</div>
      </div>

      {farmer.description && (
        <p className="fc-desc">{farmer.description.slice(0, 120)}…</p>
      )}

      <div className="fc-chips">
        {farmer.specialization && <span className="badge badge-accent">{farmer.specialization}</span>}
        {farmer.ableToExportDirectly && <span className="badge badge-amber">✈ Exports</span>}
      </div>

      <div className="fc-meta">
        <span>📍 {farmer.locationTown || farmer.locationCounty}</span>
        <span>🌾 {farmer.sizeOfFarmAcres.toFixed(0)} acres</span>
        <span>📦 {farmer.ordersFulfilled} orders</span>
      </div>

      {farmer.certifications && (
        <div className="fc-certs">🏆 {farmer.certifications}</div>
      )}
    </Link>
  );
}
