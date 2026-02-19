/**
 * Home Map Screen
 * Displays all parking spots on a map with interactive markers
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ParkingMarker, UserLocationMarker } from '../../components/maps';
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

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

type NavigationProp = NativeStackNavigationProp<MapStackParamList>;

export const HomeMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  const { spots, isLoading: spotsLoading } = useParkingSpots();
  const { userLocation, getCurrentLocation, calculateDistance } = useLocation();

  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showList, setShowList] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([]);

  const scrollX = useRef(new Animated.Value(0)).current;

  // Get user location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

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

      // Sort by distance if user location is available
      if (userLocation) {
        results.sort((a, b) => {
          const distA = calculateDistance(a.location) || Infinity;
          const distB = calculateDistance(b.location) || Infinity;
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

  // Handle marker press
  const handleMarkerPress = useCallback((spot: ParkingSpot) => {
    setSelectedSpotId(spot.id);
    setShowList(true);

    // Find index and scroll to card
    const index = spots.findIndex((s) => s.id === spot.id);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }

    // Animate map to marker
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: spot.location.latitude,
        longitude: spot.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [spots]);

  // Handle search result selection
  const handleSearchResultPress = useCallback((spot: ParkingSpot) => {
    setSearchQuery('');
    handleMarkerPress(spot);
    Keyboard.dismiss();
  }, [handleMarkerPress]);

  // Handle card press - navigate to details
  const handleCardPress = useCallback((spotId: string) => {
    navigation.navigate('SpotDetails', { spotId });
  }, [navigation]);

  // Center on user location
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

  // Render parking spot card
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

  // Render search suggestion item
  const renderSearchItem = useCallback(({ item }: { item: ParkingSpot }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => handleSearchResultPress(item)}
    >
      <View style={styles.searchItemIcon}>
        <Ionicons name="location" size={20} color={COLORS.primary} />
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
        onPress={() => {
          setSelectedSpotId(null);
          setShowList(false);
          Keyboard.dismiss();
          setSearchQuery('');
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <UserLocationMarker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
          />
        )}

        {/* Parking spot markers */}
        {spots.map((spot) => (
          <ParkingMarker
            key={spot.id}
            spot={spot}
            selected={selectedSpotId === spot.id}
            onPress={() => handleMarkerPress(spot)}
          />
        ))}
      </MapView>

      {/* Header with Search */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => (navigation as any).navigate('ProfileTab')}
          >
            {/* Using search icon as placeholder for menu/profile if needed, or back */}
            {/* Assuming Map is main tab, so maybe just a search icon or nothing */}
            <Ionicons name="menu" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
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
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        {isSearching && filteredSpots.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={filteredSpots.slice(0, 5)} // Limit to 5 suggestions
              renderItem={renderSearchItem}
              keyExtractor={(item) => item.id}
              style={styles.searchResultsList}
              keyboardShouldPersistTaps="always"
            />
          </View>
        )}
      </SafeAreaView>

      {/* Floating buttons */}
      {!isSearching && (
        <View style={styles.floatingButtons}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleCenterLocation}
          >
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowList(!showList)}
          >
            <Ionicons
              name={showList ? 'map' : 'list'}
              size={24}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom card list */}
      {showList && !isSearching && spots.length > 0 && (
        <View style={styles.cardListContainer}>
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
  searchResultsContainer: {
    marginTop: SPACING.sm,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
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
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  distanceText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  floatingButtons: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: 200,
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
  cardListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: SPACING.lg,
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
