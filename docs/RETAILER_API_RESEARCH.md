# Retailer API research (Phase 3)

Last verified: 2026-11-27

This document records authorization, auth, rate limits, and commercial constraints for the initial adapters. **No scraping.** Live calls happen only when credentials are configured.

## Amazon India — Creators API

| Topic | Finding |
|-------|---------|
| Docs | https://affiliate-program.amazon.in/creatorsapi/docs/en-us/introduction |
| Marketplace | `www.amazon.in` · currency `INR` · languages `en_IN`, etc. |
| Operations | `SearchItems`, `GetItems`, `GetVariations`, `GetBrowseNodes` |
| Auth | OAuth 2.0 client credentials (Credential ID + Secret). India uses credential version **3.2** → token endpoint `https://api.amazon.co.uk/auth/o2/token`, scope `creatorsapi::default`. API base `https://creatorsapi.amazon` with Bearer token + `x-marketplace`. |
| Account | Must be enrolled in Amazon Associates (IN). Creators API access requires program acceptance; docs also note **≥10 qualifying sales in past 30 days** for PA API access through Creators API. |
| Partner tag | Required Associates tracking ID for the IN marketplace. |
| Rate limits | Token reuse required (1h TTL). Excessive token fetch is rate-limited. SearchItems returns up to **10** items/request. |
| Commercial / data use | Bound by Amazon Associates Operating Agreement + Creators API license. Product images/prices for affiliate promotion only; no inventing offers; deep links must use Associates tags. |
| Credentials in repo | **Not present** — adapter stays disabled until env vars are set. |

## Flipkart — Affiliate API

| Topic | Finding |
|-------|---------|
| Docs | https://affiliate.flipkart.com/api-docs/ |
| Auth | Headers `Fk-Affiliate-Id` + `Fk-Affiliate-Token` (HTTPS). One active token per affiliate account. |
| Account | Registered Flipkart Affiliate account + generated API token. |
| Endpoints used by adapter | Keyword search `GET /affiliate/1.0/search.json?query=&resultCount=` (max **10**/search). Product by ID `GET /affiliate/1.0/product.json?id=`. |
| Rate limits | **20 calls/second** per affiliate. Product feed URLs expire in **10 hours**. |
| Commercial / data use | Flipkart Affiliate API Terms of Use. Feed/product URLs include tracking; CSV dumps need manual `affid`. Confidentiality obligations on API credentials/specs. |
| Credentials in repo | **Not present** — adapter stays disabled until env vars are set. |

## Production-ready gate

Phase 3 architecture can ship without credentials, but **this phase is not production-ready for live retailer prices** until at least one authorized provider is configured and a successful live call is verified end-to-end.

## Explicit non-goals

- Website scraping
- Fabricated “live” prices
- Presenting seed/demo or stale snapshots as current live offers
