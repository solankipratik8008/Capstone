# ParkSpot App — MVC Architecture

This project follows the **Model-View-Controller (MVC)** design pattern, organized under `src/`.

```
src/
├── model/          ← DATA LAYER (Model)
│   ├── services/   ← Firebase auth, spots, storage services
│   ├── types/      ← TypeScript types, constants, enums
│   └── google.ts   ← Google Auth configuration
│
├── view/           ← UI LAYER (View)
│   ├── screens/    ← All app screens (Auth, Home, Search, ParkingSpot, Profile)
│   ├── components/ ← Reusable UI components (Button, Input, etc.)
│   └── assets/     ← Images and static files
│
└── controller/     ← LOGIC LAYER (Controller)
    ├── context/    ← React Context providers (Auth, Location, ParkingSpots)
    ├── navigation/ ← React Navigation routers and stacks
    └── utils/      ← Helper functions and utilities
```

## Layer Responsibilities

### 🗄️ Model (`src/model/`)
- Handles all **data operations** — reading/writing to Firebase Firestore
- Manages **user authentication** via Firebase Auth
- Stores all **TypeScript types**, **constants**, and **enums**
- Contains **Google Auth config** and **Firebase config**

### 🎨 View (`src/view/`)
- Contains all **UI screens** that users interact with
- Houses **reusable components** like Button, Input, Card
- Purely concerned with **how things look**, not how they work

### 🎮 Controller (`src/controller/`)
- **Context providers** act as the bridge between Model and View
- **Navigation** controls which screen is shown and when
- **Utils** provide helper functions used across the app

## Security
- **Never commit `.env` files** — use `.env.example` as a template
- All API keys should be stored in environment variables
- The `.gitignore` is already configured to block sensitive files

## Running the App
```bash
npx expo start
```
