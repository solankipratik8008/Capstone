import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { GOOGLE_CONFIG } from '../config/google';
import { useAuth } from '../context';
import { UserRole } from '../constants';

WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthOptions {
  role?: UserRole;
}

interface GoogleAuthResult {
  requestReady: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
}

export const useGoogleAuth = (options: GoogleAuthOptions = {}): GoogleAuthResult => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    scopes: GOOGLE_CONFIG.scopes,
    selectAccount: true,
  }, {
    native: 'com.parkspot.app:/oauthredirect',
  });

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === 'dismiss' || response.type === 'cancel') {
      setIsLoading(false);
      return;
    }

    if (response.type === 'error') {
      setIsLoading(false);
      Alert.alert('Google Sign-In Failed', response.error?.message || 'Please try again.');
      return;
    }

    if (response.type !== 'success') {
      setIsLoading(false);
      return;
    }

    const params = response.params as Record<string, string | undefined>;
    const idToken = params.id_token || response.authentication?.idToken;
    const accessToken = params.access_token || response.authentication?.accessToken;

    (async () => {
      try {
        await signInWithGoogle(idToken, accessToken, options.role);
      } catch (error: any) {
        Alert.alert('Google Sign-In Failed', error.message || 'Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [options.role, response, signInWithGoogle]);

  const signIn = async () => {
    if (!request) {
      Alert.alert('Google Sign-In', 'Google Sign-In is still initializing. Please try again.');
      return;
    }

    if (Platform.OS !== 'web' && request.redirectUri.startsWith('exp://')) {
      Alert.alert(
        'Use a development build',
        'Google OAuth is not supported in Expo Go. Use `npx expo run:android`, `npx expo run:ios`, or an EAS build for Google sign-in.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Google Sign-In Failed', error.message || 'Please try again.');
    }
  };

  return {
    requestReady: Boolean(request),
    isLoading,
    signIn,
  };
};

export default useGoogleAuth;
