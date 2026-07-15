import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, GRAD, font, radius } from '@/theme';
import { GradientButton, OutlineButton, Row, Txt } from '@/ui';
import { DEMO_ACCOUNTS, useApp, type Role } from '@/store';

const inputStyle = {
  backgroundColor: C.card,
  borderWidth: 2,
  borderColor: C.line,
  borderRadius: radius.sm,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontFamily: font.bodySemi,
  fontSize: 15,
  color: C.ink,
} as const;

export default function Login() {
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();
  const [role, setRole] = useState<Role>('Buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'join'>('signin');

  const go = (n: string, e: string, r: Role, provider: 'email' | 'google' | 'demo' = 'email') => {
    signIn(n || e.split('@')[0], e, r, provider);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={GRAD.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 16, paddingBottom: 26, paddingHorizontal: 20 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={8}>
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={18}>🌿</Txt>
            </View>
            <Txt f={font.extra} size={20} color={C.white}>
              iTunda
            </Txt>
          </Row>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={C.white} />
          </Pressable>
        </Row>
        <Txt f={font.black} size={24} color={C.white} style={{ marginTop: 20 }}>
          {mode === 'signin' ? 'Welcome back' : 'Join iTunda'}
        </Txt>
        <Txt f={font.body} size={13.5} color="#CFEBD9" style={{ marginTop: 6 }}>
          {mode === 'signin' ? 'Sign in to place orders and track your bids.' : 'Create an account to buy or sell produce.'}
        </Txt>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
        {/* Role */}
        <Row gap={10} style={{ marginBottom: 18 }}>
          {(['Buyer', 'Farmer'] as Role[]).map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={{ flex: 1 }}>
              <View style={{ borderWidth: 2, borderColor: role === r ? C.brand : C.line, backgroundColor: role === r ? C.brandMuted : C.card, borderRadius: radius.md, padding: 14, alignItems: 'center' }}>
                <Ionicons name={r === 'Buyer' ? 'cart' : 'leaf'} size={22} color={role === r ? C.brand : C.muted} />
                <Txt f={font.bodyBold} size={14} color={role === r ? C.brand : C.textSub} style={{ marginTop: 6 }}>
                  {r === 'Buyer' ? "I'm a Buyer" : "I'm a Farmer"}
                </Txt>
              </View>
            </Pressable>
          ))}
        </Row>

        {mode === 'join' && (
          <View style={{ marginBottom: 14 }}>
            <Txt f={font.bodySemi} size={12.5} color={C.textSub} style={{ marginBottom: 6 }}>
              Full name
            </Txt>
            <TextInput value={name} onChangeText={setName} placeholder="Your name or farm name" placeholderTextColor={C.muted} style={inputStyle} />
          </View>
        )}
        <View style={{ marginBottom: 14 }}>
          <Txt f={font.bodySemi} size={12.5} color={C.textSub} style={{ marginBottom: 6 }}>
            Email
          </Txt>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={C.muted} style={inputStyle} />
        </View>
        <View style={{ marginBottom: 18 }}>
          <Txt f={font.bodySemi} size={12.5} color={C.textSub} style={{ marginBottom: 6 }}>
            Password
          </Txt>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={C.muted} style={inputStyle} />
        </View>

        <GradientButton title={mode === 'signin' ? 'Sign in' : 'Create account'} icon="log-in" onPress={() => go(name, email || 'you@itunda.org', role)} />

        <Row style={{ alignItems: 'center', marginVertical: 18 }} gap={10}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
          <Txt f={font.body} size={12} color={C.muted}>
            or
          </Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
        </Row>

        <OutlineButton title="Continue with Google" icon="logo-google" onPress={() => go('Google User', 'user@gmail.com', role, 'google')} />

        {/* Demo accounts */}
        <Txt f={font.bodySemi} size={12} color={C.textSub} style={{ marginTop: 22, marginBottom: 10 }}>
          Or try a demo account
        </Txt>
        {DEMO_ACCOUNTS.map((d) => (
          <Pressable key={d.email} onPress={() => go(d.label.split(' — ')[0], d.email, d.role, 'demo')} style={{ marginBottom: 8 }}>
            <Row style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: radius.md, padding: 13, justifyContent: 'space-between' }}>
              <Row gap={10}>
                <Ionicons name={d.role === 'Farmer' ? 'leaf' : 'cart'} size={18} color={C.brand} />
                <Txt f={font.bodySemi} size={13.5} color={C.ink}>
                  {d.label}
                </Txt>
              </Row>
              <Ionicons name="arrow-forward" size={16} color={C.muted} />
            </Row>
          </Pressable>
        ))}

        <Pressable onPress={() => setMode(mode === 'signin' ? 'join' : 'signin')} style={{ marginTop: 20, alignItems: 'center' }}>
          <Txt f={font.body} size={13} color={C.muted}>
            {mode === 'signin' ? "New to iTunda? " : 'Already have an account? '}
            <Txt f={font.bodyBold} size={13} color={C.brand}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </Txt>
          </Txt>
        </Pressable>
      </ScrollView>
    </View>
  );
}
