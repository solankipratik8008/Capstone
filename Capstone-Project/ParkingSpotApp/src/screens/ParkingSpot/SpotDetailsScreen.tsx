/**
 * Spot Details Screen
 * Displays detailed information about a parking spot
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Button, Badge, Loading, Avatar } from '../../components/common';
import { useParkingSpots, useLocation } from '../../context';
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
  SPOT_TYPE_LABELS,
  AMENITY_LABELS,
  ParkingSpot,
} from '../../constants';
import { MapStackParamList } from '../../navigation/MapStackNavigator';

const { width } = Dimensions.get('window');

type RouteProps = RouteProp<MapStackParamList, 'SpotDetails'>;

export const SpotDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { spotId } = route.params;

  const { getSpotById } = useParkingSpots();
  const { calculateDistance } = useLocation();

  const [spot, setSpot] = useState<ParkingSpot | undefined>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch spot data
  useEffect(() => {
    const spotData = getSpotById(spotId);
    setSpot(spotData);
    setIsLoading(false);
  }, [spotId, getSpotById]);

  // Open directions in maps app
  const handleGetDirections = () => {
    if (!spot) return;

    const { latitude, longitude } = spot.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    });
  };

  // Contact owner (placeholder)
  const handleContactOwner = () => {
    Alert.alert(
      'Contact Owner',
      'This feature will allow you to message the parking spot owner.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading spot details..." />;
  }

  if (!spot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray[400]} />
          <Text style={styles.errorText}>Parking spot not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  const distance = calculateDistance(spot.location);
  const images = spot.imageURLs.length > 0
    ? spot.imageURLs
    : ['https://via.placeholder.com/400x300?text=No+Image'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image indicator dots */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Availability badge */}
          <View style={styles.availabilityBadge}>
            <Badge
              text={spot.isAvailable ? 'Available' : 'Unavailable'}
              variant={spot.isAvailable ? 'success' : 'error'}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Price */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{spot.title}</Text>
              <Text style={styles.spotType}>
                {SPOT_TYPE_LABELS[spot.spotType] || spot.spotType}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${spot.pricePerHour}</Text>
              <Text style={styles.priceUnit}>/hour</Text>
              {spot.pricePerDay && (
                <Text style={styles.priceDaily}>${spot.pricePerDay}/day</Text>
              )}
            </View>
          </View>

          {/* Rating and Distance */}
          <View style={styles.statsRow}>
            {spot.rating && (
              <View style={styles.stat}>
                <Ionicons name="star" size={16} color={COLORS.accent} />
                <Text style={styles.statText}>
                  {spot.rating.toFixed(1)} ({spot.reviewCount} reviews)
                </Text>
              </View>
            )}
            {distance !== null && (
              <View style={styles.stat}>
                <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.statText}>
                  {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} away
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{spot.description}</Text>
          </View>

          {/* Amenities */}
          {spot.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {spot.amenities.map((amenity) => (
                  <View key={amenity} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    <Text style={styles.amenityText}>
                      {AMENITY_LABELS[amenity] || amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Location Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.address}>
              {spot.location.address || `${spot.location.city}, ${spot.location.state}`}
            </Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: spot.location.latitude,
                  longitude: spot.location.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: spot.location.latitude,
                    longitude: spot.location.longitude,
                  }}
                />
              </MapView>
            </View>
          </View>

          {/* Owner Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted by</Text>
            <View style={styles.ownerCard}>
              <Avatar name={spot.ownerName} size="medium" />
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{spot.ownerName}</Text>
                <Text style={styles.ownerSince}>Member since 2024</Text>
              </View>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={handleContactOwner}
              >
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomPrice}>${spot.pricePerHour}/hr</Text>
            {spot.pricePerDay && (
              <Text style={styles.bottomPriceDaily}>${spot.pricePerDay}/day</Text>
            )}
          </View>
          <View style={styles.bottomButtons}>
            <Button
              title="Directions"
              variant="outline"
              onPress={handleGetDirections}
              icon={<Ionicons name="navigate-outline" size={18} color={COLORS.primary} />}
              style={styles.directionsButton}
            />
            <Button
              title="Book Now"
              onPress={handleContactOwner}
              disabled={!spot.isAvailable}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginVertical: SPACING.lg,
  },
  imageContainer: {
    position: 'relative',
    height: 280,
  },
  image: {
    width,
    height: 280,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: COLORS.white,
    width: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 50,
    right: SPACING.md,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  spotType: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.xs,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  priceDaily: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  amenityText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  address: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  mapContainer: {
    height: 150,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  map: {
    flex: 1,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  ownerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  ownerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  ownerSince: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  bottomPrice: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  bottomPriceDaily: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  directionsButton: {
    minWidth: 100,
  },
});

export default SpotDetailsScreen;
