# NEXORA Payment Integrity API — prototype backend

This pre-production API includes server-side screening, HMAC webhook authentication, PostgreSQL persistence, idempotency and a screening audit table. The browser demo can call a separate, rate-limited sandbox endpoint after deployment.

## Endpoints
- GET /health checks API and database connectivity.
- POST /v1/auth/register creates an account using a valid email and a 12–128 character password.
- POST /v1/auth/login verifies credentials and issues a 30-day bearer session.
- GET /v1/auth/me returns the authenticated account profile.
- POST /v1/auth/logout revokes the current bearer session.
- Passwords are stored as salted scrypt hashes; session tokens are stored only as SHA-256 hashes. Authentication requires PostgreSQL and has a basic per-IP attempt limit.
- POST /v1/events accepts authenticated provider events as JSON.
- POST /v1/demo/events accepts simulated browser-demo events only when ENABLE_PUBLIC_DEMO=true and only from DEMO_ORIGIN.
- HMAC-SHA256 signature headers for provider events: x-nexora-timestamp and x-nexora-signature (sha256=<hex>).
- Sign the exact request bytes as HMAC-SHA256(timestamp + "." + rawBody).
- Rejects unknown providers, invalid signatures and timestamps outside a five-minute window.
- Uses a database unique constraint on (provider_id, event_id) for idempotency.
- Persists the first screening result and every accepted/authenticated attempt in separate tables.
- Enforces a 64 KiB request-body limit and bounded provider, event and status identifiers.
- Persists only normalized screening fields; arbitrary customer/provider metadata is discarded.
- The public demo endpoint is restricted by Origin and has a small in-memory per-IP rate limit. This is a demo safeguard, not production-grade abuse prevention.

## Local run
Requirements: Node.js 20+ and PostgreSQL 16+.
1. Copy .env.example and set a strong provider secret and database URL.
2. Export those environment variables in your shell.
3. Run npm install, npm test, then npm start. The API initializes the idempotent SQL schema on startup.
Alternatively, run docker compose up --build. Replace all example secrets before exposing the service outside localhost.

## Sandbox deployment
See [docs/API_DEPLOYMENT.md](../docs/API_DEPLOYMENT.md) for the Render + Neon setup and verification steps. The repository-root [render.yaml](../render.yaml) defines the free sandbox web service.

## Scope and security
This is a prototype, not a certified payment service or production fraud-detection system. It does not connect to banks, payment processors or real provider accounts. The rule engine is deterministic, not machine learning. Do not use real payment or personal data.
Before production: use a managed secret store, secret rotation and revocation, TLS, stronger distributed rate limiting, monitoring, retention controls, versioned database migrations, privacy/legal review and secured deployment. Do not claim this backend is production-ready until it has been independently security-reviewed and load-tested.

## API contract

The HTTP API contract is documented in [openapi.yaml](openapi.yaml).

## Product orders and entitlements

- GET /v1/catalogue/products returns the server-owned product catalogue. A product is purchasable only when its database row is explicitly active and has a configured EUR price.
- POST /v1/payments requires a signed-in account and accepts only `product_id`. The server reads the product name and price from `product_catalog`; client-supplied amounts and descriptions are not accepted.
- Mollie webhooks are verified by retrieving the payment directly from Mollie. The order ID, provider payment ID, currency and exact amount must match the stored order.
- A product entitlement is granted only for a verified `paid` payment. The grant is idempotent by order ID.
- GET /v1/account/products returns only the signed-in user's non-revoked product access.
- The initial Payment Integrity catalogue entry is intentionally inactive and has no price. It must remain unavailable until its deliverable, commercial price, payment provider configuration and gated product experience are ready. Do not activate it or enable live payments as a shortcut.
- The current public demo remains a preview using synthetic events. It is not the paid product and is not a production fraud-prevention service.
