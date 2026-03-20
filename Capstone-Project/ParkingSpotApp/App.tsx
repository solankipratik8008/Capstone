/**
 * ParkSpot - Location-Based Parking Spot Rental App
 *
 * Main entry point for the application
 * Sets up providers and navigation
 */
// Firebase initialization is handled in src/services/firebase/config.ts

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StyleSheet } from 'react-native';

import { AuthProvider, ParkingSpotsProvider, LocationProvider } from './src/context';
import { RootNavigator } from './src/navigation';

// Stripe publishable key — safe to expose in client code.
// Replace with your actual Stripe publishable key from https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51StwmT0520GtzQvBMPZuqH3KHuAiff6o1R5bwOQsAk2R4rOnew8DdfsvX6mSBzfTeyouJRQbEesOsn2tp6CE6ZAp00MIEjsF2j';

/**
 * Main App Component
 * Wraps the app with necessary providers for:
 * - Authentication state
 * - Parking spots data
 * - User location
 * - Safe area handling
 * - Gesture handling
 * - Stripe payments
 */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.parkspot.app">
          <AuthProvider>
            <LocationProvider>
              <ParkingSpotsProvider>
                <StatusBar style="auto" />
                <RootNavigator />
              </ParkingSpotsProvider>
            </LocationProvider>
          </AuthProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
