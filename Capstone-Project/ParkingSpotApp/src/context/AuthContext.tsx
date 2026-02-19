/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  getUserData,
  updateUserData,
  subscribeToAuthState,
} from '../services/firebase';
import { User, UserRole, AuthContextType } from '../constants';

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component - wraps app to provide auth state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to auth state changes on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, fetch their data from Firestore
        try {
          const userData = await getUserData(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await firebaseSignIn(email, password);
      setUser(userData);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (idToken: string): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await firebaseSignInWithGoogle(idToken);
      setUser(userData);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Create a new account
   */
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await firebaseSignUp(email, password, name, role);
      setUser(userData);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseSignOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email: string): Promise<void> => {
    await firebaseResetPassword(email);
  };

  /**
   * Update user profile
   */
  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    await updateUserData(user.uid, data);

    // Update local state
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
