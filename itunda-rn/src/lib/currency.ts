// Currency handling — all prices are stored in KES (like the API/DB).
// Live rates from open.er-api.com (KES base), cached, with static fallbacks.

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string; // ISO2 for flagcdn
}

export const CURRENCIES: Currency[] = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: 'ke' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: 'us' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: 'eu' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: 'gb' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: 'za' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: 'ae' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: 'in' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: 'cn' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: 'ng' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: 'br' },
];

// Per 1 KES
export const FALLBACK_RATES: Record<string, number> = {
  KES: 1,
  USD: 0.0077,
  EUR: 0.0071,
  GBP: 0.0061,
  ZAR: 0.14,
  AED: 0.028,
  INR: 0.64,
  CNY: 0.056,
  NGN: 11.8,
  BRL: 0.042,
};

export function currencyByCode(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export async function fetchRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/KES');
    const json = await res.json();
    if (json?.rates && typeof json.rates === 'object') {
      return { ...FALLBACK_RATES, ...json.rates, KES: 1 };
    }
  } catch {}
  return FALLBACK_RATES;
}

export function convert(amountKes: number, code: string, rates: Record<string, number>): number {
  const rate = rates[code] ?? FALLBACK_RATES[code] ?? 1;
  return (Number(amountKes) || 0) * rate;
}

export function formatMoney(amountKes: number, code: string, rates: Record<string, number>): string {
  const cur = currencyByCode(code);
  const v = convert(amountKes, code, rates);
  const decimals = v >= 1000 || Number.isInteger(v) ? 0 : v < 1 ? 3 : 2;
  const num = v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return cur.symbol === '$' || cur.symbol.length > 1 ? `${cur.symbol}${num}` : `${cur.symbol}${num}`;
}

export function flagUrl(iso2: string, size: '20x15' | '24x18' | '40x30' | '80x60' = '40x30'): string {
  return `https://flagcdn.com/${size}/${(iso2 || 'ke').toLowerCase()}.png`;
}
