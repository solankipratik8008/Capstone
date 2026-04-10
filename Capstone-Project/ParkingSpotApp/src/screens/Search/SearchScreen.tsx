import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Button, CardSkeleton, ChipGroup } from '../../components/common';
import { ParkingSpotCard } from '../../components/parking';
import { ParkingSpot, SPOT_TYPE_LABELS } from '../../constants';
import { useLocation, useParkingSpots } from '../../context';
import { MapStackParamList } from '../../navigation/MapStackNavigator';
import { useAppTheme } from '../../theme';

type NavigationProp = NativeStackNavigationProp<MapStackParamList>;

const priceOptions = [
  { value: '10', label: '$10/hr' },
  { value: '20', label: '$20/hr' },
  { value: '50', label: '$50/hr' },
  { value: '100', label: '$100/hr' },
];

const distanceOptions = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
];

const spotTypeOptions = [
  { value: 'all', label: 'All Types' },
  ...Object.entries(SPOT_TYPE_LABELS).map(([value, label]) => ({ value, label: String(label) })),
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { spots, isLoading } = useParkingSpots();
  const { userLocation, calculateDistance } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(50);
  const [maxDistance, setMaxDistance] = useState(25);
  const [selectedSpotTypes, setSelectedSpotTypes] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  const filteredSpots = useMemo(() => {
    let results = [...spots];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((spot) =>
        spot.title.toLowerCase().includes(query) ||
        spot.description.toLowerCase().includes(query) ||
        spot.location.address?.toLowerCase().includes(query) ||
        spot.location.city?.toLowerCase().includes(query)
      );
    }

    results = results.filter((spot) => spot.pricePerHour <= maxPrice);

    if (userLocation) {
      results = results.filter((spot) => {
        const distance = calculateDistance(spot.location);
        return distance !== null && distance <= maxDistance;
      });
    }

    if (!selectedSpotTypes.includes('all')) {
      results = results.filter((spot) => selectedSpotTypes.includes(spot.spotType));
    }

    results.sort((a, b) => {
      if (sortBy === 'price') {
        return a.pricePerHour - b.pricePerHour;
      }

      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }

      if (!userLocation) {
        return 0;
      }

      return (calculateDistance(a.location) || Infinity) - (calculateDistance(b.location) || Infinity);
    });

    return results;
  }, [spots, searchQuery, maxPrice, maxDistance, selectedSpotTypes, sortBy, userLocation, calculateDistance]);

  const clearFilters = () => {
    setSearchQuery('');
    setMaxPrice(50);
    setMaxDistance(25);
    setSelectedSpotTypes(['all']);
    setSortBy('distance');
  };

  const renderSpot = useCallback(
    ({ item }: { item: ParkingSpot }) => (
      <View style={styles.spotItem}>
        <ParkingSpotCard
          spot={item}
          distance={calculateDistance(item.location)}
          onPress={() => navigation.navigate('SpotDetails', { spotId: item.id })}
        />
      </View>
    ),
    [calculateDistance, navigation, styles.spotItem]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by area, address, or listing name"
            placeholderTextColor={theme.colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.sortRow}>
        {[
          { key: 'distance', icon: 'locate-outline', label: 'Nearby' },
          { key: 'price', icon: 'cash-outline', label: 'Price' },
          { key: 'rating', icon: 'star-outline', label: 'Rating' },
        ].map((option) => {
          const selected = sortBy === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.sortChip, selected && styles.sortChipActive]}
              onPress={() => setSortBy(option.key as typeof sortBy)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={15}
                color={selected ? theme.colors.textOnPrimary : theme.colors.textSecondary}
              />
              <Text style={[styles.sortChipText, selected && styles.sortChipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredSpots.length} {filteredSpots.length === 1 ? 'spot' : 'spots'} found
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map((key) => <CardSkeleton key={key} />)}
        </View>
      ) : (
        <FlatList
          data={filteredSpots}
          keyExtractor={(item) => item.id}
          renderItem={renderSpot}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={44} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No matches right now</Text>
              <Text style={styles.emptySubtitle}>Try expanding your price or distance filters.</Text>
              <Button title="Clear Filters" onPress={clearFilters} variant="outline" />
            </View>
          }
        />
      )}

      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilters(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)} activeOpacity={0.85}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters} activeOpacity={0.85}>
              <Text style={styles.clearText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Max price</Text>
              <View style={styles.optionRow}>
                {priceOptions.map((option) => {
                  const selected = maxPrice === Number(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionChip, selected && styles.optionChipActive]}
                      onPress={() => setMaxPrice(Number(option.value))}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Max distance</Text>
              <View style={styles.optionRow}>
                {distanceOptions.map((option) => {
                  const selected = maxDistance === Number(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionChip, selected && styles.optionChipActive]}
                      onPress={() => setMaxDistance(Number(option.value))}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Spot type</Text>
              <ChipGroup
                items={spotTypeOptions}
                selectedValues={selectedSpotTypes}
                onSelectionChange={(values) => {
                  if (values.includes('all') || values.length === 0) {
                    setSelectedSpotTypes(['all']);
                  } else {
                    setSelectedSpotTypes(values.filter((value) => value !== 'all'));
                  }
                }}
                multiSelect
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title={`Show ${filteredSpots.length} Results`} onPress={() => setShowFilters(false)} fullWidth size="large" />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = ({ colors, spacing, radii, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.heavy,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    searchBar: {
      minHeight: 52,
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
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      minHeight: 52,
    },
    sortRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sortChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sortChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sortChipText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    sortChipTextActive: {
      color: colors.textOnPrimary,
    },
    resultsHeader: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    resultsText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },
    spotItem: {
      marginBottom: spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xxxl,
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    emptySubtitle: {
      marginBottom: spacing.lg,
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
      lineHeight: 22,
      textAlign: 'center',
    },
    skeletonWrap: {
      paddingHorizontal: spacing.lg,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    clearText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
    modalContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    filterSection: {
      marginBottom: spacing.xl,
    },
    filterLabel: {
      marginBottom: spacing.md,
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    optionChip: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    optionChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    optionText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    optionTextActive: {
      color: colors.textOnPrimary,
    },
    modalFooter: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
  });

export default SearchScreen;
