import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, TextInput, View } from 'react-native';
import { fetchProduce } from '@/data/api';
import type { Produce } from '@/data/types';
import { CATEGORIES } from '@/lib/categories';
import { C, font, radius } from '@/theme';
import { Chip, Loading, Row, Txt } from '@/ui';
import { ProduceCard, TopBar } from '@/components/shared';
import { useApp } from '@/store';

const W = Dimensions.get('window').width;
const CARD_W = (W - 16 * 2 - 12) / 2;

export default function Browse() {
  const params = useLocalSearchParams<{ category?: string; region?: string }>();
  const { zone, region } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(params.category ?? null);
  const [exportOnly, setExportOnly] = useState(false);
  const [items, setItems] = useState<Produce[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'new' | 'low' | 'high'>('new');

  useEffect(() => {
    if (params.category) setCat(params.category);
  }, [params.category]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchProduce({
      q: q || undefined,
      category: cat || undefined,
      region: params.region || region || undefined,
      zone: zone || undefined,
      exportReady: exportOnly || undefined,
      limit: 300,
    }).then((r) => {
      if (alive) {
        setItems(r);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [q, cat, exportOnly, zone, region, params.region]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === 'low') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'high') arr.sort((a, b) => b.price - a.price);
    return arr;
  }, [items, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar subtitle="Browse the catalogue" />

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Row style={{ backgroundColor: C.card, borderRadius: radius.md, borderWidth: 2, borderColor: C.line, paddingHorizontal: 14, height: 46 }} gap={8}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search produce, farms, regions…"
            placeholderTextColor={C.muted}
            style={{ flex: 1, fontFamily: font.body, fontSize: 14.5, color: C.ink }}
          />
          {q ? <Ionicons name="close-circle" size={18} color={C.muted} onPress={() => setQ('')} /> : null}
        </Row>
      </View>

      {/* Category chips */}
      <View style={{ paddingTop: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Chip label="All" active={!cat} onPress={() => setCat(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>
      </View>

      {/* Sort + export toggle */}
      <Row style={{ paddingHorizontal: 16, paddingBottom: 8, justifyContent: 'space-between' }}>
        <Row gap={6}>
          <Chip label="Newest" active={sort === 'new'} onPress={() => setSort('new')} />
          <Chip label="Price ↑" active={sort === 'low'} onPress={() => setSort('low')} />
          <Chip label="Price ↓" active={sort === 'high'} onPress={() => setSort('high')} />
        </Row>
        <Chip label="Export" active={exportOnly} onPress={() => setExportOnly((v) => !v)} activeColor={C.gold} />
      </Row>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Txt f={font.body} size={12.5} color={C.muted} style={{ marginBottom: 12 }}>
            {sorted.length} listing{sorted.length === 1 ? '' : 's'}
            {cat ? ` in ${cat}` : ''}
          </Txt>
          {sorted.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Txt size={40}>🌾</Txt>
              <Txt f={font.bold} size={16} color={C.ink} style={{ marginTop: 12 }}>
                No listings found
              </Txt>
              <Txt f={font.body} size={13} color={C.muted} align="center" style={{ marginTop: 4 }}>
                Try a different search or clear your filters.
              </Txt>
            </View>
          ) : (
            <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {sorted.map((p) => (
                <View key={p.id} style={{ width: CARD_W, marginBottom: 12 }}>
                  <ProduceCard item={p} />
                </View>
              ))}
            </Row>
          )}
        </ScrollView>
      )}
    </View>
  );
}
