/**
 * Parking Spots Context
 * Manages parking spots state and provides CRUD operations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getAllParkingSpots,
  getUserParkingSpots,
  createParkingSpot,
  updateParkingSpot as updateSpotInDb,
  deleteParkingSpot as deleteSpotFromDb,
  subscribeToSpots,
} from '../services/firebase';
import { ParkingSpot, ParkingSpotsContextType } from '../constants';
import { useAuth } from './AuthContext';

// Create context with undefined default
const ParkingSpotsContext = createContext<ParkingSpotsContextType | undefined>(undefined);

interface ParkingSpotsProviderProps {
  children: ReactNode;
}

/**
 * ParkingSpotsProvider component - provides parking spots state to the app
 */
export const ParkingSpotsProvider: React.FC<ParkingSpotsProviderProps> = ({ children }) => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [userSpots, setUserSpots] = useState<ParkingSpot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Subscribe to real-time updates for all spots
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToSpots(
      (updatedSpots) => {
        setSpots(updatedSpots);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch user's own spots when user changes
  useEffect(() => {
    if (user) {
      fetchUserSpots(user.uid);
    } else {
      setUserSpots([]);
    }
  }, [user]);

  /**
   * Fetches all available parking spots
   */
  const fetchSpots = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedSpots = await getAllParkingSpots();
      setSpots(fetchedSpots);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches parking spots owned by a specific user
   */
  const fetchUserSpots = useCallback(async (userId: string): Promise<void> => {
    try {
      const fetchedSpots = await getUserParkingSpots(userId);
      setUserSpots(fetchedSpots);
    } catch (err: any) {
      console.error('Error fetching user spots:', err);
    }
  }, []);

  /**
   * Creates a new parking spot
   */
  const addSpot = useCallback(
    async (spotData: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      try {
        const spotId = await createParkingSpot(spotData);

        // Add to user spots locally (real-time subscription will update main spots)
        const newSpot: ParkingSpot = {
          ...spotData,
          id: spotId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setUserSpots((prev) => [newSpot, ...prev]);

        return spotId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Updates an existing parking spot
   */
  const updateSpot = useCallback(
    async (spotId: string, data: Partial<ParkingSpot>): Promise<void> => {
      try {
        await updateSpotInDb(spotId, data);

        // Update local state
        const updateLocalSpots = (spots: ParkingSpot[]) =>
          spots.map((spot) =>
            spot.id === spotId ? { ...spot, ...data, updatedAt: new Date() } : spot
          );

        setSpots(updateLocalSpots);
        setUserSpots(updateLocalSpots);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Deletes a parking spot
   */
  const deleteSpot = useCallback(async (spotId: string): Promise<void> => {
    try {
      await deleteSpotFromDb(spotId);

      // Remove from local state
      const filterSpots = (spots: ParkingSpot[]) =>
        spots.filter((spot) => spot.id !== spotId);

      setSpots(filterSpots);
      setUserSpots(filterSpots);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Gets a parking spot by ID from local state
   */
  const getSpotById = useCallback(
    (spotId: string): ParkingSpot | undefined => {
      return spots.find((spot) => spot.id === spotId);
    },
    [spots]
  );

  const value: ParkingSpotsContextType = {
    spots,
    userSpots,
    isLoading,
    error,
    fetchSpots,
    fetchUserSpots,
    addSpot,
    updateSpot,
    deleteSpot,
    getSpotById,
  };

  return (
    <ParkingSpotsContext.Provider value={value}>
      {children}
    </ParkingSpotsContext.Provider>
  );
};

/**
 * Hook to access parking spots context
 * Must be used within ParkingSpotsProvider
 */
export const useParkingSpots = (): ParkingSpotsContextType => {
  const context = useContext(ParkingSpotsContext);

  if (context === undefined) {
    throw new Error('useParkingSpots must be used within a ParkingSpotsProvider');
  }

  return context;
};

export default ParkingSpotsContext;
