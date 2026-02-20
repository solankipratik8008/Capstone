/**
 * Map Stack Navigator
 * Stack navigation for map-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeMapScreen from '../screens/Home/HomeMapScreen';
import SpotDetailsScreen from '../screens/ParkingSpot/SpotDetailsScreen';
import { COLORS } from '../constants';

export type MapStackParamList = {
  HomeMap: undefined;
  SpotDetails: { spotId: string };
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export const MapStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMap" component={HomeMapScreen} />
      <Stack.Screen name="SpotDetails" component={SpotDetailsScreen} />
    </Stack.Navigator>
  );
};

export default MapStackNavigator;
