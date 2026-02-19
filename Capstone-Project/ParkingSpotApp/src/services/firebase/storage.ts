/**
 * Firebase Storage Service
 * Handles image uploads for parking spots and user profiles
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads an image to Firebase Storage
 * @param uri - Local URI of the image
 * @param path - Storage path (e.g., 'parkingSpots/spotId/image1.jpg')
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, path);

    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Storage upload denied: Check your Firebase Storage security rules in the Firebase Console.');
    }
    throw new Error(error.message || 'Failed to upload image');
  }
};

/**
 * Uploads multiple images for a parking spot
 * @param uris - Array of local image URIs
 * @param spotId - ID of the parking spot
 * @returns Array of download URLs
 */
export const uploadParkingSpotImages = async (
  uris: string[],
  spotId: string
): Promise<string[]> => {
  try {
    const uploadPromises = uris.map(async (uri, index) => {
      const timestamp = Date.now();
      const path = `parkingSpots/${spotId}/${timestamp}_${index}.jpg`;
      return uploadImage(uri, path);
    });

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading parking spot images:', error);
    throw new Error('Failed to upload images');
  }
};

/**
 * Uploads a user profile image
 * @param uri - Local URI of the image
 * @param userId - ID of the user
 * @returns Download URL of the uploaded image
 */
export const uploadProfileImage = async (
  uri: string,
  userId: string
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const path = `users/${userId}/profile_${timestamp}.jpg`;
    return uploadImage(uri, path);
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
};

/**
 * Deletes an image from Firebase Storage
 * @param url - Download URL of the image to delete
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - image might already be deleted
  }
};

/**
 * Deletes all images for a parking spot
 * @param spotId - ID of the parking spot
 */
export const deleteParkingSpotImages = async (spotId: string): Promise<void> => {
  try {
    const folderRef = ref(storage, `parkingSpots/${spotId}`);
    const listResult = await listAll(folderRef);

    const deletePromises = listResult.items.map((item) => deleteObject(item));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting parking spot images:', error);
    // Don't throw - folder might not exist
  }
};

/**
 * Generates a unique filename for uploads
 */
export const generateUniqueFilename = (extension: string = 'jpg'): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomString}.${extension}`;
};
