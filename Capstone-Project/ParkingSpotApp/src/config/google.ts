/**
 * Google Sign-In Configuration
 *
 * ═══════════════════════════════════════════════════════
 *  HOW TO GET THE WEB CLIENT ID (webClientId)
 * ═══════════════════════════════════════════════════════
 *
 * The webClientId is NOT the Android or iOS client.
 * It is a separate "Web application" type OAuth client.
 *
 * STEP 1 — Find it in Firebase:
 *   a. Go to https://console.firebase.google.com
 *   b. Select your project → Authentication → Sign-in method
 *   c. Click the Google row to expand it
 *   d. Under "Web SDK configuration" you will see "Web client ID"
 *      Copy that value. It is different from the Android/iOS client IDs.
 *
 * STEP 2 — Register the Expo proxy redirect URI:
 *   a. Go to https://console.cloud.google.com
 *   b. APIs & Services → Credentials
 *   c. Find the client matching the Web client ID you copied in Step 1
 *      (It is labelled "Web client (auto created by Google Service)")
 *   d. Click Edit (pencil icon)
 *   e. Under "Authorized redirect URIs" click Add URI and enter:
 *        https://auth.expo.io/@pratik4094/parkingspotapp
 *   f. Click Save. Wait 1–2 minutes.
 *
 * ⚠️  DO NOT set webClientId to the same value as androidClientId.
 *     They are different OAuth clients with different types.
 * ═══════════════════════════════════════════════════════
 */

export const GOOGLE_CONFIG = {
  /**
   * Web application OAuth client ID — from Firebase Console:
   * Authentication → Sign-in method → Google → "Web SDK configuration" → Web client ID
   *
   * Replace the placeholder below with your actual Web client ID.
   * It will look different from the iOS/Android client IDs below.
   */
  webClientId: 'PASTE_FIREBASE_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',

  // iOS OAuth client (type: iOS) — already registered in app.json URL scheme
  iosClientId: '647587380585-lfqvq6ruaqi8hnsik291oejvenf3n0jc.apps.googleusercontent.com',

  // Android OAuth client (type: Android) — do NOT use this as webClientId
  androidClientId: '647587380585-ao58ugh9hdr1u8h0fff139s882u13138.apps.googleusercontent.com',

  // Expo auth proxy redirect URI registered in GCP (Step 2 above)
  expoRedirectUri: 'https://auth.expo.io/@pratik4094/parkingspotapp',

  scopes: ['openid', 'profile', 'email'],
};
