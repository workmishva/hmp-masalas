# Implementation Plan: Production-Ready Startup Polish

This plan addresses all the critical blockers identified in the audit so you safely launch while keeping real payment integration behind a feature flag.

## User Review Required

> [!IMPORTANT]
> **Admin Password Reset**: The current plain text password `HMP@123` will be removed. I will generate a secure `bcrypt` hash for your `.env` file during execution. You will login with the same password, but it will be verified cryptographically on the server.
> **Image Optimization**: I will execute a script to convert your current JPG/PNG images to WebP format. This drastically reduces file size.
> **Please approve this plan so I can begin making these edits.**

## Proposed Changes

---
### 1. Security & Authentication Refactoring

#### [MODIFY] `server/src/app.ts`
- Enhance `helmet()` configuration to prevent common web attacks.
- Strengthen CORS policy to restrict cross-origin requests to only frontend clients.
- Add `express-rate-limit` to payment/checkout and login endpoints.

#### [MODIFY] `server/src/middlewares/verifyAdmin.ts`
- Remove plain text password basic-auth validation.
- Implement JWT-based validation using an `ADMIN_JWT_SECRET`.

#### [NEW] `server/src/controllers/adminAuthController.ts`
- Create a `loginAdmin` controller that compares passwords using `bcrypt.compareSync` against a hash stored in the server's `.env`.
- Return a secure JSON Web Token (JWT) upon successful login.

#### [NEW] `server/src/routes/adminRoutes.ts`
- Create an endpoint `POST /api/admin/login` attached to the new controller.

#### [MODIFY] `src/app/context/AdminAuthContext.tsx`
- Remove the highly insecure frontend `VITE_ADMIN_PASSWORD` variable.
- Refactor the `login` function to call the backend `/api/admin/login` and store the `token` in `sessionStorage`.

#### [MODIFY] `src/app/services/adminOrdersApi.ts`
- Read the JWT token from `sessionStorage` and include it as `Bearer <token>` headers instead of Basic Auth.

---
### 2. Frontend SEO & Asset Optimization

#### [NEW] `scripts/optimize-images.js`
- Create a script leveraging `sharp` to parse all `src/assets/*.{jpg,png}` images and compress them into `.webp` at 80% quality. (e.g., An 8MB image will become ~400KB without losing visible quality).

#### [MODIFY] `index.html`
- Inject Professional Meta tags:
  - `<meta name="description" content="Authentic Indian Spices - HMP Masala">`
  - `<meta property="og:title" content="HMP Masala - Premium Indian Spices">`
  - `<meta property="og:image" content="/og-image.jpg">`

#### [NEW] `public/robots.txt`
- Allow web crawlers to index the homepage for Google search optimization.

#### [NEW] `public/sitemap.xml`
- Basic static sitemap mapping the core routes (`/`, `/masalas`).

#### [MODIFY] `src/app/pages/products/...`
- Update all image imports from `.jpg`/`.png` to their `.webp` equivalents.

---
### 3. WhatsApp Checkout Flow & Feature Flagging

#### [MODIFY] `src/app/pages/CheckoutPage.tsx`
- Introduce a Feature Flag: `const ENABLE_ONLINE_PAYMENT = import.meta.env.VITE_ENABLE_ONLINE_PAYMENT === 'true'`.
- Wrap the entire UPI flow (the 15-minute timer, the simulated Paytm/PhonePe intents) inside `if (ENABLE_ONLINE_PAYMENT)`.
- Re-design the WhatsApp checkout flow to be the primary option. Ensure clear UX "Place Order via WhatsApp."
- Keep the generated Verification Code logic secure.

---
### 4. Code Cleanup

#### [MODIFY] Codebase `.env` handling
- Delete any `.env` tracked files and create `.env.example` safe templates.
- Update `.gitignore` to ensure `.env` and `*.json` secrets are protected.

## Open Questions

- Should I set the feature flag `VITE_ENABLE_ONLINE_PAYMENT` to `false` in the repository by default so the public launch only shows WhatsApp immediately?
- Would you like the system to append a WhatsApp redirect automatically, or require the user to click a 'Send Order Message' button explicitly?

## Verification Plan

### Automated Tests
- Server will cleanly compile with zero TypeScript errors.
- Image sizes in `dist/assets` will dramatically drop during `npm run build`.

### Manual Verification
- Will ask you to click the admin login panel and test logging in.
- Will verify via screenshot that the Checkout Page looks professional without the fake UPI timer.
- Will provide a comprehensive final checklist for Vercel/Render hosting.
