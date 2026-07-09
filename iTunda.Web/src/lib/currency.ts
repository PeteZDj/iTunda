// Multi-currency support. All prices in the app are stored/quoted in KES;
// this module converts + formats them into the visitor's chosen currency.
// Rates are fetched live (base = KES) with a static fallback so the app always
// works even if the FX endpoint is unavailable.

export interface CurrencyDef {
  code: string;
  symbol: string;
  name: string;
  countryCode: string; // for flagcdn
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', countryCode: 'ke' },
  { code: 'USD', symbol: '$', name: 'US Dollar', countryCode: 'us' },
  { code: 'EUR', symbol: '€', name: 'Euro', countryCode: 'eu' },
  { code: 'GBP', symbol: '£', name: 'British Pound', countryCode: 'gb' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', countryCode: 'za' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', countryCode: 'ae' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', countryCode: 'in' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', countryCode: 'cn' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', countryCode: 'ng' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', countryCode: 'br' },
];

// Value of 1 KES in each currency (static fallback, refreshed periodically).
export const FALLBACK_RATES: Record<string, number> = {
  KES: 1, USD: 0.0077, EUR: 0.0071, GBP: 0.0061, ZAR: 0.14,
  AED: 0.028, INR: 0.64, CNY: 0.056, NGN: 11.8, BRL: 0.042,
};

export function currencyDef(code: string): CurrencyDef {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}

const RATES_KEY = 'itunda_fx';
const RATES_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function fetchRates(): Promise<Record<string, number>> {
  try {
    const cached = localStorage.getItem(RATES_KEY);
    if (cached) {
      const { at, rates } = JSON.parse(cached);
      if (Date.now() - at < RATES_TTL && rates?.USD) return { ...FALLBACK_RATES, ...rates };
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/KES', { signal: AbortSignal.timeout(5000) });
    const d = await res.json();
    if (d?.rates?.USD) {
      const rates: Record<string, number> = {};
      for (const c of CURRENCIES) if (d.rates[c.code] != null) rates[c.code] = d.rates[c.code];
      rates.KES = 1;
      localStorage.setItem(RATES_KEY, JSON.stringify({ at: Date.now(), rates }));
      return { ...FALLBACK_RATES, ...rates };
    }
  } catch { /* fall through */ }

  return { ...FALLBACK_RATES };
}

export function convertFromKes(amountKes: number, code: string, rates: Record<string, number>): number {
  return amountKes * (rates[code] ?? FALLBACK_RATES[code] ?? 1);
}

export function formatMoney(
  amountKes: number,
  code: string,
  rates: Record<string, number>,
  opts: { withCode?: boolean } = {},
): string {
  const def = currencyDef(code);
  const value = convertFromKes(amountKes, code, rates);
  const decimals = Math.abs(value) >= 100 || value === 0 ? 0 : 2;
  const num = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const symbolFirst = !['د.إ'].includes(def.symbol);
  const body = symbolFirst ? `${def.symbol}${num}` : `${num} ${def.symbol}`;
  return opts.withCode ? `${body} ${def.code}` : body;
}
