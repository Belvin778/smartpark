# SmartPark — Enterprise Smart Parking Management Platform

A production-ready Smart Parking Management System built with **Next.js 14**, **Prisma**, **SQLite/PostgreSQL**, **Tailwind CSS**, and **JWT authentication**.

## 🚀 Features

- **Cryptographic QR Credentials** — SHA-256 hashed 256-bit secure tokens, never expose sensitive data
- **Atomic Concurrency Engine** — Race-condition-proof parking entry/exit using interactive Prisma transactions
- **Real-Time SSE Dashboard** — Live occupancy telemetry via Server-Sent Events
- **Role-Based Access Control** — Vehicle Owner, Gate Operator, and System Administrator roles
- **Full Audit Trail** — Tamper-resistant log of all gate operations and admin actions
- **QR Revocation** — Instantly revoke lost/compromised parking passes

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod |
| QR | qrcode library |
| Real-time | Server-Sent Events (SSE) |

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Belvin778/smartpark.git
cd smartpark

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Set up database & seed demo data
npm run prisma:push
npm run prisma:seed

# 5. Start development server
npm run dev
```

Open **http://localhost:3000**

## 🌐 Cloud Deployment (Render & Railway)

### Option A: Render (1-Click Deployment with PostgreSQL)
This repository includes a `render.yaml` blueprint that provisions both the **Next.js Web Service** and a **free PostgreSQL Database** automatically.

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Select your repository: `Belvin778/smartpark`.
4. Click **Apply**.
Render will automatically:
- Create the PostgreSQL database.
- Connect the connection string to `DATABASE_URL`.
- Generate a secure `JWT_SECRET`.
- Push the schema & seed the demo data.
- Build and launch the web app with a free HTTPS URL!

---

### Option B: Railway (1-Click Deployment)
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Belvin778/smartpark`.
4. Click **+ New** → **Database** → **Add PostgreSQL**.
5. In your web service settings, add environment variable:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET`: Any random 32-character string
6. In **Settings** → **Deploy**, set the custom build command:
   `cp prisma/schema.postgresql.prisma prisma/schema.prisma && npx prisma db push && node scripts/seed.js && npm run build`
7. Click **Deploy**.

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@smartpark.com | Password123! |
| Operator | operator@smartpark.com | Password123! |
| Vehicle Owner | sarah.owner@example.com | Password123! |

## 📁 Project Structure

```
smartpark/
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── seed.js                # Database seeding
├── src/
│   ├── app/
│   │   ├── api/v1/            # REST API routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # Vehicle owner portal
│   │   ├── operator/          # Gate scanner console
│   │   ├── live/              # Real-time availability board
│   │   ├── history/           # Parking history
│   │   ├── login/             # Authentication
│   │   └── vehicles/          # Vehicle management & QR
│   ├── components/
│   │   └── Navbar.tsx
│   └── lib/
│       ├── auth.ts            # JWT auth utilities
│       ├── db.ts              # Prisma client singleton
│       ├── validators.ts      # Zod schemas
│       ├── events.ts          # SSE event bus
│       └── services/
│           ├── parking.service.ts   # Atomic entry/exit
│           ├── qr.service.ts        # Crypto QR engine
│           ├── audit.service.ts     # Audit logging
│           └── analytics.service.ts
├── .env.example
└── package.json
```

## 🔒 Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens stored in httpOnly cookies
- QR tokens are SHA-256 hashed before database storage
- Role-based API route protection on every endpoint
- Atomic database transactions prevent race conditions
- Full audit logging of all sensitive operations

## 🐳 Production (PostgreSQL + Docker)

Update `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartpark"
```

Switch schema: copy `prisma/schema.postgresql.prisma` → `prisma/schema.prisma`

```bash
npm run prisma:push
npm run prisma:seed
npm run build
npm start
```

## 📄 License

MIT
