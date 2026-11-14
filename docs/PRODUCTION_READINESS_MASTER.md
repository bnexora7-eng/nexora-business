# NEXORA — Production Readiness Master Checklist

**Last reviewed:** 14 November 2026  
**Release status:** **PRE-PRODUCTION — NOT CLEARED FOR PUBLIC PAID LAUNCH**  
**Commercial model:** NEXORA All Access — €29.99/month. NEXORA remains owner-operated and independent.

This file is the current release-gate summary. A green CI check validates only the scope of that check; it does not substitute for provider onboarding, live sandbox testing, a real database backup/restore, legal approval or physical-device acceptance.

## 1. Verified green gates

| Gate | Evidence | Current result |
|---|---|---|
| API integration tests | PostgreSQL 18 integration suite; latest passing run 43619535572 | **PASS** |
| Independent API verification | Run 43619535682 | **PASS** |
| Render API + PostgreSQL readiness | Run 43619535564 and scheduled monitor 43619617134 | **PASS** |
| API dependency integrity | Committed `payment-integrity-api/package-lock.json`; `npm ci`; production audit | **PASS** |
| Account security | Email verification required before login; one-use verification/reset tokens; reset revokes sessions; rate limiting; password hashing | **PASS in automated tests** |
| Mollie lifecycle logic | Concurrent checkout, first-payment webhook, recurring renewals, amount mismatch, cancellation and deletion safeguards covered by mocked-provider integration tests | **PASS in mocked tests only** |
| Backup runner image and cryptography | Backup runner CI 43618325150: Docker build, PostgreSQL 18.7 tools, AES-256-GCM round-trip and tamper rejection | **PASS in CI only** |
| Public Pages smoke check | Run 43619617134 checked homepage, account, verification, recovery, deletion and privacy pages plus API readiness | **PASS** |
| Android target SDK and signing setup | Run 43619553655: Expo config, TypeScript, SDK 36 baseline and upload-key alias validation | **PASS; signed AAB build still in progress at last check** |
| Android billing safety | External Mollie checkout button disabled in the Android client until compliant Play billing is implemented | **PASS as a safety block** |

## 2. Open production gates

### A. Database durability — critical

- Render PostgreSQL 18 database `nexora-business-db` is on the Free plan in Frankfurt.
- Current expiry: **12 December 2026**. Free plan has no automated backups or point-in-time recovery.
- No actual database export or restore test has been completed.
- Encrypted backup Cron Blueprint and runner code are prepared. Container and encryption checks passed, but Render has not created the Cron service.
- The Cron requires a private GitHub repository `bnexora-private-backups`, a fine-grained token scoped only to that repository, and a Render payment method. The user authorized a maximum of approximately **$1/month** for this backup service only.
- After setup: plan and review the single Cron resource, deploy it, create the first encrypted backup, verify the private release assets and hashes, then restore into a separate PostgreSQL 18 recovery database. Do not overwrite production. Any additional paid recovery resource requires separate approval.

### B. Transactional email

- Brevo HTTPS delivery is implemented; unit tests cover sender, recipient, message payload and provider failure handling.
- Actual delivery is **not verified** because `BREVO_API_KEY` and a verified `BREVO_FROM` sender have not been configured.
- Render Free blocks outbound SMTP ports 25, 465 and 587; use Brevo HTTPS rather than relying on SMTP.
- Required: create a Brevo API key, verify the sender/domain, enter secrets directly into Render, then test registration, resend verification, password reset and delivery to real inboxes. Never send API keys in chat.

### C. Mollie merchant and recurring billing

- Subscription lifecycle and webhook reconciliation are covered by a Mollie-compatible mocked server, not the real Mollie sandbox.
- No live merchant onboarding, API credentials or end-to-end provider transaction has been verified.
- Required: complete merchant onboarding and legal/business checks, configure test credentials in Render, verify first payment, recurring renewal, failed renewal, cancellation, refunds/disputes and account deletion. Keep `ENABLE_LIVE_PAYMENTS` disabled until all gates pass.
- Browser redirects alone never grant subscription access; the API must reconcile provider state.
- PayPal is permanently excluded from this project.

### D. Android / Google Play

