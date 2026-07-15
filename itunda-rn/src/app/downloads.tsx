import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, ScrollView, View } from 'react-native';
import { C, GRAD, font, radius } from '@/theme';
import { Card, GradientButton, Row, Txt } from '@/ui';
import { DetailHeader } from '@/components/shared';

const FEATURES: [any, string, string][] = [
  ['leaf', 'Full catalogue', 'Browse 1,000+ live listings across 26 regions and 4 export zones.'],
  ['stats-chart', 'Commodity exchange', 'Live price board, bid/ask spreads and a forex-style order book.'],
  ['swap-horizontal', 'Spot / Limit / Futures / Put', 'A world-class trade ticket with BUY & SELL sides.'],
  ['navigate', 'Delivery estimator', 'Instant road & freight pricing between any region and hub.'],
  ['cash', 'Live currency switcher', 'Flip prices between KES, USD, GBP, EUR and more.'],
  ['location', 'GPS provenance', 'Every listing shows the farm pin and traceable harvest dates.'],
];

export default function Downloads() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DetailHeader title="Get the app" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <LinearGradient colors={GRAD.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 22 }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: '#FFFFFF1E', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#FFFFFF33', marginBottom: 12 }}>
            <Txt f={font.bodyBold} size={11} color="#BFEAD0">
              📱 iTUNDA FOR ANDROID
            </Txt>
          </View>
          <Txt f={font.black} size={26} color={C.white} style={{ lineHeight: 31 }}>
            The whole marketplace,{'\n'}in your pocket.
          </Txt>
          <Txt f={font.body} size={13.5} color="#D6EEDF" style={{ marginTop: 10, lineHeight: 20 }}>
            You're already running it! Share iTunda with other farmers and buyers — the latest signed APK is always on the site.
          </Txt>
          <GradientButton title="Open web downloads" icon="open" colors={GRAD.gold} textColor={C.brandDark} onPress={() => Linking.openURL('https://itunda.org/downloads')} style={{ marginTop: 18 }} />
        </LinearGradient>

        <Txt f={font.bold} size={17} color={C.ink} style={{ marginTop: 22, marginBottom: 12 }}>
          Everything the site does — mobile-first
        </Txt>
        {FEATURES.map(([icon, t, b], i) => (
          <Card key={i} pad={14} style={{ marginBottom: 10 }}>
            <Row gap={12}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.brandMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon} size={20} color={C.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt f={font.bodyBold} size={14.5} color={C.ink}>
                  {t}
                </Txt>
                <Txt f={font.body} size={12.5} color={C.muted} style={{ marginTop: 2, lineHeight: 18 }}>
                  {b}
                </Txt>
              </View>
            </Row>
          </Card>
        ))}

        <Txt f={font.body} size={11} color={C.muted} align="center" style={{ marginTop: 12 }}>
          Android 7.0+ · Free · Fresh produce, direct from the farm 🌍
        </Txt>
      </ScrollView>
    </View>
  );
}
