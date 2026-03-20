import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context';
import { getOwnerBookings } from '../../services/firebase/bookings';
import { Booking, BookingStatus } from '../../constants';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
  [BookingStatus.CONFIRMED]: { bg: '#D1FAE5', text: '#065F46' },
  [BookingStatus.PENDING]:   { bg: '#FEF3C7', text: '#92400E' },
  [BookingStatus.CANCELLED]: { bg: '#FEE2E2', text: '#991B1B' },
  [BookingStatus.COMPLETED]: { bg: '#EDE9FE', text: '#4C1D95' },
};

const OwnerBookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getOwnerBookings(user.uid)
      .then(setBookings)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [user]);

  const formatDate = (date: Date) =>
    date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const renderBooking = ({ item }: { item: Booking }) => {
    const sc = statusColors[item.status] || statusColors[BookingStatus.PENDING];
    return (
      <View style={styles.card}>
        {/* Spot + Status */}
        <View style={styles.cardHeader}>
          <Text style={styles.spotTitle} numberOfLines={1}>{item.spotTitle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Renter info */}
        <View style={styles.renterRow}>
          <View style={styles.renterAvatar}>
            <Text style={styles.renterInitial}>
              {(item.userName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.renterName}>{item.userName || 'Unknown User'}</Text>
            {item.userEmail ? (
              <Text style={styles.renterEmail}>{item.userEmail}</Text>
            ) : null}
          </View>
        </View>

        {/* Time */}
        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detail}>{formatDate(item.startTime)} → {formatDate(item.endTime)}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="hourglass-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.detail}>{item.hours} hour{item.hours > 1 ? 's' : ''}</Text>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.bookingId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.amount}>${item.totalAmount.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  // Group bookings into upcoming and past
  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => b.startTime.getTime() > now && b.status !== BookingStatus.CANCELLED
  );
  const past = bookings.filter(
    (b) => b.startTime.getTime() <= now || b.status === BookingStatus.CANCELLED
  );

  const sections = [
    ...(upcoming.length > 0
      ? [{ key: 'header-upcoming', type: 'header' as const, label: 'Upcoming' }, ...upcoming.map((b) => ({ key: b.id, type: 'item' as const, item: b }))]
      : []),
    ...(past.length > 0
      ? [{ key: 'header-past', type: 'header' as const, label: 'Past & Cancelled' }, ...past.map((b) => ({ key: b.id, type: 'item' as const, item: b }))]
      : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spot Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>When users book your spots, their reservations will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.sectionHeader}>{item.label}</Text>;
            }
            return renderBooking({ item: item.item });
          }}
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
  sectionHeader: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
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
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  renterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renterInitial: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
  renterName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  renterEmail: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
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
});

export default OwnerBookingsScreen;
