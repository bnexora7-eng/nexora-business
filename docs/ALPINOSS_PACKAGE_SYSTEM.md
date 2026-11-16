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

## Quotation and payment controls

- Operator-only quotation creation stores the customer, one-time EUR amount, scope description and company-size tier (`small_company` or `large_company`) in PostgreSQL.
- New quotations begin as `draft`; only an authenticated operator can approve them.
- Customers can initiate checkout only with their own approved, unexpired quotation ID.
- The payment amount, currency and description are loaded from the database, never trusted from the browser.
- A row lock and unique payment-to-quotation relation prevent duplicate checkout creation for the same quote.
- Mollie webhook reconciliation moves the quote to `paid`, or back to `approved` after a confirmed failed/canceled/expired payment.
- If provider creation has an uncertain outcome, the quote remains `payment_pending` pending reconciliation.
- Operator routes require a server-side `QUOTE_ADMIN_TOKEN` of at least 40 characters. It must never be placed in frontend code or committed.
- Checkout remains disabled unless separately approved after all release gates. Do not activate live payment environment flags during this implementation.

## Implementation requirements

1. Confirm the two one-time prices for smaller and larger companies.
2. Display both in the single Prices & Payments section.
3. Confirm the two company-size prices, then apply the approved amounts to the quotation process. Until then, amounts are entered manually by the operator and are not shown as public prices.
4. Keep payment and access state verified server-side.
5. Do not enable live payments until merchant onboarding, legal/tax setup, database backup/restore and end-to-end payment tests are complete.
