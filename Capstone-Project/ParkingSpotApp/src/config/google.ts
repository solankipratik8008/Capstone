/**
 * Google Sign-In Configuration
 * Contains client IDs for Expo Go, iOS, Android, and Web
 *
 * TO GET YOUR CLIENT IDS:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Select your project
 * 3. Go to APIs & Services > Credentials
 * 4. Create OAuth Client ID for each platform (Web, iOS, Android)
 * 5. Update the values below
 *
 * FOR FIREBASE AUTH:
 * Make sure to enable Google Sign-In method in Firebase Console > Authentication > Sign-in method
 * And add your implementation details.
 */

export const GOOGLE_CONFIG = {
    // Web Client ID (OAuth 2.0 > Web application type) — used by Expo auth proxy
    webClientId: '647587380585-6i4k7qv6r5fv4sguam01upt22n827u56.apps.googleusercontent.com',

    // iOS and Android OAuth clients
    iosClientId: '647587380585-lfqvq6ruaqi8hnsik291oejvenf3n0jc.apps.googleusercontent.com',
    androidClientId: '647587380585-ao58ugh9hdr1u8h0fff139s882u13138.apps.googleusercontent.com',

    // Expo Go proxy redirect URI — registered in Google Cloud Console as an authorized redirect URI.
    expoRedirectUri: 'https://auth.expo.io/@pratik4094/parkingspotapp',

    scopes: ['openid', 'profile', 'email'],
};
