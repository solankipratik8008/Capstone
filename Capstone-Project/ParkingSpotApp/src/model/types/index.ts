/**
 * Central export for all constants
 */

export * from './theme';
export * from './types';

// App-wide constants
export const APP_NAME = 'ParkSpot';
export const APP_VERSION = '1.0.0';

// Map constants
export const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const MAP_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// Search radius options (in kilometers)
export const DISTANCE_OPTIONS = [1, 2, 5, 10, 25, 50];

// Price filter options
export const PRICE_RANGES = [
  { label: 'Under $5/hr', min: 0, max: 5 },
  { label: '$5-$10/hr', min: 5, max: 10 },
  { label: '$10-$20/hr', min: 10, max: 20 },
  { label: 'Over $20/hr', min: 20, max: Infinity },
];

// Spot type labels for display
export const SPOT_TYPE_LABELS: Record<string, string> = {
  driveway: 'Driveway',
  garage: 'Garage',
  carport: 'Carport',
  street: 'Street Parking',
  lot: 'Parking Lot',
  other: 'Other',
};

// Amenity labels for display
export const AMENITY_LABELS: Record<string, string> = {
  covered: 'Covered',
  gated: 'Gated',
  well_lit: 'Well Lit',
  security_camera: 'Security Camera',
  ev_charging: 'EV Charging',
  handicap_accessible: 'Handicap Accessible',
  wide_space: 'Wide Space',
  nearby_restroom: 'Nearby Restroom',
};

// Validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_PRICE: 0.5,
  MAX_PRICE: 100,
  MAX_IMAGES: 5,
};

// Firebase collection names
export const COLLECTIONS = {
  USERS: 'users',
  PARKING_SPOTS: 'parkingSpots',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
};
