/**
 * Sign In Screen
 * Allows existing users to sign in with email and password
 */

import React, { useState } from 'react';
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
import { ResponseType, makeRedirectUri } from 'expo-auth-session';
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

// Validation schema for sign in form
const SignInSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Google Sign In using the Expo auth proxy with implicit id_token flow.
  // Use the Expo Proxy URI which is whitelisted in Google Cloud
  const redirectUri = GOOGLE_CONFIG.expoRedirectUri;

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CONFIG.androidClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    webClientId: GOOGLE_CONFIG.webClientId,
    scopes: GOOGLE_CONFIG.scopes,
    redirectUri,
    responseType: ResponseType.IdToken,
  });

  // DEBUG: Show the redirect URI
  React.useEffect(() => {
    // console.log('Redirect URI:', redirectUri); 
    // Uncomment the line below if you need to see the URI on screen
    // Alert.alert('Debug Redirect URI', redirectUri);
  }, [redirectUri]);

  React.useEffect(() => {
    if (response?.type === 'success') {
      // Implicit flow (ResponseType.IdToken) returns id_token in params.
      // Code flow (default) returns it in response.authentication.idToken.
      const idToken =
        (response.params as any)?.id_token ??
        response.authentication?.idToken;

      if (idToken) {
        handleGoogleSignIn(idToken);
      } else {
        console.log('Google response params:', JSON.stringify(response.params));
        console.log('Google authentication:', JSON.stringify(response.authentication));
        Alert.alert(
          'Google Sign In Error',
          'No ID token received. Check the console logs for details.'
        );
      }
    } else if (response?.type === 'error') {
      console.error('Google Sign In Error full response:', JSON.stringify(response));
      const errMsg =
        (response.error as any)?.message ||
        (response.error as any)?.description ||
        JSON.stringify(response.error);
      Alert.alert('Google Sign In Failed', errMsg || 'Something went wrong. Please try again.');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    setIsLoading(true);
    try {
      await signInWithGoogle(idToken);
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
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
            <Text style={styles.subtitle}>
              Sign in to find or list parking spots
            </Text>
          </View>

          {/* Form */}
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={SignInSchema}
            onSubmit={handleSignIn}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
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

                {/* Forgot Password Link */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <Button
                  title="Sign In"
                  onPress={() => handleSubmit()}
                  loading={isLoading}
                  fullWidth
                  size="large"
                  style={styles.signInButton}
                />

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>

                <Button
                  title="Sign in with Google"
                  onPress={() => promptAsync()}
                  variant="outline"
                  fullWidth
                  size="large"
                  icon={<Ionicons name="logo-google" size={20} color={COLORS.error} />}
                  disabled={!request}
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
  signInButton: {
    marginTop: SPACING.sm,
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
});

export default SignInScreen;

