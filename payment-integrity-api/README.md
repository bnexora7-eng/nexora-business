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

- GET /v1/catalogue/products returns the server-owned product catalogue. A product is purchasable only when its database row is explicitly active and has a configured USD price.
- GET /v1/payments/checkout requires a signed-in account and returns the configured Gumroad product URL only when the server-owned product is active and the catalogue price exactly matches the configured Gumroad price.
- POST /v1/payments/gumroad-ping?secret=... treats the Ping only as a notification. The server retrieves the sale from Gumroad's Sales API and verifies the sale ID, seller, product, buyer email and exact price before granting access.
- A product entitlement is granted only for a verified eligible sale. Duplicate notifications are idempotent by provider + sale ID. Full refunds, chargebacks and unresolved disputes revoke access.
- GET /v1/account/products returns only the signed-in user's non-revoked product access.
- The initial Payment Integrity catalogue entry is intentionally inactive and has no price. It must remain unavailable until its deliverable, commercial price, payment provider configuration and gated product experience are ready. Do not activate it or enable live payments as a shortcut.
- The current public demo remains a preview using synthetic events. It is not the paid product and is not a production fraud-prevention service.

## Private customer workspace

- GET and POST /v1/account/payment-integrity/events require a valid NEXORA bearer session and an active `payment-integrity` entitlement.
- POST accepts normalized synthetic event fields only. Decisions are deterministic ACCEPT / REVIEW / REJECT rules, not machine learning or verified fraud detection.
- Events are persisted in `customer_screenings`, scoped to the authenticated account, and deduplicated by (user_id, provider_id, event_id).
- GET returns only the signed-in user's latest 100 events.
- The static customer workspace is `/account/payment-integrity.html`; its API access is enforced server-side, so opening the URL alone does not grant access.
- The catalogue item remains inactive and unpriced until the paid deliverable and checkout provider are configured. Do not enable a live product or payments before those steps and end-to-end verification.

## Gumroad checkout and verified sales

Required server-only values: `GUMROAD_ACCESS_TOKEN`, `GUMROAD_PRODUCT_ID`, `GUMROAD_PRODUCT_URL`, `GUMROAD_EXPECTED_SELLER_ID`, `GUMROAD_EXPECTED_PRICE_CENTS`, `GUMROAD_PING_SECRET`, and `GUMROAD_PING_URL`. Never put these values in the browser or commit them to Git.

The Gumroad Settings Ping is not payment proof. The receiver uses only the sale ID from the Ping, then retrieves the sale through Gumroad's API and validates the returned record. Configure sale, refund, dispute and dispute_won resource subscriptions by running `npm run gumroad:subscribe` in a private server environment with the access token and final Ping URL. The buyer must use the same email for Gumroad checkout and their NEXORA account.

Full refunds, chargebacks and unresolved disputes revoke access. Partial refunds do not automatically revoke access. Use Gumroad's official test-purchase flow; do not buy your own product with a real card. A test purchase grants no NEXORA access unless the Gumroad Sales API returns a verifiable matching sale record.
