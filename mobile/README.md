# NEXORA Mobile

React Native + Expo + TypeScript Android-first application prototype.

## Included
- Home dashboard and custom tab navigation
- Community, Marketplace and Business Tools module entry points
- NEXORA account registration, login and logout using the backend API
- Payment Integrity local demonstration (ACCEPT / REVIEW / REJECT)
- Own-service EUR checkout interface scaffold with server-side Mollie integration
- Payment order status lookup

## Run locally
```bash
cd mobile
npm install
npx expo start
```

## Important implementation boundaries
- This is a pre-production prototype, not a production banking or payment application.
- Payment Integrity demo uses illustrative rules and does not move money.
- Mollie checkout is not operational until a merchant account is approved and a server-side API key is configured in Render.
- No real payment or payout has been tested or enabled. Live payments remain disabled by default.
- Do not store bank credentials, card data, API secrets or payout details in the mobile client.
- Production monetization requires the appropriate legal/business setup, provider onboarding/KYC, server-side price validation, webhook verification, idempotency, refunds/disputes handling, and payout configuration.
- Digital subscriptions distributed through Google Play must use applicable Google Play Billing requirements. Marketplace transactions require a separately assessed marketplace payment flow and provider approval.
- Secrets belong in server-side environment variables, never in this repository or the app bundle.

## Android package
`com.nexora.business`

## Current status
The mobile app has a working prototype structure and backend account/payment API integration code. The payment provider is not configured, so checkout cannot yet accept money. Android build and TypeScript checks are automated in GitHub Actions; a successful build is a debug APK, not a Play Store release.
