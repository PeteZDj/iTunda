// Growing regions (26), export zones (4) and farmer definitions (26), verbatim
// from the API's RegionData / SeedData. Powers region filters and the offline
// fallback seed.

export interface RegionInfo {
  name: string;
  country: string;
  countryCode: string;
  zone: number;
  lat: number;
  lng: number;
  crops: string[];
}

export const ZONES: Record<number, string> = {
  1: 'Zone 1 · East Africa',
  2: 'Zone 2 · Southern Africa',
  3: 'Zone 3 · Americas',
  4: 'Zone 4 · Global',
};

export const REGIONS: RegionInfo[] = [
  { name: "Murang'a", country: 'Kenya', countryCode: 'KE', zone: 1, lat: -0.7839, lng: 37.04, crops: ['Avocados', 'Macadamia Nuts', 'Coffee'] },
  { name: 'Nyeri', country: 'Kenya', countryCode: 'KE', zone: 1, lat: -0.4197, lng: 36.9489, crops: ['French Beans', 'Peas & Mange Tout', 'Avocados', 'Coffee'] },
  { name: 'Kirinyaga', country: 'Kenya', countryCode: 'KE', zone: 1, lat: -0.4988, lng: 37.2803, crops: ['Macadamia Nuts', 'Avocados', 'Tomatoes', 'Coffee'] },
  { name: 'Nakuru', country: 'Kenya', countryCode: 'KE', zone: 1, lat: -0.7167, lng: 36.4333, crops: ['Roses', 'Onions', 'Strawberries'] },
  { name: 'Nandi Hills', country: 'Kenya', countryCode: 'KE', zone: 1, lat: 0.1042, lng: 35.1727, crops: ['Tea', 'Coffee'] },
  { name: 'Uasin Gishu', country: 'Kenya', countryCode: 'KE', zone: 1, lat: 0.5143, lng: 35.2698, crops: ['Macadamia Nuts', 'French Beans', 'Roses', 'Sweet Potatoes'] },
  { name: 'Meru', country: 'Kenya', countryCode: 'KE', zone: 1, lat: 0.0463, lng: 37.6559, crops: ['Avocados', 'Bananas', 'Macadamia Nuts', 'Green Chillies'] },
  { name: 'Kisii', country: 'Kenya', countryCode: 'KE', zone: 1, lat: -0.6817, lng: 34.7669, crops: ['Tomatoes', 'Bananas', 'Coffee'] },
  { name: 'Machakos', country: 'Kenya', countryCode: 'KE', zone: 1, lat: -1.5177, lng: 37.2634, crops: ['Capsicum & Peppers', 'Mangoes', 'Passion Fruit', 'Green Chillies', 'Oranges'] },
  { name: 'Kabale', country: 'Uganda', countryCode: 'UG', zone: 1, lat: -1.2489, lng: 29.9899, crops: ['Passion Fruit', 'Peas & Mange Tout', 'Coffee'] },
  { name: 'Mbale', country: 'Uganda', countryCode: 'UG', zone: 1, lat: 1.0644, lng: 34.1797, crops: ['Bananas', 'Avocados', 'Coffee', 'Ginger', 'Sweet Potatoes'] },
  { name: 'Masaka', country: 'Uganda', countryCode: 'UG', zone: 1, lat: -0.3333, lng: 31.7333, crops: ['Bananas', 'Passion Fruit', 'Coffee', 'Pineapples'] },
  { name: 'Sidama', country: 'Ethiopia', countryCode: 'ET', zone: 1, lat: 6.75, lng: 38.4667, crops: ['Avocados', 'Passion Fruit', 'Coffee'] },
  { name: 'Jimma', country: 'Ethiopia', countryCode: 'ET', zone: 1, lat: 7.6733, lng: 36.8344, crops: ['Mangoes', 'Avocados', 'Coffee'] },
  { name: 'Kilimanjaro', country: 'Tanzania', countryCode: 'TZ', zone: 1, lat: -3.3349, lng: 37.3404, crops: ['Avocados', 'Bananas', 'Coffee'] },
  { name: 'Arusha', country: 'Tanzania', countryCode: 'TZ', zone: 1, lat: -3.3869, lng: 36.683, crops: ['French Beans', 'Roses', 'Peas & Mange Tout', 'Coffee', 'Cashew Nuts'] },
  { name: 'Limpopo', country: 'South Africa', countryCode: 'ZA', zone: 2, lat: -23.8331, lng: 30.1636, crops: ['Avocados', 'Mangoes', 'Oranges', 'Grapes'] },
  { name: 'Mpumalanga', country: 'South Africa', countryCode: 'ZA', zone: 2, lat: -25.4753, lng: 30.9694, crops: ['Avocados', 'Bananas', 'Macadamia Nuts', 'Oranges'] },
  { name: 'Western Cape', country: 'South Africa', countryCode: 'ZA', zone: 2, lat: -33.9249, lng: 18.4241, crops: ['Roses', 'Onions', 'Grapes', 'Apples', 'Strawberries', 'Oranges'] },
  { name: 'Michoacán', country: 'Mexico', countryCode: 'MX', zone: 3, lat: 19.5665, lng: -101.7068, crops: ['Avocados', 'Lemons & Limes', 'Strawberries'] },
  { name: 'Petorca', country: 'Chile', countryCode: 'CL', zone: 3, lat: -32.25, lng: -70.9333, crops: ['Avocados', 'Grapes'] },
  { name: 'La Libertad', country: 'Peru', countryCode: 'PE', zone: 3, lat: -8.115, lng: -79.0289, crops: ['Avocados', 'Mangoes', 'Capsicum & Peppers', 'Grapes'] },
  { name: 'Antioquia', country: 'Colombia', countryCode: 'CO', zone: 3, lat: 6.2518, lng: -75.5636, crops: ['Avocados', 'Bananas', 'Coffee', 'Cocoa'] },
  { name: 'São Paulo', country: 'Brazil', countryCode: 'BR', zone: 3, lat: -23.5505, lng: -46.6333, crops: ['Mangoes', 'Passion Fruit', 'Coffee', 'Oranges', 'Pineapples', 'Cocoa'] },
  { name: 'Kerala', country: 'India', countryCode: 'IN', zone: 4, lat: 10.8505, lng: 76.2711, crops: ['Bananas', 'Passion Fruit', 'Mangoes', 'Cashew Nuts', 'Vanilla', 'Ginger', 'Pineapples', 'Coffee'] },
  { name: 'Málaga', country: 'Spain', countryCode: 'ES', zone: 4, lat: 36.7213, lng: -4.4214, crops: ['Avocados', 'Mangoes', 'Oranges', 'Lemons & Limes', 'Grapes', 'Strawberries'] },
];

