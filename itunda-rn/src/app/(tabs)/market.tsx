import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { fetchBuyOrders, fetchCommodities } from '@/data/api';
import type { BuyOrder, Commodity } from '@/data/types';
import { C, font, radius } from '@/theme';
import { Card, Chip, GradientButton, Loading, Row, StatBlock, Txt } from '@/ui';
import { ChangeText, CommodityRow, OrderRow, Ticker, TopBar, TradeSheet } from '@/components/shared';
import { useApp } from '@/store';

export default function Market() {
  const { format } = useApp();
  const [tab, setTab] = useState<'board' | 'orders'>('board');
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [orders, setOrders] = useState<BuyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<'All' | 'Buy' | 'Sell'>('All');
  const [sort, setSort] = useState<'name' | 'change' | 'price'>('change');
  const [trade, setTrade] = useState(false);

  useEffect(() => {
    Promise.all([fetchCommodities(), fetchBuyOrders()]).then(([c, o]) => {
      setCommodities(c);
      setOrders(o);
      setLoading(false);
    });
  }, []);

  const board = useMemo(() => {
    const arr = [...commodities];
    if (sort === 'name') arr.sort((a, b) => a.category.localeCompare(b.category));
    else if (sort === 'price') arr.sort((a, b) => b.avgPrice - a.avgPrice);
    else arr.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
    return arr;
  }, [commodities, sort]);

  const filteredOrders = useMemo(() => (side === 'All' ? orders : orders.filter((o) => o.side === side)), [orders, side]);
  const bids = orders.filter((o) => o.side === 'Buy').length;
  const asks = orders.filter((o) => o.side === 'Sell').length;
  const topMover = board[0];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <TopBar subtitle="Commodity exchange" />
        <Loading />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar subtitle="Commodity exchange" />
      <Ticker items={commodities} />

      {/* Summary */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Card>
          <Row>
            <StatBlock value={String(commodities.length)} label="Commodities" />
            <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
            <StatBlock value={String(bids)} label="Buy orders" color={C.buy} />
            <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
            <StatBlock value={String(asks)} label="Sell offers" color={C.sell} />
          </Row>
        </Card>
      </View>

      {/* Tabs */}
      <Row style={{ marginHorizontal: 16, marginTop: 14, backgroundColor: C.line2, borderRadius: radius.md, padding: 4 }}>
        {(['board', 'orders'] as const).map((t) => (
          <View key={t} style={{ flex: 1 }}>
            <Chip label={t === 'board' ? 'Price board' : 'Order book'} active={tab === t} onPress={() => setTab(t)} />
          </View>
        ))}
      </Row>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {tab === 'board' ? (
          <>
            <Row gap={6} style={{ marginBottom: 10 }}>
              <Chip label="Movers" active={sort === 'change'} onPress={() => setSort('change')} />
              <Chip label="Name" active={sort === 'name'} onPress={() => setSort('name')} />
              <Chip label="Price" active={sort === 'price'} onPress={() => setSort('price')} />
            </Row>
            <Card pad={16}>
              {board.map((c) => (
                <CommodityRow key={c.category} c={c} />
              ))}
            </Card>
          </>
        ) : (
          <>
            <Row gap={6} style={{ marginBottom: 10 }}>
              {(['All', 'Buy', 'Sell'] as const).map((s) => (
                <Chip key={s} label={s === 'All' ? 'All' : s === 'Buy' ? 'Buy orders' : 'Sell offers'} active={side === s} onPress={() => setSide(s)} activeColor={s === 'Sell' ? C.sell : C.brand} />
              ))}
            </Row>
            <Card pad={16}>
              {filteredOrders.map((o) => (
                <OrderRow key={o.id} o={o} />
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      {/* FAB post order */}
      <View style={{ position: 'absolute', bottom: 84, left: 16, right: 16 }}>
        <GradientButton title="Post a buy / sell order" icon="add-circle" onPress={() => setTrade(true)} />
      </View>

      {topMover && (
        <TradeSheet open={trade} onClose={() => setTrade(false)} category={topMover.category} unit={topMover.unit} refPrice={topMover.avgPrice} />
      )}
    </View>
  );
}
