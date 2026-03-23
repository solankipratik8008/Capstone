/**
 * Profile Stack Navigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import MySpotsScreen from '../screens/Profile/MySpotsScreen';
import MyBookingsScreen from '../screens/Profile/MyBookingsScreen';
import OwnerBookingsScreen from '../screens/Profile/OwnerBookingsScreen';
import AddSpotScreen from '../screens/ParkingSpot/AddSpotScreen';
import SpotDetailsScreen from '../screens/ParkingSpot/SpotDetailsScreen';
import HelpCenterScreen from '../screens/Settings/HelpCenterScreen';
import TermsOfServiceScreen from '../screens/Settings/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/Settings/PrivacyPolicyScreen';
import PaymentMethodsScreen from '../screens/Settings/PaymentMethodsScreen';
import { ParkingPassScreen } from '../screens/Booking/ParkingPassScreen';
import GateScannerScreen from '../screens/Booking/GateScannerScreen';
import { COLORS } from '../constants';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MySpots: undefined;
  MyBookings: undefined;
  OwnerBookings: undefined;
  AddSpot: { spotId?: string } | undefined;
  SpotDetails: { spotId: string };
  HelpCenter: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  PaymentMethods: undefined;
  ParkingPass: { bookingId: string };
  GateScanner: { qrValue: string };
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
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="OwnerBookings" component={OwnerBookingsScreen} />
      <Stack.Screen name="AddSpot" component={AddSpotScreen} />
      <Stack.Screen name="SpotDetails" component={SpotDetailsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="ParkingPass" component={ParkingPassScreen} />
      <Stack.Screen
        name="GateScanner"
        component={GateScannerScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
