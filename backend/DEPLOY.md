# Fuerza Home Services — Production Deployment Checklist

## Overview
This document covers deploying the Fuerza Home Services backend 
to Railway and submitting the iOS app to the Apple App Store.

---

## Local Development Notes
- Requires Docker Desktop running with the fuerza-home-services-ag 
  container on port 5434
- Production (Railway) uses managed PostgreSQL — no Docker needed
- Start the container: Docker Desktop → start container manually
  or: docker start fuerza-home-services-ag

---

## PRE-DEPLOYMENT CHECKLIST

### Stripe (Live Mode)
- [ ] Switch Stripe dashboard from Test to Live mode
- [ ] Copy live STRIPE_SECRET_KEY (starts with sk_live_)
- [ ] Copy live STRIPE_PUBLISHABLE_KEY (starts with pk_live_)
- [ ] Register webhook endpoint in Stripe Live dashboard:
      URL: https://your-railway-url.railway.app/api/payments/webhook
      Events: payment_intent.succeeded, payment_intent.payment_failed,
              payment_intent.amount_capturable_updated
      For local webhook testing, use the Stripe CLI:
        stripe listen --forward-to localhost:3000/api/payments/webhook
        Copy the whsec_ it prints into your local .env as
        STRIPE_WEBHOOK_SECRET
- [ ] Copy STRIPE_WEBHOOK_SECRET from webhook registration
      Note: The webhook path exemption in server.ts skips the
      global JSON parser for any request whose originalUrl is
      exactly '/api/payments/webhook'. If this route path ever
      changes, find the conditional parser block (search for
      'originalUrl' in server.ts) and update the exemption to
      match.
- [ ] Verify Stripe Connect is enabled for live mode
- [ ] Complete Stripe platform profile (business details)
- [ ] Note: PaymentIntents use capture_method: manual
      Stripe authorizations expire after 7 days
      capture window must be respected before job completion

### Firebase
- [ ] firebase-service-account.json is in backend/ root (gitignored)
- [ ] FIREBASE_PROJECT_ID=fuerza-home-services in .env
- [ ] Verify push notifications work on physical device

### Cloudflare R2
- [ ] fuerza-photos bucket exists and is set to Public
- [ ] R2 API token has Object Read & Write permissions
- [ ] Test photo upload works in development

### Apple Developer
- [ ] Apple Developer account active ($99/year)
- [ ] Bundle ID com.fuerza.homeservices registered
- [ ] App record created in App Store Connect
- [ ] App ID: 6760715355
- [ ] Team ID: Z4QT9D87U6

---

## RAILWAY BACKEND DEPLOYMENT

### Step 1 — Create Railway Project
1. Go to railway.app → New Project
2. Select Deploy from GitHub repo
3. Select fuerza-home-services repository
4. Set root directory to: backend/
5. Railway will auto-detect Node.js via Nixpacks

### Step 2 — Add PostgreSQL
1. In Railway project → + New → Database → PostgreSQL
2. Railway automatically sets DATABASE_URL in environment
3. Append to DATABASE_URL:
   ?pgbouncer=true&connection_limit=5&pool_timeout=10

### Step 3 — Set Environment Variables
Go to Railway project → Variables tab and add ALL of these:

#### Required — App
NODE_ENV=production
BACKEND_URL=https://your-railway-url.railway.app
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))">
REFRESH_TOKEN_SECRET=<generate same way>

#### Required — Database
DATABASE_URL=<auto-set by Railway PostgreSQL plugin>

#### Required — Stripe (USE LIVE KEYS IN PRODUCTION)
STRIPE_SECRET_KEY=sk_live_XXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX

#### Required — Firebase
FIREBASE_PROJECT_ID=fuerza-home-services
FIREBASE_SERVICE_ACCOUNT=<paste entire firebase-service-account.json 
  as a single minified JSON string>

#### Required — Cloudflare R2
R2_ACCOUNT_ID=6aad2019b2e0fc94f58ea0e4b852...
R2_ACCESS_KEY_ID=XXXX
R2_SECRET_ACCESS_KEY=XXXX
R2_BUCKET_NAME=fuerza-photos
R2_PUBLIC_URL=https://pub-e9c0ec700ea746ab9d901f716ecee4c6.r2.dev

### Step 4 — Configure Build & Start Commands
Add railway.json to backend/:

{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}

### Step 5 — Handle Firebase Service Account on Railway
firebase-service-account.json is gitignored and won't deploy.
Use environment variable instead:

