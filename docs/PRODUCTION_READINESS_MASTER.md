# NEXORA — Production Readiness Master Record

**Record opened:** 14 November 2026  
**Product decision:** NEXORA remains an owner-operated platform.  
**Membership target:** NEXORA All Access — €29.99/month.  
**Current release classification:** pre-production; not approved for public paid launch.

This is the controlling checklist for engineering completion, operational continuity, security, data durability, and future investment. Update it after every material code, infrastructure, test, or release change. Git commits and GitHub Actions preserve source changes and automated outcomes; this document records decisions, verified outcomes, and outstanding gates. Never store secrets, personal customer data, database dumps, or credentials here.

## 1. Non-negotiable release standard

A release is not complete merely because the homepage loads. The following user journeys must work end to end:
- Register, verify email, sign in, remain signed in safely, sign out, and recover a forgotten password.
- View and update account details; delete an account with clear consequences and proper recurring-subscription cancellation.
- Use every advertised module; save and retrieve user work; handle empty, loading, validation, offline, and server-error states.
- Purchase All Access, verify payment server-side, activate entitlement, handle renewals, duplicate/retried webhooks, failed payments, refunds/disputes where supported, cancellation, and paid-through access.
- Marketplace and any future purchase flow must define seller/buyer roles, order states, refunds, disputes, fees, delivery/fulfilment, and fraud controls before real money is accepted.
- Recover the service and its data from a verified backup, not merely restart the server.
- Have security, privacy, legal, support, monitoring, and incident-response procedures appropriate to the real service.

No live charges or real customer/payment data until applicable gates pass and the owner explicitly approves activation.

## 2. Verified foundation as of 14 November 2026

These are verified implementation/deployment facts, not a production-readiness declaration:
- Public website is deployed on GitHub Pages. Latest full public verification passed in Pages workflow run 43613792428 (commit 2c43bf27): homepage, account page, workspace, enquiry page, privacy policy, account-deletion page, live Render API health/demo decisions, and browser ACCEPT/REVIEW/REJECT checks all passed. An earlier rerun of workflow run 43613283592 failed because repeated attempts created multiple same-name artifacts; a fresh workflow run with a single artifact completed successfully.
- Node.js API is deployed on Render. Latest deployment dep-dbs8e45bedkc73bt214g for commit 2c43bf27 is live; runtime logs confirm database schema ready and API listening. Render health check path is /ready.
- Latest API CI run 43613283596 passed all 15 tests (0 failures). Production dependency audit reports 0 vulnerabilities (0 info/low/moderate/high/critical). Nodemailer was upgraded to 10.1.4 to address the previously detected high-severity advisories; CI now fails on high/critical production dependency findings.
- Account-deletion CORS preflight was corrected to allow DELETE and covered by an explicit integration test.
- PostgreSQL 18 database exists in Frankfurt on Render Free; current state was available, not suspended, with an empty external IP allowlist.
- Backend includes account registration, email-verification enforcement, login, logout, password reset, session revocation, account deletion endpoints, and database-backed authentication throttling.
- Passwords use scrypt; session tokens are random and only their SHA-256 hashes are stored.
- Account deletion removes the user and cascading user content, and detaches payment ledger records that may need legal retention. If a recurring Mollie subscription exists, backend attempts to cancel it before deleting the account.
- Community, Marketplace publishing, Business workspace writes, and AI planning are protected by a server-side All Access entitlement check. Public Community/Marketplace reads are previews.
- Mollie recurring checkout and webhook lifecycle code exists, with mock-provider integration coverage. No complete live Mollie test-mode journey has been verified; provider credentials/onboarding remain outstanding.
- AI endpoint has server-side key handling, prompt-boundary hardening, response-size cap, per-account rate limits, monthly token reservation limits, and integration tests against a mock provider. No live AI key is configured; AI remains disabled.
- Payment Integrity public demo uses synthetic events and temporary in-memory demo storage. It is not a live payment processor, bank integration, production fraud engine, or durable demo audit service.
- Existing Git history and GitHub Actions preserve source changes and automated test/deployment outcomes. They do not back up the production PostgreSQL data.

