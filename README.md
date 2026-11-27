# PRICE HUNTER

Intelligent shopping and price comparison for Indian consumers.

Compare prices across retailers, track historical movements, set target-price alerts, and discover genuine deals — starting with **smartphones**, **laptops**, and **headphones**.

> **Phase 3 status:** Provider-independent retailer adapters (Amazon Creators API + Flipkart Affiliate API), matching, normalization, and validation are implemented. **Live credentials are not configured**, so this phase is **not production-ready for live prices** until at least one authorized provider is enabled and verified. Seeded catalog data remains demonstration-only.

## Monorepo layout

```
price-hunter/
├── apps/
│   ├── web/          # React 19 + Vite + Tailwind v4 frontend
│   └── api/          # NestJS + Prisma + PostgreSQL API
├── packages/
│   └── shared/       # Shared TypeScript domain types
└── README.md
```

## Quick start

Requirements: Node.js 20+, PostgreSQL

```bash
# 1) Install
npm install

# 2) Database (once)
createdb price_hunter
cp apps/api/.env.example apps/api/.env
npm run db:setup

# 3) Run API + web (two terminals)
npm run dev:api
npm run dev:web
```

- Web: http://localhost:5173
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/docs

### Demo login

- `akash@example.com` / `password123`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Vite frontend |
| `npm run dev:api` | NestJS API (watch) |
| `npm run typecheck` | Web + API TypeScript |
| `npm run test:api` | API unit tests |
| `npm run db:setup` | Migrate + seed |

## Phase 2 API surface

- `POST /auth/register` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout`
- `GET /users/me`
- `GET /products` `GET /products/search` `GET /products/:slug` `GET /products/:id/offers` `GET /products/:id/price-history`
- `GET /categories` `GET /retailers`
- `GET|POST /users/me/watchlist` `DELETE /users/me/watchlist/:productId`
- `POST|GET /alerts` `PATCH|DELETE /alerts/:id`
- `GET /notifications`

All successful responses use:

```json
{ "success": true, "data": {}, "meta": { "page": 1, "pageSize": 12, "total": 0, "totalPages": 1 }, "error": null }
```

## Architecture notes

1. Strict separation: `apps/web`, `apps/api`, `packages/shared`
2. Prices include currency, source, verification timestamp, availability
3. `PriceHistory` rows are immutable snapshots
4. No real retailer adapters yet — seed data only
5. No API secrets in frontend code

## Phase 3 integrations

- Status: `GET /api/v1/integrations/status`
- Research notes: `docs/RETAILER_API_RESEARCH.md`
- Enable live adapters only with authorized credentials in `apps/api/.env` (`AMAZON_CREATORS_ENABLED`, `FLIPKART_AFFILIATE_ENABLED`, etc.)
- Admin refresh: `POST /api/v1/integrations/variants/:variantId/refresh` (ADMIN role)

## Next phases

- Obtain/verify affiliate credentials and confirm one live provider end-to-end
- BullMQ scheduled ingestion workers
- Alert evaluation workers
- AI buying advisor
- Sentry, structured logging, CI hardening
