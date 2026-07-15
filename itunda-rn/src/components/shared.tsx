import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from '@/charts';
import { flagUrl } from '@/lib/currency';
import { C, GRAD, font, radius, shadow } from '@/theme';
import { Badge, Card, GradientButton, Row, Txt } from '@/ui';
import { CURRENCIES, useApp } from '@/store';
import type { BuyOrder, Commodity, Produce } from '@/data/types';

/* ── Flag image ───────────────────────────────────────────────────────── */
export function Flag({ code, w = 20 }: { code?: string; w?: number }) {
  if (!code) return null;
  return (
    <Image
      source={{ uri: flagUrl(code, '40x30') }}
      style={{ width: w, height: w * 0.75, borderRadius: 3, backgroundColor: C.line }}
      contentFit="cover"
    />
  );
}

/* ── Green top bar (matches web navbar) ───────────────────────────────── */
export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={GRAD.deep}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 8, paddingBottom: 14, paddingHorizontal: 18 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.push('/(tabs)')}>
          <Row gap={8}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF33' }}>
              <Txt size={18}>🌿</Txt>
            </View>
            <View>
              <Txt f={font.extra} size={18} color={C.white}>
                {title ?? 'iTunda'}
              </Txt>
              {subtitle && (
                <Txt f={font.body} size={10.5} color="#BFEAD0">
                  {subtitle}
                </Txt>
              )}
            </View>
          </Row>
        </Pressable>
        <Row gap={8}>
          <RegionButton />
          <CurrencyButton />
        </Row>
      </Row>
    </LinearGradient>
  );
}

/* ── Currency picker button + modal ───────────────────────────────────── */
export function CurrencyButton() {
  const { currency, setCurrency } = useApp();
  const [open, setOpen] = useState(false);
  const cur = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF1E', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#FFFFFF33' }}>
        <Flag code={cur.flag} w={18} />
        <Txt f={font.bodyBold} size={12} color={C.white}>
          {cur.code}
        </Txt>
        <Ionicons name="chevron-down" size={12} color={C.white} />
      </Pressable>
      <PickerModal
        title="Currency"
        open={open}
        onClose={() => setOpen(false)}
        items={CURRENCIES.map((c) => ({ key: c.code, label: `${c.code} · ${c.name}`, flag: c.flag, active: c.code === currency }))}
        onSelect={(k) => {
          setCurrency(k);
          setOpen(false);
        }}
      />
    </>
  );
}

/* ── Region picker button + modal ─────────────────────────────────────── */
import { ZONES, REGIONS } from '@/lib/regions';
export function RegionButton() {
  const { zone, region, setZone, setRegion, clearRegion } = useApp();
  const [open, setOpen] = useState(false);
  const label = region ?? (zone ? `Zone ${zone}` : 'All origins');
  const items = [
    { key: 'all', label: 'All origins', active: !zone && !region },
    ...Object.entries(ZONES).map(([z, name]) => ({ key: `zone:${z}`, label: name, active: zone === Number(z) })),
    ...REGIONS.map((r) => ({ key: `region:${r.name}`, label: `${r.name}, ${r.country}`, flag: r.countryCode, active: region === r.name })),
  ];
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF1E', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#FFFFFF33' }}>
        <Ionicons name="globe-outline" size={13} color={C.white} />
        <Txt f={font.bodyBold} size={12} color={C.white} numberOfLines={1} style={{ maxWidth: 78 }}>
          {label}
        </Txt>
      </Pressable>
      <PickerModal
        title="Origin"
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        onSelect={(k) => {
          if (k === 'all') clearRegion();
          else if (k.startsWith('zone:')) setZone(Number(k.slice(5)));
          else if (k.startsWith('region:')) setRegion(k.slice(7));
          setOpen(false);
        }}
      />
    </>
  );
}

