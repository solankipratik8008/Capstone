/**
 * Firebase Services Export
 * Central export point for all Firebase-related services
 */

// Configuration
export { app, auth, db, storage } from './config';

// Authentication services
export {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  resetPassword,
  getUserData,
  updateUserData,
  subscribeToAuthState,
  getCurrentFirebaseUser,
} from './auth';

// Parking spots services
export {
  getAllParkingSpots,
  getUserParkingSpots,
  getParkingSpotById,
  createParkingSpot,
  updateParkingSpot,
  deleteParkingSpot,
  searchParkingSpotsNearby,
  subscribeToSpots,
  calculateDistance,
} from './parkingSpots';

// Storage services
export {
  uploadImage,
  uploadParkingSpotImages,
  uploadProfileImage,
  deleteImage,
  deleteParkingSpotImages,
  generateUniqueFilename,
} from './storage';
