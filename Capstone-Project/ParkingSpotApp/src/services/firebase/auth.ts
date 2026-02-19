/**
 * Firebase Authentication Service
 * Handles user sign up, sign in, sign out, and password reset
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole, COLLECTIONS } from '../../constants';

/**
 * Creates a new user account with email and password
 * Also creates a user document in Firestore
 */
export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<User> => {
  let firebaseUser = null;

  try {
    // Create Firebase auth user
    console.log('Creating Firebase Auth user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = userCredential.user;
    console.log('Firebase Auth user created:', firebaseUser.uid);

    // Update display name
    await updateProfile(firebaseUser, { displayName: name });
    console.log('Display name updated');

    // Create user document in Firestore
    const userData: Omit<User, 'uid'> = {
      email,
      name,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Creating Firestore user document...');
    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Firestore user document created successfully');

    return {
      uid: firebaseUser.uid,
      ...userData,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    // If Firebase Auth user was created but Firestore failed, still return basic user data
    if (firebaseUser && error.message?.includes('Firestore')) {
      console.log('Firestore failed but Auth succeeded, returning basic user data');
      return {
        uid: firebaseUser.uid,
        email,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    throw handleAuthError(error);
  }
};

/**
 * Signs in an existing user with email and password
 * If user document doesn't exist in Firestore, creates it from Firebase Auth data
 */
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    let userData = await getUserData(firebaseUser.uid);

    // If user document doesn't exist in Firestore, create it from Firebase Auth data
    if (!userData) {
      console.log('User document not found in Firestore, creating from Auth data...');

      const newUserData: Omit<User, 'uid'> = {
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || email.split('@')[0],
        role: 'user' as UserRole, // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        ...newUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      userData = {
        uid: firebaseUser.uid,
        ...newUserData,
      };

      console.log('User document created successfully');
    }

    return userData;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Signs in with Google ID token
 */
export const signInWithGoogle = async (idToken: string): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    let userData = await getUserData(firebaseUser.uid);

    // If user document doesn't exist in Firestore, create it
    if (!userData) {
      console.log('User document not found in Firestore, creating from Google Auth data...');

      const newUserData: Omit<User, 'uid'> = {
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'User',
        role: 'user' as UserRole, // Default role
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        ...newUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      userData = {
        uid: firebaseUser.uid,
        ...newUserData,
      };

      console.log('User document created successfully');
    }

    return userData;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

/**
 * Sends a password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

/**
 * Gets user data from Firestore
 */
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      uid,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      photoURL: data.photoURL,
      phone: data.phone,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

/**
 * Updates user profile in Firestore
 * Uses setDoc with merge to handle cases where document might not exist
 */
export const updateUserData = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);

    // Use setDoc with merge option to create document if it doesn't exist
    // or update if it does - more robust than updateDoc
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('Profile updated successfully for user:', uid);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile: ' + error.message);
  }
};

/**
 * Subscribes to auth state changes
 */
export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Gets the current Firebase user
 */
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Handles Firebase auth errors and returns user-friendly messages
 */
const handleAuthError = (error: any): Error => {
  let message = 'An error occurred. Please try again.';

  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered. Please sign in instead.';
      break;
    case 'auth/invalid-email':
      message = 'Please enter a valid email address.';
      break;
    case 'auth/operation-not-allowed':
      message = 'Email/password accounts are not enabled.';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters.';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Please try again.';
      break;
    case 'auth/invalid-credential':
      message = 'Invalid email or password.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Please try again later.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your connection.';
      break;
    case 'auth/configuration-not-found':
      message = 'Sign-in method is disabled. Please enable "Email/Password" in Firebase Console.';
      break;
    default:
      message = error.message || message;
  }

  return new Error(message);
};
