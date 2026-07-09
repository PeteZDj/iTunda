import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFarmerById, getMyListings } from '../services/api';
import { flagUrl } from '../lib/geo';
import LeafletMap, { type MapMarker } from '../components/LeafletMap';
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

      {farmer.farmImages && farmer.farmImages.length > 0 && (
        <div className="page-container">
          <div className="fp-farm-photos">
            {farmer.farmImages.map((src, i) => (
              <div key={i} className="fp-farm-photo">
                <img src={src} alt={`${farmer.farmName} field ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-container fp-body">
        <div className="fp-grid">
          {/* Left: info */}
          <div className="fp-info-col">
            <div className="card">
              <h3 className="card-section-title">Farm Information</h3>
              {[
                ['📍 Location', [farmer.region, farmer.country].filter(Boolean).join(', ') || '—'],
                ['🧭 Export Zone', farmer.zone ? `Zone ${farmer.zone}` : '—'],
                ['🌱 Specialization', farmer.specialization ?? '—'],
                ['🏆 Certifications', farmer.certifications ?? '—'],
                ['✈ Exports Directly', farmer.ableToExportDirectly ? `Yes — ${farmer.exportsDomain ?? 'Various markets'}` : 'No'],
              ].map(([l, v]) => (
                <div key={l} className="fp-info-row">
                  <span className="fp-info-label">{l}</span>
                  <span className="fp-info-value">{v}</span>
                </div>
              ))}
            </div>

            {farmer.farmLatitude != null && farmer.farmLongitude != null && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="detail-map-head">
                  <h3 className="card-section-title" style={{ margin: 0 }}>Farm Location</h3>
                  <a
                    href={`https://www.google.com/maps?q=${farmer.farmLatitude},${farmer.farmLongitude}`}
                    target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🗺 Google Maps</a>
                </div>
                <LeafletMap
                  height={280}
                  zoom={9}
                  markers={[{
                    lat: farmer.farmLatitude, lng: farmer.farmLongitude,
                    title: farmer.farmName, subtitle: `${farmer.region}, ${farmer.country}`,
                    color: '#0e7a3e', emoji: '🌱',
                    href: `https://www.google.com/maps?q=${farmer.farmLatitude},${farmer.farmLongitude}`,
                  } as MapMarker]}
                />
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img className="pc-flag" src={flagUrl(farmer.countryCode)} alt="" />
                  {farmer.farmLatitude.toFixed(4)}°, {farmer.farmLongitude.toFixed(4)}°
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