1. Open firebase-service-account.json
2. Minify to a single line (remove all whitespace/newlines)
3. Add as Railway env var: FIREBASE_SERVICE_ACCOUNT={minified json}
4. Update backend/src/services/firebase.service.ts:

   const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
     ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
     : require('../../firebase-service-account.json');

### Step 6 — Deploy
1. Push latest code to GitHub main branch
2. Railway auto-deploys on push
3. Monitor build logs in Railway dashboard
4. Verify health check: GET /health → {"status":"ok"}

### Step 7 — Run Database Migrations
Railway runs prisma migrate deploy on startup automatically.
If needed manually: railway run npx prisma migrate deploy

### Step 8 — Verify Production Endpoints
- GET  /health
- POST /api/auth/login
- GET  /api/technicians/online
- POST /api/payments/create-payment-intent
  (verify capture_method: manual in Stripe dashboard)

---

## EAS MOBILE BUILD & APP STORE SUBMISSION

### Step 1 — Update EAS Secrets with Production URLs
After Railway deployment:
  eas secret:create --scope project --name EXPO_PUBLIC_API_URL \
    --value https://your-railway-url.railway.app/api
  eas secret:create --scope project \
    --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    --value pk_live_XXXX
  eas secret:create --scope project \
    --name EXPO_PUBLIC_GOOGLE_PLACES_API_KEY \
    --value AIza_XXXX

### Step 2 — Trigger Production Build
  cd mobile
  eas build --platform ios --profile production

### Step 3 — App Store Assets Required
- [ ] Screenshots — 6.7" iPhone (1290×2796px) min 3, max 10
- [ ] Screenshots — 5.5" iPhone (1242×2208px)
- [ ] App icon — 1024×1024 ✅ (already generated)
- [ ] Privacy Policy URL (required by Apple)
- [ ] Support URL (required by Apple)

### Step 4 — App Store Connect Metadata

App Information:
  Name: Fuerza Home Services
  Subtitle: On-Demand Home Trades
  Bundle ID: com.fuerza.homeservices
  SKU: fuerza-home-services-001
  Primary Category: Utilities
  Price: Free

Age Rating: 4+ (answer No to all sensitive content questions)

### Step 5 — English Description
Fuerza Home Services connects homeowners with skilled 
tradespeople in minutes — not days.

Choose from Certified & Insured professionals or vetted 
Independent Pros for General Handyman, House Cleaning, 
and Landscaping work.

FOR HOMEOWNERS:
- See available technicians on a live map before you book
- Choose Certified or Independent Pro based on your budget
- Get an AI-powered price estimate upfront
- No payment until your job is complete
- $2.99 booking fee added to final invoice
- Rate your technician and keep a full job history

FOR TECHNICIANS:
- Zero upfront fees — you only pay when you earn
- Keep 88% of every completed job
- Accept or decline any job request
- Adjust pricing on-site if the scope changes
- Automatic payout after job completion

FULLY BILINGUAL — TOTALMENTE BILINGÜE:
Built for English and Spanish speakers. Switch languages 
instantly. The only on-demand home services platform 
built with Spanish-speaking tradespeople and homeowners 
in mind.

Currently serving Greater Houston, TX.

### Step 6 — Spanish Description
Fuerza Home Services conecta propietarios con técnicos 
calificados en minutos.

Elige entre técnicos Certificados y Asegurados o Pros 
Independientes para trabajos de mantenimiento general, 
limpieza del hogar y jardinería.

PARA PROPIETARIOS:
- Ve técnicos disponibles en un mapa en vivo
- Elige Certificado o Independiente según tu presupuesto
- Estimado de precio con inteligencia artificial
- Sin pago hasta que el trabajo esté completo
- Tarifa de reserva de $2.99 incluida en la factura final
- Califica a tu técnico y mantén tu historial

PARA TÉCNICOS:
- Sin tarifas iniciales — solo pagas cuando ganas
- Conserva el 88% de cada trabajo completado
- Acepta o rechaza cualquier solicitud
- Ajusta el precio en sitio si el trabajo cambia
- Pago automático al completar el trabajo

Actualmente disponible en el área metropolitana de Houston, TX.

### Step 7 — Keywords (100 chars max)
home services,plumber,electrician,hvac,handyman,cleaning,on demand,repair,servicios,Houston

### Step 8 — What's New (First Release)
Welcome to Fuerza Home Services! Connect with Certified 
and Independent Pro tradespeople in Houston instantly. 
Fully bilingual English/Spanish. Available now for iOS.

