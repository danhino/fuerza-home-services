# Fuerza Home Services

**Fuerza Home Services** is a production-quality on-demand platform built on React Native with a custom design token system (Colors, Typography, Spacing, Theme) providing full light/dark mode support. It connects customers with skilled technicians across 6 trade categories in real time. Think of it as an Uber-style experience for home repairs — customers request help, nearby technicians accept the job, and everything is tracked live on a map. Fully bilingual (English / Spanish).

---

## ✨ Features

### 📱 Mobile App (Customer)
- **Map-first experience with 6 trade categories**: Plumbing, Electrical, HVAC, Pool Service, House Cleaning, General Handyman
- **One-click issue tiles** per trade that pre-populate the description field
- **House Cleaning size-based pricing** (Small $125 → XL $325)
- **Multi-step service request wizard** (4 steps) with animated progress bar
- **Photo attachment with on-device compression** (800px, 0.6 quality)
- **Address autocompletion** via reverse geocoding ("Use my current location") or manual entry
- **Flat-rate estimate** shown before confirming (trade-specific rates)
- **Stripe PaymentSheet integration** for booking fee + service fee
- **Live job tracking map** with real-time technician location via Socket.io
- **Progress stepper**: Matched → En Route → Arrived → Working → Complete
- **Formal price renegotiation flow** with full audit trail on receipt
- **Post-job rating and receipt** with price change history

### 🔧 Mobile App (Technician)
- **Online/Offline toggle** with store-driven state (not optimistic)
- **Background location tracking** — `expo-task-manager` + `expo-location` emits GPS every 8s/20m via Socket.io with Android foreground service notification
- **Location permission gate** — cannot go online without granting background location access
- **Push notifications** — Firebase Admin SDK (HTTP v1) alerts for new job requests (bilingual EN/ES)
- **45-second countdown timer** on new job requests with auto-decline
- **Haversine distance calculation** from technician to job address
- **Trade-colored job cards** with "ES" badge for Spanish-speaking customers
- **useFocusEffect refresh** — dashboard always shows live data on focus
- **Accept flow** wires directly to active job card on dashboard
- **Stripe Connect Express** payout setup gate before going online
- **Change order support** — receive and respond to price adjustment proposals

### 🖥️ Admin Console (Web)
- **User management** — view all registered customers and technicians
- **Add users** — create new users directly from the dashboard
- **Edit users** — update name, email, phone, and role via a modal
- **Delete users** — remove users with cascading cleanup of linked profiles
- **System stats** — at-a-glance cards for total users, technicians, and customers

### 🎨 Design System
- **Production design tokens** — `Colors.ts` (50+ semantic tokens per theme, light/dark), `Typography.ts` (18 pre-composed styles), `Spacing.ts` (spacing scale, radii, shadows, z-index), `Theme.ts` (unified typed theme object)
- **10 reusable UI primitives** — `Button`, `TextInput`, `Card`, `Badge`, `Avatar`, `Divider`, `BottomSheet`, `StatusPill`, `SectionHeader`, `LoadingOverlay`
- **Theme hooks** — `useTheme()` for unified theme access, `useThemeColor()` for individual token access

### 🌐 Internationalization (i18n)
- **English / Spanish** — full UI localization across all screens (~240+ keys per language)
- **Language toggle** — switch languages on Login or Profile screens (🇺🇸 / 🇪🇸)
- **Persistence** — language saved locally (AsyncStorage) and synced to backend (`preferredLanguage` on User)
- **Technician awareness** — Spanish-speaking customer badge + alert for technicians

### 🔐 Authentication
- Register with email + phone number
- Login with email or phone as identifier
- Show/hide password toggle
- JWT-based token authentication
- Role-based access control (Customer, Technician, Admin)

### ⚡ Real-Time
- Socket.io powered WebSocket connections
- **Background location tracking** — technician GPS streamed via `location_update` events every 8 seconds
- Live technician location pins on customer map (with trade info, name, rating)
- Instant job status updates (Requested → Matched → En Route → Arrived → Working → Completed)
- New job alerts for technicians with Spanish-speaker detection

