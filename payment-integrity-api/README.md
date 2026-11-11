# NEXORA Payment Integrity API — prototype backend

This pre-production API includes server-side screening, HMAC webhook authentication, PostgreSQL persistence, idempotency and a screening audit table. The browser demo can call a separate, rate-limited sandbox endpoint after deployment.

## Endpoints
- GET /health checks API and database connectivity.
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
