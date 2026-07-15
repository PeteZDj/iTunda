import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { estimateDelivery } from '@/data/api';
import { REGIONS } from '@/lib/regions';
import { C, GRAD, font, radius } from '@/theme';
import { Card, GradientButton, Row, StatBlock, Txt } from '@/ui';
import { Flag, PickerModal, TopBar } from '@/components/shared';
import { useApp } from '@/store';

interface Hub {
  name: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
}

const HUBS: Hub[] = [
  { name: 'Nairobi', country: 'Kenya', code: 'KE', lat: -1.2921, lng: 36.8219 },
  { name: 'Mombasa Port', country: 'Kenya', code: 'KE', lat: -4.0435, lng: 39.6682 },
  { name: 'Kampala', country: 'Uganda', code: 'UG', lat: 0.3476, lng: 32.5825 },
  { name: 'Addis Ababa', country: 'Ethiopia', code: 'ET', lat: 9.03, lng: 38.74 },
  { name: 'Dar es Salaam Port', country: 'Tanzania', code: 'TZ', lat: -6.7924, lng: 39.2083 },
  { name: 'Rotterdam', country: 'Netherlands', code: 'NL', lat: 51.9244, lng: 4.4777 },
  { name: 'Dubai', country: 'UAE', code: 'AE', lat: 25.2048, lng: 55.2708 },
  { name: 'London', country: 'UK', code: 'GB', lat: 51.5074, lng: -0.1278 },
];

export default function Delivery() {
  const { format } = useApp();
  const [originIdx, setOriginIdx] = useState(0);
  const [hubIdx, setHubIdx] = useState(0);
  const [weight, setWeight] = useState('500');
  const [openO, setOpenO] = useState(false);
  const [openD, setOpenD] = useState(false);

  const origin = REGIONS[originIdx];
  const hub = HUBS[hubIdx];
  const est = useMemo(
    () => estimateDelivery(origin.lat, origin.lng, hub.lat, hub.lng, Number(weight) || 500),
    [origin, hub, weight],
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar subtitle="Delivery estimator" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Txt f={font.black} size={24} color={C.ink}>
          Route & freight estimate
        </Txt>
        <Txt f={font.body} size={13.5} color={C.muted} style={{ marginTop: 6, marginBottom: 18, lineHeight: 20 }}>
          Check transit time and freight price between any growing region and a market hub — no login required.
        </Txt>

        {/* Route selectors */}
        <Card>
          <Txt f={font.bodySemi} size={12} color={C.textSub} style={{ marginBottom: 6 }}>
            FROM (growing region)
          </Txt>
          <Pressable onPress={() => setOpenO(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: radius.sm, borderWidth: 1, borderColor: C.line, padding: 12, justifyContent: 'space-between' }}>
            <Row gap={8}>
              <Flag code={origin.countryCode} w={24} />
              <View>
                <Txt f={font.bodyBold} size={14} color={C.ink}>
                  {origin.name}
                </Txt>
                <Txt f={font.body} size={11} color={C.muted}>
                  {origin.country}
                </Txt>
              </View>
            </Row>
            <Ionicons name="chevron-down" size={18} color={C.muted} />
          </Pressable>

          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <Ionicons name="arrow-down" size={20} color={C.brand} />
          </View>

          <Txt f={font.bodySemi} size={12} color={C.textSub} style={{ marginBottom: 6 }}>
            TO (market hub)
          </Txt>
          <Pressable onPress={() => setOpenD(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: radius.sm, borderWidth: 1, borderColor: C.line, padding: 12, justifyContent: 'space-between' }}>
            <Row gap={8}>
              <Flag code={hub.code} w={24} />
              <View>
                <Txt f={font.bodyBold} size={14} color={C.ink}>
                  {hub.name}
                </Txt>
                <Txt f={font.body} size={11} color={C.muted}>
                  {hub.country}
                </Txt>
              </View>
            </Row>
            <Ionicons name="chevron-down" size={18} color={C.muted} />
          </Pressable>

          <Txt f={font.bodySemi} size={12} color={C.textSub} style={{ marginTop: 14, marginBottom: 6 }}>
            SHIPMENT WEIGHT (kg)
          </Txt>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            style={{ backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.bodySemi, fontSize: 15, color: C.ink }}
          />
        </Card>

        {/* Result */}
        <LinearGradientResult est={est} format={format} />

        <Card style={{ marginTop: 16 }}>
          <Row gap={10}>
            <Ionicons name="information-circle" size={20} color={C.brand} />
            <Txt f={font.body} size={12.5} color={C.textSub} style={{ flex: 1, lineHeight: 18 }}>
              Estimates use great-circle distance with tiered road/air-sea freight pricing. Road under 1,500km, air/sea beyond. Weight scales the freight above 500kg.
            </Txt>
          </Row>
        </Card>
      </ScrollView>

      <PickerModal
        title="Growing region"
        open={openO}
        onClose={() => setOpenO(false)}
        items={REGIONS.map((r, i) => ({ key: String(i), label: `${r.name}, ${r.country}`, flag: r.countryCode, active: i === originIdx }))}
        onSelect={(k) => {
          setOriginIdx(Number(k));
          setOpenO(false);
        }}
      />
      <PickerModal
        title="Market hub"
        open={openD}
        onClose={() => setOpenD(false)}
        items={HUBS.map((h, i) => ({ key: String(i), label: `${h.name}, ${h.country}`, flag: h.code, active: i === hubIdx }))}
        onSelect={(k) => {
          setHubIdx(Number(k));
          setOpenD(false);
        }}
      />
    </View>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
function LinearGradientResult({ est, format }: { est: { distanceKm: number; etaHours: number; priceKes: number; mode: string }; format: (k: number) => string }) {
  return (
    <LinearGradient colors={GRAD.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 20, marginTop: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt f={font.bodyBold} size={13} color="#CFEBD9">
          {est.mode}
        </Txt>
        <View style={{ backgroundColor: '#FFFFFF22', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Txt f={font.bodyBold} size={11} color={C.white}>
            ESTIMATE
          </Txt>
        </View>
      </Row>
      <Row style={{ marginTop: 16 }}>
        <View style={{ flex: 1 }}>
          <Txt f={font.black} size={26} color={C.white}>
            {est.distanceKm.toLocaleString()}
          </Txt>
          <Txt f={font.body} size={11} color="#CFEBD9">
            km distance
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt f={font.black} size={26} color={C.white}>
            {est.etaHours}h
          </Txt>
          <Txt f={font.body} size={11} color="#CFEBD9">
            transit time
          </Txt>
        </View>
      </Row>
      <View style={{ height: 1, backgroundColor: '#FFFFFF22', marginVertical: 16 }} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt f={font.body} size={13} color="#CFEBD9">
          Estimated freight
        </Txt>
        <Txt f={font.black} size={24} color={C.gold}>
          {format(est.priceKes)}
        </Txt>
      </Row>
    </LinearGradient>
  );
}
