import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ParkingMarker, PlacesMarker, SpotPreviewCard, UserLocationMarker } from '../../components/maps';
import type { PreviewItem } from '../../components/maps';
import { Button, Loading } from '../../components/common';
import { ParkingSpotCard } from '../../components/parking';
import {
  DARK_MAP_STYLE,
  DEFAULT_REGION,
  LIGHT_MAP_STYLE,
  ParkingSpot,
} from '../../constants';
import { useLocation, useParkingSpots } from '../../context';
import { MapStackParamList } from '../../navigation/MapStackNavigator';
import {
  fetchNearbyParking,
  NearbyPlace,
  PlaceSearchResult,
  searchPlacesByText,
} from '../../services/places';
import { useAppTheme } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;

type NavigationProp = NativeStackNavigationProp<MapStackParamList>;
type ParkingTypeFilter = 'all' | 'private' | 'public';

interface MapFilters {
  distance: number;
  parkingType: ParkingTypeFilter;
  maxPrice: number | null;
}

const DEFAULT_MAP_FILTERS: MapFilters = {
  distance: 1000,
  parkingType: 'all',
  maxPrice: null,
};

const RADIUS_OPTIONS: { label: string; meters: number }[] = [
  { label: '200 m', meters: 200 },
  { label: '500 m', meters: 500 },
  { label: '1 km', meters: 1000 },
  { label: '2 km', meters: 2000 },
  { label: '5 km', meters: 5000 },
];

const PRICE_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any price', value: null },
  { label: 'Under $5/hr', value: 5 },
  { label: 'Under $10/hr', value: 10 },
  { label: 'Under $20/hr', value: 20 },
  { label: 'Under $40/hr', value: 40 },
];

const FILTERS: { key: ParkingTypeFilter; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'all', icon: 'layers-outline', label: 'All parking' },
  { key: 'private', icon: 'car-outline', label: 'Bookable only' },
  { key: 'public', icon: 'business-outline', label: 'Public only' },
];

const areFiltersEqual = (left: MapFilters, right: MapFilters) =>
  left.distance === right.distance &&
  left.parkingType === right.parkingType &&
  left.maxPrice === right.maxPrice;

