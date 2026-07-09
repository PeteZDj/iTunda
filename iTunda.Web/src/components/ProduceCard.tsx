import { Link } from 'react-router-dom';
import type { ProduceResponse } from '../types';
import './ProduceCard.css';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

interface Props {
  item: ProduceResponse;
}

export default function ProduceCard({ item }: Props) {
  const isScheduled = item.availableFrom && new Date(item.availableFrom) > new Date();

  return (
    <Link to={`/produce/${item.id}`} className="produce-card">
      {/* Badge row */}
      <div className="pc-badges">
        <span className="badge badge-accent">{item.category}</span>
        {item.isExportReady && <span className="badge badge-amber">✈ Export Ready</span>}
        {isScheduled && <span className="badge badge-blue">🕐 {fmt(item.availableFrom)}</span>}
      </div>

      {/* Title + price */}
      <div className="pc-title-row">
        <h3 className="pc-name">{item.name}</h3>
        <div className="pc-price">KES {item.price.toLocaleString()}<span>/{item.unit}</span></div>
      </div>

      {/* Info grid */}
      <div className="pc-info-grid">
        <div className="pc-info-cell">
          <span className="pc-info-label">QTY</span>
          <span className="pc-info-value">{item.quantityAvailable.toLocaleString()} {item.unit}</span>
        </div>
        <div className="pc-info-cell">
          <span className="pc-info-label">EXPIRY</span>
          <span className="pc-info-value">{fmt(item.expiryDate)}</span>
        </div>
        <div className="pc-info-cell">
          <span className="pc-info-label">LOCATION</span>
          <span className="pc-info-value">{item.town || item.county || '—'}</span>
        </div>
      </div>

      <div className="pc-divider" />

      {/* Farmer row */}
      <div className="pc-farmer-row">
        <div className="pc-farmer-avatar">{item.farmerName[0]}</div>
        <div className="pc-farmer-info">
          <span className="pc-farmer-name">{item.farmName || item.farmerName}</span>
          <span className="pc-farmer-sub">by {item.farmerName} · {item.county}</span>
        </div>
        <div className="pc-rating">
          <span>★ {item.farmerRating.toFixed(1)}</span>
          <span className="pc-rating-sub">{item.farmerOrdersFulfilled} orders</span>
        </div>
      </div>
    </Link>
  );
}
