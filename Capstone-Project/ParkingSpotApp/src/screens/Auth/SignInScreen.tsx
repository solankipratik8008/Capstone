import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Input } from '../../components/common';
import { RootStackParamList, UserRole } from '../../constants';
import { useAuth } from '../../context';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppTheme } from '../../theme';
import { isAppleAuthCanceled, requestAppleSignIn } from '../../utils';

const SignInSchema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signIn, signInWithApple } = useAuth();
  const { requestReady, isLoading: googleLoading, signIn: handleGoogleSignIn } = useGoogleAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const submit = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await signIn(values.email.trim(), values.password);
    } catch (error: any) {
      Alert.alert('Sign-In Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    // Apple Sign-In doesn't work in Expo Go because Apple issues the token
    // with the Expo Go bundle ID (host.exp.Exponent) instead of com.parkspot.app,
    // which Firebase rejects. A real dev build is required.
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
      Alert.alert(
        'Development Build Required',
        'Apple Sign-In is not available in Expo Go. Please use an EAS development build on a real iPhone to sign in with Apple.',
      );
      return;
    }

    setAppleLoading(true);
    try {
      const payload = await requestAppleSignIn(UserRole.USER);
      await signInWithApple(payload);
    } catch (error: any) {
      if (!isAppleAuthCanceled(error)) {
        Alert.alert('Apple Sign-In Failed', error.message || 'Please try again.');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="car-sport" size={28} color={theme.colors.textOnPrimary} />
            </View>
            <Text style={styles.brand}>ParkSpot</Text>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Find parking faster, manage listings, and keep every booking in one place.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={SignInSchema}
              validateOnBlur={false}
              validateOnChange={false}
              onSubmit={submit}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View>
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
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
                    style={styles.inlineLink}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inlineLinkText}>Forgot password?</Text>
                  </TouchableOpacity>

                  <Button
                    title="Sign In"
                    onPress={() => handleSubmit()}
                    loading={isLoading}
                    fullWidth
                    size="large"
                    style={styles.primaryButton}
                  />
                </View>
              )}
            </Formik>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title={googleLoading ? 'Connecting...' : 'Continue with Google'}
              onPress={handleGoogleSignIn}
              disabled={!requestReady || isLoading || appleLoading}
              loading={googleLoading}
              variant="outline"
              fullWidth
              icon={<Ionicons name="logo-google" size={18} color={theme.colors.primary} />}
            />

            {appleAvailable ? (
              <Button
                title={appleLoading ? 'Connecting...' : 'Continue with Apple'}
                onPress={handleAppleSignIn}
                disabled={isLoading || googleLoading}
                loading={appleLoading}
                variant="secondary"
                fullWidth
                style={styles.secondaryButton}
                icon={<Ionicons name="logo-apple" size={18} color={theme.colors.textPrimary} />}
              />
            ) : null}
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Need an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.8}>
              <Text style={styles.footerLink}> Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = ({ colors, spacing, typography, radii }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    hero: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      paddingTop: spacing.lg,
    },
    logo: {
      width: 64,
      height: 64,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    brand: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.sizes.xxxl,
      fontWeight: typography.weights.heavy,
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
      lineHeight: 22,
      textAlign: 'center',
      maxWidth: 320,
    },
    formCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    inlineLink: {
      alignSelf: 'flex-end',
      marginTop: -spacing.xs,
      marginBottom: spacing.lg,
    },
    inlineLinkText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    primaryButton: {
      marginTop: spacing.sm,
    },
    secondaryButton: {
      marginTop: spacing.md,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.lg,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
      letterSpacing: 1,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
    },
    footerLink: {
      color: colors.primary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
  });

export default SignInScreen;
