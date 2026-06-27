# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aromatic Heritage** — A full-stack e-commerce web application for selling masalas (spices). Built with a React + Vite frontend and an Express + MongoDB backend, with Firebase Authentication for customer auth and a separate bcrypt+JWT admin auth system.

---

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite 6 (`vite.config.ts`)
- **Styling:** TailwindCSS v4 (via `@tailwindcss/vite` plugin)
- **UI Libraries:** Radix UI primitives, shadcn/ui components (`src/app/components/ui/`), MUI (Material UI), Lucide React icons
- **Routing:** React Router v7 (`react-router`)
- **Animations:** Motion (Framer Motion successor)
- **State Management:** React Context API (see `src/app/context/`)
- **Auth:** Firebase Client SDK (`firebase` package)
- **Path Alias:** `@` → `./src` (configured in `vite.config.ts`)

### Backend
- **Runtime:** Node.js with TypeScript (`ts-node-dev`)
- **Framework:** Express.js 4
- **Database:** MongoDB via Mongoose 9 (MongoDB Atlas)
- **Customer Auth:** Firebase Admin SDK (`firebase-admin`)
- **Admin Auth:** bcrypt password verification + JWT (credentials stored in env)
- **File Uploads:** Multer + Cloudinary (`multer-storage-cloudinary`)
- **Validation:** Zod
- **Security:** Helmet, CORS, express-rate-limit, express-mongo-sanitize, xss-clean

---

## How to Run

### Development (both frontend + backend concurrently)
```bash
npm run dev
```
- **Frontend:** Vite dev server on `http://localhost:5173`
- **Backend:** Express server on `http://localhost:5000`

The Vite dev server proxies `/api/*` requests to the backend (configured in `vite.config.ts`).

### Frontend only
```bash
npm run dev:frontend
```

### Backend only
```bash
npm run dev:backend
# or
cd server && npm run dev
```

### Build for production
```bash
npm run build          # Frontend build
cd server && npm run build  # Backend build
```

---

## Environment Variables

### Frontend (`.env`)
| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Backend URL (default: `http://localhost:5000`) |
| `VITE_ENABLE_ONLINE_PAYMENT` | `"true"` to enable UPI payment flow (default: `"false"`) |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID (optional) |

### Backend (`server/.env`)
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Server port (default: 5000) |
| `CLIENT_URL` | Frontend URL for CORS (default: `http://localhost:5173`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON (default: `./serviceAccountKey.json`) |
| `CLOUD_NAME` | Cloudinary cloud name |
| `API_KEY` | Cloudinary API key |
| `API_SECRET` | Cloudinary API secret |
| `ADMIN_ID` | Admin username |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password |
| `ADMIN_JWT_SECRET` | Secret for signing admin JWTs |

### Backend (`server/serviceAccountKey.json`)
Firebase Admin SDK service account credentials — never commit this file.

---

## Key Architectural Patterns

### 1. Dual Authentication System
- **Customers:** Firebase Auth on frontend → Firebase ID token in `Authorization: Bearer <token>` → `verifyToken` middleware validates via Firebase Admin SDK.
- **Admin:** Username + password (bcrypt) → `POST /api/admin/login` returns a JWT → `verifyAdmin` middleware validates that JWT. Admin credentials live entirely in env vars, not the database.

### 2. Admin Panel
Separate admin routes under `/admin/*` with `ProtectedAdminRoute` guard. Admin login route is defined by `ADMIN_LOGIN_ROUTE` in `src/app/config/admin.ts`.

### 3. Context Architecture
Multiple React contexts wrap the app in `Root.tsx` (outermost first):
- `ThemeProvider` → `AuthProvider` → `AdminAuthProvider` → `StoreConfigProvider` → `ProductCatalogProvider` → `CartProvider`

Key contexts:
- `AuthContext` — Firebase customer auth state
- `AdminAuthContext` — Admin JWT auth state
- `CartContext` — Shopping cart (local state)
- `ProductCatalogContext` — Products fetched from `/api/products`; exports `resolveCatalogImage()` helper
- `StoreConfigContext` — Store settings (WhatsApp number, shipping config, UPI toggle) from `/api/config`

### 4. Payment Flow
Orders support two payment methods: `upi` and `whatsapp`. The `VITE_ENABLE_ONLINE_PAYMENT` feature flag controls whether UPI is available in the checkout UI. Shipping cost is calculated on the frontend using haversine distance from store coordinates (stored in `StoreConfig`) to the customer's geolocation.

### 5. Backend API Routes (all under `/api/`)
| Prefix | Route file | Auth |
|---|---|---|
| `/api/orders` | `orderRoutes.ts` | `verifyToken` |
| `/api/users` | `userRoutes.ts` | `verifyToken` |
| `/api/admin` | `adminRoutes.ts` | admin JWT |
| `/api/products` | `productRoutes.ts` | public (read) / admin (write) |
| `/api/config` | `configRoutes.ts` | public (read) / admin (write) |
| `/api/cart` | `cartRoutes.ts` | `verifyToken` |

### 6. API Proxy
Frontend dev server proxies `/api/*` to backend on port 5000 (see `vite.config.ts`).

---

## Important Conventions

- **DO NOT** modify or remove the React and Tailwind Vite plugins — they are required.
- **DO NOT** add `.css`, `.tsx`, or `.ts` files to `assetsInclude` in Vite config.
- Use `@/` path alias for imports from the `src/` directory.
- All API routes use the `/api/` prefix.
- The frontend uses **React Router v7** with `createBrowserRouter` — use data router patterns.
- UI components follow **shadcn/ui** conventions in `src/app/components/ui/`.
- Use **Zod** for request validation on the backend.
- Toast notifications use `sonner` via `src/app/components/ui/sonner.tsx`.

---

## Common Tasks

### Adding a new page
1. Create the page component in `src/app/pages/`
2. Add the route in `src/app/routes.tsx`
3. Use `WebsiteLayout` wrapper for public pages or `AdminLayout` for admin pages

### Adding a new API endpoint
1. Create or update the controller in `server/src/controllers/`
2. Add the route in `server/src/routes/`
3. Mount the router in `server/src/app.ts` if it's a new route file
4. Apply `verifyToken` and/or `verifyAdmin` middleware as needed

### Adding a new context
1. Create the context in `src/app/context/`
2. Wrap it in `Root.tsx` provider tree
