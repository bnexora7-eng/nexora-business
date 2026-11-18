# ALPINOSS — Production Readiness Master Checklist

**Last reviewed:** 15 November 2026  
**Release status:** **PRE-PRODUCTION — NOT CLEARED FOR PUBLIC PAID LAUNCH**  
**Commercial model:** free accounts and individually scoped one-time project fees. No monthly membership or recurring platform fee.

This file is the current release-gate summary. A green CI check validates only the scope of that check; it does not substitute for provider onboarding, live sandbox testing, a real database backup/restore, legal approval or physical-device acceptance.

## 1. Verified green gates

| Gate | Evidence | Current result |
|---|---|---|
| API integration tests | PostgreSQL 18 integration suite; latest passing run 43620232693 (includes OpenAPI YAML syntax check, npm ci and production dependency audit) | **PASS** |
| Independent API verification | Run 43620259241 | **PASS** |
| Render API + PostgreSQL readiness | Run 43619535564 and scheduled monitor 43619617134 | **PASS** |
| API dependency integrity | Committed `payment-integrity-api/package-lock.json`; `npm ci`; production audit | **PASS** |
| Account security | Email verification required before login; one-use verification/reset tokens; reset revokes sessions; rate limiting; password hashing | **PASS in automated tests** |
| Mollie lifecycle logic | Concurrent checkout, first-payment webhook, recurring renewals, amount mismatch, cancellation and deletion safeguards covered by mocked-provider integration tests | **PASS in mocked tests only** |
| Backup runner image and cryptography | Backup runner CI 43618325150: Docker build, PostgreSQL 18.7 tools, AES-256-GCM round-trip and tamper rejection | **PASS in CI only** |
| Public Pages smoke check | Run 43620113826 checked homepage, account, verification, recovery, deletion and privacy pages plus API readiness | **PASS** |
| Android target SDK and signing setup | Run 43619553655: Expo config, TypeScript, SDK 36 baseline and upload-key alias validation | **PASS; current signed AAB build 43619876826 completed successfully and artifact verification passed** |
| Android billing safety | External Mollie checkout button disabled in the Android client until compliant Play billing is implemented | **PASS as a safety block** |

## 2. Open production gates

### A. Database durability — critical

- Render PostgreSQL 18 database `nexora-business-db` is on the Free plan in Frankfurt and is scheduled to expire **12 December 2026 at 14:31:31 UTC**. Free has no automated backups or point-in-time recovery.
- Actual encrypted logical backups have been created successfully and uploaded to the private repository `bnexora7-eng/nexora-private-backups`. The latest verified backup is `nexora-20261118T040615Z.dump.enc`, 42,520 bytes, SHA-256 `2fe50f48da2edce91559ebee9a298b44dd35e5019b3bf70e9adee3319a2c66af`. Render backup job `583fb9f2-9fea-479b-8df5-696ad8240c2c` and GitHub Actions run `44234946355` completed successfully on 18 November 2026.
- The backup procedure uses PostgreSQL 18 custom-format `pg_dump`, validates the archive with `pg_restore --list`, encrypts with AES-256-GCM, uploads only ciphertext to the private repository, and verifies the uploaded asset by reading it back and comparing SHA-256. This verifies the dump/archive and encrypted asset, **not a full restore**.
- **Restore remains an open critical gate.** The isolated PostgreSQL 18 restore workflow is manual-only and must use backup stamp `20261118T040615Z`. An initial automated attempt (GitHub Actions run `44329422913`, 18 November 2026) safely stopped at its secret-presence check because repository Actions secrets `BACKUP_ENCRYPTION_KEY` and `BACKUP_READ_TOKEN` are missing. The disposable PostgreSQL container started and was removed; no backup was downloaded, decrypted or restored, and production was not accessed. Render's read-only preflight confirms its own backup key and GitHub token are configured, but those Render values are not automatically available to GitHub Actions. Add the exact corresponding secrets securely to the repository before dispatching the restore test; never put values in source control or chat. The workflow is intentionally manual-only until then.
- The active backup scheduler uses the existing Render API and private backup repository. The separate Blueprint `exs-dbt262mc6qcc73ah50pg` is inactive, no Cron resource was created from it, and it is not required for the active backup path. Do not add paid resources without separate approval.
- A secret-safe, authenticated, read-only runtime diagnostic was added in PR #19 and deployed to Render on 18 November 2026 (commit `a90b4dcb60d9797010a47d4a818d53b59fc07383`; deployment `dep-dburk2mi0phs73bf67r0`, status `live`). The endpoint reports backup configuration and sanitized email/AI/payment readiness. It does not start a backup or expose secret values. The authenticated read-only check completed successfully on 18 November 2026 at 14:53:38 UTC: database size 9,041,599 bytes (8.62 MiB), all three backup configuration checks true, and status `preflight_passed`. Runtime configuration reported Brevo active with API key and sender values present (test transport off); AI key absent, monthly budget not configured and AI disabled; Mollie key missing, one-off checkout disabled and live payments disabled. This confirms configuration presence/flags only, not actual email delivery or provider-side sender verification. No backup was started by this preflight.

