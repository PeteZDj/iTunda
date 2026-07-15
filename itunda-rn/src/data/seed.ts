// Deterministic offline fallback dataset. Mirrors the API seeder closely enough
// that every screen looks full when the live API is unreachable. Uses a seeded
// RNG so the data is stable across launches.

import { CAT_DETAILS, CATEGORIES, catDetail, categoryIconUrl, produceGallery, produceImage } from '@/lib/categories';
import { BUYER_NAMES, FARMERS, REGIONS, ZONES, farmImages, slug } from '@/lib/regions';
import type { BuyOrder, Commodity, Dataset, Farmer, OrderKind, OrderSide, Produce, Region } from './types';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIAL: Record<string, string> = {
  KE: '+254', UG: '+256', ET: '+251', TZ: '+255', ZA: '+27', MX: '+52',
  CL: '+56', PE: '+51', CO: '+57', BR: '+55', IN: '+91', ES: '+34',
};

const EXPORTS_BY_ZONE: Record<number, string> = {
  1: 'EU, Middle East, China',
  2: 'EU, UK, Middle East',
  3: 'USA, EU, Asia',
  4: 'EU, UK',
};

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString();
}

export function buildDataset(): Dataset {
  const rng = mulberry32(42);
  const rInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const rFloat = (min: number, max: number) => rng() * (max - min) + min;
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  // ── Farmers ────────────────────────────────────────────────────────────
  const farmers: Farmer[] = FARMERS.map((f, i) => {
    const region = REGIONS[f.regionIndex];
    const canExport = region.zone <= 3 && rng() < 0.7;
    const phone = `${DIAL[region.countryCode] ?? '+254'} ${rInt(700, 799)} ${rInt(100, 999)} ${rInt(100, 999)}`;
    return {
      id: i + 1,
      userId: i + 1,
      name: f.name,
      username: slug(f.name),
      farmName: f.farmName,
      description: `${f.farmName} is a trusted grower in ${region.name}, ${region.country}, specialising in ${region.crops[0]}. Verified provenance with GPS-tagged plots and traceable harvests.`,
      specialization: region.crops[0],
      certifications: canExport ? 'GlobalG.A.P., Fairtrade' : 'KEPHIS Registered',
      locationCounty: region.name,
      farmLatitude: region.lat + rFloat(-0.05, 0.05),
      farmLongitude: region.lng + rFloat(-0.05, 0.05),
      sizeOfFarmAcres: rInt(15, 139),
      ableToExportDirectly: canExport,
      exportsDomain: canExport ? EXPORTS_BY_ZONE[region.zone] : undefined,
      ratingFarmer: Math.round(rFloat(4.2, 4.9) * 10) / 10,
      ordersFulfilled: rInt(80, 519),
      phone,
      region: region.name,
      country: region.country,
      countryCode: region.countryCode,
      zone: region.zone,
      farmImages: farmImages(i + 1, region.country),
    };
  });

  // ── Produce ────────────────────────────────────────────────────────────
  const produce: Produce[] = [];
  let pid = 1;

  const makeProduce = (farmerIdx: number, category: string): Produce => {
    const farmer = farmers[farmerIdx];
    const cd = catDetail(category);
    const variety = pick(cd.varieties);
    const grade = pick(cd.grades);
    const qty = Math.round(rFloat(cd.minQty, cd.maxQty) * 10) / 10;
    const price = Math.round(rFloat(cd.minPrice, cd.maxPrice));
    const future = rng() < 0.3;
    const exportReady = farmer.ableToExportDirectly && rng() < 0.6;
    const scope = exportReady ? (rng() < 0.5 ? 'Export' : 'Both') : 'Local';
    const id = pid++;
    return {
      id,
      name: variety,
      category,
      description: `${variety} ${category.toLowerCase()} from ${farmer.farmName}, ${farmer.region}, ${farmer.country}. ${grade}. ${qty}${cd.unit} available, harvested fresh and ready for ${scope === 'Local' ? 'local delivery' : 'export'}.`,
      price,
      unit: cd.unit,
      quantityAvailable: qty,
      plantingDate: iso(-rInt(75, 319)),
      harvestDate: iso(-rInt(0, 29)),
      expiryDate: iso(category === 'Roses' ? rInt(7, 20) : rInt(14, 60)),
      availableFrom: future ? iso(rInt(1, 90)) : null,
      isExportReady: exportReady,
      gradeQuality: grade,
      farmerProfileId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      farmName: farmer.farmName,
      county: farmer.region,
      farmLatitude: farmer.farmLatitude,
      farmLongitude: farmer.farmLongitude,
      farmerRating: farmer.ratingFarmer,
      farmerOrdersFulfilled: farmer.ordersFulfilled,
      region: farmer.region,
      country: farmer.country,
      countryCode: farmer.countryCode,
      zone: farmer.zone,
      imageUrl: produceImage(category, id),
      gallery: produceGallery(category, id),
      iconUrl: categoryIconUrl(category),
      isDraft: false,
      deliveryScope: scope,
      farmerUsername: farmer.username,
    };
  };

  // Ensure 8-12 live listings per category, preferring matching regions.
  for (const category of CATEGORIES) {
    const count = rInt(8, 12);
    const matching = farmers.filter((f) => REGIONS[FARMERS.findIndex((x) => x.name === f.name)].crops.includes(category));
    for (let i = 0; i < count; i++) {
      const farmer = matching.length && rng() < 0.75 ? pick(matching) : pick(farmers);
      const idx = farmers.indexOf(farmer);
      produce.push(makeProduce(idx, category));
    }
  }

  // ── Commodities (computed from produce) ──────────────────────────────────
  const commodities: Commodity[] = CAT_DETAILS.map((cd) => {
    const items = produce.filter((p) => p.category === cd.name);
    const prices = items.map((p) => p.price);
    const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : Math.round((cd.minPrice + cd.maxPrice) / 2);
    const low = prices.length ? Math.min(...prices) : cd.minPrice;
    const high = prices.length ? Math.max(...prices) : cd.maxPrice;
    const changePct = Math.round(rFloat(-7, 7) * 100) / 100;
    const spread = Math.max(0.02, avg * 0.00175);
    return {
      category: cd.name,
      unit: cd.unit,
      iconUrl: categoryIconUrl(cd.name),
      avgPrice: avg,
      low,
      high,
      changePct,
      listings: items.length,
      bid: Math.round((avg - spread) * 100) / 100,
      ask: Math.round((avg + spread) * 100) / 100,
    };
  });

  // ── Buy / sell orders ────────────────────────────────────────────────────
  const kinds: OrderKind[] = ['Spot', 'Limit', 'Limit', 'Futures', 'Futures', 'Put'];
  const buyOrders: BuyOrder[] = [];
  for (let i = 0; i < 54; i++) {
    const region = pick(REGIONS);
    const category = pick(region.crops);
    const cd = catDetail(category);
    const mid = (cd.minPrice + cd.maxPrice) / 2;
    const side: OrderSide = rng() < 0.7 ? 'Buy' : 'Sell';
    const factor = side === 'Buy' ? 0.88 + rng() * 0.14 : 1.02 + rng() * 0.16;
    const kind = pick(kinds);
    buyOrders.push({
      id: i + 1,
      commodity: category,
      variety: pick(cd.varieties),
      grade: pick(cd.grades),
      unit: cd.unit,
      quantity: Math.round(cd.minQty * 3 + rng() * cd.maxQty),
      targetPrice: Math.round(mid * factor),
      side,
      kind,
      contractDate: kind === 'Futures' || kind === 'Put' ? iso(rInt(30, 180)) : null,
      region: region.name,
      country: region.country,
      countryCode: region.countryCode,
      zone: region.zone,
      buyerName: side === 'Buy' ? pick(BUYER_NAMES) : pick(FARMERS).farmName,
      buyerContact: 'desk@itunda.example',
      exportRequired: rng() < 0.6,
      status: rng() < 0.8 ? 'Open' : 'Matched',
      createdAt: iso(-rInt(0, 19)),
      neededBy: iso(rInt(5, 45)),
      iconUrl: categoryIconUrl(category),
    });
  }

  // ── Regions with live counts ─────────────────────────────────────────────
  const regions: Region[] = REGIONS.map((r) => ({
    name: r.name,
    country: r.country,
    countryCode: r.countryCode,
    zone: r.zone,
    zoneName: ZONES[r.zone],
    lat: r.lat,
    lng: r.lng,
    crops: r.crops,
    listingCount: produce.filter((p) => p.region === r.name).length,
  }));

  return { produce, commodities, buyOrders, regions, farmers };
}

let cached: Dataset | null = null;
export function fallbackDataset(): Dataset {
  if (!cached) cached = buildDataset();
  return cached;
}