### Step 9 — Submit
  eas submit --platform ios --profile production

### Step 10 — Apple Review Notes (paste into review notes field)
Test Customer Account:
  Email: john@example.com
  Password: password123

Test Technician Account (Certified):
  Email: carlos@fuerza.dev
  Password: password123

Backend API: https://your-railway-url.railway.app

Note for reviewers: Payment is authorized at booking 
(manual capture) and collected only when the job is 
marked complete by the technician. The $2.99 booking fee 
is included in the final charge.

---

## PAYMENT & DISPUTE POLICY

### Authorization Window
- Stripe authorizations expire after 7 days
- If a job is not completed within 7 days, the customer 
  must re-authorize payment
- The app emits payment:reauthorize_required via Socket.io
  when an expired auth is detected at completion time

### Cash Jobs
- Technician collects payment directly from customer
- Technician owes Fuerza 12% of the agreed final price
- Stored as cashCommissionOwed on the Job record
- Status: CASH_PENDING_COMMISSION
- TODO Phase 4: Invoice technician via email (SendGrid)

### Dispute Policy
- Customer can dispute within 48 hours of job completion
- POST /api/jobs/:id/dispute { reason, description }
- Dispute model stores all details with OPEN status
- Admin resolves disputes manually (admin dashboard)
- TODO Phase 4: Email notification to admin on new dispute

### Job Request Expiry
- Job requests expire after 30 minutes if no technician accepts
- Cron job runs every 5 minutes to sweep expired requests
- Customer receives bilingual push notification on expiry
- Customer can rebook from the expired job in jobs.tsx

---

## POST-LAUNCH CHECKLIST
- [ ] Monitor Railway logs (first 48 hours)
- [ ] Test push notifications on live build
- [ ] Verify Stripe live payments and captures work
- [ ] Verify R2 photo uploads work in production
- [ ] Set up Sentry for error monitoring (free tier)
- [ ] Set up UptimeRobot for uptime monitoring (free)
- [ ] Respond to first user reviews within 24 hours
- [ ] Submit Android build to Google Play (Sprint 8)

---

## ENVIRONMENT VARIABLES MASTER LIST

### Backend (Railway)
| Variable | Description |
|----------|-------------|
| NODE_ENV | production |
| BACKEND_URL | https://xxx.railway.app |
| DATABASE_URL | auto-set by Railway + pgbouncer params |
| JWT_SECRET | 64-char random string |
| REFRESH_TOKEN_SECRET | 64-char random string |
| STRIPE_SECRET_KEY | sk_live_... |
| STRIPE_PUBLISHABLE_KEY | pk_live_... |
| STRIPE_WEBHOOK_SECRET | whsec_... |
| FIREBASE_PROJECT_ID | fuerza-home-services |
| FIREBASE_SERVICE_ACCOUNT | minified JSON string |
| R2_ACCOUNT_ID | 6aad2019... |
| R2_ACCESS_KEY_ID | from Cloudflare |
| R2_SECRET_ACCESS_KEY | from Cloudflare |
| R2_BUCKET_NAME | fuerza-photos |
| R2_PUBLIC_URL | https://pub-xxx.r2.dev |

### Mobile (EAS Secrets)
| Variable | Description |
|----------|-------------|
| EXPO_PUBLIC_API_URL | https://xxx.railway.app/api |
| EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY | pk_live_... |
| EXPO_PUBLIC_GOOGLE_PLACES_API_KEY | AIza... |

---

## USEFUL COMMANDS

### Backend
npm run dev                          # Start dev server
npm run build                        # Build for production
npx prisma migrate deploy            # Run migrations
npx prisma generate                  # Regenerate client
npx prisma studio                    # Open DB browser
npx tsc --noEmit                     # Type check
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"  # Generate secret

### Docker (local dev only)
docker start fuerza-home-services-ag   # Start DB container
docker stop fuerza-home-services-ag    # Stop DB container
docker ps                              # Check running containers

### Mobile
npx expo start --dev-client --clear   # Start Metro
eas build --platform ios --profile development   # Dev build
eas build --platform ios --profile production    # Prod build
eas submit --platform ios --profile production   # Submit
eas secret:list                        # List secrets
eas build:list --platform ios --limit 5          # Build history

---

Last updated: Phase 1 redesign complete (certification levels,
manual Stripe capture, job expiry, reviews, disputes)
Pending: Phase 2 mobile changes, Railway deployment, App Store submission
