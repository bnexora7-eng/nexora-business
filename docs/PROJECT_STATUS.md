# NEXORA BUSINESS — Master Project Status

**Last updated:** 14 November 2026  
**Project owner:** NEXORA BUSINESS  
**Repository:** https://github.com/bnexora7-eng/nexora-business

## Canonical project links

- Member workspace (Business Studio, Community, Marketplace): https://bnexora7-eng.github.io/nexora-business/app/
- Interactive Payment Integrity demo: https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html
- Sandbox API health: https://nexora-payment-integrity-api.onrender.com/health
- Project/company information: https://bnexora7-eng.github.io/nexora-business/company/
- Source code: https://github.com/bnexora7-eng/nexora-business
- Consolidated external-facing brief: https://github.com/bnexora7-eng/nexora-business/blob/main/docs/PROJECT_BRIEF.md

## Current status

NEXORA remains a **pre-production prototype**. The strategic model is one NEXORA All Access membership at **€29.99/month**, with NEXORA retaining ownership of the platform. The subscription checkout and recurring-billing code exists in the backend/mobile app, but it has not passed a complete Mollie test-mode lifecycle. Paid membership is not enabled and no subscription revenue is claimed. It is not a production payment or banking product.

### Verified in the project work on 12 November 2026

- The public Render demo API was exercised by automated checks for ACCEPT, REVIEW, REJECT and DUPLICATE. A real-browser Playwright check on 14 November 2026 also verified that ACCEPT, REVIEW and REJECT render correctly on the public GitHub Pages demo.
- The GitHub Pages deployment workflow passed.
- PostgreSQL-backed integration tests passed in GitHub Actions.
- The browser demo is publicly accessible at the canonical demo link above.

Relevant recorded GitHub Actions run:
https://github.com/bnexora7-eng/nexora-business/actions/runs/43143271001

## Product scope

The first workstream screens synthetic payment-event notifications through a Render-hosted sandbox API and returns deterministic ACCEPT, REVIEW or REJECT decisions, including duplicate-event detection.

The repository also contains a separate backend scaffold with webhook signature verification, timestamp-window checks, PostgreSQL schema/idempotency and audit-related code.

## Important limitations — do not overstate readiness

- No live bank or payment-provider connections. Mollie checkout code exists but is not yet configured or verified.
- No real payment processing or payouts.
- No production fraud-detection service; current decisions are deterministic rules, not a validated machine-learning model.
- The public demo API and the separate PostgreSQL backend scaffold are not yet connected as one production service. The public demo uses temporary demo storage.
- Do not submit real personal, banking or payment data to the demo.
- No production security/compliance certification, paying customers, revenue or commercial traction is claimed.
- Member-facing web workspace now exists for Business Studio, Community and Marketplace. The workspace is connected to the existing authenticated API routes; automated UI-source checks and backend CI pass. AI generation still requires a secure server-side provider key and has not been live-tested. Marketplace listings are not a checkout or escrow system.

## Member workspace — 14 November 2026

- Added `/app/` as the signed-in web workspace with Business Studio save/load, AI plan generation, Community post/read and Marketplace listing/read/publish screens.
- Added a dashboard link from the account page to the workspace.
- The workspace checks the authenticated session and server-confirmed All Access entitlement before opening its features. The backend remains authoritative for protected writes.
- Added automated checks for page JavaScript syntax, required sections/API routes, bearer-token integration, safe text rendering (no `innerHTML`) and the account-to-workspace link.
- GitHub Actions run for commit `8c84e0600275122300e78ab2188fd862983e4ed1`: API test workflow passed (15 tests, 0 failures); independent verification passed; Render readiness smoke test passed. GitHub Pages deployment was still running at the time of this status update.
- Render backend auto-deploy was updating to the latest commit. Confirm the final deployment and Pages URL before treating this interface as publicly verified.

## External outreach

