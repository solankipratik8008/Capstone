/**
 * SpotPreviewCard
 * Bottom slide-up card when a user taps any parking marker on the map.
 * Supports both user-listed ParkingSpot and Google Places NearbyPlace.
 */

import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert, Linking, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingSpot, COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../../constants';
import { NearbyPlace } from '../../services/places';

export type PreviewItem =
  | { kind: 'spot'; data: ParkingSpot; distance?: number | null }
  | { kind: 'place'; data: NearbyPlace; distance?: number | null };

interface Props {
  item: PreviewItem;
  onViewDetails?: () => void;
  onClose: () => void;
}

/** Estimate travel time in minutes given distance in km */
const travelTimes = (km: number | null | undefined) => {
  if (!km) return null;
  return {
    walk:  Math.round((km / 5) * 60),
    drive: Math.max(1, Math.round((km / 30) * 60)),
    bike:  Math.round((km / 15) * 60),
  };
};

const formatDist = (km: number | null | undefined): string => {
  if (!km) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

const openDirections = (lat: number, lng: number, label: string) => {
  const encodedLabel = encodeURIComponent(label);

  const options: { name: string; url: string }[] = Platform.OS === 'ios'
    ? [
        { name: 'Apple Maps',  url: `maps:0,0?daddr=${lat},${lng}` },
        { name: 'Google Maps', url: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving` },
        { name: 'Waze',        url: `waze://?ll=${lat},${lng}&navigate=yes` },
      ]
    : [
        { name: 'Google Maps', url: `google.navigation:q=${lat},${lng}` },
        { name: 'Waze',        url: `waze://?ll=${lat},${lng}&navigate=yes` },
      ];

  // Web fallback always works
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const buttons = options.map((o) => ({
    text: o.name,
    onPress: async () => {
      const canOpen = await Linking.canOpenURL(o.url).catch(() => false);
      if (canOpen) {
        Linking.openURL(o.url);
      } else {
        Linking.openURL(webUrl);
      }
    },
  }));

  buttons.push({ text: 'Cancel', onPress: () => {} });

  Alert.alert('Open Directions', `Navigate to ${label}`, buttons as any);
};

export const SpotPreviewCard: React.FC<Props> = ({ item, onViewDetails, onClose }) => {
  const isSpot = item.kind === 'spot';
  const spot = isSpot ? (item.data as ParkingSpot) : null;
  const place = !isSpot ? (item.data as NearbyPlace) : null;

  const lat  = isSpot ? spot!.location.latitude  : place!.latitude;
  const lng  = isSpot ? spot!.location.longitude : place!.longitude;
  const name = isSpot ? spot!.title : place!.name;
  const addr = isSpot ? (spot!.location.address || spot!.location.city || '') : place!.vicinity;
  const km   = item.distance;
  const times = travelTimes(km);

  const imageUri = isSpot && spot!.imageURLs.length > 0
    ? spot!.imageURLs[0]
    : null;

  return (
    <View style={styles.card}>
      {/* Handle bar */}
      <View style={styles.handleBar} />

      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Image row */}
      <View style={styles.imageRow}>
        <View style={styles.imageBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: isSpot ? COLORS.primary + '18' : COLORS.places + '18' }]}>
              <Ionicons
                name={isSpot ? 'car' : 'business'}
                size={32}
                color={isSpot ? COLORS.primary : COLORS.places}
              />
            </View>
          )}
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: isSpot ? COLORS.primary : COLORS.places }]}>
            <Text style={styles.typeBadgeText}>{isSpot ? 'ParkSpot' : 'Paid Lot'}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={styles.spotName} numberOfLines={2}>{name}</Text>
          {!!addr && (
            <View style={styles.addrRow}>
              <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.addrText} numberOfLines={1}>{addr}</Text>
            </View>
          )}

          {/* Price / Status */}
          <View style={styles.priceRow}>
            {isSpot ? (
              <>
                <Text style={styles.price}>${spot!.pricePerHour}<Text style={styles.priceUnit}>/hr</Text></Text>
                <View style={[styles.availBadge, { backgroundColor: spot!.isAvailable ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.availText, { color: spot!.isAvailable ? '#065F46' : '#991B1B' }]}>
                    {spot!.isAvailable ? 'Available' : 'Taken'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                {place!.rating != null && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color={COLORS.accent} />
                    <Text style={styles.rating}>{place!.rating.toFixed(1)}</Text>
                  </View>
                )}
                {place!.openNow != null && (
                  <View style={[styles.availBadge, { backgroundColor: place!.openNow ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={[styles.availText, { color: place!.openNow ? '#065F46' : '#991B1B' }]}>
                      {place!.openNow ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                )}
              </>
            )}
            {!!km && <Text style={styles.dist}>{formatDist(km)}</Text>}
          </View>
        </View>
      </View>

      {/* Travel times */}
      {times && (
        <View style={styles.travelRow}>
          <View style={styles.travelItem}>
            <Ionicons name="walk-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.travelText}>{times.walk} min</Text>
          </View>
          <View style={styles.travelDivider} />
          <View style={styles.travelItem}>
            <Ionicons name="car-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.travelText}>{times.drive} min</Text>
          </View>
          <View style={styles.travelDivider} />
          <View style={styles.travelItem}>
            <Ionicons name="bicycle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.travelText}>{times.bike} min</Text>
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.dirBtn}
          onPress={() => openDirections(lat, lng, name)}
        >
          <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
          <Text style={styles.dirBtnText}>Directions</Text>
        </TouchableOpacity>

        {onViewDetails && (
          <TouchableOpacity style={styles.detailsBtn} onPress={onViewDetails}>
            <Text style={styles.detailsBtnText}>
              {isSpot ? 'View & Book' : 'View Details'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm, paddingBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  handleBar: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    alignSelf: 'center', marginBottom: SPACING.sm,
  },
  closeBtn: {
    position: 'absolute', top: SPACING.md, right: SPACING.md,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.gray[100], alignItems: 'center', justifyContent: 'center',
  },
  imageRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  imageBox: { position: 'relative', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  image: { width: 100, height: 90, borderRadius: BORDER_RADIUS.lg },
  imagePlaceholder: {
    width: 100, height: 90, borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute', bottom: 6, left: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  infoCol: { flex: 1, justifyContent: 'center' },
  spotName: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: 4 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  addrText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  price: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.primary },
  priceUnit: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.regular, color: COLORS.textMuted },
  availBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  availText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  dist: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginLeft: 'auto' },

  travelRow: {
    flexDirection: 'row', backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm,
    marginBottom: SPACING.md, alignItems: 'center',
  },
  travelItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  travelDivider: { width: 1, height: 20, backgroundColor: COLORS.gray[200] },
  travelText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textSecondary },

  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  dirBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  dirBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.primary },
  detailsBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.primary,
  },
  detailsBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.white },
});

export default SpotPreviewCard;
