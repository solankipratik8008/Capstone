import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { getAuth } from 'firebase/auth';
import { createBooking, updateBookingStatus, getSpotBookings } from '../../services/firebase/bookings';
import { BookingStatus } from '../../constants';
import { BookingStackParamList } from '../../constants';
import { useAuth } from '../../context';
import { useAppTheme } from '../../theme';
import { LogoSplash } from '../../components/common';

const CLOUD_RUN_URL = 'https://parkspot-api-ccxrzypu3a-uc.a.run.app';

type BookingRouteProp = RouteProp<BookingStackParamList, 'Booking'>;

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

const BookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingRouteProp>();
  const { spotId, spotTitle, pricePerHour, ownerId, isPaidLot, placeAddress } = route.params;
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, spacing, radii, typography, shadows } = theme;

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

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: Date): string =>
    date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const formatFull = (date: Date): string =>
    `${formatDate(date)}, ${formatTime(date)}`;

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
          `This spot is already booked from ${formatFull(conflict.startTime)} to ${formatFull(conflict.endTime)}.\n\nPlease choose a different time.`
        );
        setIsProcessing(false);
        return;
      }

      bookingId = await createBooking({
        spotId,
        spotTitle,
        spotAddress: placeAddress ?? '',
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

  // ── Success / Confirmation screen ─────────────────────────────────────────
  if (confirmedBooking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.confirmScroll}>
          <View style={styles.confirmIconWrap}>
            <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
          </View>
          <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Booking Confirmed!</Text>
          <Text style={[styles.confirmSub, { color: colors.textSecondary }]}>{spotTitle}</Text>

          <View style={[styles.confirmCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Row label="Check-in" value={formatFull(confirmedBooking.start)} colors={colors} />
            <Row label="Check-out" value={formatFull(confirmedBooking.end)} colors={colors} />
            <Row label="Duration" value={`${confirmedBooking.hours} hour${confirmedBooking.hours > 1 ? 's' : ''}`} colors={colors} />
            <View style={[styles.divider, { borderTopColor: colors.border }]} />
            <View style={styles.totalRowConfirm}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Paid</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>${confirmedBooking.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={[styles.qrWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.qrLabel, { color: colors.textPrimary }]}>Your Entry QR Code</Text>
            <View style={[styles.qrBox, { backgroundColor: colors.white }]}>
              <QRCode
                value={`PARKSPOT:${confirmedBooking.bookingId}:${spotId}:${confirmedBooking.start.toISOString()}:${confirmedBooking.end.toISOString()}`}
                size={160}
                color="#111111"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={[styles.qrHint, { color: colors.textMuted }]}>Show this at entry / exit gates</Text>
          </View>

          <Text style={[styles.bookingId, { color: colors.textMuted }]}>
            Booking ID: {confirmedBooking.bookingId.slice(0, 8).toUpperCase()}
          </Text>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => { navigation.goBack(); navigation.goBack(); }}
            activeOpacity={0.9}
          >
            <Text style={[styles.doneBtnText, { color: colors.textOnPrimary }]}>Back to Map</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main booking form ─────────────────────────────────────────────────────
  // Full-screen logo splash while payment is processing
  if (isProcessing) {
    return <LogoSplash message="Processing payment…" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Spot Info Card ── */}
        <View style={[styles.spotCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={[styles.spotIcon, { backgroundColor: isPaidLot ? 'rgba(107,114,128,0.15)' : colors.primaryFaint }]}>
            <Ionicons
              name={isPaidLot ? 'business-outline' : 'location-outline'}
              size={22}
              color={isPaidLot ? colors.textSecondary : colors.primary}
            />
          </View>
          <View style={styles.spotInfo}>
            <View style={styles.spotTitleRow}>
              <Text style={[styles.spotName, { color: colors.textPrimary }]} numberOfLines={1}>{spotTitle}</Text>
              {isPaidLot && (
                <View style={[styles.paidBadge, { backgroundColor: colors.textSecondary }]}>
                  <Text style={[styles.paidBadgeText, { color: colors.white }]}>PAID LOT</Text>
                </View>
              )}
            </View>
            {!!placeAddress && (
              <Text style={[styles.spotAddress, { color: colors.textMuted }]} numberOfLines={1}>{placeAddress}</Text>
            )}
            <Text style={[styles.spotPrice, { color: colors.primary }]}>
              ${pricePerHour.toFixed(2)}/hour
            </Text>
          </View>
        </View>

        {/* ── Start Time ── */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Start Time</Text>
        <View style={[styles.timeSelector, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.timeArrow, { backgroundColor: colors.primaryFaint }]}
            onPress={() => adjustStartHour(-1)}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.timeCenter}>
            <Text style={[styles.timeDate, { color: colors.textSecondary }]}>{formatDate(startDate)}</Text>
            <Text style={[styles.timeHour, { color: colors.textPrimary }]}>{formatTime(startDate)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.timeArrow, { backgroundColor: colors.primaryFaint }]}
            onPress={() => adjustStartHour(1)}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Duration ── */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Duration</Text>
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((hours) => {
            const selected = selectedHours === hours;
            return (
              <TouchableOpacity
                key={hours}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedHours(hours)}
                activeOpacity={0.8}
              >
                <Text style={[styles.durationText, { color: selected ? colors.textOnPrimary : colors.textPrimary }]}>
                  {hours}h
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Summary ── */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, ...shadows.sm }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Booking Summary</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <Ionicons name="time-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Start</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatFull(startDate)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <Ionicons name="flag-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>End</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatFull(endDate)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <Ionicons name="hourglass-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {selectedHours} hour{selectedHours > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={[styles.totalDivider, { borderTopColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <Ionicons name="cash-outline" size={15} color={colors.primary} />
              <Text style={[styles.summaryLabel, { color: colors.textPrimary, fontWeight: '700' }]}>Total</Text>
            </View>
            <Text style={[styles.summaryTotal, { color: colors.primary }]}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.stripeRow}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.stripeNote, { color: colors.textMuted }]}>
            Payments powered by Stripe. Your card info is never stored on our servers.
          </Text>
        </View>
      </ScrollView>

      {/* ── Pay Button ── */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: isProcessing ? colors.primaryDark : colors.primary }]}
          onPress={handleBookNow}
          disabled={isProcessing}
          activeOpacity={0.9}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color={colors.textOnPrimary} style={{ marginRight: 8 }} />
              <Text style={[styles.payBtnText, { color: colors.textOnPrimary }]}>Pay ${totalAmount.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ── Small helper component ────────────────────────────────────────────────────
const Row: React.FC<{ label: string; value: string; colors: any }> = ({ label, value, colors }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
    <Text style={{ fontSize: 14, color: colors.textSecondary }}>{label}</Text>
    <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Text>
  </View>
);

const createStyles = ({ colors, spacing, radii, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: spacing.lg, paddingBottom: spacing.xl },

    // Confirmation
    confirmScroll: { flexGrow: 1, alignItems: 'center', padding: spacing.xl, paddingBottom: spacing.xxxl },
    confirmIconWrap: { marginBottom: spacing.md },
    confirmTitle: { fontSize: typography.sizes.xxl, fontWeight: '800', marginBottom: spacing.xs },
    confirmSub: { fontSize: typography.sizes.md, marginBottom: spacing.xl, textAlign: 'center' },
    confirmCard: {
      width: '100%', borderRadius: radii.xl, padding: spacing.lg,
      borderWidth: 1, marginBottom: spacing.lg, ...shadows.sm,
    },
    divider: { borderTopWidth: 1, marginVertical: spacing.sm },
    totalRowConfirm: { flexDirection: 'row', justifyContent: 'space-between' },
    totalLabel: { fontSize: typography.sizes.lg, fontWeight: '700' },
    totalValue: { fontSize: typography.sizes.lg, fontWeight: '800' },
    qrWrap: {
      width: '100%', borderRadius: radii.xl, padding: spacing.lg,
      borderWidth: 1, alignItems: 'center', marginBottom: spacing.md, ...shadows.sm,
    },
    qrLabel: { fontSize: typography.sizes.md, fontWeight: '600', marginBottom: spacing.md },
    qrBox: { padding: spacing.lg, borderRadius: radii.lg, ...shadows.md },
    qrHint: { fontSize: typography.sizes.sm, marginTop: spacing.sm },
    bookingId: { fontSize: typography.sizes.sm, marginBottom: spacing.xl },
    doneBtn: {
      width: '100%', height: 54, borderRadius: radii.lg,
      alignItems: 'center', justifyContent: 'center', ...shadows.glow,
    },
    doneBtnText: { fontSize: typography.sizes.lg, fontWeight: '700' },

    // Spot info
    spotCard: {
      flexDirection: 'row', alignItems: 'center', borderRadius: radii.xl,
      borderWidth: 1, padding: spacing.lg, marginBottom: spacing.xl,
      gap: spacing.md, ...shadows.sm,
    },
    spotIcon: {
      width: 48, height: 48, borderRadius: radii.lg,
      alignItems: 'center', justifyContent: 'center',
    },
    spotInfo: { flex: 1 },
    spotTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    spotName: { fontSize: typography.sizes.lg, fontWeight: '700', flex: 1 },
    paidBadge: { borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 },
    paidBadgeText: { fontSize: 10, fontWeight: '700' },
    spotAddress: { fontSize: typography.sizes.sm, marginTop: 2 },
    spotPrice: { fontSize: typography.sizes.md, fontWeight: '700', marginTop: 4 },

    // Section label
    sectionLabel: {
      fontSize: typography.sizes.md, fontWeight: '700',
      marginBottom: spacing.sm, marginTop: spacing.xs,
    },

    // Time selector
    timeSelector: {
      flexDirection: 'row', alignItems: 'center', borderRadius: radii.xl,
      borderWidth: 1, marginBottom: spacing.xl, overflow: 'hidden', ...shadows.sm,
    },
    timeArrow: {
      width: 52, height: 64, alignItems: 'center', justifyContent: 'center',
    },
    timeCenter: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
    timeDate: { fontSize: typography.sizes.sm, marginBottom: 2 },
    timeHour: { fontSize: typography.sizes.xl, fontWeight: '700' },

    // Duration
    durationGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl,
    },
    durationChip: {
      width: 60, height: 44, borderRadius: radii.lg,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, ...shadows.xs,
    },
    durationText: { fontSize: typography.sizes.md, fontWeight: '600' },

    // Summary
    summaryCard: {
      borderRadius: radii.xl, borderWidth: 1,
      padding: spacing.lg, marginBottom: spacing.md,
    },
    summaryTitle: {
      fontSize: typography.sizes.md, fontWeight: '700', marginBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: spacing.sm,
    },
    summaryIconLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    summaryLabel: { fontSize: typography.sizes.sm },
    summaryValue: { fontSize: typography.sizes.sm, fontWeight: '600', flex: 1, textAlign: 'right' },
    totalDivider: { borderTopWidth: 1, marginVertical: spacing.sm },
    summaryTotal: { fontSize: typography.sizes.xl, fontWeight: '800' },

    // Stripe note
    stripeRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      justifyContent: 'center', marginBottom: spacing.md,
    },
    stripeNote: { fontSize: typography.sizes.xs, flex: 1 },

    // Footer
    footer: {
      padding: spacing.lg, borderTopWidth: 1,
    },
    payBtn: {
      height: 56, borderRadius: radii.xl,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      ...shadows.glow,
    },
    payBtnText: { fontSize: typography.sizes.lg, fontWeight: '800' },
  });

export default BookingScreen;
