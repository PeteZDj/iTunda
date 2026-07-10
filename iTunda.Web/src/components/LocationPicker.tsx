import { useEffect, useRef, useState } from 'react';
import './LocationPicker.css';

interface Suggestion { label: string; lat: number; lng: number; }

interface Props {
  lat: number | null;
  lng: number | null;
  label?: string;
  onChange: (v: { lat: number; lng: number; label?: string }) => void;
  onLabelChange?: (label: string) => void;
  height?: number;
  defaultCenter?: [number, number];
  placeholder?: string;
}

// Keyless geocoding via OpenStreetMap Nominatim (same tiles the maps already use).
async function search(q: string): Promise<Suggestion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=0&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(6000) });
  const data = await res.json();
  return (data as any[]).map(d => ({ label: d.display_name as string, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
}

async function reverse(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    return (data?.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function LocationPicker({
  lat, lng, label = '', onChange, onLabelChange,
  height = 260, defaultCenter = [-1.286389, 36.817223], placeholder = 'Search a place or address…',
}: Props) {
  const [query, setQuery] = useState(label);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);

  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(label); }, [label]);

  const commit = (la: number, ln: number, lbl?: string) => {
    onChange({ lat: la, lng: ln, label: lbl });
    if (lbl !== undefined) { setQuery(lbl); onLabelChange?.(lbl); }
  };

  // Initialise the interactive map once.
  useEffect(() => {
    const L = window.L;
    const el = elRef.current;
    if (!L || !el || mapRef.current) return;

    const start: [number, number] = lat != null && lng != null ? [lat, lng] : defaultCenter;
    const map = L.map(el, { scrollWheelZoom: false }).setView(start, lat != null ? 12 : 5);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const icon = L.divIcon({
      className: 'lf-pin-wrap',
      html: `<div class="lf-pin" style="--pin:#0e7a3e"><span>📍</span></div>`,
      iconSize: [30, 42], iconAnchor: [15, 40],
    });

    const marker = L.marker(start, { draggable: true, icon }).addTo(map);
    markerRef.current = marker;
    if (lat == null) marker.setOpacity(0);

    marker.on('dragend', async () => {
      const p = marker.getLatLng();
      marker.setOpacity(1);
      const lbl = await reverse(p.lat, p.lng);
      commit(p.lat, p.lng, lbl);
    });

    map.on('click', async (e: any) => {
      marker.setLatLng(e.latlng);
      marker.setOpacity(1);
      const lbl = await reverse(e.latlng.lat, e.latlng.lng);
      commit(e.latlng.lat, e.latlng.lng, lbl);
    });

    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync when lat/lng change from search / geolocation.
  useEffect(() => {
    const map = mapRef.current, marker = markerRef.current;
    if (!map || !marker || lat == null || lng == null) return;
    marker.setLatLng([lat, lng]);
    marker.setOpacity(1);
    map.setView([lat, lng], Math.max(map.getZoom(), 12));
  }, [lat, lng]);

  const onType = (v: string) => {
    setQuery(v);
    onLabelChange?.(v);
    if (debRef.current) clearTimeout(debRef.current);
    if (v.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    debRef.current = setTimeout(async () => {
      setBusy(true);
      try { const s = await search(v); setSuggestions(s); setOpen(true); }
      catch { setSuggestions([]); }
      finally { setBusy(false); }
    }, 350);
  };

  const pick = (s: Suggestion) => { setOpen(false); commit(s.lat, s.lng, s.label); };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        const lbl = await reverse(latitude, longitude);
        commit(latitude, longitude, lbl);
        setGeoBusy(false);
      },
      () => setGeoBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="locpick">
      <div className="locpick-search">
        <div className="locpick-input-wrap">
          <span className="locpick-ico">🔍</span>
          <input
            className="input"
            value={query}
            placeholder={placeholder}
            onChange={e => onType(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 180)}
          />
          {busy && <span className="locpick-spin" />}
          {open && suggestions.length > 0 && (
            <ul className="locpick-list">
              {suggestions.map((s, i) => (
                <li key={i} onMouseDown={() => pick(s)}>{s.label}</li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="btn btn-outline btn-sm locpick-geo" onClick={useMyLocation} disabled={geoBusy}>
          {geoBusy ? '…' : '📍 Use my location'}
        </button>
      </div>

      <div ref={elRef} className="locpick-map" style={{ height }} />
      <p className="locpick-hint">
        {lat != null && lng != null
          ? <>Pin dropped at <strong>{lat.toFixed(4)}, {lng.toFixed(4)}</strong> — drag it or click the map to adjust.</>
          : <>Search an address, click the map or drop a pin to set the exact location.</>}
      </p>
    </div>
  );
}
