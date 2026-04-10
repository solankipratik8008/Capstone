import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PhoneAuthProvider } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

import { Button, Input } from '../../components/common';
import { useAuth } from '../../context';
import { auth } from '../../services/firebase/config';
import { firebaseConfig } from '../../../config';
import { useAppTheme } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type NavProp = NativeStackNavigationProp<AuthStackParamList>;
type Tab = 'email' | 'phone';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { resetPassword } = useAuth();
  const theme = useAppTheme();
  const { colors, spacing, typography, radii } = theme;

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const [tab, setTab] = useState<Tab>('email');

  // Email tab state
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Phone tab state
  const [countryCode, setCountryCode] = useState<CountryCode>('CA');
  const [callingCode, setCallingCode] = useState('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // ── Email flow ─────────────────────────────────────────────────────────────
  const handleEmailReset = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setEmailLoading(true);
    try {
      await resetPassword(trimmed);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Phone flow ─────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits || digits.length < 7) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    const fullPhone = `+${callingCode}${digits}`;

    if (!recaptchaVerifier.current) {
      Alert.alert('Error', 'reCAPTCHA not ready. Please try again.');
      return;
    }

    setPhoneLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        fullPhone,
        recaptchaVerifier.current,
      );
      navigation.navigate('OtpVerification', {
        phoneNumber: fullPhone,
        mode: 'forgotPassword',
        verificationId,
      });
    } catch (error: any) {
      let msg = error.message || 'Could not send OTP. Please try again.';
      if (error.code === 'auth/operation-not-allowed') {
        msg =
          'Phone authentication is not enabled in Firebase.\n\nTo fix:\n1. Go to Firebase Console\n2. Authentication → Sign-in method\n3. Enable "Phone"\n4. Save';
      } else if (error.code === 'auth/invalid-phone-number') {
        msg = `Invalid phone number: ${fullPhone}\nInclude your country code, e.g. +1 5550001234.`;
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment and try again.';
      }
      Alert.alert('Send Failed', msg);
    } finally {
      setPhoneLoading(false);
    }
  };

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setShowPicker(false);
  };

  // ── Email-sent success view ────────────────────────────────────────────────
  if (emailSent) {
    return (
      <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={s.successContainer}>
          <View style={[s.successIcon, { backgroundColor: colors.primaryFaint }]}>
            <Ionicons name="mail" size={48} color={colors.primary} />
          </View>
          <Text style={[s.successTitle, { color: colors.textPrimary, fontSize: typography.sizes.xxl, fontWeight: typography.weights.heavy }]}>
            Check Your Email
          </Text>
          <Text style={[s.successMsg, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
            A reset link was sent to{' '}
            <Text style={{ color: colors.primary, fontWeight: typography.weights.bold }}>{email.trim()}</Text>
            .{'\n'}Follow it to set a new password.
          </Text>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: colors.primary, borderRadius: radii.lg }]}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.88}
          >
            <Text style={[s.doneBtnTxt, { color: colors.textOnPrimary, fontSize: typography.sizes.md }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: spacing.md }} onPress={() => setEmailSent(false)}>
            <Text style={{ color: colors.primary, fontSize: typography.sizes.sm }}>Didn't receive it? Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
      {/* reCAPTCHA modal – required for Firebase phone auth */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingHorizontal: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Icon + heading */}
          <View style={[s.iconWrap, { backgroundColor: colors.primaryFaint }]}>
            <Ionicons name="lock-open-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[s.title, { color: colors.textPrimary, fontSize: typography.sizes.xxl, fontWeight: typography.weights.heavy }]}>
            Reset Password
          </Text>
          <Text style={[s.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
            Choose how you'd like to reset your password.
          </Text>

          {/* Tabs */}
          <View style={[s.tabBar, { backgroundColor: colors.surfaceElevated, borderRadius: radii.lg, borderColor: colors.border }]}>
            {(['email', 'phone'] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tab, { borderRadius: radii.md }, tab === t && { backgroundColor: colors.primary }]}
                onPress={() => setTab(t)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={t === 'email' ? 'mail-outline' : 'phone-portrait-outline'}
                  size={16}
                  color={tab === t ? colors.textOnPrimary : colors.textSecondary}
                />
                <Text style={{ color: tab === t ? colors.textOnPrimary : colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginLeft: 6 }}>
                  {t === 'email' ? 'Email' : 'Phone'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Email Tab ── */}
          {tab === 'email' && (
            <View style={{ marginTop: spacing.lg }}>
              <Input
                label="Email Address"
                placeholder="Enter your registered email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                leftIcon="mail-outline"
                value={email}
                onChangeText={setEmail}
              />
              <Button
                title={emailLoading ? 'Sending…' : 'Send Reset Link'}
                onPress={handleEmailReset}
                loading={emailLoading}
                fullWidth
                size="large"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}

          {/* ── Phone Tab ── */}
          {tab === 'phone' && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={{ color: colors.textPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm }}>
                Phone Number
              </Text>

              {/* Country picker + number input row */}
              <View style={[s.phoneRow, { borderColor: colors.border, backgroundColor: colors.inputBackground, borderRadius: radii.lg }]}>
                {/* Country picker button */}
                <TouchableOpacity
                  style={[s.countryBtn, { borderRightColor: colors.border }]}
                  onPress={() => setShowPicker(true)}
                  activeOpacity={0.8}
                >
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCallingCode
                    withEmoji
                    onSelect={onSelectCountry}
                    visible={showPicker}
                    onClose={() => setShowPicker(false)}
                  />
                  <Text style={{ color: colors.textPrimary, fontSize: typography.sizes.md, marginLeft: 4 }}>
                    +{callingCode}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textMuted} style={{ marginLeft: 2 }} />
                </TouchableOpacity>

                {/* Phone number digits */}
                <TextInput
                  style={[s.phoneInput, { color: colors.textPrimary, fontSize: typography.sizes.md }]}
                  placeholder="555 000 0000"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={15}
                />
              </View>

              <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: spacing.xs, marginBottom: spacing.md }}>
                Tap the flag to select your country code.
              </Text>

              <TouchableOpacity
                style={[
                  s.sendBtn,
                  {
                    backgroundColor: phoneNumber.trim() ? colors.primary : colors.border,
                    borderRadius: radii.lg,
                    opacity: phoneLoading ? 0.75 : 1,
                  },
                ]}
                onPress={handleSendOtp}
                disabled={phoneLoading || !phoneNumber.trim()}
                activeOpacity={0.88}
              >
                {phoneLoading ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color={colors.textOnPrimary} />
                    <Text style={{ color: colors.textOnPrimary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginLeft: 8 }}>
                      Send OTP
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View style={[s.footer, { marginTop: spacing.xl }]}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md }}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.8}>
              <Text style={{ color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: 16, paddingBottom: 48 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 24 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  tabBar: { flexDirection: 'row', padding: 4, borderWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: 54, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1 },
  phoneInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  sendBtn: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  // success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { textAlign: 'center', marginBottom: 16 },
  successMsg: { textAlign: 'center', lineHeight: 24, marginBottom: 36 },
  doneBtn: { width: '100%', height: 54, alignItems: 'center', justifyContent: 'center' },
  doneBtnTxt: { fontWeight: '700' },
});

export default ForgotPasswordScreen;
