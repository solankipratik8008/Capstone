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
import { StyleSheet } from 'react-native';

import { AuthProvider, ParkingSpotsProvider, LocationProvider } from './src/context';
import { RootNavigator } from './src/navigation';

/**
 * Main App Component
 * Wraps the app with necessary providers for:
 * - Authentication state
 * - Parking spots data
 * - User location
 * - Safe area handling
 * - Gesture handling
 */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <ParkingSpotsProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </ParkingSpotsProvider>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
