import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { C, font, radius } from '@/theme';
import { Card, GradientButton, Row, Txt } from '@/ui';
import { DetailHeader, SideBadge } from '@/components/shared';
import { useApp } from '@/store';

function when(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function Orders() {
  const { orders, format } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DetailHeader title="My orders & bids" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {orders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 70 }}>
            <Txt size={44}>🧾</Txt>
            <Txt f={font.bold} size={17} color={C.ink} style={{ marginTop: 14 }}>
              No orders yet
            </Txt>
            <Txt f={font.body} size={13} color={C.muted} align="center" style={{ marginTop: 6, marginBottom: 20 }}>
              Place a spot buy or a limit bid from any produce or commodity page.
            </Txt>
            <GradientButton title="Browse produce" icon="leaf" onPress={() => router.push('/(tabs)/browse')} />
          </View>
        ) : (
          orders.map((o) => (
            <Card key={o.id} pad={14} style={{ marginBottom: 10 }}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <Row gap={8}>
                  {o.side && <SideBadge side={o.side} />}
                  <Txt f={font.bodyBold} size={11} color={C.muted}>
                    {o.orderKind ?? (o.kind === 'purchase' ? 'Spot' : 'Bid')}
                  </Txt>
                </Row>
                <Txt f={font.body} size={11} color={C.muted}>
                  {when(o.at)}
                </Txt>
              </Row>
              <Txt f={font.bold} size={15} color={C.ink} numberOfLines={1}>
                {o.title}
              </Txt>
              <Txt f={font.body} size={12.5} color={C.muted} numberOfLines={1}>
                {o.subtitle}
              </Txt>
              <Row style={{ justifyContent: 'space-between', marginTop: 10, alignItems: 'flex-end' }}>
                <Txt f={font.body} size={12} color={C.textSub}>
                  {o.quantity.toLocaleString()} {o.unit}
                </Txt>
                <Txt f={font.extra} size={17} color={C.brand}>
                  {format(o.totalKes)}
                </Txt>
              </Row>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
