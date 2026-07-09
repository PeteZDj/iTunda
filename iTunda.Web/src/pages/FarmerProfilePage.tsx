import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFarmerById, getMyListings } from '../services/api';
import type { FarmerResponse, ProduceResponse } from '../types';
import ProduceCard from '../components/ProduceCard';
import './FarmerProfilePage.css';

export default function FarmerProfilePage() {
  const { id } = useParams();
  const [farmer, setFarmer] = useState<FarmerResponse | null>(null);
  const [listings, setListings] = useState<ProduceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fid = Number(id);
    Promise.all([getFarmerById(fid), getMyListings(fid)])
      .then(([f, l]) => { setFarmer(f); setListings(l); })
      .catch(() => setError('Farmer not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (error || !farmer) return <div className="alert alert-error" style={{ margin: 40 }}>{error}</div>;

  return (
    <div className="fp-page">
      {/* Dark hero header */}
      <div className="fp-hero">
        <div className="page-container fp-hero-inner">
          <Link to="/farmers" className="fp-back">← All Farmers</Link>
          <div className="fp-hero-content">
            <div className="fp-avatar-xl">{farmer.name[0]}</div>
            <div>
              <h1 className="fp-farm-name">{farmer.farmName}</h1>
              <p className="fp-by">by {farmer.name}</p>
              {farmer.phone && <p className="fp-phone">📞 {farmer.phone}</p>}
            </div>
            <div className="fp-stats">
              <div className="fp-stat"><span className="fp-stat-v">★ {farmer.ratingFarmer.toFixed(1)}</span><span className="fp-stat-l">Rating</span></div>
              <div className="fp-stat"><span className="fp-stat-v">{farmer.ordersFulfilled}</span><span className="fp-stat-l">Orders</span></div>
              <div className="fp-stat"><span className="fp-stat-v">{farmer.sizeOfFarmAcres.toFixed(0)} ac</span><span className="fp-stat-l">Farm Size</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container fp-body">
        <div className="fp-grid">
          {/* Left: info */}
          <div className="fp-info-col">
            <div className="card">
              <h3 className="card-section-title">Farm Information</h3>
              {[
                ['📍 Location', [farmer.locationTown, farmer.locationSubCounty, farmer.locationCounty].filter(Boolean).join(', ')],
                ['🌱 Specialization', farmer.specialization ?? '—'],
                ['🏆 Certifications', farmer.certifications ?? '—'],
                ['✈ Exports Directly', farmer.ableToExportDirectly ? `Yes — ${farmer.exportsDomain ?? 'Various markets'}` : 'No'],
                ['🌍 Export Markets', farmer.exportsDomain ?? '—'],
              ].map(([l, v]) => (
                <div key={l} className="fp-info-row">
                  <span className="fp-info-label">{l}</span>
                  <span className="fp-info-value">{v}</span>
                </div>
              ))}
            </div>

            {farmer.farmLatitude && (
              <div className="card" style={{ marginTop: 16 }}>
                <h3 className="card-section-title">GPS Location</h3>
                <div className="fp-gps-card">
                  <div className="fp-gps-icon">📍</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{farmer.farmName}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                      {farmer.locationCounty} County, Kenya<br />
                      {farmer.farmLatitude.toFixed(4)}°, {farmer.farmLongitude?.toFixed(4)}°
                    </div>
                  </div>
                </div>
              </div>
            )}

            {farmer.description && (
              <div className="card" style={{ marginTop: 16 }}>
                <h3 className="card-section-title">About the Farm</h3>
                <p style={{ color: '#444', lineHeight: 1.7, fontSize: 15 }}>{farmer.description}</p>
              </div>
            )}
          </div>

          {/* Right: listings */}
          <div>
            <h2 className="fp-listings-title">Active Listings ({listings.length})</h2>
            {listings.length === 0 ? (
              <div style={{ color: 'var(--muted)', padding: '32px 0', textAlign: 'center' }}>No active listings.</div>
            ) : (
              <div className="fp-listings-grid">
                {listings.map(item => <ProduceCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
