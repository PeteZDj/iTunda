import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchRates, formatMoney, convertFromKes, FALLBACK_RATES, currencyDef } from '../lib/currency';

interface CurrencyCtx {
  currency: string;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  /** Format a KES amount into the active currency (e.g. "$0.85"). */
  format: (amountKes: number, opts?: { withCode?: boolean }) => string;
  convert: (amountKes: number) => number;
  symbol: string;
}

const Ctx = createContext<CurrencyCtx | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => localStorage.getItem('itunda_ccy') || 'KES');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  useEffect(() => { fetchRates().then(setRates).catch(() => {}); }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem('itunda_ccy', code);
  }, []);

  const format = useCallback(
    (amountKes: number, opts?: { withCode?: boolean }) => formatMoney(amountKes, currency, rates, opts),
    [currency, rates],
  );
  const convert = useCallback((amountKes: number) => convertFromKes(amountKes, currency, rates), [currency, rates]);

  return (
    <Ctx.Provider value={{ currency, setCurrency, rates, format, convert, symbol: currencyDef(currency).symbol }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
