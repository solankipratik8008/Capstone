/**
 * Gate Scanner Screen
 * Simulates a real parking gate: validates QR, shows Access Granted / Denied,
 * and tracks entry vs exit for the same booking.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context';
import { getUserBookings } from '../../services/firebase/bookings';
import { Booking, BookingStatus, COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type RouteT = RouteProp<ProfileStackParamList, 'GateScanner'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SCAN_DELAY_MS = 2200;

type ScanState = 'scanning' | 'granted' | 'denied';

const DENIED_REASONS: Record<string, string> = {
  expired:    'Booking has expired.',
  tooEarly:   'Entry window not open yet (> 15 min early).',
  notConfirmed: 'Booking is not confirmed.',
  notFound:   'Booking not found.',
  badToken:   'QR code is invalid or expired.',
};

/** Validate the raw QR string; returns { ok, reason, booking, isEntry } */
const validateQR = (
  qrValue: string,
  bookings: Booking[],
): { ok: boolean; reason?: string; booking?: Booking; isEntry?: boolean } => {
  // Format: PARKSPOT:{id}:{spotId}:{startISO}:{endISO}:{token}
  const parts = qrValue.split(':');
  if (parts.length < 6 || parts[0] !== 'PARKSPOT') {
    return { ok: false, reason: 'badToken' };
  }
  const bookingId = parts[1];
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return { ok: false, reason: 'notFound' };
  if (booking.status !== BookingStatus.CONFIRMED) return { ok: false, reason: 'notConfirmed' };

  const now = Date.now();
  const start = booking.startTime.getTime();
  const end   = booking.endTime.getTime();

  if (now > end) return { ok: false, reason: 'expired', booking };
  if (now < start - 15 * 60 * 1000) return { ok: false, reason: 'tooEarly', booking };

  // Entry = first use, Exit = second use (determined by whether now >= start)
  const isEntry = now < end && now >= start - 15 * 60 * 1000;
  return { ok: true, booking, isEntry };
};

export const GateScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteT>();
  const { qrValue } = route.params;
  const { user } = useAuth();

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [resultInfo, setResultInfo] = useState<{
    booking?: Booking;
    reason?: string;
    isEntry?: boolean;
  }>({});

  // Scan line animation
  const scanY = useRef(new Animated.Value(0)).current;
  // Result scale/fade animations
  const resultScale = useRef(new Animated.Value(0.6)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  // Pulse ring for granted
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const BOX_SIZE = SCREEN_W * 0.7;

  // Scan line loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: BOX_SIZE,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Load bookings & validate after delay
  useEffect(() => {
    if (!user) return;
    getUserBookings(user.uid).then((bookings) => {
      setTimeout(() => {
        const result = validateQR(qrValue, bookings);
        setResultInfo({ booking: result.booking, reason: result.reason, isEntry: result.isEntry });
        setScanState(result.ok ? 'granted' : 'denied');

        // Animate result in
        Animated.parallel([
          Animated.spring(resultScale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();

        // Pulse animation for granted
        if (result.ok) {
          Animated.loop(
            Animated.sequence([
              Animated.parallel([
                Animated.timing(pulseScale, { toValue: 1.5, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
              ]),
              Animated.parallel([
                Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
                Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
              ]),
            ])
          ).start();
        }
      }, SCAN_DELAY_MS);
    }).catch(() => {
      setTimeout(() => {
        setResultInfo({ reason: 'notFound' });
        setScanState('denied');
        Animated.parallel([
          Animated.spring(resultScale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }, SCAN_DELAY_MS);
    });
  }, [user, qrValue]);

  const isGranted = scanState === 'granted';
  const isScanning = scanState === 'scanning';

  const resultColor = isGranted ? '#22C55E' : '#EF4444';
  const resultBg    = isGranted ? '#F0FDF4' : '#FEF2F2';

  const corners = [
    { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  ];

  return (
    <View style={styles.root}>
      {/* Dark background always */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A12' }]} />

      {/* Result overlay — visible after scan */}
      {!isScanning && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: resultBg, opacity: resultOpacity },
          ]}
        />
      )}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gate Scanner</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          {isScanning ? (
            /* ── SCANNING STATE ── */
            <>
              <Text style={styles.scanningLabel}>Scanning QR Code…</Text>

              {/* QR frame */}
              <View style={[styles.qrFrame, { width: BOX_SIZE, height: BOX_SIZE }]}>
                {corners.map((c, i) => (
                  <View key={i} style={[styles.corner, c as any]} />
                ))}
                {/* Scan line */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    { width: BOX_SIZE - 4, transform: [{ translateY: scanY }] },
                  ]}
                />
              </View>

              <Text style={styles.scanHint}>Hold steady — verifying with server</Text>
            </>
          ) : (
            /* ── RESULT STATE ── */
            <Animated.View
              style={[
                styles.resultContainer,
                { transform: [{ scale: resultScale }], opacity: resultOpacity },
              ]}
            >
              {/* Pulse ring (granted only) */}
              {isGranted && (
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      borderColor: resultColor,
                      transform: [{ scale: pulseScale }],
                      opacity: pulseOpacity,
                    },
                  ]}
                />
              )}

              {/* Icon circle */}
              <View style={[styles.iconCircle, { backgroundColor: resultColor }]}>
                <Ionicons
                  name={isGranted ? 'checkmark' : 'close'}
                  size={56}
                  color="#fff"
                />
              </View>

              <Text style={[styles.resultTitle, { color: resultColor }]}>
                {isGranted ? 'Access Granted' : 'Access Denied'}
              </Text>

              {isGranted && resultInfo.booking && (
                <>
                  <Text style={styles.resultSpot} numberOfLines={2}>
                    {resultInfo.booking.spotTitle}
                  </Text>
                  <View style={[styles.actionBadge, { backgroundColor: resultColor + '20', borderColor: resultColor + '40' }]}>
                    <Ionicons
                      name={resultInfo.isEntry ? 'enter-outline' : 'exit-outline'}
                      size={16}
                      color={resultColor}
                    />
                    <Text style={[styles.actionBadgeText, { color: resultColor }]}>
                      {resultInfo.isEntry ? 'Entry Permitted' : 'Exit Permitted'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>
                      {resultInfo.booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {resultInfo.booking.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>
                      Booking #{resultInfo.booking.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                </>
              )}

              {!isGranted && (
                <Text style={styles.deniedReason}>
                  {DENIED_REASONS[resultInfo.reason ?? 'badToken'] ?? 'QR code could not be verified.'}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: resultColor }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.doneBtnText}>
                  {isGranted ? 'Gate Open — Done' : 'Go Back'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: '#fff' },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },

  /* Scanning */
  scanningLabel: {
    fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.semibold, color: '#fff',
    marginBottom: SPACING.xl, textAlign: 'center',
  },
  qrFrame: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: COLORS.primary,
  },
  scanLine: {
    position: 'absolute', height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.85,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
  scanHint: {
    fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.55)',
    marginTop: SPACING.xl, textAlign: 'center',
  },

  /* Result */
  resultContainer: {
    alignItems: 'center', paddingHorizontal: SPACING.xl, width: '100%',
  },
  pulseRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 3,
  },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resultTitle: {
    fontSize: 32, fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm, textAlign: 'center',
  },
  resultSpot: {
    fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.md,
  },
  actionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    marginBottom: SPACING.md,
  },
  actionBadgeText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  detailText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  deniedReason: {
    fontSize: FONTS.sizes.md, color: COLORS.textSecondary,
    textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  doneBtn: {
    marginTop: SPACING.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
  },
  doneBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: '#fff' },
});

export default GateScannerScreen;
