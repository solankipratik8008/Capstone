/**
 * Map Stack Navigator — Black + Light Green theme
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeMapScreen from '../screens/Home/HomeMapScreen';
import SpotDetailsScreen from '../screens/ParkingSpot/SpotDetailsScreen';
import BookingScreen from '../screens/Booking/BookingScreen';
import { useAppTheme } from '../theme';

export type MapStackParamList = {
  HomeMap: undefined;
  SpotDetails: { spotId: string };
  Booking: { spotId: string; spotTitle: string; pricePerHour: number; ownerId: string; isPaidLot?: boolean; placeAddress?: string };
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export const MapStackNavigator: React.FC = () => {
  const { colors, isDark } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMap" component={HomeMapScreen} />
      <Stack.Screen name="SpotDetails" component={SpotDetailsScreen} />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          headerShown: true,
          title: 'Book Spot',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', color: colors.textPrimary },
          headerShadowVisible: false,
          statusBarStyle: isDark ? 'light' : 'dark',
        }}
      />
    </Stack.Navigator>
  );
};

export default MapStackNavigator;
