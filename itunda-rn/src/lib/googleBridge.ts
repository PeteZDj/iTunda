// Browser-based Google sign-in bridge. Reuses the iTunda website's Google login
// (itunda.org/mobile-signin.html), which verifies the credential server-side and
// hands the real iTunda JWT back to the app via the `itunda://auth` deep link.

import * as WebBrowser from 'expo-web-browser';

const SITE = 'https://itunda.org';
export const GOOGLE_BRIDGE_URL = `${SITE}/mobile-signin.html`;
export const AUTH_REDIRECT = 'itunda://auth';

export interface GoogleBridgeResult {
  token: string;
  name: string;
  email: string;
  image?: string;
}

export function parseGoogleBridgeUrl(url: string): GoogleBridgeResult | null {
  try {
    const raw = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^?#]*/, '');
    const queryPart = raw.includes('?') ? raw.split('?')[1]?.split('#')[0] : '';
    const hashPart = raw.includes('#') ? raw.split('#')[1] : '';

    const queryParams = new URLSearchParams(queryPart || '');
    const hashParams = new URLSearchParams(hashPart || '');

    const token = hashParams.get('token') || queryParams.get('token') || '';
    if (!token) return null;

    return {
      token,
      name: hashParams.get('name') || queryParams.get('name') || 'iTunda user',
      email: hashParams.get('email') || queryParams.get('email') || '',
      image: hashParams.get('image') || queryParams.get('image') || undefined,
    };
  } catch {
    return null;
  }
}

/** Opens the site's Google sign-in bridge and resolves the profile/JWT it
 * returns. Returns null if the user cancels. Throws if the exchange fails. */
export async function googleBridgeSignIn(): Promise<GoogleBridgeResult | null> {
  const result = await WebBrowser.openAuthSessionAsync(GOOGLE_BRIDGE_URL, AUTH_REDIRECT);
  if (result.type !== 'success' || !result.url) return null;
  const parsed = parseGoogleBridgeUrl(result.url);
  if (!parsed || !parsed.token) throw new Error('Google sign-in did not complete.');
  return parsed;
}

