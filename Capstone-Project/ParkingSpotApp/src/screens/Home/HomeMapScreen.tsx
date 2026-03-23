/**
 * Home Map Screen
 * Displays user-listed spots AND nearby paid parking lots on a map.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ParkingMarker, PlacesMarker, UserLocationMarker } from '../../components/maps';
import { ParkingSpotCard } from '../../components/parking';
import { Loading } from '../../components/common';
import { useParkingSpots, useLocation } from '../../context';
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
  DEFAULT_REGION,
  ParkingSpot,
} from '../../constants';
import { MapStackParamList } from '../../navigation/MapStackNavigator';
import { fetchNearbyParking, NearbyPlace } from '../../services/places';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

type NavigationProp = NativeStackNavigationProp<MapStackParamList>;
type FilterType = 'all' | 'spots' | 'places';

const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all',    label: 'All',       icon: 'layers-outline' },
  { key: 'spots',  label: 'ParkSpot',  icon: 'home-outline' },
  { key: 'places', label: 'Paid Lots', icon: 'business-outline' },
];

export const HomeMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  const { spots, isLoading: spotsLoading } = useParkingSpots();
  const { userLocation, getCurrentLocation, calculateDistance } = useLocation();

  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showList, setShowList] = useState(false);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([]);

  // Nearby places state
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  const scrollX = useRef(new Animated.Value(0)).current;

  // Get user location on mount
  useEffect(() => { getCurrentLocation(); }, []);

  // Animate to user location when available
  useEffect(() => {
    if (userLocation && mapReady && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [userLocation, mapReady]);

  // Fetch nearby paid parking lots when location is available
  useEffect(() => {
    if (!userLocation) return;
    fetchNearbyParking(userLocation.latitude, userLocation.longitude)
      .then(setNearbyPlaces)
      .catch(() => {}); // graceful fail — Places API key may need enabling
  }, [userLocation?.latitude, userLocation?.longitude]);

  // Filter spots based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const results = spots.filter(
        (spot) =>
          spot.title.toLowerCase().includes(query) ||
          spot.description.toLowerCase().includes(query) ||
          spot.location.address?.toLowerCase().includes(query) ||
          spot.location.city?.toLowerCase().includes(query)
      );
      if (userLocation) {
        results.sort((a, b) => {
          const distA = calculateDistance(a.location) ?? Infinity;
          const distB = calculateDistance(b.location) ?? Infinity;
          return distA - distB;
        });
      }
      setFilteredSpots(results);
      setIsSearching(true);
    } else {
      setFilteredSpots([]);
      setIsSearching(false);
    }
  }, [searchQuery, spots, userLocation, calculateDistance]);

  // What shows on the map depends on filter
  const displaySpots  = activeFilter === 'places' ? [] : spots;
  const displayPlaces = activeFilter === 'spots'  ? [] : nearbyPlaces;

  // Handle user-spot marker press
  const handleMarkerPress = useCallback((spot: ParkingSpot) => {
    setSelectedSpotId(spot.id);
    setSelectedPlaceId(null);
    setShowList(true);
    const index = spots.findIndex((s) => s.id === spot.id);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
    mapRef.current?.animateToRegion({
      latitude: spot.location.latitude,
      longitude: spot.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, [spots]);

  // Handle places marker press
  const handlePlacePress = useCallback((place: NearbyPlace) => {
    setSelectedPlaceId(place.id);
    setSelectedSpotId(null);
    mapRef.current?.animateToRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, []);

  const handleSearchResultPress = useCallback((spot: ParkingSpot) => {
    setSearchQuery('');
    handleMarkerPress(spot);
    Keyboard.dismiss();
  }, [handleMarkerPress]);

  const handleCardPress = useCallback((spotId: string) => {
    navigation.navigate('SpotDetails', { spotId });
  }, [navigation]);

  const handleCenterLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [getCurrentLocation]);

  const handleMapPress = useCallback(() => {
    setSelectedSpotId(null);
    setSelectedPlaceId(null);
    setShowList(false);
    Keyboard.dismiss();
    setSearchQuery('');
  }, []);

  const renderSpotCard = useCallback(({ item }: { item: ParkingSpot }) => {
    const distance = calculateDistance(item.location);
    return (
      <View style={styles.cardContainer}>
        <ParkingSpotCard
          spot={item}
          distance={distance}
          onPress={() => handleCardPress(item.id)}
          horizontal
        />
      </View>
    );
  }, [calculateDistance, handleCardPress]);

  const renderSearchItem = useCallback(({ item }: { item: ParkingSpot }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => handleSearchResultPress(item)}
    >
      <View style={styles.searchItemIcon}>
        <Ionicons name="location" size={18} color={COLORS.primary} />
      </View>
      <View style={styles.searchItemContent}>
        <Text style={styles.searchItemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.searchItemSubtitle} numberOfLines={1}>
          {item.location.address || 'Unknown address'}
        </Text>
      </View>
      <View style={styles.searchItemDistance}>
        <Text style={styles.distanceText}>
          {calculateDistance(item.location)?.toFixed(1)} km
        </Text>
      </View>
    </TouchableOpacity>
  ), [calculateDistance, handleSearchResultPress]);

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        onMapReady={() => setMapReady(true)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handleMapPress}
      >
        {userLocation && (
          <UserLocationMarker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
          />
        )}

        {/* User-listed ParkSpot markers */}
        {displaySpots.map((spot) => (
          <ParkingMarker
            key={spot.id}
            spot={spot}
            selected={selectedSpotId === spot.id}
            onPress={() => handleMarkerPress(spot)}
            onDetailsPress={() => handleCardPress(spot.id)}
          />
        ))}

        {/* Google Places paid parking lot markers */}
        {displayPlaces.map((place) => (
          <PlacesMarker
            key={place.id}
            place={place}
            selected={selectedPlaceId === place.id}
            onPress={() => handlePlacePress(place)}
          />
        ))}
      </MapView>

      {/* Header with search + filter chips */}
      <SafeAreaView style={styles.header} edges={['top']}>
        {/* Search row */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => (navigation as any).navigate('ProfileTab')}
          >
            <Ionicons name="menu" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search parking spots..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter chips */}
        {!isSearching && (
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, activeFilter === f.key && styles.chipActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={f.icon}
                  size={13}
                  color={activeFilter === f.key ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
                {f.key === 'places' && nearbyPlaces.length > 0 && (
                  <View style={[styles.chipBadge, activeFilter === f.key && styles.chipBadgeActive]}>
                    <Text style={[styles.chipBadgeText, activeFilter === f.key && styles.chipBadgeTextActive]}>
                      {nearbyPlaces.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Legend dots */}
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <View style={[styles.legendDot, { backgroundColor: COLORS.places }]} />
            </View>
          </View>
        )}

        {/* Search results */}
        {isSearching && filteredSpots.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={filteredSpots.slice(0, 5)}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item.id}
              style={styles.searchResultsList}
              keyboardShouldPersistTaps="always"
            />
          </View>
        )}
      </SafeAreaView>

      {/* Floating action buttons */}
      {!isSearching && (
        <View style={styles.floatingButtons}>
          <TouchableOpacity style={styles.floatingButton} onPress={handleCenterLocation}>
            <Ionicons name="locate" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowList(!showList)}
          >
            <Ionicons name={showList ? 'map' : 'list'} size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom cards — only user spots */}
      {showList && !isSearching && activeFilter !== 'places' && spots.length > 0 && (
        <View style={styles.cardListContainer}>
          <View style={styles.cardListHeader}>
            <Text style={styles.cardListTitle}>
              {spots.length} spot{spots.length !== 1 ? 's' : ''} nearby
            </Text>
          </View>
          <FlatList
            ref={flatListRef}
            data={spots}
            renderItem={renderSpotCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING.md}
            decelerationRate="fast"
            contentContainerStyle={styles.cardListContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
          />
        </View>
      )}

      {/* Loading overlay */}
      {spotsLoading && (
        <View style={styles.loadingOverlay}>
          <Loading text="Loading spots..." />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  chipBadge: {
    backgroundColor: COLORS.primary + '22',
    borderRadius: BORDER_RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipBadgeActive: {
    backgroundColor: COLORS.white + '33',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  chipBadgeTextActive: {
    color: COLORS.white,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 'auto',
    paddingRight: SPACING.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Search results
  searchResultsContainer: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: 300,
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  searchResultsList: {
    paddingVertical: SPACING.xs,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  searchItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  searchItemContent: {
    flex: 1,
  },
  searchItemTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  searchItemSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  searchItemDistance: {
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  distanceText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },

  // Floating buttons
  floatingButtons: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: 220,
    gap: SPACING.sm,
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },

  // Bottom card list
  cardListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: SPACING.lg,
    backgroundColor: 'transparent',
  },
  cardListHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  cardListTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.sm,
  },
  cardListContent: {
    paddingHorizontal: SPACING.lg,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: SPACING.md,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeMapScreen;
