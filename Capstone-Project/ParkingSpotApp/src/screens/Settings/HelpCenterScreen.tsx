/**
 * Help Center Screen
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../../constants';

const FAQS = [
  {
    question: 'How do I list my parking spot?',
    answer:
      'Tap the "+" tab at the bottom of the screen, fill in your spot details — location, price, availability, and photos — then tap "List Spot". Your spot will be visible to other users within minutes.',
  },
  {
    question: 'How do I book a parking spot?',
    answer:
      'Browse spots on the map or use the Search tab. Tap a spot to view details, then tap "Book Now". Select your start time and duration, review the total, and complete payment via Stripe.',
  },
  {
    question: 'Can I cancel a booking?',
    answer:
      'Yes. Go to Profile → My Bookings and tap "Cancel" on the booking. Cancellations made more than 2 hours before the booking start time qualify for a full refund, processed within 3–5 business days.',
  },
  {
    question: 'How do payments work?',
    answer:
      'All payments are securely processed by Stripe. Your card details are encrypted and never stored on ParkSpot\'s servers. After a successful booking, a receipt is sent to your email.',
  },
  {
    question: 'What is the QR code for?',
    answer:
      'After a confirmed booking, you receive a unique QR code. Show this at the entry/exit gate of the parking facility. The code contains your booking ID and is valid only for your booked time window.',
  },
  {
    question: 'How are parking spot owners paid?',
    answer:
      'Earnings are deposited directly to your linked bank account via Stripe Connect, typically within 2 business days after a booking is completed. A small platform fee is deducted per transaction.',
  },
  {
    question: 'Is my personal information safe?',
    answer:
      'Yes. We use Firebase Authentication with industry-standard encryption. Your location data is only used to show nearby parking spots and is never sold to third parties. Read our Privacy Policy for full details.',
  },
  {
    question: 'What if the spot is not as described?',
    answer:
      'Please report the issue through the spot\'s details page or contact us at support@parkspot.app. We investigate all reports and can issue refunds if the spot is misrepresented.',
  },
];

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqItem, open && styles.faqItemOpen]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.primary}
        />
      </View>
      {open && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

export const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions below, or reach out to our support team.
          </Text>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, i) => (
          <FAQItem key={i} question={faq.question} answer={faq.answer} />
        ))}

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>Our support team responds within 24 hours.</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@parkspot.app')}
          >
            <Ionicons name="mail-outline" size={18} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
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
    backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  hero: { alignItems: 'center', marginBottom: SPACING.xl, paddingTop: SPACING.md },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  heroSubtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  sectionTitle: {
    fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary,
    marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  faqItem: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  faqItemOpen: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, marginRight: SPACING.sm },
  faqAnswer: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, lineHeight: 22, marginTop: SPACING.sm },
  contactCard: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, marginTop: SPACING.lg, alignItems: 'center',
  },
  contactTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white, marginBottom: SPACING.xs },
  contactSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.white + 'CC', marginBottom: SPACING.lg, textAlign: 'center' },
  contactButton: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white + '25', borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderWidth: 1, borderColor: COLORS.white + '50',
  },
  contactButtonText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },
});

export default HelpCenterScreen;
