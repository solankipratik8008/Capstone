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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PhoneAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';

import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { auth } from '../../services/firebase/config';
import { getUserByPhone } from '../../services/firebase';
import { useAppTheme } from '../../theme';

type RoutePropType = RouteProp<AuthStackParamList, 'OtpVerification'>;
type NavProp = NativeStackNavigationProp<AuthStackParamList>;

const OtpVerificationScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const theme = useAppTheme();

  const { phoneNumber, verificationId } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    try {
      // Step 1: Verify OTP with Firebase Phone Auth
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);

      // Step 2: Look up the registered account by phone number
      const registeredUser = await getUserByPhone(phoneNumber);
      if (!registeredUser) {
        Alert.alert(
          'Phone Not Linked',
          'Your phone number is not linked to any account.\n\n' +
          'To fix this:\n' +
          '• Sign in with email and go to Profile → Edit Profile → add your phone number\n\n' +
          'Or use the Email tab to reset your password.',
          [
            { text: 'OK' },
          ]
        );
        setIsVerifying(false);
        return;
      }

      // Step 3: Send password reset to the linked email
      await sendPasswordResetEmail(auth, registeredUser.email);
      setVerified(true);
    } catch (error: any) {
      const msg =
        error.code === 'auth/invalid-verification-code'
          ? 'Invalid code. Please check and try again.'
          : error.code === 'auth/code-expired'
          ? 'This code has expired. Please go back and request a new one.'
          : error.code === 'auth/session-expired'
          ? 'The verification session has expired. Please go back and request a new OTP.'
          : error.message || 'Verification failed. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const colors = theme.colors;
  const spacing = theme.spacing;
  const typography = theme.typography;
  const radii = theme.radii;

  if (verified) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.primaryFaint }]}>
            <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary, fontSize: typography.sizes.xxl }]}>
            Identity Verified
          </Text>
          <Text style={[styles.successMsg, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
            A password reset link has been sent to your registered email address. Check your inbox to set a new password.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary, borderRadius: radii.lg }]}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.88}
          >
            <Text style={[styles.doneBtnText, { color: colors.textOnPrimary, fontSize: typography.sizes.md }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.iconWrap, { backgroundColor: colors.primaryFaint }]}>
            <Ionicons name="phone-portrait-outline" size={36} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.sizes.xxl, fontWeight: typography.weights.heavy }]}>
            Verify Your Phone
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={{ color: colors.primary, fontWeight: typography.weights.bold }}>{phoneNumber}</Text>
          </Text>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[
                  styles.otpBox,
                  {
                    borderColor: digit ? colors.primary : colors.border,
                    backgroundColor: digit ? colors.primaryFaint : colors.surfaceElevated,
                    color: colors.textPrimary,
                    fontSize: typography.sizes.xl,
                    fontWeight: typography.weights.bold,
                    borderRadius: radii.lg,
                  },
                ]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyBtn,
              {
                backgroundColor: otp.join('').length === 6 ? colors.primary : colors.border,
                borderRadius: radii.lg,
                opacity: isVerifying ? 0.7 : 1,
              },
            ]}
            onPress={verify}
            disabled={isVerifying || otp.join('').length !== 6}
            activeOpacity={0.88}
          >
            {isVerifying ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={[styles.verifyBtnText, { color: colors.textOnPrimary, fontSize: typography.sizes.md }]}>
                Verify & Send Reset Email
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textMuted, fontSize: typography.sizes.sm }]}>
            Didn't receive it? Go back and try again.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: { textAlign: 'center', marginBottom: 12 },
  subtitle: { textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderWidth: 2,
    textAlignVertical: 'center',
  },
  verifyBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyBtnText: { fontWeight: '700' },
  hint: { textAlign: 'center', lineHeight: 20 },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  successTitle: { fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  successMsg: { textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  doneBtn: {
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontWeight: '700' },
});

export default OtpVerificationScreen;
