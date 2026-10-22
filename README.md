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