## 3. Critical data durability gate

**Current database:** Render Free PostgreSQL 18, Frankfurt.  
**Creation:** 12 November 2026.  
**Expiry:** 12 December 2026, 14:31:31 UTC.  
**Automated backups/PITR:** not available on this Free instance.  
**External IP allowlist:** empty.  
**Verified logical dump:** none recorded.  
**Restore test:** not performed.  
**Replacement database:** not provisioned.

Required before 12 December 2026:
1. Create an encrypted logical backup without exposing the database URL or opening the database to the public internet.
2. Verify the archive listing and SHA-256 checksum.
3. Restore into a separate PostgreSQL 18 database and verify schema, row counts, indexes, and application connectivity.
4. Choose and approve a durable replacement database/storage plan; do not let the Free database expire while it is the only copy.
5. Establish scheduled backups, retention, off-provider storage, access controls, and recurring restore tests.
6. Record backup timestamp, PostgreSQL version, archive size, checksum, destination, and restore-test result in a private operations record.

Never use 0.0.0.0/0 for database access. Never treat a Git commit, GitHub Actions artifact, or database snapshot that has not been restore-tested as a complete backup.

## 4. Application lifecycle and feature-completion matrix

| Area | Existing foundation | Remaining acceptance gate |
|---|---|---|
| Registration and login | Backend endpoints and automated tests | Full browser and Android journey on real devices; email delivery verified |
| Email verification | Token flow and endpoint | Production sender configured; deliverability, resend, expiry, replay and abuse tests |
| Logout and sessions | Session revocation; hashed bearer tokens | Cross-device/session policy, expiry UX, secure storage review, device tests |
| Password recovery | Reset endpoint and session revocation | Live email round trip and native Android recovery journey |
| Account deletion | Web and authenticated API endpoints | Test subscription cancellation, retries/failures, legal retention, confirmation UX, and all clients |
| Account profile | Authenticated profile endpoint | Complete profile editing and data export/rectification workflow where required |
| Community | Paid write gate and public preview reads | Full CRUD/moderation/reporting/blocking, abuse controls, privacy and regression tests |
| Marketplace | Paid listing create/read foundation | Buyer/seller flow, checkout, order lifecycle, fulfilment, refunds, disputes, fraud, seller verification; no real trading until complete |
| Business Studio | Authenticated, paid-gated workspace save/load | Verify every field, persistence, concurrency, validation, export and error recovery |
| AI planning | Secured provider-neutral integration; disabled by default | Owner-approved API key and budget, provider-side spending caps, live test, quota monitoring and failure UX |
| Payment Integrity | Synthetic demo and backend webhook screening foundation | Real provider contract, threat review, persistent audit trail, reconciliation, operational alerts and independent validation |
| All Access | €29.99/month entitlement model and preliminary Mollie code | Full test-mode lifecycle and Android billing decision; clear terms and customer self-service |
| Android | App navigation and account deletion work previously device-checked | Current APK rebuild, full regression on device, signed AAB, Play declarations and store requirements |
| Visual design | Deliberately deferred | Final responsive UI/UX, accessibility, error/empty/loading states, store assets after functional gates |

## 5. Security and auditability

Required before production:
- Threat model covering account takeover, credential stuffing, session theft, authorization bypass, IDOR, injection, XSS/CSRF, webhook spoofing/replay, payment fraud, data exfiltration, denial of service, dependency and supply-chain risks.
- Verify all authorization on the server; never trust a client-side paid/unpaid flag or checkout redirect.
- Validate inputs and bound request/response sizes; rate-limit sensitive endpoints using shared durable storage.
- Secrets only in managed secret storage; rotate keys; never commit or log credentials.
- TLS, secure headers, least-privilege database role, database network restrictions, and separate test/live credentials.
- Append-only, privacy-minimized audit events for security-sensitive and financial state changes (account/session changes, entitlement transitions, order/payment/webhook decisions, admin actions). Define retention, access, integrity protection, and deletion/anonymization rules. Do not indiscriminately log every keystroke or sensitive payload.
- Centralized error reporting, uptime/latency alerts, database capacity monitoring, payment reconciliation, and an incident-response runbook.
- Independent security review and remediation of findings before real customer data or live payment activation.

