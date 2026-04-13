import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { ParkingSpot } from '../../constants';
import { NearbyPlace } from '../../services/places';
import { useAppTheme } from '../../theme';

interface ParkingMarkerProps {
  spot: ParkingSpot;
  onPress: () => void;
  selected?: boolean;
}

interface PlacesMarkerProps {
  place: NearbyPlace;
  selected?: boolean;
  onPress: () => void;
}

interface UserLocationMarkerProps {
  coordinate: { latitude: number; longitude: number };
}

export const ParkingMarker: React.FC<ParkingMarkerProps> = ({ spot, onPress, selected = false }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const label = `$${Number(spot.pricePerHour).toFixed(spot.pricePerHour % 1 === 0 ? 0 : 2)}`;

  return (
    <Marker
      coordinate={{
        latitude: spot.location.latitude,
        longitude: spot.location.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
      onSelect={onPress}
      zIndex={selected ? 10 : 5}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.markerWrapper}
        collapsable={false}
        onLayout={() => setTracksViewChanges(false)}
      >
        <View
          style={[
            styles.pill,
            selected ? styles.pillSelected : styles.pillDefault,
          ]}
        >
          <View style={[styles.statusDot, !spot.isAvailable && styles.statusDotMuted]} />
          <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
        </View>
        <View style={[styles.pointer, selected ? styles.pointerSelected : styles.pointerDefault]} />
      </TouchableOpacity>
    </Marker>
  );
};

export const PlacesMarker: React.FC<PlacesMarkerProps> = ({ place, selected = false, onPress }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
      onSelect={onPress}
      zIndex={selected ? 9 : 4}
    >
      {/* TouchableOpacity wrapper ensures tap is captured on iOS custom markers */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.markerWrapper}
        collapsable={false}
        onLayout={() => setTracksViewChanges(false)}
      >
        <View style={[styles.placeMarker, selected && styles.placeMarkerSelected]}>
          <Text style={[styles.placeText, selected && styles.placeTextSelected]}>P</Text>
        </View>
        <View style={[styles.pointer, selected ? styles.placePointerSelected : styles.placePointer]} />
      </TouchableOpacity>
    </Marker>
  );
};

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ coordinate }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} zIndex={12}>
      <View style={styles.userMarker}>
        <View style={styles.userMarkerOuter}>
          <View style={styles.userMarkerInner} />
        </View>
      </View>
    </Marker>
  );
};

const createStyles = ({ colors, radii, spacing, typography, shadows }: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    markerWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pill: {
      minWidth: 58,
      height: 36,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      ...shadows.sm,
    },
    pillDefault: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pillSelected: {
      backgroundColor: colors.primaryDark,
      borderColor: colors.primaryDark,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: radii.full,
      backgroundColor: colors.white,
    },
    statusDotMuted: {
      backgroundColor: colors.gray[300],
    },
    pillText: {
      color: colors.textOnPrimary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      letterSpacing: 0.2,
    },
    pillTextSelected: {
      color: colors.textOnPrimary,
    },
    pointer: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      marginTop: -1,
    },
    pointerDefault: {
      borderTopColor: colors.primary,
    },
    pointerSelected: {
      borderTopColor: colors.primaryDark,
    },
    placePointer: {
      borderTopColor: '#0891B2',
    },
    placePointerSelected: {
      borderTopColor: '#0E7490',
    },
    placeMarker: {
      width: 42,
      height: 42,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0891B2',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...shadows.sm,
    },
    placeMarkerSelected: {
      backgroundColor: '#0E7490',
      borderColor: '#FFFFFF',
      borderWidth: 2.5,
    },
    placeText: {
      color: '#FFFFFF',
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      letterSpacing: 0.5,
    },
    placeTextSelected: {
      color: '#FFFFFF',
    },
    userMarker: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userMarkerOuter: {
      width: 22,
      height: 22,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    userMarkerInner: {
      width: 10,
      height: 10,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
    },
  });

export default ParkingMarker;
