// The 25 iTunda commodity categories with per-commodity attributes, mirroring
// the API seeder (catDetails) and Media.cs icon map. Used for the category
// board, icons, and the offline fallback seed generator.

export interface CatDetail {
  name: string;
  unit: string;
  minPrice: number;
  maxPrice: number;
  minQty: number;
  maxQty: number;
  varieties: string[];
  grades: string[];
  emoji: string;
  code: string; // twemoji codepoint
  keyword: string; // loremflickr keyword
}

const TW = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/72x72';
export const iconUrl = (code: string) => `${TW}/${code}.png`;

export const CAT_DETAILS: CatDetail[] = [
  { name: 'Avocados', unit: 'kg', minPrice: 55, maxPrice: 110, minQty: 100, maxQty: 5000, varieties: ['Hass', 'Fuerte', 'Jumbo Hass', 'Reed'], grades: ['Grade A', 'Grade B', 'Export Grade', 'Premium'], emoji: '🥑', code: '1f951', keyword: 'avocado' },
  { name: 'Macadamia Nuts', unit: 'kg', minPrice: 280, maxPrice: 480, minQty: 50, maxQty: 2000, varieties: ['Integrifolia', 'Tetraphylla', 'In-Shell', 'Kernel'], grades: ['Grade A', 'Grade 1', 'Organic', 'Premium'], emoji: '🌰', code: '1f330', keyword: 'macadamia,nuts' },
  { name: 'French Beans', unit: 'kg', minPrice: 80, maxPrice: 150, minQty: 50, maxQty: 800, varieties: ['Fine Bean', 'Extra Fine', 'Bobby Bean', 'Haricot Vert'], grades: ['Grade A', 'Grade B', 'Export Grade'], emoji: '🫘', code: '1fad8', keyword: 'green,beans' },
  { name: 'Tea', unit: 'kg', minPrice: 60, maxPrice: 200, minQty: 100, maxQty: 5000, varieties: ['CTC Black', 'Orthodox Green', 'White Tea', 'Purple Tea'], grades: ['KTDA Grade', 'Premium', 'Specialty'], emoji: '🍵', code: '1f375', keyword: 'tea,plantation' },
  { name: 'Peas & Mange Tout', unit: 'kg', minPrice: 90, maxPrice: 160, minQty: 50, maxQty: 600, varieties: ['Snow Peas', 'Sugar Snap', 'Mange Tout', 'Garden Peas'], grades: ['Grade A', 'Export Grade', 'Premium'], emoji: '🫛', code: '1fad8', keyword: 'peas,pods' },
  { name: 'Passion Fruit', unit: 'kg', minPrice: 70, maxPrice: 140, minQty: 50, maxQty: 1000, varieties: ['Purple Passion', 'Yellow Passion', 'Sweet Granadilla'], grades: ['Grade A', 'Grade B', 'Fresh Market'], emoji: '🍈', code: '1f349', keyword: 'passion,fruit' },
  { name: 'Mangoes', unit: 'kg', minPrice: 45, maxPrice: 120, minQty: 100, maxQty: 3000, varieties: ['Apple Mango', 'Tommy Atkins', 'Kent', 'Ngowe'], grades: ['Grade A', 'Grade B', 'Export Grade', 'Organic'], emoji: '🥭', code: '1f96d', keyword: 'mango' },
  { name: 'Bananas', unit: 'bunch', minPrice: 80, maxPrice: 180, minQty: 50, maxQty: 2000, varieties: ['Cavendish', 'Tissue Culture', 'Plantain', 'Apple Banana'], grades: ['Grade A', 'Grade B', 'Premium'], emoji: '🍌', code: '1f34c', keyword: 'banana,bunch' },
  { name: 'Tomatoes', unit: 'kg', minPrice: 40, maxPrice: 90, minQty: 100, maxQty: 3000, varieties: ['Cal-J', 'Money Maker', 'Cherry Tomato', 'Roma'], grades: ['Grade A', 'Grade B', 'Greenhouse'], emoji: '🍅', code: '1f345', keyword: 'tomato' },
  { name: 'Onions', unit: 'kg', minPrice: 30, maxPrice: 70, minQty: 200, maxQty: 8000, varieties: ['Red Creole', 'White Onion', 'Spring Onion', 'Shallots'], grades: ['Grade A', 'Grade B', 'Dry Onion'], emoji: '🧅', code: '1f9c5', keyword: 'onion,harvest' },
  { name: 'Capsicum & Peppers', unit: 'kg', minPrice: 100, maxPrice: 200, minQty: 50, maxQty: 1000, varieties: ['Red Capsicum', 'Yellow Capsicum', 'Green Capsicum', 'Chilli'], grades: ['Grade A', 'Export Grade', 'Premium'], emoji: '🫑', code: '1fad1', keyword: 'bell,pepper' },
  { name: 'Roses', unit: 'stem', minPrice: 8, maxPrice: 25, minQty: 500, maxQty: 50000, varieties: ['Red Naomi', 'Pink Avalanche', "White O'Hara", 'Yellow Texas'], grades: ['Grade A', 'Grade AA', 'Premium', 'Select'], emoji: '🌹', code: '1f339', keyword: 'roses,flowers' },
  { name: 'Coffee', unit: 'kg', minPrice: 350, maxPrice: 900, minQty: 60, maxQty: 4000, varieties: ['Arabica SL28', 'Arabica SL34', 'Ruiru 11', 'Bourbon', 'Robusta'], grades: ['AA', 'AB', 'Specialty', 'Grade 1'], emoji: '☕', code: '2615', keyword: 'coffee,beans' },
  { name: 'Apples', unit: 'kg', minPrice: 70, maxPrice: 160, minQty: 100, maxQty: 4000, varieties: ['Golden Delicious', 'Granny Smith', 'Royal Gala', 'Fuji'], grades: ['Grade A', 'Grade B', 'Class 1', 'Premium'], emoji: '🍎', code: '1f34e', keyword: 'apple,orchard' },
  { name: 'Pineapples', unit: 'kg', minPrice: 45, maxPrice: 110, minQty: 100, maxQty: 3000, varieties: ['MD2 Sweet Gold', 'Smooth Cayenne', 'Queen Victoria'], grades: ['Grade A', 'Export Grade', 'Class 1'], emoji: '🍍', code: '1f34d', keyword: 'pineapple' },
  { name: 'Oranges', unit: 'kg', minPrice: 40, maxPrice: 100, minQty: 150, maxQty: 6000, varieties: ['Valencia', 'Navel', 'Washington', 'Blood Orange'], grades: ['Grade A', 'Grade B', 'Class 1', 'Juice Grade'], emoji: '🍊', code: '1f34a', keyword: 'orange,citrus' },
  { name: 'Grapes', unit: 'kg', minPrice: 120, maxPrice: 320, minQty: 50, maxQty: 2000, varieties: ['Thompson Seedless', 'Crimson', 'Red Globe', 'Flame'], grades: ['Grade A', 'Export Grade', 'Premium'], emoji: '🍇', code: '1f347', keyword: 'grapes,vineyard' },
  { name: 'Lemons & Limes', unit: 'kg', minPrice: 60, maxPrice: 150, minQty: 80, maxQty: 3000, varieties: ['Eureka Lemon', 'Lisbon Lemon', 'Tahiti Lime', 'Persian Lime'], grades: ['Grade A', 'Class 1', 'Juice Grade'], emoji: '🍋', code: '1f34b', keyword: 'lemon,lime' },
  { name: 'Strawberries', unit: 'kg', minPrice: 180, maxPrice: 420, minQty: 30, maxQty: 1000, varieties: ['Chandler', 'Albion', 'Camarosa', 'Festival'], grades: ['Grade A', 'Premium', 'Class 1'], emoji: '🍓', code: '1f353', keyword: 'strawberry' },
  { name: 'Cashew Nuts', unit: 'kg', minPrice: 320, maxPrice: 720, minQty: 40, maxQty: 1500, varieties: ['W240', 'W320', 'Raw In-Shell', 'Roasted Kernel'], grades: ['W240', 'W320', 'Grade 1', 'Premium'], emoji: '🥜', code: '1f95c', keyword: 'cashew,nuts' },
  { name: 'Cocoa', unit: 'kg', minPrice: 260, maxPrice: 560, minQty: 100, maxQty: 5000, varieties: ['Criollo', 'Forastero', 'Trinitario', 'Fermented Beans'], grades: ['Grade 1', 'Grade 2', 'Fine Flavour'], emoji: '🍫', code: '1f36b', keyword: 'cocoa,beans' },
  { name: 'Vanilla', unit: 'kg', minPrice: 3500, maxPrice: 9000, minQty: 5, maxQty: 200, varieties: ['Bourbon', 'Grade A Gourmet', 'Grade B Extract'], grades: ['Gourmet', 'Extract', 'Grade A', 'Grade B'], emoji: '🌼', code: '1f33c', keyword: 'vanilla,pods' },
  { name: 'Ginger', unit: 'kg', minPrice: 90, maxPrice: 220, minQty: 80, maxQty: 3000, varieties: ['Fresh Rhizome', 'Organic', 'Dried'], grades: ['Grade A', 'Export Grade', 'Organic'], emoji: '🫚', code: '1fada', keyword: 'ginger,root' },
  { name: 'Green Chillies', unit: 'kg', minPrice: 80, maxPrice: 200, minQty: 40, maxQty: 1200, varieties: ["Bird's Eye", 'Cayenne', 'Jalapeño', 'Serrano'], grades: ['Grade A', 'Export Grade', 'Class 1'], emoji: '🌶️', code: '1f336', keyword: 'chilli,pepper' },
  { name: 'Sweet Potatoes', unit: 'kg', minPrice: 35, maxPrice: 90, minQty: 150, maxQty: 6000, varieties: ['Orange Flesh', 'Purple', 'White', 'Beauregard'], grades: ['Grade A', 'Grade B', 'Class 1'], emoji: '🍠', code: '1f360', keyword: 'sweet,potato' },
];

export const CATEGORIES: string[] = CAT_DETAILS.map((c) => c.name);

const BY_NAME: Record<string, CatDetail> = Object.fromEntries(CAT_DETAILS.map((c) => [c.name, c]));

export function catDetail(name: string): CatDetail {
  return BY_NAME[name] ?? CAT_DETAILS[0];
}

export function categoryEmoji(name: string): string {
  return BY_NAME[name]?.emoji ?? '🌿';
}

export function categoryIconUrl(name: string): string {
  return iconUrl(BY_NAME[name]?.code ?? '1f33f');
}

export function produceImage(category: string, id: number): string {
  const kw = BY_NAME[category]?.keyword ?? 'farm,produce';
  return `https://loremflickr.com/800/600/${kw}?lock=${id}`;
}

export function produceGallery(category: string, id: number): string[] {
  const kw = BY_NAME[category]?.keyword ?? 'farm,produce';
  return [0, 1, 2, 3].map((i) => `https://loremflickr.com/800/600/${kw}?lock=${id * 17 + i + 1}`);
}
