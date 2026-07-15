// iTunda design system — ported from the web app (farm-to-fork commodity
// marketplace). White-on-green light theme with a harvest-gold CTA accent.
// Fonts: Poppins (headings) + Inter (body), matching the web.
//
// Token semantics (so shared ui.tsx / charts.tsx render on light surfaces):
//   ink / text  → PRIMARY foreground (deep green-ink)
//   bg          → screen background (fresh page tint)
//   card        → elevated surface (white)
//   line/line2  → subtle borders

export const C = {
  brand: '#0E7A3E', // primary green
  brandLight: '#16A34A', // fresh green
  brandDark: '#0A4A26', // deep green (nav/hero/footer)
  brandDeep: '#06371C',
  brandMuted: '#DCFCE7', // light green tint for badges/chips

  accent: '#16A34A',
  accentEnd: '#22B15A',
  gold: '#F4A621', // harvest gold — primary CTA / prices
  goldLight: '#FFBB3D',

  // foreground (dark green-ink on light)
  ink: '#0B3A22',
  ink2: '#123E28',
  heroDark: '#06371C',
  navy: '#0A4A26',
  navy2: '#0C5E30',

  bg: '#F3FAF5', // page tint
  bgElevated: '#E9F6EE',
  tint: '#E9F6EE',
  card: '#FFFFFF',
  card2: '#F3FAF5',
  line: '#DBEAE1',
  line2: '#E9F6EE',

  text: '#102A1C',
  textSub: '#496155',
  muted: '#5C6C63',
  subInk: '#3A4C43',

  white: '#FFFFFF',
  black: '#000000',

  // Semantic / status — BUY green / SELL red like the trade desk
  live: '#16A34A',
  liveGlow: '#22C55E',
  buy: '#0E7A3E',
  buyBright: '#1FAE74',
  sell: '#C0392B',
  sellBright: '#E5484D',
  red: '#C0392B',
  yellow: '#F4A621',
  green: '#16A34A',
  orange: '#F4A621',
  blue: '#1565C0',

  // charts
  chart1: '#0E7A3E',
  chart2: '#F4A621',
  chart3: '#16A34A',
  chart4: '#1565C0',
  chart5: '#C0392B',
} as const;

export const GRAD = {
  brand: ['#0E7A3E', '#0A4A26'] as [string, string],
  brandGlow: ['#16A34A', '#0E7A3E'] as [string, string],
  hero: ['#0A4A26', '#0C5E30', '#0E7A3E'] as [string, string, string],
  deep: ['#06371C', '#0A4A26'] as [string, string],
  gold: ['#F4A621', '#FFBB3D'] as [string, string],
  fresh: ['#16A34A', '#22B15A'] as [string, string],
};

export function parseGradient(color: string, fallback: [string, string] = GRAD.brand): [string, string] {
  const matches = color.match(/#([0-9a-fA-F]{6})/g);
  if (matches && matches.length >= 2) return [matches[0], matches[1]];
  if (matches && matches.length === 1) return [matches[0], matches[0]];
  return fallback;
}

export const font = {
  // headings — Poppins
  black: 'Poppins_800ExtraBold',
  extra: 'Poppins_800ExtraBold',
  bold: 'Poppins_700Bold',
  semi: 'Poppins_600SemiBold',
  head: 'Poppins_500Medium',
  // body — Inter
  body: 'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  // numbers / stats
  mono: 'Inter_600SemiBold',
  monoBold: 'Inter_700Bold',
} as const;

export const radius = { sm: 10, md: 14, lg: 16, xl: 20, xxl: 28, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#0C3C22',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  soft: {
    shadowColor: '#0C3C22',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  brand: {
    shadowColor: '#0E7A3E',
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
} as const;
