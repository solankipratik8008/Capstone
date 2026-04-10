import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Avatar, Badge, Button, Card, Loading } from '../../components/common';
import { AMENITY_LABELS, ParkingSpot, SPOT_TYPE_LABELS } from '../../constants';
import { useAuth, useLocation, useParkingSpots } from '../../context';
import { getOrCreateChat } from '../../services/firebase/chat';
import { useAppTheme } from '../../theme';
import { MapStackParamList } from '../../navigation/MapStackNavigator';

const { width } = Dimensions.get('window');

type RouteProps = RouteProp<MapStackParamList, 'SpotDetails'>;
type NavProp = NativeStackNavigationProp<MapStackParamList>;

export const SpotDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { spotId } = route.params;
  const { getSpotById } = useParkingSpots();
  const { calculateDistance } = useLocation();
  const { user } = useAuth();

  const [spot, setSpot] = useState<ParkingSpot | undefined>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    setSpot(getSpotById(spotId));
    setIsLoading(false);
  }, [getSpotById, spotId]);

  const openDirections = async () => {
    if (!spot) {
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.location.latitude},${spot.location.longitude}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (!supported) {
      Alert.alert('Directions unavailable', 'Could not open your maps app.');
      return;
    }
    Linking.openURL(url);
  };

  const openChat = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to message the host.');
      return;
    }

    if (!spot) {
      return;
    }

    if (spot.ownerId === user.uid) {
      Alert.alert('This is your listing', 'You cannot message yourself.');
      return;
    }

    setIsChatLoading(true);
    try {
      const chatId = await getOrCreateChat(
        user.uid,
        user.name,
        spot.ownerId,
        spot.ownerName,
        spot.id,
        spot.title,
        user.photoURL,
        undefined
      );

      (navigation as any).navigate('MessagesTab', {
        screen: 'Chat',
        params: { chatId, otherUserName: spot.ownerName, spotTitle: spot.title },
      });
    } catch (error: any) {
      Alert.alert('Could not start chat', error.message || 'Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const bookNow = () => {
    if (!spot) {
      return;
    }

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to book this spot.');
      return;
    }

    navigation.navigate('Booking', {
      spotId: spot.id,
      spotTitle: spot.title,
      pricePerHour: spot.pricePerHour,
      ownerId: spot.ownerId,
    });
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading spot details" />;
  }

  if (!spot) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.errorTitle}>Parking spot not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </SafeAreaView>
    );
  }

  const distance = calculateDistance(spot.location);
  const images = spot.imageURLs.length > 0 ? spot.imageURLs : ['https://via.placeholder.com/1200x800/E5E7EB/6B7280?text=ParkSpot'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.galleryMeta}>
            <Badge text={spot.isAvailable ? 'Available' : 'Unavailable'} variant={spot.isAvailable ? 'success' : 'default'} />
          </View>

          {images.length > 1 ? (
            <View style={styles.pagination}>
              {images.map((_, index) => (
                <View key={index} style={[styles.dot, currentImageIndex === index && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{spot.title}</Text>
              <Text style={styles.subtitle}>{SPOT_TYPE_LABELS[spot.spotType] || spot.spotType}</Text>
            </View>
            <View style={styles.priceWrap}>
              <Text style={styles.price}>${spot.pricePerHour}</Text>
              <Text style={styles.priceUnit}>per hour</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {distance !== null ? (
              <View style={styles.metaChip}>
                <Ionicons name="locate-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.metaChipText}>
                  {distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`}
                </Text>
              </View>
            ) : null}

            {spot.rating ? (
              <View style={styles.metaChip}>
                <Ionicons name="star" size={14} color={theme.colors.primary} />
                <Text style={styles.metaChipText}>{spot.rating.toFixed(1)} rating</Text>
              </View>
            ) : null}
          </View>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About this spot</Text>
            <Text style={styles.sectionText}>{spot.description}</Text>
          </Card>

          {spot.amenities.length > 0 ? (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenityGrid}>
                {spot.amenities.map((amenity) => (
                  <View key={amenity} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.amenityText}>{AMENITY_LABELS[amenity] || amenity}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.sectionText}>
              {spot.location.address || `${spot.location.city || ''} ${spot.location.state || ''}`.trim()}
            </Text>
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                scrollEnabled={false}
                zoomEnabled={false}
                initialRegion={{
                  latitude: spot.location.latitude,
                  longitude: spot.location.longitude,
                  latitudeDelta: 0.004,
                  longitudeDelta: 0.004,
                }}
              >
                <Marker
                  coordinate={{ latitude: spot.location.latitude, longitude: spot.location.longitude }}
                />
              </MapView>
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Hosted by</Text>
            <View style={styles.hostRow}>
              <Avatar name={spot.ownerName} size="medium" />
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>{spot.ownerName}</Text>
                <Text style={styles.hostMeta}>Responsive host on ParkSpot</Text>
              </View>
              <TouchableOpacity style={styles.messageButton} onPress={openChat} activeOpacity={0.85}>
                {isChatLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>${spot.pricePerHour}/hr</Text>
          {spot.pricePerDay ? <Text style={styles.footerSubprice}>${spot.pricePerDay}/day</Text> : null}
        </View>
        <View style={styles.footerActions}>
          <Button
            title="Directions"
            onPress={openDirections}
            variant="outline"
            icon={<Ionicons name="navigate-outline" size={16} color={theme.colors.primary} />}
            style={styles.directionButton}
          />
          <Button title="Book Now" onPress={bookNow} disabled={!spot.isAvailable} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const createStyles = ({ colors, spacing, radii, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: spacing.xxxl,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    errorTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    gallery: {
      position: 'relative',
      height: 320,
    },
    galleryImage: {
      width,
      height: 320,
      resizeMode: 'cover',
    },
    backButton: {
      position: 'absolute',
      top: 56,
      left: spacing.lg,
      width: 42,
      height: 42,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    galleryMeta: {
      position: 'absolute',
      top: 56,
      right: spacing.lg,
    },
    pagination: {
      position: 'absolute',
      bottom: spacing.md,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radii.full,
      backgroundColor: 'rgba(255,255,255,0.45)',
    },
    dotActive: {
      width: 22,
      backgroundColor: colors.white,
    },
    body: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.heavy,
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
    priceWrap: {
      alignItems: 'flex-end',
    },
    price: {
      color: colors.primary,
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.heavy,
    },
    priceUnit: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    metaChipText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    sectionCard: {
      padding: spacing.lg,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      marginBottom: spacing.sm,
    },
    sectionText: {
      color: colors.textSecondary,
      fontSize: typography.sizes.md,
      lineHeight: 23,
    },
    amenityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    amenityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: colors.primaryFaint,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    amenityText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    mapWrap: {
      marginTop: spacing.md,
      height: 180,
      overflow: 'hidden',
      borderRadius: radii.xl,
    },
    map: {
      flex: 1,
    },
    hostRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hostInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    hostName: {
      color: colors.textPrimary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
    hostMeta: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      marginTop: 2,
    },
    messageButton: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryFaint,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    footerPrice: {
      color: colors.textPrimary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    footerSubprice: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
    },
    footerActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    directionButton: {
      minWidth: 118,
    },
  });

export default SpotDetailsScreen;