- A signed AAB was previously built and signature-verified (workflow 43617415554, commit ce75a5efaa). A newer signed AAB rebuild with the Android Mollie-checkout block and current dependency audit was running in workflow 43619553655 at last review.
- A fresh Android validation APK build was running in workflow 43619553600; another installable APK build was triggered after the latest workflow corrections.
- Expo SDK 54+ and target SDK 36 baseline passed CI. Upload keystore alias `nexora-upload-2026` and signing configuration passed validation. The temporary decoded key is deleted by the workflow.
- Android external Mollie checkout is intentionally disabled. Before enabling digital subscriptions, either implement Google Play Billing with server-side purchase verification or complete Google's EEA alternative-billing enrollment and all applicable APIs, reporting, user disclosure, customer-support and dispute requirements. EEA alternative billing requires a registered business.
- Play Console developer registration fee has **not** been paid; the AAB has not been submitted to Play Console; store listing, Data Safety declarations, App Signing confirmation and physical-device acceptance tests remain open.
- The current Play build is a candidate artifact, not a published or approved app.

### E. AI provider and cost controls

- AI route is authenticated and All Access-gated.
- No production provider key or approved monthly budget is configured. AI remains disabled by default (`AI_MONTHLY_TOKEN_LIMIT=0`).
- Required before enabling: add the server-side key directly to Render, set a conservative monthly token limit, configure provider-side spending alerts/limits, verify quota reservation/reconciliation and test abuse/rate-limit behavior. No paid AI usage without explicit budget approval.

### F. Legal, privacy and business identity

- Public privacy page was corrected: it no longer describes a FormSubmit web form that the site does not use; it now describes the email link, Brevo conditional processing and website/mobile token storage.
- A scheduled production smoke monitor verifies the public privacy and account-deletion pages and API readiness. Latest monitor run 43619617134 passed.
- Internal terms and subscription disclosures draft: `docs/TERMS_AND_SUBSCRIPTION_DISCLOSURES_DRAFT.md`. It is **not published and not legally approved**.
- Required before paid launch: actual operator/legal name, legal form, KVK number, registered address, VAT treatment of €29.99, verified support contact, final feature availability matrix, consumer withdrawal/refund/cancellation disclosures and Dutch/EU legal review.
- Do not invent company identity or publish placeholder terms. Marketplace remains listings only; no checkout or escrow is implemented. Payment Integrity is a synthetic prototype, not a regulated payment service or certified fraud engine.

### G. Hosting and operational resilience

- Render API service currently runs on the Free plan with one instance. PostgreSQL is also Free and temporary.
- No public database allowlist was opened; do not use `0.0.0.0/0` for the database.
- Production capacity, uptime guarantees, persistent backups, recovery time and support ownership are not yet established.
- Any paid upgrade beyond the previously approved backup Cron requires separate approval.

## 3. Mobile dependency security exception

The mobile CI audit passes with a narrowly scoped exception for `image-size` used by Metro during local build asset inspection. The two current high-severity advisories are GHSA-5p2g-fcmc-qvqq and GHSA-w3rx-r6r6-pgpr; no patched npm release is currently published. The package is a build-tool dependency and is not shipped as app runtime code. The audit script permits only those exact advisories and package path; all other high/critical findings fail CI.

PostCSS is pinned to 8.5.33 to address the current PostCSS advisories. Reassess this exception on every Expo/Metro upgrade and remove it once a fixed `image-size` release is available. Do not use `npm audit fix --force` or jump Expo SDK major versions without a compatibility migration and full Android rebuild.

## 4. Owner actions still required

1. Create the private `bnexora-private-backups` repository and its narrowly scoped GitHub token; add a payment method in Render for the approved backup Cron only.
2. Create the Brevo API key and verify the sender/domain; enter secrets directly in Render.
3. Complete the required Dutch business registration and legal identity/VAT details before merchant onboarding and publication.
4. Complete Mollie test-mode and merchant verification, then select the Android billing route.
5. Decide when to pay the Google Play Console one-time developer registration fee and complete store declarations.
6. Install the latest APK on the Samsung phone and test registration, email verification, login, session persistence, Community/Marketplace, account deletion, subscription status and error handling.

## 5. Release rule

Do not enable live payments, paid AI, or public paid subscriptions until: a real encrypted backup exists and restore has passed; email delivery works end to end; Mollie test lifecycle and merchant onboarding are complete; AI budgets are enforced; Android billing is policy-compliant; legal documents are approved; the database has durable production backup/retention; and physical-device acceptance tests pass.
