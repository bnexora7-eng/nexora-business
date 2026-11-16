# ALPINOSS — Company-size pricing

Status: pricing model specification; not a live checkout or public legal offer.

## Confirmed model

- One fee, charged once. No subscription, no monthly membership and no recurring fee.
- Pricing is differentiated by company size: one price for smaller companies and one price for larger companies.
- Both prices belong in one central Prices & Payments section.
- PayPal is excluded.
- Exact company-size amounts must be confirmed by the owner; do not invent or publish unconfirmed figures.

## Payment terms

Each project quotation must specify its own advance and remaining balance after completion/acceptance. No universal 50/50 split is assumed. The exact payment schedule belongs in the accepted quotation.

## Existing platform scope

- Account registration, sign-in, email verification, password reset and session controls.
- Business Studio workspace and AI business-plan endpoint (live AI currently disabled until provider key and budget are configured).
- Community posts.
- Marketplace listings.
- Payment Integrity prototype and backend payment-event screening infrastructure.
- One-time payment backend exists but is disabled by default. Subscription checkout is disabled and must remain disabled.

## Implementation requirements

1. Confirm the two one-time prices for smaller and larger companies.
2. Display both in the single Prices & Payments section.
3. Apply company-size pricing to the appropriate offer/quotation flow.
4. Keep payment and access state verified server-side.
5. Do not enable live payments until merchant onboarding, legal/tax setup, database backup/restore and end-to-end payment tests are complete.