/* ── Generic bottom-sheet picker ──────────────────────────────────────── */
export function PickerModal({
  title,
  open,
  onClose,
  items,
  onSelect,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  items: { key: string; label: string; flag?: string; active?: boolean }[];
  onSelect: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12, maxHeight: '76%' }}>
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.line }} />
          </View>
          <Txt f={font.bold} size={17} color={C.ink} style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            {title}
          </Txt>
          <ScrollView>
            {items.map((it) => (
              <Pressable
                key={it.key}
                onPress={() => onSelect(it.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 13, backgroundColor: it.active ? C.brandMuted : 'transparent' }}>
                {it.flag && <Flag code={it.flag} w={22} />}
                <Txt f={it.active ? font.bodyBold : font.body} size={14.5} color={it.active ? C.brand : C.text} style={{ flex: 1 }}>
                  {it.label}
                </Txt>
                {it.active && <Ionicons name="checkmark-circle" size={18} color={C.brand} />}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Detail header (back / title) ─────────────────────────────────────── */
export function DetailHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={GRAD.deep} style={{ paddingTop: insets.top + 6, paddingBottom: 12, paddingHorizontal: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <Ionicons name="chevron-back" size={24} color={C.white} />
          <Txt f={font.bold} size={17} color={C.white} numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Txt>
        </Pressable>
        {right}
      </Row>
    </LinearGradient>
  );
}

/* ── Side badge (BUY / SELL) ──────────────────────────────────────────── */
export function SideBadge({ side, size = 12 }: { side: string; size?: number }) {
  const buy = side === 'Buy';
  return (
    <View style={{ backgroundColor: buy ? C.brandMuted : '#FBE3E1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Txt f={font.bodyBold} size={size} color={buy ? C.buy : C.sell}>
        {buy ? 'BUY' : 'SELL'}
      </Txt>
    </View>
  );
}

export function ChangeText({ pct, size = 13 }: { pct: number; size?: number }) {
  const up = pct >= 0;
  return (
    <Row gap={2}>
      <Ionicons name={up ? 'caret-up' : 'caret-down'} size={size} color={up ? C.buyBright : C.sellBright} />
      <Txt f={font.monoBold} size={size} color={up ? C.buyBright : C.sellBright}>
        {Math.abs(pct).toFixed(2)}%
      </Txt>
    </Row>
  );
}

/* ── Produce card ─────────────────────────────────────────────────────── */
export function ProduceCard({ item, width }: { item: Produce; width?: number }) {
  const { format } = useApp();
  return (
    <Pressable onPress={() => router.push(`/produce/${item.id}`)} style={{ width }}>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <View>
          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 128, backgroundColor: C.line2 }} contentFit="cover" transition={200} />
          <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 6 }}>
            <View style={{ backgroundColor: '#0A4A26E6', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Image source={{ uri: item.iconUrl }} style={{ width: 13, height: 13 }} />
              <Txt f={font.bodyBold} size={10} color={C.white}>
                {item.category}
              </Txt>
            </View>
          </View>
          {item.isExportReady && (
            <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: C.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Txt f={font.bodyBold} size={9.5} color={C.brandDark}>
                EXPORT
              </Txt>
            </View>
          )}
        </View>
        <View style={{ padding: 12 }}>
          <Txt f={font.bold} size={14.5} color={C.ink} numberOfLines={1}>
            {item.name}
          </Txt>
          <Row gap={5} style={{ marginTop: 3 }}>
            <Flag code={item.countryCode} w={16} />
            <Txt f={font.body} size={11.5} color={C.muted} numberOfLines={1} style={{ flex: 1 }}>
              {item.region}, {item.country}
            </Txt>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 8, alignItems: 'flex-end' }}>
            <View>
              <Txt f={font.extra} size={16} color={C.brand}>
                {format(item.price)}
              </Txt>
              <Txt f={font.body} size={10} color={C.muted}>
                per {item.unit} · {item.gradeQuality}
              </Txt>
            </View>
            <View style={{ backgroundColor: C.brand, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 }}>
              <Txt f={font.bodyBold} size={12} color={C.white}>
                Buy
              </Txt>
            </View>
          </Row>
        </View>
      </Card>
    </Pressable>
  );
}

/* ── Commodity board row ──────────────────────────────────────────────── */
export function CommodityRow({ c }: { c: Commodity }) {
  const { format } = useApp();
  return (
    <Pressable onPress={() => router.push(`/commodity/${encodeURIComponent(c.category)}`)}>
      <Row style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line2, gap: 12 }}>
        <Image source={{ uri: c.iconUrl }} style={{ width: 30, height: 30 }} />
        <View style={{ flex: 1 }}>
          <Txt f={font.bodyBold} size={14} color={C.ink} numberOfLines={1}>
            {c.category}
          </Txt>
          <Txt f={font.body} size={11} color={C.muted}>
            {c.listings} listings · per {c.unit}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt f={font.monoBold} size={14} color={C.ink}>
            {format(c.avgPrice)}
          </Txt>
          <ChangeText pct={c.changePct} size={11} />
        </View>
      </Row>
    </Pressable>
  );
}

