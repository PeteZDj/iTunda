import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { fetchProduce, fetchProduceById } from '@/data/api';
import type { Produce } from '@/data/types';
import { C, GRAD, font, radius, shadow } from '@/theme';
import { Avatar, Badge, Card, GradientButton, Row, StatBlock, Txt } from '@/ui';
import { DetailHeader, Flag, ProduceCard, Rail, TradeSheet } from '@/components/shared';
import { useApp } from '@/store';

const W = Dimensions.get('window').width;

function fmtDate(s?: string | null) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function ProduceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { format, isWatched, toggleWatch } = useApp();
  const [item, setItem] = useState<Produce | null>(null);
  const [related, setRelated] = useState<Produce[]>([]);
  const [hero, setHero] = useState(0);
  const [trade, setTrade] = useState(false);

  useEffect(() => {
    const pid = Number(id);
    fetchProduceById(pid).then((p) => {
      setItem(p);
      if (p) fetchProduce({ category: p.category, limit: 10 }).then((r) => setRelated(r.filter((x) => x.id !== p.id).slice(0, 6)));
    });
  }, [id]);

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <DetailHeader title="Loading…" />
      </View>
    );
  }

  const gallery = [item.imageUrl, ...(item.gallery ?? [])].slice(0, 5);
  const watched = isWatched(item.id);
  const mapsUrl = item.farmLatitude ? `https://www.google.com/maps/search/?api=1&query=${item.farmLatitude},${item.farmLongitude}` : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DetailHeader
        title={item.name}
        right={
          <Pressable onPress={() => toggleWatch(item.id)} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons name={watched ? 'heart' : 'heart-outline'} size={24} color={watched ? C.gold : C.white} />
          </Pressable>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Gallery */}
        <View>
          <Image source={{ uri: gallery[hero] }} style={{ width: W, height: W * 0.62, backgroundColor: C.line2 }} contentFit="cover" transition={200} />
          {gallery.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }} style={{ position: 'absolute', bottom: 0 }}>
              {gallery.map((g, i) => (
                <Pressable key={i} onPress={() => setHero(i)}>
                  <Image source={{ uri: g }} style={{ width: 52, height: 52, borderRadius: 8, borderWidth: 2, borderColor: hero === i ? C.gold : '#FFFFFFAA' }} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ padding: 16 }}>
          {/* Title block */}
          <Row gap={8} style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            <Badge label={item.category} />
            {item.isExportReady && <Badge label="EXPORT READY" bg={C.gold + '22'} color="#B67A00" />}
            <Badge label={item.deliveryScope} bg={C.blue + '18'} color={C.blue} />
          </Row>
          <Txt f={font.black} size={24} color={C.ink}>
            {item.name}
          </Txt>
          <Row gap={6} style={{ marginTop: 6 }}>
            <Flag code={item.countryCode} w={20} />
            <Txt f={font.body} size={13.5} color={C.muted}>
              {item.region}, {item.country} · Zone {item.zone}
            </Txt>
          </Row>

          {/* Price + actions */}
          <Card style={{ marginTop: 16 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Txt f={font.black} size={30} color={C.brand}>
                  {format(item.price)}
                </Txt>
                <Txt f={font.body} size={12} color={C.muted}>
                  per {item.unit} · {item.gradeQuality}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt f={font.monoBold} size={16} color={C.ink}>
                  {item.quantityAvailable.toLocaleString()}
                </Txt>
                <Txt f={font.body} size={11} color={C.muted}>
                  {item.unit} available
                </Txt>
              </View>
            </Row>
            <Row gap={10} style={{ marginTop: 16 }}>
              <GradientButton title="Buy now" icon="cart" onPress={() => setTrade(true)} style={{ flex: 1 }} />
              <GradientButton title="Place bid" icon="pricetag" colors={GRAD.gold} textColor={C.brandDark} onPress={() => setTrade(true)} style={{ flex: 1 }} />
            </Row>
          </Card>

          {/* Info grid */}
          <Card style={{ marginTop: 14 }}>
            <Txt f={font.bold} size={15} color={C.ink} style={{ marginBottom: 12 }}>
              Provenance & details
            </Txt>
            {[
              ['leaf-outline', 'Variety', item.name],
              ['ribbon-outline', 'Grade', item.gradeQuality ?? '—'],
              ['cube-outline', 'Quantity', `${item.quantityAvailable.toLocaleString()} ${item.unit}`],
              ['calendar-outline', 'Harvested', fmtDate(item.harvestDate)],
              ['time-outline', 'Best before', fmtDate(item.expiryDate)],
              ['boat-outline', 'Delivery', item.deliveryScope],
            ].map(([icon, k, v], i) => (
              <Row key={i} style={{ justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: C.line2 }}>
                <Row gap={8}>
                  <Ionicons name={icon as any} size={16} color={C.brand} />
                  <Txt f={font.body} size={13} color={C.muted}>
                    {k}
                  </Txt>
                </Row>
                <Txt f={font.bodySemi} size={13} color={C.ink}>
                  {v}
                </Txt>
              </Row>
            ))}
          </Card>

          {/* Description */}
          {item.description && (
            <Card style={{ marginTop: 14 }}>
              <Txt f={font.bold} size={15} color={C.ink} style={{ marginBottom: 8 }}>
                About this listing
              </Txt>
              <Txt f={font.body} size={13.5} color={C.textSub} style={{ lineHeight: 21 }}>
                {item.description}
              </Txt>
            </Card>
          )}

          {/* Farmer */}
          <Pressable onPress={() => router.push(`/farmer/${item.farmerUsername || item.farmerProfileId}`)} style={{ marginTop: 14 }}>
            <Card>
              <Row gap={12}>
                <Avatar name={item.farmerName} size={48} />
                <View style={{ flex: 1 }}>
                  <Txt f={font.bodyBold} size={15} color={C.ink}>
                    {item.farmerName}
                  </Txt>
                  <Txt f={font.body} size={12} color={C.muted} numberOfLines={1}>
                    {item.farmName}
                  </Txt>
                  <Row gap={10} style={{ marginTop: 4 }}>
                    <Row gap={3}>
                      <Ionicons name="star" size={12} color={C.gold} />
                      <Txt f={font.bodySemi} size={11.5} color={C.textSub}>
                        {item.farmerRating.toFixed(1)}
                      </Txt>
                    </Row>
                    <Txt f={font.body} size={11.5} color={C.muted}>
                      {item.farmerOrdersFulfilled} orders fulfilled
                    </Txt>
                  </Row>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.muted} />
              </Row>
            </Card>
          </Pressable>

          {/* Farm location */}
          {mapsUrl && (
            <Pressable onPress={() => Linking.openURL(mapsUrl)} style={{ marginTop: 14 }}>
              <Card>
                <Row gap={12}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.brandMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="location" size={20} color={C.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt f={font.bodyBold} size={14} color={C.ink}>
                      Farm location
                    </Txt>
                    <Txt f={font.body} size={12} color={C.muted}>
                      {item.farmLatitude?.toFixed(4)}, {item.farmLongitude?.toFixed(4)} · Open in Maps
                    </Txt>
                  </View>
                  <Ionicons name="open-outline" size={18} color={C.brand} />
                </Row>
              </Card>
            </Pressable>
          )}

          {/* Related */}
          {related.length > 0 && (
            <View style={{ marginTop: 22 }}>
              <Txt f={font.bold} size={18} color={C.ink} style={{ marginBottom: 12 }}>
                More {item.category}
              </Txt>
              <Rail>
                {related.map((p) => (
                  <ProduceCard key={p.id} item={p} width={190} />
                ))}
              </Rail>
            </View>
          )}
        </View>
      </ScrollView>

      <TradeSheet open={trade} onClose={() => setTrade(false)} category={item.category} unit={item.unit} refPrice={item.price} produce={item} />
    </View>
  );
}