### 🔔 Push Notifications
- **Firebase Admin SDK** (HTTP v1) — NOT legacy expo-server-sdk
- Dual-mode: Expo push tokens → Expo API, raw FCM tokens → Firebase Admin
- **New job alerts** to online technicians (bilingual EN/ES with trade, address, price)
- **Job status alerts** to customers (Matched, En Route, Arrived, Completed)
- Tap notification → deep link to job-detail or tracking screen
- Fire-and-forget — failed pushes never break the main request flow

### 💳 Payments & Post-Job
- Payment processing service integration
- Receipt generation and email stub
- Customer review system (star rating + comments)
- **Change order system** — create, approve/decline price adjustments with full audit trail
- One pending change order per job guard (409 conflict)
- Job status validation — change orders only when MATCHED/EN_ROUTE/ARRIVED/WORKING
- Approved change orders auto-update job pricing via centralized `calculatePricing()`

### 💰 Centralized Pricing
- **Single source of truth** — `pricing.service.ts` with `calculatePricing()` and `getEstimateForTrade()`
- **Pricing model**: Customer pays service fee + $2.99 booking fee → Platform keeps $2.99 + 12% → Technician gets 88%
- **House Cleaning size-based pricing**: Small $125, Medium $175, Large $275, XL $325
- Flat rates per trade: Plumbing $140, Electrical $165, HVAC $200, Pool $120, Handyman $95

---

## � Trade Categories & Pricing
| Trade | Map Pin | Flat Rate | Issue Tiles |
|-------|---------|-----------|-------------|
| Plumbing | 🔵 Blue | $140 | Leak under sink, Replace toilet, Shower Shower lever broken, Clogged drain, Water heater |
| Electrical | 🟡 Yellow | $165 | Replace outlet, Ceiling fan, EV charger, Breaker, Light switch |
| HVAC | 🟣 Purple | $200 | Dirty filters, Not cooling, Water leak, Not heating, Not starting |
| Pool Service | 🩵 Teal | $120 | Pool cleaning, Filter, Pump, Stains, Algae, Cloudy water, Lights |
| House Cleaning | 🟢 Green | $125–$325 | Small, Medium, Large, XL (size-based) |
| General Handyman | 🟠 Orange | $95 | Furniture, TV mount, Drywall, Door lock, Caulking, Other |

---

## �📂 Project Structure

```
fuerza-home-services/
├── backend/                    # Node.js / Express API + WebSocket server
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (PostgreSQL)
│   ├── scripts/
│   │   ├── create-admin.ts     # Seed an admin user
│   │   ├── reset-admin-password.ts  # Reset admin password
│   │   └── user-stats.ts       # Print user statistics
│   └── src/
│       ├── controllers/        # Route handlers
│       │   ├── auth.controller.ts
│       │   ├── admin.controller.ts
│       │   ├── job.controller.ts
│       │   ├── triage.controller.ts
│       │   ├── review.controller.ts
│       │   ├── receipt.controller.ts
│       │   ├── changeOrder.controller.ts
│       │   └── user.controller.ts
│       ├── middleware/          # Auth + Admin middleware
│       ├── routes/             # Express route definitions
│       ├── services/           # Socket.io, Payment, Email, Firebase Push, Pricing services
│       ├── utils/              # Password hashing, JWT helpers
│       └── server.ts           # App entry point
│
├── mobile/                     # React Native (Expo) iOS/Android app
│   ├── app/
│   │   ├── (auth)/             # Login & Register screens
│   │   ├── (tabs)/             # Tab screens
│   │   │   ├── index.tsx       # Role-based dashboard switch
│   │   │   ├── request.tsx     # Multi-step service request wizard
│   │   │   ├── tracking.tsx    # Live map tracking & status updates
│   │   │   ├── jobs.tsx        # Technician job list
│   │   │   ├── receipt.tsx     # Post-job receipt & review
│   │   │   ├── estimate-change.tsx # Price renegotiation flow
│   │   │   ├── job-detail.tsx  # Enhanced details for active jobs
│   │   │   └── profile.tsx     # User profile & settings
│   └── src/
│       ├── components/
│       │   ├── ui/             # Reusable UI primitives (10 components)
│       │   │   ├── Button.tsx          # 4 variants, 3 sizes, loading state
│       │   │   ├── TextInput.tsx       # Label, error, focus ring, icon slots
│       │   │   ├── Card.tsx            # Surface card with shadow
│       │   │   ├── Badge.tsx           # 6 variants, 2 sizes
│       │   │   ├── Avatar.tsx          # Image + initials fallback
│       │   │   ├── Divider.tsx         # Hairline + optional label
│       │   │   ├── BottomSheet.tsx     # Drag-to-dismiss modal
│       │   │   ├── StatusPill.tsx      # 7 job statuses with icons
│       │   │   ├── SectionHeader.tsx   # Title + "See all" link
│       │   │   ├── LoadingOverlay.tsx  # Full-screen spinner
│       │   └── index.ts               # Barrel exports
│       ├── constants/                 # Design token system
│       │   ├── Colors.ts       # 50+ semantic tokens, light/dark themes
│       │   ├── Typography.ts   # 18 pre-composed text styles
│       │   ├── Spacing.ts      # Scale, radii, shadows, z-index
│       │   ├── Theme.ts        # Unified typed theme object
│       │   └── Config.ts       # API URL configuration
│       ├── hooks/
│       │   ├── useTheme.ts     # Unified theme hook
│       │   └── useThemeColor.ts
│       ├── i18n/               # Translation files (en.ts, es.ts) + language store
│       ├── services/           # Axios API, Socket, Push Notifications, Location Tracking
│       └── store/              # Zustand stores
│           ├── useAuthStore.ts
│           ├── useJobStore.ts
│           ├── useLocationStore.ts
│           ├── useMapStore.ts      # Technician pins, trade filters
│           ├── useTechnicianStore.ts
│           ├── useThemeStore.ts
│           └── useTriageStore.ts
│
└── web/                        # React (Vite) Admin Dashboard
    └── src/
        ├── pages/              # Login, Dashboard
        ├── services/           # Axios API client
        └── store/              # Zustand auth store
```

