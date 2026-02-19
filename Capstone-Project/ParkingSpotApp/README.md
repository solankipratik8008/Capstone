# ParkSpot - Location-Based Parking Spot Rental App

A cross-platform React Native mobile app that allows homeowners to list their parking spots and users to find nearby parking spots on a map.

## Features

### User Roles
- **Homeowner**: Can add, edit, and manage parking spots
- **User**: Can view available parking spots, details, and search by location

### Core Features
- 🔐 User Authentication (Sign up, Sign in, Forgot Password)
- 🗺️ Google Maps integration showing parking spots as pins
- ➕ Add/Update/Delete parking spots (for homeowners)
- 📋 View parking spot details (price, availability, address, photo)
- 🔍 Real-time search and filter by distance or price
- 📱 Responsive design for both Android & iOS

## Tech Stack

- **Framework**: React Native with Expo
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Cloud Storage
- **Maps**: react-native-maps with Google Maps
- **Navigation**: React Navigation
- **Forms**: Formik + Yup
- **State Management**: Context API

## Project Structure

```
ParkingSpotApp/
├── App.tsx                 # Main entry point
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Button, Input, Card, Loading, etc.
│   │   ├── maps/           # Map markers and overlays
│   │   └── parking/        # Parking spot specific components
│   ├── constants/          # Theme, types, and constants
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ParkingSpotsContext.tsx
│   │   └── LocationContext.tsx
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # App screens
│   │   ├── Auth/           # SignIn, SignUp, ForgotPassword
│   │   ├── Home/           # Home Map screen
│   │   ├── ParkingSpot/    # Spot details, Add/Edit
│   │   ├── Profile/        # User profile screens
│   │   └── Search/         # Search and filter screen
│   ├── services/           # Firebase services
│   │   └── firebase/       # Auth, Firestore, Storage
│   └── utils/              # Utility functions
└── assets/                 # Images and fonts
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- Google Cloud Platform account (for Maps API)

### 1. Clone and Install

```bash
cd ParkingSpotApp
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider

3. Create Firestore Database:
   - Go to Firestore Database > Create database
   - Start in test mode or production mode
   - Choose a location

4. Set up Cloud Storage:
   - Go to Storage > Get started

5. Get your Firebase config:
   - Go to Project Settings > Your apps
   - Add a Web app
   - Copy the config object

6. Update Firebase config:
   - Open `src/services/firebase/config.ts`
   - Replace the placeholder values with your Firebase config

### 3. Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)

2. Create a new project or select existing

3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API (optional)

4. Create API credentials:
   - Go to Credentials > Create Credentials > API Key
   - Restrict the key to your apps

5. Update app.json:
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your API key in both iOS and Android sections

### 4. Firestore Security Rules

Add these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Parking spots collection
    match /parkingSpots/{spotId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;
    }
  }
}
```

### 5. Storage Security Rules

Add these security rules to your Cloud Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /parkingSpots/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Run the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Database Schema

### Users Collection (`users`)
```typescript
{
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'homeowner';
  photoURL?: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Parking Spots Collection (`parkingSpots`)
```typescript
{
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  pricePerHour: number;
  pricePerDay?: number;
  imageURLs: string[];
  isAvailable: boolean;
  spotType: 'driveway' | 'garage' | 'carport' | 'street' | 'lot' | 'other';
  amenities: string[];
  rating?: number;
  reviewCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## App Screens

| Screen | Description |
|--------|-------------|
| Sign In | Email/password authentication |
| Sign Up | Create new account with role selection |
| Forgot Password | Password reset via email |
| Home Map | Interactive map with parking spot markers |
| Spot Details | Detailed view of a parking spot |
| Add/Edit Spot | Form to create or modify parking spots |
| Search | Search and filter parking spots |
| Profile | User information and settings |
| My Spots | List of user's parking spots (homeowners) |

## Key Components

- **Button**: Customizable button with variants (primary, secondary, outline, text)
- **Input**: Text input with validation, icons, and password visibility toggle
- **Card**: Elevated card container
- **Avatar**: User profile picture with fallback initials
- **Badge/Chip**: Status indicators and selectable tags
- **ParkingSpotCard**: Displays parking spot summary
- **ParkingMarker**: Custom map marker for parking spots

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details
