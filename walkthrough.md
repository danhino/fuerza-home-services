# Fuerza Home Services - MVP Walkthrough

This repository contains the MVP for **Fuerza Home Services**, a map-first on-demand trades application.

## 📂 Project Structure

- `backend/`: Node.js/Express server (API + WebSocket) + Prisma/PostgreSQL
- `mobile/`: React Native (Expo) iOS/Android app
- `web/`: React Admin Console web dashboard

## 🚀 How to Run

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Docker)
- Expo Go app on your iPhone (or iOS Simulator on Mac)

### 1. Backend Setup

1.  Navigate to `backend`:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    - Edit [.env](file:///C:/Users/danhi/.gemini/antigravity/scratch/fuerza-home-services/backend/.env) file.
    - Ensure `DATABASE_URL` points to your PostgreSQL instance.
    - Example: `postgresql://user:password@localhost:5432/fuerza_home_services?schema=public`
4.  Initialize Database:
    ```bash
    npx prisma db push
    ```
    *(Note: Use `db push` for rapid prototyping instead of migrations)*
5.  Start Server:
    ```bash
    npm run dev
    ```
    Server runs on `http://localhost:3000`.

### 2. Admin Console (Web)

1.  Navigate to `web`:
    ```bash
    cd web
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start Dashboard:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173`.
5.  Login with: `admin@fuerza.dev` / `password123`.

### 3. Mobile App Setup

1.  Navigate to `mobile`:
    ```bash
    cd mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure API URL:
    - Edit [src/constants/Config.ts](file:///C:/Users/danhi/.gemini/antigravity/scratch/fuerza-home-services/mobile/src/constants/Config.ts).
    - **Physical Device**: Replace `localhost` with your computer's LAN IP (e.g., `http://192.168.1.50:3000`).
    - **Simulator**: Keep `http://localhost:3000`.
4.  Start Expo:
    ```bash
    npx expo start --clear
    ```
5.  Scan the QR code with your iPhone Camera (or Expo Go app).

---

## 📱 Features Verification

### Admin Console (Web Dashboard)
- **User Management**: Log in to the web dashboard as Admin. You can view all registered users, see their roles, and manage users.
- **Full CRUD**: Add, Edit, and Delete users via modals.
- **Fixed Deletion**: Cascading deletes ensure users can be removed without constraint errors.
- **Admin Security**: Only users with the `ADMIN` role can access `/api/admin` routes.

### i18n (EN ⇄ ES) + Spanish Customer Flag
- **Language Toggle**: On Login and Profile screens, tap the language button to switch between 🇺🇸 English and 🇪🇸 Español. All UI text updates instantly.
- **Persistence**: Language choice persists via AsyncStorage (mobile) and is synced to the backend (`preferredLanguage` on User).
- **Technician ES Badge**: When a Spanish-speaking customer creates a job, technicians see an orange **"ES / Spanish"** badge on the job card.
- **Technician Alert**: On the `job:new` socket event, if the customer prefers Spanish, an Alert pops up telling the technician.

### Customer Map Trade Filters
- **Filter Panel**: Dark overlay with toggles for Plumber, Electrician, Pool, and Cleaning.
- **Color-Coded Markers**: Each trade has a unique color on the map.
- **Real-Time**: Markers update instantly when filters are toggled.

### Advanced Service Requests
- **Detailed Form**: Customers select a trade, enter address, describe the issue, and attach photos.
- **Photo Upload**: Up to 5 photos per request with **auto-compression** (800px width, 0.6 quality).
- **Technician View**: Before accepting, technicians see customer name, address, description, and a scrollable photo gallery.

### Real-Time Updates
- **Technician Tracking**: Log in as a Technician and toggle "Go Online". Your location will stream to the server.
- **Customer Map**: Log in as a Customer. You will see markers for online Technicians moving on the map.
- **Job Status**: Create a request as Customer. Technician accepts it. Customer screen updates status instantly via Socket.io.

### Customer Flow
1.  **Register** as a Customer.
2.  **Home Screen**: See your location and nearby technicians.
3.  **Request Service**: Tap "Request a Service" and fill out the form.
4.  **View Jobs**: Go to "Jobs" tab to see active request.

### Technician Flow
1.  **Register** as a Technician (Toggle switch).
2.  **Home Screen**: See Dashboard.
3.  **Go Online**: Toggle status to "ONLINE".
4.  **Accept Job**:
    - Go to "Jobs" tab.
    - See the job requested by the Customer (with name, description, photos).
    - Tap "Accept Job".
    - Status updates to `MATCHED` for everyone.

## 🛠️ Tech Stack
- **Mobile**: React Native, Expo Router, Zustand, Axios, Maps, Socket.io-client, expo-image-picker, expo-image-manipulator
- **Backend**: Node.js, Express, Socket.io, Prisma, PostgreSQL
- **Web**: React, Vite
