// iTunda client state — currency (with live rates), region/zone filter, a demo
// auth session, watchlist and locally-placed orders/bids. Mirrors the web app's
// localStorage contexts, persisted with AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CURRENCIES, FALLBACK_RATES, currencyByCode, fetchRates, formatMoney, convert as rawConvert } from '@/lib/currency';
import type { BuyOrder, OrderKind, OrderSide, Produce } from '@/data/types';

const KEY = 'itunda_state_v1';

export type Role = 'Buyer' | 'Farmer';

export interface ItundaUser {
  name: string;
  email: string;
  role: Role;
  provider: 'email' | 'google' | 'demo';
}

export interface MyOrder {
  id: string;
  kind: 'purchase' | 'bid';
  title: string;
  subtitle: string;
  side?: OrderSide;
  orderKind?: OrderKind;
  quantity: number;
  unit: string;
  totalKes: number;
  at: string;
}

interface Persisted {
  user: ItundaUser | null;
  currency: string;
  zone: number | null;
  region: string | null;
  watchlist: number[];
  orders: MyOrder[];
}

const initial: Persisted = {
  user: null,
  currency: 'KES',
  zone: null,
  region: null,
  watchlist: [],
  orders: [],
};

export const DEMO_ACCOUNTS = [
  { label: 'James Kamau — Farmer', email: 'james.kamau@farm.ke', role: 'Farmer' as Role },
  { label: 'Nairobi Fresh — Buyer', email: 'orders@nairobifresh.ke', role: 'Buyer' as Role },
];

interface Ctx {
  ready: boolean;
  // currency
  currency: string;
  rates: Record<string, number>;
  symbol: string;
  setCurrency: (code: string) => void;
  format: (kes: number) => string;
  convert: (kes: number) => number;
  // region
  zone: number | null;
  region: string | null;
  setZone: (z: number | null) => void;
  setRegion: (r: string | null) => void;
  clearRegion: () => void;
  // auth
  user: ItundaUser | null;
  signIn: (name: string, email: string, role: Role, provider?: ItundaUser['provider']) => void;
  signOut: () => void;
  // watchlist
  watchlist: number[];
  toggleWatch: (id: number) => void;
  isWatched: (id: number) => boolean;
  // orders
  orders: MyOrder[];
  placeOrder: (o: Omit<MyOrder, 'id' | 'at'>) => MyOrder;
}

const AppCtx = createContext<Ctx | null>(null);

export function ItundaProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Persisted>(initial);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setS({ ...initial, ...JSON.parse(raw) });
      } catch {}
      hydrated.current = true;
      setReady(true);
      const r = await fetchRates();
      setRates(r);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
  }, [s]);

  const symbol = currencyByCode(s.currency).symbol;

  const format = useCallback((kes: number) => formatMoney(kes, s.currency, rates), [s.currency, rates]);
  const convert = useCallback((kes: number) => rawConvert(kes, s.currency, rates), [s.currency, rates]);

  const placeOrder = useCallback((o: Omit<MyOrder, 'id' | 'at'>): MyOrder => {
    const order: MyOrder = { ...o, id: `IT-${Date.now().toString(36).toUpperCase()}`, at: new Date().toISOString() };
    setS((p) => ({ ...p, orders: [order, ...p.orders].slice(0, 100) }));
    return order;
  }, []);

  const api: Ctx = useMemo(
    () => ({
      ready,
      currency: s.currency,
      rates,
      symbol,
      setCurrency: (code) => setS((p) => ({ ...p, currency: code })),
      format,
      convert,
      zone: s.zone,
      region: s.region,
      setZone: (z) => setS((p) => ({ ...p, zone: z, region: null })),
      setRegion: (r) => setS((p) => ({ ...p, region: r, zone: null })),
      clearRegion: () => setS((p) => ({ ...p, zone: null, region: null })),
      user: s.user,
      signIn: (name, email, role, provider = 'email') => setS((p) => ({ ...p, user: { name, email, role, provider } })),
      signOut: () => setS((p) => ({ ...p, user: null })),
      watchlist: s.watchlist,
      toggleWatch: (id) => setS((p) => ({ ...p, watchlist: p.watchlist.includes(id) ? p.watchlist.filter((x) => x !== id) : [...p.watchlist, id] })),
      isWatched: (id) => s.watchlist.includes(id),
      orders: s.orders,
      placeOrder,
    }),
    [ready, s, rates, symbol, format, convert, placeOrder],
  );

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within ItundaProvider');
  return ctx;
}

export { CURRENCIES };
export type { Produce, BuyOrder };
