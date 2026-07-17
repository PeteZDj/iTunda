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

/** Opens the site's Google sign-in bridge and resolves the profile/JWT it
 * returns. Returns null if the user cancels. Throws if the exchange fails. */
export async function googleBridgeSignIn(): Promise<GoogleBridgeResult | null> {
  const result = await WebBrowser.openAuthSessionAsync(GOOGLE_BRIDGE_URL, AUTH_REDIRECT);
  if (result.type !== 'success' || !result.url) return null;
  const frag = result.url.split('#')[1] || result.url.split('?')[1] || '';
  const params = new URLSearchParams(frag);
  const token = params.get('token') || '';
  if (!token) throw new Error('Google sign-in did not complete.');
  return {
    token,
    name: params.get('name') || 'iTunda user',
    email: params.get('email') || '',
    image: params.get('image') || undefined,
  };
}
