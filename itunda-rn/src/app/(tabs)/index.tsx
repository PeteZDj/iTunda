import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { fetchCommodities, fetchProduce, fetchRegions } from '@/data/api';
import type { Commodity, Produce, Region } from '@/data/types';
import { CAT_DETAILS } from '@/lib/categories';
import { C, GRAD, font, radius, shadow } from '@/theme';
import { Card, GradientButton, Row, SectionTitle, StatBlock, Txt } from '@/ui';
import { CommodityRow, Flag, ProduceCard, Rail, Ticker, TopBar } from '@/components/shared';
import { useApp } from '@/store';

const W = Dimensions.get('window').width;

export default function Home() {
  const { format } = useApp();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [featured, setFeatured] = useState<Produce[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    fetchCommodities().then(setCommodities);
    fetchProduce({ limit: 12 }).then(setFeatured);
    fetchRegions().then(setRegions);
  }, []);

  const totalListings = regions.reduce((s, r) => s + r.listingCount, 0);
  const topRegions = [...regions].sort((a, b) => b.listingCount - a.listingCount).slice(0, 6);
  const topMovers = [...commodities].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar subtitle="Farm-to-fork marketplace" />
      <Ticker items={commodities} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <LinearGradient colors={GRAD.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingTop: 26, paddingBottom: 30 }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: '#FFFFFF1E', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#FFFFFF33', marginBottom: 14 }}>
            <Txt f={font.bodyBold} size={11} color="#BFEAD0" style={{ letterSpacing: 0.5 }}>
              🌍 26 REGIONS · 4 EXPORT ZONES · LIVE PRICES
            </Txt>
          </View>
          <Txt f={font.black} size={32} color={C.white} style={{ lineHeight: 37 }}>
            Fresh produce,{'\n'}direct from the farm.
          </Txt>
          <Txt f={font.body} size={14} color="#D6EEDF" style={{ marginTop: 12, lineHeight: 21 }}>
            Trade avocados, coffee, macadamia, roses and 20+ commodities like a farm-to-futures desk — with live prices, one-tap BUY / SELL and transparent crew splits.
          </Txt>
          <Row gap={10} style={{ marginTop: 20 }}>
            <GradientButton title="Browse produce" icon="leaf" colors={GRAD.gold} textColor={C.brandDark} onPress={() => router.push('/(tabs)/browse')} style={{ flex: 1 }} />
            <GradientButton title="Market" icon="stats-chart" colors={['#FFFFFF', '#EAF7EF']} textColor={C.brand} onPress={() => router.push('/(tabs)/market')} style={{ flex: 1 }} />
          </Row>
        </LinearGradient>

        {/* Stats bar */}
        <View style={{ paddingHorizontal: 16, marginTop: -16 }}>
          <Card style={{ ...shadow.soft }}>
            <Row>
              <StatBlock value={`${totalListings || '1,200'}+`} label="Live listings" />
              <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
              <StatBlock value={String(commodities.length || 25)} label="Commodities" color={C.gold} />
              <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
              <StatBlock value={String(regions.length || 26)} label="Regions" color={C.brandLight} />
            </Row>
          </Card>
        </View>

        {/* Categories */}
        <View style={{ paddingHorizontal: 16, marginTop: 26 }}>
          <SectionTitle kicker="Shop by commodity" title="Browse categories" action="All" onAction={() => router.push('/(tabs)/browse')} />
          <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {CAT_DETAILS.slice(0, 12).map((cd) => (
              <Pressable key={cd.name} onPress={() => router.push(`/commodity/${encodeURIComponent(cd.name)}`)} style={{ width: (W - 32 - 24) / 4, alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
                  <Txt size={28}>{cd.emoji}</Txt>
                </View>
                <Txt f={font.bodySemi} size={10.5} color={C.textSub} align="center" numberOfLines={1} style={{ marginTop: 6, width: '100%' }}>
                  {cd.name}
                </Txt>
              </Pressable>
            ))}
          </Row>
        </View>

        {/* Top movers */}
        {topMovers.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <SectionTitle kicker="Commodity exchange" title="Today's movers" action="Market" onAction={() => router.push('/(tabs)/market')} />
            <Card pad={16}>
              {topMovers.map((c) => (
                <CommodityRow key={c.category} c={c} />
              ))}
            </Card>
          </View>
        )}

        {/* Featured produce */}
        {featured.length > 0 && (
          <View style={{ marginTop: 26 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <SectionTitle kicker="Fresh on iTunda" title="Featured listings" action="Browse" onAction={() => router.push('/(tabs)/browse')} />
            </View>
            <View style={{ paddingLeft: 16 }}>
              <Rail>
                {featured.map((p) => (
                  <ProduceCard key={p.id} item={p} width={200} />
                ))}
              </Rail>
            </View>
          </View>
        )}

        {/* Regions */}
        {topRegions.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 26 }}>
            <SectionTitle kicker="Growing regions" title="Top origins" />
            <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {topRegions.map((r) => (
                <Pressable key={r.name} onPress={() => router.push(`/(tabs)/browse?region=${encodeURIComponent(r.name)}`)} style={{ width: (W - 32 - 12) / 2, marginBottom: 12 }}>
                  <Card pad={12}>
                    <Row gap={8}>
                      <Flag code={r.countryCode} w={26} />
                      <View style={{ flex: 1 }}>
                        <Txt f={font.bodyBold} size={13.5} color={C.ink} numberOfLines={1}>
                          {r.name}
                        </Txt>
                        <Txt f={font.body} size={11} color={C.muted}>
                          {r.country} · {r.listingCount} listings
                        </Txt>
                      </View>
                    </Row>
                  </Card>
                </Pressable>
              ))}
            </Row>
          </View>
        )}

        {/* How it works */}
        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <LinearGradient colors={GRAD.brand} style={{ borderRadius: radius.xl, padding: 20 }}>
            <Txt f={font.extra} size={19} color={C.white}>
              How iTunda works
            </Txt>
            {[
              ['leaf', 'Farmers list produce', 'With photos, GPS provenance, planting & best-before dates.'],
              ['swap-horizontal', 'Buyers place orders', 'Spot buy, bid at a limit, or lock a futures contract.'],
              ['navigate', 'Delivery estimated', 'Instant road/freight pricing between any region and hub.'],
            ].map(([icon, t, b], i) => (
              <Row key={i} gap={12} style={{ marginTop: 16, alignItems: 'flex-start' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={icon as any} size={19} color={C.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt f={font.bodyBold} size={14.5} color={C.white}>
                    {t}
                  </Txt>
                  <Txt f={font.body} size={12.5} color="#CFEBD9" style={{ marginTop: 2, lineHeight: 18 }}>
                    {b}
                  </Txt>
                </View>
              </Row>
            ))}
          </LinearGradient>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
          <Card style={{ alignItems: 'center' }}>
            <Txt f={font.extra} size={18} color={C.ink} align="center">
              Sell your harvest to the world
            </Txt>
            <Txt f={font.body} size={13} color={C.muted} align="center" style={{ marginTop: 6, marginBottom: 14 }}>
              List your produce and reach buyers across 4 export zones.
            </Txt>
            <GradientButton title="List produce" icon="add-circle" onPress={() => router.push('/sell')} style={{ alignSelf: 'stretch' }} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
