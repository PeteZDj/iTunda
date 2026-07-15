import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { fetchFarmers } from '@/data/api';
import type { Farmer } from '@/data/types';
import { C, font, radius } from '@/theme';
import { Avatar, Badge, Card, Loading, Row, Txt } from '@/ui';
import { DetailHeader, Flag } from '@/components/shared';

export default function Farmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetchFarmers().then((f) => {
      setFarmers(f);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!q) return farmers;
    const s = q.toLowerCase();
    return farmers.filter((f) => f.name.toLowerCase().includes(s) || f.farmName.toLowerCase().includes(s) || f.region.toLowerCase().includes(s) || (f.specialization ?? '').toLowerCase().includes(s));
  }, [farmers, q]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DetailHeader title="Farmers directory" />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Row style={{ backgroundColor: C.card, borderRadius: radius.md, borderWidth: 2, borderColor: C.line, paddingHorizontal: 14, height: 46, marginBottom: 14 }} gap={8}>
            <Ionicons name="search" size={18} color={C.muted} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search farmers, farms, crops…" placeholderTextColor={C.muted} style={{ flex: 1, fontFamily: font.body, fontSize: 14.5, color: C.ink }} />
          </Row>

          {filtered.map((f) => (
            <Pressable key={f.id} onPress={() => router.push(`/farmer/${f.username || f.id}`)} style={{ marginBottom: 10 }}>
              <Card pad={14}>
                <Row gap={12}>
                  <Avatar name={f.name} size={50} />
                  <View style={{ flex: 1 }}>
                    <Txt f={font.bodyBold} size={15} color={C.ink} numberOfLines={1}>
                      {f.name}
                    </Txt>
                    <Txt f={font.body} size={12} color={C.muted} numberOfLines={1}>
                      {f.farmName}
                    </Txt>
                    <Row gap={6} style={{ marginTop: 5 }}>
                      <Flag code={f.countryCode} w={16} />
                      <Txt f={font.body} size={11.5} color={C.textSub} numberOfLines={1} style={{ flex: 1 }}>
                        {f.region}, {f.country}
                      </Txt>
                    </Row>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Row gap={3}>
                      <Ionicons name="star" size={13} color={C.gold} />
                      <Txt f={font.bodyBold} size={13} color={C.ink}>
                        {f.ratingFarmer.toFixed(1)}
                      </Txt>
                    </Row>
                    {f.ableToExportDirectly && (
                      <View style={{ marginTop: 6, backgroundColor: C.gold + '22', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Txt f={font.bodyBold} size={9.5} color="#B67A00">
                          EXPORT
                        </Txt>
                      </View>
                    )}
                  </View>
                </Row>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
