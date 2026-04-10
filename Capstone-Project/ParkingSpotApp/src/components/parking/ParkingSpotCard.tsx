import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ParkingSpot, SPOT_TYPE_LABELS } from '../../constants';
import { Badge } from '../common';
import { useAppTheme } from '../../theme';

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  onPress: () => void;
  distance?: number | null;
  horizontal?: boolean;
}

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x600/E5E7EB/6B7280?text=ParkSpot';

export const ParkingSpotCard: React.FC<ParkingSpotCardProps> = ({
  spot,
  onPress,
  distance,
  horizontal = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
  const imageSource = spot.imageURLs.length > 0 ? { uri: spot.imageURLs[0] } : { uri: PLACEHOLDER_IMAGE };

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.85}>
        <Image source={imageSource} style={styles.horizontalImage} />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeader}>
            <Text style={styles.title} numberOfLines={1}>{spot.title}</Text>
            <Text style={styles.priceInline}>${spot.pricePerHour}/hr</Text>
          </View>
          <Text style={styles.address} numberOfLines={1}>
            {spot.location.address || `${spot.location.city || 'Nearby'} parking`}
          </Text>
          <View style={styles.metaRow}>
            <Badge
              text={spot.isAvailable ? 'Available' : 'Unavailable'}
              variant={spot.isAvailable ? 'success' : 'default'}
              size="small"
            />
            {distance !== null && distance !== undefined ? (
              <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.badgeRow}>
          <Badge
            text={spot.isAvailable ? 'Available' : 'Unavailable'}
            variant={spot.isAvailable ? 'success' : 'default'}
            size="small"
          />
          {spot.rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={theme.colors.primary} />
              <Text style={styles.ratingText}>{spot.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{spot.title}</Text>
          <Text style={styles.price}>${spot.pricePerHour}</Text>
        </View>
        <Text style={styles.typeLabel}>{SPOT_TYPE_LABELS[spot.spotType] || spot.spotType}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.address} numberOfLines={1}>
            {spot.location.address || `${spot.location.city || 'Location'} parking`}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.priceUnit}>per hour</Text>
          {distance !== null && distance !== undefined ? (
            <Text style={styles.distanceText}>{formatDistance(distance)} away</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = ({ colors, radii, spacing, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    card: {
      overflow: 'hidden',
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    imageContainer: {
      position: 'relative',
      height: 180,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    badgeRow: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ratingText: {
      color: colors.textPrimary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
    },
    content: {
      padding: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.textPrimary,
    },
    price: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.primary,
    },
    typeLabel: {
      marginTop: spacing.xs,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.textSecondary,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    address: {
      flex: 1,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    footer: {
      marginTop: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceUnit: {
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    distanceText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      fontWeight: typography.weights.semibold,
    },
    horizontalCard: {
      overflow: 'hidden',
      flexDirection: 'row',
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    horizontalImage: {
      width: 116,
      height: 112,
      resizeMode: 'cover',
    },
    horizontalContent: {
      flex: 1,
      padding: spacing.md,
      justifyContent: 'space-between',
    },
    horizontalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    priceInline: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: colors.primary,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
  });

export default ParkingSpotCard;
