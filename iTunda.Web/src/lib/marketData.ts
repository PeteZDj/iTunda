import { getCommodities } from '../services/api';
import type { CommodityDto, PriceHistory } from '../types';
import { seededRand } from './trading';
import { demoHarvests } from './demoHarvests';
import { FALLBACK_RATES } from './currency';

const tomatoBenchmarks = demoHarvests.filter(lot => lot.category === 'Tomatoes' && lot.currency === 'KES')
  .map(lot => lot.priceReference.price).sort((a, b) => a - b);
const tomatoAnchor = tomatoBenchmarks[Math.floor(tomatoBenchmarks.length / 2)];

// The simulator stores quotes in KES. For each category, use the first sourced
// benchmark convertible at the demo FX rates, and keep lot prices in their own currencies.
const sampleByCategory = new Map<string, CommodityDto>();
for (const { category, unit, currency, priceReference } of demoHarvests) {
  if (sampleByCategory.has(category) || !FALLBACK_RATES[currency]) continue;
  const avgPrice = category === 'Tomatoes' ? tomatoAnchor : priceReference.price / FALLBACK_RATES[currency];
  const changePct = (seededRand(category) - .5) * 6;
  sampleByCategory.set(category, {
    category, avgPrice, changePct, unit, iconUrl: '', listings: 0,
    bid: avgPrice * 0.99825, ask: avgPrice * 1.00175, low: avgPrice * 0.96, high: avgPrice * 1.04,
  });
}
const sampleCommodities = [...sampleByCategory.values()].sort((a, b) => a.category.localeCompare(b.category));

export async function getMarketOverview() {
  const commodities = await getCommodities().catch(() => []);
  const listed = new Set(commodities.map(commodity => commodity.category));
  const demos = sampleCommodities.filter(commodity => !listed.has(commodity.category));
  return {
    commodities: [...commodities, ...demos],
    sampleCategories: new Set(demos.map(commodity => commodity.category)),
  };
}

export function sampleHistory(commodity: CommodityDto, range: string, now = new Date()): PriceHistory {
  const { category, unit, avgPrice: current, changePct } = commodity;
  const count = range === '1W' ? 7 : range === '1Y' ? 12 : 30;
  const step = range === '1Y' ? 30 : 1;
  const volatility = 0.032;
  const trend = (changePct >= 0 ? 1 : -1) * 0.001;
  const points: PriceHistory['points'] = [];
  let price = current;

  // All chart ranges sample the same daily series, anchored at the reference price.
  for (let offset = 0; offset <= (count - 1) * step; offset++) {
    if (offset % step === 0) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
      points.push({ date: date.toISOString(), price: Number(price.toFixed(2)) });
    }
    const shock = 2 * seededRand(`${category}-${offset}`) - 1;
    price = Math.max(current * 0.45, price * (1 + shock * volatility - trend));
  }
  points.reverse();
  const prices = points.map(point => point.price);
  return {
    category, unit, range, current, points,
    avg: prices.reduce((sum, value) => sum + value, 0) / count,
    low: Math.min(...prices), high: Math.max(...prices), changePct: (current / prices[0] - 1) * 100,
  };
}
