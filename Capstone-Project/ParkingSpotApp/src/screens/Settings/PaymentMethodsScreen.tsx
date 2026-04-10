/**
 * Payment Methods Screen
 * Shows payment info and explains how Stripe handles card storage.
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../../constants';

const ACCEPTED_CARDS = [
  { name: 'Visa', icon: '💳', color: '#1A1F71' },
  { name: 'Mastercard', icon: '💳', color: '#EB001B' },
  { name: 'American Express', icon: '💳', color: '#007BC1' },
  { name: 'Apple Pay', icon: '', color: '#000' },
  { name: 'Google Pay', icon: '🔵', color: '#4285F4' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Secure Checkout',
    desc: 'When you book a spot, you enter your card details in a Stripe-hosted payment sheet — never our own servers.',
  },
  {
    step: '2',
    title: 'PCI-DSS Compliant',
    desc: 'Stripe is certified to the highest security standard (PCI Level 1). Your card number is tokenised immediately.',
  },
  {
    step: '3',
    title: 'Instant Confirmation',
    desc: 'Once payment is approved, your booking is confirmed and a receipt is emailed to you automatically.',
  },
  {
    step: '4',
    title: 'Easy Refunds',
    desc: 'Eligible refunds are processed back to your original payment method within 3–5 business days.',
  },
];

export const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stripe banner */}
        <View style={styles.stripeBanner}>
          <View style={styles.stripeIconBg}>
            <Ionicons name="lock-closed" size={28} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stripeBannerTitle}>Powered by Stripe</Text>
            <Text style={styles.stripeBannerSubtitle}>
              ParkSpot never stores your card details. All payments are secured by Stripe's
              industry-leading infrastructure.
            </Text>
          </View>
        </View>

        {/* Accepted methods */}
        <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
        <View style={styles.cardsGrid}>
          {ACCEPTED_CARDS.map((card) => (
            <View key={card.name} style={styles.cardChip}>
              <Text style={styles.cardChipIcon}>{card.icon}</Text>
              <Text style={styles.cardChipName}>{card.name}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        {HOW_IT_WORKS.map((item) => (
          <View key={item.step} style={styles.stepCard}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{item.step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* Card added during booking note */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Adding a Card</Text>
            <Text style={styles.infoDesc}>
              Card details are entered securely during the booking checkout. You do not need to
              save a card in advance — Stripe's payment sheet handles everything when you tap "Pay".
            </Text>
          </View>
        </View>

        {/* Security badges */}
        <View style={styles.securityRow}>
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>256-bit SSL</Text>
          </View>
          <View style={styles.securityBadge}>
            <Ionicons name="card-outline" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>PCI-DSS Level 1</Text>
          </View>
          <View style={styles.securityBadge}>
            <Ionicons name="eye-off-outline" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>No Data Stored</Text>
          </View>
        </View>

        {/* Stripe link */}
        <TouchableOpacity
          style={styles.stripeLink}
          onPress={() => Linking.openURL('https://stripe.com/docs/security')}
        >
          <Text style={styles.stripeLinkText}>Learn more about Stripe security</Text>
          <Ionicons name="open-outline" size={14} color={COLORS.primary} />
        </TouchableOpacity>
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
  stripeBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    backgroundColor: '#635BFF', borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.xl,
  },
  stripeIconBg: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  stripeBannerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.white, marginBottom: 4 },
  stripeBannerSubtitle: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  sectionTitle: {
    fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary,
    marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  cardsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl,
  },
  cardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardChipIcon: { fontSize: 16 },
  cardChipName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary },
  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  stepBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.white },
  stepTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, marginBottom: 4 },
  stepDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10', borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.xl,
  },
  infoTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, marginBottom: 4 },
  infoDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  securityRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  securityBadge: { alignItems: 'center', gap: 4 },
  securityText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.medium, color: COLORS.textSecondary },
  stripeLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm,
  },
  stripeLinkText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: FONTS.weights.medium },
});

export default PaymentMethodsScreen;
