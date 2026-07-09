import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduceById, createOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { flagUrl } from '../lib/geo';
import LeafletMap, { type MapMarker } from '../components/LeafletMap';
import type { ProduceResponse } from '../types';
import './ProduceDetailPage.css';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProduceDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<ProduceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState('50');
  const [address, setAddress] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduceById(Number(id))
      .then(p => { setItem(p); setActiveImg(0); })
      .catch(() => setError('Listing not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOrder = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!address.trim()) { setOrderError('Please enter a delivery address.'); return; }
    const q = parseFloat(qty);
    if (!q || q <= 0) { setOrderError('Please enter a valid quantity.'); return; }
    setOrdering(true);
    setOrderError('');
    try {
      await createOrder({ deliveryAddress: address, items: [{ produceId: item!.id, quantity: q }] });
      setOrderSuccess(true);
    } catch (err: any) {
      setOrderError(err?.response?.data || 'Order failed. Please try again.');
    } finally { setOrdering(false); }
  };

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (error || !item) return <div className="alert alert-error" style={{ margin: 40 }}>{error || 'Not found'}</div>;

  const isScheduled = item.availableFrom && new Date(item.availableFrom) > new Date();
  const images = [item.imageUrl, ...item.gallery].filter(Boolean);

  // Farm + distributor collection hub + suggested meet-up point for the map.
  const hasGeo = item.farmLatitude != null && item.farmLongitude != null;
  const flat = item.farmLatitude ?? 0;
  const flng = item.farmLongitude ?? 0;
  const hub: [number, number] = [flat + 0.16, flng + 0.16];
  const meet: [number, number] = [flat + 0.08, flng + 0.08];
  const gmapsMeet = `https://www.google.com/maps/dir/?api=1&origin=${flat},${flng}&destination=${hub[0]},${hub[1]}&travelmode=driving`;
  const gmapsFarm = `https://www.google.com/maps?q=${flat},${flng}`;

  const markers: MapMarker[] = hasGeo ? [
    { lat: flat, lng: flng, title: item.farmName ?? 'Farm', subtitle: `${item.region}, ${item.country}`, color: '#0e7a3e', emoji: '🌱', href: gmapsFarm },
    { lat: meet[0], lng: meet[1], title: 'Suggested meet-up point', subtitle: 'Farm ↔ distributor handover', color: '#f4a621', emoji: '🤝', href: gmapsMeet },
    { lat: hub[0], lng: hub[1], title: 'Regional collection hub', subtitle: 'Distributor pickup & consolidation', color: '#0a4a26', emoji: '🚚' },
  ] : [];

  return (
    <div className="detail-page page-container" style={{ padding: '28px 24px' }}>
      <Link to="/browse" className="detail-back">← Back to Browse</Link>

      <div className="detail-grid">
        <div>
          {/* Image gallery */}
          <div className="detail-gallery">
            <div className="dg-main">
              <img src={images[activeImg]} alt={item.name} />
              <div className="dg-main-badges">
                <span className="badge badge-accent"><img className="pc-cat-icon" src={item.iconUrl} alt="" /> {item.category}</span>
                {item.isExportReady && <span className="badge badge-amber">✈ Export Ready</span>}
                {item.gradeQuality && <span className="badge badge-green">{item.gradeQuality}</span>}
              </div>
            </div>
            {images.length > 1 && (
              <div className="dg-thumbs">
                {images.map((src, i) => (
                  <button key={i} className={`dg-thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={src} alt={`${item.name} ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title + price */}
          <div className="detail-headline">
            <div>
              <h1 className="detail-name">{item.name}</h1>
              <div className="detail-origin">
                <img className="pc-flag" src={flagUrl(item.countryCode)} alt="" />
                {item.region}, {item.country} · Zone {item.zone}
              </div>
            </div>
            <div className="detail-price">
              KES {item.price.toLocaleString()}<span>/ {item.unit}</span>
            </div>
          </div>
          {isScheduled && <div className="detail-scheduled">🕐 Available from {fmt(item.availableFrom)}</div>}

          {/* Info grid */}
          <div className="detail-info-grid card" style={{ marginTop: 16 }}>
            {[
              ['Quantity Available', `${item.quantityAvailable.toLocaleString()} ${item.unit}`],
              ['Harvest Date', fmt(item.harvestDate)],
              ['Expiry Date', fmt(item.expiryDate)],
              ['Grade / Quality', item.gradeQuality ?? 'Standard'],
              ['Unit', item.unit.toUpperCase()],
              ['Export Ready', item.isExportReady ? 'Yes ✓' : 'No'],
            ].map(([label, value]) => (
              <div key={label} className="info-cell">
                <span className="info-label">{label}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>

          {item.description && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="card-section-title">About this listing</h3>
              <p style={{ color: '#444', lineHeight: 1.7, fontSize: 15 }}>{item.description}</p>
            </div>
          )}

          {/* Map with pins */}
          {hasGeo && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="detail-map-head">
                <h3 className="card-section-title" style={{ margin: 0 }}>Location & meet-up point</h3>
                <a href={gmapsMeet} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🗺 Open route in Google Maps</a>
              </div>
              <LeafletMap markers={markers} height={340} zoom={11} />
              <div className="detail-map-legend">
                <span><i className="lg-dot" style={{ background: '#0e7a3e' }} /> Farm</span>
                <span><i className="lg-dot" style={{ background: '#f4a621' }} /> Meet-up point</span>
                <span><i className="lg-dot" style={{ background: '#0a4a26' }} /> Distributor hub</span>
              </div>
            </div>
          )}

          {/* Farmer card */}
          <div className="card farmer-card" style={{ marginTop: 16 }}>
            <h3 className="card-section-title">About the Farmer</h3>
            <div className="farmer-header">
              <div className="farmer-avatar-lg">{item.farmerName[0]}</div>
              <div>
                <div className="farmer-name-lg">{item.farmName || item.farmerName}</div>
                <div className="farmer-meta-lg">by {item.farmerName}</div>
                <div className="farmer-rating-lg">★ {item.farmerRating.toFixed(1)} · {item.farmerOrdersFulfilled} orders fulfilled</div>
              </div>
            </div>
            <div className="farmer-info-rows">
              {[
                ['📍 Location', `${item.region}, ${item.country}`],
                ['🗺 GPS', item.farmLatitude ? `${item.farmLatitude.toFixed(4)}°, ${item.farmLongitude?.toFixed(4)}°` : '—'],
                ['📞 Phone', item.farmerPhone ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="farmer-info-row">
                  <span className="farmer-info-label">{label}</span>
                  <span className="farmer-info-value">{value}</span>
                </div>
              ))}
            </div>
            <Link to={`/farmers/${item.farmerProfileId}`} className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
              View Full Farmer Profile →
            </Link>
          </div>
        </div>

        {/* Right: order panel */}
        <div className="order-panel">
          <div className="card order-card">
            <h3 className="card-section-title">Place Order</h3>
            {orderSuccess ? (
              <div>
                <div className="alert alert-success">🎉 Order placed successfully!</div>
                <Link to="/orders" className="btn btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', borderRadius: 8 }}>
                  View My Orders →
                </Link>
              </div>
            ) : (
              <>
                <div className="order-price-display">
                  <span className="order-price-big">KES {item.price.toLocaleString()}</span>
                  <span className="order-price-unit">per {item.unit}</span>
                </div>

                {orderError && <div className="alert alert-error">{orderError}</div>}

                <div className="field-group">
                  <label className="field-label">Quantity ({item.unit})</label>
                  <input className="input" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
                </div>
                {qty && !isNaN(Number(qty)) && (
                  <div className="order-total">
                    Total: <strong>KES {(item.price * Number(qty)).toLocaleString()}</strong>
                  </div>
                )}
                <div className="field-group">
                  <label className="field-label">Delivery Address</label>
                  <textarea className="input textarea" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your delivery address…" rows={3} />
                </div>

                {isLoggedIn ? (
                  <button className="btn btn-amber" disabled={ordering}
                    style={{ width: '100%', justifyContent: 'center', borderRadius: 8 }}
                    onClick={handleOrder}>
                    {ordering ? 'Placing order…' : '🛒 Place Order'}
                  </button>
                ) : (
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 8 }}>
                    Sign In to Order
                  </Link>
                )}

                <Link to="/delivery" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', borderRadius: 8, marginTop: 10 }}>
                  🚚 Estimate delivery & route
                </Link>

                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
                  Secure order · Delivery tracking included
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
