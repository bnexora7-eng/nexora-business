# NEXORA Payment Integrity API — prototype backend

This pre-production API scaffold adds server-side screening, HMAC webhook authentication, PostgreSQL persistence, idempotency and a screening audit table to the browser-only demo.

## Endpoints
- GET /health checks API and database connectivity.
- POST /v1/events accepts provider events as JSON.
- HMAC-SHA256 signature headers: x-nexora-timestamp and x-nexora-signature (sha256=<hex>).
- Sign the exact request bytes as HMAC-SHA256(timestamp + "." + rawBody).
- Rejects unknown providers, invalid signatures and timestamps outside a five-minute window.
- Uses a database unique constraint on (provider_id, event_id) for idempotency.
- Persists the first screening result and every authenticated attempt in separate tables.

## Local run
Requirements: Node.js 20+ and PostgreSQL 16+.
1. Create a database and apply src/schema.sql.
2. Copy .env.example and set a strong provider secret and database URL.
3. Export those environment variables in your shell.
4. Run npm install, npm test, then npm start.
Alternatively, run docker compose up --build. Replace all example secrets before exposing the service outside localhost.

## Scope and security
This is a prototype scaffold, not a certified payment service or production fraud-detection system. It does not connect to banks, payment processors or real provider accounts. The static Pages demo is separate and does not call this API. The rule engine is deterministic, not machine learning.
Before production: use a managed secret store, secret rotation and revocation, TLS, rate limiting, monitoring, retention controls, database migrations, integration tests, privacy/legal review and a secured deployment. Do not use real payment or personal data in this prototype.
Do not claim this backend is deployed or live until it has been configured and tested against PostgreSQL on a secured host.