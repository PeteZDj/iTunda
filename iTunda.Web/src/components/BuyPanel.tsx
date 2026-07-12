import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { categoryIcon } from '../lib/categories';
import { flagUrl } from '../lib/geo';
import LocationPicker from './LocationPicker';
import type { ProduceResponse } from '../types';
import './BuyPanel.css';

interface Pack { id: string; label: string; kg: number; emoji: string; }

// How buyers can purchase a kg-priced commodity. Each pack converts to kg so
// pricing and stock stay consistent, while the buyer sees a familiar unit.
const PACKS: Pack[] = [
  { id: 'kg',     label: 'Kilogram', kg: 1,    emoji: '⚖️' },
  { id: 'bunch',  label: 'Bunch',    kg: 1.5,  emoji: '🍌' },
  { id: 'dozen',  label: 'Dozen',    kg: 1.2,  emoji: '🔢' },
  { id: 'tray',   label: 'Tray',     kg: 5,    emoji: '🥡' },
  { id: 'basket', label: 'Basket',   kg: 10,   emoji: '🧺' },
  { id: 'crate',  label: 'Crate',    kg: 20,   emoji: '📦' },
  { id: 'sack',   label: 'Sack/Bag', kg: 50,   emoji: '🛍️' },
];

interface Props {
  commodity: string;
  offers: ProduceResponse[];
  onPlaced?: () => void;
}

