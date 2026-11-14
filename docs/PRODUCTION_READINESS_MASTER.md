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
- Public website is deployed on GitHub Pages. Latest Pages workflow run 43614151602 (commit 6592909d) completed successfully after the PostgreSQL 18 CI alignment. The previous full public verification in run 43613792428 passed homepage, account/workspace/enquiry pages, privacy and account-deletion pages, live Render API/demo decisions, and browser ACCEPT/REVIEW/REJECT checks.
- Node.js API is deployed on Render. Latest deployment dep-dbs8ftm7bikc73epipl0 for commit 6592909d is live. Earlier runtime logs confirm database schema ready and API listening. Render health check path is /ready.
- API CI run 43616808694 completed successfully on 14 November 2026 against PostgreSQL 18, including the expanded integration suite and production dependency audit. The independent verification workflow 43616808693 and Render backend smoke test 43616808724 also passed on commit 48228a9136. The production dependency audit reports 0 vulnerabilities. Nodemailer 10.1.4 is installed; CI fails on high/critical production dependency findings.
- Account-deletion CORS preflight was corrected to allow DELETE and covered by an explicit integration test.
- PostgreSQL 18 database exists in Frankfurt on Render Free; current state was available, not suspended, with an empty external IP allowlist.
- Backend includes account registration, email-verification enforcement, login, logout, password reset, session revocation, account deletion endpoints, and database-backed authentication throttling.
- Passwords use scrypt; session tokens are random and only their SHA-256 hashes are stored.
- Account deletion removes the user and cascading user content, and detaches payment ledger records that may need legal retention. Before deletion, backend now queries Mollie for any linked subscription, cancels it if it is not already canceled, and fails closed if provider cancellation cannot be confirmed or a subscription is pending without a provider reference. Integration coverage exercises cancellation before deletion.
- Community, Marketplace publishing, Business workspace writes, and AI planning are protected by a server-side All Access entitlement check. Public Community/Marketplace reads are previews.
- Mollie recurring checkout and webhook lifecycle code exists, with mock-provider integration coverage. Checkout creation is serialized with a per-account PostgreSQL row lock to prevent concurrent duplicate first payments/customer creation; provider calls have a 15-second timeout. No complete live Mollie test-mode journey has been verified; provider credentials/onboarding remain outstanding.
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

The owner has approved a maximum of **$1/month for the NEXORA PostgreSQL backup Cron service only**. No other paid resource is authorized. Obtain current vendor pricing and present any additional cost before creating or upgrading resources.

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
- 2026-11-14 — Fixed account-deletion DELETE CORS preflight; upgraded Nodemailer to 10.1.4; added a production dependency audit gate. Latest API CI run 43614151644 passed 15/15 tests against PostgreSQL 18 and dependency audit reported zero vulnerabilities. Latest Render deployment dep-dbs8ftm7bikc73epipl0 is live. Pages workflow run 43614151602 completed successfully; the full public checks were previously verified in run 43613792428. No paid infrastructure, live payments, or live AI were enabled.


## Backup runner progress — 14 November 2026

An encrypted PostgreSQL 18 backup runner and restore helper have been committed under `backup/`; the Render Blueprint is `render-backup.yaml`. The runner validates the pg_dump archive, encrypts it with AES-256-GCM/PBKDF2, uploads ciphertext to a private GitHub repository, verifies Git blob hashes, and prunes backups older than 30 days. It is not yet deployed: Render Blueprint planning returned `need_payment_info`, so no cron resource was created and no charge occurred. The private backup repository and fine-grained Contents read/write token also remain to be configured. The first successful backup and separate-database restore test are still mandatory release gates.


## Additional backend hardening — 14 November 2026

- Commit 8f39ce7 adds per-account row-lock serialization around All Access checkout reservation. Integration test commit 17efe4c exercises two concurrent checkout requests and asserts only one pending subscription order is created.
- Commit 89a8c9c bounds Mollie API calls to 15 seconds.
- Commit d8f9b6b makes account deletion fail closed unless any linked Mollie subscription is verified canceled; active/activation_pending/past_due states without a provider subscription ID block deletion for reconciliation.
- Commit 48228a9 adds integration coverage proving an active Mollie subscription is canceled before account deletion.
- PostgreSQL 18 API CI run 43616808694 passed; independent verification 43616808693 passed; Render backend smoke test 43616808724 passed. The latest production API source commit d8f9b6b is deployed live; commit 48228a9 adds test-only coverage on top.


## Android release pipeline hardening — 14 November 2026

The Play AAB workflow now performs a generated-Gradle target SDK check before signing/building. The first implementation failed to resolve the Expo-generated target SDK; the check has been replaced with a Gradle runtime inspection. Latest workflow run 43617263749 is in progress. GitHub Actions reports the Play signing secrets are present (`HAS_PLAY_SIGNING=true`), but the keystore alias/password and signed AAB are not yet verified. Do not mark Android release-ready until the workflow confirms the alias, builds the AAB, and verifies its signature.


## Billing/deletion race hardening — 14 November 2026

- Commit 247830d adds cancellation and provider verification for pending Mollie first payments before account deletion. If a payment is still being created, its provider result is uncertain, or Mollie cannot confirm cancellation, deletion fails closed.
- Commit b91f657 blocks account deletion when a first payment is already paid but recurring subscription activation has not been reconciled.
- Commit 67688fa serializes first-payment webhook activation with account deletion by locking the account row while the recurring subscription is created/verified. This prevents a delayed webhook from creating a recurring subscription after the account has been deleted.
- Commit b10245d adds integration coverage for cancellation of the pending first payment and the recurring subscription before account deletion.
- API CI run 43617761235, independent verification 43617761267, and Render PostgreSQL readiness smoke test 43617761238 all passed on commit b10245d.


## Backup runner build verification — 14 November 2026

Backup-runner CI run 43617810597 passed on commit 19aebc536b: Docker image build, PostgreSQL 18.7 client tools, timeout and script syntax checks, authenticated encryption/decryption round trip, and tamper rejection. This confirms the runner container and crypto helper, not a live database dump or restore. The first actual backup and separate-database restore remain open.


## Latest billing reconciliation verification — 14 November 2026

- Commit f2402a4 includes legacy `creation_failed` checkout rows in the fail-closed reconciliation path, preventing automatic duplicate checkout creation or account deletion while an old provider result may be uncertain.
- API CI run 43617851487 passed on f2402a4; Render PostgreSQL readiness smoke test 43617851569 and independent verification 43617851563 also passed. This backend source revision is deployed and healthy.


## Signed Android bundle completed — 14 November 2026

- Android Play build workflow 43617415554 completed successfully on commit ce75a5efaa. TypeScript, Expo config, Android target SDK 36 baseline, upload-keystore decode/alias verification, release signing, AAB build and signature verification all passed. The temporary decoded keystore was removed from the runner.
- Artifact `nexora-google-play-aab`: 38,760,620 bytes; SHA-256 `da165e09283b53e37ecb6c36d50c845157c31121f538d2fc69f47c957da02187`. It was downloaded and verified separately. The artifact's GitHub Actions retention expires 28 November 2026; the owner has a preserved AAB file.
- Android build gate is green. This does not mean the app is published or Play Console approved. Developer registration payment, Play Console upload/App Signing confirmation, listing assets and declarations, Play Billing compliance, device testing and legal/privacy review remain open.
