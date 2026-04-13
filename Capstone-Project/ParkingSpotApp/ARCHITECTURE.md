# ParkSpot — MVC Architecture

## Folder Structure (actual source of truth)

```
src/
├── constants/               ← MODEL — Types & static data
│   ├── types.ts             │   User, ParkingSpot, Booking, Chat, Message (interfaces)
│   ├── theme.ts             │   Colour palette, spacing, typography tokens
│   └── index.ts             │   Barrel export
│
├── services/                ← MODEL — Data access (Firebase CRUD)
│   ├── firebase/
│   │   ├── config.ts        │   Firebase app initialisation
│   │   ├── auth.ts          │   signUp, signIn, signOut, getUserByPhone
│   │   ├── parkingSpots.ts  │   addSpot, updateSpot, deleteSpot, fetchSpots
│   │   ├── bookings.ts      │   createBooking, getUserBookings
│   │   ├── chat.ts          │   sendMessage, subscribeToMessages
│   │   └── storage.ts       │   uploadProfileImage, uploadSpotImages
│   └── places.ts            │   Google Places API — fetchNearbyParking, searchPlacesByText
│
├── context/                 ← CONTROLLER — Global state & business logic
│   ├── AuthContext.tsx      │   Auth state, login/logout/updateProfile actions
│   ├── ParkingSpotsContext.tsx │  Spots list, CRUD actions
│   └── LocationContext.tsx  │   GPS position state
│
├── navigation/              ← CONTROLLER — Screen routing
│   ├── RootNavigator.tsx    │   Auth branch vs Main branch
│   ├── AuthNavigator.tsx    │   SignIn → SignUp → ForgotPassword → OTP
│   ├── MainTabNavigator.tsx │   Map | Search | Add | Chat | Profile tabs
│   ├── MapStackNavigator.tsx
│   ├── ChatStackNavigator.tsx
│   └── ProfileStackNavigator.tsx
│
├── screens/                 ← VIEW — Full-screen UI
│   ├── Auth/
│   │   ├── SignInScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   └── OtpVerificationScreen.tsx
│   ├── Home/
│   │   └── HomeMapScreen.tsx        ← Google Maps + markers + preview card
│   ├── Booking/
│   │   ├── BookingScreen.tsx        ← Date/time picker, duration, pay button
│   │   ├── ParkingPassScreen.tsx    ← QR code pass
│   │   └── GateScannerScreen.tsx
│   ├── Chat/
│   │   ├── ChatListScreen.tsx
│   │   └── ChatScreen.tsx           ← Real-time Firestore messaging
│   ├── ParkingSpot/
│   │   ├── AddSpotScreen.tsx        ← Homeowner: list a spot
│   │   └── SpotDetailsScreen.tsx
│   └── Profile/
│       ├── ProfileScreen.tsx
│       ├── EditProfileScreen.tsx
│       ├── MyBookingsScreen.tsx
│       ├── MySpotsScreen.tsx
│       └── OwnerBookingsScreen.tsx
│
├── components/              ← VIEW — Reusable UI building blocks
│   ├── common/              │   Button, Input, Card, Avatar, Badge, Loading
│   ├── maps/                │   ParkingMarker, PlacesMarker, SpotPreviewCard
│   └── parking/             │   ParkingSpotCard
│
├── theme/
│   └── index.tsx            │   useAppTheme() hook — reactive light/dark colours
│
└── view/                    ← VIEW barrel exports (MVC entry points)
    ├── screens/index.ts     │   Re-exports all screens
    ├── components/index.ts  │   Re-exports all components
    └── index.ts             │   Top-level View entry point
```

---

## MVC Data Flow

```
User Action (View — screens/)
      │
      ▼
Controller (context/ — React Context)
  ├── Validates input
  ├── Calls Model service
  └── Updates global state via setState
      │
      ▼
Model (services/firebase/ — pure async functions)
  ├── Reads / Writes Firestore
  ├── Handles Firebase Auth
  └── Returns typed data (User, ParkingSpot, Booking…)
      │
      ▼
Controller receives response, updates state
      │
      ▼
View re-renders with new state
```

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Firebase Firestore | Real-time sync, no backend server needed |
| React Context (not Redux) | Simpler for 3 domains (Auth, Spots, Location) |
| Stripe Cloud Run | PCI-compliant payment — card data never touches app |
| Google Places API (New) v1 | Public parking discovery without manual entry |
| `useAppTheme()` everywhere | Single source of truth for light/dark colours — static COLORS breaks dark mode |
| E.164 phone format | Consistent storage/lookup across all auth flows (OTP, profile edit) |

---

## External Services

```
App ──► Firebase Auth          (Email/Password, Google SSO, Apple, Phone OTP)
App ──► Cloud Firestore        (Users, ParkingSpots, Bookings, Chats, Messages)
App ──► Firebase Storage       (Spot photos, Profile photos)
App ──► Google Maps SDK        (Map rendering, GPS)
App ──► Google Places API v1   (Nearby public parking, address autocomplete)
App ──► Stripe (Cloud Run)     (Payment intent creation — server-side)
```
