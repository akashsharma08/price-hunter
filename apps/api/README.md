# @price-hunter/api

NestJS API for PRICE HUNTER (Phase 2).

## Stack

- NestJS + TypeScript
- PostgreSQL + Prisma
- JWT access tokens + refresh token rotation
- Swagger at `/docs`

## Setup

1. Ensure PostgreSQL is running and create a database:

```bash
createdb price_hunter
```

2. Copy environment:

```bash
cp .env.example .env
```

3. Migrate + seed demonstration catalog:

```bash
npm run db:setup -w @price-hunter/api
```

4. Start:

```bash
npm run dev:api
```

API: `http://localhost:3001/api/v1`  
Swagger: `http://localhost:3001/docs`

## Demo credentials

- Email: `akash@example.com`
- Password: `password123`

Seeded prices are **demonstration data**, not live retailer feeds.

## Key modules

Auth, Users, Products, Categories, Retailers, Pricing, Watchlist, Alerts, Notifications, Integrations.

## Phase 3 providers

See `docs/RETAILER_API_RESEARCH.md`.

Adapters implement `RetailerProvider` (`searchProducts`, `getProductDetails`, `getCurrentPrice`, `getAvailability`).

Without credentials, providers report `liveReady: false` and refuse to invent prices:

```bash
curl http://localhost:3001/api/v1/integrations/status
```

To enable a live provider after affiliate approval, set the corresponding env vars and `*_ENABLED=true`, then call the admin refresh endpoints.
