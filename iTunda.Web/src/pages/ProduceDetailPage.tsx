import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduceById, createOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  const [qty, setQty] = useState('50');
  const [address, setAddress] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    getProduceById(Number(id))
      .then(setItem)
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

  return (
    <div className="detail-page page-container" style={{ padding: '32px 24px' }}>
      {/* Back */}
      <Link to="/browse" className="detail-back">← Back to Browse</Link>

      <div className="detail-grid">
        {/* ── Left: main info ─────────────────────────────── */}
        <div>
          {/* Hero card */}
          <div className="detail-hero">
            <div className="detail-hero-inner">
              <div className="detail-badges">
                <span className="badge badge-accent">{item.category}</span>
                {item.isExportReady && <span className="badge badge-amber">✈ Export Ready</span>}
                {item.gradeQuality && <span className="badge badge-green">{item.gradeQuality}</span>}
                {isScheduled && <span className="badge badge-blue">🕐 Scheduled</span>}
              </div>
              <h1 className="detail-name">{item.name}</h1>
              <div className="detail-price">
                KES {item.price.toLocaleString()}
                <span>/ {item.unit}</span>
              </div>
              {isScheduled && (
                <div className="detail-scheduled">
                  🕐 Available from {fmt(item.availableFrom)}
                </div>
              )}
            </div>
          </div>

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

          {/* Description */}
          {item.description && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="card-section-title">About this listing</h3>
              <p style={{ color: '#444', lineHeight: 1.7, fontSize: 15 }}>{item.description}</p>
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
                ['📍 Location', item.town ? `${item.town}, ${item.county}` : item.county ?? '—'],
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

        {/* ── Right: order panel ──────────────────────────── */}
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

                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
                  Secure order · Delivery tracking included
                </p>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--primary)' }}>Farm Location</h4>
            {item.farmLatitude ? (
              <div className="map-placeholder">
                <div className="map-pin">📍</div>
                <div>
                  <strong>{item.farmName}</strong><br />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {item.town}, {item.subCounty}, {item.county}<br />
                    {item.farmLatitude.toFixed(4)}°N, {item.farmLongitude?.toFixed(4)}°E
                  </span>
                </div>
              </div>
            ) : <p style={{ color: 'var(--muted)', fontSize: 14 }}>Location not available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