---

## 🛠️ Tech Stack

| Layer        | Technology                                        |
|--------------|---------------------------------------------------|
| **Mobile**   | React Native, Expo, Expo Router, Axios            |
| **State**    | Zustand (useAuth, useJob, useMap, useLocation, useLanguage, useTechnician) |
| **Design**   | Custom token system (Colors, Typography, Spacing, Theme, useTheme hook) |
| **Maps**     | react-native-maps with 6 trade-colored custom pins, expo-location |
| **Payments** | Stripe PaymentSheet (customer) + Stripe Connect Express (technician payouts) |
| **Photos**   | expo-image-picker, expo-image-manipulator          |
| **i18n**     | Custom Zustand store + AsyncStorage persistence   |
| **Push**     | Firebase Admin SDK (HTTP v1) + expo-notifications  |
| **Location** | expo-location + expo-task-manager (background GPS) |
| **Real-time**| Socket.io (server) + socket.io-client (mobile)    |
| **Backend**  | Node.js, Express, TypeScript                      |
| **Database** | PostgreSQL + Prisma ORM                           |
| **Auth**     | JWT (jsonwebtoken) + bcryptjs                     |
| **Admin Web**| React, Vite, TypeScript, Zustand, Lucide Icons    |

---

## 🏗️ Architecture
The home tab renders a role-specific dashboard based on user.role from 
useAuthStore. CUSTOMER renders HomeownerDashboard (map-first, 6 trade 
categories, live technician pins). TECHNICIAN renders 
TechnicianMainDashboard (online/offline toggle, job queue, earnings 
summary). Both components are self-contained — all data comes from 
Zustand stores, no props required.

---

## ⚠️ Known Limitations (Development)
- Stripe PaymentSheet requires a native development build (`npx expo run:ios` or EAS Build). In Expo Go, payments are bypassed for development testing.
- Address autocomplete uses reverse geocoding only. Google Places Autocomplete is planned for Phase 5 (requires EXPO_PUBLIC_GOOGLE_PLACES_API_KEY).
- Technician distance calculation requires job coordinates from the API (currently stubbed, wires up in Phase 2C).
- Push notifications require a physical device and a development build.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL (local or Docker)
- Expo Go app (iOS/Android) for mobile testing

### 1. Backend

```bash
cd backend
npm install
# Configure .env with DATABASE_URL, JWT_SECRET, PORT
npx prisma db push
npx ts-node scripts/create-admin.ts   # Create admin user
npm run dev                            # Starts on :3000
```

