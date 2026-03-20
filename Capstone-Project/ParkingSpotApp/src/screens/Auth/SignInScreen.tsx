/**
 * Sign In Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '../../components/common';
import { useAuth } from '../../context';
import { COLORS, SPACING, FONTS, RootStackParamList } from '../../constants';
import { GOOGLE_CONFIG } from '../../config/google';

WebBrowser.maybeCompleteAuthSession();

const SignInSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Check Apple availability once on mount
  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  // Google Sign-In — implicit IdToken flow through the Expo auth proxy.
  // webClientId must be the Web client from Firebase Console →
  // Authentication → Sign-in method → Google → Web SDK configuration.
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    scopes: GOOGLE_CONFIG.scopes,
    responseType: ResponseType.IdToken,
    redirectUri: GOOGLE_CONFIG.expoRedirectUri,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken =
        (response.params as any)?.id_token ??
        response.authentication?.idToken;

      if (idToken) {
        handleGoogleSignIn(idToken);
      } else {
        Alert.alert('Google Sign-In Error', 'No ID token returned. Please try again.');
      }
    } else if (response.type === 'error') {
      const msg =
        (response.error as any)?.message ||
        (response.error as any)?.description ||
        'Google sign-in failed. Please try again.';
      Alert.alert('Google Sign-In Failed', msg);
    }
    // 'dismiss' and 'cancel' are silent — user closed the window intentionally
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    setIsLoading(true);
    try {
      await signInWithGoogle(idToken);
    } catch (error: any) {
      Alert.alert('Sign-In Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // Generate a random nonce; hash it for Apple, keep original for Firebase
      const rawNonce = Math.random().toString(36).substring(2, 18);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        Alert.alert('Apple Sign-In Error', 'No identity token returned.');
        return;
      }

      setIsLoading(true);
      await signInWithApple(credential.identityToken, rawNonce);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return; // user dismissed
      Alert.alert('Apple Sign-In Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
    } catch (error: any) {
      Alert.alert('Sign-In Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="car" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to find or list parking spots</Text>
          </View>

          {/* Form */}
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={SignInSchema}
            onSubmit={handleSignIn}
            validateOnBlur={false}
            validateOnChange={false}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={errors.email}
                  touched={touched.email}
                />

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  leftIcon="lock-closed-outline"
                  isPassword
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={errors.password}
                  touched={touched.password}
                />

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <Button
                  title="Sign In"
                  onPress={() => handleSubmit()}
                  loading={isLoading}
                  fullWidth
                  size="large"
                  style={styles.primaryButton}
                />

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>

                {/* Google Sign-In */}
                <Button
                  title="Continue with Google"
                  onPress={() => promptAsync()}
                  variant="outline"
                  fullWidth
                  size="large"
                  icon={<Ionicons name="logo-google" size={20} color={COLORS.error} />}
                  disabled={!request || isLoading}
                  style={styles.socialButton}
                />

                {/* Apple Sign-In — iOS only, shown only when available */}
                {appleAvailable && (
                  <TouchableOpacity
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-apple" size={20} color={COLORS.white} />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Formik>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  primaryButton: {
    marginTop: SPACING.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  socialButton: {
    marginBottom: SPACING.sm,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  appleButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
});

export default SignInScreen;
