/**
 * Google Sign-In Configuration
 *
 * ═══════════════════════════════════════════════════════
 *  CLIENT ID GUIDE
 * ═══════════════════════════════════════════════════════
 *
 * webClientId  — Web application type client from Firebase Console →
 *                Authentication → Sign-in method → Google →
 *                Web SDK configuration → Web client ID
 *
 * iosClientId  — iOS type OAuth client from GCP → Credentials.
 *                After creating it, add the reverse client ID as a
 *                URL scheme in app.json:
 *                CFBundleURLSchemes: ["com.googleusercontent.apps.IOS_CLIENT_ID"]
 *                (replace IOS_CLIENT_ID with the part before .apps.googleusercontent.com)
 *
 * androidClientId — Android type OAuth client from GCP → Credentials.
 *                   Requires package name (com.parkspot.app) + SHA-1 fingerprint.
 *                   Get SHA-1 after EAS build: run `eas credentials -p android`
 *
 * ═══════════════════════════════════════════════════════
 *  REDIRECT URIs (for native dev/prod builds only)
 * ═══════════════════════════════════════════════════════
 *
 *  iOS:     com.googleusercontent.apps.IOS_CLIENT_ID:/oauthredirect
 *           → registered automatically via CFBundleURLSchemes in app.json
 *
 *  Android: com.googleusercontent.apps.ANDROID_CLIENT_ID:/oauthredirect
 *           → registered automatically via intent-filter in AndroidManifest
 *
 *  These custom schemes cannot be added to a Web OAuth client in GCP.
 *  They are used only by the iOS/Android OAuth clients (different client types).
 *
 * ═══════════════════════════════════════════════════════
 */

import { Platform } from 'react-native';

export const GOOGLE_CONFIG = {
  // Web application OAuth client — used by Firebase Auth & Expo Go proxy
  webClientId: '647587380585-6i4k7qv6r5fv4sguam01upt22n827u56.apps.googleusercontent.com',

  // iOS OAuth client (type: iOS) — create in GCP after you have an Apple dev account
  // URL scheme registered in app.json CFBundleURLSchemes
  iosClientId: '647587380585-lfqvq6ruaqi8hnsik291oejvenf3n0jc.apps.googleusercontent.com',

  // Android OAuth client (type: Android) — fill in after EAS build:
  // 1. Run: eas credentials -p android  → copy SHA-1
  // 2. GCP → Create credentials → OAuth client ID → Android
  //    Package: com.parkspot.app, SHA-1: <paste>
  // 3. Copy the new client ID here
  androidClientId: '647587380585-ao58ugh9hdr1u8h0fff139s882u13138.apps.googleusercontent.com',

  // Expo auth proxy — only used in Expo Go (shows info alert, not functional)
  expoRedirectUri: 'https://auth.expo.io/@pratik4094/parkingspotapp',

  // Native redirect URI — used in iOS/Android dev & production builds.
  // Format: reverse client ID + :/oauthredirect
  // The correct client ID is selected per platform automatically.
  get nativeRedirectUri() {
    const clientId = Platform.OS === 'ios'
      ? this.iosClientId
      : this.androidClientId;
    // Strip ".apps.googleusercontent.com" to get the reverse domain prefix
    const reverseId = clientId.replace('.apps.googleusercontent.com', '');
    return `com.googleusercontent.apps.${reverseId}:/oauthredirect`;
  },

  scopes: ['openid', 'profile', 'email'],
};