### 2. Mobile App

```bash
cd mobile
npm install
# Edit src/constants/Config.ts — set API_URL to your LAN IP for physical devices
npx expo start --clear
# Scan QR code with Expo Go
```

### 3. Admin Console

```bash
cd web
npm install
npm run dev                            # Starts on :5173
# Login: admin@fuerza.com / admin
```

---

## 🔄 Workflow

### Customer Flow
1. **Register** as a Customer (email + phone)
2. **Choose Language** — toggle 🇺🇸/🇪🇸 on Login or Profile
3. **Home Screen** — view your location and nearby online technicians on the map with trade-colored pins
4. **Filter Technicians** — use the horizontal chip bar to filter by trade (Plumbing, Electrical, HVAC, Pool)
5. **Request Service** — tap "Request a Service" → multi-step wizard:
   - Step 1: Pick a trade from the 2-column card grid
   - Step 2: Describe the problem + attach up to 5 photos
   - Step 3: Enter or auto-detect your service address
   - Step 4: Review summary → get instant estimate → Confirm & Book
6. **Track Job** — watch technician location in real time after they accept
7. **Job Complete** — leave a review, view receipt

### Technician Flow
1. **Register** as a Technician (toggle switch on registration)
2. **Set Up Payouts** — configure Stripe Connect Express before going online
3. **Go Online** — toggle availability (grants background location permission → starts GPS tracking → Android foreground service notification)
4. **Receive Jobs** — push notification + real-time socket alert with trade, address, and price (bilingual EN/ES)
5. **Review Details** — see customer name, address, description, photos, estimated earnings, and language badge before accepting
6. **Accept & Work** — tap "Accept Job" to claim a request
7. **Status Updates** — progress through: Matched → En Route → Arrived → Working → Completed
8. **Change Orders** — propose price adjustments if scope changes (one pending per job)
9. **Go Offline** — stops background location tracking and notifies server

### Admin Flow
1. **Login** at `http://localhost:5173` with admin credentials
2. **View Dashboard** — see user stats and full user table
3. **Add Users** — click "Add User" to create accounts manually
4. **Edit Users** — click the pencil icon to modify user details
5. **Delete Users** — click the trash icon to remove users (cascading deletes handle linked profiles)

---

## 🧭 Dashboard Architecture

The home tab (`app/(tabs)/index.tsx`) renders a role-specific dashboard.

### Customer Dashboard — Map-First

| Property | Value |
|----------|-------|
| **Component** | `mobile/src/components/stitch_ui/HomeownerDashboard.tsx` |
| **Route** | `app/(tabs)/index.tsx` (role-based rendering) |
| **Architecture** | Self-contained, hooks into stores directly |

**Layout:** 5 absolute-positioned layers stacked on `MapView`:

| Layer | Content |
|-------|---------|
| 0 | Full-screen MapView with user location + trade-colored technician pins |
| 1 | Floating header: "Fuerza" wordmark + address pill + user avatar |
| 2 | Horizontal trade filter chips (All / Plumbing / Electrical / HVAC / Pool) |
| 3 | Bottom panel: pulsing online count + 4 category quick-cards + orange CTA |
| 4 | Recenter FAB |

### Technician Dashboard

| Property | Value |
|----------|-------|
| **Component** | `mobile/src/components/stitch_ui/TechnicianMainDashboard.tsx` |
| **Route** | `app/(tabs)/index.tsx` (role-based rendering) |
| **Architecture** | Self-contained, hooks into stores directly |

**Features:**
- Online/Offline toggle with Stripe Connect + Location permission gates
- Background GPS tracking (8s/20m) while online with Android foreground service
- Push notifications for new job requests (bilingual)
- Job queue with trade-colored cards, countdown timer, and distance calculation
- Earnings summary and active job management

### Role-Based Home Tab Behavior

Expo Router's `(tabs)/index.tsx` reads `user.role` from `useAuthStore` and conditionally renders:

- **`TECHNICIAN`** → `<TechnicianMainDashboard />` (receives props from index.tsx)
- **`CUSTOMER` / default** → `<HomeownerDashboard />` (self-contained, no props needed)

---

## 📄 License

This project is for internal/private use.