### B. Transactional email

- The API has a Resend HTTPS integration and now prefers Resend when `RESEND_API_KEY` is present; Brevo remains a temporary fallback. Resend avoids the outbound SMTP ports blocked on Render Free.
- **No owner-controlled ALPINOSS sending domain is confirmed.** The connected project mailbox was reviewed on 18 November 2026. It contains no domain-purchase or successful registration confirmation. The prior EU.org attempts concerned `nexora.net.eu.org` (NEXORA, not ALPINOSS): the EU.org contact activation was reported as failing, no domain request was submitted, and Hostry confirmed its Free DNS service rejects names with more than two dots. A later `alpinoss.net.eu.org` DNS-hosting enquiry bounced because the recipient domain did not exist. GitHub Pages hostname `bnexora7-eng.github.io` is not an owner-controlled sending domain.
- Resend's `onboarding@resend.dev` is a test sender only; it is not suitable for arbitrary customer verification or password-reset messages. Real customer email requires registering an owner-controlled domain and verifying it in Resend.
- After domain verification, enter `RESEND_API_KEY` and `RESEND_FROM` directly in Render. Keep `RESEND_ALLOW_TEST_SENDER` false/unset for production. Do not paste secrets into chat, GitHub, email, or screenshots.
- The Resend code path and tests are present, but **end-to-end delivery to an owner-controlled inbox has not been verified**. Test registration verification, resend verification, and password reset before declaring email ready. Do not remove Brevo fallback variables until Resend delivery is confirmed.
- Live runtime diagnostic (18 November 2026, 14:53:38 UTC): Brevo is the active provider; its API key and sender value are configured; test transport is off. This confirms environment presence only, not Brevo-side sender verification or successful transactional delivery. Resend is not active. The connected Gmail inbox contains Brevo account/API-key notifications, but no confirmed ALPINOSS registration-verification or password-reset test email.

### C. One-time project payments and merchant readiness

- **Current commercial decision (15 November 2026):** ALPINOSS accounts are free. There is no monthly membership or recurring platform fee. Work is sold only as a separately scoped, one-time project with written customer approval.

