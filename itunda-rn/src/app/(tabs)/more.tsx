import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { C, GRAD, font, radius } from '@/theme';
import { Avatar, Card, GradientButton, OutlineButton, Row, Txt } from '@/ui';
import { CurrencyButton, RegionButton, TopBar } from '@/components/shared';
import { useApp } from '@/store';

function LinkRow({ icon, title, subtitle, onPress, color = C.brand }: { icon: any; title: string; subtitle: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 10 }}>
      <Card pad={14}>
        <Row gap={12}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: color + '1A', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt f={font.bodyBold} size={14.5} color={C.ink}>
              {title}
            </Txt>
            <Txt f={font.body} size={12} color={C.muted}>
              {subtitle}
            </Txt>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </Row>
      </Card>
    </Pressable>
  );
}

export default function More() {
  const { user, signOut, orders, watchlist } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar subtitle="Account & more" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Account */}
        <LinearGradient colors={GRAD.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 20 }}>
          {user ? (
            <>
              <Row gap={14}>
                <Avatar name={user.name} size={54} color={C.white} />
                <View style={{ flex: 1 }}>
                  <Txt f={font.extra} size={19} color={C.white} numberOfLines={1}>
                    {user.name}
                  </Txt>
                  <Txt f={font.body} size={12.5} color="#CFEBD9" numberOfLines={1}>
                    {user.email}
                  </Txt>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: '#FFFFFF22', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 }}>
                    <Txt f={font.bodyBold} size={10.5} color={C.white}>
                      {user.role.toUpperCase()}
                    </Txt>
                  </View>
                </View>
              </Row>
              <Row gap={10} style={{ marginTop: 18 }}>
                <GradientButton title="My orders" icon="receipt" colors={GRAD.gold} textColor={C.brandDark} onPress={() => router.push('/orders')} style={{ flex: 1 }} size="sm" />
                <OutlineButton title="Sign out" color={C.white} onPress={signOut} style={{ flex: 1, height: 40 }} />
              </Row>
            </>
          ) : (
            <>
              <Txt f={font.extra} size={20} color={C.white}>
                Welcome to iTunda
              </Txt>
              <Txt f={font.body} size={13} color="#CFEBD9" style={{ marginTop: 6, marginBottom: 16, lineHeight: 19 }}>
                Sign in to place orders, track bids and list your own produce.
              </Txt>
              <GradientButton title="Sign in / Join" icon="log-in" colors={GRAD.gold} textColor={C.brandDark} onPress={() => router.push('/login')} />
            </>
          )}
        </LinearGradient>

        {/* Quick stats */}
        <Row gap={10} style={{ marginTop: 14 }}>
          <Card pad={14} style={{ flex: 1, alignItems: 'center' }}>
            <Txt f={font.monoBold} size={22} color={C.brand}>
              {orders.length}
            </Txt>
            <Txt f={font.body} size={11} color={C.muted}>
              Orders & bids
            </Txt>
          </Card>
          <Card pad={14} style={{ flex: 1, alignItems: 'center' }}>
            <Txt f={font.monoBold} size={22} color={C.gold}>
              {watchlist.length}
            </Txt>
            <Txt f={font.body} size={11} color={C.muted}>
              Watchlist
            </Txt>
          </Card>
        </Row>

        {/* Preferences */}
        <Card style={{ marginTop: 14, marginBottom: 16 }}>
          <Txt f={font.bodyBold} size={13} color={C.textSub} style={{ marginBottom: 12, letterSpacing: 0.5 }}>
            PREFERENCES
          </Txt>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10}>
              <Ionicons name="cash-outline" size={18} color={C.brand} />
              <Txt f={font.bodySemi} size={14} color={C.ink}>
                Display currency
              </Txt>
            </Row>
            <View style={{ backgroundColor: C.brandDark, borderRadius: radius.pill }}>
              <CurrencyButton />
            </View>
          </Row>
          <View style={{ height: 1, backgroundColor: C.line2, marginVertical: 12 }} />
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Row gap={10}>
              <Ionicons name="globe-outline" size={18} color={C.brand} />
              <Txt f={font.bodySemi} size={14} color={C.ink}>
                Origin filter
              </Txt>
            </Row>
            <View style={{ backgroundColor: C.brandDark, borderRadius: radius.pill }}>
              <RegionButton />
            </View>
          </Row>
        </Card>

        <Txt f={font.bodyBold} size={13} color={C.textSub} style={{ marginBottom: 10, letterSpacing: 0.5 }}>
          DISCOVER
        </Txt>
        <LinkRow icon="people" title="Farmers directory" subtitle="26 verified growers across the world" onPress={() => router.push('/farmers')} />
        <LinkRow icon="stats-chart" title="Commodity market" subtitle="Live price board & order book" onPress={() => router.push('/(tabs)/market')} color={C.gold} />
        <LinkRow icon="add-circle" title="Sell your produce" subtitle="List a harvest with photos & provenance" onPress={() => router.push('/sell')} color={C.brandLight} />
        <LinkRow icon="receipt" title="My orders & bids" subtitle="Track your spot buys and limit bids" onPress={() => router.push('/orders')} />
        <LinkRow icon="download" title="Get the Android app" subtitle="Download the latest iTunda APK" onPress={() => router.push('/downloads')} color={C.blue} />

        <Txt f={font.body} size={11} color={C.muted} align="center" style={{ marginTop: 12 }}>
          iTunda · Global farm-to-fork commodity marketplace{'\n'}Fresh produce, direct from the farm 🌍
        </Txt>
      </ScrollView>
    </View>
  );
}
