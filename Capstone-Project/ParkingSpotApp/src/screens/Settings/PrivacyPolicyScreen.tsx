/**
 * Privacy Policy Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../../constants';

const SECTIONS = [
  {
    icon: 'information-circle-outline' as const,
    title: 'Information We Collect',
    body: `We collect the following categories of personal information:

Account Information: Your name, email address, and profile photo when you register or sign in via Google or Apple.

Location Data: Your device's GPS location, used solely to display nearby parking spots and calculate distances. We do not store your precise location history.

Payment Information: Payment processing is handled entirely by Stripe. ParkSpot receives only a transaction confirmation and does not store card numbers, CVV, or bank details.

Usage Data: App interactions such as searches, bookings, and feature usage. This helps us improve the app experience and diagnose technical issues.

Device Information: Device type, operating system, and app version, used for compatibility and security purposes.`,
  },
  {
    icon: 'construct-outline' as const,
    title: 'How We Use Your Information',
    body: `We use your information to:
• Provide and operate the ParkSpot service
• Match Drivers with available parking spots
• Process and confirm bookings and payments
• Send booking confirmations and receipts by email
• Respond to support requests and disputes
• Detect and prevent fraud and abuse
• Improve and personalise the app experience
• Comply with legal obligations

We do not use your information for targeted advertising. We do not sell your personal data to third parties under any circumstances.`,
  },
  {
    icon: 'share-social-outline' as const,
    title: 'Information Sharing',
    body: `We share your information only in the following limited circumstances:

With Other Users: Your name and booking details are shared with the Host when you make a booking, and with the Driver when your spot is booked, solely to facilitate the parking transaction.

With Service Providers: We work with trusted third parties — including Stripe (payments), Firebase/Google (authentication and database), and Expo (app infrastructure) — who access your data only to perform services on our behalf, under strict confidentiality agreements.

Legal Compliance: We may disclose your information if required by law, court order, or to protect the safety, rights, or property of ParkSpot, its users, or the public.

Business Transfers: In the event of a merger or acquisition, your information may be transferred as part of that transaction.`,
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'Data Security',
    body: `We implement industry-standard security measures including:
• TLS/HTTPS encryption for all data in transit
• Firebase Security Rules to protect your Firestore data
• Stripe's PCI-DSS-compliant payment infrastructure
• Firebase Authentication for secure login

While we take all reasonable precautions, no method of electronic transmission or storage is 100% secure. We encourage you to use a strong, unique password and to sign out when using shared devices.`,
  },
  {
    icon: 'location-outline' as const,
    title: 'Location Data',
    body: `ParkSpot requests access to your device's location to show nearby parking spots and calculate distances. Specifically:

• "While Using the App" permission: Location is accessed only when the app is open.
• We do not track your location in the background.
• Location data is processed on-device and is not stored on our servers beyond the duration of a session.
• You can revoke location access at any time in your device Settings.`,
  },
  {
    icon: 'people-outline' as const,
    title: 'Third-Party Services',
    body: `ParkSpot integrates the following third-party services, each governed by their own privacy policies:

• Google (Firebase, Google Maps, Google Sign-In): privacy.google.com
• Apple (Sign in with Apple): apple.com/legal/privacy
• Stripe (Payments): stripe.com/privacy
• Expo: expo.dev/privacy

We recommend reviewing these policies as they govern data processed by these providers.`,
  },
  {
    icon: 'person-outline' as const,
    title: 'Your Rights',
    body: `You have the following rights regarding your personal data:

Access: Request a copy of the personal data we hold about you.
Correction: Request correction of inaccurate or incomplete data.
Deletion: Request deletion of your account and associated data. We will fulfil deletion requests within 30 days, subject to legal retention obligations.
Portability: Request an export of your data in a machine-readable format.
Withdrawal of Consent: Withdraw any consent you have given, including for location access.

To exercise any of these rights, contact us at privacy@parkspot.app.`,
  },
  {
    icon: 'calendar-outline' as const,
    title: 'Data Retention',
    body: `We retain your personal data for as long as your account is active or as needed to provide services. Booking records are retained for 7 years to comply with financial record-keeping obligations. After account deletion, your data is permanently removed within 30 days, except where longer retention is required by law.`,
  },
  {
    icon: 'mail-outline' as const,
    title: 'Contact Us',
    body: `For privacy-related questions, requests, or concerns, please contact our Privacy Officer:

Email: privacy@parkspot.app
Mailing Address: ParkSpot Inc., 100 Queen St W, Toronto, ON, M5H 2N1, Canada

We will respond to all requests within 30 days.`,
  },
];

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Your Privacy Matters</Text>
            <Text style={styles.heroSubtitle}>Last updated: March 1, 2025</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          ParkSpot is committed to protecting your personal information. This Privacy Policy
          explains what data we collect, how we use it, and your rights. We do not sell your data.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}>
                <Ionicons name={section.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.primary + '12', borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.lg,
  },
  heroTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  heroSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  intro: {
    fontSize: FONTS.sizes.md, color: COLORS.textSecondary, lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  section: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary + '40', borderWidth: 1, borderColor: COLORS.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  sectionIconBg: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  sectionBody: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 22 },
});

export default PrivacyPolicyScreen;
