import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { estimateDelivery } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { useCurrency } from '../context/CurrencyContext';
import { flagUrl } from '../lib/geo';
import LeafletMap, { type MapMarker } from '../components/LeafletMap';
import LocationPicker from '../components/LocationPicker';
import type { DeliveryEstimateResponse } from '../types';
import './DeliveryPage.css';

interface Loc { id: string; label: string; sub: string; lat: number; lng: number; cc: string; }

const HUBS: Loc[] = [
  { id: 'mombasa', label: 'Mombasa Port', sub: 'Kenya · sea freight', lat: -4.0435, lng: 39.6682, cc: 'KE' },
  { id: 'nairobi', label: 'Nairobi (JKIA)', sub: 'Kenya · air freight', lat: -1.3192, lng: 36.9278, cc: 'KE' },
  { id: 'rotterdam', label: 'Rotterdam', sub: 'Netherlands · EU gateway', lat: 51.9244, lng: 4.4777, cc: 'NL' },
  { id: 'london', label: 'London', sub: 'United Kingdom', lat: 51.5074, lng: -0.1278, cc: 'GB' },
  { id: 'dubai', label: 'Dubai', sub: 'UAE · Middle East hub', lat: 25.2048, lng: 55.2708, cc: 'AE' },
  { id: 'paris', label: 'Paris (Rungis)', sub: 'France', lat: 48.7626, lng: 2.3522, cc: 'FR' },
  { id: 'shanghai', label: 'Shanghai', sub: 'China', lat: 31.2304, lng: 121.4737, cc: 'CN' },
  { id: 'mumbai', label: 'Mumbai', sub: 'India', lat: 19.076, lng: 72.8777, cc: 'IN' },
  { id: 'joburg', label: 'Johannesburg', sub: 'South Africa', lat: -26.2041, lng: 28.0473, cc: 'ZA' },
];

interface Courier { id: string; name: string; vehicle: string; emoji: string; rating: number; base: number; perKm: number; kgMax: number; speed: number; }
const COURIERS: Courier[] = [
  { id: 'boda', name: 'James Mwangi', vehicle: 'Motorbike (boda)', emoji: '🏍️', rating: 4.9, base: 150, perKm: 38, kgMax: 80, speed: 32 },
  { id: 'tuk', name: 'Grace Wanjiru', vehicle: 'Tuk-tuk', emoji: '🛺', rating: 4.7, base: 250, perKm: 48, kgMax: 400, speed: 26 },
  { id: 'pickup', name: 'Otieno Kevin', vehicle: 'Pickup truck', emoji: '🛻', rating: 4.8, base: 600, perKm: 72, kgMax: 1500, speed: 45 },
  { id: 'van', name: 'Fatuma Ali', vehicle: 'Refrigerated van', emoji: '🚐', rating: 4.9, base: 1200, perKm: 96, kgMax: 3000, speed: 48 },
  { id: 'truck', name: 'Brian Cheruiyot', vehicle: 'Cold-chain truck', emoji: '🚚', rating: 4.6, base: 3500, perKm: 125, kgMax: 12000, speed: 55 },
];

const STEPS = ['Assigned', 'Driver en route to pickup', 'Produce picked up', 'Out for delivery', 'Delivered'];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface Assignment { courierId: string; name: string; vehicle: string; emoji: string; rating: number; price: number; distance: number; etaMin: number; pickup: string; drop: string; step: number; at: number; }

