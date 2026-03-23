/**
 * Terms of Service Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../../constants';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, accessing, or using the ParkSpot mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.

These Terms constitute a legally binding agreement between you and ParkSpot Inc. ("ParkSpot", "we", "us", or "our"). We reserve the right to modify these Terms at any time. Continued use of the App after changes are posted constitutes acceptance of the revised Terms.`,
  },
  {
    title: '2. Description of Service',
    body: `ParkSpot is a peer-to-peer parking marketplace that connects individuals who have parking spaces to rent ("Hosts") with individuals seeking parking ("Drivers"). ParkSpot acts solely as an intermediary and is not responsible for the conduct of Hosts or Drivers.

The App allows users to:
• List personal parking spaces for rent
• Search and book available parking spaces
• Process payments securely through Stripe
• Communicate with other users via in-app messaging`,
  },
  {
    title: '3. User Accounts',
    body: `To use most features of the App, you must create an account. You agree to:
• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Notify us immediately of any unauthorised account access
• Accept responsibility for all activities under your account

You must be at least 18 years old to create an account. Accounts are non-transferable.`,
  },
  {
    title: '4. Bookings and Payments',
    body: `All bookings are binding once payment is successfully processed. By confirming a booking, Drivers agree to occupy the parking space only for the booked duration and to vacate promptly at the booking end time.

All payments are processed by Stripe Inc. ParkSpot does not store credit or debit card information on its servers. ParkSpot charges a platform fee on each transaction, which is deducted before payouts to Hosts.

Prices displayed in the App are in Canadian Dollars (CAD) unless otherwise stated.`,
  },
  {
    title: '5. Cancellation and Refunds',
    body: `Drivers may cancel a confirmed booking subject to the following policy:
• Cancellation more than 2 hours before the start time: full refund
• Cancellation within 2 hours of the start time: no refund

Hosts may cancel a booking, but repeated cancellations may result in account suspension. In such cases, affected Drivers will receive a full refund.

Refunds are processed through Stripe and typically appear within 3–5 business days.`,
  },
  {
    title: '6. Host Responsibilities',
    body: `Hosts agree that the parking space listed:
• Is legally available for rent and you have the right to sublease it
• Matches the description, photos, and amenities provided in the listing
• Is safe, accessible, and free of hazards
• Complies with all local laws, bylaws, and HOA rules

ParkSpot is not responsible for legal violations by Hosts. Hosts are solely responsible for any taxes applicable to their rental income.`,
  },
  {
    title: '7. Driver Responsibilities',
    body: `Drivers agree to:
• Arrive and depart within the booked time window
• Not cause damage to the parking space or surrounding property
• Comply with all posted signs, restrictions, and Host instructions
• Not use the space for any purpose other than vehicle parking

Drivers are liable for any damage caused during their booking period.`,
  },
  {
    title: '8. QR Code Parking Access',
    body: `When a booking is confirmed at a participating facility, you will receive a unique QR code valid for the duration of your booking. This QR code:
• Is for single-vehicle use only
• Is non-transferable
• Becomes invalid after the booking end time
• Must not be shared or duplicated

Misuse of QR codes may result in account suspension and potential legal liability.`,
  },
  {
    title: '9. Prohibited Conduct',
    body: `You agree not to:
• Provide false or misleading information in listings or profiles
• Circumvent the App's payment system by arranging payments off-platform
• Harass, threaten, or abuse other users
• Use the App for any illegal purpose
• Attempt to reverse-engineer, scrape, or exploit the App's systems
• Create fake reviews or manipulate ratings

Violation of these prohibitions may result in immediate account termination.`,
  },
  {
    title: '10. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, ParkSpot shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, including but not limited to vehicle damage, theft, personal injury, or loss of earnings.

ParkSpot's total liability to you for any claim shall not exceed the amount you paid to ParkSpot in the 12 months preceding the claim.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms are governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes arising from these Terms shall be resolved in the courts of Ontario, Canada.`,
  },
  {
    title: '12. Contact Us',
    body: `If you have questions about these Terms, please contact us at:

ParkSpot Inc.
Email: legal@parkspot.app
Mailing Address: 100 Queen St W, Toronto, ON, Canada, M5H 2N1`,
  },
];

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.effectiveDate}>Effective Date: March 1, 2025</Text>
        <Text style={styles.intro}>
          Please read these Terms of Service carefully before using the ParkSpot application.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
          <Text style={styles.footerText}>
            By using ParkSpot, you confirm that you have read and agreed to these Terms.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  effectiveDate: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.sm },
  intro: {
    fontSize: FONTS.sizes.md, color: COLORS.textSecondary, lineHeight: 22,
    backgroundColor: COLORS.primary + '10', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  sectionBody: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, lineHeight: 24 },
  footer: {
    flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start',
    backgroundColor: COLORS.primary + '10', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginTop: SPACING.md,
  },
  footerText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
});

export default TermsOfServiceScreen;
