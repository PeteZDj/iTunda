import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCommodities, getBuyOrders, createBuyOrder, getProduce } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { flagUrl, ZONES } from '../lib/geo';
import type { CommodityDto, BuyOrderResponse, ProduceResponse, CreateBuyOrderRequest } from '../types';
import './MarketPage.css';

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  return `${Math.floor(d)}d ago`;
}

export default function MarketPage() {
  const { regions } = useRegion();
  const [commodities, setCommodities] = useState<CommodityDto[]>([]);
  const [selected, setSelected] = useState<string>('Avocados');
  const [offers, setOffers] = useState<ProduceResponse[]>([]);
  const [bids, setBids] = useState<BuyOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Place-a-bid form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    variety: '', quantity: '1000', unit: 'kg', targetPrice: '',
    region: '', buyerName: '', buyerContact: '', exportRequired: false, neededBy: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  useEffect(() => { getCommodities().then(setCommodities).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProduce({ category: selected }),
      getBuyOrders({ commodity: selected }),
    ]).then(([p, b]) => {
      setOffers([...p].sort((a, z) => a.price - z.price).slice(0, 14));
      setBids([...b].sort((a, z) => z.targetPrice - a.targetPrice));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selected]);

  const active = useMemo(() => commodities.find(c => c.category === selected), [commodities, selected]);

  const submitBid = async () => {
    setFormMsg('');
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.targetPrice);
    if (!form.buyerName.trim()) { setFormMsg('Please enter your name / company.'); return; }
    if (!qty || qty <= 0) { setFormMsg('Enter a valid quantity.'); return; }
    if (!price || price <= 0) { setFormMsg('Enter a valid target price.'); return; }
    const reg = regions.find(r => r.name === form.region);
    const payload: CreateBuyOrderRequest = {
      commodity: selected,
      variety: form.variety || null,
      grade: null,
      unit: form.unit,
      quantity: qty,
      targetPrice: price,
      region: reg?.name ?? null,
      country: reg?.country ?? null,
      countryCode: reg?.countryCode ?? null,
      zone: reg?.zone ?? 0,
      buyerName: form.buyerName,
      buyerContact: form.buyerContact || null,
      exportRequired: form.exportRequired,
      neededBy: form.neededBy || null,
    };
    setSubmitting(true);
    try {
      const created = await createBuyOrder(payload);
      setBids(prev => [created, ...prev].sort((a, z) => z.targetPrice - a.targetPrice));
      setFormMsg('✅ Buy order posted to the book.');
      setForm(f => ({ ...f, variety: '', targetPrice: '', buyerContact: '' }));
      setShowForm(false);
    } catch {
      setFormMsg('Could not post buy order. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="market-page">
      {/* Hero */}
      <div className="mk-hero">
        <div className="page-container">
          <h1 className="mk-title">Commodity Exchange</h1>
          <p className="mk-sub">
            Live farm-gate offers and buyer bids across {regions.length} growing regions and 4 export zones.
            Trade avocados, macadamia, tea, roses and more — like a fresh-produce commodity desk.
          </p>
        </div>
      </div>

      <div className="page-container mk-body">
        {/* Commodity price board */}
        <div className="mk-board">
          {commodities.map(c => {
            const up = c.changePct >= 0;
            return (
              <button
                key={c.category}
                className={`mk-quote ${selected === c.category ? 'active' : ''}`}
                onClick={() => setSelected(c.category)}
              >
                <div className="mk-quote-head">
                  <img className="mk-quote-icon" src={c.iconUrl} alt="" />
                  <span className="mk-quote-name">{c.category}</span>
                </div>
                <div className="mk-quote-price">KES {c.avgPrice.toLocaleString()}<span>/{c.unit}</span></div>
                <div className={`mk-quote-change ${up ? 'up' : 'down'}`}>
                  {up ? '▲' : '▼'} {Math.abs(c.changePct).toFixed(2)}%
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected commodity summary */}
        {active && (
          <div className="mk-summary">
            <div className="mk-summary-main">
              <img className="mk-summary-icon" src={active.iconUrl} alt="" />
              <div>
                <h2>{active.category}</h2>
                <span className="mk-summary-listings">{active.listings.toLocaleString()} active offers · {bids.length} open bids</span>
              </div>
            </div>
            <div className="mk-summary-stats">
              <div><span className="mk-stat-l">Avg</span><span className="mk-stat-v">KES {active.avgPrice.toLocaleString()}</span></div>
              <div><span className="mk-stat-l">Low</span><span className="mk-stat-v">KES {active.low.toLocaleString()}</span></div>
              <div><span className="mk-stat-l">High</span><span className="mk-stat-v">KES {active.high.toLocaleString()}</span></div>
              <div><span className="mk-stat-l">Unit</span><span className="mk-stat-v">{active.unit}</span></div>
            </div>
            <button className="btn btn-amber" onClick={() => setShowForm(s => !s)}>
              {showForm ? '✕ Close' : '＋ Post buy order'}
            </button>
          </div>
        )}

        {/* Buy order form */}
        {showForm && (
          <div className="mk-form card">
            <h3 className="card-section-title">Post a buy order for {selected}</h3>
            {formMsg && <div className="alert alert-error" style={{ marginBottom: 12 }}>{formMsg}</div>}
            <div className="mk-form-grid">
              <label>Variety (optional)
                <input className="input" value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} placeholder="e.g. Hass" />
              </label>
              <label>Quantity
                <input className="input" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </label>
              <label>Unit
                <select className="select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="kg">kg</option><option value="bunch">bunch</option><option value="stem">stem</option><option value="tonne">tonne</option>
                </select>
              </label>
              <label>Target price (KES / unit)
                <input className="input" type="number" value={form.targetPrice} onChange={e => setForm({ ...form, targetPrice: e.target.value })} placeholder="e.g. 85" />
              </label>
              <label>Sourcing region
                <select className="select" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}>
                  <option value="">Any region</option>
                  {ZONES.map(z => (
                    <optgroup key={z.zone} label={z.name}>
                      {regions.filter(r => r.zone === z.zone).map(r => <option key={r.name} value={r.name}>{r.name}, {r.country}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>Needed by
                <input className="input" type="date" value={form.neededBy} onChange={e => setForm({ ...form, neededBy: e.target.value })} />
              </label>
              <label>Your name / company
                <input className="input" value={form.buyerName} onChange={e => setForm({ ...form, buyerName: e.target.value })} placeholder="e.g. Rotterdam Produce BV" />
              </label>
              <label>Contact (email / phone)
                <input className="input" value={form.buyerContact} onChange={e => setForm({ ...form, buyerContact: e.target.value })} placeholder="optional" />
              </label>
              <label className="mk-check">
                <input type="checkbox" checked={form.exportRequired} onChange={e => setForm({ ...form, exportRequired: e.target.checked })} />
                Export-grade required
              </label>
            </div>
            <button className="btn btn-primary" disabled={submitting} onClick={submitBid} style={{ marginTop: 6 }}>
              {submitting ? 'Posting…' : 'Post buy order'}
            </button>
            <p className="mk-form-note">No account needed — buy orders are posted publicly to the exchange book.</p>
          </div>
        )}

        {/* Order book */}
        <div className="mk-orderbook">
          {/* Offers / asks */}
          <div className="mk-col mk-asks">
            <div className="mk-col-head">
              <span className="mk-col-title">Offers · Sell side</span>
              <span className="mk-col-sub">best price first</span>
            </div>
            {loading ? <div className="spinner" /> : offers.length === 0 ? (
              <div className="mk-empty">No offers for {selected} right now.</div>
            ) : offers.map(o => (
              <Link to={`/produce/${o.id}`} key={o.id} className="mk-row mk-row-ask">
                <img className="pc-flag" src={flagUrl(o.countryCode)} alt="" />
                <div className="mk-row-main">
                  <span className="mk-row-name">{o.name}</span>
                  <span className="mk-row-meta">{o.region}, {o.country} · {o.quantityAvailable.toLocaleString()} {o.unit}</span>
                </div>
                <div className="mk-row-price ask">KES {o.price.toLocaleString()}<span>/{o.unit}</span></div>
              </Link>
            ))}
          </div>

          {/* Bids */}
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
                  <span className="mk-row-name">{b.buyerName}</span>
                  <span className="mk-row-meta">
                    {b.quantity.toLocaleString()} {b.unit}{b.variety ? ` · ${b.variety}` : ''}
                    {b.region ? ` · ${b.region}` : ''} · {timeAgo(b.createdAt)}
                    {b.exportRequired ? ' · ✈ export' : ''}
                  </span>
                </div>
                <div className="mk-row-price bid">
                  KES {b.targetPrice.toLocaleString()}<span>/{b.unit}</span>
                  <span className={`mk-status ${b.status.toLowerCase()}`}>{b.status}</span>
                </div>
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
