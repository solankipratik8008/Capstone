/**
 * Home Map Screen — SpotHero-style with radius filter + preview card
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, Platform, TextInput, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ParkingMarker, PlacesMarker, UserLocationMarker, SpotPreviewCard } from '../../components/maps';
import type { PreviewItem } from '../../components/maps';
import { ParkingSpotCard } from '../../components/parking';
import { Loading } from '../../components/common';
import { useParkingSpots, useLocation } from '../../context';
import {
  COLORS, SPACING, FONTS, BORDER_RADIUS, SHADOWS, DEFAULT_REGION, ParkingSpot,
} from '../../constants';
import { MapStackParamList } from '../../navigation/MapStackNavigator';
import { fetchNearbyParking, NearbyPlace } from '../../services/places';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

type NavigationProp = NativeStackNavigationProp<MapStackParamList>;
type FilterType = 'all' | 'spots' | 'places';

const RADIUS_OPTIONS: { label: string; meters: number }[] = [
  { label: '200 m', meters: 200 },
  { label: '500 m', meters: 500 },
  { label: '1 km',  meters: 1000 },
  { label: '2 km',  meters: 2000 },
  { label: '5 km',  meters: 5000 },
];

const TYPE_FILTERS: { key: FilterType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'all',    icon: 'layers-outline',   label: 'All' },
  { key: 'spots',  icon: 'home-outline',     label: 'ParkSpot' },
  { key: 'places', icon: 'business-outline', label: 'Paid Lots' },
];

export const HomeMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  const { spots, isLoading: spotsLoading } = useParkingSpots();
  const { userLocation, getCurrentLocation, calculateDistance } = useLocation();

  const [mapReady, setMapReady] = useState(false);
  const [showList, setShowList] = useState(false);

  // Filters
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedRadius, setSelectedRadius] = useState(1000); // metres

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([]);

  // Places
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  // Preview card
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);

  // ── Location ──────────────────────────────────────────
  useEffect(() => { getCurrentLocation(); }, []);

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

  // ── Fetch nearby places whenever location or radius changes ───
  useEffect(() => {
    if (!userLocation) return;
    fetchNearbyParking(userLocation.latitude, userLocation.longitude, selectedRadius)
      .then(setNearbyPlaces)
      .catch(() => {});
  }, [userLocation?.latitude, userLocation?.longitude, selectedRadius]);

  // ── Search filter ─────────────────────────────────────
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const results = spots.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.location.address?.toLowerCase().includes(q) ||
        s.location.city?.toLowerCase().includes(q)
      );
      if (userLocation) {
        results.sort((a, b) =>
          (calculateDistance(a.location) ?? Infinity) - (calculateDistance(b.location) ?? Infinity)
        );
      }
      setFilteredSpots(results);
      setIsSearching(true);
    } else {
      setFilteredSpots([]);
      setIsSearching(false);
    }
  }, [searchQuery, spots, userLocation, calculateDistance]);

  const displaySpots  = activeFilter === 'places' ? [] : spots;
  const displayPlaces = activeFilter === 'spots'  ? [] : nearbyPlaces;

  // ── Handlers ──────────────────────────────────────────
  const handleSpotMarkerPress = useCallback((spot: ParkingSpot) => {
    const distance = calculateDistance(spot.location);
    setPreviewItem({ kind: 'spot', data: spot, distance });
    setShowList(false);
    mapRef.current?.animateToRegion({
      latitude: spot.location.latitude, longitude: spot.location.longitude,
      latitudeDelta: 0.008, longitudeDelta: 0.008,
    });
  }, [calculateDistance]);

  const handlePlaceMarkerPress = useCallback((place: NearbyPlace) => {
    const distance = userLocation
      ? calculateDistance({ latitude: place.latitude, longitude: place.longitude } as any)
      : undefined;
    setPreviewItem({ kind: 'place', data: place, distance: distance ?? undefined });
    setShowList(false);
    mapRef.current?.animateToRegion({
      latitude: place.latitude, longitude: place.longitude,
      latitudeDelta: 0.008, longitudeDelta: 0.008,
    });
  }, [calculateDistance, userLocation]);

  const handleMapPress = useCallback(() => {
    setPreviewItem(null);
    setShowList(false);
    Keyboard.dismiss();
    setSearchQuery('');
  }, []);

  const handleCenterLocation = useCallback(async () => {
    const loc = await getCurrentLocation();
    if (loc && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: loc.latitude, longitude: loc.longitude,
        latitudeDelta: 0.02, longitudeDelta: 0.02,
      });
    }
  }, [getCurrentLocation]);

  const handleSearchResultPress = useCallback((spot: ParkingSpot) => {
    setSearchQuery('');
    handleSpotMarkerPress(spot);
    Keyboard.dismiss();
  }, [handleSpotMarkerPress]);

  const renderSpotCard = useCallback(({ item }: { item: ParkingSpot }) => (
    <View style={{ width: CARD_WIDTH, marginRight: SPACING.md }}>
      <ParkingSpotCard
        spot={item}
        distance={calculateDistance(item.location)}
        onPress={() => navigation.navigate('SpotDetails', { spotId: item.id })}
        horizontal
      />
    </View>
  ), [calculateDistance, navigation]);

  const renderSearchItem = useCallback(({ item }: { item: ParkingSpot }) => (
    <TouchableOpacity style={styles.searchItem} onPress={() => handleSearchResultPress(item)}>
      <View style={styles.searchItemIcon}>
        <Ionicons name="location" size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.searchItemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.searchItemSub} numberOfLines={1}>
          {item.location.address || 'Unknown address'}
        </Text>
      </View>
      <Text style={styles.searchItemDist}>
        {calculateDistance(item.location)?.toFixed(1)} km
      </Text>
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
          <UserLocationMarker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }} />
        )}

        {displaySpots.map((spot) => (
          <ParkingMarker
            key={spot.id}
            spot={spot}
            selected={previewItem?.kind === 'spot' && previewItem.data.id === spot.id}
            onPress={() => handleSpotMarkerPress(spot)}
            onDetailsPress={() => navigation.navigate('SpotDetails', { spotId: spot.id })}
          />
        ))}

        {displayPlaces.map((place) => (
          <PlacesMarker
            key={place.id}
            place={place}
            selected={previewItem?.kind === 'place' && previewItem.data.id === place.id}
            onPress={() => handlePlaceMarkerPress(place)}
          />
        ))}
      </MapView>

      {/* ── Header overlay ── */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        {/* Search row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search parking spots…"
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

        {/* Radius filter */}
        {!isSearching && (
          <View style={styles.filterScroll}>
            {/* Radius pills */}
            <View style={styles.chipRow}>
              <Ionicons name="radio-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r.meters}
                  style={[styles.chip, selectedRadius === r.meters && styles.chipActive]}
                  onPress={() => setSelectedRadius(r.meters)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, selectedRadius === r.meters && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Type filter */}
            <View style={[styles.chipRow, { marginTop: SPACING.xs }]}>
              {TYPE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, styles.chipType, activeFilter === f.key && styles.chipTypeActive]}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={f.icon}
                    size={12}
                    color={activeFilter === f.key ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text style={[styles.chipText, styles.chipTypeText, activeFilter === f.key && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                  {f.key === 'places' && nearbyPlaces.length > 0 && (
                    <View style={styles.countDot}>
                      <Text style={styles.countDotText}>{nearbyPlaces.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search results */}
        {isSearching && filteredSpots.length > 0 && (
          <View style={styles.searchResultsBox}>
            <FlatList
              data={filteredSpots.slice(0, 5)}
              renderItem={renderSearchItem}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="always"
            />
          </View>
        )}
      </SafeAreaView>

      {/* ── Floating locate button ── */}
      {!isSearching && !previewItem && (
        <View style={styles.fab}>
          <TouchableOpacity style={styles.fabBtn} onPress={handleCenterLocation}>
            <Ionicons name="locate" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fabBtn, styles.fabBtnOutline]} onPress={() => setShowList(!showList)}>
            <Ionicons name={showList ? 'map' : 'list'} size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom card list ── */}
      {showList && !isSearching && !previewItem && activeFilter !== 'places' && spots.length > 0 && (
        <View style={styles.cardList}>
          <View style={styles.cardListHeader}>
            <Text style={styles.cardListTitle}>{spots.length} spot{spots.length !== 1 ? 's' : ''} nearby</Text>
          </View>
          <FlatList
            ref={flatListRef}
            data={spots}
            renderItem={renderSpotCard}
            keyExtractor={(i) => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING.md}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
          />
        </View>
      )}

      {/* ── Spot preview card ── */}
      {previewItem && (
        <SpotPreviewCard
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onViewDetails={
            previewItem.kind === 'spot'
              ? () => navigation.navigate('SpotDetails', { spotId: (previewItem.data as ParkingSpot).id })
              : undefined
          }
        />
      )}

      {spotsLoading && (
        <View style={styles.loadingOverlay}>
          <Loading text="Loading spots…" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
  },

  searchRow: { marginBottom: SPACING.xs },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    height: 46, backgroundColor: COLORS.white,
    borderRadius: 23, paddingHorizontal: SPACING.md,
    ...SHADOWS.md,
  },
  searchInput: {
    flex: 1, marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
  },

  filterScroll: {},
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white, ...SHADOWS.sm,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipType: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipTypeActive: { backgroundColor: COLORS.primary },
  chipTypeText: {},
  chipText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  countDot: {
    backgroundColor: COLORS.white + '33', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  countDotText: { fontSize: 9, fontWeight: '700', color: COLORS.white },

  searchResultsBox: {
    marginTop: SPACING.xs, backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, maxHeight: 280,
    ...SHADOWS.md, overflow: 'hidden',
  },
  searchItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  searchItemIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  searchItemTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, color: COLORS.textPrimary },
  searchItemSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  searchItemDist: {
    fontSize: FONTS.sizes.xs, color: COLORS.textSecondary,
    backgroundColor: COLORS.gray[100], borderRadius: 6,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, marginLeft: SPACING.sm,
  },

  fab: { position: 'absolute', right: SPACING.lg, bottom: 200, gap: SPACING.sm },
  fabBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.md,
  },
  fabBtnOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },

  cardList: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: SPACING.xl,
  },
  cardListHeader: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  cardListTitle: {
    fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary, backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full, ...SHADOWS.sm,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center',
  },
});

export default HomeMapScreen;
