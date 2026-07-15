import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { CATEGORIES, catDetail } from '@/lib/categories';
import { REGIONS } from '@/lib/regions';
import { C, font, radius } from '@/theme';
import { Card, GradientButton, Row, Txt } from '@/ui';
import { DetailHeader, Flag, PickerModal } from '@/components/shared';
import { useApp } from '@/store';

const inputStyle = {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Txt f={font.bodySemi} size={12.5} color={C.textSub} style={{ marginBottom: 6 }}>
        {label}
      </Txt>
      {children}
    </View>
  );
}

function Selector({ value, placeholder, onPress, flag }: { value?: string; placeholder: string; onPress: () => void; flag?: string }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...inputStyle }}>
      <Row gap={8}>
        {flag && <Flag code={flag} w={20} />}
        <Txt f={font.bodySemi} size={15} color={value ? C.ink : C.muted}>
          {value ?? placeholder}
        </Txt>
      </Row>
      <Ionicons name="chevron-down" size={18} color={C.muted} />
    </Pressable>
  );
}

export default function Sell() {
  const { user } = useApp();
  const [category, setCategory] = useState<string | null>(null);
  const [variety, setVariety] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [grade, setGrade] = useState<string | null>(null);
  const [regionIdx, setRegionIdx] = useState<number | null>(null);
  const [desc, setDesc] = useState('');
  const [exportReady, setExportReady] = useState(false);
  const [done, setDone] = useState(false);

  const [openCat, setOpenCat] = useState(false);
  const [openGrade, setOpenGrade] = useState(false);
  const [openRegion, setOpenRegion] = useState(false);

  const cd = category ? catDetail(category) : null;
  const region = regionIdx != null ? REGIONS[regionIdx] : null;
  const valid = category && variety && price && qty && region;

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <DetailHeader title="Listing published" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: C.brandMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Ionicons name="checkmark" size={40} color={C.brand} />
          </View>
          <Txt f={font.black} size={22} color={C.ink} align="center">
            Your produce is live!
          </Txt>
          <Txt f={font.body} size={14} color={C.muted} align="center" style={{ marginTop: 8, lineHeight: 21 }}>
            {variety} {category} from {region?.name} is now visible to buyers across all export zones.
          </Txt>
          <GradientButton title="Browse the market" icon="leaf" onPress={() => router.replace('/(tabs)/browse')} style={{ marginTop: 24, alignSelf: 'stretch' }} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DetailHeader title="List your produce" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {!user && (
          <Card style={{ marginBottom: 14, backgroundColor: C.brandMuted, borderColor: C.brand + '33' }}>
            <Row gap={10}>
              <Ionicons name="information-circle" size={20} color={C.brand} />
              <Txt f={font.body} size={12.5} color={C.brandDark} style={{ flex: 1, lineHeight: 18 }}>
                You can fill this out as a guest. Sign in from More to publish under your farm profile.
              </Txt>
            </Row>
          </Card>
        )}

        <Field label="Commodity">
          <Selector value={category ?? undefined} placeholder="Select a commodity" onPress={() => setOpenCat(true)} />
        </Field>

        <Field label="Variety name">
          <TextInput value={variety} onChangeText={setVariety} placeholder={cd ? cd.varieties[0] : 'e.g. Hass'} placeholderTextColor={C.muted} style={inputStyle} />
        </Field>

        <Row gap={12}>
          <View style={{ flex: 1 }}>
            <Field label={`Price (KSh / ${cd?.unit ?? 'kg'})`}>
              <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" placeholder={cd ? String(cd.minPrice) : '0'} placeholderTextColor={C.muted} style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={`Quantity (${cd?.unit ?? 'kg'})`}>
              <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="0" placeholderTextColor={C.muted} style={inputStyle} />
            </Field>
          </View>
        </Row>

        <Field label="Grade / quality">
          <Selector value={grade ?? undefined} placeholder={cd ? 'Select grade' : 'Pick a commodity first'} onPress={() => cd && setOpenGrade(true)} />
        </Field>

        <Field label="Growing region">
          <Selector value={region ? `${region.name}, ${region.country}` : undefined} placeholder="Select region" flag={region?.countryCode} onPress={() => setOpenRegion(true)} />
        </Field>

        <Field label="Description">
          <TextInput value={desc} onChangeText={setDesc} placeholder="Tell buyers about your harvest, provenance and quality…" placeholderTextColor={C.muted} multiline style={[inputStyle, { height: 100, textAlignVertical: 'top' }]} />
        </Field>

        <Pressable onPress={() => setExportReady((v) => !v)} style={{ marginBottom: 20 }}>
          <Card pad={14}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={10}>
                <Ionicons name="boat" size={20} color={C.gold} />
                <View>
                  <Txt f={font.bodyBold} size={14} color={C.ink}>
                    Export ready
                  </Txt>
                  <Txt f={font.body} size={11.5} color={C.muted}>
                    Meets export grade & certification
                  </Txt>
                </View>
              </Row>
              <View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: exportReady ? C.brand : C.line, justifyContent: 'center', paddingHorizontal: 3 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.white, alignSelf: exportReady ? 'flex-end' : 'flex-start' }} />
              </View>
            </Row>
          </Card>
        </Pressable>

        <GradientButton title="Publish listing" icon="cloud-upload" onPress={() => valid && setDone(true)} style={{ opacity: valid ? 1 : 0.5 }} />
        {!valid && (
          <Txt f={font.body} size={11.5} color={C.muted} align="center" style={{ marginTop: 10 }}>
            Fill commodity, variety, price, quantity and region to publish.
          </Txt>
        )}
      </ScrollView>

      <PickerModal title="Commodity" open={openCat} onClose={() => setOpenCat(false)} items={CATEGORIES.map((c) => ({ key: c, label: c, active: c === category }))} onSelect={(k) => { setCategory(k); setGrade(null); setOpenCat(false); }} />
      {cd && <PickerModal title="Grade" open={openGrade} onClose={() => setOpenGrade(false)} items={cd.grades.map((g) => ({ key: g, label: g, active: g === grade }))} onSelect={(k) => { setGrade(k); setOpenGrade(false); }} />}
      <PickerModal title="Growing region" open={openRegion} onClose={() => setOpenRegion(false)} items={REGIONS.map((r, i) => ({ key: String(i), label: `${r.name}, ${r.country}`, flag: r.countryCode, active: i === regionIdx }))} onSelect={(k) => { setRegionIdx(Number(k)); setOpenRegion(false); }} />
    </View>
  );
}
