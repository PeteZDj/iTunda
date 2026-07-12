import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCommodities, getBuyOrders, getProduce, getPriceHistory } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { flagUrl } from '../lib/geo';
import { categoryIcon } from '../lib/categories';
import TradeTicket from '../components/TradeTicket';
import BuyPanel from '../components/BuyPanel';
import PriceChart from '../components/PriceChart';
import type { CommodityDto, BuyOrderResponse, ProduceResponse, PriceHistory, OrderSide } from '../types';
import './BuyPage.css';

const RANGES: { id: string; label: string; long: string }[] = [
  { id: '1W', label: '1W', long: '1-week' },
  { id: '1M', label: '1M', long: '1-month' },
  { id: '1Y', label: '1Y', long: '1-year' },
];

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  return `${Math.floor(d)}d ago`;
}

const KIND_LABEL: Record<string, string> = { Spot: 'SPOT', Limit: 'LIMIT', Futures: 'FUT', Put: 'PUT' };

// The classic light "Buy & Sell" desk — commodity board, trend chart, buy/sell
// ticket (with confirmation) and the public order book.
export default function BuyPage() {
  const [params, setParams] = useSearchParams();
  const { format } = useCurrency();
  const [commodities, setCommodities] = useState<CommodityDto[]>([]);
  const [selected, setSelected] = useState<string>(params.get('c') || 'Avocados');
  const [offers, setOffers] = useState<ProduceResponse[]>([]);
  const [orders, setOrders] = useState<BuyOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<OrderSide>('Buy');
  const [showTicket, setShowTicket] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [range, setRange] = useState('1M');
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => { getCommodities().then(setCommodities).catch(() => {}); }, []);

  useEffect(() => {
    setHistLoading(true);
    getPriceHistory(selected, range).then(setHistory).catch(() => setHistory(null)).finally(() => setHistLoading(false));
  }, [selected, range]);

  const selectCommodity = (c: string) => { setSelected(c); setParams({ c }, { replace: true }); };

  useEffect(() => { const c = params.get('c'); if (c && c !== selected) setSelected(c); }, [params]); // eslint-disable-line

  useEffect(() => {
    setLoading(true);
    Promise.all([getProduce({ category: selected }), getBuyOrders({ commodity: selected })])
      .then(([p, b]) => { setOffers([...p].sort((a, z) => a.price - z.price).slice(0, 16)); setOrders(b); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [selected, reloadKey]);

  const active = useMemo(() => commodities.find(c => c.category === selected), [commodities, selected]);
  const sellOrders = orders.filter(o => o.side === 'Sell').sort((a, z) => a.targetPrice - z.targetPrice);
  const bids = orders.filter(o => o.side === 'Buy').sort((a, z) => z.targetPrice - a.targetPrice);
  const unit = active?.unit ?? offers[0]?.unit ?? 'kg';

  const openTicket = (s: OrderSide) => { setSide(s); setShowTicket(true); };

  return (
    <div className="market-page">
      <div className="mk-hero">
        <div className="page-container">
          <h1 className="mk-title">Buy Fresh Produce</h1>
          <p className="mk-sub">
            Pick a commodity, choose a farmer’s offer and buy the real produce — by the kilo, basket,
            crate or bunch — with local or international delivery scheduled for a time that suits you.
          </p>
          <Link to="/market" className="mk-hero-link">⇅ Prefer the pro trading terminal? Open Market →</Link>
        </div>
      </div>

      <div className="page-container mk-body">
        {/* Price trends + timeframe */}
        <div className="mk-trends card">
          <div className="mk-trends-head">
            <div className="mk-trends-title-wrap">
              <span className="mk-trends-emoji">{categoryIcon(selected)}</span>
              <div>
                <h2 className="mk-trends-title">{selected} price trend</h2>
                <span className="mk-trends-sub">Average farm-gate price per {history?.unit ?? unit}</span>
              </div>
            </div>
            <div className="mk-range-tabs">
              {RANGES.map(r => (
                <button key={r.id} className={range === r.id ? 'active' : ''} onClick={() => setRange(r.id)}>{r.label}</button>
              ))}
            </div>
          </div>

          {history && (
            <div className="mk-trends-stats">
              <div><span className="mk-ts-l">Current</span><span className="mk-ts-v">{format(history.current)}</span></div>
              <div><span className="mk-ts-l">{RANGES.find(r => r.id === range)?.long} avg</span><span className="mk-ts-v">{format(history.avg)}</span></div>
              <div><span className="mk-ts-l">Low</span><span className="mk-ts-v">{format(history.low)}</span></div>
              <div><span className="mk-ts-l">High</span><span className="mk-ts-v">{format(history.high)}</span></div>
              <div>
                <span className="mk-ts-l">{RANGES.find(r => r.id === range)?.long} change</span>
                <span className={`mk-ts-v ${history.changePct >= 0 ? 'up' : 'down'}`}>
                  {history.changePct >= 0 ? '▲' : '▼'} {Math.abs(history.changePct).toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <div className="mk-trends-chart">
            {histLoading ? <div className="spinner" /> : history
              ? <PriceChart points={history.points} unit={history.unit} format={format} up={history.changePct >= 0} />
              : <div className="pchart-empty">No price history for {selected}.</div>}
          </div>
        </div>

        {/* Commodity board */}
        <div className="mk-board">
          {commodities.map(c => {
            const up = c.changePct >= 0;
            return (
              <button key={c.category} className={`mk-quote ${selected === c.category ? 'active' : ''}`} onClick={() => selectCommodity(c.category)}>
                <div className="mk-quote-head">
                  <img className="mk-quote-icon" src={c.iconUrl} alt="" />
                  <span className="mk-quote-name">{c.category}</span>
                </div>
                <div className="mk-quote-price">{format(c.avgPrice)}<span>/{c.unit}</span></div>
                <div className={`mk-quote-change ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {Math.abs(c.changePct).toFixed(2)}%</div>
              </button>
            );
          })}
        </div>

        {/* Selected summary */}
        {active && (
          <div className="mk-summary">
            <div className="mk-summary-main">
              <span className="mk-summary-emoji">{categoryIcon(active.category)}</span>
              <div>
                <h2>{active.category}</h2>
                <span className="mk-summary-listings">{active.listings.toLocaleString()} offers · {bids.length} bids · {sellOrders.length} sell orders</span>
              </div>
            </div>
            <div className="mk-summary-stats">
              <div><span className="mk-stat-l">Avg</span><span className="mk-stat-v">{format(active.avgPrice)}</span></div>
              <div><span className="mk-stat-l">Low</span><span className="mk-stat-v">{format(active.low)}</span></div>
              <div><span className="mk-stat-l">High</span><span className="mk-stat-v">{format(active.high)}</span></div>
              <div><span className="mk-stat-l">Unit</span><span className="mk-stat-v">{active.unit}</span></div>
            </div>
            <div className="mk-summary-actions">
              <button className="btn btn-sell btn-sm" onClick={() => openTicket('Sell')}>SELL</button>
              <button className="btn btn-outline btn-sm" onClick={() => openTicket('Buy')}>Limit / Futures</button>
            </div>
          </div>
        )}

        {/* Primary buy flow — buy the real produce with delivery */}
        <BuyPanel commodity={selected} offers={offers} onPlaced={() => setReloadKey(k => k + 1)} />

        {/* Advanced order-book ticket (sell offers, limit, futures, puts) */}
        {showTicket && active && (
          <div className="mk-ticket-wrap">
            <div className="mk-ticket-close">
              <span className="mk-ticket-head-label">Advanced order · posts to the exchange book</span>
              <button className="btn btn-outline btn-sm" onClick={() => setShowTicket(false)}>✕ Close</button>
            </div>
            <TradeTicket
              ctx={{ commodity: selected, unit, referencePriceKes: active.avgPrice }}
              initialSide={side}
              onPlaced={() => setReloadKey(k => k + 1)}
            />
          </div>
        )}

        {/* Order book */}
        <div className="mk-orderbook">
          <div className="mk-col mk-asks">
            <div className="mk-col-head">
              <span className="mk-col-title">Offers · Sell side</span>
              <span className="mk-col-sub">best price first · click to view seller</span>
            </div>
            {loading ? <div className="spinner" /> : (offers.length === 0 && sellOrders.length === 0) ? (
              <div className="mk-empty">No offers for {selected} right now.</div>
            ) : (
              <>
                {offers.map(o => (
                  <Link to={`/produce/${o.id}`} key={`p${o.id}`} className="mk-row mk-row-ask">
                    <img className="pc-flag" src={flagUrl(o.countryCode)} alt="" />
                    <div className="mk-row-main">
                      <span className="mk-row-name">{o.name}</span>
                      <span className="mk-row-meta">{o.farmerName ? `${o.farmerName} · ` : ''}{o.region}, {o.country} · {o.quantityAvailable.toLocaleString()} {o.unit}</span>
                    </div>
                    <div className="mk-row-price ask">{format(o.price)}<span>/{o.unit}</span><span className="mk-buy-tag">VIEW</span></div>
                  </Link>
                ))}
                {sellOrders.map(o => (
                  <div key={`s${o.id}`} className={`mk-row mk-row-ask ${o.status !== 'Open' ? 'filled' : ''}`}>
                    <img className="pc-flag" src={flagUrl(o.countryCode)} alt="" />
                    <div className="mk-row-main">
                      <span className="mk-row-name">{o.buyerName} <span className={`mk-kind ${o.kind.toLowerCase()}`}>{KIND_LABEL[o.kind]}</span></span>
                      <span className="mk-row-meta">{o.quantity.toLocaleString()} {o.unit}{o.region ? ` · ${o.region}` : ''} · {timeAgo(o.createdAt)}</span>
                    </div>
                    <div className="mk-row-price ask">{format(o.targetPrice)}<span>/{o.unit}</span></div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="mk-col mk-bids">
            <div className="mk-col-head">
              <span className="mk-col-title">Bids · Buy side</span>
              <span className="mk-col-sub">highest bid first</span>
            </div>
            {loading ? <div className="spinner" /> : bids.length === 0 ? (
              <div className="mk-empty">No open buy orders. Be the first to post one.</div>
            ) : bids.map(b => (
              <div key={b.id} className={`mk-row mk-row-bid ${b.status !== 'Open' ? 'filled' : ''}`}>
                <img className="pc-flag" src={flagUrl(b.countryCode)} alt="" />
                <div className="mk-row-main">
                  <span className="mk-row-name">{b.buyerName} <span className={`mk-kind ${b.kind.toLowerCase()}`}>{KIND_LABEL[b.kind]}</span></span>
                  <span className="mk-row-meta">
                    {b.quantity.toLocaleString()} {b.unit}{b.variety ? ` · ${b.variety}` : ''}{b.region ? ` · ${b.region}` : ''} · {timeAgo(b.createdAt)}
                    {b.exportRequired ? ' · ✈ export' : ''}
                  </span>
                </div>
                <div className="mk-row-price bid">{format(b.targetPrice)}<span>/{b.unit}</span><span className={`mk-status ${b.status.toLowerCase()}`}>{b.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="mk-cta">
          Looking to move a consignment? <Link to="/delivery">Check delivery routes &amp; prices →</Link>
        </div>
      </div>
    </div>
  );
}
