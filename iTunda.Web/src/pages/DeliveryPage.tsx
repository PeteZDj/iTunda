import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { estimateDelivery } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { useCurrency } from '../context/CurrencyContext';
import { flagUrl } from '../lib/geo';
import LeafletMap, { type MapMarker } from '../components/LeafletMap';
import type { DeliveryEstimateResponse } from '../types';
import './DeliveryPage.css';

interface Loc { id: string; label: string; sub: string; lat: number; lng: number; cc: string; }

// Import / market hubs available as delivery destinations.
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

export default function DeliveryPage() {
  const { regions } = useRegion();
  const { format, currency } = useCurrency();

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

  // Default the origin to the first region once regions load.
  useEffect(() => {
    if (!originId && regions.length) setOriginId(`r:${regions[0].name}`);
  }, [regions, originId]);

  const origin = locations.find(l => l.id === originId) ?? null;
  const dest = locations.find(l => l.id === destId) ?? null;

  const run = async () => {
    if (!origin || !dest) return;
    setLoading(true); setError(''); setResult(null); setRoute(null);
    try {
      const res = await estimateDelivery({
        originLat: origin.lat, originLng: origin.lng,
        destLat: dest.lat, destLng: dest.lng,
        originLabel: origin.label, destLabel: dest.label,
        weightKg: parseFloat(weight) || undefined,
      });
      setResult(res);

      // Draw a real driving route for short hauls, else a dashed freight line.
      if (res.distanceKm <= 1500) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
          const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
          const data = await r.json();
          const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
          if (coords && coords.length) {
            setRoute(coords.map(([lng, lat]) => [lat, lng]));
            setRouteDashed(false);
          } else { throw new Error('no route'); }
        } catch {
          setRoute([[origin.lat, origin.lng], [dest.lat, dest.lng]]);
          setRouteDashed(true);
        }
      } else {
        setRoute([[origin.lat, origin.lng], [dest.lat, dest.lng]]);
        setRouteDashed(true);
      }
    } catch {
      setError('Could not estimate delivery. Please try again.');
    } finally { setLoading(false); }
  };

  // Auto-run when both endpoints are known (first load).
  useEffect(() => {
    if (origin && dest && !result && !loading) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.id, dest?.id]);

  const markers: MapMarker[] = [];
  if (origin) markers.push({ lat: origin.lat, lng: origin.lng, title: origin.label, subtitle: `Origin · ${origin.sub}`, color: '#0e7a3e', emoji: '🌱' });
  if (dest) markers.push({ lat: dest.lat, lng: dest.lng, title: dest.label, subtitle: `Destination · ${dest.sub}`, color: '#f4a621', emoji: '🏁' });

  return (
    <div className="delivery-page">
      <div className="dl-hero">
        <div className="page-container">
          <h1 className="dl-title">Delivery Routes &amp; Price Estimator</h1>
          <p className="dl-sub">
            Check the route, transit time and an estimated freight price between any growing region and market hub —
            no account or login required.
          </p>
        </div>
      </div>

      <div className="page-container dl-body">
        <div className="dl-grid">
          {/* Controls + result */}
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
                  <div className="dl-endpoint">
                    {origin && <img className="pc-flag" src={flagUrl(origin.cc)} alt="" />}
                    <span>{result.originLabel}</span>
                  </div>
                  <span className="dl-arrow">→</span>
                  <div className="dl-endpoint">
                    {dest && <img className="pc-flag" src={flagUrl(dest.cc)} alt="" />}
                    <span>{result.destLabel}</span>
                  </div>
                </div>

                <div className="dl-price">
                  <span className="dl-price-big">{format(result.priceKes)}</span>
                  <span className="dl-price-usd">
                    {currency === 'KES' ? `≈ US$ ${result.priceUsd.toLocaleString()}` : `≈ KES ${result.priceKes.toLocaleString()}`}
                  </span>
                </div>
                <div className="dl-mode">{result.mode}</div>

                <div className="dl-metrics">
                  <div><span className="dl-m-l">Distance</span><span className="dl-m-v">{result.distanceKm.toLocaleString()} km</span></div>
                  <div><span className="dl-m-l">Transit</span><span className="dl-m-v">{result.etaHours} h</span></div>
                  <div><span className="dl-m-l">Base fee</span><span className="dl-m-v">{format(result.baseFee)}</span></div>
                  <div><span className="dl-m-l">Per km</span><span className="dl-m-v">{format(result.perKm)}</span></div>
                </div>

                <a href={result.googleMapsUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  🗺 Open directions in Google Maps
                </a>
                <p className="dl-disclaimer">Indicative estimate for planning. Final freight quoted on booking.</p>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="dl-map-wrap">
            <LeafletMap markers={markers} route={route ?? undefined} routeDashed={routeDashed} height="100%" zoom={5} />
          </div>
        </div>

        <div className="dl-cta">
          Ready to buy or sell a consignment? <Link to="/market">Go to the commodity exchange →</Link>
        </div>
      </div>
    </div>
  );
}
