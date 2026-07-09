import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, createBuyOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import type { OrderKind, OrderSide, CreateBuyOrderRequest } from '../types';
import './TradeTicket.css';

export interface TradeContext {
  commodity: string;
  unit: string;
  referencePriceKes: number;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
  zone?: number;
  variety?: string | null;
  grade?: string | null;
  /** When trading a specific listing, enables "Buy now" market fulfilment. */
  produceId?: number;
}

const KINDS: { id: OrderKind; label: string; blurb: string }[] = [
  { id: 'Spot', label: 'Market', blurb: 'Trade immediately at the current price.' },
  { id: 'Limit', label: 'Limit', blurb: 'Rest an order at your target price until filled.' },
  { id: 'Futures', label: 'Futures', blurb: 'Forward contract for delivery on a future date.' },
  { id: 'Put', label: 'Put option', blurb: 'Lock in a price floor (strike) that expires on a date.' },
];

interface Props {
  ctx: TradeContext;
  initialSide?: OrderSide;
  initialKind?: OrderKind;
  onPlaced?: () => void;
}

export default function TradeTicket({ ctx, initialSide = 'Buy', initialKind = 'Spot', onPlaced }: Props) {
  const { isLoggedIn, name } = useAuth();
  const { currency, rates, format, symbol } = useCurrency();
  const navigate = useNavigate();

  const [side, setSide] = useState<OrderSide>(initialSide);
  const [kind, setKind] = useState<OrderKind>(initialKind);
  const [qty, setQty] = useState('100');
  const [priceCcy, setPriceCcy] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [address, setAddress] = useState('');
  const [trader, setTrader] = useState(name ?? '');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');

  const rate = rates[currency] ?? 1;
  const refPriceCcy = ctx.referencePriceKes * rate;
  const isMarket = kind === 'Spot';
  const isMarketBuy = side === 'Buy' && isMarket && !!ctx.produceId;

  // Seed the limit/strike price with the market reference when switching to a priced order.
  useEffect(() => {
    if (!isMarket && !priceCcy) setPriceCcy(refPriceCcy.toFixed(refPriceCcy < 100 ? 2 : 0));
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const effPriceCcy = isMarket ? refPriceCcy : (parseFloat(priceCcy) || 0);
  const qtyNum = parseFloat(qty) || 0;
  const totalKes = (effPriceCcy / rate) * qtyNum;

  const priceLabel = kind === 'Put' ? 'Strike price' : kind === 'Futures' ? 'Contract price' : 'Limit price';
  const needsDate = kind === 'Futures' || kind === 'Put';

  const submitLabel = useMemo(() => {
    if (isMarketBuy) return `🛒 Buy now · ${format(totalKes)}`;
    if (side === 'Buy') {
      if (kind === 'Limit') return '📉 Place buy limit';
      if (kind === 'Futures') return '📈 Open long future';
      if (kind === 'Put') return '🛡 Buy put option';
      return '🛒 Post buy order';
    }
    if (kind === 'Limit') return '📈 Post sell offer';
    if (kind === 'Futures') return '📑 Sell forward contract';
    if (kind === 'Put') return '🛡 Write put option';
    return '💰 Sell at market';
  }, [side, kind, isMarketBuy, totalKes, format]);

  const submit = async () => {
    setErr(''); setOk('');
    if (qtyNum <= 0) { setErr('Enter a valid quantity.'); return; }
    if (!isMarket && effPriceCcy <= 0) { setErr(`Enter a valid ${priceLabel.toLowerCase()}.`); return; }
    if (needsDate && !contractDate) { setErr('Choose a contract / expiry date.'); return; }

    // Market BUY of a specific listing → a real fulfilled order (needs login).
    if (isMarketBuy) {
      if (!isLoggedIn) { navigate('/login'); return; }
      if (!address.trim()) { setErr('Enter a delivery address.'); return; }
      setBusy(true);
      try {
        await createOrder({ deliveryAddress: address, items: [{ produceId: ctx.produceId!, quantity: qtyNum }] });
        setOk('order');
        onPlaced?.();
      } catch (e: any) { setErr(e?.response?.data || 'Order failed. Please try again.'); }
      finally { setBusy(false); }
      return;
    }

    // Everything else posts to the exchange order book (no login required).
    if (!trader.trim()) { setErr('Enter your name or company.'); return; }
    const priceKes = Math.round(effPriceCcy / rate);
    const payload: CreateBuyOrderRequest = {
      commodity: ctx.commodity,
      variety: ctx.variety ?? null,
      grade: ctx.grade ?? null,
      unit: ctx.unit,
      quantity: qtyNum,
      targetPrice: priceKes,
      region: ctx.region ?? null,
      country: ctx.country ?? null,
      countryCode: ctx.countryCode ?? null,
      zone: ctx.zone ?? 0,
      buyerName: trader,
      buyerContact: contact || null,
      exportRequired: false,
      neededBy: contractDate || null,
      side,
      kind,
      contractDate: contractDate || null,
    };
    setBusy(true);
    try {
      await createBuyOrder(payload);
      setOk('book');
      setPriceCcy(''); setContact('');
      onPlaced?.();
    } catch { setErr('Could not place order. Please try again.'); }
    finally { setBusy(false); }
  };

  if (ok) {
    return (
      <div className="tt-card">
        <div className="alert alert-success" style={{ marginBottom: 14 }}>
          {ok === 'order' ? '🎉 Order placed successfully!' : `✅ Your ${side.toLowerCase()} ${kind === 'Spot' ? 'order' : kind.toLowerCase() + ' order'} is live on the exchange.`}
        </div>
        <div className="tt-done-actions">
          {ok === 'order'
            ? <button className="btn btn-primary" onClick={() => navigate('/orders')}>View my orders →</button>
            : <button className="btn btn-buy" onClick={() => navigate(`/market?c=${encodeURIComponent(ctx.commodity)}`)}>View the order book →</button>}
          <button className="btn btn-outline" onClick={() => setOk('')}>Place another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tt-card">
      <div className="tt-head">
        <span className="tt-title">Trade {ctx.commodity}</span>
        <span className="tt-ref">Mkt {format(ctx.referencePriceKes)}/{ctx.unit}</span>
      </div>

      {/* Buy / Sell */}
      <div className="tt-side">
        <button className={`tt-side-btn buy ${side === 'Buy' ? 'active' : ''}`} onClick={() => setSide('Buy')}>BUY</button>
        <button className={`tt-side-btn sell ${side === 'Sell' ? 'active' : ''}`} onClick={() => setSide('Sell')}>SELL</button>
      </div>

      {/* Order type */}
      <div className="tt-kinds">
        {KINDS.map(k => (
          <button key={k.id} className={`tt-kind ${kind === k.id ? 'active' : ''}`} onClick={() => setKind(k.id)} title={k.blurb}>
            {k.label}
          </button>
        ))}
      </div>
      <p className="tt-kind-blurb">{KINDS.find(k => k.id === kind)?.blurb}</p>

      {err && <div className="alert alert-error" style={{ marginBottom: 10 }}>{err}</div>}

      <div className="tt-field">
        <label>Quantity ({ctx.unit})</label>
        <input className="input" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
      </div>

      {!isMarket && (
        <div className="tt-field">
          <label>{priceLabel} ({symbol} / {ctx.unit})</label>
          <input className="input" type="number" min="0" value={priceCcy} onChange={e => setPriceCcy(e.target.value)} placeholder={refPriceCcy.toFixed(2)} />
        </div>
      )}

      {needsDate && (
        <div className="tt-field">
          <label>{kind === 'Put' ? 'Expiry date' : 'Delivery month'}</label>
          <input className="input" type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} />
        </div>
      )}

      {isMarketBuy && (
        <div className="tt-field">
          <label>Delivery address</label>
          <textarea className="input textarea" rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Where should we deliver?" />
        </div>
      )}

      {!isMarketBuy && (
        <div className="tt-field-2">
          <div className="tt-field">
            <label>Your name / company</label>
            <input className="input" value={trader} onChange={e => setTrader(e.target.value)} placeholder="e.g. Rotterdam Produce BV" />
          </div>
          <div className="tt-field">
            <label>Contact (optional)</label>
            <input className="input" value={contact} onChange={e => setContact(e.target.value)} placeholder="email / phone" />
          </div>
        </div>
      )}

      <div className="tt-summary">
        <div className="tt-summary-row">
          <span>{isMarket ? 'Market price' : priceLabel}</span>
          <strong>{format(Math.round(effPriceCcy / rate))}/{ctx.unit}</strong>
        </div>
        <div className="tt-summary-row total">
          <span>{kind === 'Put' ? 'Notional' : 'Estimated total'}</span>
          <strong>{format(totalKes)}</strong>
        </div>
      </div>

      <button className={`btn tt-submit ${side === 'Buy' ? 'btn-buy' : 'btn-sell'}`} disabled={busy} onClick={submit}>
        {busy ? 'Working…' : submitLabel}
      </button>
      <p className="tt-note">
        {isMarketBuy
          ? 'Secure order · delivery tracking included.'
          : 'Posted to the public exchange book — no account required.'}
      </p>
    </div>
  );
}