Each project quotation must specify a project-specific advance before work starts and the remaining balance after completion/acceptance. No fixed 50/50 split is assumed; exact amounts and any intermediate milestones are written into the accepted quotation.
- The public price list is indicative: €149 business analysis; €295 AI assistant prototype; €495 business-specific AI prototype; system integration from €950; €950–€2,500 multi-step automation; €5,000–€15,000+ individually scoped enterprise work. No automatic checkout is offered from these prices.
- `POST /v1/subscriptions/checkout` returns HTTP 410. Generic one-off checkout `POST /v1/payments` now fails closed by default and returns `one_off_payments_disabled` unless `ENABLE_ONE_OFF_PAYMENTS=true` is explicitly enabled after all gates and owner approval. Keep it disabled.
- The current generic one-off checkout implementation is still Mollie-specific. No provider has been approved for live transactions, and no live merchant onboarding or end-to-end provider transaction has been verified. PayPal is permanently excluded.
- KVK's published criteria say registration is required when the person independently supplies (or prepares to supply) goods/services, charges a commercial price and does so regularly for others. KVK also says business activity may begin with steps such as launching a business website; assess the criteria and start date rather than assuming registration can wait until the first payment. See https://www.kvk.nl/en/starting/do-you-need-to-register-your-business-with-kvk/ and https://www.kvk.nl/en/starting/on-what-date-must-i-register-my-business-with-kvk/.
- Mollie states it serves registered businesses, not private individuals, and requires business registration details, legal representative/UBO identity, a bank account and website/business information. Do not attempt merchant onboarding as a private individual or represent a personal bank account as a business account. See https://help.mollie.com/hc/en-us/articles/25897821634322-What-does-Mollie-need-to-verify-my-account.
- Before any invoice or charge: confirm the legal operator, legal form, KVK/Tax Administration status, business bank account/provider eligibility, VAT treatment (including cross-border B2B/B2C), invoice numbering and mandatory invoice details, customer terms, scope/acceptance, delivery, refunds/cancellations and record retention. Belastingdienst invoice requirements: https://www.belastingdienst.nl/wps/wcm/connect/bldcontenten/belastingdienst/business/vat/vat_in_the_netherlands/vat_administration/invoice_requirements.
- Intended workflow: enquiry → feasibility and scope review → written one-time quote → customer acceptance → compliant invoice/payment request → provider-confirmed payment → delivery and audit record. Never treat a browser redirect as proof of payment; reconcile provider state server-side.
- Required technical gates: test-mode checkout only after provider approval and owner authorization; verify successful, failed, canceled, expired and refunded payments; duplicate/retried webhook idempotency; amount/currency/order matching; status visibility; dispute/refund procedure; account deletion/data retention; backups and restore. No live payment until all gates pass and the owner explicitly approves activation.

### D. Android / Google Play

- A signed AAB rebuild completed successfully in workflow 43619876826 on 14 November 2026. Dependency audit, TypeScript, Expo config, target SDK 36, upload-keystore verification, `bundleRelease`, and signed-AAB verification all passed. The workflow uploaded the signed AAB as a GitHub Actions artifact. It has **not** been submitted to Play Console. Any older AAB predating the Android Mollie-checkout safety block is obsolete — do not upload it. A new debug validation APK completed successfully in run 43619889691 (SHA-256 `a3af0ae5cb902d03cd6e97eb1c4429469c695025a3fbeb06bd9c3c83c538a315`); release APK signature/package verification completed in 43619871789. Signed test artifact `app-release.apk` is 56,741,823 bytes (SHA-256 `22fa7e79e3f09e6c4447548c52d26d61a6cfaafbafed621d0b633fb4ce2236fd`); it is for physical-device testing, not Play upload.
- A fresh Android validation APK build was running in workflow 43619553600; another installable APK build was triggered after the latest workflow corrections.
- Expo SDK 54+ and target SDK 36 baseline passed CI. Upload keystore alias `nexora-upload-2026` and signing configuration passed validation. The temporary decoded key is deleted by the workflow.
- Android external Mollie checkout is intentionally disabled. The current model does not sell digital subscriptions; do not add subscription billing to Android. Any future paid digital functionality requires a separate review of current Google Play policy and the appropriate approved billing route.
- Play Console developer registration fee has **not** been paid; the AAB has not been submitted to Play Console; store listing, Data Safety declarations, App Signing confirmation and physical-device acceptance tests remain open.
- The current Play build is a candidate artifact, not a published or approved app.

### E. AI provider and cost controls

- AI route is authenticated. It is unavailable for live use until a provider key and an explicitly approved budget are configured; it is not gated by a paid membership.
- No production provider key or approved monthly budget is configured. Render now explicitly sets `AI_MONTHLY_TOKEN_LIMIT=0`; `ENABLE_LIVE_PAYMENTS=false` is also explicitly set. The environment update was deployed and the Render readiness smoke test passed (run 43620259235).
- Required before enabling: add the server-side key directly to Render, set a conservative monthly token limit, configure provider-side spending alerts/limits, verify quota reservation/reconciliation and test abuse/rate-limit behavior. No paid AI usage without explicit budget approval.

### F. Legal, privacy and business identity

