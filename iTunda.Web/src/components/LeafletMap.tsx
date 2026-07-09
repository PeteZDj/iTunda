import { useEffect, useRef } from 'react';
import './LeafletMap.css';

declare global {
  interface Window { L?: any; }
}

export interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  color?: string;   // pin colour
  emoji?: string;   // optional glyph inside the pin
  href?: string;    // optional link opened when the popup button is clicked
}

interface Props {
  markers: MapMarker[];
  route?: [number, number][];      // optional polyline (lat,lng pairs)
  routeDashed?: boolean;
  height?: number | string;
  zoom?: number;
  center?: [number, number];
  fitToMarkers?: boolean;
  className?: string;
}

function pinIcon(L: any, color = '#0e7a3e', emoji = '') {
  return L.divIcon({
    className: 'lf-pin-wrap',
    html: `<div class="lf-pin" style="--pin:${color}"><span>${emoji}</span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
  });
}

export default function LeafletMap({
  markers, route, routeDashed, height = 320, zoom = 6, center,
  fitToMarkers = true, className,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const L = window.L;
    const el = elRef.current;
    if (!L || !el) return;

    const first = markers[0];
    const startCenter: [number, number] = center ?? (first ? [first.lat, first.lng] : [0, 20]);

    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true }).setView(startCenter, zoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const layers: any[] = [];
    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(L, m.color, m.emoji) }).addTo(map);
      if (m.title || m.subtitle) {
        const btn = m.href
          ? `<a href="${m.href}" target="_blank" rel="noreferrer" class="lf-popup-btn">Open in Google Maps ↗</a>`
          : '';
        marker.bindPopup(
          `<div class="lf-popup"><strong>${m.title ?? ''}</strong>${m.subtitle ? `<div>${m.subtitle}</div>` : ''}${btn}</div>`
        );
      }
      layers.push(marker);
    }

    if (route && route.length > 1) {
      const line = L.polyline(route, {
        color: '#f4a621', weight: 4, opacity: 0.9,
        dashArray: routeDashed ? '8 8' : undefined,
      }).addTo(map);
      layers.push(line);
    }

    if (fitToMarkers && (markers.length > 1 || (route && route.length > 1))) {
      const group = L.featureGroup(layers);
      try { map.fitBounds(group.getBounds().pad(0.25)); } catch { /* single point */ }
    }

    // Leaflet sometimes needs a nudge if the container sized after mount.
    setTimeout(() => map.invalidateSize(), 120);

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), JSON.stringify(route), zoom, routeDashed]);

  return <div ref={elRef} className={`lf-map ${className ?? ''}`} style={{ height }} />;
}
