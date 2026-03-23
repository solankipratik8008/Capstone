/**
 * Parking Marker Component
 * Custom map marker for parking spots
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ParkingSpot, COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';
import { NearbyPlace } from '../../services/places';

interface ParkingMarkerProps {
  spot: ParkingSpot;
  onPress: () => void;
  onDetailsPress?: () => void;
  selected?: boolean;
}

export const ParkingMarker: React.FC<ParkingMarkerProps> = ({
  spot,
  onPress,
  onDetailsPress,
  selected = false,
}) => {
  return (
    <Marker
      coordinate={{
        latitude: spot.location.latitude,
        longitude: spot.location.longitude,
      }}
      onPress={onPress}
      onCalloutPress={onDetailsPress || onPress}
      tracksViewChanges={false}
    >
      {/* Custom marker view */}
      <View style={[styles.markerContainer, selected && styles.markerSelected]}>
        <View style={[styles.marker, selected && styles.markerSelectedInner]}>
          <Ionicons
            name="car"
            size={16}
            color={selected ? COLORS.white : COLORS.primary}
          />
        </View>
        <View style={[styles.markerTail, selected && styles.markerTailSelected]} />
      </View>

      {/* Price tag */}
      <View style={[styles.priceTag, selected && styles.priceTagSelected]}>
        <Text style={[styles.priceText, selected && styles.priceTextSelected]}>
          ${spot.pricePerHour}
        </Text>
      </View>

      {/* Callout popup */}
      <Callout tooltip onPress={onPress}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {spot.title}
          </Text>
          <Text style={styles.calloutAddress} numberOfLines={1}>
            {spot.location.address || 'View details'}
          </Text>
          <View style={styles.calloutFooter}>
            <Text style={styles.calloutPrice}>${spot.pricePerHour}/hr</Text>
            {spot.isAvailable ? (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            ) : (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Unavailable</Text>
              </View>
            )}
          </View>
          <Text style={styles.calloutHint}>Tap for details</Text>
        </View>
      </Callout>
    </Marker>
  );
};

/**
 * Places marker — for Google Places paid parking lots
 */
interface PlacesMarkerProps {
  place: NearbyPlace;
  selected?: boolean;
  onPress: () => void;
}

export const PlacesMarker: React.FC<PlacesMarkerProps> = ({
  place,
  selected = false,
  onPress,
}) => {
  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[styles.placesContainer, selected && styles.markerSelected]}>
        <View style={[styles.placesMarker, selected && styles.placesMarkerSelected]}>
          <Text style={[styles.placesPText, selected && styles.placesPTextSelected]}>P</Text>
        </View>
        <View style={[styles.placesTail, selected && styles.placesTailSelected]} />
      </View>

      <Callout tooltip onPress={onPress}>
        <View style={styles.calloutContainer}>
          <View style={styles.placesCalloutHeader}>
            <View style={styles.placesCalloutBadge}>
              <Text style={styles.placesCalloutBadgeText}>PAID</Text>
            </View>
          </View>
          <Text style={styles.calloutTitle} numberOfLines={1}>{place.name}</Text>
          <Text style={styles.calloutAddress} numberOfLines={1}>{place.vicinity}</Text>
          <View style={styles.calloutFooter}>
            {place.rating != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={12} color={COLORS.accent} />
                <Text style={styles.calloutPrice}>{place.rating.toFixed(1)}</Text>
              </View>
            )}
            {place.openNow != null && (
              <View style={place.openNow ? styles.availableBadge : styles.unavailableBadge}>
                <Text style={place.openNow ? styles.availableText : styles.unavailableText}>
                  {place.openNow ? 'Open' : 'Closed'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.calloutHint}>Commercial parking lot</Text>
        </View>
      </Callout>
    </Marker>
  );
};

/**
 * User location marker
 */
export const UserLocationMarker: React.FC<{
  coordinate: { latitude: number; longitude: number };
}> = ({ coordinate }) => {
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.userMarkerContainer}>
        <View style={styles.userMarkerPulse} />
        <View style={styles.userMarker}>
          <View style={styles.userMarkerInner} />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  // Parking marker styles
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  markerSelected: {
    transform: [{ scale: 1.1 }],
  },
  markerSelectedInner: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    marginTop: -2,
  },
  markerTailSelected: {
    borderTopColor: COLORS.primaryDark,
  },

  // Price tag
  priceTag: {
    position: 'absolute',
    top: -8,
    right: -20,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  priceTagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  priceText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  priceTextSelected: {
    color: COLORS.white,
  },

  // Places marker styles
  placesContainer: {
    alignItems: 'center',
  },
  placesMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.places,
    ...SHADOWS.md,
  },
  placesMarkerSelected: {
    backgroundColor: COLORS.places,
    borderColor: COLORS.placesDark,
  },
  placesPText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.places,
  },
  placesPTextSelected: {
    color: COLORS.white,
  },
  placesTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.places,
    marginTop: -2,
  },
  placesTailSelected: {
    borderTopColor: COLORS.placesDark,
  },
  placesCalloutHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  placesCalloutBadge: {
    backgroundColor: COLORS.placesLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  placesCalloutBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.places,
    letterSpacing: 0.5,
  },

  // Callout styles
  calloutContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: 200,
    ...SHADOWS.lg,
  },
  calloutTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  calloutAddress: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  calloutPrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  availableText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    color: '#065F46',
  },
  unavailableBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  unavailableText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    color: '#991B1B',
  },
  calloutHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // User location marker
  userMarkerContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  userMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});

export default ParkingMarker;
