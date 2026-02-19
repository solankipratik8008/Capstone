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
    // Web Client ID from Google Cloud Console (OAuth 2.0 > Web application type)
    webClientId: '647587380585-ao58ugh9hdr1u8h0fff139s882u13138.apps.googleusercontent.com',

    // For standalone native builds, create separate iOS/Android OAuth clients in
    // Google Cloud Console and replace these. For Expo Go they fall back to webClientId.
    iosClientId: '647587380585-ao58ugh9hdr1u8h0fff139s882u13138.apps.googleusercontent.com',
    androidClientId: '647587380585-ao58ugh9hdr1u8h0fff139s882u13138.apps.googleusercontent.com',

    // Expo Go proxy redirect URI — already registered in Google Cloud Console.
    // expo-auth-session v7 removed useProxy:true, so we pass this URI explicitly.
    expoRedirectUri: 'https://auth.expo.io/@solankipratik4094/parking-spot-app',

    scopes: ['openid', 'profile', 'email'],
};
