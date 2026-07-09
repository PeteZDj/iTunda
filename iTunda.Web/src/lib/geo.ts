// Flag + zone helpers shared across the app.

export function flagUrl(code: string | null | undefined, size: '20x15' | '24x18' | '40x30' = '24x18'): string {
  const c = (code || 'un').toLowerCase();
  return `https://flagcdn.com/${size}/${c}.png`;
}

export const ZONES: { zone: number; name: string; blurb: string }[] = [
  { zone: 1, name: 'Zone 1 · East Africa', blurb: 'Kenya · Uganda · Ethiopia · Tanzania' },
  { zone: 2, name: 'Zone 2 · Southern Africa', blurb: 'South Africa' },
  { zone: 3, name: 'Zone 3 · Americas', blurb: 'Mexico · Chile · Peru · Colombia · Brazil' },
  { zone: 4, name: 'Zone 4 · Global', blurb: 'India · Spain · Emerging origins' },
];

export function zoneName(zone: number): string {
  return ZONES.find(z => z.zone === zone)?.name ?? `Zone ${zone}`;
}

// Detect the visitor's country once (best-effort, cached in localStorage).
export interface VisitorGeo { countryCode: string; countryName: string; lat: number; lng: number; }

let cached: VisitorGeo | null = null;

export async function detectVisitor(): Promise<VisitorGeo> {
  if (cached) return cached;
  const stored = localStorage.getItem('itunda_geo');
  if (stored) {
    try { cached = JSON.parse(stored); return cached!; } catch { /* ignore */ }
  }
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4500) });
    const d = await res.json();
    cached = {
      countryCode: (d.country_code || 'KE').toUpperCase(),
      countryName: d.country_name || 'Kenya',
      lat: d.latitude ?? -1.286389,
      lng: d.longitude ?? 36.817223,
    };
  } catch {
    cached = { countryCode: 'KE', countryName: 'Kenya', lat: -1.286389, lng: 36.817223 };
  }
  localStorage.setItem('itunda_geo', JSON.stringify(cached));
  return cached!;
}
