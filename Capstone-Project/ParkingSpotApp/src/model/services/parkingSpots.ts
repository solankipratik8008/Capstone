/**
 * Firebase Firestore Service for Parking Spots
 * Handles CRUD operations for parking spot data
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { ParkingSpot, Location, COLLECTIONS } from '../../constants';

/**
 * Converts Firestore document to ParkingSpot object
 */
const convertDocToSpot = (docId: string, data: any): ParkingSpot => {
  return {
    id: docId,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    title: data.title,
    description: data.description,
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      address: data.location.address,
      city: data.location.city,
      state: data.location.state,
      zipCode: data.location.zipCode,
    },
    pricePerHour: data.pricePerHour,
    pricePerDay: data.pricePerDay,
    imageURLs: data.imageURLs || [],
    isAvailable: data.isAvailable ?? true,
    availabilitySchedule: data.availabilitySchedule,
    spotType: data.spotType,
    amenities: data.amenities || [],
    rating: data.rating,
    reviewCount: data.reviewCount,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

/**
 * Fetches all available parking spots
 * Simplified query to avoid requiring composite indexes
 */
export const getAllParkingSpots = async (): Promise<ParkingSpot[]> => {
  try {
    const spotsRef = collection(db, COLLECTIONS.PARKING_SPOTS);
    // Simple query without composite index requirement
    const snapshot = await getDocs(spotsRef);

    // Filter and sort client-side to avoid index requirement
    const spots = snapshot.docs
      .map((doc) => convertDocToSpot(doc.id, doc.data()))
      .filter((spot) => spot.isAvailable)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return spots;
  } catch (error) {
    console.error('Error fetching parking spots:', error);
    throw new Error('Failed to fetch parking spots');
  }
};

/**
 * Fetches parking spots owned by a specific user
 * Simplified query to avoid requiring composite indexes
 */
export const getUserParkingSpots = async (userId: string): Promise<ParkingSpot[]> => {
  try {
    const spotsRef = collection(db, COLLECTIONS.PARKING_SPOTS);
    const q = query(spotsRef, where('ownerId', '==', userId));

    const snapshot = await getDocs(q);
    // Sort client-side to avoid index requirement
    return snapshot.docs
      .map((doc) => convertDocToSpot(doc.id, doc.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching user parking spots:', error);
    throw new Error('Failed to fetch your parking spots');
  }
};

/**
 * Fetches a single parking spot by ID
 */
export const getParkingSpotById = async (spotId: string): Promise<ParkingSpot | null> => {
  try {
    const spotRef = doc(db, COLLECTIONS.PARKING_SPOTS, spotId);
    const spotDoc = await getDoc(spotRef);

    if (!spotDoc.exists()) {
      return null;
    }

    return convertDocToSpot(spotDoc.id, spotDoc.data());
  } catch (error) {
    console.error('Error fetching parking spot:', error);
    throw new Error('Failed to fetch parking spot details');
  }
};

/**
 * Creates a new parking spot
 */
export const createParkingSpot = async (
  spotData: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const spotsRef = collection(db, COLLECTIONS.PARKING_SPOTS);

    const docData = {
      ...spotData,
      location: {
        latitude: spotData.location.latitude,
        longitude: spotData.location.longitude,
        address: spotData.location.address || '',
        city: spotData.location.city || '',
        state: spotData.location.state || '',
        zipCode: spotData.location.zipCode || '',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(spotsRef, docData);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating parking spot:', error);
    // Surface the real Firebase error so the user/developer can diagnose it
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: Check your Firestore security rules in Firebase Console.');
    }
    throw new Error(error.message || 'Failed to create parking spot');
  }
};

/**
 * Updates an existing parking spot
 */
export const updateParkingSpot = async (
  spotId: string,
  data: Partial<ParkingSpot>
): Promise<void> => {
  try {
    const spotRef = doc(db, COLLECTIONS.PARKING_SPOTS, spotId);

    // Remove id, createdAt from update data
    const { id, createdAt, ...updateData } = data as any;

    await updateDoc(spotRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating parking spot:', error);
    throw new Error('Failed to update parking spot');
  }
};

/**
 * Deletes a parking spot
 */
export const deleteParkingSpot = async (spotId: string): Promise<void> => {
  try {
    const spotRef = doc(db, COLLECTIONS.PARKING_SPOTS, spotId);
    await deleteDoc(spotRef);
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    throw new Error('Failed to delete parking spot');
  }
};

/**
 * Searches for parking spots within a radius (basic implementation)
 * For production, consider using Geofirestore or Firebase GeoQueries
 */
export const searchParkingSpotsNearby = async (
  center: Location,
  radiusKm: number,
  maxPrice?: number
): Promise<ParkingSpot[]> => {
  try {
    // Fetch all available spots and filter client-side
    // For production, use proper geo-queries
    const allSpots = await getAllParkingSpots();

    return allSpots.filter((spot) => {
      const distance = calculateDistance(
        center.latitude,
        center.longitude,
        spot.location.latitude,
        spot.location.longitude
      );

      const withinRadius = distance <= radiusKm;
      const withinPrice = maxPrice ? spot.pricePerHour <= maxPrice : true;

      return withinRadius && withinPrice;
    });
  } catch (error) {
    console.error('Error searching parking spots:', error);
    throw new Error('Failed to search parking spots');
  }
};

/**
 * Subscribe to real-time updates for all parking spots
 * Simplified query to avoid requiring composite indexes
 */
export const subscribeToSpots = (
  onUpdate: (spots: ParkingSpot[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const spotsRef = collection(db, COLLECTIONS.PARKING_SPOTS);

  return onSnapshot(
    spotsRef,
    (snapshot) => {
      // Filter and sort client-side to avoid index requirement
      const spots = snapshot.docs
        .map((doc) => convertDocToSpot(doc.id, doc.data()))
        .filter((spot) => spot.isAvailable)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onUpdate(spots);
    },
    (error) => {
      console.error('Snapshot error:', error);
      onError(new Error('Failed to sync parking spots'));
    }
  );
};

/**
 * Calculates distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
