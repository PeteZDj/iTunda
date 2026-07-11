// Paper-trading engine primitives for the iTunda commodity terminal.
// Everything is quoted in KES internally; the UI converts for display.

import type { CommodityDto } from '../types';

export type Side = 'Buy' | 'Sell';
export type CloseReason = 'manual' | 'sl' | 'tp';

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  volume: number;      // units (e.g. kg)
  openPrice: number;   // KES
  sl: number | null;   // KES
  tp: number | null;   // KES
  openedAt: number;    // epoch ms
}

export interface ClosedPosition extends Position {
  closePrice: number;
  closedAt: number;
  pl: number;          // realised KES
  reason: CloseReason;
}

export interface Quote {
  symbol: string;
  price: number;       // mid, KES
  bid: number;
  ask: number;
  prevPrice: number;
  base: number;        // session anchor (server avg)
  spread: number;
  digits: number;
  changePct: number;   // vs base
}

export type LogKind = 'info' | 'success' | 'warn' | 'danger';
export interface LogEntry { id: string; at: number; kind: LogKind; text: string; }

export interface PaperState {
  balance: number;
  positions: Position[];
  history: ClosedPosition[];
  journal: LogEntry[];
}

export const START_BALANCE_KES = 1_000_000;
export const LEVERAGE = 20;
const STORE_KEY = 'itunda_paper_v1';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function digitsFor(price: number): number {
  if (price >= 2000) return 2;
  if (price >= 100) return 2;
  if (price >= 10) return 2;
  return 3;
}

/** Plain KES formatter for the journal (currency-agnostic log line). */
export function kfmt(kes: number): string {
  const sign = kes < 0 ? '-' : '';
  return `${sign}KSh${Math.abs(Math.round(kes)).toLocaleString('en-US')}`;
}

export function makeQuote(c: CommodityDto): Quote {
  const base = c.avgPrice;
  const spread = c.ask > c.bid ? c.ask - c.bid : Math.max(base * 0.0035, 0.02);
  return {
    symbol: c.category,
    price: base,
    bid: c.bid || base - spread / 2,
    ask: c.ask || base + spread / 2,
    prevPrice: base,
    base,
    spread,
    digits: digitsFor(base),
    changePct: 0,
  };
}

/** Advance a quote by one tick (bounded, mildly mean-reverting random walk). */
export function tickQuote(q: Quote): Quote {
  const revert = ((q.base - q.price) / q.base) * 0.02;
  const drift = (Math.random() * 2 - 1) * 0.0022 + revert;
  let price = q.price * (1 + drift);
  price = Math.min(Math.max(price, q.base * 0.6), q.base * 1.6);
  return {
    ...q,
    prevPrice: q.price,
    price,
    bid: price - q.spread / 2,
    ask: price + q.spread / 2,
    changePct: ((price - q.base) / q.base) * 100,
  };
}

/** The price a position would close at right now. */
export function closePriceOf(p: Position, q: Quote): number {
  return p.side === 'Buy' ? q.bid : q.ask;
}

export function plOf(p: Position, closePrice: number): number {
  return p.side === 'Buy'
    ? (closePrice - p.openPrice) * p.volume
    : (p.openPrice - closePrice) * p.volume;
}

export function livePl(p: Position, q: Quote): number {
  return plOf(p, closePriceOf(p, q));
}

/** Returns close info if a stop-loss / take-profit is triggered, else null. */
export function evalStop(p: Position, q: Quote): { closePrice: number; reason: CloseReason } | null {
  if (p.side === 'Buy') {
    if (p.sl != null && q.bid <= p.sl) return { closePrice: p.sl, reason: 'sl' };
    if (p.tp != null && q.bid >= p.tp) return { closePrice: p.tp, reason: 'tp' };
  } else {
    if (p.sl != null && q.ask >= p.sl) return { closePrice: p.sl, reason: 'sl' };
    if (p.tp != null && q.ask <= p.tp) return { closePrice: p.tp, reason: 'tp' };
  }
  return null;
}

export function marginOf(p: Position): number {
  return (p.openPrice * p.volume) / LEVERAGE;
}

export function loadPaper(): PaperState {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      balance: typeof d.balance === 'number' ? d.balance : START_BALANCE_KES,
      positions: Array.isArray(d.positions) ? d.positions : [],
      history: Array.isArray(d.history) ? d.history : [],
      journal: Array.isArray(d.journal) ? d.journal : [],
    };
  } catch {
    return { balance: START_BALANCE_KES, positions: [], history: [], journal: [] };
  }
}

export function savePaper(s: PaperState): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      balance: s.balance,
      positions: s.positions,
      history: s.history.slice(0, 60),
      journal: s.journal.slice(0, 50),
    }));
  } catch { /* ignore quota */ }
}

/** Deterministic pseudo-random in [0,1) from a string seed. */
export function seededRand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // xorshift a couple of rounds
  h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
  return ((h >>> 0) % 100000) / 100000;
}

/** Cheap sparkline series for a commodity (no extra API call). */
export function sparkFor(symbol: string, base: number, changePct: number, n = 26): number[] {
  const out: number[] = [];
  let p = base * (1 - changePct / 100 * 0.8);
  for (let i = 0; i < n; i++) {
    const r = seededRand(`${symbol}-${i}`) * 2 - 1;
    const trend = (changePct / 100) * (i / n) * base * 0.02;
    p = Math.max(base * 0.5, p + r * base * 0.012 + trend);
    out.push(p);
  }
  out[out.length - 1] = base; // end at the anchor
  return out;
}