export interface FarmerDef {
  name: string;
  email: string;
  farmName: string;
  regionIndex: number;
}

export const FARMERS: FarmerDef[] = [
  { name: 'James Kamau', email: 'james.kamau@farm.ke', farmName: 'Kamau Avocado Estate', regionIndex: 0 },
  { name: 'Grace Wanjiku', email: 'grace.wanjiku@farm.ke', farmName: 'Wanjiku Green Beans Farm', regionIndex: 1 },
  { name: 'Moses Kariuki', email: 'moses.kariuki@farm.ke', farmName: 'Kirinyaga Macadamia Co-op', regionIndex: 2 },
  { name: 'David Mwangi', email: 'david.mwangi@farm.ke', farmName: 'Naivasha Rose Estate', regionIndex: 3 },
  { name: 'Samuel Kipchoge', email: 'samuel.kipchoge@farm.ke', farmName: 'Nandi Highlands Tea', regionIndex: 4 },
  { name: 'Isaac Ngetich', email: 'isaac.ngetich@farm.ke', farmName: 'Uasin Gishu Mixed Farm', regionIndex: 5 },
  { name: 'Mary Njeri', email: 'mary.njeri@farm.ke', farmName: 'Meru Avocado Growers', regionIndex: 6 },
  { name: 'Rose Achieng', email: 'rose.achieng@farm.ke', farmName: 'Kisii Tomato Hub', regionIndex: 7 },
  { name: 'John Mutua', email: 'john.mutua@farm.ke', farmName: 'Machakos Capsicum Gardens', regionIndex: 8 },
  { name: 'Joseph Okello', email: 'joseph.okello@farm.ug', farmName: 'Kabale Passion Growers', regionIndex: 9 },
  { name: 'Sarah Nakato', email: 'sarah.nakato@farm.ug', farmName: 'Mbale Banana Estate', regionIndex: 10 },
  { name: 'David Mugisha', email: 'david.mugisha@farm.ug', farmName: 'Masaka Fruit Co-op', regionIndex: 11 },
  { name: 'Abebe Bekele', email: 'abebe.bekele@farm.et', farmName: 'Sidama Avocado Union', regionIndex: 12 },
  { name: 'Mulu Tesfaye', email: 'mulu.tesfaye@farm.et', farmName: 'Jimma Orchards', regionIndex: 13 },
  { name: 'Juma Mushi', email: 'juma.mushi@farm.tz', farmName: 'Kilimanjaro Avocado Farm', regionIndex: 14 },
  { name: 'Neema Kessy', email: 'neema.kessy@farm.tz', farmName: 'Arusha Export Vegetables', regionIndex: 15 },
  { name: 'Pieter van der Merwe', email: 'pieter.vdm@farm.za', farmName: 'Limpopo Avo Estate', regionIndex: 16 },
  { name: 'Thandiwe Nkosi', email: 'thandiwe.nkosi@farm.za', farmName: 'Mpumalanga Subtropicals', regionIndex: 17 },
  { name: 'Johan Botha', email: 'johan.botha@farm.za', farmName: 'Cape Bloom Roses', regionIndex: 18 },
  { name: 'Miguel Hernández', email: 'miguel.hernandez@farm.mx', farmName: 'Michoacán Aguacates', regionIndex: 19 },
  { name: 'Camila Rojas', email: 'camila.rojas@farm.cl', farmName: 'Petorca Palta Orchards', regionIndex: 20 },
  { name: 'Carlos Mendoza', email: 'carlos.mendoza@farm.pe', farmName: 'La Libertad Agroexport', regionIndex: 21 },
  { name: 'Juan Restrepo', email: 'juan.restrepo@farm.co', farmName: 'Antioquia Avocado Fincas', regionIndex: 22 },
  { name: 'Ana Silva', email: 'ana.silva@farm.br', farmName: 'São Paulo Tropical Fruits', regionIndex: 23 },
  { name: 'Rajesh Nair', email: 'rajesh.nair@farm.in', farmName: 'Kerala Plantations', regionIndex: 24 },
  { name: 'Lucía Fernández', email: 'lucia.fernandez@farm.es', farmName: 'Málaga Subtropical', regionIndex: 25 },
];

export const BUYER_NAMES: string[] = [
  'Rotterdam Produce BV', 'Gulf Fresh Imports', 'Shanghai Green Co', 'London Exotics Ltd',
  'Barcelona Fruta SA', 'Tokyo Fresh KK', 'Nairobi Fresh Ltd', 'Cape Town Distributors',
  'Dubai Gulf Foods', 'Hamburg Import GmbH', 'Mombasa Export House', 'Paris Primeurs',
];

export function slug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function farmImages(farmerId: number, country: string): string[] {
  const c = (country || 'farm').replace(/\s+/g, '');
  return [0, 1, 2].map((i) => `https://loremflickr.com/1000/560/farm,field,${c}?lock=${farmerId * 29 + i + 1}`);
}
