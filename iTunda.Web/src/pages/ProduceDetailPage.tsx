import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getProduceById } from '../services/api';
import { flagUrl } from '../lib/geo';
import { useCurrency } from '../context/CurrencyContext';
import LeafletMap, { type MapMarker } from '../components/LeafletMap';
import TradeTicket from '../components/TradeTicket';
import BuyPanel from '../components/BuyPanel';
import type { ProduceResponse, OrderKind, OrderSide } from '../types';
import './ProduceDetailPage.css';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProduceDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [item, setItem] = useState<ProduceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const { format } = useCurrency();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getProduceById(Number(id))
      .then(p => { setItem(p); setActiveImg(0); })
      .catch(() => setError('Listing not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const offers = useMemo(() => item ? [item] : [], [item]);

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (error || !item) return (
    <div className="page-container" style={{ padding: '48px 24px' }}>
      <h1>This harvest is no longer available</h1>
      <p>Browse other batches from growers.</p>
      <Link to="/browse" className="btn btn-primary" style={{ marginTop: 16 }}>Browse harvests</Link>
    </div>
  );

  const marketDay = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
  const isScheduled = item.availableFrom && item.availableFrom.slice(0, 10) > marketDay;
  const isAvailable = !isScheduled && !item.isDraft && item.quantityAvailable > 0
    && item.expiryDate !== null && item.expiryDate.slice(0, 10) >= marketDay;
  const images = [item.imageUrl, ...item.gallery].filter(Boolean);
  const origin = [item.region || item.town || item.county, item.country].filter(Boolean).join(', ');
  const phone = item.farmerPhone?.replace(/[^+\d]/g, '');
  const advanced = params.has('kind') || params.has('side');

  const initialKind = (params.get('kind') as OrderKind) || 'Spot';
  const initialSide = (params.get('side') as OrderSide) || 'Buy';

  const hasGeo = item.farmLatitude != null && item.farmLongitude != null;
  const flat = item.farmLatitude ?? 0;
  const flng = item.farmLongitude ?? 0;
  const gmapsFarm = `https://www.google.com/maps?q=${flat},${flng}`;

  const markers: MapMarker[] = hasGeo ? [
    { lat: flat, lng: flng, title: item.farmName ?? 'Farm', subtitle: origin || 'Grower-provided location', color: '#0e7a3e', emoji: '🌱', href: gmapsFarm },
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
                {origin || 'See the grower’s map pin'}
              </div>
            </div>
            <div className="detail-price">
              {format(item.price)}<span>/ {item.unit}</span>
            </div>
          </div>
          {isScheduled && <div className="detail-scheduled">🕐 Available from {fmt(item.availableFrom)}</div>}

          {/* Info grid */}
          <div className="detail-info-grid card" style={{ marginTop: 16 }}>
            {[
              ['Quantity Available', `${item.quantityAvailable.toLocaleString()} ${item.unit}`],
              ['Planted', fmt(item.plantingDate)],
              ['Harvest Date', fmt(item.harvestDate)],
              ['Best Before', fmt(item.expiryDate)],
              ['Grade / Quality', item.gradeQuality ?? 'Standard'],
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
                <h3 className="card-section-title" style={{ margin: 0 }}>Farm of origin</h3>
                <a href={gmapsFarm} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Open map</a>
              </div>
              <LeafletMap markers={markers} height={340} zoom={11} />
              <p className="text-sm text-muted">The grower provided this location. Confirm the pickup point before travelling.</p>
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
              </div>
            </div>
            <div className="farmer-info-rows">
              {[
                ['📍 Location', origin || 'See farm location above'],
              ].map(([label, value]) => (
                <div key={label} className="farmer-info-row">
                  <span className="farmer-info-label">{label}</span>
                  <span className="farmer-info-value">{value}</span>
                </div>
              ))}
            </div>
            <Link to={`/farmers/${item.farmerUsername || item.farmerProfileId}`} className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
              View grower and other harvests
            </Link>
            {phone && <a href={`tel:${phone}`} className="btn btn-primary btn-sm" style={{ marginTop: 16, marginLeft: 8 }}>Call grower</a>}
          </div>
        </div>

        {/* Right: trade ticket */}
        <div className="order-panel">
          {!isAvailable ? <div className="card" role="status">
            {isScheduled ? `Orders open on ${fmt(item.availableFrom)}.` : 'This batch is unavailable for orders.'}
          </div> : !advanced ? <BuyPanel key={item.id} commodity={item.name} offers={offers} direct /> : <TradeTicket
            ctx={{
              commodity: item.category,
              unit: item.unit,
              referencePriceKes: item.price,
              region: item.region,
              country: item.country,
              countryCode: item.countryCode,
              zone: item.zone,
              variety: item.name,
              grade: item.gradeQuality,
              produceId: item.id,
            }}
            initialSide={initialSide}
            initialKind={initialKind}
          />}
          <Link to="/delivery" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', borderRadius: 8, marginTop: 12 }}>
            🚚 Estimate delivery & route
          </Link>
        </div>
      </div>
    </div>
  );
}
