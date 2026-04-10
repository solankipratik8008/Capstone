/**
 * Firebase Firestore Service for Bookings
 * Handles booking creation and status management
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './config';
import { Booking, BookingStatus } from '../../constants';

const CLOUD_RUN_URL = 'https://parkspot-api-ccxrzypu3a-uc.a.run.app';

const BOOKINGS = 'bookings';

const convertDocToBooking = (docId: string, data: any): Booking => ({
  id: docId,
  spotId: data.spotId,
  spotTitle: data.spotTitle,
  spotAddress: data.spotAddress || '',
  userId: data.userId,
  userName: data.userName || 'Unknown User',
  userEmail: data.userEmail,
  ownerId: data.ownerId,
  startTime: data.startTime?.toDate() || new Date(),
  endTime: data.endTime?.toDate() || new Date(),
  hours: data.hours,
  totalAmount: data.totalAmount,
  status: data.status,
  paymentIntentId: data.paymentIntentId,
  paymentStatus: data.paymentStatus || 'pending',
  createdAt: data.createdAt?.toDate() || new Date(),
});

/**
 * Creates a new booking (call before payment)
 */
export const createBooking = async (
  bookingData: Omit<Booking, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const bookingsRef = collection(db, BOOKINGS);
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating booking:', error);
    throw new Error(error.message || 'Failed to create booking');
  }
};

/**
 * Updates booking status and paymentIntentId after payment
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
  paymentStatus: 'pending' | 'succeeded' | 'failed',
  paymentIntentId?: string
): Promise<void> => {
  try {
    const bookingRef = doc(db, BOOKINGS, bookingId);
    await updateDoc(bookingRef, {
      status,
      paymentStatus,
      ...(paymentIntentId ? { paymentIntentId } : {}),
    });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    throw new Error(error.message || 'Failed to update booking');
  }
};

/**
 * Fetches all bookings for a user (as renter)
 */
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const bookingsRef = collection(db, BOOKINGS);
    const q = query(bookingsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => convertDocToBooking(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
};

/**
 * Fetches all bookings for an owner's spots
 */
export const getOwnerBookings = async (ownerId: string): Promise<Booking[]> => {
  try {
    const bookingsRef = collection(db, BOOKINGS);
    const q = query(bookingsRef, where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => convertDocToBooking(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Error fetching owner bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
};

/**
 * Subscribe to real-time booking updates for a user
 */
export const subscribeToUserBookings = (
  userId: string,
  onUpdate: (bookings: Booking[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const bookingsRef = collection(db, BOOKINGS);
  const q = query(bookingsRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const bookings = snapshot.docs
        .map((d) => convertDocToBooking(d.id, d.data()))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onUpdate(bookings);
    },
    (error) => {
      console.error('Bookings snapshot error:', error);
      onError(new Error('Failed to load bookings'));
    }
  );
};

/**
 * Fetches active (confirmed/pending) bookings for a specific spot.
 * Used to check for time conflicts before new bookings.
 */
export const getSpotBookings = async (spotId: string): Promise<Booking[]> => {
  try {
    const bookingsRef = collection(db, BOOKINGS);
    const q = query(
      bookingsRef,
      where('spotId', '==', spotId),
      where('status', 'in', [BookingStatus.CONFIRMED, BookingStatus.PENDING])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => convertDocToBooking(d.id, d.data()));
  } catch (error: any) {
    console.error('Error fetching spot bookings:', error);
    return [];
  }
};

/**
 * Cancels a booking via Cloud Function.
 * Cloud Function handles Stripe refund if within 30 min of booking creation.
 * Returns { refunded: boolean, message: string }
 */
export const cancelBooking = async (
  bookingId: string
): Promise<{ refunded: boolean; message: string }> => {
  try {
    const idToken = await getAuth().currentUser?.getIdToken();
    const resp = await fetch(`${CLOUD_RUN_URL}/cancelBooking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ bookingId }),
    });
    const json = await resp.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    throw new Error(error.message || 'Failed to cancel booking');
  }
};
