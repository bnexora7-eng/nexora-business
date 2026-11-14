# NEXORA API — pre-production backend

This service is the server-side API for NEXORA's account, subscription, Community, Marketplace, Business workspace and Payment Integrity prototype. It is deployed on Render in Frankfurt and uses PostgreSQL 18.

**Release status:** pre-production only. The API is not a regulated payment service or certified fraud-detection product. Do not process real customer payment or banking data until the release gates in `docs/PRODUCTION_READINESS_MASTER.md` have passed.

## Runtime and local development

- Node.js 22 (Node.js 20+ supported by the package declaration)
- PostgreSQL 18 recommended; the integration suite runs against PostgreSQL 18
- Install dependencies with `npm ci`
- Set environment variables using `.env.example` as a reference; never commit real secrets
- Run tests with `npm test`
- Start with `npm start`
- The Docker image uses `npm ci --omit=dev` and runs as the unprivileged `node` user

The committed `package-lock.json` pins the API dependency tree. Keep it synchronized with `package.json`.

## Health and readiness

- `GET /health` — process health
- `GET /ready` — readiness check; returns ready only when PostgreSQL is connected

## Account endpoints

- `POST /v1/auth/register` — creates a pending account and sends a 24-hour email-verification link; does not issue a session
- `POST /v1/auth/verify-email` — consumes a one-time verification token
- `POST /v1/auth/resend-verification` — sends a replacement link for an unverified account without revealing whether an email exists
- `POST /v1/auth/login` — issues a 30-day bearer session only after email verification
- `GET /v1/auth/me` — current verified account
- `POST /v1/auth/logout` — revokes the current session
- `POST /v1/auth/request-password-reset` — non-enumerating password-reset request; token lifetime is one hour
- `POST /v1/auth/reset-password` — consumes a one-time token, changes the password and revokes all active sessions
- `DELETE /v1/auth/account` — deletes the authenticated account and associated content
- `POST /v1/auth/delete-request` — web account deletion using account email and password

Passwords are stored as salted scrypt hashes. Session and email-action tokens are stored as SHA-256 hashes. Authentication routes use a PostgreSQL-backed rate limiter. Account deletion fails closed when Mollie payments or subscriptions cannot be safely reconciled and canceled.

Transactional email is sent through the Brevo HTTPS API when `BREVO_API_KEY` and a verified `BREVO_FROM` sender are configured. SMTP variables remain for environments that permit outbound SMTP; Render Free web services block outbound SMTP ports 25, 465 and 587.

## Membership and billing

- `POST /v1/subscriptions/checkout` — starts the first €29.99 EUR All Access payment through Mollie
- `GET /v1/subscriptions/me` — returns the server-confirmed entitlement state
- `POST /v1/subscriptions/cancel` — cancels the recurring Mollie subscription while preserving paid-through access
- `POST /v1/payments/mollie-webhook` — retrieves payment details from Mollie and reconciles the provider state; browser redirects alone never grant access
- `POST /v1/payments` — generic one-off payment endpoint
- `GET /v1/payments/{order_id}` — status of an authenticated user's own order

Mollie checkout requires a server-side API key. Live payments additionally require `ENABLE_LIVE_PAYMENTS=true`; keep this disabled until merchant onboarding, legal/business setup and end-to-end test-mode verification are complete. Do not expose credentials in the mobile app.

The Android client intentionally blocks external Mollie checkout. Android subscriptions remain unavailable until Google Play Billing is implemented or NEXORA is accepted into the applicable EEA alternative-billing program and its APIs/reporting/customer-support requirements are completed.

## Product routes

- `GET/POST /v1/community/posts` — public read preview; publishing requires active All Access
- `GET/POST /v1/marketplace/listings` — public read preview; publishing requires active All Access; checkout/escrow is not implemented
- `GET/PUT /v1/business/workspace` — authenticated All Access workspace
- `POST /v1/business/ai-plan` — All Access gated; requires a server-side AI provider key and explicit budget controls
- `POST /v1/events` — signed provider event screening with HMAC-SHA256, timestamp checks and idempotency
- `POST /v1/demo/events` — simulated browser-demo events only when the public demo is enabled and restricted to its configured origin

AI planning stays unavailable unless a provider key and monthly token budget are configured. The deterministic Payment Integrity rules are a prototype, not machine learning or certified fraud detection.

## Security and data boundaries

- HTTPS is required for public use.
- Request bodies and identifiers are bounded; provider events require HMAC-SHA256 authentication and a five-minute timestamp window.
- Provider event IDs are idempotent in PostgreSQL.
- Authenticated writes and paid feature routes enforce server-side identity and All Access entitlement.
- Mollie webhook state is re-fetched from the provider; amounts/currency are checked before entitlement changes.
- Secrets, database URLs, customer records, payment credentials and backup encryption keys must never be committed or written to public logs.
- Database migrations must be reviewed and backed up before deployment.

## Deployment and operations

Render service: `nexora-payment-integrity-api` (Frankfurt). Health check: `/ready`. The currently attached Free PostgreSQL 18 database is temporary and expires on 12 December 2026; it has no automated backups or point-in-time recovery. A separate encrypted backup runner is prepared but not yet deployed. The first actual backup and a restore to a separate recovery database remain mandatory before production launch.

See:
- `docs/ACCOUNT_EMAIL_SETUP.md`
- `docs/POSTGRESQL_BACKUP_AND_MIGRATION.md`
- `docs/ALL_ACCESS_SUBSCRIPTION_PLAN.md`
- `docs/TERMS_AND_SUBSCRIPTION_DISCLOSURES_DRAFT.md` (internal draft only)
- `docs/PRODUCTION_READINESS_MASTER.md`

Do not describe the API as production-ready until backup/restore, live provider sandbox lifecycle, account/email end-to-end testing, security review, monitoring, legal/business readiness and release-specific acceptance tests are complete.
