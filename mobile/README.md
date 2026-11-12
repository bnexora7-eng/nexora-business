# NEXORA Mobile

React Native + Expo + TypeScript Android-first application prototype.

## Included
- Home dashboard and custom tab navigation
- Community, Marketplace and Business Tools module entry points
- Payment Integrity local demonstration (ACCEPT / REVIEW / REJECT)
- Free, Premium and Business plan selection preview

## Run locally
```bash
cd mobile
npm install
npx expo start
```

## Important implementation boundaries
- This is a prototype, not a production banking or payment application.
- Payment Integrity screening runs locally with illustrative rules only.
- No live payment processing, card collection, bank connection or payouts are enabled.
- Do not store bank credentials, card data, API secrets or payout details in the mobile client.
- Production monetization requires a legal operating entity, provider onboarding/KYC, server-side payment integration, webhook signature verification, idempotency, refunds/disputes handling and payout configuration.
- Digital subscriptions distributed through Google Play must use the applicable Google Play Billing requirements. Marketplace transactions require a separately assessed marketplace payment flow and provider approval.
- Secrets belong in server-side environment variables, never in this repository or the app bundle.

## Android package
`com.nexora.business`

## Current status
UI prototype scaffold only. Build, device testing, store compliance, backend integration and production payment onboarding remain outstanding.
