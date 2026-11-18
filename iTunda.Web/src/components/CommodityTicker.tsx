import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMarketOverview } from '../lib/marketData';
import { categoryIcon } from '../lib/categories';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from './CurrencySelector';
import type { CommodityDto } from '../types';
import './CommodityTicker.css';

export default function CommodityTicker() {
  const [items, setItems] = useState<CommodityDto[]>([]);
  const navigate = useNavigate();
  const { format } = useCurrency();

  useEffect(() => {
    getMarketOverview().then(({ commodities }) => setItems(commodities));
  }, []);

  if (items.length === 0) return null;

  const renderItem = (c: CommodityDto, key: string) => {
    const up = c.changePct >= 0;
    return (
      <button
        key={key}
        className="tk-item"
        onClick={() => navigate(`/market?c=${encodeURIComponent(c.category)}`)}
        title={`Open ${c.category} in the demo market. Percentage changes are simulated.`}
      >
        {c.iconUrl ? <img className="tk-icon" src={c.iconUrl} alt="" loading="lazy" /> : <span aria-hidden="true">{categoryIcon(c.category)}</span>}
        <span className="tk-name">{c.category}</span>
        <span className="tk-price">{format(c.avgPrice)}</span>
        <span className={`tk-change ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {Math.abs(c.changePct).toFixed(2)}%
        </span>
        <span className="tk-sep">|</span>
      </button>
    );
  };

  return (
    <div className="commodity-ticker">
      <button className="tk-tag" onClick={() => navigate('/market')} title="Open the Commodity Exchange">
        <span className="tk-dot" /> DEMO MARKET
      </button>
      <div className="tk-viewport">
        <div className="tk-track" style={{ animationDuration: `${Math.max(28, items.length * 4.5)}s` }}>
          {items.map((c, i) => renderItem(c, `a-${i}`))}
          {items.map((c, i) => renderItem(c, `b-${i}`))}
        </div>
      </div>
      <div className="tk-ccy">
        <CurrencySelector />
      </div>
    </div>
  );
}
