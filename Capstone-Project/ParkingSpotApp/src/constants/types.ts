/**
 * TypeScript type definitions for the Parking Spot Rental App
 * Defines interfaces for users, parking spots, and app state
 */

// User role enum - determines what features are available
export enum UserRole {
  USER = 'user',
  HOMEOWNER = 'homeowner',
}

// User interface - stored in Firestore 'users' collection
export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Location interface for parking spot coordinates
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// Availability schedule for parking spots
export interface AvailabilitySchedule {
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  wednesday: { start: string; end: string; available: boolean };
  thursday: { start: string; end: string; available: boolean };
  friday: { start: string; end: string; available: boolean };
  saturday: { start: string; end: string; available: boolean };
  sunday: { start: string; end: string; available: boolean };
}

// Parking spot interface - stored in Firestore 'parkingSpots' collection
export interface ParkingSpot {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  location: Location;
  pricePerHour: number;
  pricePerDay?: number | null;
  imageURLs: string[];
  isAvailable: boolean;
  availabilitySchedule?: AvailabilitySchedule;
  spotType: SpotType;
  amenities: Amenity[];
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Types of parking spots available
export enum SpotType {
  DRIVEWAY = 'driveway',
  GARAGE = 'garage',
  CARPORT = 'carport',
  STREET = 'street',
  LOT = 'lot',
  OTHER = 'other',
}

// Amenities that can be associated with a parking spot
export enum Amenity {
  COVERED = 'covered',
  GATED = 'gated',
  WELL_LIT = 'well_lit',
  SECURITY_CAMERA = 'security_camera',
  EV_CHARGING = 'ev_charging',
  HANDICAP_ACCESSIBLE = 'handicap_accessible',
  WIDE_SPACE = 'wide_space',
  NEARBY_RESTROOM = 'nearby_restroom',
}

// Booking interface
export interface Booking {
  id: string;
  spotId: string;
  spotTitle: string;
  spotAddress: string;
  userId: string;
  userName: string;
  userEmail?: string;
  ownerId: string;
  startTime: Date;
  endTime: Date;
  hours: number;
  totalAmount: number;
  status: BookingStatus;
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed';
  createdAt: Date;
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Message interface - stored in Firestore 'chats/{chatId}/messages' subcollection
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
  read: boolean;
}

// Chat interface - stored in Firestore 'chats' collection
export interface Chat {
  id: string;
  participants: string[];
  participantNames: { [uid: string]: string };
  participantPhotos?: { [uid: string]: string };
  lastMessage: string;
  lastMessageTime: Date;
  spotId: string;
  spotTitle: string;
  createdAt: Date;
  unreadCount?: { [uid: string]: number };
}

// Search/filter parameters
export interface SearchFilters {
  maxDistance?: number; // in kilometers
  minPrice?: number;
  maxPrice?: number;
  spotTypes?: SpotType[];
  amenities?: Amenity[];
  availableNow?: boolean;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  MapTab: undefined;
  SearchTab: undefined;
  AddSpotTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string; otherUserName: string; spotTitle: string };
};

export type BookingStackParamList = {
  Booking: { spotId: string; spotTitle: string; pricePerHour: number; ownerId: string; isPaidLot?: boolean; placeAddress?: string };
};

export type MapStackParamList = {
  Map: undefined;
  SpotDetails: { spotId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MySpots: undefined;
  AddSpot: { spotId?: string };
  SpotDetails: { spotId: string };
};

export interface AppleSignInParams {
  identityToken: string;
  nonce: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken?: string, accessToken?: string, role?: UserRole) => Promise<void>;
  signInWithApple: (params: AppleSignInParams) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

// Parking spots context types
export interface ParkingSpotsContextType {
  spots: ParkingSpot[];
  userSpots: ParkingSpot[];
  isLoading: boolean;
  error: string | null;
  fetchSpots: () => Promise<void>;
  fetchUserSpots: (userId: string) => Promise<void>;
  addSpot: (spot: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSpot: (spotId: string, data: Partial<ParkingSpot>) => Promise<void>;
  deleteSpot: (spotId: string) => Promise<void>;
  getSpotById: (spotId: string) => ParkingSpot | undefined;
}

// Location context types
export interface LocationContextType {
  userLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Location | null>;
  calculateDistance: (spot: Location) => number | null;
}

// Form values for parking spot creation/editing
export interface ParkingSpotFormValues {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  pricePerHour: string;
  pricePerDay: string;
  spotType: SpotType;
  amenities: Amenity[];
  isAvailable: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
