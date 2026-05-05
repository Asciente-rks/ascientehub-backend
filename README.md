# AscienteHub

> A Steam-style desktop game launcher and storefront — players sign up, browse a catalog, pay with PayMongo, and install + launch titles from a real native Windows binary.

AscienteHub is a full-stack game distribution platform: a Tauri 2 desktop launcher backed by a TypeScript/Express API on AWS Lambda, with TiDB Cloud for storage, Cloudflare R2 for game installers, and PayMongo for card payments. The flagship game in the catalog is the author's own indie title from a separate game-development project — the rest of the catalog exercises the storefront, cart, and 3-D Secure card flow.

The system spans **two repositories**:

| Repository | What it is | Stack |
|---|---|---|
| [`ascientehub-frontend`](https://github.com/Asciente-rks/ascientehub-frontend) | Tauri 2 desktop launcher (Windows) | Rust shell + React 18 + TypeScript + Tailwind |
| [`ascientehub-backend`](https://github.com/Asciente-rks/ascientehub-backend) | Serverless REST API | Node.js 18 + TypeScript + Express 5 + Sequelize |

---

## Live Demo

- **🪟 Download (Windows installer):** [`ascientehub_0.1.0_x64-setup.exe`](https://github.com/Asciente-rks/ascientehub-frontend/releases/download/v1.0.2/ascientehub_0.1.0_x64-setup.exe) (v1.0.2, ~4 MB)
- **📦 All releases:** [github.com/Asciente-rks/ascientehub-frontend/releases](https://github.com/Asciente-rks/ascientehub-frontend/releases)

> **First time?** Windows SmartScreen will warn (unsigned binary) — click **More info → Run anyway**. The launcher creates a desktop shortcut and stores installed games in `%APPDATA%/com.ascientehub.app/games/<slug>/`.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Database Design](#database-design)
5. [Repository Layout](#repository-layout)
6. [API Reference](#api-reference)
7. [Authentication & Credentials](#authentication--credentials)
8. [Deployment](#deployment)
9. [Cost Breakdown](#cost-breakdown)
10. [Local Development](#local-development)
11. [Author](#author)

---

## What It Does

- **Browse a real game catalog** — anonymous users hit `/api/public/games` (Redis-cached) for the storefront listing.
- **Add to cart, check out** — multi-game checkout via PayMongo with **3-D Secure automatic** for card payments.
- **Save cards** — PayMongo payment-method tokenization (`paymongoId` only — no PAN ever stored).
- **Install games via the launcher** — the Tauri shell downloads a ZIP from R2, validates the `PK` magic bytes, extracts to per-user app-data, finds the first `.exe`, and spawns it.
- **Three-tier role model** — players, developers (gated by admin approval), admins.
- **Developer flow** — apply → admin approves → submit games (status `pending` → `approved`) → upload thumbnails / gallery / trailer / `.zip` installers via R2.
- **Admin moderation** — approve developer applications, approve/reject games, ban users.
- **OTP-driven auth** — email verification, password reset, account-deletion confirmation (Resend + nodemailer fallback).
- **Production-grade serverless backend** — Lambda Function URL, cold-start hardened, auto-healing schema migration on boot.

---

## Architecture

```
┌────────────────────────────┐
│ Windows Desktop (Tauri 2)  │
│  • Rust shell              │
│  • React 18 SPA inside     │
│  • react-router 6          │
│  • Tailwind 3              │
└──────────┬─────────────────┘
           │ HTTPS (axios + JWT)
           │
           ▼
┌────────────────────────────┐
│  AWS Lambda Function URL    │
│  ascientehub-backend        │
│  Express 5 via              │
│  @vendia/serverless-express │
└──┬──────┬──────┬──────┬──┬──┘
   │      │      │      │  │
   │      │      │      │  └────► Resend / nodemailer (OTP email)
   │      │      │      │
   │      │      │      └────► PayMongo API (3DS card)
   │      │      │
   │      │      └────► Cloudflare R2 (S3-compatible)
   │      │             • thumbnails, trailers, gallery
   │      │             • game installer ZIPs
   │      │
   │      └────► Redis / ioredis
   │             • global rate limit
   │             • 1h cache on /api/public/* and /api/games[/:id]
   │
   └────► TiDB Cloud Serverless (MySQL-compatible, SSL)

           ▲
           │ (Tauri client downloads installer ZIP directly)
           │
   Game .zip → /Users/<you>/AppData/Roaming/
              com.ascientehub.app/games/<slug>/
              → walkdir finds *.exe → spawn child process
```

**Notable architectural choices:**

- **Lambda cold-start hardening** in `src/lambda.ts`: `OPTIONS` preflights short-circuit before DB init, the Sequelize connection is cached at module scope, and `ensureGameSchema()` adds optional columns (`installerUrl`, `videoUrl`) idempotently on cold starts so deployments tolerate stale schemas.
- **Public-GET cache** (Redis, 1h TTL) on `/api/public/*`, `/api/games`, and `/api/games/:id` — only when no auth headers are present, so authenticated users always see fresh data.
- **CORS headers force-injected** on every response (including 5xx), so the desktop client never sees a missing-CORS error.
- **Direct R2 uploads** capped at **50 MB** — larger installers should be uploaded out-of-band to R2 and the resulting URL stored in `games.installerUrl`.

---

## Tech Stack

### Backend (`ascientehub-backend`)

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 18 + TypeScript 6 | Serverless-friendly, mature ecosystem |
| Framework | Express 5 | Familiar, swappable, works fine in Lambda |
| Lambda adapter | `@vendia/serverless-express` | Maps API Gateway / Function URL events to Express |
| ORM | Sequelize 6 | Models + associations + migrations in one package |
| Database | TiDB Cloud Serverless | MySQL wire-compatible, **5 GB free**, no cold start |
| Driver | `mysql2` | Required for TiDB compatibility |
| Auth | JWT (`jsonwebtoken`) + bcrypt | Stateless, standard |
| Validation | Yup | Tiny, ergonomic, no plugin churn |
| Object storage | Cloudflare R2 via `@aws-sdk/client-s3` | **Zero egress fees**, S3-compatible API |
| Uploads | Multer + R2 | Multipart on the way in, S3 PUT on the way out |
| Email | Resend + nodemailer fallback | Resend free 100/day, fallback for SMTP |
| Cache + rate limit | Redis via `ioredis` + `node-cache` fallback | Cheap, fast, free tier (Upstash) |
| Payments | PayMongo REST (PHP, 3DS auto) | Local PH provider, free signup |
| Test | Jest + Supertest | Standard Node testing |
| CI/CD | GitHub Actions → `aws lambda update-function-code` | Free for private repos under monthly limits |

### Frontend (`ascientehub-frontend`)

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop shell | Tauri 2 (Rust 2021) | ~5 MB binary vs Electron's 100+ MB |
| UI framework | React 18 + TypeScript 4.9 | Familiar, fast to iterate in |
| Build | `react-scripts` (CRA) | Just enough for an SPA |
| Routing | `react-router-dom` 6 | Nested route layouts |
| Styling | Tailwind CSS 3 | Utility classes scale better than CSS modules |
| HTTP | axios | Interceptors for JWT refresh / error handling |
| Tauri Rust deps | `reqwest`, `zip`, `tokio`, `walkdir`, `webbrowser` | Streaming downloads, ZIP extraction, OS-default browser |
| Distribution | Portable Windows ZIP + signed installer (.exe) | GitHub Releases (free) — no app-store gatekeepers |

---

## Database Design

All primary keys are UUID v4. Relationships are wired in `src/models/associations.ts`. Schema is managed by Sequelize `sync()` plus a defensive `ensureGameSchema()` step on cold start that adds optional columns idempotently.

### `users`
Player, developer, and admin accounts. `roleId` references `roles`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | UUIDv4 |
| `username` | VARCHAR | unique |
| `email` | VARCHAR | unique, validated |
| `password` | VARCHAR | bcrypt hash, nullable for OAuth |
| `roleId` | UUID (FK → roles.id) | not null |
| `isVerified` | BOOLEAN | default false |
| `isBanned` | BOOLEAN | default false |
| `avatarUrl` | VARCHAR | R2 URL, optional |
| `provider` | ENUM | `'local' \| 'google'`, default `'local'` |
| `status` | ENUM | `'active' \| 'pending' \| 'rejected'` (developer-application gate) |
| `rejectionReason` | TEXT | optional |
| `canReapplyAt` | DATETIME | re-apply cooldown |

### `roles`
Three roles seeded at boot: `User`, `Developer`, `Admin`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `name` | VARCHAR | unique |

### `categories`
Game categories (Action, RPG, etc.).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `name` | VARCHAR | unique |
| `slug` | VARCHAR | unique, URL-safe |
| `description` | TEXT | optional |

### `games`
The catalog. Slug auto-generated from title in a `beforeValidate` Sequelize hook.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `title` | VARCHAR | not null |
| `slug` | VARCHAR | unique, lowercase + dashed |
| `description` | TEXT | not null |
| `basePrice` | DECIMAL(10,2) | PHP, not null |
| `salePrice` | DECIMAL(10,2) | optional |
| `onSale` | BOOLEAN | default false |
| `saleEndsAt` | DATETIME | optional |
| `sizeInGb` | FLOAT | not null |
| `developerId` | UUID (FK → users.id) | not null |
| `categoryId` | UUID (FK → categories.id) | not null |
| `status` | ENUM | `'pending' \| 'approved' \| 'rejected'` (admin moderation) |
| `rejectionReason` | VARCHAR | optional |
| `thumbnailUrl` | VARCHAR | R2 URL, not null |
| `installerUrl` | TEXT | R2 URL of `.zip`, optional |
| `videoUrl` | VARCHAR | R2 URL of trailer, optional |

### `game_media`
Per-game gallery (screenshots + trailers). One game has many media rows.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `gameId` | UUID (FK → games.id) | not null |
| `url` | VARCHAR | R2 URL |
| `type` | ENUM | `'image' \| 'video'`, default `'image'` |
| `isFeatured` | BOOLEAN | one per game shown as gallery hero |

### `libraries`
Junction table — a row here means "user owns this game". `purchaseDate` overrides `createdAt`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK → users.id) | not null |
| `gameId` | UUID (FK → games.id) | not null |
| `purchaseDate` | DATETIME | aliased from `createdAt` |

### `carts`
Items the user hasn't purchased yet.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK → users.id) | not null |
| `gameId` | UUID (FK → games.id) | not null |

### `transactions`
Financial audit trail — one row per attempted/successful charge.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK → users.id) | not null |
| `gameId` | UUID (FK → games.id) | not null |
| `amount` | DECIMAL(10,2) | PHP, not null |
| `status` | ENUM | `'pending' \| 'completed' \| 'failed'` |

### `reviews`
1-5 rating + comment, per (user, game) pair.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK → users.id) | not null |
| `gameId` | UUID (FK → games.id) | not null |
| `rating` | TINYINT | 1-5, validated |
| `comment` | TEXT | not null |

### `payment_methods`
Tokenized cards. **No PAN ever stored** — only the PayMongo handle and display metadata.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK → users.id) | not null |
| `paymongoId` | VARCHAR | unique, the PayMongo payment-method ID |
| `type` | VARCHAR | `'card'` etc. |
| `brand` | VARCHAR | `'visa'`, `'mastercard'`, etc. |
| `last4` | VARCHAR | display only |
| `expMonth` / `expYear` | INTEGER | display only |
| `isDefault` | BOOLEAN | default false |

### `subscriptions`
"Pay-to-publish" plan for developer accounts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `developerId` | UUID (FK → users.id) | not null |
| `status` | ENUM | `'active' \| 'expired'` |
| `nextBillingDate` | DATETIME | not null |

### `otps`
6-character codes for verification, password reset, account deletion. **Keyed by email** (not userId) so verification works *before* the user record exists.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `email` | VARCHAR | validated |
| `code` | VARCHAR(6) | 6 chars |
| `type` | ENUM | `'verification' \| 'password_reset' \| 'account_deletion'` |
| `expiresAt` | DATETIME | enforced |

---

## Repository Layout

### Backend tree

```
ascientehub-backend/
├── .github/workflows/deploy-lambda.yml   # CI/CD → AWS Lambda
├── .sequelizerc                           # paths for sequelize-cli
├── jest.config.js
├── tsconfig.json
└── src/
    ├── app.ts                             # Express app + route registration
    ├── lambda.ts                          # AWS Lambda handler (cold-start hardened)
    ├── index.ts                           # Local dev entrypoint
    ├── config/                            # db.config.ts, constants.ts
    ├── controllers/                       # admin, auth, cart, category, developer,
    │                                      # game, meta, payment, review, upload, user
    ├── services/                          # business logic per domain
    ├── repositories/                      # Sequelize query layer
    ├── routes/                            # Express routers (mounted under /api/*)
    ├── models/                            # 12 Sequelize models + associations.ts
    ├── middlewares/                       # auth, role, validator, upload, rateLimit
    ├── schemas/                           # Yup validation schemas
    ├── seeders/                           # roles, categories, production-user
    ├── scripts/                           # provision, seed, seed-demo-game
    ├── dtos/                              # Data transfer types
    └── utils/                             # caching (Redis), mailer
```

### Frontend tree

```
ascientehub-frontend/
├── AscienteHub-v1.0.0-windows-portable.zip  # Shipped binary
├── postcss.config.js / tailwind.config.js
├── public/index.html
├── src-tauri/                                # Rust desktop shell
│   ├── Cargo.toml
│   ├── tauri.conf.json                       # 1280×720 window
│   └── src/main.rs                           # download_and_extract_game,
│                                             # launch_game, open_external_url
└── src/
    ├── App.tsx                                # Route table
    ├── api/apiClient.ts                       # Axios instance + interceptors
    ├── components/                            # GameCard, Sidebar, Topbar,
    │                                          # RequireAuth, RequireRole, ...
    ├── context/                               # Auth, Theme, Registration
    ├── pages/
    │   ├── auth/                              # SignIn, Register, Verify,
    │   │                                      # Forgot, ResetPassword
    │   ├── Home.tsx, Games.tsx, GameDetail.tsx
    │   ├── Cart.tsx, Library.tsx, PurchaseHistory.tsx
    │   ├── Profile.tsx, ChangePassword.tsx,
    │   │   ApplyDeveloper.tsx,
    │   │   RequestDeletion.tsx, ConfirmDeletion.tsx
    │   ├── ManageGames.tsx, ManageGameDetail.tsx        # developer
    │   └── AdminPendingDevelopers.tsx,
    │       AdminPendingGames.tsx, AdminUsers.tsx        # admin
    ├── services/                              # one axios wrapper per domain
    ├── styles/tailwind.css
    └── utils/                                 # tauriRuntime, jwtHelpers,
                                               # roleHelpers, formatters,
                                               # uploadProxy
```

---

## API Reference

The Express app mounts ten route groups plus a health check.

| Prefix | Auth | Surface |
|---|---|---|
| `GET /health` | none | Liveness probe |
| `/api/public` | none | Catalog browsing (anonymous, **Redis-cached 1h**) |
| `/api/auth` | none for login/register | Login, register, OTP verify, forgot/reset password |
| `/api/users` | JWT | Profile, password change, deletion flow |
| `/api/games` | JWT | Game CRUD (developer + admin scoped) |
| `/api/cart` | JWT | Add / remove / list cart items |
| `/api/reviews` | JWT | Post and read reviews |
| `/api/developer` | JWT | Apply, manage own games, view stats |
| `/api/admin` | JWT + admin | Moderation surfaces |
| `/api/payments` | JWT (except webhook) | PayMongo flows + saved methods |
| `/api/uploads` | JWT | Multipart uploads → Cloudflare R2 |

### Selected payment endpoints

```
POST   /api/payments/sources              tokenize card → PayMongo source
POST   /api/payments/checkout             checkout entire cart in one charge
POST   /api/payments                      single-game purchase
POST   /api/payments/complete             finalize 3DS-authorized payment
GET    /api/payments/methods              list saved cards
PUT    /api/payments/methods/:id/default  set default card
DELETE /api/payments/methods/:id          remove saved card
GET    /api/payments/:paymentId           poll payment status
POST   /api/payments/webhook              PUBLIC — PayMongo callbacks
```

---

## Authentication & Credentials

The launcher uses **email-based OTP verification** for new accounts.

### Seeded production accounts

`npm run seed:production` (or `npm run seed-demo-game:production`) creates these accounts. All share the same password.

| Username | Email | Role | Password |
|---|---|---|---|
| `Admin1` | `admin1@example.com` | Admin | `Password123` |
| `Developer1` | `developer1@example.com` | Developer | `Password123` |
| `Buyer1` | `buyer1@example.com` | User | `Password123` |

> Seeded users are pre-verified (`isVerified: true`) so you can sign in immediately without an OTP.

### Self-registration flow

1. Open the launcher → **Sign Up**.
2. Enter username, email, password.
3. Receive a **6-digit OTP** by email (Resend → check spam folder).
4. Enter OTP → account becomes `isVerified: true`.
5. Sign in.

Other auth flows: forgot password, change password, soft account deletion (OTP-confirmed).

---

## Deployment

### Backend → AWS Lambda

CI/CD lives at `.github/workflows/deploy-lambda.yml`:

```
push to main
   ↓
checkout → setup-node@18 → npm ci → npm run build (tsc)
   ↓
zip dist/* + node_modules + package.json + lockfile → function.zip
   ↓
aws lambda update-function-code --function-name ascientehub-backend
```

AWS credentials and region are injected from GitHub repo secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

The Lambda is exposed via a **Function URL** with `AuthType: NONE` (CORS handled in app).

### Database → TiDB Cloud Serverless

MySQL-wire-compatible, accessed via `mysql2` over TLS. Pool sized for serverless: `max: 5`, `min: 0`, `acquire: 30 s`, `idle: 10 s`. The 5 GB free tier handles small-to-medium workloads with no cold-start penalty.

### Storage → Cloudflare R2

Standard S3 SDK with `region: "auto"`, `forcePathStyle: true`. Direct uploads from Lambda are capped at **50 MB** per file. Game installers larger than that should be uploaded directly to R2 (e.g. via `rclone` or the dashboard) and the resulting URL stored in `games.installerUrl`.

### Frontend → GitHub Releases

`src-tauri/` builds a self-contained Windows binary. The signed installer (`ascientehub_0.1.0_x64-setup.exe`, ~4 MB) is published to GitHub Releases for direct download.

To rebuild: `npm run build` produces the React bundle in `build/`, then `cargo tauri build` (or `tauri build` via `@tauri-apps/cli`) packages the desktop binary against `tauri.conf.json`.

---

## Cost Breakdown

> **Designed for $0/month forever** on free tiers across the entire stack. Production-grade infra at zero recurring cost.

| Service | Free tier | We use | Headroom |
|---------|-----------|--------|----------|
| **AWS Lambda** | 1M invocations/mo + 400K GB-s | ~5K invocations/mo | **99.5%** |
| **TiDB Cloud Serverless** | 5 GB storage, 250M RU/mo | <100 MB | **98%+** |
| **Cloudflare R2** | 10 GB storage, 1M Class A ops, **zero egress** | <1 GB | **90%+** |
| **Redis** (Upstash) | 10K commands/day | ~1K cmds/day | **90%** |
| **Resend** | 3K emails/mo, 100/day | ~20/day during testing | **80%+** |
| **PayMongo** | Free signup, no monthly fee | only transaction % | n/a |
| **GitHub Actions** (private) | 2000 min/mo (Pro: more) | ~10 min/mo | **99.5%** |
| **GitHub Releases** | unlimited public assets | <50 MB total | unlimited |

**Total: $0/month**, with massive headroom on every line.

**Why each free tier was chosen:**

- **AWS Lambda over a long-running server** — pay only for actual invocations; idle launcher users cost zero.
- **TiDB over RDS / Aurora** — RDS free tier expires after 12 months; TiDB Cloud's free tier is **perpetual**, no expiry.
- **R2 over S3** — S3 charges per-GB egress; R2 is **zero egress**, which matters when shipping installer ZIPs to end users.
- **Resend over SES** — SES requires production-mode approval and a verified domain; Resend works out of the box with a higher daily ceiling.
- **PayMongo over Stripe** — local PH provider, lower cards-not-present fees, native PHP currency, no FX conversion.

---

## Local Development

### Backend

```bash
git clone https://github.com/Asciente-rks/ascientehub-backend.git
cd ascientehub-backend
npm install

# Create .env.development with the variables below
npm run dev          # nodemon src/index.ts on port 3001
```

Useful scripts:

```bash
npm run dev                       # local dev server (nodemon)
npm run build                     # tsc → dist/
npm test                          # Jest, single-thread
npm run provision                 # first-time DB bootstrap
npm run seed                      # all seeders (roles, categories, demo user)
npm run seed:production           # production-safe subset
npm run seed-demo-game            # populate the catalog with the flagship + dummy games
npm run seed-demo-game:production # production variant
```

### Frontend

```bash
git clone https://github.com/Asciente-rks/ascientehub-frontend.git
cd ascientehub-frontend
npm install

# Web-only dev (browser, points at backend)
npm start             # CRA dev server on port 3001

# Full desktop dev (requires Rust toolchain + Tauri prereqs)
npx tauri dev         # spawns the Tauri shell against the dev server
```

`tauri.conf.json` is configured to load the React dev server from `http://localhost:3001`. For production builds: `npm run build && npx tauri build`.

### Environment Variables

**Backend** (`.env.development` / `.env.production`):

```env
# Database (TiDB Cloud Serverless)
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=4000

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
LAMBDA_UPLOAD_URL=        # optional, for offloaded large uploads

# Redis
REDIS_URL=

# PayMongo
PAYMONGO_SECRET_KEY=
PAYMONGO_PUBLIC_KEY=
```

**Frontend** (`.env.development` / `.env.production`):

```env
REACT_APP_API_URL=http://localhost:3001    # or your Lambda Function URL
```

---

## Author

Built by **Ralph Kenneth F. Sonio** ([@Asciente-rks](https://github.com/Asciente-rks)) — full-stack engineering and game development. The flagship title in the catalog is the author's own indie game, *The Last Light*, an extended tutorial-horror project built on User1 Productions' Unity 3D series.
