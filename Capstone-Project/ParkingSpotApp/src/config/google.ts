/**
 * Google Sign-In Configuration
 *
 * HOW TO GET YOUR WEB CLIENT ID (do this every time the client gets deleted):
 * 1. Go to https://console.firebase.google.com → ParkingSpotApp project
 * 2. Click Authentication → Sign-in method → Google → expand the Google row
 * 3. Under "Web SDK configuration" copy the "Web client ID"
 *    (It looks like: 647587380585-xxxx.apps.googleusercontent.com)
 * 4. Paste it as webClientId below.
 * 5. Then go to https://console.cloud.google.com → APIs & Services → Credentials
 * 6. Find that client → click Edit → under "Authorized redirect URIs" add:
 *    https://auth.expo.io/@pratik4094/parkingspotapp
 * 7. Save and wait ~1 minute for changes to propagate.
 *
 * DO NOT delete this client from GCP — it will break Google Sign-In.
 */

export const GOOGLE_CONFIG = {
  // ⚠️  Replace this with the Web client ID from Firebase Console (step 3 above)
  // Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
  webClientId: 'REPLACE_WITH_FIREBASE_WEB_CLIENT_ID.apps.googleusercontent.com',

  // iOS OAuth client — registered in app.json CFBundleURLSchemes
  iosClientId: '647587380585-lfqvq6ruaqi8hnsik291oejvenf3n0jc.apps.googleusercontent.com',

  // Android OAuth client
  androidClientId: '647587380585-ao58ugh9hdr1u8h0fff139s882u13138.apps.googleusercontent.com',

  // Expo auth proxy redirect URI — must be added to the web client's authorized redirect URIs
  // in GCP Console every time a new client is created.
  expoRedirectUri: 'https://auth.expo.io/@pratik4094/parkingspotapp',

  scopes: ['openid', 'profile', 'email'],
};
