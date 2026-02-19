/**
 * Search Screen
 * Allows users to search and filter parking spots
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ParkingSpotCard } from '../../components/parking';
import { Button, ChipGroup, Loading, CardSkeleton } from '../../components/common';
import { useParkingSpots, useLocation } from '../../context';
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
  ParkingSpot,
  SpotType,
  SPOT_TYPE_LABELS,
} from '../../constants';
import { MapStackParamList } from '../../navigation/MapStackNavigator';

type NavigationProp = NativeStackNavigationProp<MapStackParamList>;

// Price filter options
const priceOptions = [
  { value: '10', label: '$10/hr' },
  { value: '20', label: '$20/hr' },
  { value: '50', label: '$50/hr' },
  { value: '100', label: '$100/hr' },
];

// Distance filter options
const distanceOptions = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
];

// Spot type filter options
const spotTypeOptions = [
  { value: 'all', label: 'All Types' },
  ...Object.entries(SPOT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { spots, isLoading } = useParkingSpots();
  const { userLocation, calculateDistance } = useLocation();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(50);
  const [maxDistance, setMaxDistance] = useState(25);
  const [selectedSpotTypes, setSelectedSpotTypes] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  // Filter and sort spots
  const filteredSpots = useMemo(() => {
    let results = [...spots];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (spot) =>
          spot.title.toLowerCase().includes(query) ||
          spot.description.toLowerCase().includes(query) ||
          spot.location.address?.toLowerCase().includes(query) ||
          spot.location.city?.toLowerCase().includes(query)
      );
    }

    // Filter by price
    results = results.filter((spot) => spot.pricePerHour <= maxPrice);

    // Filter by distance
    if (userLocation) {
      results = results.filter((spot) => {
        const distance = calculateDistance(spot.location);
        return distance !== null && distance <= maxDistance;
      });
    }

    // Filter by spot type
    if (!selectedSpotTypes.includes('all')) {
      results = results.filter((spot) =>
        selectedSpotTypes.includes(spot.spotType)
      );
    }

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.pricePerHour - b.pricePerHour;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
        default:
          if (!userLocation) return 0;
          const distA = calculateDistance(a.location) || Infinity;
          const distB = calculateDistance(b.location) || Infinity;
          return distA - distB;
      }
    });

    return results;
  }, [spots, searchQuery, maxPrice, maxDistance, selectedSpotTypes, sortBy, userLocation, calculateDistance]);

  // Handle spot press
  const handleSpotPress = useCallback((spotId: string) => {
    navigation.navigate('SpotDetails', { spotId });
  }, [navigation]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setMaxPrice(50);
    setMaxDistance(25);
    setSelectedSpotTypes(['all']);
    setSortBy('distance');
  };

  // Render spot item
  const renderSpotItem = useCallback(
    ({ item }: { item: ParkingSpot }) => {
      const distance = calculateDistance(item.location);
      return (
        <View style={styles.spotItem}>
          <ParkingSpotCard
            spot={item}
            distance={distance}
            onPress={() => handleSpotPress(item.id)}
          />
        </View>
      );
    },
    [calculateDistance, handleSpotPress]
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>No Results Found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters to find parking spots.
      </Text>
      <Button
        title="Clear Filters"
        onPress={handleClearFilters}
        variant="outline"
        style={styles.clearButton}
      />
    </View>
  );

  // Render loading skeletons
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );

  // Filter option button component
  const FilterOption = ({
    label,
    selected,
    onPress
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.filterOption, selected && styles.filterOptionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterOptionText, selected && styles.filterOptionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, name..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      <View style={styles.activeFilters}>
        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'distance' && styles.filterChipActive]}
          onPress={() => setSortBy('distance')}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={sortBy === 'distance' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.filterChipText, sortBy === 'distance' && styles.filterChipTextActive]}>
            Nearby
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'price' && styles.filterChipActive]}
          onPress={() => setSortBy('price')}
        >
          <Ionicons
            name="cash-outline"
            size={16}
            color={sortBy === 'price' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.filterChipText, sortBy === 'price' && styles.filterChipTextActive]}>
            Price
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'rating' && styles.filterChipActive]}
          onPress={() => setSortBy('rating')}
        >
          <Ionicons
            name="star-outline"
            size={16}
            color={sortBy === 'rating' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.filterChipText, sortBy === 'rating' && styles.filterChipTextActive]}>
            Rating
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredSpots.length} {filteredSpots.length === 1 ? 'spot' : 'spots'} found
        </Text>
      </View>

      {/* Results List */}
      {isLoading ? (
        renderLoading()
      ) : (
        <FlatList
          data={filteredSpots}
          renderItem={renderSpotItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Price Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Maximum Price per Hour</Text>
              <View style={styles.filterOptionsRow}>
                {priceOptions.map((option) => (
                  <FilterOption
                    key={option.value}
                    label={option.label}
                    selected={maxPrice === parseInt(option.value)}
                    onPress={() => setMaxPrice(parseInt(option.value))}
                  />
                ))}
              </View>
            </View>

            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Maximum Distance</Text>
              <View style={styles.filterOptionsRow}>
                {distanceOptions.map((option) => (
                  <FilterOption
                    key={option.value}
                    label={option.label}
                    selected={maxDistance === parseInt(option.value)}
                    onPress={() => setMaxDistance(parseInt(option.value))}
                  />
                ))}
              </View>
            </View>

            {/* Spot Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Spot Type</Text>
              <ChipGroup
                items={spotTypeOptions}
                selectedValues={selectedSpotTypes}
                onSelectionChange={(values) => {
                  if (values.includes('all') && !selectedSpotTypes.includes('all')) {
                    setSelectedSpotTypes(['all']);
                  } else if (values.length === 0) {
                    setSelectedSpotTypes(['all']);
                  } else {
                    setSelectedSpotTypes(values.filter((v) => v !== 'all'));
                  }
                }}
                multiSelect
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title={`Show ${filteredSpots.length} Results`}
              onPress={() => setShowFilters(false)}
              fullWidth
              size="large"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  resultsHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  resultsCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    flexGrow: 1,
  },
  spotItem: {
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  clearButton: {
    minWidth: 150,
  },
  loadingContainer: {
    padding: SPACING.lg,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  clearText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  filterSection: {
    marginBottom: SPACING.xl,
  },
  filterLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filterOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  filterOptionTextSelected: {
    color: COLORS.white,
  },
  modalFooter: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
});

export default SearchScreen;
