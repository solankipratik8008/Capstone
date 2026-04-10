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
  OAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { AppleSignInParams, User, UserRole, COLLECTIONS } from '../../constants';

/**
 * Creates a new user account with email and password
 * Also creates a user document in Firestore
 */
/**
 * Normalises a phone number to E.164 format (+1XXXXXXXXXX).
 * Strips spaces, dashes, parentheses, and ensures a leading "+".
 */
const normalisePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+')) {
    return '+' + digits;
  }
  // Fallback: assume North-American number if 10 digits, else leave bare digits
  return digits.length === 10 ? '+1' + digits : '+' + digits;
};

export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone?: string,
): Promise<User> => {
  let firebaseUser = null;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: name });

    // Normalise phone to E.164 so getUserByPhone always matches
    const normalisedPhone = phone ? normalisePhone(phone) : undefined;

    const userData: Omit<User, 'uid'> = {
      email,
      name,
      role,
      ...(normalisedPhone ? { phone: normalisedPhone } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { uid: firebaseUser.uid, ...userData };
  } catch (error: any) {
    console.error('Sign up error:', error);
    if (firebaseUser && error.message?.includes('Firestore')) {
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
 * Signs in with Google token.
 * Accepts either an ID token (native builds) or an access token (Expo Go / expo-auth-session).
 * Pass the id token as the first arg; pass the access token as the second if no id token available.
 */
export const signInWithGoogle = async (
  idToken: string,
  accessToken?: string,
  role: UserRole = UserRole.USER
): Promise<User> => {
  try {
    if (!idToken && !accessToken) {
      throw new Error('No Google token received.');
    }

    // GoogleAuthProvider.credential(idToken, accessToken) — either can be null
    const credential = GoogleAuthProvider.credential(idToken || null, accessToken ?? null);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    let userData = await getUserData(firebaseUser.uid);

    // If user document doesn't exist in Firestore, create it
    if (!userData) {
      console.log('User document not found in Firestore, creating from Google Auth data...');

      const newUserData: Omit<User, 'uid'> = {
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'User',
        role,
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
 * Signs in with Apple identity token (from expo-apple-authentication)
 * rawNonce must be the ORIGINAL (unhashed) nonce used when requesting Apple auth.
 */
export const signInWithApple = async (
  params: AppleSignInParams
): Promise<User> => {
  const {
    identityToken,
    nonce: rawNonce,
    email,
    name,
    role = UserRole.USER,
  } = params;

  try {
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken, rawNonce });
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;
    const resolvedName = firebaseUser.displayName || name || 'Apple User';
    const resolvedEmail = firebaseUser.email || email || '';

    if (name && firebaseUser.displayName !== name) {
      await updateProfile(firebaseUser, { displayName: name });
    }

    let userData = await getUserData(firebaseUser.uid);

    if (!userData) {
      const newUserData: Omit<User, 'uid'> = {
        email: resolvedEmail,
        name: resolvedName,
        role,
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        ...newUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      userData = { uid: firebaseUser.uid, ...newUserData };
    } else {
      const userUpdates: Partial<User> = {};

      if (!userData.email && resolvedEmail) {
        userUpdates.email = resolvedEmail;
      }

      if ((!userData.name || userData.name === 'Apple User') && resolvedName) {
        userUpdates.name = resolvedName;
      }

      if (Object.keys(userUpdates).length > 0) {
        await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
          ...userUpdates,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        userData = {
          ...userData,
          ...userUpdates,
          updatedAt: new Date(),
        };
      }
    }

    return userData;
  } catch (error: any) {
    console.error('Apple sign in error:', error);

    if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
      throw new Error(
        'Apple Sign-In is not enabled in Firebase. Enable the Apple provider in Firebase Authentication and add the Apple Service ID, Team ID, Key ID, and private key.',
      );
    }

    if (error.code === 'auth/missing-or-invalid-nonce') {
      throw new Error(
        'Apple Sign-In could not be verified. Rebuild the iOS app after updating Apple Sign-In settings so the secure nonce matches Firebase.',
      );
    }

    if (error.code === 'auth/invalid-credential') {
      throw new Error(
        'Apple Sign-In credentials were rejected by Firebase. Confirm the Apple provider is enabled in Firebase and use a real iPhone or iPad running an Expo development build.',
      );
    }

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
 * Looks up a user document in Firestore by phone number.
 * Used by the phone-based password reset flow.
 */
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  try {
    // Build a set of candidate formats to search so we match regardless of
    // how the phone was stored (with or without leading "+").
    const digits = phone.replace(/\D/g, '');
    const candidates = Array.from(new Set([
      phone,               // as-is: e.g. +15483848008
      '+' + digits,        // normalised E.164
      digits,              // bare digits
    ]));

    for (const candidate of candidates) {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('phone', '==', candidate),
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          photoURL: data.photoURL,
          phone: data.phone,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error looking up user by phone:', error);
    return null;
  }
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