The current screening_audit table records Payment Integrity webhook decisions; it is not yet a complete platform-wide user/admin activity audit trail.

## 6. Billing, legal and customer operations

- Mollie merchant onboarding and live processing require business/provider approval; do not enable live keys or ENABLE_LIVE_PAYMENTS prematurely.
- Complete test-mode first payment, mandate/subscription creation, renewal, duplicate webhook, delayed webhook, failed renewal, cancellation, paid-through access, and account deletion.
- Decide and implement the correct Google Play Billing route for digital membership access inside the Android app. Do not assume web checkout is sufficient.
- Publish reviewed terms, privacy notice, recurring-payment disclosures, cancellation/refund/support policy, data retention schedule, operator identity/address, processor list, and cross-border data-transfer review.
- Establish VAT/tax/accounting and customer-support processes with qualified local advice.
- Do not describe marketplace listings as purchasable until the buyer/seller/payment lifecycle exists and has been tested.

## 7. Investment plan — cost approval required

No paid resource is authorized by this document. Obtain current vendor pricing and choose only after backup and workload requirements are measured.

**Potentially required for a safe launch**
- Durable managed PostgreSQL plan with automated backups/PITR appropriate to expected data and recovery objectives.
- Encrypted off-provider backup storage and scheduled backup/restore automation.
- Reliable transactional email provider and verified sender/domain.
- Monitoring/error tracking and alert delivery.
- Payment-provider fees and any required business verification/accounting costs.
- Domain and TLS/DNS costs if a custom domain is chosen.

**Scale-up investments**
- Larger database compute/storage, connection pooling, read replicas or high availability.
- Application compute with adequate memory/CPU, multiple instances and autoscaling.
- Object storage/CDN for user uploads and generated assets.
- Queue/background workers for email, notifications, media, AI and marketplace processing.
- Centralized logs, audit storage, analytics, security scanning and independent penetration testing.

**Feature-specific variable costs**
- AI provider usage, with provider-side hard budgets/alerts and application quotas.
- Email volume, payment transaction fees, storage/bandwidth, and Android/Play distribution requirements.

For each proposed purchase, record vendor, plan, monthly and annual price, included limits, overage pricing, data location, backup/retention, migration path, and reason. Present costs to the owner before creating or upgrading resources.

## 8. Release decision record

Release status remains **PRE-PRODUCTION / NOT CLEARED FOR PAID PUBLIC LAUNCH** until:
- database backup and restore are verified and expiry risk is removed;
- every advertised feature has an accurate availability classification;
- account, deletion, security and all paid journeys pass end-to-end tests on web and Android;
- payment rails and provider onboarding are verified in test mode and approved for live use;
- legal/privacy/customer operations are reviewed;
- monitoring, incident response and recurring backups are operational;
- final visual/UX review is completed.

## 9. Change log

- 2026-11-14 — Opened master readiness record; consolidated verified foundation, account lifecycle, payment/AI state, critical PostgreSQL expiry, audit requirements, and investment gates. No new paid infrastructure or live payment/AI activation authorized.
- 2026-11-14 — Fixed account-deletion DELETE CORS preflight; upgraded Nodemailer to 10.1.4; added a production dependency audit gate. API CI passed 15/15 tests and npm audit reported zero vulnerabilities. Render deployment dep-dbs8e45bedkc73bt214g is live. Fresh Pages workflow run 43613792428 passed all site, privacy/deletion, live API/demo, and browser decision checks. Earlier repeated retries produced duplicate same-name artifacts, resolved by a fresh workflow run. No paid infrastructure, live payments, or live AI were enabled.