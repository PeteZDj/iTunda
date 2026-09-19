import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { parseGoogleBridgeUrl } from '@/lib/googleBridge';
import { useApp } from '@/store';
import { C, font } from '@/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { signIn } = useApp();
  const searchParams = useLocalSearchParams();
  const incomingUrl = Linking.useURL();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const process = async () => {
      let candidateUrl = incomingUrl || '';
      if (!candidateUrl) {
        try {
          candidateUrl = (await Linking.getInitialURL()) || '';
        } catch {
          // ignore
        }
      }

      let parsed = candidateUrl ? parseGoogleBridgeUrl(candidateUrl) : null;

      if (!parsed && searchParams.token) {
        parsed = {
          token: String(searchParams.token),
          name: searchParams.name ? String(searchParams.name) : 'iTunda user',
          email: searchParams.email ? String(searchParams.email) : '',
        };
      }

      if (parsed && parsed.token) {
        handledRef.current = true;
        signIn(parsed.name, parsed.email, 'Buyer', 'google');
        router.replace('/');
        return;
      }

      const timer = setTimeout(() => {
        if (!handledRef.current) {
          setErrorMsg('Authentication timed out. Please try signing in again.');
        }
      }, 4000);

      return () => clearTimeout(timer);
    };

    process();
  }, [incomingUrl, searchParams, router, signIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={C.brand} />
      <Text style={styles.title}>Completing sign-in...</Text>
      <Text style={styles.subtitle}>Connecting your account to iTunda</Text>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Pressable style={styles.retryBtn} onPress={() => router.replace('/login')}>
            <Text style={styles.retryText}>Back to Sign In</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 18,
    color: C.ink,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 13,
    color: C.textSub,
    marginTop: 4,
  },
  errorBox: {
    marginTop: 24,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: font.body,
    fontSize: 13,
    color: C.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: C.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontFamily: font.semi,
    fontSize: 14,
    color: C.white,
  },
});
