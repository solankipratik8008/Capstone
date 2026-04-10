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
import { RootStackParamList, UserRole, VALIDATION } from '../../constants';
import { useAuth } from '../../context';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppTheme } from '../../theme';
import { isAppleAuthCanceled, requestAppleSignIn } from '../../utils';

const SignUpSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Name must be at least 2 characters').required('Full name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{6,14}$/, 'Enter a valid phone number with country code, e.g. +1 555 000 0000')
    .optional(),
  password: Yup.string()
    .min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`)
    .matches(/[a-zA-Z]/, 'Password must include a letter')
    .matches(/[0-9]/, 'Password must include a number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ROLE_OPTIONS = [
  {
    value: UserRole.USER,
    title: 'Find Parking',
    subtitle: 'Book spots quickly near work, school, or events.',
    icon: 'search-outline' as const,
  },
  {
    value: UserRole.HOMEOWNER,
    title: 'List Parking',
    subtitle: 'Earn money by renting your driveway, garage, or lot.',
    icon: 'home-outline' as const,
  },
];

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signUp, signInWithApple } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const { requestReady, isLoading: googleLoading, signIn: handleGoogleSignIn } = useGoogleAuth({
    role: selectedRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const submit = async (values: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => {
    setIsLoading(true);
    try {
      await signUp(
        values.email.trim(),
        values.password,
        values.name.trim(),
        selectedRole,
        values.phone.trim() || undefined,
      );
    } catch (error: any) {
      Alert.alert('Sign-Up Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
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
      const payload = await requestAppleSignIn(selectedRole);
      await signInWithApple(payload);
    } catch (error: any) {
      if (!isAppleAuthCanceled(error)) {
        Alert.alert('Apple Sign-Up Failed', error.message || 'Please try again.');
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.hero}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join ParkSpot to book or rent parking with confidence.</Text>
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.sectionLabel}>I want to</Text>
            <View style={styles.roleRow}>
              {ROLE_OPTIONS.map((option) => {
                const selected = selectedRole === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.roleCard, selected && styles.roleCardSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedRole(option.value)}
                  >
                    <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={selected ? theme.colors.textOnPrimary : theme.colors.primary}
                      />
                    </View>
                    <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>{option.title}</Text>
                    <Text style={[styles.roleSubtitle, selected && styles.roleSubtitleSelected]}>
                      {option.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Formik
              initialValues={{ name: '', email: '', phone: '', password: '', confirmPassword: '' }}
              validationSchema={SignUpSchema}
              validateOnBlur={false}
              validateOnChange={false}
              onSubmit={submit}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View>
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    autoCapitalize="words"
                    autoComplete="name"
                    leftIcon="person-outline"
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    error={errors.name}
                    touched={touched.name}
                  />

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
                    label="Phone Number (optional)"
                    placeholder="+1 555 000 0000"
                    keyboardType="phone-pad"
                    leftIcon="phone-portrait-outline"
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    error={errors.phone}
                    touched={touched.phone}
                  />

                  <Input
                    label="Password"
                    placeholder="Create a password"
                    isPassword
                    leftIcon="lock-closed-outline"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    error={errors.password}
                    touched={touched.password}
                  />

                  <Input
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    isPassword
                    leftIcon="lock-closed-outline"
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    error={errors.confirmPassword}
                    touched={touched.confirmPassword}
                  />

                  <Button
                    title="Create Account"
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
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.8}>
              <Text style={styles.footerLink}> Sign in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            By creating an account you agree to our terms and privacy policy.
          </Text>
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
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hero: {
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
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
    },
    formCard: {
      padding: spacing.lg,
    },
    sectionLabel: {
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      marginBottom: spacing.md,
    },
    roleRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    roleCard: {
      flex: 1,
      borderRadius: radii.xl,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: spacing.md,
      backgroundColor: colors.surface,
      minHeight: 146,
    },
    roleCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryFaint,
    },
    roleIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryFaint,
      marginBottom: spacing.md,
    },
    roleIconSelected: {
      backgroundColor: colors.primary,
    },
    roleTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      marginBottom: spacing.xs,
    },
    roleTitleSelected: {
      color: colors.primary,
    },
    roleSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      lineHeight: 18,
    },
    roleSubtitleSelected: {
      color: colors.textSecondary,
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
      marginTop: spacing.lg,
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
    legal: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });

export default SignUpScreen;