export const HomeMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const mapRef = useRef<MapView>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents the map's onPress from clearing a marker selection that was just set
  const lastMarkerPressMs = useRef(0);

  const { spots, isLoading: spotsLoading } = useParkingSpots();
  const { userLocation, getCurrentLocation, calculateDistance } = useLocation();

  const [mapReady, setMapReady] = useState(false);
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([]);
  const [placeSearchResults, setPlaceSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_MAP_FILTERS);
  const [draftFilters, setDraftFilters] = useState<MapFilters>(DEFAULT_MAP_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!userLocation || !mapReady || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  }, [mapReady, userLocation]);

  const filterOrigin = useMemo(
    () =>
      searchCenter
        ? {
            latitude: searchCenter.lat,
            longitude: searchCenter.lng,
          }
        : userLocation,
    [searchCenter, userLocation],
  );

  useEffect(() => {
    if (!filterOrigin) {
      return;
    }

    fetchNearbyParking(filterOrigin.latitude, filterOrigin.longitude, filters.distance)
      .then(setNearbyPlaces)
      .catch((err) => {
        console.warn('[HomeMapScreen] fetchNearbyParking failed:', err?.message ?? err);
        setNearbyPlaces([]);
      });
  }, [filterOrigin, filters.distance]);

  const getDistance = useCallback(
    (latitude: number, longitude: number) => {
      if (!filterOrigin) {
        return null;
      }

      const R = 6371;
      const dLat = ((latitude - filterOrigin.latitude) * Math.PI) / 180;
      const dLng = ((longitude - filterOrigin.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((filterOrigin.latitude * Math.PI) / 180) *
          Math.cos((latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;

      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    [filterOrigin]
  );

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setFilteredSpots([]);
      setPlaceSearchResults([]);
      setIsSearching(false);
      setIsSearchingPlaces(false);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      return;
    }

    const lower = query.toLowerCase();
    const results = spots
      .filter((spot) => {
        if (filters.parkingType === 'public') {
          return false;
        }

        if (filters.maxPrice !== null && spot.pricePerHour > filters.maxPrice) {
          return false;
        }

        const distance = getDistance(spot.location.latitude, spot.location.longitude);
        if (distance !== null && distance > filters.distance / 1000) {
          return false;
        }

        return (
          spot.title.toLowerCase().includes(lower) ||
          spot.description.toLowerCase().includes(lower) ||
          spot.location.address?.toLowerCase().includes(lower) ||
          spot.location.city?.toLowerCase().includes(lower)
        );
      })
      .sort((left, right) =>
        (calculateDistance(left.location) ?? Infinity) - (calculateDistance(right.location) ?? Infinity),
      );

    setFilteredSpots(results);
    setIsSearching(true);
    setIsSearchingPlaces(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      searchPlacesByText(query)
        .then(setPlaceSearchResults)
        .catch(() => setPlaceSearchResults([]))
        .finally(() => setIsSearchingPlaces(false));
    }, 450);
  }, [calculateDistance, filters, getDistance, searchQuery, spots]);

  const visibleSpots = useMemo(() => {
    if (filters.parkingType === 'public') {
      return [];
    }

    return spots.filter((spot) => {
      if (filters.maxPrice !== null && spot.pricePerHour > filters.maxPrice) {
        return false;
      }

      const distance = getDistance(spot.location.latitude, spot.location.longitude);
      return distance === null || distance <= filters.distance / 1000;
    });
  }, [filters, getDistance, spots]);

  const visiblePlaces = useMemo(() => {
    if (filters.parkingType === 'private') {
      return [];
    }

    return nearbyPlaces.filter((place) => {
      const distance = getDistance(place.latitude, place.longitude);
      return distance === null || distance <= filters.distance / 1000;
    });
  }, [filters.distance, filters.parkingType, getDistance, nearbyPlaces]);

  useEffect(() => {
    if (filters.parkingType === 'public') {
      setShowList(false);
    }
  }, [filters.parkingType]);

  useEffect(() => {
    if (!previewItem) {
      return;
    }

    if (previewItem.kind === 'spot') {
      const exists = visibleSpots.some((spot) => spot.id === previewItem.data.id);
      if (!exists) {
        setPreviewItem(null);
      }
      return;
    }

    const exists = visiblePlaces.some((place) => place.id === previewItem.data.id);
    if (!exists) {
      setPreviewItem(null);
    }
  }, [previewItem, visiblePlaces, visibleSpots]);

  const filterCount = useMemo(() => {
    let count = 0;

    if (filters.distance !== DEFAULT_MAP_FILTERS.distance) {
      count += 1;
    }

    if (filters.parkingType !== DEFAULT_MAP_FILTERS.parkingType) {
      count += 1;
    }

    if (filters.maxPrice !== DEFAULT_MAP_FILTERS.maxPrice) {
      count += 1;
    }

    return count;
  }, [filters]);

  const focusRegion = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, []);

  const handleSpotMarkerPress = useCallback((spot: ParkingSpot) => {
    lastMarkerPressMs.current = Date.now();
    setPreviewItem({
      kind: 'spot',
      data: spot,
      distance: getDistance(spot.location.latitude, spot.location.longitude),
    });
    setShowList(false);
    focusRegion(spot.location.latitude, spot.location.longitude);
  }, [focusRegion, getDistance]);

  const handlePlaceMarkerPress = useCallback((place: NearbyPlace) => {
    lastMarkerPressMs.current = Date.now();
    setPreviewItem({
      kind: 'place',
      data: place,
      distance: getDistance(place.latitude, place.longitude),
    });
    setShowList(false);
    focusRegion(place.latitude, place.longitude);
  }, [focusRegion, getDistance]);

  const handlePlaceSearchSelect = useCallback((place: PlaceSearchResult) => {
    Keyboard.dismiss();
    setSearchQuery('');
    setFilteredSpots([]);
    setPlaceSearchResults([]);
    setIsSearching(false);
    setPreviewItem(null);
    setSearchCenter({ lat: place.latitude, lng: place.longitude, name: place.name });
    focusRegion(place.latitude, place.longitude);
  }, [focusRegion]);

  const handleSearchResultPress = useCallback((spot: ParkingSpot) => {
    Keyboard.dismiss();
    setSearchQuery('');
    setIsSearching(false);
    setPlaceSearchResults([]);
    setFilteredSpots([]);
    handleSpotMarkerPress(spot);
  }, [handleSpotMarkerPress]);

  const handleMapPress = useCallback(() => {
    // If a marker was pressed within the last 400 ms, don't clear the preview.
    // This guards against the map's onPress firing right after a marker press on iOS.
    if (Date.now() - lastMarkerPressMs.current < 400) return;
    setPreviewItem(null);
    Keyboard.dismiss();
  }, []);

  const handleCenterLocation = useCallback(async () => {
    const current = await getCurrentLocation();
    if (!current) {
      return;
    }

    setSearchCenter(null);
    focusRegion(current.latitude, current.longitude);
  }, [focusRegion, getCurrentLocation]);

  const openFilterModal = useCallback(() => {
    setDraftFilters(filters);
    setFilterModalVisible(true);
  }, [filters]);

  const applyFilters = useCallback(() => {
    setFilters(draftFilters);
    setFilterModalVisible(false);
    setPreviewItem(null);
  }, [draftFilters]);

  const resetDraftFilters = useCallback(() => {
    setDraftFilters(DEFAULT_MAP_FILTERS);
  }, []);

  const clearAppliedFilters = useCallback(() => {
    setDraftFilters(DEFAULT_MAP_FILTERS);
    setFilters(DEFAULT_MAP_FILTERS);
    setPreviewItem(null);
  }, []);

  const renderSpotCard = useCallback(
    ({ item }: { item: ParkingSpot }) => (
      <View style={styles.listCard}>
        <ParkingSpotCard
          spot={item}
          horizontal
          distance={calculateDistance(item.location)}
          onPress={() => navigation.navigate('SpotDetails', { spotId: item.id })}
        />
      </View>
    ),
    [calculateDistance, navigation, styles.listCard]
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        customMapStyle={theme.isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        onMapReady={() => setMapReady(true)}
        onPress={handleMapPress}
        showsCompass={false}
        showsMyLocationButton={false}
        showsUserLocation={false}
      >
        {userLocation ? (
          <UserLocationMarker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
          />
        ) : null}

        {visibleSpots.map((spot) => (
          <ParkingMarker
            key={spot.id}
            spot={spot}
            selected={previewItem?.kind === 'spot' && previewItem.data.id === spot.id}
            onPress={() => handleSpotMarkerPress(spot)}
          />
        ))}

        {visiblePlaces.map((place) => (
          <PlacesMarker
            key={place.id}
            place={place}
            selected={previewItem?.kind === 'place' && previewItem.data.id === place.id}
            onPress={() => handlePlaceMarkerPress(place)}
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none" edges={['top']}>
        <View style={styles.searchShell} pointerEvents="auto">
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location or spot name"
              placeholderTextColor={theme.colors.inputPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {isSearching && (filteredSpots.length > 0 || placeSearchResults.length > 0 || isSearchingPlaces) ? (
          <View style={styles.resultsCard} pointerEvents="auto">
            {filteredSpots.slice(0, 3).map((spot) => (
              <TouchableOpacity
                key={spot.id}
                style={styles.resultRow}
                onPress={() => handleSearchResultPress(spot)}
                activeOpacity={0.85}
              >
                <View style={styles.resultIcon}>
                  <Ionicons name="car-outline" size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.resultTextBlock}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{spot.title}</Text>
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {spot.location.address || 'Listed parking'}
                  </Text>
                </View>
                {calculateDistance(spot.location) !== null ? (
                  <Text style={styles.resultBadge}>{calculateDistance(spot.location)?.toFixed(1)} km</Text>
                ) : null}
              </TouchableOpacity>
            ))}

            {filteredSpots.length > 0 && (placeSearchResults.length > 0 || isSearchingPlaces) ? (
              <View style={styles.resultDivider} />
            ) : null}

            {isSearchingPlaces && placeSearchResults.length === 0 ? (
              <View style={styles.loadingRow}>
                <Ionicons name="search-outline" size={14} color={theme.colors.textMuted} />
                <Text style={styles.resultSubtitle}>Searching nearby places…</Text>
              </View>
            ) : null}

            {placeSearchResults.map((place) => (
              <TouchableOpacity
                key={place.placeId}
                style={styles.resultRow}
                onPress={() => handlePlaceSearchSelect(place)}
                activeOpacity={0.85}
              >
                <View style={styles.resultIcon}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.resultTextBlock}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{place.name}</Text>
                  <Text style={styles.resultSubtitle} numberOfLines={1}>{place.formattedAddress}</Text>
                </View>
                <Text style={styles.resultBadge}>Place</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </SafeAreaView>

      {searchCenter && !isSearching && !previewItem ? (
        <View style={styles.banner} pointerEvents="box-none">
          <View style={styles.bannerCard} pointerEvents="auto">
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={styles.bannerText} numberOfLines={1}>Parking near {searchCenter.name}</Text>
            <TouchableOpacity onPress={handleCenterLocation} activeOpacity={0.8}>
              <Text style={styles.bannerAction}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!previewItem ? (
        <View style={styles.utilityOverlay} pointerEvents="box-none">
          {!isSearching && visibleSpots.length > 0 && filters.parkingType !== 'public' ? (
            <TouchableOpacity
              style={styles.listToggle}
              onPress={() => setShowList((current) => !current)}
              activeOpacity={0.88}
            >
              <Ionicons
                name={showList ? 'map-outline' : 'list-outline'}
                size={18}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.listToggleText}>
                {showList ? 'Hide listings' : `${visibleSpots.length} listings`}
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.fabStack} pointerEvents="auto">
            <TouchableOpacity style={styles.fabSecondary} onPress={handleCenterLocation} activeOpacity={0.88}>
              <Ionicons name="locate" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.fabPrimary} onPress={openFilterModal} activeOpacity={0.88}>
              <Ionicons
                name="options-outline"
                size={20}
                color={theme.colors.textOnPrimary}
              />
              {filterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{filterCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {showList && !isSearching && !previewItem && filters.parkingType !== 'public' && visibleSpots.length > 0 ? (
        <View style={styles.listOverlay} pointerEvents="box-none">
          <View style={styles.listHeader} pointerEvents="auto">
            <Text style={styles.listTitle}>{visibleSpots.length} nearby spots</Text>
          </View>
          <FlatList
            data={visibleSpots}
            renderItem={renderSpotCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + theme.spacing.md}
            decelerationRate="fast"
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : null}

      {previewItem ? (
        <SpotPreviewCard
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onViewDetails={
            previewItem.kind === 'spot'
              ? () => navigation.navigate('SpotDetails', { spotId: (previewItem.data as ParkingSpot).id })
              : undefined
          }
        />
      ) : null}

      <Modal
        isVisible={filterModalVisible}
        onBackdropPress={() => setFilterModalVisible(false)}
        onBackButtonPress={() => setFilterModalVisible(false)}
        onSwipeComplete={() => setFilterModalVisible(false)}
        swipeDirection={['down']}
        style={styles.filterModal}
        backdropOpacity={0.45}
        useNativeDriverForBackdrop
      >
        <SafeAreaView style={styles.filterSheet} edges={['bottom']}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Map filters</Text>
              <Text style={styles.sheetSubtitle}>Control what appears on the map.</Text>
            </View>
            <TouchableOpacity
              style={styles.sheetCloseButton}
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={18} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetSection}>
            <Text style={styles.sheetLabel}>Distance</Text>
            <View style={styles.sheetOptionsRow}>
              {RADIUS_OPTIONS.map((option) => {
                const selected = draftFilters.distance === option.meters;
                return (
                  <TouchableOpacity
                    key={option.meters}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    activeOpacity={0.85}
                    onPress={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        distance: option.meters,
                      }))
                    }
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sheetSection}>
            <Text style={styles.sheetLabel}>Parking type</Text>
            <View style={styles.sheetOptionsRow}>
              {FILTERS.map((filter) => {
                const selected = draftFilters.parkingType === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.segmentChip, selected && styles.segmentChipActive]}
                    activeOpacity={0.85}
                    onPress={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        parkingType: filter.key,
                      }))
                    }
                  >
                    <Ionicons
                      name={filter.icon}
                      size={14}
                      color={selected ? theme.colors.textOnPrimary : theme.colors.textSecondary}
                    />
                    <Text style={[styles.segmentLabel, selected && styles.segmentLabelActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sheetSection}>
            <Text style={styles.sheetLabel}>Price range</Text>
            <View style={styles.priceList}>
              {PRICE_OPTIONS.map((option) => {
                const selected = draftFilters.maxPrice === option.value;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.priceRow, selected && styles.priceRowSelected]}
                    activeOpacity={0.85}
                    onPress={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        maxPrice: option.value,
                      }))
                    }
                  >
                    <Text style={[styles.priceRowText, selected && styles.priceRowTextSelected]}>
                      {option.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sheetFooter}>
            <Button title="Reset" variant="secondary" onPress={resetDraftFilters} style={styles.sheetFooterButton} />
            <Button
              title="Apply Filters"
              onPress={applyFilters}
              disabled={areFiltersEqual(draftFilters, filters)}
              style={styles.sheetFooterButton}
            />
          </View>

          {filterCount > 0 ? (
            <TouchableOpacity style={styles.clearAppliedButton} onPress={clearAppliedFilters} activeOpacity={0.85}>
              <Text style={styles.clearAppliedText}>Clear all active filters</Text>
            </TouchableOpacity>
          ) : null}
        </SafeAreaView>
      </Modal>

      {spotsLoading ? <Loading fullScreen message="Loading available spots" /> : null}
    </View>
  );
};

const createStyles = ({ colors, spacing, radii, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    map: {
      flex: 1,
    },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    searchShell: {
      marginBottom: spacing.sm,
    },
    searchBar: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    searchInput: {
      flex: 1,
      minHeight: 54,
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
    },
    segmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
    },
    segmentChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    segmentLabel: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    segmentLabelActive: {
      color: colors.textOnPrimary,
    },
    resultsCard: {
      marginTop: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.md,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    resultIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryFaint,
      marginRight: spacing.md,
    },
    resultTextBlock: {
      flex: 1,
      marginRight: spacing.sm,
    },
    resultTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
    resultSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      marginTop: 2,
    },
    resultBadge: {
      color: colors.primary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
    },
    resultDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    banner: {
      position: 'absolute',
      top: 96,
      left: spacing.lg,
      right: spacing.lg,
    },
    bannerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...shadows.sm,
    },
    bannerText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    bannerAction: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
    utilityOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingBottom: 132,
    },
    listToggle: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...shadows.sm,
    },
    listToggleText: {
      color: colors.textPrimary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    fabStack: {
      position: 'absolute',
      right: spacing.lg,
      bottom: 132,
      gap: spacing.sm,
    },
    fabPrimary: {
      width: 58,
      height: 58,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      ...shadows.glow,
    },
    fabSecondary: {
      width: 54,
      height: 54,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    filterBadge: {
      position: 'absolute',
      top: 6,
      right: 4,
      minWidth: 18,
      height: 18,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      backgroundColor: colors.white,
    },
    filterBadgeText: {
      color: colors.primary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
    },
    listOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: spacing.xl,
    },
    listHeader: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    listTitle: {
      alignSelf: 'flex-start',
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      color: colors.textPrimary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
    },
    listCard: {
      width: CARD_WIDTH,
      marginRight: spacing.md,
    },
    filterModal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    filterSheet: {
      borderTopLeftRadius: radii.xxl,
      borderTopRightRadius: radii.xxl,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: radii.full,
      backgroundColor: colors.borderStrong,
      marginBottom: spacing.md,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    sheetTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
    },
    sheetSubtitle: {
      marginTop: spacing.xs,
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
    },
    sheetCloseButton: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetSection: {
      marginBottom: spacing.lg,
    },
    sheetLabel: {
      marginBottom: spacing.md,
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
    sheetOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    filterChip: {
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    filterChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    filterChipText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    filterChipTextSelected: {
      color: colors.textOnPrimary,
    },
    priceList: {
      gap: spacing.sm,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    priceRowSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryFaint,
    },
    priceRowText: {
      color: colors.textPrimary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    priceRowTextSelected: {
      color: colors.primary,
    },
    sheetFooter: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    sheetFooterButton: {
      flex: 1,
    },
    clearAppliedButton: {
      alignSelf: 'center',
      marginTop: spacing.md,
      paddingVertical: spacing.xs,
    },
    clearAppliedText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
  });

export default HomeMapScreen;
