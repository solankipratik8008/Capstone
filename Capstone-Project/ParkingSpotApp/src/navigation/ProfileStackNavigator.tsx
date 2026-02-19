/**
 * Profile Stack Navigator
 * Stack navigation for profile-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import MySpotsScreen from '../screens/Profile/MySpotsScreen';
import AddSpotScreen from '../screens/ParkingSpot/AddSpotScreen';
import SpotDetailsScreen from '../screens/ParkingSpot/SpotDetailsScreen';
import { COLORS } from '../constants';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MySpots: undefined;
  AddSpot: { spotId?: string } | undefined;
  SpotDetails: { spotId: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MySpots" component={MySpotsScreen} />
      <Stack.Screen name="AddSpot" component={AddSpotScreen} />
      <Stack.Screen name="SpotDetails" component={SpotDetailsScreen} />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
