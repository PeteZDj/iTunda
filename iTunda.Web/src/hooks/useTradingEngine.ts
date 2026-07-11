import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommodityDto } from '../types';
import {
  type Quote, type Position, type ClosedPosition, type LogEntry, type LogKind, type Side,
  START_BALANCE_KES, LEVERAGE, uid, kfmt, makeQuote, tickQuote, closePriceOf, plOf, livePl,
  evalStop, marginOf, loadPaper, savePaper,
} from '../lib/trading';

const TICK_MS = 1300;

export interface Toast { id: string; kind: LogKind; title: string; body: string; }

export function useTradingEngine(commodities: CommodityDto[]) {
  const initial = loadPaper();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [positions, setPositions] = useState<Position[]>(initial.positions);
  const [history, setHistory] = useState<ClosedPosition[]>(initial.history);
  const [journal, setJournal] = useState<LogEntry[]>(initial.journal);
  const [balance, setBalance] = useState<number>(initial.balance);
  const [toast, setToast] = useState<Toast | null>(null);
  const [notifyOn, setNotifyOn] = useState<boolean>(
    typeof Notification !== 'undefined' && Notification.permission === 'granted');

  const quotesRef = useRef(quotes);
  const positionsRef = useRef(positions);
  quotesRef.current = quotes;
  positionsRef.current = positions;

  // Persist paper state.
  useEffect(() => { savePaper({ balance, positions, history, journal }); }, [balance, positions, history, journal]);

  const emit = useCallback((kind: LogKind, title: string, body: string) => {
    const entry: LogEntry = { id: uid(), at: Date.now(), kind, text: `${title} — ${body}` };
    setJournal(j => [entry, ...j].slice(0, 50));
    setToast({ id: entry.id, kind, title, body });
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(`iTunda · ${title}`, { body, silent: false }); } catch { /* ignore */ }
    }
  }, []);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // Seed quotes from the commodity feed.
  useEffect(() => {
    if (commodities.length === 0) return;
    setQuotes(prev => {
      const next = { ...prev };
      for (const c of commodities) if (!next[c.category]) next[c.category] = makeQuote(c);
      return next;
    });
  }, [commodities]);

  // Live tick + stop-loss / take-profit engine.
  useEffect(() => {
    const id = setInterval(() => {
      const prev = quotesRef.current;
      const keys = Object.keys(prev);
      if (keys.length === 0) return;

      const next: Record<string, Quote> = {};
      for (const k of keys) next[k] = tickQuote(prev[k]);

      // Evaluate SL/TP against the fresh quotes.
      const closedNow: { p: Position; closePrice: number; reason: 'sl' | 'tp' }[] = [];
      const stillOpen: Position[] = [];
      for (const p of positionsRef.current) {
        const q = next[p.symbol];
        const hit = q ? evalStop(p, q) : null;
        if (hit && (hit.reason === 'sl' || hit.reason === 'tp')) closedNow.push({ p, closePrice: hit.closePrice, reason: hit.reason });
        else stillOpen.push(p);
      }

      setQuotes(next);

      if (closedNow.length > 0) {
        let realized = 0;
        const newlyClosed: ClosedPosition[] = [];
        for (const { p, closePrice, reason } of closedNow) {
          const pl = plOf(p, closePrice);
          realized += pl;
          newlyClosed.push({ ...p, closePrice, closedAt: Date.now(), pl, reason });
          emit(
            reason === 'tp' ? 'success' : 'danger',
            `${reason === 'tp' ? 'Take-profit' : 'Stop-loss'} hit · ${p.symbol}`,
            `${p.side} ${p.volume} closed @ ${closePrice.toFixed(2)} · P/L ${kfmt(pl)}`,
          );
        }
        setPositions(stillOpen);
        setHistory(h => [...newlyClosed, ...h].slice(0, 60));
        setBalance(b => b + realized);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [emit]);

  const requestNotify = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setNotifyOn(perm === 'granted');
    } catch { /* ignore */ }
  }, []);

  const open = useCallback((symbol: string, side: Side, volume: number, sl: number | null, tp: number | null): string | null => {
    const q = quotesRef.current[symbol];
    if (!q) return 'No live price for this symbol yet.';
    if (!(volume > 0)) return 'Enter a valid volume.';
    const entry = side === 'Buy' ? q.ask : q.bid;
    // Basic SL/TP sanity so users can't set a stop on the wrong side.
    if (side === 'Buy') {
      if (sl != null && sl >= entry) return 'For a BUY, stop-loss must be below the entry price.';
      if (tp != null && tp <= entry) return 'For a BUY, take-profit must be above the entry price.';
    } else {
      if (sl != null && sl <= entry) return 'For a SELL, stop-loss must be above the entry price.';
      if (tp != null && tp >= entry) return 'For a SELL, take-profit must be below the entry price.';
    }
    const pos: Position = { id: uid(), symbol, side, volume, openPrice: entry, sl, tp, openedAt: Date.now() };
    setPositions(p => [pos, ...p]);
    emit('info', `${side} opened · ${symbol}`, `${volume} @ ${entry.toFixed(2)} · margin ${kfmt(marginOf(pos))}`);
    return null;
  }, [emit]);

  const close = useCallback((id: string) => {
    const p = positionsRef.current.find(x => x.id === id);
    if (!p) return;
    const q = quotesRef.current[p.symbol];
    if (!q) return;
    const cp = closePriceOf(p, q);
    const pl = plOf(p, cp);
    setPositions(list => list.filter(x => x.id !== id));
    setHistory(h => [{ ...p, closePrice: cp, closedAt: Date.now(), pl, reason: 'manual' as const }, ...h].slice(0, 60));
    setBalance(b => b + pl);
    emit(pl >= 0 ? 'success' : 'warn', `Closed ${p.side} · ${p.symbol}`, `@ ${cp.toFixed(2)} · P/L ${kfmt(pl)}`);
  }, [emit]);

  const closeAll = useCallback(() => {
    for (const p of [...positionsRef.current]) close(p.id);
  }, [close]);

  const modify = useCallback((id: string, sl: number | null, tp: number | null) => {
    setPositions(list => list.map(p => (p.id === id ? { ...p, sl, tp } : p)));
    emit('info', 'Order modified', `SL ${sl != null ? sl.toFixed(2) : '—'} · TP ${tp != null ? tp.toFixed(2) : '—'}`);
  }, [emit]);

  const resetAccount = useCallback(() => {
    setPositions([]); setHistory([]); setBalance(START_BALANCE_KES); setJournal([]);
    setToast({ id: uid(), kind: 'info', title: 'Demo account reset', body: `Balance restored to ${kfmt(START_BALANCE_KES)}` });
  }, []);

  // Derived account metrics.
  const openPl = positions.reduce((s, p) => { const q = quotes[p.symbol]; return q ? s + livePl(p, q) : s; }, 0);
  const usedMargin = positions.reduce((s, p) => s + marginOf(p), 0);
  const equity = balance + openPl;
  const freeMargin = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

  return {
    quotes, positions, history, journal,
    account: { balance, equity, openPl, usedMargin, freeMargin, marginLevel, leverage: LEVERAGE },
    toast, notifyOn, requestNotify,
    open, close, closeAll, modify, resetAccount,
  };
}
