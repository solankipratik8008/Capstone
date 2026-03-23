/**
 * Parking Pass Screen
 * Dynamic QR code that refreshes every 30 seconds — simulates a secure parking pass.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context';
import { getUserBookings } from '../../services/firebase/bookings';
import { Booking, BookingStatus, COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type RouteT = RouteProp<ProfileStackParamList, 'ParkingPass'>;
type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

const REFRESH_SECS = 30;

/** Token that rotates every 30 seconds — so the QR value changes periodically */
const currentToken = () => Math.floor(Date.now() / (REFRESH_SECS * 1000)).toString(36);

const buildQrValue = (booking: Booking, token: string) =>
  `PARKSPOT:${booking.id}:${booking.spotId}:${booking.startTime.toISOString()}:${booking.endTime.toISOString()}:${token}`;

const formatDT = (d: Date) =>
  d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusColors: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  [BookingStatus.CONFIRMED]: { bg: '#D1FAE5', text: '#065F46', label: 'Confirmed' },
  [BookingStatus.PENDING]:   { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  [BookingStatus.CANCELLED]: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  [BookingStatus.COMPLETED]: { bg: '#EDE9FE', text: '#4C1D95', label: 'Completed' },
};

export const ParkingPassScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteT>();
  const { bookingId } = route.params;
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(currentToken());
  const [countdown, setCountdown] = useState<number>(REFRESH_SECS - (Math.floor(Date.now() / 1000) % REFRESH_SECS));

  // Load booking
  useEffect(() => {
    if (!user) return;
    getUserBookings(user.uid)
      .then((bookings) => {
        const b = bookings.find((x) => x.id === bookingId);
        setBooking(b ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, bookingId]);

  // Countdown + token refresh
  useEffect(() => {
    const interval = setInterval(() => {
      const secondsInCycle = Math.floor(Date.now() / 1000) % REFRESH_SECS;
      const remaining = REFRESH_SECS - secondsInCycle;
      setCountdown(remaining);
      const newToken = currentToken();
      setToken(newToken);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = useCallback((b: Booking) => {
    const now = Date.now();
    return b.status === BookingStatus.CONFIRMED &&
      b.startTime.getTime() <= now + 15 * 60 * 1000 && // up to 15 min early
      b.endTime.getTime() > now;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Pass</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Pass</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="ticket-outline" size={56} color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>Booking not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sc = statusColors[booking.status];
  const active = isActive(booking);
  const qrValue = buildQrValue(booking, token);
  const progressPct = (countdown / REFRESH_SECS) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Pass</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status strip */}
        <View style={[styles.statusStrip, { backgroundColor: sc.bg }]}>
          <Ionicons
            name={active ? 'checkmark-circle' : 'information-circle-outline'}
            size={18}
            color={sc.text}
          />
          <Text style={[styles.statusStripText, { color: sc.text }]}>
            {active ? 'Active — ready to scan' : sc.label}
          </Text>
        </View>

        {/* Booking info */}
        <View style={styles.infoCard}>
          <Text style={styles.spotTitle} numberOfLines={2}>{booking.spotTitle}</Text>
          {!!booking.spotAddress && (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.addrText}>{booking.spotAddress}</Text>
            </View>
          )}
          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Check-in</Text>
              <Text style={styles.detailValue}>{formatDT(booking.startTime)}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Check-out</Text>
              <Text style={styles.detailValue}>{formatDT(booking.endTime)}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.hours}h</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Paid</Text>
              <Text style={[styles.detailValue, { color: COLORS.primary }]}>${booking.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrCard}>
          <View style={[styles.qrWrapper, !active && styles.qrDimmed]}>
            <QRCode
              value={qrValue}
              size={200}
              color={active ? COLORS.textPrimary : COLORS.gray[400]}
              backgroundColor={COLORS.white}
            />
            {!active && (
              <View style={styles.qrOverlay}>
                <Ionicons name="lock-closed" size={32} color={COLORS.gray[500]} />
                <Text style={styles.qrOverlayText}>Not yet active</Text>
              </View>
            )}
          </View>

          {/* Refresh countdown */}
          <View style={styles.refreshRow}>
            <Ionicons name="refresh-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.refreshText}>Refreshes in {countdown}s</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>

          <Text style={styles.bookingIdText}>#{booking.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.scanHint}>
            Present at entry and exit gate for automatic access
          </Text>
        </View>

        {/* Gate Scanner button */}
        {active && (
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={() => navigation.navigate('GateScanner', { qrValue })}
          >
            <Ionicons name="scan-outline" size={18} color={COLORS.white} />
            <Text style={styles.gateBtnText}>Simulate Gate Scan</Text>
          </TouchableOpacity>
        )}

        {/* Offline note */}
        <View style={styles.offlineNote}>
          <Ionicons name="wifi-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.offlineNoteText}>
            The QR code is cached locally. It remains accessible for a short period even with a weak signal.
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textMuted, marginTop: SPACING.md },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },

  statusStrip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
  },
  statusStripText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },

  infoCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  spotTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  addrText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, flex: 1 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  detailBox: { flex: 1, minWidth: '45%', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm },
  detailLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: 2 },
  detailValue: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },

  qrCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  qrWrapper: { marginBottom: SPACING.md },
  qrDimmed: { opacity: 0.4 },
  qrOverlay: {
    position: 'absolute', inset: 0 as any,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  qrOverlayText: { fontSize: FONTS.sizes.sm, color: COLORS.gray[500], marginTop: 4 },

  refreshRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: SPACING.xs },
  refreshText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  progressBar: {
    width: '60%', height: 4, backgroundColor: COLORS.gray[200],
    borderRadius: 2, overflow: 'hidden', marginBottom: SPACING.md,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },

  bookingIdText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: 4 },
  scanHint: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center' },

  gateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md, marginBottom: SPACING.md,
  },
  gateBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.white },

  offlineNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.gray[100], borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
  },
  offlineNoteText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textMuted, lineHeight: 18 },
});

export default ParkingPassScreen;
