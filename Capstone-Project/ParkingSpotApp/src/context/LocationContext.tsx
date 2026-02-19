/**
 * Location Context
 * Manages user location and provides location-related utilities
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as ExpoLocation from 'expo-location';
import { Location, LocationContextType } from '../constants';
import { calculateDistance as calcDist } from '../services/firebase';

// Create context with undefined default
const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

/**
 * LocationProvider component - provides user location state to the app
 */
export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Requests location permissions from the user
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  }, []);

  /**
   * Gets the user's current location
   */
  const getCurrentLocation = useCallback(async (): Promise<Location | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if permission is granted
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Try to request permission
        const granted = await requestPermission();
        if (!granted) {
          setError('Location permission not granted');
          setIsLoading(false);
          return null;
        }
      }

      // Get current position with lower accuracy requirement for emulators
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Try to get address (reverse geocoding)
      try {
        const [address] = await ExpoLocation.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        if (address) {
          location.address = [
            address.streetNumber,
            address.street,
          ].filter(Boolean).join(' ');
          location.city = address.city || undefined;
          location.state = address.region || undefined;
          location.zipCode = address.postalCode || undefined;
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
      }

      setUserLocation(location);
      setIsLoading(false);
      return location;
    } catch (err: any) {
      console.error('Error getting location:', err);
      const errorMessage =
        err.code === 'E_LOCATION_SERVICES_DISABLED'
          ? 'Location services are disabled. Please enable GPS in device settings.'
          : err.message || 'Unable to get your current location.';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [requestPermission]);

  /**
   * Calculates distance from user's location to a spot
   * Returns distance in kilometers or null if user location unknown
   */
  const calculateDistance = useCallback(
    (spot: Location): number | null => {
      if (!userLocation) {
        return null;
      }

      return calcDist(
        userLocation.latitude,
        userLocation.longitude,
        spot.latitude,
        spot.longitude
      );
    },
    [userLocation]
  );

  const value: LocationContextType = {
    userLocation,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
    calculateDistance,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

/**
 * Hook to access location context
 * Must be used within LocationProvider
 */
export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);

  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }

  return context;
};

export default LocationContext;
