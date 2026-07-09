import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getRegions } from '../services/api';
import { detectVisitor, type VisitorGeo } from '../lib/geo';
import type { RegionDto } from '../types';

interface RegionCtx {
  regions: RegionDto[];
  loading: boolean;
  zone: number | null;
  region: string | null;
  setZone: (z: number | null) => void;
  setRegion: (name: string | null) => void;
  clear: () => void;
  visitor: VisitorGeo | null;
}

const Ctx = createContext<RegionCtx | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [regions, setRegions] = useState<RegionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZoneState] = useState<number | null>(() => {
    const v = localStorage.getItem('itunda_zone');
    return v ? Number(v) : null;
  });
  const [region, setRegionState] = useState<string | null>(() => localStorage.getItem('itunda_region'));
  const [visitor, setVisitor] = useState<VisitorGeo | null>(null);

  useEffect(() => {
    getRegions().then(setRegions).catch(() => {}).finally(() => setLoading(false));
    detectVisitor().then(setVisitor).catch(() => {});
  }, []);

  const setZone = useCallback((z: number | null) => {
    setZoneState(z);
    setRegionState(null);
    localStorage.removeItem('itunda_region');
    if (z == null) localStorage.removeItem('itunda_zone');
    else localStorage.setItem('itunda_zone', String(z));
  }, []);

  const setRegion = useCallback((name: string | null) => {
    setRegionState(name);
    setZoneState(null);
    localStorage.removeItem('itunda_zone');
    if (name == null) localStorage.removeItem('itunda_region');
    else localStorage.setItem('itunda_region', name);
  }, []);

  const clear = useCallback(() => {
    setZoneState(null);
    setRegionState(null);
    localStorage.removeItem('itunda_zone');
    localStorage.removeItem('itunda_region');
  }, []);

  return (
    <Ctx.Provider value={{ regions, loading, zone, region, setZone, setRegion, clear, visitor }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRegion must be used within RegionProvider');
  return ctx;
}
