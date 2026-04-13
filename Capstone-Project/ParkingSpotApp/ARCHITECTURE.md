# ParkSpot — MVC Architecture

## Folder Structure

```
src/
├── model/                   ← MODEL  (Data + Business Rules)
│   ├── types/               │   TypeScript interfaces & enums
│   │   └── types.ts         │   User, ParkingSpot, Booking, Chat, Message
│   └── services/            │   Firebase CRUD — pure data functions
│       ├── auth.ts          │   signUp, signIn, signOut, resetPassword, getUserByPhone
│       ├── parkingSpots.ts  │   addSpot, updateSpot, deleteSpot, fetchSpots
│       ├── config.ts        │   Firebase app initialisation
│       └── storage.ts       │   Firebase Storage — image upload
│
├── view/                    ← VIEW  (UI Only — no business logic)
│   ├── screens/             │   Full-screen components
│   │   ├── Auth/            │   SignIn, SignUp, ForgotPassword, OTP
│   │   ├── Home/            │   HomeMapScreen (Google Maps + markers)
│   │   ├── Booking/         │   BookingScreen, ParkingPass, GateScanner
│   │   ├── Chat/            │   ChatList, ChatScreen
│   │   ├── Profile/         │   Profile, EditProfile, MyBookings, MySpots
│   │   └── ParkingSpot/     │   SpotDetails, AddSpot
│   └── components/          │   Reusable UI building blocks
│       ├── common/          │   Button, Input, Card, Avatar, Badge, Loading
│       ├── maps/            │   ParkingMarker, PlacesMarker, SpotPreviewCard
│       └── parking/         │   ParkingSpotCard
│
└── controller/              ← CONTROLLER  (Business Logic + State)
    ├── context/             │   React Context — global state management
    │   ├── AuthContext      │   Authentication state & actions
    │   ├── ParkingSpotsContext │ Spots state & CRUD actions
    │   └── LocationContext  │   GPS location state
    ├── navigation/          │   Screen routing & stack definitions
    │   ├── RootNavigator    │   Auth vs Main branch
    │   ├── AuthNavigator    │   SignIn → SignUp → ForgotPassword
    │   └── MainTabNavigator │   Map | Search | Add | Chat | Profile
    └── utils/               │   Helper functions (formatters, validators)
```

---

## MVC Data Flow

```
User Action (View)
      │
      ▼
Controller (Context / Hook)
  ├── Validates input
  ├── Calls Model service
  └── Updates global state
      │
      ▼
Model (Firebase Service)
  ├── Reads / Writes Firestore
  ├── Handles Firebase Auth
  └── Returns typed data
      │
      ▼
Controller receives response
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
| Google Places API | Public parking discovery without manual entry |
| `useAppTheme()` everywhere | Single source of truth for light/dark colours |
| E.164 phone format | Consistent storage/lookup across all auth flows |

---

## External Services

```
App ──► Firebase Auth          (Email, Google, Apple, Phone OTP)
App ──► Firestore              (Users, ParkingSpots, Bookings, Chats)
App ──► Firebase Storage       (Spot photos, Profile photos)
App ──► Google Maps SDK        (Map rendering)
App ──► Google Places API      (Nearby public parking, address search)
App ──► Stripe (Cloud Run)     (Payment processing)
```
