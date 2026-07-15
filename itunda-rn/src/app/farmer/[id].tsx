import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { fetchFarmer, fetchFarmerProduce } from '@/data/api';
import type { Farmer, Produce } from '@/data/types';
import { C, GRAD, font, radius } from '@/theme';
import { Avatar, Badge, Card, Row, StatBlock, Txt } from '@/ui';
import { DetailHeader, Flag, ProduceCard } from '@/components/shared';

const W = Dimensions.get('window').width;
const CARD_W = (W - 16 * 2 - 12) / 2;

export default function FarmerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [listings, setListings] = useState<Produce[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchFarmer(id).then(setFarmer);
    fetchFarmerProduce(id).then(setListings);
  }, [id]);

  if (!farmer) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <DetailHeader title="Loading…" />
      </View>
    );
  }

  const images = farmer.farmImages ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DetailHeader title={farmer.name} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <LinearGradient colors={GRAD.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
          <Row gap={14}>
            <Avatar name={farmer.name} size={64} color={C.white} />
            <View style={{ flex: 1 }}>
              <Txt f={font.black} size={22} color={C.white}>
                {farmer.name}
              </Txt>
              <Txt f={font.body} size={13} color="#CFEBD9" numberOfLines={1}>
                {farmer.farmName}
              </Txt>
              <Row gap={6} style={{ marginTop: 6 }}>
                <Flag code={farmer.countryCode} w={18} />
                <Txt f={font.body} size={12} color="#CFEBD9">
                  {farmer.region}, {farmer.country}
                </Txt>
              </Row>
            </View>
          </Row>
          {farmer.ableToExportDirectly && (
            <View style={{ alignSelf: 'flex-start', marginTop: 14, backgroundColor: C.gold, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Txt f={font.bodyBold} size={11} color={C.brandDark}>
                ✓ EXPORTS TO {farmer.exportsDomain ?? 'GLOBAL'}
              </Txt>
            </View>
          )}
        </LinearGradient>

        <View style={{ padding: 16 }}>
          {/* Stats */}
          <Card>
            <Row>
              <StatBlock value={farmer.ratingFarmer.toFixed(1)} label="Rating" color={C.gold} />
              <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
              <StatBlock value={String(farmer.ordersFulfilled)} label="Orders" />
              <View style={{ width: 1, backgroundColor: C.line, marginHorizontal: 4 }} />
              <StatBlock value={`${Math.round(farmer.sizeOfFarmAcres)}`} label="Acres" color={C.brandLight} />
            </Row>
          </Card>

          {/* Bio */}
          {farmer.description && (
            <Card style={{ marginTop: 14 }}>
              <Txt f={font.bold} size={15} color={C.ink} style={{ marginBottom: 8 }}>
                About the farm
              </Txt>
              <Txt f={font.body} size={13.5} color={C.textSub} style={{ lineHeight: 21 }}>
                {farmer.description}
              </Txt>
              {farmer.specialization && (
                <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
                  <Badge label={`Specialises in ${farmer.specialization}`} />
                  {farmer.certifications && <Badge label={farmer.certifications} bg={C.blue + '18'} color={C.blue} />}
                </Row>
              )}
            </Card>
          )}

          {/* Farm photos */}
          {images.length > 0 && (
            <View style={{ marginTop: 18 }}>
              <Txt f={font.bold} size={16} color={C.ink} style={{ marginBottom: 10 }}>
                The farm
              </Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {images.map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={{ width: 240, height: 150, borderRadius: radius.lg, backgroundColor: C.line2 }} contentFit="cover" transition={200} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Listings */}
          <Txt f={font.bold} size={16} color={C.ink} style={{ marginTop: 22, marginBottom: 12 }}>
            Active listings ({listings.length})
          </Txt>
          <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {listings.map((p) => (
              <View key={p.id} style={{ width: CARD_W, marginBottom: 12 }}>
                <ProduceCard item={p} />
              </View>
            ))}
          </Row>
          {listings.length === 0 && (
            <Txt f={font.body} size={13} color={C.muted} align="center" style={{ paddingVertical: 20 }}>
              No active listings right now.
            </Txt>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
