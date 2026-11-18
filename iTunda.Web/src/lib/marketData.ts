import { getCommodities } from '../services/api';
import type { CommodityDto, PriceHistory } from '../types';
import { seededRand } from './trading';
import { demoTomatoLots } from './demoTomatoes';

const tomatoBenchmarks = demoTomatoLots.filter(lot => lot.currency === 'KES')
  .map(lot => lot.priceReference.price).sort((a, b) => a - b);
const tomatoAnchor = tomatoBenchmarks[Math.floor(tomatoBenchmarks.length / 2)];

// Illustrative KES/kg anchors for the simulator. These are independent of seller listings.
const samplePrices = [
  ['Avocados', 148, 2.4], ['Macadamia Nuts', 225, -1.2], ['French Beans', 104, 1.6],
  ['Tea', 55, -2.1], ['Passion Fruit', 127, 3.1], ['Mangoes', 94, -0.9],
  ['Bananas', 66, 1.3], ['Tomatoes', tomatoAnchor, -3.2], ['Onions', 96, 2.7], ['Maize', 50, -1.5],
] as const;

const sampleCommodities: CommodityDto[] = samplePrices.map(([category, avgPrice, changePct]) => ({
  category, avgPrice, changePct, unit: 'kg', iconUrl: '', listings: 0,
  bid: avgPrice * 0.99825, ask: avgPrice * 1.00175, low: avgPrice * 0.96, high: avgPrice * 1.04,
}));

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
