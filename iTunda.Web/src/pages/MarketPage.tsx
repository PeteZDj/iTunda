import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCommodities, getBuyOrders, getProduce, getPriceHistory } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { flagUrl } from '../lib/geo';
import { categoryIcon } from '../lib/categories';
import TradeTicket from '../components/TradeTicket';
import TradeChart from '../components/TradeChart';
import { useTradingEngine } from '../hooks/useTradingEngine';
import { LEVERAGE, sparkFor, closePriceOf, livePl } from '../lib/trading';
import type { Position } from '../lib/trading';
import type { CommodityDto, BuyOrderResponse, ProduceResponse, PriceHistory } from '../types';
import './MarketPage.css';

const RANGES = [
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '1Y', label: '1Y' },
];

const KIND_LABEL: Record<string, string> = { Spot: 'SPOT', Limit: 'LIMIT', Futures: 'FUT', Put: 'PUT' };

function Spark({ series, up }: { series: number[]; up: boolean }) {
  const min = Math.min(...series), max = Math.max(...series);
  const span = max - min || 1;
  const w = 100, h = 30;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${h - ((v - min) / span) * h}`).join(' ');
  return (
    <svg className="spk" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up ? '#1fae74' : '#e5484d'} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function MarketPage() {
  const [params, setParams] = useSearchParams();
  const { format, convert, symbol, rates, currency } = useCurrency();
  const rate = rates[currency] ?? 1;

  const [commodities, setCommodities] = useState<CommodityDto[]>([]);
  const [selected, setSelected] = useState<string>(params.get('c') || 'Avocados');
  const [range, setRange] = useState('1M');
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [histLoading, setHistLoading] = useState(true);
  const [view, setView] = useState<'chart' | 'grid'>('chart');

  const [offers, setOffers] = useState<ProduceResponse[]>([]);
  const [orders, setOrders] = useState<BuyOrderResponse[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const engine = useTradingEngine(commodities);

  // ── formatters ──────────────────────────────────────────────────────────
  const px = useCallback((kes: number) => {
    const v = convert(kes);
    const d = Math.abs(v) >= 1 ? 2 : 4;
    return symbol + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }, [convert, symbol]);
  const numCcy = useCallback((kes: number) => {
    const v = convert(kes);
    const d = Math.abs(v) >= 1 ? 2 : 4;
    return v.toFixed(d);
  }, [convert]);
  const money = useCallback((kes: number) => (kes < 0 ? '-' : '') + format(Math.abs(kes)), [format]);

  // ── data loads ──────────────────────────────────────────────────────────
  useEffect(() => { getCommodities().then(setCommodities).catch(() => {}); }, []);

  useEffect(() => {
    setHistLoading(true);
    getPriceHistory(selected, range).then(setHistory).catch(() => setHistory(null)).finally(() => setHistLoading(false));
  }, [selected, range]);

  useEffect(() => {
    Promise.all([getProduce({ category: selected }), getBuyOrders({ commodity: selected })])
      .then(([p, b]) => { setOffers([...p].sort((a, z) => a.price - z.price).slice(0, 14)); setOrders(b); })
      .catch(() => {});
  }, [selected, reloadKey]);

  useEffect(() => { const c = params.get('c'); if (c && c !== selected) setSelected(c); }, [params]); // eslint-disable-line

  const selectCommodity = (c: string) => { setSelected(c); setParams({ c }, { replace: true }); };

  // ── selected symbol quote ────────────────────────────────────────────────
  const cReq = useMemo(() => commodities.find(c => c.category === selected), [commodities, selected]);
  const q = engine.quotes[selected];
  const unit = cReq?.unit ?? offers[0]?.unit ?? 'kg';
  const bidKes = q?.bid ?? cReq?.bid ?? cReq?.avgPrice ?? 0;
  const askKes = q?.ask ?? cReq?.ask ?? cReq?.avgPrice ?? 0;
  const midKes = q?.price ?? cReq?.avgPrice ?? 0;
  const chg = q?.changePct ?? cReq?.changePct ?? 0;

  // ── order ticket ──────────────────────────────────────────────────────────
  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy');
  const [vol, setVol] = useState('100');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [tErr, setTErr] = useState('');
  const [showAdv, setShowAdv] = useState(false);

  const volNum = parseFloat(vol) || 0;
  const entryKes = side === 'Buy' ? askKes : bidKes;
  const marginKes = (entryKes * volNum) / LEVERAGE;
  const slKes = sl.trim() ? parseFloat(sl) / rate : null;
  const tpKes = tp.trim() ? parseFloat(tp) / rate : null;
  const plAt = (price: number) => (side === 'Buy' ? price - entryKes : entryKes - price) * volNum;

  const setSlPct = (pct: number) => setSl(numCcy(side === 'Buy' ? entryKes * (1 - pct / 100) : entryKes * (1 + pct / 100)));
  const setTpPct = (pct: number) => setTp(numCcy(side === 'Buy' ? entryKes * (1 + pct / 100) : entryKes * (1 - pct / 100)));

  const trade = (s: 'Buy' | 'Sell') => {
    setSide(s);
    setTErr('');
    const slK = sl.trim() ? parseFloat(sl) / rate : null;
    const tpK = tp.trim() ? parseFloat(tp) / rate : null;
    const err = engine.open(selected, s, volNum, slK != null && isFinite(slK) ? slK : null, tpK != null && isFinite(tpK) ? tpK : null);
    if (err) setTErr(err);
    else { setSl(''); setTp(''); }
  };

  // ── positions inline edit ────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [eSl, setESl] = useState('');
  const [eTp, setETp] = useState('');
  const startEdit = (p: Position) => { setEditId(p.id); setESl(p.sl != null ? numCcy(p.sl) : ''); setETp(p.tp != null ? numCcy(p.tp) : ''); };
  const saveEdit = () => {
    if (!editId) return;
    engine.modify(editId, eSl.trim() ? parseFloat(eSl) / rate : null, eTp.trim() ? parseFloat(eTp) / rate : null);
    setEditId(null);
  };

  const [tab, setTab] = useState<'positions' | 'history' | 'journal'>('positions');
  const acct = engine.account;

  const sellOrders = orders.filter(o => o.side === 'Sell').sort((a, z) => a.targetPrice - z.targetPrice);
  const bids = orders.filter(o => o.side === 'Buy').sort((a, z) => z.targetPrice - a.targetPrice);

  return (
    <div className="term">
      {/* Toolbar */}
      <div className="term-toolbar">
        <div className="tt-symbol">
          <span className="tt-ico">{categoryIcon(selected)}</span>
          <div>
            <div className="tt-name">{selected}<span className="tt-unit">·CFD /{unit}</span></div>
            <div className="tt-sub">iTunda Commodity Exchange · demo trading</div>
          </div>
        </div>

        <div className="tt-quote">
          <div className="tt-px bid"><span>BID</span><b>{px(bidKes)}</b></div>
          <div className="tt-spread"><span>SPREAD</span><b>{(convert(askKes - bidKes)).toFixed(2)}</b></div>
          <div className="tt-px ask"><span>ASK</span><b>{px(askKes)}</b></div>
          <div className={`tt-chg ${chg >= 0 ? 'up' : 'down'}`}>{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%</div>
        </div>

        <div className="tt-tools">
          <div className="seg">
            {RANGES.map(r => <button key={r.id} className={range === r.id ? 'active' : ''} onClick={() => setRange(r.id)}>{r.label}</button>)}
          </div>
          <div className="seg">
            <button className={view === 'chart' ? 'active' : ''} onClick={() => setView('chart')}>◫ Chart</button>
            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>▦ Grid</button>
          </div>
          <button className="term-btn" onClick={engine.requestNotify} title="Desktop alerts for SL/TP hits">
            {engine.notifyOn ? '🔔 Alerts on' : '🔕 Alerts'}
          </button>
        </div>
      </div>

      {/* Main 3-column workspace */}
      <div className="term-main">
        {/* Market Watch */}
        <aside className="term-watch">
          <div className="panel-title">Market Watch</div>
          <div className="tw-head"><span>Symbol</span><span>Bid</span><span>Ask</span></div>
          <div className="tw-list">
            {commodities.map(c => {
              const wq = engine.quotes[c.category];
              const b = wq?.bid ?? c.bid, a = wq?.ask ?? c.ask;
              const dir = wq ? (wq.price >= wq.prevPrice ? 'up' : 'down') : '';
              return (
                <button key={c.category} className={`tw-row ${selected === c.category ? 'active' : ''}`} onClick={() => selectCommodity(c.category)}>
                  <span className="tw-sym"><img src={c.iconUrl} alt="" />{c.category}</span>
                  <span className={`tw-bid ${dir}`}>{px(b)}</span>
                  <span className={`tw-ask ${dir}`}>{px(a)}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: chart + order book */}
        <main className="term-center">
          <div className="term-chart panel">
            {view === 'chart' ? (
              histLoading ? <div className="term-loading">Loading chart…</div>
                : history ? <TradeChart points={history.points} symbol={selected} livePrice={midKes} px={px} height={360} />
                  : <div className="tc-empty">No chart data for {selected}.</div>
            ) : (
              <div className="term-grid-charts">
                {commodities.map(c => {
                  const wq = engine.quotes[c.category];
                  const base = wq?.base ?? c.avgPrice;
                  const up = (wq?.changePct ?? c.changePct) >= 0;
                  return (
                    <button key={c.category} className={`gc-card ${selected === c.category ? 'active' : ''}`} onClick={() => selectCommodity(c.category)}>
                      <div className="gc-top"><img src={c.iconUrl} alt="" /><span>{c.category}</span></div>
                      <Spark series={sparkFor(c.category, base, wq?.changePct ?? c.changePct)} up={up} />
                      <div className="gc-bot"><b>{px(wq?.price ?? c.avgPrice)}</b><span className={up ? 'up' : 'down'}>{up ? '▲' : '▼'}{Math.abs(wq?.changePct ?? c.changePct).toFixed(2)}%</span></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="term-book panel">
            <div className="tb-col">
              <div className="tb-head"><span className="tb-title ask">Offers · ask depth</span><span className="tb-sub">{offers.length + sellOrders.length}</span></div>
              <div className="tb-rows">
                {offers.map(o => (
                  <Link to={`/produce/${o.id}`} key={`p${o.id}`} className="tb-row">
                    <img className="tb-flag" src={flagUrl(o.countryCode)} alt="" />
                    <span className="tb-main"><b>{o.name}</b><i>{o.region}, {o.country} · {o.quantityAvailable.toLocaleString()} {o.unit}</i></span>
                    <span className="tb-price ask">{px(o.price)}</span>
                  </Link>
                ))}
                {sellOrders.map(o => (
                  <div key={`s${o.id}`} className={`tb-row ${o.status !== 'Open' ? 'filled' : ''}`}>
                    <img className="tb-flag" src={flagUrl(o.countryCode)} alt="" />
                    <span className="tb-main"><b>{o.buyerName} <em className={`kd ${o.kind.toLowerCase()}`}>{KIND_LABEL[o.kind]}</em></b><i>{o.quantity.toLocaleString()} {o.unit}{o.region ? ` · ${o.region}` : ''}</i></span>
                    <span className="tb-price ask">{px(o.targetPrice)}</span>
                  </div>
                ))}
                {offers.length + sellOrders.length === 0 && <div className="tb-empty">No offers right now.</div>}
              </div>
            </div>
            <div className="tb-col">
              <div className="tb-head"><span className="tb-title bid">Bids · buy depth</span><span className="tb-sub">{bids.length}</span></div>
              <div className="tb-rows">
                {bids.map(b => (
                  <div key={b.id} className={`tb-row ${b.status !== 'Open' ? 'filled' : ''}`}>
                    <img className="tb-flag" src={flagUrl(b.countryCode)} alt="" />
                    <span className="tb-main"><b>{b.buyerName} <em className={`kd ${b.kind.toLowerCase()}`}>{KIND_LABEL[b.kind]}</em></b><i>{b.quantity.toLocaleString()} {b.unit}{b.region ? ` · ${b.region}` : ''}</i></span>
                    <span className="tb-price bid">{px(b.targetPrice)}</span>
                  </div>
                ))}
                {bids.length === 0 && <div className="tb-empty">No open bids — post one.</div>}
              </div>
            </div>
          </div>
        </main>

        {/* Order ticket */}
        <aside className="term-ticket panel">
          <div className="panel-title">Order · {selected}</div>

          <div className="tk-side">
            <button className={`tk-side-btn sell ${side === 'Sell' ? 'active' : ''}`} onClick={() => setSide('Sell')}>
              SELL<b>{px(bidKes)}</b>
            </button>
            <button className={`tk-side-btn buy ${side === 'Buy' ? 'active' : ''}`} onClick={() => setSide('Buy')}>
              BUY<b>{px(askKes)}</b>
            </button>
          </div>

          <label className="tk-label">Volume ({unit})</label>
          <div className="tk-vol">
            <button onClick={() => setVol(String(Math.max(0, volNum - 50)))}>−</button>
            <input type="number" min="0" step="any" value={vol} onChange={e => setVol(e.target.value)} />
            <button onClick={() => setVol(String(volNum + 50))}>+</button>
          </div>
          <div className="tk-chips">{[100, 500, 1000, 5000].map(v => <button key={v} onClick={() => setVol(String(v))}>{v.toLocaleString()}</button>)}</div>

          <label className="tk-label">Stop loss ({symbol})
            <div className="tk-mini">{[1, 2, 5].map(p => <button key={p} onClick={() => setSlPct(p)}>-{p}%</button>)}<button onClick={() => setSl('')}>×</button></div>
          </label>
          <input className="tk-input" type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} placeholder="optional" />

          <label className="tk-label">Take profit ({symbol})
            <div className="tk-mini">{[2, 5, 10].map(p => <button key={p} onClick={() => setTpPct(p)}>+{p}%</button>)}<button onClick={() => setTp('')}>×</button></div>
          </label>
          <input className="tk-input" type="number" step="any" value={tp} onChange={e => setTp(e.target.value)} placeholder="optional" />

          <div className="tk-preview">
            <div><span>Entry</span><b>{px(entryKes)}</b></div>
            <div><span>Margin ({LEVERAGE}×)</span><b>{money(marginKes)}</b></div>
            {slKes != null && <div><span>P/L at SL</span><b className="down">{money(plAt(slKes))}</b></div>}
            {tpKes != null && <div><span>P/L at TP</span><b className="up">{money(plAt(tpKes))}</b></div>}
          </div>

          {tErr && <div className="tk-err">{tErr}</div>}

          <div className="tk-actions">
            <button className="tk-do sell" onClick={() => trade('Sell')}>SELL {volNum.toLocaleString()} {unit}</button>
            <button className="tk-do buy" onClick={() => trade('Buy')}>BUY {volNum.toLocaleString()} {unit}</button>
          </div>

          <button className="tk-adv" onClick={() => setShowAdv(true)}>⚙ Advanced · limit / futures / puts & delivery →</button>
        </aside>
      </div>

      {/* Bottom terminal */}
      <div className="term-terminal">
        <div className="term-acct">
          <div className="ac"><span>Balance</span><b>{money(acct.balance)}</b></div>
          <div className="ac"><span>Equity</span><b>{money(acct.equity)}</b></div>
          <div className="ac"><span>Margin</span><b>{money(acct.usedMargin)}</b></div>
          <div className="ac"><span>Free margin</span><b>{money(acct.freeMargin)}</b></div>
          <div className="ac"><span>Level</span><b>{acct.usedMargin > 0 ? acct.marginLevel.toFixed(0) + '%' : '—'}</b></div>
          <div className="ac"><span>Floating P/L</span><b className={acct.openPl >= 0 ? 'up' : 'down'}>{money(acct.openPl)}</b></div>
          <div className="ac-actions">
            {engine.positions.length > 0 && <button className="term-btn danger" onClick={engine.closeAll}>Close all</button>}
            <button className="term-btn" onClick={engine.resetAccount}>Reset demo</button>
          </div>
        </div>

        <div className="term-tabs">
          <button className={tab === 'positions' ? 'active' : ''} onClick={() => setTab('positions')}>Positions ({engine.positions.length})</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History ({engine.history.length})</button>
          <button className={tab === 'journal' ? 'active' : ''} onClick={() => setTab('journal')}>Journal</button>
        </div>

        <div className="term-panel">
          {tab === 'positions' && (
            engine.positions.length === 0 ? <div className="tp-empty">No open positions. Place a BUY or SELL to start trading.</div> : (
              <table className="tp-table">
                <thead><tr><th>Symbol</th><th>Type</th><th>Vol</th><th>Open</th><th>S/L</th><th>T/P</th><th>Price</th><th>P/L</th><th></th></tr></thead>
                <tbody>
                  {engine.positions.map(p => {
                    const pq = engine.quotes[p.symbol];
                    const cur = pq ? closePriceOf(p, pq) : p.openPrice;
                    const pl = pq ? livePl(p, pq) : 0;
                    const editing = editId === p.id;
                    return (
                      <tr key={p.id}>
                        <td className="tp-sym">{categoryIcon(p.symbol)} {p.symbol}</td>
                        <td className={p.side === 'Buy' ? 'up' : 'down'}>{p.side.toLowerCase()}</td>
                        <td>{p.volume.toLocaleString()}</td>
                        <td>{px(p.openPrice)}</td>
                        <td>{editing ? <input className="tp-edit" type="number" step="any" value={eSl} onChange={e => setESl(e.target.value)} /> : (p.sl != null ? px(p.sl) : '—')}</td>
                        <td>{editing ? <input className="tp-edit" type="number" step="any" value={eTp} onChange={e => setETp(e.target.value)} /> : (p.tp != null ? px(p.tp) : '—')}</td>
                        <td>{px(cur)}</td>
                        <td className={pl >= 0 ? 'up' : 'down'}>{money(pl)}</td>
                        <td className="tp-act">
                          {editing ? (
                            <>
                              <button className="tp-btn ok" onClick={saveEdit}>Save</button>
                              <button className="tp-btn" onClick={() => setEditId(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              <button className="tp-btn" onClick={() => startEdit(p)}>✎</button>
                              <button className="tp-btn close" onClick={() => engine.close(p.id)}>Close</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {tab === 'history' && (
            engine.history.length === 0 ? <div className="tp-empty">No closed trades yet.</div> : (
              <table className="tp-table">
                <thead><tr><th>Symbol</th><th>Type</th><th>Vol</th><th>Open</th><th>Close</th><th>Reason</th><th>P/L</th><th>Closed</th></tr></thead>
                <tbody>
                  {engine.history.map(h => (
                    <tr key={h.id}>
                      <td className="tp-sym">{categoryIcon(h.symbol)} {h.symbol}</td>
                      <td className={h.side === 'Buy' ? 'up' : 'down'}>{h.side.toLowerCase()}</td>
                      <td>{h.volume.toLocaleString()}</td>
                      <td>{px(h.openPrice)}</td>
                      <td>{px(h.closePrice)}</td>
                      <td><span className={`rz ${h.reason}`}>{h.reason.toUpperCase()}</span></td>
                      <td className={h.pl >= 0 ? 'up' : 'down'}>{money(h.pl)}</td>
                      <td className="tp-time">{new Date(h.closedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {tab === 'journal' && (
            engine.journal.length === 0 ? <div className="tp-empty">Trade activity and alerts will appear here.</div> : (
              <div className="tj-list">
                {engine.journal.map(j => (
                  <div key={j.id} className={`tj-row ${j.kind}`}>
                    <span className="tj-time">{new Date(j.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="tj-text">{j.text}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <div className="term-foot">
        Demo commodity CFDs for education — no real funds. Trade physical produce on the <Link to="/browse">marketplace</Link> or <Link to="/delivery">check delivery routes →</Link>
      </div>

      {/* Toast */}
      {engine.toast && (
        <div className={`term-toast ${engine.toast.kind}`}>
          <b>{engine.toast.title}</b>
          <span>{engine.toast.body}</span>
        </div>
      )}

      {/* Advanced / exchange modal */}
      {showAdv && (
        <div className="term-modal" onClick={() => setShowAdv(false)}>
          <div className="term-modal-card" onClick={e => e.stopPropagation()}>
            <button className="term-modal-x" onClick={() => setShowAdv(false)}>✕</button>
            <TradeTicket
              ctx={{ commodity: selected, unit, referencePriceKes: midKes }}
              initialSide={side}
              onPlaced={() => { setReloadKey(k => k + 1); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
