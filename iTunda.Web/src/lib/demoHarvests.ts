import { demoTomatoLots } from './demoTomatoes';

export interface MarketReference { market: string; period: string; price: number; source: string; method: string }
export interface TraceEvent { date: string; title: string; description: string }
interface Grower { growerSlug: string; farm: string; grower: string; town: string; region: string; country: string; zone: number }

export interface DemoHarvest extends Grower {
  slug: string;
  name: string;
  category: string;
  lotCode: string;
  available: number;
  unit: string;
  price: number;
  currency: string;
  priceReference: MarketReference;
  field: string;
  grade: string;
  picked: string;
  trace: TraceEvent[];
  photo?: string;
  farmStory?: string;
}

export const tomatoHarvestPhoto = '/images/demo-tomatoes/harvest.webp';
export const tomatoVinePhoto = '/images/demo-tomatoes/vine.webp';

function daysFrom(date: string, offset: number) {
  return new Date(Date.parse(date) + offset * 86_400_000).toISOString().slice(0, 10);
}

const tomatoLots: DemoHarvest[] = demoTomatoLots.map(lot => ({
  ...lot, growerSlug: lot.slug, name: `${lot.variety} tomatoes`, category: 'Tomatoes', unit: 'kg', available: lot.stockKg,
  photo: tomatoHarvestPhoto,
  trace: [
    { date: lot.seeded, title: 'Sown in the nursery', description: `${lot.variety} seeds labeled in a nursery tray for this batch.` },
    { date: lot.transplanted, title: 'Transplanted to the plot', description: `Seedlings moved to ${lot.field}. ${lot.cultivation}` },
    { date: lot.picked, title: 'Harvested and graded', description: `Fruit picked from ${lot.field} and sorted by color, firmness and size.` },
    { date: lot.packed, title: 'Packed and labeled', description: `${lot.packaging}. The crate label carries ${lot.lotCode} and the packing date.` },
    { date: daysFrom(lot.packed, 1), title: 'Ready for buyer handoff', description: 'The example pickup record matches the crate label to the grower, lot and quantity.' },
    { date: lot.bestBefore, title: 'Sample best-before date', description: 'The grower records a best-before date so the buyer can plan pickup and use.' },
  ],
}));

function grower(slug: string, farm: string, name: string, town: string, region: string, country: string, zone: number): Grower {
  return { growerSlug: slug, farm, grower: name, town, region, country, zone };
}

const growers = {
  ridge: grower('ridge-blocks', 'Ridge Block Demo Growers', 'Kendi R.', 'Kandara area', "Murang'a", 'Kenya', 1),
  foothills: grower('foothill-rows', 'Foothill Rows Demo Farm', 'Mosi K.', 'Karatina area', 'Nyeri', 'Kenya', 1),
  valley: grower('valley-gate', 'Valley Gate Demo Farm', 'Tali W.', 'Njoro area', 'Nakuru', 'Kenya', 1),
  leaf: grower('ridge-leaf', 'Ridge Leaf Demo Plots', 'Kito N.', 'Kapsabet area', 'Nandi Hills', 'Kenya', 1),
  east: grower('east-range', 'East Range Demo Farm', 'Imani D.', 'Nkubu area', 'Meru', 'Kenya', 1),
  coast: grower('coastal-rows', 'Coastal Rows Demo Growers', 'Amani S.', 'Ukunda area', 'Kwale', 'Kenya', 1),
  mill: grower('sample-mill', 'North Silo Demo Mill', 'Ari T.', 'Ruiru area', 'Kiambu', 'Kenya', 1),
  thika: grower('thika-fruit-blocks', 'Thika Block Demo Growers', 'Safi W.', 'Thika area', 'Kiambu', 'Kenya', 1),
  orchard: grower('sundial-orchard', 'Sundial Demo Orchard', 'Zola M.', 'Tzaneen area', 'Limpopo', 'South Africa', 2),
  cape: grower('cape-fold', 'Cape Fold Demo Produce', 'Sam R.', 'Ceres area', 'Western Cape', 'South Africa', 2),
  lowveld: grower('lowveld-rows', 'Lowveld Rows Demo Farm', 'Lebo P.', 'Mbombela area', 'Mpumalanga', 'South Africa', 2),
  petorca: grower('petorca-blocks', 'Petorca Block Demo Orchard', 'Mar V.', 'Petorca area', 'Petorca', 'Chile', 3),
  cocoa: grower('antioquia-cacao', 'Canopy Plot Demo Cacao', 'Luz R.', 'Urabá area', 'Antioquia', 'Colombia', 3),
  spain: grower('turia-orchard', 'Turia Row Demo Orchard', 'Sol N.', 'València area', 'Valencia', 'Spain', 4),
};