On 12 November 2026, follow-up messages with the demo, source repository and project brief were sent in existing email threads to:
- Brainport for SMEs
- Brainport Development
- Techleap
- BOM
- Brabant Startup Fund
- ABN AMRO Innovation
- Buckaroo
- PAY.

This records that messages were sent; it does not imply that any organization has replied, endorsed the project, offered funding or agreed to partner.

## Google for Startups

A prior Google for Startups application/support request received an automated acknowledgement. It is not an approval or funding commitment. The project still needs to resolve the business-domain email and billing-account requirements before treating the application as complete.

## Next actions — in order

1. Complete the All Access feature inventory and verify real member entitlements against the intended €29.99/month plan. See [ALL_ACCESS_SUBSCRIPTION_PLAN.md](ALL_ACCESS_SUBSCRIPTION_PLAN.md).
2. Configure Mollie test credentials privately in Render and complete the website subscription lifecycle tests; keep live payments disabled.
3. Verify the current Google Play Billing requirements and implement the correct Android billing route for digital membership access.
4. Complete customer-facing recurring-payment terms, cancellation/refund handling, privacy/legal details, production persistence, backups and monitoring.
5. Only after the functional and billing gates pass, perform the final full visual-design and UX polish.
6. Keep this status file and PROJECT_BRIEF.md updated after every material code or deployment change; continue partner follow-up without claiming production readiness.

## Continuity rule

When resuming work, start with this file, then inspect the current main branch and latest GitHub Actions runs. Do not assume an old deployment, test result, or external application status is still current without rechecking it.


## ABN AMRO funding proposal — 12 November 2026

- Created proposal: [docs/ABN_AMRO_FUNDING_PROPOSAL.md](ABN_AMRO_FUNDING_PROPOSAL.md)
- Sent a follow-up to ABN AMRO Innovation at dareinnovation@nl.abnamro.com in the existing NEXORA email thread.
- Requested €10,000 in early-stage development support, preferably sponsorship or pilot-development contribution; also requested referral to the suitable startup/innovation funding route.
- The message explicitly states that NEXORA is a pre-production prototype, not a live payment/banking product, and that this is not a formal standard-loan application.
- **Status:** sent; no approval or reply is implied. Await ABN AMRO's response.


## Own-service payments — 12 November 2026

- Added a NEXORA mobile checkout screen for one-off EUR payments.
- Added authenticated backend payment creation, persistent order records, Mollie-hosted checkout, webhook retrieval/verification against Mollie, and payment-status lookup.
- Added Render environment variable placeholders for `MOLLIE_API_KEY`, `PUBLIC_API_URL` and `NEXORA_PAYMENT_RETURN_URL`; no secret value has been added to GitHub.
- **Current gate:** configure a Mollie test API key in Render, deploy, and run end-to-end sandbox tests. Only after successful testing and Mollie business verification can live payments and bank payouts be enabled.


## Android app release preparation — 13 November 2026

- The owner installed the latest test APK and manually confirmed that the main app navigation, module buttons and Home/back navigation work on their Android phone.
- Added a visible privacy-policy link to the account screen.
- Added in-app account deletion and a public web account-deletion form.
- Account deletion removes the app account, sessions, Community posts, Marketplace listings and Business workspace. Payment ledger entries are detached from the account and may be retained only where legally required.
- Added public privacy policy at `/privacy/` and web deletion page at `/account-deletion/`.
- Added automated PostgreSQL integration coverage for registration, login, account deletion and deletion of associated user content. The account-deletion integration suite passed in GitHub Actions on commit `9447564b8c8431df8585ce813fd7e4bd35944caa`.
- Mobile app version advanced to 0.4.0 / Android versionCode 4.
- Expo SDK 54 targets Android 16 / API 36, meeting the current Google Play target-API requirement for new submissions.
- Release checklist: [GOOGLE_PLAY_RELEASE_READINESS.md](GOOGLE_PLAY_RELEASE_READINESS.md).