export default function BuyPanel({ commodity, offers, onPlaced }: Props) {
  const { isLoggedIn } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [offerId, setOfferId] = useState<number | null>(null);
  const [packId, setPackId] = useState('kg');
  const [count, setCount] = useState('10');
  const [scope, setScope] = useState<'Local' | 'Export'>('Local');
  const [when, setWhen] = useState('');
  const [address, setAddress] = useState('');
  const [loc, setLoc] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  // Default to the cheapest offer whenever the commodity/offer list changes.
  useEffect(() => {
    if (offers.length > 0) setOfferId(offers[0].id);
    else setOfferId(null);
    setOk(false); setConfirming(false); setErr('');
  }, [offers, commodity]);

  const offer = useMemo(() => offers.find(o => o.id === offerId) ?? null, [offers, offerId]);
  const baseUnit = (offer?.unit ?? 'kg').toLowerCase();
  const isKg = baseUnit === 'kg';
  const pack = PACKS.find(p => p.id === packId) ?? PACKS[0];

  const countNum = Math.max(0, parseFloat(count) || 0);
  // For kg-priced produce, packs convert to kg; otherwise buy in the listing's own unit.
  const qtyKg = isKg ? countNum * pack.kg : countNum;
  const pricePerBase = offer?.price ?? 0;
  const total = pricePerBase * qtyKg;

  const packaging = useMemo(() => {
    if (!offer) return '';
    if (!isKg) return `${countNum.toLocaleString()} × ${offer.unit}`;
    if (pack.id === 'kg') return `${countNum.toLocaleString()} kg`;
    return `${countNum.toLocaleString()} × ${pack.label} (≈ ${qtyKg.toLocaleString()} kg)`;
  }, [offer, isKg, pack, countNum, qtyKg]);

  const enoughStock = offer ? qtyKg <= offer.quantityAvailable : false;

  const packPlural = !isKg
    ? (offer?.unit ?? 'units')
    : pack.id === 'kg' ? 'kilograms'
    : pack.id === 'bunch' ? 'bunches'
    : pack.id === 'sack' ? 'sacks'
    : pack.label.toLowerCase() + 's';

  const validate = (): string | null => {
    if (!offer) return 'Select a farmer offer to buy.';
    if (countNum <= 0) return 'Enter how much you want to buy.';
    if (!enoughStock) return `Only ${offer.quantityAvailable.toLocaleString()} ${offer.unit} available from this farmer.`;
    if (!when) return 'Choose a preferred delivery time.';
    if (!address.trim()) return 'Enter or pin a delivery address.';
    return null;
  };

  const askConfirm = () => {
    setErr('');
    const v = validate();
    if (v) { setErr(v); return; }
    if (!isLoggedIn) {
      navigate('/login?next=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    setConfirming(true);
  };

  const submit = async () => {
    if (!offer) return;
    setBusy(true); setErr('');
    try {
      await createOrder({
        deliveryAddress: address,
        items: [{ produceId: offer.id, quantity: qtyKg }],
        deliveryScope: scope,
        deliveryLat: loc.lat,
        deliveryLng: loc.lng,
        requestedDeliveryAt: new Date(when).toISOString(),
        packaging,
      });
      setConfirming(false);
      setOk(true);
      onPlaced?.();
    } catch (e: any) {
      setConfirming(false);
      setErr(e?.response?.data || 'Order failed. Please try again.');
    } finally { setBusy(false); }
  };

  const minWhen = new Date(Date.now() + 3600_000).toISOString().slice(0, 16);

  if (ok) {
    return (
      <div className="buyp card">
        <div className="buyp-success">
          <div className="buyp-success-ico">🎉</div>
          <h3>Order placed!</h3>
          <p>Your order for <b>{packaging} of {commodity}</b> is confirmed. We’ll arrange {scope === 'Export' ? 'international' : 'local'} delivery for {when && new Date(when).toLocaleString()}.</p>
          <div className="buyp-success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>View my orders →</button>
            <button className="btn btn-outline" onClick={() => { setOk(false); setCount('10'); }}>Buy more</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buyp card">
      {/* What you're buying */}
      <div className="buyp-head">
        <span className="buyp-emoji">{categoryIcon(commodity)}</span>
        <div>
          <span className="buyp-eyebrow">You are buying</span>
          <h2 className="buyp-title">{commodity}</h2>
        </div>
        <span className="buyp-badge">Fresh produce</span>
      </div>

      {offers.length === 0 ? (
        <div className="buyp-empty">
          No live farmer offers for <b>{commodity}</b> right now. Post a buy order below and farmers will fill it.
        </div>
      ) : (
        <>
          {/* Choose the actual farmer offer */}
          <label className="buyp-label">Choose a farmer offer</label>
          <div className="buyp-offer-select">
            <select className="input" value={offerId ?? ''} onChange={e => setOfferId(Number(e.target.value))}>
              {offers.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name} — {o.farmerName || 'Farmer'} · {o.region || o.county || o.country} · {format(o.price)}/{o.unit}
                </option>
              ))}
            </select>
          </div>

          {offer && (
            <div className="buyp-offer-card">
              <img className="buyp-offer-img" src={offer.imageUrl || offer.iconUrl} alt="" onError={e => { (e.target as HTMLImageElement).src = offer.iconUrl; }} />
              <div className="buyp-offer-info">
                <span className="buyp-offer-name">{offer.name}</span>
                <span className="buyp-offer-meta">
                  <img className="buyp-flag" src={flagUrl(offer.countryCode)} alt="" />
                  {offer.farmerName ? `${offer.farmerName} · ` : ''}{[offer.region, offer.country].filter(Boolean).join(', ')}
                </span>
                <span className="buyp-offer-meta">
                  {offer.gradeQuality ? `${offer.gradeQuality} · ` : ''}
                  {offer.quantityAvailable.toLocaleString()} {offer.unit} available
                  {offer.isExportReady ? ' · ✈ export-ready' : ''}
                </span>
              </div>
              <div className="buyp-offer-price">{format(offer.price)}<span>/{offer.unit}</span></div>
            </div>
          )}

          {/* Pack unit */}
          <label className="buyp-label">Buy by the…</label>
          {isKg ? (
            <div className="buyp-packs">
              {PACKS.map(p => (
                <button key={p.id} type="button" className={`buyp-pack ${packId === p.id ? 'active' : ''}`} onClick={() => setPackId(p.id)}>
                  <span className="buyp-pack-emoji">{p.emoji}</span>
                  <span className="buyp-pack-label">{p.label}</span>
                  {p.id !== 'kg' && <span className="buyp-pack-kg">≈ {p.kg} kg</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="buyp-packs">
              <button type="button" className="buyp-pack active">
                <span className="buyp-pack-emoji">📦</span>
                <span className="buyp-pack-label">{offer?.unit}</span>
              </button>
            </div>
          )}

          {/* Quantity */}
          <div className="buyp-qty-row">
            <div className="buyp-field">
              <label className="buyp-label">How many {packPlural}?</label>
              <div className="buyp-stepper">
                <button type="button" onClick={() => setCount(String(Math.max(0, countNum - 1)))}>−</button>
                <input className="input" type="number" min="0" step="any" value={count} onChange={e => setCount(e.target.value)} />
                <button type="button" onClick={() => setCount(String(countNum + 1))}>+</button>
              </div>
            </div>
            <div className="buyp-field buyp-qty-summary">
              <span className="buyp-label">Quantity</span>
              <strong>{packaging || '—'}</strong>
              {isKg && pack.id !== 'kg' && <span className="buyp-qty-note">total ≈ {qtyKg.toLocaleString()} kg</span>}
            </div>
          </div>

          {/* Delivery scope */}
          <label className="buyp-label">Delivery</label>
          <div className="buyp-scope">
            <button type="button" className={`buyp-scope-btn ${scope === 'Local' ? 'active' : ''}`} onClick={() => setScope('Local')}>
              🏠 <b>Local</b><span>Within the country</span>
            </button>
            <button type="button" className={`buyp-scope-btn ${scope === 'Export' ? 'active' : ''}`} onClick={() => setScope('Export')}>
              ✈ <b>International</b><span>Export / cross-border</span>
            </button>
          </div>

          {/* Delivery time */}
          <div className="buyp-field">
            <label className="buyp-label">Preferred delivery time</label>
            <input className="input" type="datetime-local" min={minWhen} value={when} onChange={e => setWhen(e.target.value)} />
          </div>

          {/* Address */}
          <div className="buyp-field">
            <label className="buyp-label">Delivery address</label>
            <LocationPicker
              lat={loc.lat} lng={loc.lng} label={address}
              height={190}
              placeholder={scope === 'Export' ? 'Destination port / city…' : 'Search address or drop a pin…'}
              onChange={v => { setLoc({ lat: v.lat, lng: v.lng }); if (v.label) setAddress(v.label); }}
              onLabelChange={setAddress}
            />
          </div>

          {err && <div className="alert alert-error" style={{ marginTop: 12 }}>{err}</div>}

          {/* Total + CTA */}
          <div className="buyp-total">
            <div>
              <span className="buyp-total-l">Order total</span>
              <span className="buyp-total-v">{format(total)}</span>
            </div>
            <button className="btn buyp-cta" disabled={busy || !offer} onClick={askConfirm}>
              🛒 Buy {commodity}
            </button>
          </div>
          <p className="buyp-note">Secure checkout · delivery tracking included · pay on the platform.</p>
        </>
      )}

      {/* Confirmation */}
      {confirming && offer && (
        <div className="buyp-modal" onClick={() => !busy && setConfirming(false)}>
          <div className="buyp-modal-card" onClick={e => e.stopPropagation()}>
            <div className="buyp-modal-ico">🛒</div>
            <h3>Confirm your purchase</h3>
            <p className="buyp-modal-sub">You are buying <b>{packaging} of {commodity}</b>{offer.name ? ` (${offer.name})` : ''}.</p>
            <div className="buyp-modal-rows">
              <div><span>Farmer</span><b>{offer.farmerName || '—'}</b></div>
              <div><span>Quantity</span><b>{packaging}</b></div>
              <div><span>Unit price</span><b>{format(offer.price)}/{offer.unit}</b></div>
              <div><span>Delivery</span><b>{scope === 'Export' ? '✈ International' : '🏠 Local'}</b></div>
              <div><span>Delivery time</span><b>{when ? new Date(when).toLocaleString() : '—'}</b></div>
              <div><span>Deliver to</span><b title={address}>{address ? address.slice(0, 32) : '—'}</b></div>
              <div className="total"><span>Total</span><b>{format(total)}</b></div>
            </div>
            <div className="buyp-modal-actions">
              <button className="btn btn-outline" disabled={busy} onClick={() => setConfirming(false)}>← Back</button>
              <button className="btn buyp-cta" disabled={busy} onClick={submit}>{busy ? 'Placing…' : `✓ Confirm & buy`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
