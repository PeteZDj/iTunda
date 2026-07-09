import { useNavigate } from 'react-router-dom';
import type { ProduceResponse } from '../types';
import { flagUrl } from '../lib/geo';
import { useCurrency } from '../context/CurrencyContext';
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
  const place = item.region || item.town || item.county || '—';
  const navigate = useNavigate();
  const { format } = useCurrency();

  const go = (suffix = '') => navigate(`/produce/${item.id}${suffix}`);
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };

  return (
    <div className="produce-card" onClick={() => go()} role="link" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') go(); }}>
      <div className="pc-media">
        <img className="pc-photo" src={item.imageUrl} alt={item.name} loading="lazy" />
        <div className="pc-media-badges">
          <span className="badge badge-accent">
            <img className="pc-cat-icon" src={item.iconUrl} alt="" /> {item.category}
          </span>
          {item.isExportReady && <span className="badge badge-amber">✈ Export</span>}
          {isScheduled && <span className="badge badge-blue">🕐 {fmt(item.availableFrom)}</span>}
        </div>
        <div className="pc-media-price">{format(item.price)}<span>/{item.unit}</span></div>
      </div>

      <div className="pc-body">
        <div className="pc-title-row">
          <h3 className="pc-name">{item.name}</h3>
        </div>

        <div className="pc-place">
          <img className="pc-flag" src={flagUrl(item.countryCode)} alt="" />
          <span className="pc-place-text">{place}{item.country ? `, ${item.country}` : ''}</span>
          {item.zone > 0 && <span className="pc-zone">Z{item.zone}</span>}
        </div>

        <div className="pc-info-grid">
          <div className="pc-info-cell">
            <span className="pc-info-label">QTY</span>
            <span className="pc-info-value">{item.quantityAvailable.toLocaleString()} {item.unit}</span>
          </div>
          <div className="pc-info-cell">
            <span className="pc-info-label">BEST BEFORE</span>
            <span className="pc-info-value">{fmt(item.expiryDate)}</span>
          </div>
          <div className="pc-info-cell">
            <span className="pc-info-label">GRADE</span>
            <span className="pc-info-value">{item.gradeQuality ?? 'Std'}</span>
          </div>
        </div>

        <div className="pc-divider" />

        <div className="pc-farmer-row">
          <div className="pc-farmer-avatar">{item.farmerName[0]}</div>
          <div className="pc-farmer-info">
            <span className="pc-farmer-name">{item.farmName || item.farmerName}</span>
            <span className="pc-farmer-sub">by {item.farmerName}</span>
          </div>
          <div className="pc-rating">
            <span>★ {item.farmerRating.toFixed(1)}</span>
            <span className="pc-rating-sub">{item.farmerOrdersFulfilled} orders</span>
          </div>
        </div>

        <div className="pc-actions">
          <button className="btn btn-buy btn-sm pc-buy" onClick={stop(() => go())}>Buy now</button>
          <button className="btn btn-outline btn-sm pc-bid" onClick={stop(() => go('?kind=Limit'))}>Bid</button>
        </div>
      </div>
    </div>
  );
}
