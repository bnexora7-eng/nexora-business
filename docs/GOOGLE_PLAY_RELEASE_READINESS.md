# NEXORA — Google Play release readiness

**Updated:** 13 November 2026  
**Android package:** `com.nexora.business`  
**Current app version:** 0.4.0 (versionCode 4)

This checklist distinguishes work completed in the repository from actions that still require the Play Console owner, production credentials or external verification. A successful APK build is not a Google Play release approval.

## Implemented in the current release candidate

- Android app navigation and the Community, Marketplace, Business Tools, Payment Integrity and Profile screens.
- Backend account registration, login, session restoration and logout.
- Passwords stored as salted scrypt hashes; session tokens stored as SHA-256 hashes.
- Account deletion from inside the app.
- Public account-deletion web page: `https://bnexora7-eng.github.io/nexora-business/account-deletion/`.
- Privacy policy: `https://bnexora7-eng.github.io/nexora-business/privacy/`.
- Account deletion removes the account, sessions, Community posts, Marketplace listings and Business workspace. Payment ledger entries, if any, are detached from the account and may be retained only where legally required.
- CI builds an installable Android test APK and runs TypeScript checks.
- Backend integration tests cover account registration, login, logout, authenticated deletion, web deletion and core payment-integrity behaviour.

## Mandatory technical release gates

- [ ] Build a **signed Android App Bundle (.aab)** for Play Console. A manual workflow is prepared at `.github/workflows/android-play-aab.yml`; the current CI artifact is an installable APK, not the Play upload bundle.
- [ ] Generate and securely retain the Android upload keystore, then add GitHub repository Actions secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`. The signed-AAB workflow uses these secrets and deletes its temporary keystore after the build. Never commit the keystore or passwords to Git. Follow [ANDROID_UPLOAD_KEYSTORE.md](ANDROID_UPLOAD_KEYSTORE.md) for the owner-only setup steps.
- [ ] Verify the final generated manifest targets **Android 16 / API level 36 or higher**, required for new app submissions from 31 August 2026.
- [ ] Verify the production API and PostgreSQL readiness, HTTPS, CORS, database backups, monitoring and recovery.
- [ ] Complete live device tests for registration, login, session restoration, logout, account deletion, Community publish/read, Marketplace publish/read and Business workspace save/load.
- [ ] Confirm that disabled features (Mollie checkout and AI planning) are either properly configured and tested or clearly marked unavailable in the submitted build.
- [ ] Complete an independent security and privacy review before using real personal, payment or business data.

## Play Console declarations and listing

Store listing copy is drafted in [GOOGLE_PLAY_STORE_LISTING_DRAFT.md](GOOGLE_PLAY_STORE_LISTING_DRAFT.md); it must be checked against the exact submitted build before use.

- [ ] Complete the Play Console app record and developer registration, including the one-time developer registration payment.
- [ ] Upload the signed AAB and verify Play App Signing configuration.
- [ ] Provide the store listing: app name, short/full descriptions, support contact, app icon (512×512), feature graphic (1024×500) and phone screenshots. NEXORA-specific Play listing graphics are not yet present in the repository.
- [ ] Publish the privacy policy URL above and account-deletion URL above; confirm both are publicly reachable after GitHub Pages deployment.
- [ ] Before public release, replace the privacy-policy project-operator notice with the responsible legal person's/entity's full legal name and postal address; confirm processor agreements and any international-transfer safeguards for Render, Mollie and the AI provider.
- [ ] Complete the Data safety form based on the actual production SDKs, server configuration and data flows; do not copy a generic declaration.
- [ ] Complete content rating, target audience, ads declaration, app access instructions and any financial-features declarations accurately.
- [ ] Review all Google Play Developer Program policies, including User Data, account deletion, payments, impersonation and financial-services requirements where applicable.
- [ ] If the Play Console account is a personal account created after 13 November 2023, complete the required closed test with at least 12 opted-in testers continuously for 14 days before applying for production access.

## Verified deployment status — 13 November 2026

- Render `/ready` returned `status=ready` and `database=connected` after merge.
- GitHub Pages deployment succeeded; the workflow verified the privacy policy and account-deletion pages are publicly served.
- PostgreSQL-backed API tests and mobile TypeScript checks passed on the merged release-preparation commit.
- Installable test APK 0.4.0 was built successfully; physical-device account registration, login and deletion still need a final test.

## Current product boundaries

NEXORA is still a pre-production prototype. Payment Integrity is a deterministic demonstration, not certified fraud detection. Mollie payments are not live until merchant onboarding, server credentials and end-to-end tests are complete. AI planning depends on a server-side provider key and successful provider tests. No bank integration, payout service, production marketplace checkout, paid membership or financial return should be advertised as available unless separately implemented and verified.

## Release decision

**Not yet ready for public production submission.** The repository now includes account-deletion and privacy-policy implementation, but the signed AAB, API 36 verification, production-service checks, store assets/declarations and required Play testing remain release gates.
