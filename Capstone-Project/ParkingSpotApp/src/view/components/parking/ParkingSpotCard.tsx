/**
 * Parking Spot Card Component
 * Displays parking spot information in a card format
 */

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingSpot, COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS, SPOT_TYPE_LABELS } from '../../constants';
import { Badge } from '../common';

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  onPress: () => void;
  distance?: number | null;
  horizontal?: boolean;
}

export const ParkingSpotCard: React.FC<ParkingSpotCardProps> = ({
  spot,
  onPress,
  distance,
  horizontal = false,
}) => {
  // Format distance for display
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  // Placeholder image URL for spots without images
  const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300/4A90D9/FFFFFF?text=Parking+Spot';

  // Get placeholder image if none available
  const imageSource = spot.imageURLs.length > 0
    ? { uri: spot.imageURLs[0] }
    : { uri: PLACEHOLDER_IMAGE };

  if (horizontal) {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image source={imageSource} style={styles.horizontalImage} />
        <View style={styles.horizontalContent}>
          <Text style={styles.title} numberOfLines={1}>{spot.title}</Text>
          <Text style={styles.address} numberOfLines={1}>
            {spot.location.address || 'Address not available'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.price}>${spot.pricePerHour}/hr</Text>
            {distance !== null && distance !== undefined && (
              <Text style={styles.distance}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                {' '}{formatDistance(distance)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.badgeContainer}>
          <Badge
            text={spot.isAvailable ? 'Available' : 'Unavailable'}
            variant={spot.isAvailable ? 'success' : 'error'}
            size="small"
          />
        </View>
        {spot.rating && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={COLORS.accent} />
            <Text style={styles.ratingText}>{spot.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{spot.title}</Text>
        <Text style={styles.spotType}>
          {SPOT_TYPE_LABELS[spot.spotType] || spot.spotType}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.address} numberOfLines={1}>
            {spot.location.address || spot.location.city || 'Address not available'}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${spot.pricePerHour}</Text>
            <Text style={styles.priceUnit}>/hour</Text>
          </View>

          {distance !== null && distance !== undefined && (
            <Text style={styles.distance}>{formatDistance(distance)} away</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.sm,
  },
  ratingText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: 2,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  spotType: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  address: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  distance: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },

  // Horizontal card styles
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  horizontalImage: {
    width: 100,
    height: 80,
    resizeMode: 'cover',
  },
  horizontalContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
});

export default ParkingSpotCard;