- Public enquiry form now validates its fields and prepares a message in the visitor's own email application; the visitor must press Send. It no longer transmits enquiry data to FormSubmit or another web-form processor. The privacy notice now describes this exact flow, alongside conditional Brevo account-email processing and website/mobile token storage.
- A scheduled production smoke monitor verifies the public privacy and account-deletion pages and API readiness. Latest monitor run 43619617134 passed.
- Internal project-services terms draft: `docs/TERMS_AND_SUBSCRIPTION_DISCLOSURES_DRAFT.md`. It is **not published and not legally approved**.
- Required before paid project work: actual operator/legal name, legal form and applicable KVK/Tax Administration registration, business address, VAT treatment for each customer market/type, verified support contact, project scope/acceptance terms, consumer withdrawal/refund disclosures where applicable, and Dutch/EU legal review.
- Do not invent company identity or publish placeholder terms. Marketplace remains listings only; no checkout or escrow is implemented. Payment Integrity is a synthetic prototype, not a regulated payment service or certified fraud engine.

### G. Hosting and operational resilience

- Render API service currently runs on the Free plan with one instance. PostgreSQL is also Free and temporary.
- No public database allowlist was opened; do not use `0.0.0.0/0` for the database.
- Production capacity, uptime guarantees, persistent backups, recovery time and support ownership are not yet established.
- Any paid upgrade beyond the previously approved backup Cron requires separate approval.

## 3. Mobile dependency security exception

Both API and mobile dependency lockfiles are now committed, and CI uses `npm ci` for reproducible installs. The mobile CI audit passes with a narrowly scoped exception for `image-size` used by Metro during local build asset inspection. The two current high-severity advisories are GHSA-5p2g-fcmc-qvqq and GHSA-w3rx-r6r6-pgpr; no patched npm release is currently published. The package is a build-tool dependency and is not shipped as app runtime code. The audit script permits only those exact advisories and package path; all other high/critical findings fail CI.

PostCSS is pinned to 8.5.33 to address the current PostCSS advisories. Full rationale and exact advisory scope: [DEPENDENCY_SECURITY_EXCEPTIONS.md](DEPENDENCY_SECURITY_EXCEPTIONS.md). Reassess this exception on every Expo/Metro upgrade and remove it once a fixed `image-size` release is available. Do not use `npm audit fix --force` or jump Expo SDK major versions without a compatibility migration and full Android rebuild.

## 4. Owner actions still required

1. Complete the isolated PostgreSQL 18 restore test for backup stamp `20261118T040615Z`; do not restore into production. Then plan database replacement before the Free database expires on 12 December 2026.
2. If migrating from the currently active Brevo provider to Resend, register an owner-controlled ALPINOSS domain, configure DNS and verify it in Resend. No domain purchase or registration is confirmed; do not invent DNS records. If staying on Brevo, verify its configured sender in Brevo and complete an end-to-end delivery test first.
3. Complete end-to-end registration verification, resend-verification and password-reset tests with an owner-controlled inbox using the currently active Brevo provider. If switching to Resend, first verify the owner-controlled domain, then enter `RESEND_API_KEY` and `RESEND_FROM` directly in Render.
4. Assess KVK entrepreneur criteria and registration timing; confirm the appropriate Dutch business form, Tax Administration status and VAT treatment before paid trading.
5. Confirm a suitable business bank account and payment-provider eligibility; choose a provider only after its onboarding requirements are met.
6. Complete one-time quote, invoice/payment, webhook, refund and dispute tests in sandbox; keep checkout disabled until explicit approval.
7. Decide separately when to pay the Google Play Console one-time developer registration fee and complete store declarations.
8. Install the latest APK on a physical device and test registration, email verification, login, session persistence, Community/Marketplace, account deletion and error handling.

## 5. Release rule

Do not enable one-time checkout or paid AI until: a real encrypted backup exists and restore has passed; email delivery works end to end; Dutch business and tax/VAT position are confirmed; a suitable business bank account and payment provider are approved; one-time payment lifecycle, webhook, refunds and disputes are tested; AI budgets are enforced; legal documents are reviewed; the database has durable production backup/retention; and physical-device acceptance tests pass. Live activation also requires explicit owner approval.