**Still not a production release:** signed AAB and upload-key configuration, latest APK build after account-deletion UI changes, production API verification, full on-device registration/login/deletion test, Play Console setup and declarations, store listing graphics, and any required closed testing remain outstanding. Mollie checkout and AI planning remain unavailable until provider credentials and end-to-end tests are completed.


## Google Play release-preparation update — 13 November 2026

- PR #6 was merged into `main` as `aa164baf092fcf82a9d47fc98c81cb867feef1cf`.
- Account deletion is now part of the mobile Profile UI and backend. It removes the account, sessions, Community posts, Marketplace listings and Business workspace; payment ledger entries are detached from the deleted account.
- The public privacy policy and web account-deletion page were deployed to GitHub Pages and both were verified by the deployment workflow.
- Render deployment readiness passed: `/ready` returned `{"status":"ready","database":"connected"}`.
- PostgreSQL-backed API tests passed, including account deletion and payment-record unlinking.
- Mobile TypeScript checks passed.
- Installable NEXORA 0.4.0 / versionCode 4 APK was built successfully in GitHub Actions run `43399844079`; the artifact was downloaded and its APK file verified (56,737,535 bytes). The current main-branch APK build is also running separately.
- Expo SDK 54 targets Android 16 / API 36. Official SDK documentation confirms this target.
- Signed Play AAB workflow is prepared, but it requires the owner to generate and retain an upload keystore and add the four GitHub Actions secrets listed in the Play release checklist.
- The Play Store listing text is drafted; NEXORA-specific icon, feature graphic and screenshots are still missing.
- The privacy policy still requires the responsible operator's full legal identity and postal address before public production release.

**Remaining release gates:** physical-device registration/login/account-deletion test against the deployed backend; signed AAB; legal operator details and processor/transfer review; Play Console registration and declarations; listing graphics; and any closed-testing period required by the Play Console account type. Mollie live payments and AI planning remain disabled until configured and end-to-end tested.

## Android validation automation — 13 November 2026

- Added `.github/workflows/android-mobile-check.yml`, which validates the mobile TypeScript, checks the public Expo configuration, generates the Android project, builds a debug APK and uploads it as a short-lived artifact.
- This validation workflow is independent of the private Play upload-key secrets, so build/type errors can be found before the owner configures release signing.
- Hardened the signed Play AAB workflow by creating the keystore directory before decoding the private upload key and suppressing nonessential npm audit/fund output.
- **Verification status:** the mobile validation workflow is committed; verify its latest run before treating the current Android build/type-check path as passed.


## Project enquiry flow — 13 November 2026

- The public `order.html` page collects a non-binding project enquiry; it does not create an order, invoice or payment.
- The original Gmail-compose handoff was removed. The form now submits by AJAX to FormSubmit and is designed to keep the visitor on the NEXORA page.
- The landing page and privacy link were corrected to describe the new form flow.
- FormSubmit's official documentation says the first submission triggers an activation email to the configured recipient. Until the mailbox owner activates the form and an end-to-end test confirms receipt, delivery is **not verified**.
- No customer payment or private IBAN has been enabled. Mollie checkout remains a separate unconfigured integration.
- **Release gate:** activate FormSubmit from the email sent to `bnexora7@gmail.com`, then submit a controlled test from a separate device and confirm receipt in the NEXORA mailbox. Do not claim that enquiry delivery is live before that test passes.


## Public enquiry form correction — 13 November 2026

- Replaced the Gmail-compose redirect on `order.html` with an AJAX submission to FormSubmit, so visitors remain on the NEXORA page and receive a success or error message.
- Added FormSubmit to the privacy notice as the third-party processor for project enquiries; its documentation states submissions are retained for 30 days.
- Updated the GitHub Pages deployment check to verify the new “Send project enquiry” button.
- **Activation and delivery are not yet verified.** FormSubmit requires the NEXORA mailbox owner to confirm the first activation email before the endpoint can deliver live enquiries. The next step is to deploy, submit one controlled test, confirm activation in `bnexora7@gmail.com`, then repeat the test and verify receipt.
- Do not claim that customer enquiries are working until the activation and end-to-end delivery test pass.