const knbs = 'https://www.knbs.or.ke/wp-content/uploads/2026/04/2026-Economic-Survey.pdf';
const joburg = 'https://joburgmarket.co.za/jhb-market/dailyprices.php';
const pinkSheet = 'https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Pink-Sheet-November-2026.pdf';
const odepa = 'https://www.odepa.gob.cl/wp-content/uploads/2026/10/Boletin_Semanal_Precios_Mayoristas_20261106.pdf';

function kenya(price: number, crop: string): MarketReference {
  return { market: 'Kenya · KNBS Economic Survey', period: '2025 provisional', price, source: knbs, method: `Table 7.20 ${crop} unit price, converted from 100 kg` };
}

function southAfrica(price: number, row: string): MarketReference {
  return { market: 'Joburg Market', period: '18 November 2026', price, source: joburg, method: `Total sales value ÷ kg sold in the ${row} line` };
}

function world(price: number, series: string): MarketReference {
  return { market: 'World Bank Pink Sheet', period: 'October 2026', price, source: pinkSheet, method: `${series} monthly benchmark` };
}

type Stage = 'field' | 'orchard' | 'dry' | 'processed' | 'feed' | 'flower';
interface Example {
  slug: string;
  name: string;
  category: string;
  grower: keyof typeof growers;
  price: number;
  currency: string;
  ref: MarketReference;
  quantity: number;
  unit?: string;
  stage: Stage;
  days: number;
  grade: string;
  pack: string;
  note: string;
  photo?: string;
}