export default function DeliveryPage() {
  const { regions } = useRegion();
  const { format, currency } = useCurrency();
  const [mode, setMode] = useState<'local' | 'freight'>('local');

  // ── Freight (region → hub) ────────────────────────────────────────────────
  const locations: Loc[] = useMemo(() => [
    ...regions.map(r => ({ id: `r:${r.name}`, label: r.name, sub: `${r.country} · Zone ${r.zone}`, lat: r.lat, lng: r.lng, cc: r.countryCode })),
    ...HUBS,
  ], [regions]);

  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('rotterdam');
  const [weight, setWeight] = useState('1000');
  const [result, setResult] = useState<DeliveryEstimateResponse | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [routeDashed, setRouteDashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!originId && regions.length) setOriginId(`r:${regions[0].name}`); }, [regions, originId]);

  const origin = locations.find(l => l.id === originId) ?? null;
  const dest = locations.find(l => l.id === destId) ?? null;

  const run = async () => {
    if (!origin || !dest) return;
    setLoading(true); setError(''); setResult(null); setRoute(null);
    try {
      const res = await estimateDelivery({
        originLat: origin.lat, originLng: origin.lng, destLat: dest.lat, destLng: dest.lng,
        originLabel: origin.label, destLabel: dest.label, weightKg: parseFloat(weight) || undefined,
      });
      setResult(res);
      if (res.distanceKm <= 1500) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
          const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
          const data = await r.json();
          const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
          if (coords && coords.length) { setRoute(coords.map(([lng, lat]) => [lat, lng])); setRouteDashed(false); } else { throw new Error('no route'); }
        } catch { setRoute([[origin.lat, origin.lng], [dest.lat, dest.lng]]); setRouteDashed(true); }
      } else { setRoute([[origin.lat, origin.lng], [dest.lat, dest.lng]]); setRouteDashed(true); }
    } catch { setError('Could not estimate delivery. Please try again.'); } finally { setLoading(false); }
  };

  useEffect(() => { if (mode === 'freight' && origin && dest && !result && !loading) run(); /* eslint-disable-next-line */ }, [origin?.id, dest?.id, mode]);

  // ── Local courier (pin → pin, Uber-style) ─────────────────────────────────
  const [pickup, setPickup] = useState<{ lat: number | null; lng: number | null; label: string }>({ lat: -1.2921, lng: 36.8219, label: 'Nairobi CBD' });
  const [drop, setDrop] = useState<{ lat: number | null; lng: number | null; label: string }>({ lat: null, lng: null, label: '' });
  const [lWeight, setLWeight] = useState('50');
  const [selCourier, setSelCourier] = useState<string | null>(null);
  const [lRoute, setLRoute] = useState<[number, number][] | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(() => {
    try { const s = localStorage.getItem('itunda_delivery'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const timerRef = useRef<number | null>(null);

  const localDist = pickup.lat != null && drop.lat != null
    ? haversineKm({ lat: pickup.lat, lng: pickup.lng! }, { lat: drop.lat, lng: drop.lng! }) : 0;
  const lWeightNum = parseFloat(lWeight) || 0;
  const availableCouriers = COURIERS.filter(c => c.kgMax >= lWeightNum);

  const courierQuote = (c: Courier) => {
    const price = Math.round(c.base + c.perKm * localDist);
    const etaMin = Math.max(6, Math.round((localDist / c.speed) * 60) + 5);
    return { price, etaMin };
  };

  // Draw a driving route between the two pins.
  useEffect(() => {
    if (pickup.lat == null || drop.lat == null) { setLRoute(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
        const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
        const data = await r.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        if (!cancelled) setLRoute(coords?.length ? coords.map(([lng, lat]) => [lat, lng]) : [[pickup.lat!, pickup.lng!], [drop.lat!, drop.lng!]]);
      } catch { if (!cancelled) setLRoute([[pickup.lat!, pickup.lng!], [drop.lat!, drop.lng!]]); }
    })();
    return () => { cancelled = true; };
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  // Simulated live status progression once a courier is assigned.
  useEffect(() => {
    if (!assignment) return;
    localStorage.setItem('itunda_delivery', JSON.stringify(assignment));
    if (assignment.step >= STEPS.length - 1) return;
    timerRef.current = window.setTimeout(() => {
      setAssignment(a => (a ? { ...a, step: Math.min(a.step + 1, STEPS.length - 1) } : a));
    }, 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [assignment]);

  const assign = () => {
    const c = COURIERS.find(x => x.id === selCourier);
    if (!c || pickup.lat == null || drop.lat == null) return;
    const { price, etaMin } = courierQuote(c);
    setAssignment({
      courierId: c.id, name: c.name, vehicle: c.vehicle, emoji: c.emoji, rating: c.rating,
      price, distance: localDist, etaMin, pickup: pickup.label || 'Pickup pin', drop: drop.label || 'Drop-off pin',
      step: 0, at: Date.now(),
    });
  };
  const cancelAssignment = () => { setAssignment(null); localStorage.removeItem('itunda_delivery'); };

  // Map markers
  const freightMarkers: MapMarker[] = [];
  if (origin) freightMarkers.push({ lat: origin.lat, lng: origin.lng, title: origin.label, subtitle: `Origin · ${origin.sub}`, color: '#0e7a3e', emoji: '🌱' });
  if (dest) freightMarkers.push({ lat: dest.lat, lng: dest.lng, title: dest.label, subtitle: `Destination · ${dest.sub}`, color: '#f4a621', emoji: '🏁' });

  const localMarkers: MapMarker[] = [];
  if (pickup.lat != null) localMarkers.push({ lat: pickup.lat, lng: pickup.lng!, title: 'Pickup', subtitle: pickup.label, color: '#0e7a3e', emoji: '📦' });
  if (drop.lat != null) localMarkers.push({ lat: drop.lat, lng: drop.lng!, title: 'Drop-off', subtitle: drop.label, color: '#f4a621', emoji: '📍' });

  return (
    <div className="delivery-page">
      <div className="dl-hero">
        <div className="page-container">
          <h1 className="dl-title">Delivery &amp; Logistics</h1>
          <p className="dl-sub">
            Assign a local courier pin-to-pin — Uber-style — or price cross-border freight between any
            growing region and market hub. No account needed to get a quote.
          </p>
          <div className="dl-mode-toggle">
            <button className={mode === 'local' ? 'active' : ''} onClick={() => setMode('local')}>🛵 Local courier (pin → pin)</button>
            <button className={mode === 'freight' ? 'active' : ''} onClick={() => setMode('freight')}>✈ Export freight (region → hub)</button>
          </div>
        </div>
      </div>

      <div className="page-container dl-body">
        {mode === 'freight' ? (
          <div className="dl-grid">
            <div className="dl-panel">
              <div className="card">
                <h3 className="card-section-title">Plan a shipment</h3>
                <label className="dl-field">From (origin)
                  <select className="select" value={originId} onChange={e => setOriginId(e.target.value)}>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.label} — {l.sub}</option>)}
                  </select>
                </label>
                <label className="dl-field">To (destination)
                  <select className="select" value={destId} onChange={e => setDestId(e.target.value)}>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.label} — {l.sub}</option>)}
                  </select>
                </label>
                <label className="dl-field">Consignment weight (kg)
                  <input className="input" type="number" min="1" value={weight} onChange={e => setWeight(e.target.value)} />
                </label>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={run} disabled={loading}>
                  {loading ? 'Estimating…' : 'Estimate route & price'}
                </button>
                {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
              </div>

              {result && (
                <div className="card dl-result">
                  <div className="dl-route-heads">
                    <div className="dl-endpoint">{origin && <img className="pc-flag" src={flagUrl(origin.cc)} alt="" />}<span>{result.originLabel}</span></div>
                    <span className="dl-arrow">→</span>
                    <div className="dl-endpoint">{dest && <img className="pc-flag" src={flagUrl(dest.cc)} alt="" />}<span>{result.destLabel}</span></div>
                  </div>
                  <div className="dl-price">
                    <span className="dl-price-big">{format(result.priceKes)}</span>
                    <span className="dl-price-usd">{currency === 'KES' ? `≈ US$ ${result.priceUsd.toLocaleString()}` : `≈ KES ${result.priceKes.toLocaleString()}`}</span>
                  </div>
                  <div className="dl-mode">{result.mode}</div>
                  <div className="dl-metrics">
                    <div><span className="dl-m-l">Distance</span><span className="dl-m-v">{result.distanceKm.toLocaleString()} km</span></div>
                    <div><span className="dl-m-l">Transit</span><span className="dl-m-v">{result.etaHours} h</span></div>
                    <div><span className="dl-m-l">Base fee</span><span className="dl-m-v">{format(result.baseFee)}</span></div>
                    <div><span className="dl-m-l">Per km</span><span className="dl-m-v">{format(result.perKm)}</span></div>
                  </div>
                  <a href={result.googleMapsUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>🗺 Open directions in Google Maps</a>
                  <p className="dl-disclaimer">Indicative estimate for planning. Final freight quoted on booking.</p>
                </div>
              )}
            </div>
            <div className="dl-map-wrap"><LeafletMap markers={freightMarkers} route={route ?? undefined} routeDashed={routeDashed} height="100%" zoom={5} /></div>
          </div>
        ) : (
          <div className="dl-grid">
            <div className="dl-panel">
              {!assignment ? (
                <>
                  <div className="card">
                    <h3 className="card-section-title">📦 Pickup</h3>
                    <LocationPicker lat={pickup.lat} lng={pickup.lng} label={pickup.label} height={170}
                      placeholder="Farm / warehouse pickup point…"
                      onChange={v => setPickup({ lat: v.lat, lng: v.lng, label: v.label ?? pickup.label })}
                      onLabelChange={l => setPickup(p => ({ ...p, label: l }))} />
                    <h3 className="card-section-title" style={{ marginTop: 16 }}>📍 Drop-off</h3>
                    <LocationPicker lat={drop.lat} lng={drop.lng} label={drop.label} height={170}
                      placeholder="Buyer / market drop-off point…"
                      onChange={v => setDrop({ lat: v.lat, lng: v.lng, label: v.label ?? drop.label })}
                      onLabelChange={l => setDrop(p => ({ ...p, label: l }))} />
                    <label className="dl-field" style={{ marginTop: 14 }}>Load weight (kg)
                      <input className="input" type="number" min="1" step="any" value={lWeight} onChange={e => setLWeight(e.target.value)} />
                    </label>
                    {drop.lat != null && <div className="dl-localdist">Distance ≈ <b>{localDist.toFixed(1)} km</b> · pin to pin</div>}
                  </div>

                  <div className="card">
                    <h3 className="card-section-title">Choose a courier</h3>
                    {drop.lat == null ? (
                      <div className="dl-empty">Drop a pickup and drop-off pin to see available couriers.</div>
                    ) : availableCouriers.length === 0 ? (
                      <div className="dl-empty">No courier can carry {lWeightNum.toLocaleString()} kg. Reduce the load or use export freight.</div>
                    ) : availableCouriers.map(c => {
                      const q = courierQuote(c);
                      return (
                        <button key={c.id} className={`dl-courier ${selCourier === c.id ? 'active' : ''}`} onClick={() => setSelCourier(c.id)}>
                          <span className="dl-c-emoji">{c.emoji}</span>
                          <span className="dl-c-main">
                            <b>{c.vehicle}</b>
                            <i>{c.name} · ★ {c.rating.toFixed(1)} · up to {c.kgMax.toLocaleString()} kg</i>
                          </span>
                          <span className="dl-c-quote"><b>{format(q.price)}</b><i>{q.etaMin} min</i></span>
                        </button>
                      );
                    })}
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                      disabled={!selCourier || drop.lat == null} onClick={assign}>
                      🚀 Request pickup &amp; assign courier
                    </button>
                  </div>
                </>
              ) : (
                <div className="card dl-assigned">
                  <div className="dl-a-head">
                    <span className="dl-c-emoji big">{assignment.emoji}</span>
                    <div>
                      <b>{assignment.name}</b>
                      <i>{assignment.vehicle} · ★ {assignment.rating.toFixed(1)}</i>
                    </div>
                    <span className="dl-a-price">{format(assignment.price)}</span>
                  </div>

                  <div className="dl-a-route">
                    <div><span className="dot green" /> {assignment.pickup}</div>
                    <div><span className="dot amber" /> {assignment.drop}</div>
                  </div>

                  <div className="dl-metrics">
                    <div><span className="dl-m-l">Distance</span><span className="dl-m-v">{assignment.distance.toFixed(1)} km</span></div>
                    <div><span className="dl-m-l">ETA</span><span className="dl-m-v">{assignment.etaMin} min</span></div>
                  </div>

                  <div className="dl-steps">
                    {STEPS.map((s, i) => (
                      <div key={s} className={`dl-step ${i < assignment.step ? 'done' : ''} ${i === assignment.step ? 'active' : ''}`}>
                        <span className="dl-step-dot">{i < assignment.step ? '✓' : i + 1}</span>
                        <span className="dl-step-label">{s}</span>
                      </div>
                    ))}
                  </div>

                  {assignment.step >= STEPS.length - 1
                    ? <div className="alert alert-success" style={{ marginTop: 6 }}>✅ Delivered! Your produce reached {assignment.drop}.</div>
                    : <p className="dl-disclaimer">Live status updates automatically. {assignment.name} has been notified.</p>}
                  <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={cancelAssignment}>
                    {assignment.step >= STEPS.length - 1 ? 'Book another delivery' : 'Cancel delivery'}
                  </button>
                </div>
              )}
            </div>
            <div className="dl-map-wrap"><LeafletMap markers={localMarkers} route={lRoute ?? undefined} height="100%" zoom={12} /></div>
          </div>
        )}

        <div className="dl-cta">
          Ready to buy or sell a consignment? <Link to="/market">Go to the commodity exchange →</Link>
        </div>
      </div>
    </div>
  );
}
