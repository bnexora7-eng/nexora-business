# ALPINOSS — Google Play release readiness

**Updated:** 14 November 2026  
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
- Android CI validates TypeScript and Expo config, checks the SDK 54+ target SDK baseline, verifies the upload keystore, and builds a signed Play AAB when signing secrets are present. The signed AAB build is currently running in workflow 43617415554.
- Backend integration tests cover account registration, login, logout, authenticated deletion, web deletion and core payment-integrity behaviour.

## Mandatory technical release gates

- [x] Build and verify the **signed Android App Bundle (.aab)**. Workflow 43617415554 completed successfully: Expo config, TypeScript, API 36 target-SDK validation, upload keystore/alias verification, signed `bundleRelease`, signature verification and artifact upload all passed. Artifact: `nexora-google-play-aab` (39,110,665 bytes; GitHub artifact ZIP 39,110,665 bytes; GitHub artifact ZIP 38,760,620 bytes; SHA-256 `da165e09283b53e37ecb6c36d50c845157c31121f538d2fc69f47c957da02187`), built from commit `ce75a5efaa`. The artifact expires from GitHub Actions on 28 November 2026; the verified AAB has also been preserved separately for the owner.
- [x] Configure and verify the Android upload keystore. GitHub Actions confirms the required signing secrets are present, and workflow 43617415554 successfully decoded the key and verified alias `nexora-upload-2026`. The workflow expects `ANDROID_KEYSTORE_BASE64`, `NEXORA_UPLOAD_STORE_PASSWORD` and optionally `NEXORA_UPLOAD_KEY_PASSWORD`; if the key-password secret is omitted, the workflow uses the store password. The temporary decoded keystore is deleted after the build. Never commit the keystore or passwords to Git. See [ANDROID_UPLOAD_KEYSTORE.md](ANDROID_UPLOAD_KEYSTORE.md).
- [x] Verify the generated app's Expo SDK target-SDK baseline: Expo SDK 54+ defaults to **Android 16 / API level 36**; workflow 43617415554 passed the check and detected no lower override.
- [ ] Verify the production API and PostgreSQL readiness, HTTPS, CORS, database backups, monitoring and recovery.
- [ ] Complete live device tests for registration, login, session restoration, logout, account deletion, Community publish/read, Marketplace publish/read and Business workspace save/load.
- [ ] Confirm that disabled features (Mollie checkout and AI planning) are either properly configured and tested or clearly marked unavailable in the submitted build.
- [ ] Complete an independent security and privacy review before using real personal, payment or business data.

## Play Console declarations and listing

Store listing copy is drafted in [GOOGLE_PLAY_STORE_LISTING_DRAFT.md](GOOGLE_PLAY_STORE_LISTING_DRAFT.md); a cautious [Data safety form draft](GOOGLE_PLAY_DATA_SAFETY_DRAFT.md) is also prepared. Both must be checked against the exact submitted build before use.

- [ ] Complete the Play Console app record and developer registration, including the one-time developer registration payment. The signed AAB is ready as a build artifact, but it has not been uploaded to Play Console.
- [ ] Upload the signed AAB and verify Play App Signing configuration.
- [ ] Provide the store listing: app name, short/full descriptions, support contact, app icon (512×512), feature graphic (1024×500) and phone screenshots. ALPINOSS-specific Play listing graphics are not yet present in the repository.
- [ ] Publish the privacy policy URL above and account-deletion URL above; confirm both are publicly reachable after GitHub Pages deployment.
- [ ] Before public release, replace the privacy-policy project-operator notice with the responsible legal person's/entity's full legal name and postal address; confirm processor agreements and any international-transfer safeguards for Render, Mollie and the AI provider.
- [ ] Complete the Data safety form based on the actual production SDKs, server configuration and data flows; do not copy a generic declaration.
- [ ] Complete content rating, target audience, ads declaration, app access instructions and any financial-features declarations accurately.
- [ ] Verify that the Android build contains no obsolete subscription or recurring-payment purchase flow. ALPINOSS accounts are free; commercial work is quoted and paid per accepted project. Any future sale of digital goods or in-app functionality requires a separate review of the current Google Play payments policy before implementation. 
- [ ] Review all Google Play Developer Program policies, including User Data, account deletion, payments, impersonation and financial-services requirements where applicable.
- [ ] If the Play Console account is a personal account created after 13 November 2023, complete the required closed test with at least 12 opted-in testers continuously for 14 days before applying for production access.

## Verified deployment status — 14 November 2026

- Render `/ready` returned `status=ready` and `database=connected` after merge. The currently attached PostgreSQL instance is on the temporary Free plan and is scheduled to expire on 12 December 2026; secure a durable database and backup/recovery path before that date.
- GitHub Pages deployment succeeded; the workflow verified the privacy policy and account-deletion pages are publicly served.
- PostgreSQL 18 API integration tests, dependency audit, independent verification and Render readiness checks passed after the latest billing/deletion safeguards.
- Android workflow 43619889691 completed successfully: dependency audit, TypeScript, Expo configuration, Android prebuild and debug APK build passed. Validation artifact `nexora-android-validation-apk` is available for device testing (APK SHA-256 `a3af0ae5cb902d03cd6e97eb1c4429469c695025a3fbeb06bd9c3c83c538a315`). Release APK build and signature/package verification completed in workflow 43619871789. Artifact `app-release.apk`: 56,741,823 bytes; SHA-256 `22fa7e79e3f09e6c4447548c52d26d61a6cfaafbafed621d0b633fb4ce2236fd`. It is a signed installable test build for device acceptance, not the Play upload bundle. Signed Play AAB build and signature verification passed in workflow 43619876826. The current AAB has not been uploaded to Play Console. Physical-device account registration, login, session restoration, Business Studio AI provider-unavailable handling and deletion still need final testing.

## Current product boundaries

ALPINOSS is still a pre-production prototype. Payment Integrity is a deterministic demonstration, not certified fraud detection. Mollie payments are not live until merchant onboarding, server credentials and end-to-end tests are complete. AI planning depends on a server-side provider key and successful provider tests. No bank integration, payout service, production marketplace checkout, paid membership or financial return should be advertised as available unless separately implemented and verified.

## Release decision

**Not yet ready for public production submission.** The signed AAB and API 36 build checks are green. Remaining gates include the Play Console developer registration, actual Play Console upload and App Signing confirmation, store assets/declarations, Play Billing route, physical-device tests, production service/backup verification, and legal/privacy review.