const examples: Example[] = [
  { slug: 'muranga-hass', name: 'Hass avocados', category: 'Avocados', grower: 'ridge', price: 38, currency: 'KES', ref: kenya(40.3, 'avocado'),
    quantity: 280, stage: 'orchard', days: 155, grade: 'Mature green', pack: '10 kg ventilated crates', note: 'Tagged mature-green fruit after grading for size.', photo: '/images/studio-avocado.webp' },
  { slug: 'nyeri-macadamia', name: 'Dried in-shell macadamia', category: 'Macadamia Nuts', grower: 'foothills', price: 128, currency: 'KES', ref: kenya(135.83, 'macadamia'),
    quantity: 175, stage: 'dry', days: 178, grade: 'In shell · dried', pack: '25 kg lined sacks', note: 'Recorded dehusking and separated damaged shells before drying.' },
  { slug: 'lowveld-french-beans', name: 'Slender French beans', category: 'French Beans', grower: 'lowveld', price: 19.8, currency: 'ZAR', ref: southAfrica(21.15, 'BEANS (broader fresh bean reference)'),
    quantity: 170, stage: 'field', days: 57, grade: 'Fine pods', pack: '5 kg ventilated cartons', note: 'Picked young pods and graded them by length.' },
  { slug: 'nandi-green-leaf', name: 'Fresh green tea leaf', category: 'Tea', grower: 'leaf', price: 25, currency: 'KES',
    ref: { market: 'Kenya News Agency', period: '19 March 2026', price: 26, source: 'https://www.kenyanews.go.ke/government-injects-sh3-5-billion-to-revamp-tea-sector/', method: 'Reported green-leaf payment to farmers' },
    quantity: 90, stage: 'orchard', days: 23, grade: 'Two leaves and a bud', pack: 'Ventilated collection sacks', note: 'Recorded the morning pluck and same-day collection time.', photo: '/images/studio-hands.webp' },
  { slug: 'nyeri-garden-peas', name: 'Fresh garden peas in pod', category: 'Peas & Mange Tout', grower: 'foothills', price: 48, currency: 'KES', ref: kenya(50.82, 'garden peas'),
    quantity: 130, stage: 'field', days: 72, grade: 'Full green pods', pack: '10 kg ventilated crates', note: 'Separated split pods and retained field codes by crate.' },
  { slug: 'muranga-purple-passion', name: 'Purple passion fruit', category: 'Passion Fruit', grower: 'ridge', price: 94, currency: 'KES',
    ref: { market: "Murang'a county", period: '28 October 2026', price: 100, source: 'https://saficagriatlas.strathmore.edu/agristatistics/markets/passion-fruits', method: 'Kenya Agri Atlas county retail observation' },
    quantity: 110, stage: 'orchard', days: 145, grade: 'Purple · sorting grade', pack: '10 kg crates', note: 'Sorted by size and checked for skin splits.' },
  { slug: 'limpopo-mango', name: 'Keitt mangoes', category: 'Mangoes', grower: 'orchard', price: 23.8, currency: 'ZAR', ref: southAfrica(25.55, 'MANGO'),
    quantity: 420, stage: 'orchard', days: 150, grade: 'Firm · mature', pack: '10 kg cartons', note: 'Checked maturity and tagged each orchard pick.' },
  { slug: 'meru-bananas', name: 'Green cooking bananas', category: 'Bananas', grower: 'east', price: 16, currency: 'KES', ref: kenya(16.92, 'banana'),
    quantity: 180, stage: 'orchard', days: 220, grade: 'Green cooking grade', pack: 'Cushioned 15 kg crates', note: 'Cut bunches, separated hands and recorded the harvest block.' },
  { slug: 'nakuru-red-onions', name: 'Cured red bulb onions', category: 'Onions', grower: 'valley', price: 46, currency: 'KES', ref: kenya(48.31, 'bulb onions'),
    quantity: 225, stage: 'dry', days: 115, grade: 'Firm dry skins', pack: '25 kg mesh bags', note: 'Cured the bulbs on racks and sorted by diameter.' },
  { slug: 'lowveld-green-peppers', name: 'Green bell peppers', category: 'Capsicum & Peppers', grower: 'lowveld', price: 6.8, currency: 'ZAR', ref: southAfrica(7.29, 'GREEN PEPPERS'),
    quantity: 245, stage: 'field', days: 99, grade: 'Firm · medium', pack: '7 kg crates', note: 'Graded for firmness and removed split or soft fruit.' },
  { slug: 'nakuru-red-roses', name: 'Red roses · 40–50 cm', category: 'Roses', grower: 'valley', price: .22, currency: 'USD', unit: 'stem',
    ref: { market: "Lisa’s Flowers Export", period: '2026 guide', price: .23, source: 'https://www.lisasflowersexport.com/blog/weekly-flower-price-trends-from-kenya-ethiopia-2026-update/', method: 'Rounded midpoint of the indicative USD 0.15–0.30 per stem range' },
    quantity: 500, stage: 'flower', days: 56, grade: '40–50 cm stems', pack: '25 stems per sleeve', note: 'Logged stem length and cooler intake after the morning cut.' },
  { slug: 'nyeri-arabica', name: 'Washed green Arabica coffee', category: 'Coffee', grower: 'foothills', price: 6.9, currency: 'USD', ref: world(7.4, 'Arabica indicator · traded green coffee'),
    quantity: 60, stage: 'processed', days: 155, grade: 'Washed · green beans', pack: '30 kg lined sacks', note: 'Linked ripe-cherry intake to pulping, washing and raised-bed drying records.' },
  { slug: 'cape-apples', name: 'Cripps Pink apples', category: 'Apples', grower: 'cape', price: 12.5, currency: 'ZAR', ref: southAfrica(13.14, 'APPLES'),
    quantity: 150, stage: 'orchard', days: 172, grade: 'Firm · medium', pack: '12.5 kg cartons', note: 'Recorded the earlier harvest block and cold-store withdrawal for packing.' },
  { slug: 'kiambu-pineapples', name: 'Smooth Cayenne pineapples', category: 'Pineapples', grower: 'thika', price: 31, currency: 'KES', ref: kenya(33.47, 'pineapples'),
    quantity: 115, stage: 'orchard', days: 310, grade: 'Firm · crown intact', pack: '10 kg ventilated boxes', note: 'Recorded skin color and fruit weight at pack-out.' },
  { slug: 'limpopo-oranges', name: 'Navel oranges', category: 'Oranges', grower: 'orchard', price: 5.6, currency: 'ZAR', ref: southAfrica(5.93, 'ORANGES'),
    quantity: 260, stage: 'orchard', days: 190, grade: 'Medium count', pack: '15 kg cartons', note: 'Matched each carton to its orchard block and size grade.' },
  { slug: 'cape-table-grapes', name: 'Seedless table grapes', category: 'Grapes', grower: 'cape', price: 39, currency: 'ZAR', ref: southAfrica(43.11, 'GRAPES'),
    quantity: 90, stage: 'orchard', days: 132, grade: 'Intact bunches', pack: '4.5 kg ventilated cartons', note: 'Sorted whole bunches and recorded cooling before dispatch.' },
  { slug: 'limpopo-lemons', name: 'Eureka lemons', category: 'Lemons & Limes', grower: 'orchard', price: 7.8, currency: 'ZAR', ref: southAfrica(8.28, 'LEMONS'),
    quantity: 165, stage: 'orchard', days: 184, grade: 'Medium count', pack: '15 kg cartons', note: 'Separated cosmetic seconds and logged carton counts.' },
  { slug: 'cape-strawberries', name: 'Fresh strawberries', category: 'Strawberries', grower: 'cape', price: 47, currency: 'ZAR', ref: southAfrica(50.74, 'STRAWBERRIES'),
    quantity: 36, stage: 'field', days: 85, grade: 'Firm red fruit', pack: '250 g ventilated punnets', note: 'Packed directly after picking and recorded the cooler intake.' },
  { slug: 'kwale-cashew', name: 'Raw in-shell cashew nuts', category: 'Cashew Nuts', grower: 'coast', price: 61, currency: 'KES', ref: kenya(65.11, 'cashew nuts'),
    quantity: 200, stage: 'dry', days: 165, grade: 'Raw in shell · for processing', pack: '25 kg lined bags', note: 'Recorded nut collection and separated shells by condition.' },
  { slug: 'antioquia-cacao-beans', name: 'Fermented cocoa beans', category: 'Cocoa', grower: 'cocoa', price: 5.35, currency: 'USD', ref: world(5.75, 'ICCO international cocoa indicator'),
    quantity: 95, stage: 'processed', days: 160, grade: 'Fermented · dried', pack: '25 kg lined sacks', note: 'Linked the pod intake to a fermentation box and the subsequent drying lot.' },
  { slug: 'kwale-vanilla', name: 'Cured vanilla pods', category: 'Vanilla', grower: 'coast', price: 6200, currency: 'KES',
    ref: { market: 'Diani grower interview', period: '2026', price: 6500, source: 'https://farmbizafrica.com/kwale-farmer-earns-sh6500-a-kilo-from-vanilla-in-kenya/', method: 'One grower’s reported selling price for locally cured vanilla' },
    quantity: 18, stage: 'processed', days: 265, grade: 'Cured pods', pack: 'Labeled 1 kg sealed packs', note: 'Recorded harvest, curing batch and conditioning dates for the sealed packs.' },
  { slug: 'lowveld-ginger', name: 'Fresh ginger root', category: 'Ginger', grower: 'lowveld', price: 37.5, currency: 'ZAR', ref: southAfrica(39.91, 'GINGER ROOT'),
    quantity: 120, stage: 'field', days: 230, grade: 'Cured surface · unpeeled', pack: '10 kg cartons', note: 'Lifted rhizomes by bed and graded for visible damage.' },
  { slug: 'lowveld-green-chillies', name: 'Fresh green chillies', category: 'Green Chillies', grower: 'lowveld', price: 8.1, currency: 'ZAR', ref: southAfrica(8.73, 'CHILLIES (all recorded colors)'),
    quantity: 82, stage: 'field', days: 99, grade: 'Whole green pods', pack: '5 kg crates', note: 'Separated red fruits and checked pods for cuts before weighing.' },
  { slug: 'meru-sweet-potatoes', name: 'Orange-fleshed sweet potatoes', category: 'Sweet Potatoes', grower: 'east', price: 34, currency: 'KES', ref: kenya(36.41, 'sweet potatoes'),
    quantity: 190, stage: 'field', days: 125, grade: 'Medium roots', pack: '20 kg ventilated sacks', note: 'Recorded the field and separated scuffed roots during grading.' },
  { slug: 'nakuru-kale', name: 'Sukuma wiki kale', category: 'Leafy Greens', grower: 'valley', price: 22, currency: 'KES', ref: kenya(23.49, 'kales'),
    quantity: 45, stage: 'field', days: 56, grade: 'Fresh green leaves', pack: 'Tied bunches sold by net weight', note: 'Logged the morning cut, bunching time and holding conditions.' },
  { slug: 'nakuru-white-maize', name: 'Dry white maize grain', category: 'Maize', grower: 'valley', price: 56, currency: 'KES',
    ref: { market: 'Kawangware', period: 'November 2026', price: 60, source: 'https://saficai.strathmore.edu/prices/maize/nairobi', method: 'KAMIS dry white maize retail observation' },
    quantity: 900, stage: 'dry', days: 140, grade: 'Dry white grain', pack: '50 kg tagged sacks', note: 'Linked harvesting, shelling and a separate sample moisture record.' },
  { slug: 'kiambu-wheat-bran', name: 'Wheat bran for feed', category: 'Animal Feed', grower: 'mill', price: 32, currency: 'KES',
    ref: { market: 'Noy Animal Feeds, Ruiru', period: '2026 price list', price: 34, source: 'https://noyanimalfeeds.co.ke/price-list', method: 'Published retailer rate for a 50 kg wheat bran sack' },
    quantity: 600, stage: 'feed', days: 11, grade: 'Wheat bran · feed ingredient', pack: '50 kg labeled sacks', note: 'Recorded wheat intake and the milling run that produced this bran lot.' },
  { slug: 'kwale-cassava', name: 'Fresh cassava roots', category: 'Other Crops', grower: 'coast', price: 25, currency: 'KES', ref: kenya(27.19, 'cassava'),
    quantity: 125, stage: 'field', days: 265, grade: 'Whole fresh roots', pack: '10 kg ventilated crates', note: 'Logged lifting time and removed bruised roots before packing.' },
  { slug: 'petorca-hass', name: 'Hass avocados · Petorca', category: 'Avocados', grower: 'petorca', price: 2700, currency: 'CLP',
    ref: { market: 'Lo Valledor, Santiago', period: '2–6 November 2026', price: 2900, source: odepa, method: 'ODEPA Hass wholesale report, CLP 29,000 ÷ 10 kg' },
    quantity: 500, stage: 'orchard', days: 172, grade: 'First-class sample', pack: '10 kg cartons', note: 'Sample orchard block and size grade were carried through to the carton.' },
  { slug: 'valencia-navels', name: 'Navel oranges · Valencia', category: 'Oranges', grower: 'spain', price: .69, currency: 'USD', ref: world(.75, 'Mediterranean navel orange import indicator'),
    quantity: 750, stage: 'orchard', days: 215, grade: 'Medium count', pack: '15 kg cartons', note: 'Recorded orchard row and packing line for a sample export-denominated batch.' },
];

