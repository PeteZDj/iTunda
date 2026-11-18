export const kenyaTomatoSource = 'https://saficai.strathmore.edu/prices/tomatoes';

type Currency = 'KES' | 'ZAR';

export interface DemoTomatoLot {
  slug: string;
  lotCode: string;
  variety: string;
  grade: string;
  farm: string;
  grower: string;
  town: string;
  region: string;
  country: string;
  zone: number;
  farmStory: string;
  field: string;
  cultivation: string;
  seeded: string;
  transplanted: string;
  picked: string;
  packed: string;
  bestBefore: string;
  packaging: string;
  stockKg: number;
  price: number;
  currency: Currency;
  priceReference: { market: string; period: string; price: number; source: string; method: string };
}

export const demoTomatoLots: DemoTomatoLot[] = [
  {
    slug: 'kirinyaga-roma', lotCode: 'DEMO-KE-KIR-261117-A', variety: 'Roma', grade: 'Grade A · firm red',
    farm: 'Redbank Plot 7', grower: 'Amani K.', town: 'Kerugoya area', region: 'Kirinyaga', country: 'Kenya', zone: 1,
    farmStory: 'A small family plot that grows Roma tomatoes for nearby shops and households. Each picking gets its own lot code.',
    field: 'Bed R7', cultivation: 'Open field rows, drip lines and staked plants.',
    seeded: '2026-08-02', transplanted: '2026-08-30', picked: '2026-11-17', packed: '2026-11-17', bestBefore: '2026-11-22',
    packaging: 'Reusable 10 kg crates', stockKg: 120, price: 52, currency: 'KES',
    priceReference: { market: 'Kerugoya', period: 'October 2026', price: 55.71, source: kenyaTomatoSource, method: 'KAMIS retail observation' },
  },
  {
    slug: 'nairobi-beefsteak', lotCode: 'DEMO-KE-NBI-261118-B', variety: 'Beefsteak', grade: 'Grade A · large',
    farm: 'Kijani Row Gardens', grower: 'Nia M.', town: 'Dagoretti area', region: 'Nairobi', country: 'Kenya', zone: 1,
    farmStory: 'A peri-urban grower with covered beds for large slicing tomatoes, packed in small lots for restaurants.',
    field: 'Tunnel 2 · Bed B4', cultivation: 'Covered beds with trellises and drip lines.',
    seeded: '2026-07-28', transplanted: '2026-08-27', picked: '2026-11-18', packed: '2026-11-18', bestBefore: '2026-11-22',
    packaging: 'Single-layer 5 kg trays', stockKg: 65, price: 66, currency: 'KES',
    priceReference: { market: 'Kangemi Market', period: 'September 2026', price: 70, source: kenyaTomatoSource, method: 'KAMIS retail observation' },
  },
  {
    slug: 'kisumu-salad', lotCode: 'DEMO-KE-KSM-261117-C', variety: 'Salad', grade: 'Grade A · mixed medium',
    farm: 'Papyrus Row Collective', grower: 'Imani O.', town: 'Ahero area', region: 'Kisumu', country: 'Kenya', zone: 1,
    farmStory: 'A fictional growers’ group that consolidates batches for independent grocers while retaining the plot code for each crate.',
    field: 'Block C · Row 11', cultivation: 'Open rows with raised beds and drip lines.',
    seeded: '2026-08-05', transplanted: '2026-09-01', picked: '2026-11-17', packed: '2026-11-18', bestBefore: '2026-11-23',
    packaging: 'Ventilated 12 kg crates', stockKg: 240, price: 92, currency: 'KES',
    priceReference: { market: 'Ahero', period: 'November 2026', price: 100, source: kenyaTomatoSource, method: 'KAMIS retail observation' },
  },
  {
    slug: 'kwale-plum', lotCode: 'DEMO-KE-KWL-261116-D', variety: 'Plum', grade: 'Grade B · kitchen grade',
    farm: 'Coral Bed Produce', grower: 'Taji S.', town: 'Ukunda area', region: 'Kwale', country: 'Kenya', zone: 1,
    farmStory: 'A small coastal plot that separates kitchen-grade tomatoes for sauces and bulk cooking.',
    field: 'Shade plot D3', cultivation: 'Shade net over staked rows with drip lines.',
    seeded: '2026-08-09', transplanted: '2026-09-02', picked: '2026-11-16', packed: '2026-11-16', bestBefore: '2026-11-21',
    packaging: 'Reusable 8 kg crates', stockKg: 88, price: 82, currency: 'KES',
    priceReference: { market: 'Diani Market', period: 'November 2026', price: 90, source: kenyaTomatoSource, method: 'KAMIS retail observation' },
  },
  {
    slug: 'eldoret-vine', lotCode: 'DEMO-KE-UAS-261118-E', variety: 'Vine', grade: 'Grade A · turning red',
    farm: 'Juniper Ridge Beds', grower: 'Kito C.', town: 'Eldoret area', region: 'Uasin Gishu', country: 'Kenya', zone: 1,
    farmStory: 'A mid-size demo grower that keeps the tunnel, picking shift and packing day on its crate tags.',
    field: 'Tunnel 3 · E2', cultivation: 'High tunnel with trellised plants and drip lines.',
    seeded: '2026-07-30', transplanted: '2026-08-30', picked: '2026-11-18', packed: '2026-11-18', bestBefore: '2026-11-24',
    packaging: 'Ventilated 10 kg crates', stockKg: 320, price: 95, currency: 'KES',
    priceReference: { market: 'Eldoret Main', period: 'November 2026', price: 100, source: kenyaTomatoSource, method: 'KAMIS retail observation' },
  },
  {
    slug: 'mpumalanga-saladette', lotCode: 'DEMO-ZA-MPU-261117-F', variety: 'Saladette', grade: 'Medium · firm red',
    farm: 'Amber Row Demo Farm', grower: 'Lebo N.', town: 'Mbombela area', region: 'Mpumalanga', country: 'South Africa', zone: 2,
    farmStory: 'A fictional regional packer who records field block, picking date and crate counts for each outbound lot.',
    field: 'Block F · Row 8', cultivation: 'Open beds with drip lines, mulch and support stakes.',
    seeded: '2026-08-02', transplanted: '2026-08-31', picked: '2026-11-17', packed: '2026-11-17', bestBefore: '2026-11-23',
    packaging: 'Corrugated 6 kg boxes', stockKg: 360, price: 7.6, currency: 'ZAR',
    priceReference: { market: 'Durban Fresh Produce Market', period: '17 November 2026', price: 8, source: 'https://durbanmarkets.durban.gov.za/', method: 'Wholesale Saladette average for the 1 kg AP010 line' },
  },
];

export function demoMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: ['ZAR', 'USD', 'EUR'].includes(currency) ? 2 : 0 })}`;
}

export function demoDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
