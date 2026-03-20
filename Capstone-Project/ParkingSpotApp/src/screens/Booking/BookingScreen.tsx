import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../../context';

const CLOUD_RUN_URL = 'https://parkspot-api-ccxrzypu3a-uc.a.run.app';
import { createBooking, updateBookingStatus, getSpotBookings } from '../../services/firebase/bookings';
import { BookingStatus } from '../../constants';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { BookingStackParamList } from '../../constants';

type BookingRouteProp = RouteProp<BookingStackParamList, 'Booking'>;

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

const BookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingRouteProp>();
  const { spotId, spotTitle, pricePerHour, ownerId } = route.params;
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [selectedHours, setSelectedHours] = useState(2);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    start: Date; end: Date; hours: number; total: number; bookingId: string;
  } | null>(null);

  const totalAmount = selectedHours * pricePerHour;
  const endDate = new Date(startDate.getTime() + selectedHours * 60 * 60 * 1000);

  const formatDateTime = (date: Date): string =>
    date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const adjustStartHour = (delta: number) => {
    const newDate = new Date(startDate.getTime() + delta * 60 * 60 * 1000);
    if (newDate > new Date()) {
      setStartDate(newDate);
    }
  };

  const handleBookNow = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to book a parking spot.');
      return;
    }
    if (user.uid === ownerId) {
      Alert.alert('Cannot Book', 'You cannot book your own parking spot.');
      return;
    }

    setIsProcessing(true);
    let bookingId = '';

    try {
      // 0. Check for time conflicts with existing bookings
      const existingBookings = await getSpotBookings(spotId);
      const conflict = existingBookings.find((b) => {
        const existStart = b.startTime.getTime();
        const existEnd = b.endTime.getTime();
        const newStart = startDate.getTime();
        const newEnd = endDate.getTime();
        return existStart < newEnd && existEnd > newStart;
      });
      if (conflict) {
        Alert.alert(
          'Time Slot Unavailable',
          `This spot is already booked from ${formatDateTime(conflict.startTime)} to ${formatDateTime(conflict.endTime)}.\n\nPlease choose a different time.`
        );
        setIsProcessing(false);
        return;
      }

      // 1. Create a pending booking record in Firestore
      bookingId = await createBooking({
        spotId,
        spotTitle,
        spotAddress: '',
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        ownerId,
        startTime: startDate,
        endTime: endDate,
        hours: selectedHours,
        totalAmount,
        status: BookingStatus.PENDING,
        paymentStatus: 'pending',
      });

      // 2. Create PaymentIntent via Cloud Run, then present Stripe PaymentSheet
      const idToken = await getAuth().currentUser?.getIdToken();
      const resp = await fetch(`${CLOUD_RUN_URL}/createPaymentIntent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100),
          currency: 'cad',
          bookingId,
        }),
      });
      const json = await resp.json();
      if (json.error) throw new Error(json.error.message);
      const { clientSecret } = json.result;

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'ParkSpot',
        style: 'automatic',
        returnURL: 'parkspot://stripe-redirect',
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code === 'Canceled') {
          await updateBookingStatus(bookingId, BookingStatus.CANCELLED, 'failed');
          setIsProcessing(false);
          return;
        }
        throw new Error(presentError.message);
      }

      await updateBookingStatus(
        bookingId,
        BookingStatus.CONFIRMED,
        'succeeded',
        clientSecret.split('_secret_')[0]
      );

      setConfirmedBooking({
        start: startDate,
        end: endDate,
        hours: selectedHours,
        total: totalAmount,
        bookingId,
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      if (bookingId) {
        await updateBookingStatus(bookingId, BookingStatus.CANCELLED, 'failed').catch(() => {});
      }
      Alert.alert(
        'Booking Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Success confirmation screen ---
  if (confirmedBooking) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={styles.confirmTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmSubtitle}>{spotTitle}</Text>

          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Check-in</Text>
              <Text style={styles.confirmValue}>{formatDateTime(confirmedBooking.start)}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Check-out</Text>
              <Text style={styles.confirmValue}>{formatDateTime(confirmedBooking.end)}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Duration</Text>
              <Text style={styles.confirmValue}>{confirmedBooking.hours} hour{confirmedBooking.hours > 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.confirmRow, { borderTopWidth: 1, borderTopColor: COLORS.gray[200], paddingTop: SPACING.sm, marginTop: SPACING.xs }]}>
              <Text style={[styles.confirmLabel, { fontWeight: FONTS.weights.bold, color: COLORS.textPrimary }]}>Total Paid</Text>
              <Text style={[styles.confirmValue, { color: COLORS.primary, fontWeight: FONTS.weights.bold }]}>${confirmedBooking.total.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.confirmNote}>
            Booking ID: {confirmedBooking.bookingId.slice(0, 8).toUpperCase()}
          </Text>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => {
              navigation.goBack();
              navigation.goBack();
            }}
          >
            <Text style={styles.confirmButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Spot Info */}
        <View style={styles.card}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{spotTitle}</Text>
            <Text style={styles.cardSubtitle}>${pricePerHour.toFixed(2)}/hour</Text>
          </View>
        </View>

        {/* Start Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Time</Text>
          <View style={styles.timeSelector}>
            <TouchableOpacity style={styles.timeArrow} onPress={() => adjustStartHour(-1)}>
              <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>{formatDateTime(startDate)}</Text>
            </View>
            <TouchableOpacity style={styles.timeArrow} onPress={() => adjustStartHour(1)}>
              <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((hours) => (
              <TouchableOpacity
                key={hours}
                style={[styles.durationOption, selectedHours === hours && styles.durationOptionSelected]}
                onPress={() => setSelectedHours(hours)}
              >
                <Text style={[styles.durationText, selectedHours === hours && styles.durationTextSelected]}>
                  {hours}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Start</Text>
            <Text style={styles.summaryValue}>{formatDateTime(startDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>End</Text>
            <Text style={styles.summaryValue}>{formatDateTime(endDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{selectedHours} hour{selectedHours > 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.stripeNote}>
          <Ionicons name="lock-closed-outline" size={12} /> Payments powered by Stripe. Your card info is never stored on our servers.
        </Text>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, isProcessing && styles.bookButtonDisabled]}
          onPress={handleBookNow}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.bookButtonText}>Pay ${totalAmount.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg },
  // Confirmation styles
  confirmContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  confirmIcon: { marginBottom: SPACING.lg },
  confirmTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  confirmSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  confirmCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  confirmLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  confirmValue: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: FONTS.weights.medium },
  confirmNote: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: SPACING.xl },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  cardSubtitle: { fontSize: FONTS.sizes.md, color: COLORS.primary, marginTop: 2 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  timeArrow: { padding: SPACING.md },
  timeDisplay: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  timeText: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: FONTS.weights.medium },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  durationOption: {
    width: 60,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  durationOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  durationText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.medium, color: COLORS.textPrimary },
  durationTextSelected: { color: COLORS.white },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  summaryTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: FONTS.weights.medium },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.gray[200], paddingTop: SPACING.sm, marginTop: SPACING.xs, marginBottom: 0 },
  totalLabel: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  totalValue: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.primary },
  stripeNote: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.md },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
});

export default BookingScreen;
