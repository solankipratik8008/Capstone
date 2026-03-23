/**
 * Sign In Screen — modern redesign
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
// GoogleSignin is loaded lazily via require() inside handlers to avoid crashing Expo Go
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '../../components/common';
import { useAuth } from '../../context';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, RootStackParamList } from '../../constants';
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    if (isExpoGo) return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (isExpoGo) return;
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: GOOGLE_CONFIG.webClientId });
    } catch {}
  }, []);

  const handleGoogleSignIn = async () => {
    if (isExpoGo) {
      Alert.alert('Google Sign-In Unavailable', 'Google Sign-In is not supported in Expo Go. Please use email/password, or use the production app build.');
      return;
    }
    setGoogleLoading(true);
    let GoogleSignin: any, statusCodes: any;
    try {
      ({ GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin'));
    } catch {
      setGoogleLoading(false);
      return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token returned from Google.');
      await signInWithGoogle(idToken);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (error.code === statusCodes.IN_PROGRESS) return;
      Alert.alert('Google Sign-In Failed', error.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const rawNonce = Math.random().toString(36).substring(2, 18);
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
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
      await signInWithApple(credential.identityToken, rawNonce);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple Sign-In Failed', error.message || 'Please try again.');
    } finally {
      setAppleLoading(false);
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRing}>
              <Ionicons name="car" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>ParkSpot</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to find or list parking</Text>
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, googleLoading && styles.socialBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>

            {appleAvailable && (
              <TouchableOpacity
                style={[styles.socialBtn, styles.appleBtn, appleLoading && styles.socialBtnDisabled]}
                onPress={handleAppleSignIn}
                disabled={appleLoading || isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-apple" size={20} color={COLORS.white} />
                <Text style={[styles.socialBtnText, { color: COLORS.white }]}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.divider} />
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
                  style={styles.signInBtn}
                />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1, paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl, paddingBottom: SPACING.xl,
  },

  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    borderWidth: 2, borderColor: COLORS.primary + '30',
  },
  appName: {
    fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold,
    color: COLORS.primary, letterSpacing: 1, marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONTS.sizes.xxxl, fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary, marginBottom: SPACING.xs,
  },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center' },

  socialRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.gray[200],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  appleBtn: { backgroundColor: '#000', borderColor: '#000' },
  socialBtnDisabled: { opacity: 0.5 },
  socialBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.gray[200] },
  dividerText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: FONTS.weights.medium },

  form: { marginBottom: SPACING.lg },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: SPACING.lg },
  forgotPasswordText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: FONTS.weights.medium },
  signInBtn: { borderRadius: BORDER_RADIUS.lg },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: SPACING.lg },
  footerText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  signUpLink: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: FONTS.weights.semibold },
});

export default SignInScreen;
