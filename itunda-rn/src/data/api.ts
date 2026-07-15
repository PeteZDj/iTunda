// iTunda API client. Talks to the live backend at itunda.org, with a graceful
// fallback to the bundled offline dataset so the app is never blank.

import { fallbackDataset } from './seed';
import type { BuyOrder, Commodity, Farmer, Produce, Region } from './types';

export const API_BASE = 'https://itunda.org/api';

async function get<T>(path: string, timeoutMs = 7000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}${path}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface ProduceFilter {
  q?: string;
  category?: string;
  region?: string;
  country?: string;
  zone?: number;
  exportReady?: boolean;
  limit?: number;
}

function filterProduce(items: Produce[], f: ProduceFilter): Produce[] {
  let out = items.filter((p) => !p.isDraft);
  if (f.category) out = out.filter((p) => p.category === f.category);
  if (f.region) out = out.filter((p) => p.region === f.region);
  if (f.country) out = out.filter((p) => p.country === f.country);
  if (f.zone) out = out.filter((p) => p.zone === f.zone);
  if (f.exportReady) out = out.filter((p) => p.isExportReady);
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.farmName.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q),
    );
  }
  if (f.limit) out = out.slice(0, f.limit);
  return out;
}

export async function fetchCommodities(): Promise<Commodity[]> {
  const live = await get<Commodity[]>('/commodities');
  if (live && live.length) return live;
  return fallbackDataset().commodities;
}

export async function fetchProduce(f: ProduceFilter = {}): Promise<Produce[]> {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.category) params.set('category', f.category);
  if (f.region) params.set('region', f.region);
  if (f.country) params.set('country', f.country);
  if (f.zone) params.set('zone', String(f.zone));
  if (f.exportReady) params.set('exportReady', 'true');
  params.set('limit', String(f.limit ?? 300));
  const qs = params.toString();
  const live = await get<Produce[]>(`/produce?${qs}`);
  if (live && live.length) return live;
  return filterProduce(fallbackDataset().produce, f);
}

export async function fetchProduceById(id: number): Promise<Produce | null> {
  const live = await get<Produce>(`/produce/${id}`);
  if (live) return live;
  return fallbackDataset().produce.find((p) => p.id === id) ?? null;
}

export async function fetchRegions(): Promise<Region[]> {
  const live = await get<Region[]>('/regions');
  if (live && live.length) return live;
  return fallbackDataset().regions;
}

export interface BuyOrderFilter {
  commodity?: string;
  zone?: number;
  country?: string;
  side?: string;
  kind?: string;
}

export async function fetchBuyOrders(f: BuyOrderFilter = {}): Promise<BuyOrder[]> {
  const params = new URLSearchParams();
  if (f.commodity) params.set('commodity', f.commodity);
  if (f.zone) params.set('zone', String(f.zone));
  if (f.country) params.set('country', f.country);
  if (f.side) params.set('side', f.side);
  if (f.kind) params.set('kind', f.kind);
  const qs = params.toString();
  const live = await get<BuyOrder[]>(`/buyorders${qs ? `?${qs}` : ''}`);
  if (live && live.length) return live;
  let out = fallbackDataset().buyOrders;
  if (f.commodity) out = out.filter((o) => o.commodity === f.commodity);
  if (f.zone) out = out.filter((o) => o.zone === f.zone);
  if (f.side) out = out.filter((o) => o.side === f.side);
  if (f.kind) out = out.filter((o) => o.kind === f.kind);
  return out;
}

export async function fetchFarmers(): Promise<Farmer[]> {
  const live = await get<Farmer[]>('/farmers');
  if (live && live.length) return live;
  return fallbackDataset().farmers;
}

export async function fetchFarmer(key: string): Promise<Farmer | null> {
  const live = await get<Farmer>(`/farmers/${key}`);
  if (live) return live;
  const fs = fallbackDataset().farmers;
  return fs.find((x) => x.username === key || String(x.id) === key) ?? null;
}

export async function fetchFarmerProduce(key: string): Promise<Produce[]> {
  const live = await get<Produce[]>(`/farmers/${key}/produce`);
  if (live) return live;
  const f = await fetchFarmer(key);
  if (!f) return [];
  return fallbackDataset().produce.filter((p) => p.farmerProfileId === f.id);
}

// Delivery estimate — replicates the API's haversine + tiered pricing so it
// works offline too.
export interface DeliveryEstimate {
  distanceKm: number;
  etaHours: number;
  priceKes: number;
  priceUsd: number;
  mode: string;
}

export function estimateDelivery(
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number,
  weightKg = 500,
): DeliveryEstimate {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLatR = toRad(dLat - oLat);
  const dLngR = toRad(dLng - oLng);
  const a =
    Math.sin(dLatR / 2) ** 2 +
    Math.cos(toRad(oLat)) * Math.cos(toRad(dLat)) * Math.sin(dLngR / 2) ** 2;
  const distanceKm = Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  const wf = Math.max(1, weightKg / 500);
  let base: number, perKm: number, speed: number, handling: number, mode: string;
  if (distanceKm > 1500) {
    base = 18000; perKm = 95; speed = 650; handling = 12; mode = 'Air / sea freight';
  } else {
    base = 1500; perKm = 42; speed = 48; handling = 3; mode = 'Road transport';
  }
  const priceKes = Math.round((base + perKm * distanceKm) * wf);
  return {
    distanceKm,
    etaHours: Math.round(distanceKm / speed + handling),
    priceKes,
    priceUsd: Math.round(priceKes / 130),
    mode,
  };
}
