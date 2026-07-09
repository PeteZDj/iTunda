import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommodities } from '../services/api';
import type { CommodityDto } from '../types';
import './CommodityTicker.css';

export default function CommodityTicker() {
  const [items, setItems] = useState<CommodityDto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCommodities().then(setItems).catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  const renderItem = (c: CommodityDto, key: string) => {
    const up = c.changePct >= 0;
    return (
      <button
        key={key}
        className="tk-item"
        onClick={() => navigate(`/browse/${encodeURIComponent(c.category)}`)}
        title={`${c.category} · avg KES ${c.avgPrice.toLocaleString()}/${c.unit} · ${c.listings} listings`}
      >
        <img className="tk-icon" src={c.iconUrl} alt="" loading="lazy" />
        <span className="tk-name">{c.category}</span>
        <span className="tk-price">KES {c.avgPrice.toLocaleString()}</span>
        <span className={`tk-change ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {Math.abs(c.changePct).toFixed(2)}%
        </span>
        <span className="tk-sep">|</span>
      </button>
    );
  };

  return (
    <div className="commodity-ticker">
      <div className="tk-tag">
        <span className="tk-dot" /> LIVE PRICES
      </div>
      <div className="tk-viewport">
        <div className="tk-track" style={{ animationDuration: `${Math.max(28, items.length * 4.5)}s` }}>
          {items.map((c, i) => renderItem(c, `a-${i}`))}
          {items.map((c, i) => renderItem(c, `b-${i}`))}
        </div>
      </div>
    </div>
  );
}
