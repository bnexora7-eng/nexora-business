# ALPINOSS API — pre-production backend

This service is the server-side API for ALPINOSS's account, subscription, Community, Marketplace, Business workspace and Payment Integrity prototype. It is deployed on Render in Frankfurt and uses PostgreSQL 18.

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

## Project fees and payment readiness

ALPINOSS has no monthly membership, recurring platform fee or mandatory subscription. Accounts are free. Customers first discuss a defined service, receive an agreed written scope and one-time project quotation, and only then may pay for that specific project.

- `POST /v1/subscriptions/checkout` — permanently disabled for the current product model; returns HTTP 410.
- `POST /v1/payments` — one-off Mollie checkout is fail-closed by default. It returns HTTP 503 with `one_off_payments_disabled` unless `ENABLE_ONE_OFF_PAYMENTS=true` is explicitly set after all business, legal, provider and operational release gates have passed.
- `POST /v1/payments/mollie-webhook` and `GET /v1/payments/{order_id}` — legacy provider reconciliation/status routes; they do not enable checkout by themselves.
- `GET /v1/subscriptions/me` and `POST /v1/subscriptions/cancel` — legacy compatibility routes only; no new subscription is sold or required.

Do not set `ENABLE_ONE_OFF_PAYMENTS=true` as part of routine deployment. Live payment activation additionally requires provider merchant approval, a confirmed business bank account, approved customer terms, correct VAT/invoicing treatment, end-to-end sandbox tests, webhook reconciliation, refunds/disputes handling, backup/restore verification and an explicit owner decision. The Mollie API key must remain server-side in Render. PayPal is excluded.

The initial public price list is indicative, not an automatic charge: €149 business analysis; €295 AI assistant prototype; €495 business-specific AI prototype; system integration from €950; €950–€2,500 multi-step automation; €5,000–€15,000+ individually scoped enterprise work. Final price and deliverables require written agreement and feasibility review.

## Product routes

- `GET/POST /v1/community/posts` — public read preview; authenticated accounts can publish in the current free-access mode.
- `GET/POST /v1/marketplace/listings` — public read preview; authenticated accounts can publish; checkout/escrow is not implemented.
- `GET/PUT /v1/business/workspace` — authenticated account workspace.
- `POST /v1/business/ai-plan` — authenticated route; requires a server-side AI provider key and explicit budget controls.
- `POST /v1/events` — signed provider event screening with HMAC-SHA256, timestamp checks and idempotency.
- `POST /v1/demo/events` — simulated browser-demo events only when the public demo is enabled and restricted to its configured origin.

AI planning stays unavailable unless a provider key and monthly token budget are configured. The deterministic Payment Integrity rules are a prototype, not machine learning or certified fraud detection.

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
