/**
 * Google OAuth configuration for ParkSpot.
 *
 * Native Google sign-in requires a development build or production build.
 * Expo Go cannot complete OAuth redirects for Google because the app scheme
 * is not customizable there.
 */

export const GOOGLE_CONFIG = {
  webClientId: '647587380585-6i4k7qv6r5fv4sguam01upt22n827u56.apps.googleusercontent.com',
  expoClientId: '647587380585-6i4k7qv6r5fv4sguam01upt22n827u56.apps.googleusercontent.com',
  iosClientId: '647587380585-lfqvq6ruaqi8hnsik291oejvenf3n0jc.apps.googleusercontent.com',
  androidClientId: '647587380585-d4mjmoobo5ooi6kks4tsipdethneafd7.apps.googleusercontent.com',
  scopes: ['openid', 'profile', 'email'],
};

export default GOOGLE_CONFIG;
