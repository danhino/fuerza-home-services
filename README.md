# Fuerza Home Services

**Fuerza Home Services** is an on-demand home services platform that connects customers with skilled technicians (plumbers, electricians, HVAC techs, pool service pros) in real time. Think of it as an Uber-style experience for home repairs — customers request help, nearby technicians accept the job, and everything is tracked live on a map. Fully bilingual (English / Spanish).

---

## ✨ Features

### 📱 Mobile App (Customer)
- **Map-first home screen** — Uber-style dashboard with full-screen MapView, trade-colored technician pins, floating header with address pill, and a pulsing online-count indicator
- **Trade filter chips** — horizontal chip bar to filter by trade (All, Plumbing, Electrical, HVAC, Pool) with color-coded map pins (blue, yellow, purple, teal)
- **Technician callouts** — tap a map pin to see technician name, trade, and star rating
- **Multi-step service request wizard** — 4-step checkout flow with animated progress bar:
  1. Select Trade (2-column card grid with icons + descriptions)
  2. Describe Issue (multiline text + photo picker with auto-compression)
  3. Service Address (input + reverse geocode + static map preview)
  4. Review & Get Estimate → fee breakdown → Confirm & Book
- **AI-powered triage** — preliminary estimate screen powered by backend triage engine
- **Photo auto-compression** — photos resized (800px) and compressed (0.6 quality) on-device before upload
- **Live job tracking** — watch your technician's location update on the map via WebSocket
- **Job history** — view all past and active service requests with status pills
- **Post-payment features** — leave reviews and view receipts after job completion

### 🔧 Mobile App (Technician)
- **Go online / offline toggle** — control your availability
- **Real-time job alerts** — receive new job requests instantly via Socket.io
- **Earnings display** — see estimated earnings on job cards before accepting
- **Spanish-speaker notifications** — get an alert when a Spanish-speaking customer creates a job, plus an "ES" badge on the job card
- **Rich job details** — see customer name, address, description, and a scrollable photo gallery before accepting
- **Accept & manage jobs** — view open requests and accept them with one tap
- **Location broadcasting** — your position streams to customers while online

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
- Live technician location tracking (with trade info, name, rating)
- Instant job status updates (Requested → Matched → En Route → Arrived → Working → Completed)
- New job alerts for technicians with Spanish-speaker detection

### 💳 Payments & Post-Job
- Payment processing service integration
- Receipt generation and email stub
- Customer review system (star rating + comments)
- Change order workflow for price adjustments

---

## 📂 Project Structure

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
│       ├── services/           # Socket.io, Payment, Email services
│       ├── utils/              # Password hashing, JWT helpers
│       └── server.ts           # App entry point
│
├── mobile/                     # React Native (Expo) iOS/Android app
│   ├── app/
│   │   ├── (auth)/             # Login & Register screens
│   │   ├── (tabs)/             # Tab screens
│   │   │   ├── index.tsx       # Role-based dashboard switch
│   │   │   ├── request.tsx     # Multi-step service request wizard
│   │   │   ├── jobs.tsx        # Job list & tracking
│   │   │   ├── earnings.tsx    # Earnings dashboard (coming soon)
│   │   │   └── profile.tsx     # User profile & settings
│   │   ├── triage.tsx          # AI triage / preliminary estimate screen
│   │   └── estimate.tsx        # Detailed estimate view
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
│       │   │   └── index.ts           # Barrel exports
│       │   └── stitch_ui/     # Stitch-designed layout components
│       │       ├── HomeownerDashboard.tsx   # Map-first customer home
│       │       ├── TechnicianMainDashboard.tsx
│       │       ├── GreetingHeader.tsx
│       │       ├── CategoryChip.tsx
│       │       ├── ProCard.tsx
│       │       ├── PromoBanner.tsx
│       │       ├── RoleCard.tsx
│       │       ├── ScreenHeader.tsx
│       │       ├── StatusBadge.tsx
│       │       └── index.ts
│       ├── constants/          # Design tokens
│       │   ├── Colors.ts       # 50+ semantic tokens, light/dark themes
│       │   ├── Typography.ts   # 18 pre-composed text styles
│       │   ├── Spacing.ts      # Scale, radii, shadows, z-index
│       │   ├── Theme.ts        # Unified typed theme object
│       │   └── Config.ts       # API URL configuration
│       ├── hooks/
│       │   ├── useTheme.ts     # Unified theme hook
│       │   └── useThemeColor.ts
│       ├── i18n/               # Translation files (en.ts, es.ts) + language store
│       ├── services/           # Axios API client, Socket client
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
| **Mobile**   | React Native, Expo, Expo Router, Zustand, Axios   |
| **Maps**     | react-native-maps, expo-location                  |
| **Photos**   | expo-image-picker, expo-image-manipulator          |
| **i18n**     | Custom Zustand store + AsyncStorage persistence   |
| **Real-time**| Socket.io (server) + socket.io-client (mobile)    |
| **Backend**  | Node.js, Express, TypeScript                      |
| **Database** | PostgreSQL + Prisma ORM                           |
| **Auth**     | JWT (jsonwebtoken) + bcryptjs                     |
| **Admin Web**| React, Vite, TypeScript, Zustand, Lucide Icons    |
| **Design**   | Custom token system (Colors, Typography, Spacing, Theme) |

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
2. **Go Online** — toggle availability on the Home Screen
3. **Receive Jobs** — new requests appear in the Jobs tab instantly (with Spanish-speaker alert if applicable)
4. **Review Details** — see customer name, address, description, photos, estimated earnings, and language badge before accepting
5. **Accept & Work** — tap "Accept Job" to claim a request
6. **Status Updates** — progress through: Matched → En Route → Arrived → Working → Completed

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
| **Stitch Screen ID** | `b151d67385da435280585ba51c0914bd` |
| **Component** | `mobile/src/components/stitch_ui/TechnicianMainDashboard.tsx` |
| **Route** | `app/(tabs)/index.tsx` (role-based rendering) |

**Description:** Primary landing experience for authenticated technicians. Displays next job card, upcoming schedule, and service shortcuts.

### Role-Based Home Tab Behavior

Expo Router's `(tabs)/index.tsx` reads `user.role` from `useAuthStore` and conditionally renders:

- **`TECHNICIAN`** → `<TechnicianMainDashboard />` (receives props from index.tsx)
- **`CUSTOMER` / default** → `<HomeownerDashboard />` (self-contained, no props needed)

---

## 📄 License

This project is for internal/private use.