const stageNotes: Record<Stage, { start: string; harvest: string; packDelay: number; keepDays: number }> = {
  field: { start: 'Planted', harvest: 'Harvested and graded', packDelay: 0, keepDays: 5 },
  orchard: { start: 'Growing lot assigned', harvest: 'Picked and graded', packDelay: 1, keepDays: 10 },
  dry: { start: 'Growing lot assigned', harvest: 'Harvested and sent for drying', packDelay: 12, keepDays: 90 },
  processed: { start: 'Growing lot assigned', harvest: 'Harvested and sent for processing', packDelay: 22, keepDays: 90 },
  feed: { start: 'Raw material intake logged', harvest: 'Milled and screened', packDelay: 1, keepDays: 60 },
  flower: { start: 'Cutting block assigned', harvest: 'Cut and graded', packDelay: 0, keepDays: 6 },
};

const otherLots: DemoHarvest[] = examples.map((item, index) => {
  const origin = growers[item.grower];
  const stage = stageNotes[item.stage];
  const packed = item.slug === 'cape-apples' ? '2026-11-14' : daysFrom('2026-11-18', -(index % 3));
  const delay = item.category === 'Vanilla' ? 94 : item.slug === 'cape-apples' ? 201 : stage.packDelay;
  const picked = daysFrom(packed, -delay);
  const row = String(index + 1).padStart(2, '0');
  const field = item.stage === 'feed' ? `Milling run W${row}` : `Block ${row}`;
  const lotCode = `DEMO-Z${origin.zone}-${item.slug.toUpperCase()}-${packed.slice(2).replaceAll('-', '')}`;
  return {
    ...origin, slug: item.slug, name: item.name, category: item.category, lotCode, available: item.quantity,
    unit: item.unit ?? 'kg', price: item.price, currency: item.currency, priceReference: item.ref,
    field, grade: item.grade, picked, photo: item.photo,
    trace: [
      { date: daysFrom(picked, -item.days), title: stage.start, description: `${field} linked to ${origin.farm} in the sample grower record.` },
      { date: picked, title: stage.harvest, description: item.note },
      { date: packed, title: 'Packed and labeled', description: `${item.pack}. The sample label carries ${lotCode}.` },
      { date: daysFrom(packed, 1), title: 'Ready for buyer handoff', description: 'The pickup record links the lot code, package count and grower.' },
      { date: daysFrom(packed, stage.keepDays), title: item.stage === 'flower' ? 'Sample quality review date' : 'Sample best-before date',
        description: 'Illustrative date from the example record.' },
    ],
  };
});

export const demoHarvests = [...tomatoLots, ...otherLots];
export const demoCategories = [...new Set(demoHarvests.map(lot => lot.category))].sort();

export function demoHarvestPath(lot: DemoHarvest) {
  return lot.category === 'Tomatoes' ? `/demo/tomatoes/${lot.slug}` : `/demo/harvests/${lot.slug}`;
}

export function matchesDemoHarvest(lot: DemoHarvest, search: string) {
  const query = search.trim().toLowerCase();
  return [lot.name, lot.category, lot.farm, lot.grower, `${lot.town}, ${lot.region}, ${lot.country}`, lot.lotCode]
    .some(value => value.toLowerCase().includes(query));
}

export function demoCategoryUrl(category: string) {
  return `/browse/${encodeURIComponent(category)}`;
}
