/**
 * My Spots Screen
 * Displays parking spots owned by the current user
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ParkingSpotCard } from '../../components/parking';
import { Button, Loading } from '../../components/common';
import { useParkingSpots, useAuth } from '../../context';
import { COLORS, SPACING, FONTS, ParkingSpot } from '../../constants';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const MySpotsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { userSpots, isLoading, fetchUserSpots, deleteSpot } = useParkingSpots();

  const handleRefresh = useCallback(() => {
    if (user) {
      fetchUserSpots(user.uid);
    }
  }, [user, fetchUserSpots]);

  const handleSpotPress = (spotId: string) => {
    navigation.navigate('SpotDetails', { spotId });
  };

  const handleEditSpot = (spotId: string) => {
    navigation.navigate('AddSpot', { spotId });
  };

  const handleDeleteSpot = (spot: ParkingSpot) => {
    Alert.alert(
      'Delete Parking Spot',
      `Are you sure you want to delete "${spot.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSpot(spot.id);
              Alert.alert('Success', 'Parking spot deleted successfully.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete parking spot.');
            }
          },
        },
      ]
    );
  };

  const renderSpotItem = ({ item }: { item: ParkingSpot }) => (
    <View style={styles.spotItemContainer}>
      <ParkingSpotCard
        spot={item}
        onPress={() => handleSpotPress(item.id)}
      />
      <View style={styles.spotActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditSpot(item.id)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSpot(item)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>No Parking Spots</Text>
      <Text style={styles.emptySubtitle}>
        You haven't listed any parking spots yet. Start earning by listing your first spot!
      </Text>
      <Button
        title="Add Your First Spot"
        onPress={() => navigation.navigate('AddSpot')}
        style={styles.addButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Parking Spots</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddSpot')}>
          <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && userSpots.length === 0 ? (
        <Loading fullScreen text="Loading your spots..." />
      ) : (
        <FlatList
          data={userSpots}
          renderItem={renderSpotItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  listContent: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  spotItemContainer: {
    marginBottom: SPACING.lg,
  },
  spotActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: -SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.primary,
  },
  deleteButton: {},
  deleteText: {
    color: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
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
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  addButton: {
    minWidth: 200,
  },
});

export default MySpotsScreen;
