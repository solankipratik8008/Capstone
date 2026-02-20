/**
 * Firebase Configuration
 *
 * IMPORTANT: Replace the placeholder values below with your actual Firebase config.
 * You can find these values in your Firebase Console:
 * 1. Go to https://console.firebase.google.com
 * 2. Select your project (or create a new one)
 * 3. Click the gear icon (Settings) > Project settings
 * 4. Scroll down to "Your apps" and click the web icon (</>)
 * 5. Register your app and copy the config values
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import 'firebase/auth'; // Ensure Auth SDK is registered
// @ts-ignore - React Native persistence import
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object
// TODO: Replace with your actual Firebase configuration
import { firebaseConfig } from '../../../config';

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);

  // Initialize Auth with React Native persistence
  try {
    console.log('Initializing Firebase Auth with Persistence...');
    console.log('AsyncStorage check:', !!AsyncStorage);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase Auth initialized successfully');
  } catch (error: any) {
    console.error('Error initializing Firebase Auth:', error);
    console.log('Falling back to default getAuth (no persistence)...');
    auth = getAuth(app);
  }

  // Initialize Firestore with experimental long polling for reliable connection in Expo
  // Using memory cache to avoid issues with corrupt persistence
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache(),
  });
  console.log('Firebase Config: Firestore initialized with long polling and memory cache');

  // Initialize Storage
  storage = getStorage(app);
} else {
  // Use existing app instance
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

/**
 * Firebase Setup Instructions:
 *
 * 1. Create a Firebase project at https://console.firebase.google.com
 *
 * 2. Enable Authentication:
 *    - Go to Authentication > Sign-in method
 *    - Enable Email/Password provider
 *
 * 3. Create Firestore Database:
 *    - Go to Firestore Database
 *    - Click "Create database"
 *    - Choose production or test mode
 *    - Select a location
 *
 * 4. Set up Firestore Security Rules:
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        // Users collection
 *        match /users/{userId} {
 *          allow read: if request.auth != null;
 *          allow write: if request.auth != null && request.auth.uid == userId;
 *        }
 *
 *        // Parking spots collection
 *        match /parkingSpots/{spotId} {
 *          allow read: if true;
 *          allow create: if request.auth != null;
 *          allow update, delete: if request.auth != null &&
 *            resource.data.ownerId == request.auth.uid;
 *        }
 *      }
 *    }
 *
 * 5. Enable Cloud Storage:
 *    - Go to Storage
 *    - Click "Get started"
 *    - Set up security rules
 *
 * 6. Storage Security Rules:
 *    rules_version = '2';
 *    service firebase.storage {
 *      match /b/{bucket}/o {
 *        match /parkingSpots/{allPaths=**} {
 *          allow read: if true;
 *          allow write: if request.auth != null;
 *        }
r *        match /users/{userId}/{allPaths=**} {
 *          allow read: if true;
 *          allow write: if request.auth != null && request.auth.uid == userId;
 *        }
 *      }
 *    }
 */
