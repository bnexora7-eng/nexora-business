# NEXORA BUSINESS — Master Project Status

**Last updated:** 13 November 2026  
**Project owner:** NEXORA BUSINESS  
**Repository:** https://github.com/bnexora7-eng/nexora-business

## Canonical project links

- Interactive Payment Integrity demo: https://splendid-lokum-02523e.netlify.app/
- Project/company information: https://bnexora7-eng.github.io/nexora-business/company/
- Source code: https://github.com/bnexora7-eng/nexora-business
- Consolidated external-facing brief: https://github.com/bnexora7-eng/nexora-business/blob/main/docs/PROJECT_BRIEF.md

## Current status

NEXORA remains a **pre-production prototype**. On 12 November 2026, an own-service Mollie checkout scaffold was added to the mobile app and backend. It is not yet configured with a Mollie API key, deployed, tested against Mollie, or capable of accepting real payments. It is not a production payment or banking product.

### Verified in the project work on 12 November 2026

- The public Netlify demo endpoint was exercised by automated checks for ACCEPT, REVIEW, REJECT and DUPLICATE.
- The GitHub Pages deployment workflow passed.
- PostgreSQL-backed integration tests passed in GitHub Actions.
- The browser demo is publicly accessible at the canonical demo link above.

Relevant recorded GitHub Actions run:
https://github.com/bnexora7-eng/nexora-business/actions/runs/43143271001

## Product scope

The first workstream screens synthetic payment-event notifications and returns deterministic ACCEPT, REVIEW or REJECT decisions, including duplicate-event detection.

The repository also contains a separate backend scaffold with webhook signature verification, timestamp-window checks, PostgreSQL schema/idempotency and audit-related code.

## Important limitations — do not overstate readiness

- No live bank or payment-provider connections. Mollie checkout code exists but is not yet configured or verified.
- No real payment processing or payouts.
- No production fraud-detection service; current decisions are deterministic rules, not a validated machine-learning model.
- The public demo endpoint and the separate PostgreSQL backend scaffold are not yet connected as one production service.
- Do not submit real personal, banking or payment data to the demo.
- No production security/compliance certification, paying customers, revenue or commercial traction is claimed.
- Wider NEXORA marketplace/community/AI concepts remain concept prototypes unless separately implemented and verified.

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

1. Keep this status file and PROJECT_BRIEF.md updated after every material code or deployment change.
2. Confirm the live demo and latest deployment workflow after any new release.
3. Secure a suitable business domain and domain-based email if pursuing the Google for Startups route.
4. Continue partner follow-up and request technical feedback/design-partner discussions.
5. Before any real-data pilot, connect and deploy the backend properly, implement provider-specific integrations, and complete independent security, privacy and legal/compliance review.

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
- **Verification status:** workflow files committed; the new GitHub Actions run must complete successfully before treating this validation path as passed.


## Project enquiry flow — 13 November 2026

- Added `order.html`, a structured project-enquiry page with contact details, project type, optional budget/timeline and requirements.
- Updated the public landing page to link to the new enquiry page instead of relying on the previous Netlify Forms form.
- The enquiry form prepares a Gmail draft to the published NEXORA contact address. The visitor must review and send the email; the static GitHub Pages site does not store submissions or create server-side orders.
- The form explicitly describes itself as a non-binding enquiry. It does not request or publish bank details, take deposits, issue invoices, or claim to confirm payment.
- No customer payment or private IBAN has been enabled. The existing Mollie checkout remains a separate unconfigured integration and is not presented as available.
- **Verification still required:** wait for the GitHub Pages workflow to complete, then test the landing-page link and Gmail-draft handoff on a real phone. Do not claim that enquiries are automatically stored or that payments are live.


## Public enquiry form correction — 13 November 2026

- Replaced the Gmail-compose redirect on `order.html` with an AJAX submission to FormSubmit, so visitors remain on the NEXORA page and receive a success or error message.
- Added FormSubmit to the privacy notice as the third-party processor for project enquiries; its documentation states submissions are retained for 30 days.
- Updated the GitHub Pages deployment check to verify the new “Send project enquiry” button.
- **Activation and delivery are not yet verified.** FormSubmit requires the NEXORA mailbox owner to confirm the first activation email before the endpoint can deliver live enquiries. The next step is to deploy, submit one controlled test, confirm activation in `bnexora7@gmail.com`, then repeat the test and verify receipt.
- Do not claim that customer enquiries are working until the activation and end-to-end delivery test pass.
