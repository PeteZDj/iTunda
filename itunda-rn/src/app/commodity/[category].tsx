import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { LineChart } from '@/charts';
import { fetchBuyOrders, fetchCommodities, fetchProduce } from '@/data/api';
import type { BuyOrder, Commodity, Produce } from '@/data/types';
import { categoryEmoji, catDetail } from '@/lib/categories';
import { C, GRAD, font, radius } from '@/theme';
import { Card, Chip, GradientButton, Row, StatBlock, Txt } from '@/ui';
import { ChangeText, DetailHeader, OrderRow, ProduceCard, Rail, sparkData } from '@/components/shared';
import { useApp } from '@/store';

const W = Dimensions.get('window').width;

export default function CommodityDetail() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const cat = decodeURIComponent(category ?? '');
  const { format } = useApp();
  const [c, setC] = useState<Commodity | null>(null);
  const [orders, setOrders] = useState<BuyOrder[]>([]);
  const [listings, setListings] = useState<Produce[]>([]);
  const [range, setRange] = useState<'1W' | '1M' | '1Y'>('1M');
  const [trade, setTrade] = useState(false);

  useEffect(() => {
    fetchCommodities().then((list) => setC(list.find((x) => x.category === cat) ?? null));
    fetchBuyOrders({ commodity: cat }).then(setOrders);
    fetchProduce({ category: cat, limit: 10 }).then(setListings);
  }, [cat]);

  const cd = catDetail(cat);
  const points = range === '1W' ? 8 : range === '1Y' ? 26 : 16;
  const chart = useMemo(() => sparkData(cat + range, points), [cat, range, points]);
  const up = (c?.changePct ?? 0) >= 0;

  const bids = orders.filter((o) => o.side === 'Buy').sort((a, b) => b.targetPrice - a.targetPrice);
  const asks = orders.filter((o) => o.side === 'Sell').sort((a, b) => a.targetPrice - b.targetPrice);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DetailHeader title={cat} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <LinearGradientHeader cat={cat} c={c} format={format} />

        <View style={{ padding: 16 }}>
          {/* Chart */}
          <Card>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Txt f={font.bold} size={15} color={C.ink}>
                Price trend
              </Txt>
              <Row gap={6}>
                {(['1W', '1M', '1Y'] as const).map((r) => (
                  <Chip key={r} label={r} active={range === r} onPress={() => setRange(r)} />
                ))}
              </Row>
            </Row>
            <LineChart data={chart} width={W - 64} height={160} color={up ? C.buyBright : C.sellBright} />
          </Card>

          {/* Stats */}
          {c && (
            <Card style={{ marginTop: 14 }}>
              <Row>
                <StatBlock value={format(c.low)} label="Low" />
                <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
                <StatBlock value={format(c.high)} label="High" color={C.gold} />
                <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
                <StatBlock value={String(c.listings)} label="Listings" color={C.brandLight} />
              </Row>
              <Row style={{ marginTop: 14, justifyContent: 'space-between' }}>
                <View style={{ flex: 1, backgroundColor: C.brandMuted, borderRadius: radius.sm, padding: 12 }}>
                  <Txt f={font.body} size={11} color={C.buy}>
                    BID
                  </Txt>
                  <Txt f={font.monoBold} size={16} color={C.buy}>
                    {format(c.bid)}
                  </Txt>
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1, backgroundColor: '#FBE3E1', borderRadius: radius.sm, padding: 12 }}>
                  <Txt f={font.body} size={11} color={C.sell}>
                    ASK
                  </Txt>
                  <Txt f={font.monoBold} size={16} color={C.sell}>
                    {format(c.ask)}
                  </Txt>
                </View>
              </Row>
            </Card>
          )}

          {/* Actions */}
          <Row gap={10} style={{ marginTop: 14 }}>
            <GradientButton title="Buy" icon="cart" colors={[C.buy, C.brandDark]} onPress={() => setTrade(true)} style={{ flex: 1 }} />
            <GradientButton title="Sell" icon="trending-up" colors={[C.sell, '#8E2117']} onPress={() => setTrade(true)} style={{ flex: 1 }} />
          </Row>

          {/* Order book */}
          <Txt f={font.bold} size={17} color={C.ink} style={{ marginTop: 22, marginBottom: 10 }}>
            Order book
          </Txt>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Card pad={12} style={{ flex: 1 }}>
              <Txt f={font.bodyBold} size={12} color={C.buy} style={{ marginBottom: 6 }}>
                BIDS ({bids.length})
              </Txt>
              {bids.slice(0, 6).map((o) => (
                <Row key={o.id} style={{ justifyContent: 'space-between', paddingVertical: 5 }}>
                  <Txt f={font.monoBold} size={12.5} color={C.buy}>
                    {format(o.targetPrice)}
                  </Txt>
                  <Txt f={font.body} size={11} color={C.muted}>
                    {o.quantity.toLocaleString()}
                  </Txt>
                </Row>
              ))}
              {bids.length === 0 && <Txt f={font.body} size={12} color={C.muted}>No bids</Txt>}
            </Card>
            <Card pad={12} style={{ flex: 1 }}>
              <Txt f={font.bodyBold} size={12} color={C.sell} style={{ marginBottom: 6 }}>
                OFFERS ({asks.length})
              </Txt>
              {asks.slice(0, 6).map((o) => (
                <Row key={o.id} style={{ justifyContent: 'space-between', paddingVertical: 5 }}>
                  <Txt f={font.monoBold} size={12.5} color={C.sell}>
                    {format(o.targetPrice)}
                  </Txt>
                  <Txt f={font.body} size={11} color={C.muted}>
                    {o.quantity.toLocaleString()}
                  </Txt>
                </Row>
              ))}
              {asks.length === 0 && <Txt f={font.body} size={12} color={C.muted}>No offers</Txt>}
            </Card>
          </Row>

          {/* Listings */}
          {listings.length > 0 && (
            <View style={{ marginTop: 22 }}>
              <Txt f={font.bold} size={17} color={C.ink} style={{ marginBottom: 12 }}>
                Available {cat}
              </Txt>
              <Rail>
                {listings.map((p) => (
                  <ProduceCard key={p.id} item={p} width={190} />
                ))}
              </Rail>
            </View>
          )}
        </View>
      </ScrollView>

      <TradeSheetLazy open={trade} onClose={() => setTrade(false)} category={cat} unit={c?.unit ?? cd.unit} refPrice={c?.avgPrice ?? Math.round((cd.minPrice + cd.maxPrice) / 2)} />
    </View>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import { TradeSheet } from '@/components/shared';
function TradeSheetLazy(props: React.ComponentProps<typeof TradeSheet>) {
  return <TradeSheet {...props} />;
}

function LinearGradientHeader({ cat, c, format }: { cat: string; c: Commodity | null; format: (k: number) => string }) {
  return (
    <LinearGradient colors={GRAD.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <Row gap={14}>
        <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: '#FFFFFF1E', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF33' }}>
          <Txt size={32}>{categoryEmoji(cat)}</Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt f={font.black} size={24} color={C.white}>
            {cat}
          </Txt>
          {c && (
            <Row gap={10} style={{ marginTop: 4 }}>
              <Txt f={font.monoBold} size={18} color={C.gold}>
                {format(c.avgPrice)}
              </Txt>
              <ChangeText pct={c.changePct} size={14} />
            </Row>
          )}
        </View>
      </Row>
    </LinearGradient>
  );
}
