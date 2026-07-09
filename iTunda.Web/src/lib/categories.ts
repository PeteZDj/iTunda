// Emoji icons for produce categories (mirrors the API Media.cs Twemoji map so
// the web can render category icons without an extra round-trip).

export const CATEGORY_ICONS: Record<string, string> = {
  'Avocados': '🥑',
  'Macadamia Nuts': '🌰',
  'French Beans': '🫛',
  'Tea': '🍵',
  'Peas & Mange Tout': '🫛',
  'Passion Fruit': '🍈',
  'Mangoes': '🥭',
  'Bananas': '🍌',
  'Tomatoes': '🍅',
  'Onions': '🧅',
  'Capsicum & Peppers': '🫑',
  'Roses': '🌹',
  'Coffee': '☕',
  'Apples': '🍎',
  'Pineapples': '🍍',
  'Oranges': '🍊',
  'Grapes': '🍇',
  'Lemons & Limes': '🍋',
  'Strawberries': '🍓',
  'Cashew Nuts': '🥜',
  'Cocoa': '🍫',
  'Vanilla': '🌼',
  'Ginger': '🫚',
  'Green Chillies': '🌶️',
  'Sweet Potatoes': '🍠',
};

export function categoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '🌿';
}
