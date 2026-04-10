import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Amenity, ParkingSpot } from '../../constants';
import { NearbyPlace } from '../../services/places';
import { useAppTheme } from '../../theme';

export type PreviewItem =
  | { kind: 'spot'; data: ParkingSpot; distance?: number | null }
  | { kind: 'place'; data: NearbyPlace; distance?: number | null };

interface Props {
  item: PreviewItem;
  onViewDetails?: () => void;
  onClose: () => void;
}

const AMENITY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  covered: 'umbrella-outline',
  gated: 'shield-checkmark-outline',
  ev_charging: 'flash-outline',
  well_lit: 'bulb-outline',
  security_camera: 'videocam-outline',
};

const PLACE_LABELS: Record<NearbyPlace['placeType'], string> = {
  lot: 'Public lot',
  mall: 'Mall parking',
  plaza: 'Plaza parking',
  street: 'Street parking',
};

const distanceLabel = (distance?: number | null) => {
  if (distance === null || distance === undefined) {
    return null;
  }

  return distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`;
};

const openDirections = async (latitude: number, longitude: number) => {
  const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  await Linking.openURL(browserUrl);
};

export const SpotPreviewCard: React.FC<Props> = ({ item, onViewDetails, onClose }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isSpot = item.kind === 'spot';
  const spot = isSpot ? (item.data as ParkingSpot) : null;
  const place = !isSpot ? (item.data as NearbyPlace) : null;
  const distance = distanceLabel(item.distance);
  const amenities: Amenity[] = spot?.amenities?.slice(0, 3) ?? [];
  const image = isSpot && spot?.imageURLs?.length ? { uri: spot.imageURLs[0] } : null;

  const title = isSpot ? spot!.title : place!.name;
  const address = isSpot
    ? spot!.location.address || `${spot!.location.city || ''} ${spot!.location.state || ''}`.trim()
    : place!.vicinity;
  const price = isSpot ? `$${spot!.pricePerHour}/hr` : null;
  const typeLabel = isSpot ? 'Bookable Parking' : 'Public Parking';

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.handle} />

        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={styles.imageWrap}>
            {image ? (
              <Image source={image} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name={isSpot ? 'car-outline' : 'business-outline'}
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {address ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{address}</Text>
              </View>
            ) : null}

            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{typeLabel}</Text>
              </View>
              {!isSpot && place ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{PLACE_LABELS[place.placeType]}</Text>
                </View>
              ) : null}
              {distance ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{distance}</Text>
                </View>
              ) : null}
            </View>

            {price ? <Text style={styles.price}>{price}</Text> : null}
          </View>
        </View>

        {amenities.length > 0 ? (
          <View style={styles.amenityRow}>
            {amenities.map((amenity) => (
              <View key={amenity} style={styles.amenityChip}>
                <Ionicons
                  name={AMENITY_ICONS[amenity] ?? 'checkmark-circle-outline'}
                  size={12}
                  color={theme.colors.primary}
                />
                <Text style={styles.amenityText}>{amenity.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {!isSpot && place ? (
          <View style={styles.publicNotice}>
            <Ionicons name="information-circle-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.infoText}>Not Bookable. Booking is handled outside ParkSpot.</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={!isSpot ? styles.primaryAction : styles.secondaryAction}
            onPress={() => openDirections(
              isSpot ? spot!.location.latitude : place!.latitude,
              isSpot ? spot!.location.longitude : place!.longitude
            )}
            activeOpacity={0.85}
          >
            <Ionicons
              name="navigate-outline"
              size={16}
              color={!isSpot ? theme.colors.textOnPrimary : theme.colors.primary}
            />
            <Text style={!isSpot ? styles.primaryActionText : styles.secondaryActionText}>
              {isSpot ? 'Directions' : 'Open Google Maps'}
            </Text>
          </TouchableOpacity>

          {isSpot && onViewDetails ? (
            <TouchableOpacity style={styles.primaryAction} onPress={onViewDetails} activeOpacity={0.9}>
              <Text style={styles.primaryActionText}>View Details</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.textOnPrimary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const createStyles = ({ colors, radii, spacing, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
    },
    card: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xl,
      borderRadius: radii.xxl,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      ...shadows.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: radii.full,
      backgroundColor: colors.borderStrong,
      marginBottom: spacing.md,
    },
    closeButton: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    headerRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    imageWrap: {
      width: 92,
      height: 92,
      borderRadius: radii.xl,
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imagePlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      paddingRight: spacing.xl,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      lineHeight: 22,
      marginBottom: spacing.xs,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    metaText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    tag: {
      borderRadius: radii.full,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    tagText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
    },
    price: {
      color: colors.primary,
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
    },
    amenityRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    amenityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primaryFaint,
      borderRadius: radii.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    amenityText: {
      color: colors.primary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      textTransform: 'capitalize',
    },
    publicNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.primaryFaint,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    secondaryAction: {
      flex: 1,
      minHeight: 48,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: 'transparent',
    },
    secondaryActionText: {
      color: colors.primary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
    primaryAction: {
      flex: 1.2,
      minHeight: 48,
      borderRadius: radii.lg,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      ...shadows.glow,
    },
    primaryActionText: {
      color: colors.textOnPrimary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
  });

export default SpotPreviewCard;