/* ── Order book row ───────────────────────────────────────────────────── */
export function OrderRow({ o }: { o: BuyOrder }) {
  const { format } = useApp();
  return (
    <Row style={{ paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: C.line2 }}>
      <SideBadge side={o.side} />
      <View style={{ flex: 1 }}>
        <Txt f={font.bodyBold} size={13} color={C.ink} numberOfLines={1}>
          {o.buyerName}
        </Txt>
        <Row gap={5}>
          <Flag code={o.countryCode} w={14} />
          <Txt f={font.body} size={11} color={C.muted} numberOfLines={1}>
            {o.kind} · {o.quantity.toLocaleString()} {o.unit}
          </Txt>
        </Row>
      </View>
      <Txt f={font.monoBold} size={13} color={o.side === 'Buy' ? C.buy : C.sell}>
        {format(o.targetPrice)}
      </Txt>
    </Row>
  );
}

/* ── Sparkline (synthetic price history) ──────────────────────────────── */
export function sparkData(seed: string, points = 24): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  let v = 50 + (h % 30);
  for (let i = 0; i < points; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    v += ((h % 100) / 100 - 0.48) * 8;
    v = Math.max(15, Math.min(95, v));
    out.push(Math.round(v));
  }
  return out;
}

/* ── Trade sheet (place spot/limit/futures/put order) ─────────────────── */
export function TradeSheet({
  open,
  onClose,
  category,
  unit,
  refPrice,
  produce,
}: {
  open: boolean;
  onClose: () => void;
  category: string;
  unit: string;
  refPrice: number;
  produce?: Produce;
}) {
  const insets = useSafeAreaInsets();
  const { format, convert, currency, symbol, placeOrder, user } = useApp();
  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy');
  const [kind, setKind] = useState<'Spot' | 'Limit' | 'Futures' | 'Put'>('Spot');
  const [qty, setQty] = useState('50');
  const [price, setPrice] = useState(String(Math.round(convert(refPrice))));
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPrice(String(Math.round(convert(refPrice))));
      setDone(null);
    }
  }, [open, refPrice, convert]);

  const qn = Number(qty) || 0;
  const pn = Number(price) || 0;
  const rate = convert(1) || 1;
  const kesPrice = kind === 'Spot' ? refPrice : pn / rate;
  const totalKes = qn * kesPrice;

  const submit = () => {
    placeOrder({
      kind: kind === 'Spot' && side === 'Buy' && produce ? 'purchase' : 'bid',
      title: produce ? `${produce.name} · ${category}` : category,
      subtitle: `${kind} ${side}${produce ? ` · ${produce.farmName}` : ''}`,
      side,
      orderKind: kind,
      quantity: qn,
      unit,
      totalKes,
    });
    setDone(`${side} order placed · ${qn.toLocaleString()} ${unit} of ${category}`);
  };

  const KINDS: ('Spot' | 'Limit' | 'Futures' | 'Put')[] = ['Spot', 'Limit', 'Futures', 'Put'];
  const KIND_BLURB: Record<string, string> = {
    Spot: 'Buy now at the live market price.',
    Limit: 'Bid at your own target price.',
    Futures: 'Forward contract with a future delivery date.',
    Put: 'Right to sell at a set price later.',
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16, paddingHorizontal: 18, paddingTop: 10 }}>
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.line }} />
          </View>

          {done ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.brandMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Ionicons name="checkmark" size={34} color={C.brand} />
              </View>
              <Txt f={font.bold} size={18} color={C.ink} align="center">
                Order confirmed
              </Txt>
              <Txt f={font.body} size={13} color={C.muted} align="center" style={{ marginTop: 6 }}>
                {done}
              </Txt>
              <GradientButton title="Done" onPress={onClose} style={{ marginTop: 20, alignSelf: 'stretch' }} />
            </View>
          ) : (
            <>
              <Txt f={font.extra} size={19} color={C.ink}>
                Trade {category}
              </Txt>
              <Txt f={font.body} size={12.5} color={C.muted} style={{ marginBottom: 12 }}>
                Live ref {format(refPrice)} / {unit}
              </Txt>

              {/* side */}
              <Row style={{ backgroundColor: C.line2, borderRadius: radius.md, padding: 4, marginBottom: 12 }}>
                {(['Buy', 'Sell'] as const).map((sd) => (
                  <Pressable key={sd} onPress={() => setSide(sd)} style={{ flex: 1, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: side === sd ? (sd === 'Buy' ? C.buy : C.sell) : 'transparent', alignItems: 'center' }}>
                    <Txt f={font.bodyBold} size={14} color={side === sd ? C.white : C.muted}>
                      {sd.toUpperCase()}
                    </Txt>
                  </Pressable>
                ))}
              </Row>

              {/* kind */}
              <Row gap={8} style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                {KINDS.map((k) => (
                  <Pressable key={k} onPress={() => setKind(k)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: kind === k ? C.brand : C.card, borderWidth: 1, borderColor: kind === k ? C.brand : C.line }}>
                    <Txt f={font.bodySemi} size={12.5} color={kind === k ? C.white : C.textSub}>
                      {k}
                    </Txt>
                  </Pressable>
                ))}
              </Row>
              <Txt f={font.body} size={12} color={C.muted} style={{ marginBottom: 14 }}>
                {KIND_BLURB[kind]}
              </Txt>

              {/* qty + price */}
              <Row gap={12} style={{ marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Txt f={font.bodySemi} size={12} color={C.textSub} style={{ marginBottom: 5 }}>
                    Quantity ({unit})
                  </Txt>
                  <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" style={inp} placeholderTextColor={C.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt f={font.bodySemi} size={12} color={C.textSub} style={{ marginBottom: 5 }}>
                    Price ({symbol}) {kind === 'Spot' ? '· market' : ''}
                  </Txt>
                  <TextInput value={price} onChangeText={setPrice} editable={kind !== 'Spot'} keyboardType="numeric" style={[inp, kind === 'Spot' && { opacity: 0.6 }]} placeholderTextColor={C.muted} />
                </View>
              </Row>

              <Card style={{ marginBottom: 14 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt f={font.body} size={13} color={C.muted}>
                    Est. total ({currency})
                  </Txt>
                  <Txt f={font.extra} size={18} color={C.brand}>
                    {format(totalKes)}
                  </Txt>
                </Row>
              </Card>

              <GradientButton
                title={`${side} ${qn.toLocaleString()} ${unit} · ${kind}`}
                icon={side === 'Buy' ? 'cart' : 'trending-up'}
                colors={side === 'Buy' ? [C.buy, C.brandDark] : [C.sell, '#8E2117']}
                onPress={submit}
              />
              {!user && (
                <Txt f={font.body} size={11} color={C.muted} align="center" style={{ marginTop: 10 }}>
                  Posting as a guest — sign in from More to track your orders.
                </Txt>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const inp = {
  backgroundColor: C.card,
  borderWidth: 2,
  borderColor: C.line,
  borderRadius: radius.sm,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontFamily: font.bodySemi,
  fontSize: 15,
  color: C.ink,
} as const;

/* ── Section rail (horizontal) ────────────────────────────────────────── */
export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 12 }}>
      {children}
    </ScrollView>
  );
}

/* ── Live ticker (auto-scrolling marquee) ─────────────────────────────── */
export function Ticker({ items }: { items: Commodity[] }) {
  const { format } = useApp();
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);

  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const anim = Animated.loop(
      Animated.timing(x, { toValue: -w, duration: Math.max(16000, w * 22), easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [w, x]);

  if (!items.length) return null;
  const Strip = ({ measure }: { measure?: boolean }) => (
    <View style={{ flexDirection: 'row' }} onLayout={measure ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {items.map((c) => (
        <Row key={c.category} gap={6} style={{ paddingHorizontal: 12 }}>
          <Image source={{ uri: c.iconUrl }} style={{ width: 15, height: 15 }} />
          <Txt f={font.bodyBold} size={12} color={C.ink}>
            {c.category}
          </Txt>
          <Txt f={font.mono} size={12} color={C.muted}>
            {format(c.avgPrice)}
          </Txt>
          <ChangeText pct={c.changePct} size={11} />
        </Row>
      ))}
    </View>
  );
  return (
    <View style={{ backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8, overflow: 'hidden' }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>
        <Strip measure />
        <Strip />
      </Animated.View>
    </View>
  );
}

/* ── Mini price chart card ────────────────────────────────────────────── */
export function PriceCard({ category, width }: { category: string; width: number }) {
  const data = sparkData(category, 24);
  const up = data[data.length - 1] >= data[0];
  return <LineChart data={data} width={width} height={130} color={up ? C.buyBright : C.sellBright} />;
}

export { Badge };
