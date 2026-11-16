# ALPINOSS — Company pricing and single-fee access

Status: corrected pricing model specification. This document is not a live checkout or a public legal offer.

## Confirmed pricing model

- **No €29.99/month plan. No subscription. No recurring membership fee.**
- ALPINOSS uses **one fee**, charged once.
- The one-time fee is differentiated by the customer's company size:
  - **Small companies:** one fixed one-time price.
  - **Larger companies:** one fixed one-time price.
- All prices and payment information belong together in one **Prices & Payments** section/menu.
- The fee is paid in two parts: **50% before work/access begins and 50% after delivery and acceptance**.
- Do not use PayPal.

## Price amounts

The exact euro amounts for the small-company and larger-company fee have not been verified in the available agreed project notes. Do not invent amounts, publish placeholders as prices, or activate checkout until the owner supplies/confirms those two figures.

## Platform and implementation rules

- Do not create monthly subscriptions, recurring billing, an All Access membership, or a €29.99 plan.
- Do not create multiple feature tiers such as Basic/Pro/Business unless separately approved.
- The pricing page must show the two company-size prices in the same Prices & Payments section and explain the 50%/50% payment schedule.
- Account creation remains separate from payment. Do not label an unpaid account as paid.
- Any paid-access or project-start state must be verified server-side; never trust a price or payment status supplied by the browser.
- Keep live checkout disabled until merchant onboarding, legal/tax setup, database backup/restore, webhook/refund/dispute tests and end-to-end payment verification are complete.

## Existing platform capabilities found in the repository

- Account registration, login, email verification, password reset and sessions.
- Business workspace profile.
- AI business-plan endpoint; provider key and a monthly token budget are required, and AI is currently disabled when the budget is zero.
- Community posts.
- Marketplace listings.
- Subscription-related legacy code exists in the backend, but it must not be used to introduce recurring membership billing.

## Implementation order

1. Confirm the two one-time euro prices: small companies and larger companies.
2. Implement the single-fee model and the two company-size price categories.
3. Display both prices and the 50%/50% payment schedule in one Prices & Payments menu section.
4. Connect payment verification and access/project status to the backend.
5. Enable live payments only after all production-readiness checks pass.
