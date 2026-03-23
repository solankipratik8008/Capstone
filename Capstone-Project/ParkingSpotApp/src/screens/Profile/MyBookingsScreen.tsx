import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context';
import { getUserBookings, cancelBooking } from '../../services/firebase/bookings';
import { Booking, BookingStatus } from '../../constants';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
  [BookingStatus.CONFIRMED]: { bg: '#D1FAE5', text: '#065F46' },
  [BookingStatus.PENDING]:   { bg: '#FEF3C7', text: '#92400E' },
  [BookingStatus.CANCELLED]: { bg: '#FEE2E2', text: '#991B1B' },
  [BookingStatus.COMPLETED]: { bg: '#EDE9FE', text: '#4C1D95' },
};

const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = () => {
    if (!user) return;
    getUserBookings(user.uid)
      .then(setBookings)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const formatDate = (date: Date) =>
    date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const canCancel = (booking: Booking): boolean => {
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) return false;
    const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilStart >= 5;
  };

  const handleCancel = (booking: Booking) => {
    const minutesSinceBooking = (Date.now() - booking.createdAt.getTime()) / (1000 * 60);
    const isRefundEligible = booking.paymentStatus === 'succeeded' && minutesSinceBooking <= 30;

    const refundNote = isRefundEligible
      ? '\n\nSince you booked within the last 30 minutes, you will receive a full refund (3–5 business days).'
      : '\n\nNo refund will be issued as the 30-minute refund window has passed.';

    Alert.alert(
      'Cancel Booking',
      `Cancel your booking at "${booking.spotTitle}"?${refundNote}`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              const result = await cancelBooking(booking.id);
              Alert.alert('Booking Cancelled', result.message);
              loadBookings();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking. Please try again.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const sc = statusColors[item.status] || statusColors[BookingStatus.PENDING];
    const cancellable = canCancel(item);
    const isCancelling = cancellingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.spotTitle} numberOfLines={1}>{item.spotTitle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detail}>{formatDate(item.startTime)} → {formatDate(item.endTime)}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="hourglass-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detail}>{item.hours} hour{item.hours > 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.bookingId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.amount}>${item.totalAmount.toFixed(2)}</Text>
        </View>

        {cancellable && (
          <TouchableOpacity
            style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
            onPress={() => handleCancel(item)}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {item.status === BookingStatus.CONFIRMED && !cancellable && (
          <Text style={styles.noCancelNote}>
            Cancellation unavailable (less than 5 hours until check-in)
          </Text>
        )}

        {/* Parking Pass button for confirmed bookings */}
        {item.status === BookingStatus.CONFIRMED && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => navigation.navigate('ParkingPass', { bookingId: item.id })}
          >
            <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
            <Text style={styles.qrButtonText}>View Parking Pass</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>Your confirmed parking bookings will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center' },
  list: { padding: SPACING.lg, gap: SPACING.md },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  spotTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 },
  detail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  bookingId: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  amount: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.primary },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelButtonDisabled: { opacity: 0.5 },
  cancelButtonText: { fontSize: FONTS.sizes.sm, color: COLORS.error, fontWeight: FONTS.weights.semibold },
  noCancelNote: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  qrButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    marginTop: SPACING.sm, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary + '12',
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  qrButtonText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: FONTS.weights.semibold },
});

export default MyBookingsScreen;