## Browser account access — 13 November 2026

- Added a responsive public account page at `/account/` with create-account and sign-in modes connected to the deployed NEXORA API.
- The main landing page now links directly to account registration; the page links signed-in users to the Payment Integrity demo.
- Browser bearer tokens are held in sessionStorage for the current browser session; the privacy policy now discloses this.
- The deployment workflow now checks that the account page is publicly served and contains the registration endpoint.
- **Verification gate:** wait for the latest GitHub Pages workflow to pass, then test registration and sign-in from a separate physical device/browser. The API's existing automated registration/login tests are not a substitute for that device test.
- The browser account flow includes email-verification, resend-verification, forgot-password and reset-password pages/endpoints. Backend integration tests cover the underlying account flows, but email delivery depends on private SMTP configuration and the complete user journey has not yet been verified on a separate physical device/browser. The Android app offers registration and resend-verification, but a native password-reset entry point and end-to-end device test remain to be verified.
- Paid subscriptions are not enabled. No private ABN AMRO account details are published; bank-transfer collection and manual order activation still need a secure, tested order workflow.


## Public demo verification — 14 November 2026

- GitHub Actions run: https://github.com/bnexora7-eng/nexora-business/actions/runs/43595761873
- Workflow conclusion: **success**.
- Public GitHub Pages deployment and API health/decision checks passed.
- Playwright browser verification passed for visible ACCEPT, REVIEW and REJECT decisions.
- Backend duplicate-event verification passed in the live server test suite.
- This confirms the demonstration workflow only. It does not establish production readiness, live payment processing, bank connectivity, or independent security certification.
- README.md and PROJECT_BRIEF.md were refreshed to use the current public demo and API endpoints.



## All Access subscription decision and current audit — 14 November 2026

- Product decision confirmed: retain NEXORA as our own evolving platform; do not sell the whole project for a one-off €950 fee and do not introduce multiple membership tiers at this stage.
- One intended public membership: **NEXORA All Access — €29.99 per month**. The price is a plan, not a claim that checkout is live.
- Added [ALL_ACCESS_SUBSCRIPTION_PLAN.md](ALL_ACCESS_SUBSCRIPTION_PLAN.md) as the subscription and release-gates source of truth.
- Updated README, Project Brief, funding / startup drafts, campaign notes and Payment Integrity demo documentation to use the current canonical GitHub Pages demo URL and more consistent status language.
- Latest documentation deployment and regression workflow: [run 43596568731](https://github.com/bnexora7-eng/nexora-business/actions/runs/43596568731) — **completed successfully**. It passed PostgreSQL integration tests, GitHub Pages deployment, public privacy/account-deletion checks, Render API health/demo checks and browser-visible ACCEPT / REVIEW / REJECT checks.
- Code audit confirmed that the shared `requireUser` guard already enforces active All Access entitlement for Community publishing, Marketplace publishing, Business workspace operations and AI planning. Public Community / Marketplace reads remain previews. Expand regression coverage across every paid route before launch; see [ALL_ACCESS_SUBSCRIPTION_PLAN.md](ALL_ACCESS_SUBSCRIPTION_PLAN.md).
- Mollie recurring checkout still needs private test credentials, a deployed test configuration and end-to-end verification of first payment, recurring subscription activation, renewal, duplicate webhooks, failed payment, cancellation and account deletion.
- Android digital membership billing needs a separate Google Play policy and implementation check; website Mollie checkout must not be assumed to satisfy Play Billing requirements.
- Visual design remains deliberately deferred until functional, access-control, billing, security and release checks are complete.
