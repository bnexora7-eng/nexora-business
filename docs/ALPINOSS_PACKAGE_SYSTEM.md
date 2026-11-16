# ALPINOSS — Packages, access and payments

Status: implementation specification; not a public offer and not authorization to activate billing.

## Confirmed commercial decisions

- The public brand is **ALPINOSS**.
- A single central **Prices & Payments** area is the intended place for all platform and project prices.
- **All Access — €29.99/month** is a planned membership price. It is not active and must not be presented as purchasable until recurring billing and access lifecycle tests pass.
- Custom projects are quoted individually. The agreed default payment split is 50% before work starts and 50% after acceptance.
- Do not use PayPal.
- Do not activate live payments until business/merchant onboarding, legal/tax setup, database backup/restore, webhook/refund/dispute tests and account-access reconciliation are complete.

## Existing platform capabilities found in the repository

- Account registration, login, email verification, password reset and sessions.
- Business workspace profile.
- AI business-plan endpoint (provider key and monthly token budget are required; AI is currently disabled when the budget is zero).
- Community posts.
- Marketplace listings.
- Mollie subscription lifecycle code and database fields exist, but the public subscription checkout route currently returns HTTP 410 and billing is not enabled.

## Package-engine requirements

1. Keep account creation separate from paid membership. A free account must never be mistaken for a paid subscription.
2. Store an explicit package identifier and entitlement state for each account.
3. Derive feature access and quotas on the server; never trust a package name or quota sent by the browser.
4. Define a single server-side package catalogue consumed by both the pricing page and account API.
5. Enforce per-package access and quotas for AI requests, marketplace publishing and other metered features.
6. Handle active, pending, past-due, canceled and expired membership states. Access after cancellation must end only at the verified paid-through date.
7. Keep checkout disabled until the production-readiness gates above are met.
8. Provide account UI for current package, included features, usage, upgrade state and cancellation state.

## Decisions intentionally not invented

- No extra tier names or prices are approved in this specification.
- No feature-by-feature split between free accounts and All Access is assumed yet.
- No AI quota or marketplace listing quota is assigned until cost and product limits are approved.

## Implementation order

1. Add the package catalogue and account entitlement model.
2. Add server-side entitlement checks and usage accounting.
3. Connect account and pricing UI to the same catalogue.
4. Add purchase, renewal, cancellation and failed-payment lifecycle tests.
5. Enable live checkout only after production-readiness approval.
